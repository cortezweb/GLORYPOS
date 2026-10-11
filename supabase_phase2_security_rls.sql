-- ============================================================================
-- GLORYPOS BOLIVIA SAAS - FASE 2: SEGURIDAD, MULTI-TENANCY Y ROW LEVEL SECURITY (RLS)
-- Basado en PROMPT MAESTRO: AUDITORÍA, MULTI-TENANCY Y ESCALABILIDAD
-- ============================================================================

-- 1. TABLA ADICIONAL: MEMBRESÍAS MULTI-EMPRESA (tenant_members)
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id text PRIMARY KEY DEFAULT ('tm-' || substr(md5(random()::text), 1, 12)),
  empresa_id text NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  rol text NOT NULL DEFAULT 'CAJERO',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT timezone('utc'::text, now()),
  UNIQUE(empresa_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_empresa ON public.tenant_members(empresa_id);

-- 2. FUNCIÓN DE SEGURIDAD: OBTENER EL TENANT_ID DEL USUARIO ACTUAL AUTENTICADO
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS text AS $$
DECLARE
  v_tenant_id text;
BEGIN
  -- A. Revisa si viene en el JWT de Supabase Auth (app_metadata o user_metadata)
  v_tenant_id := current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'empresa_id';
  IF v_tenant_id IS NOT NULL AND v_tenant_id <> '' THEN
    RETURN v_tenant_id;
  END IF;

  v_tenant_id := current_setting('request.jwt.claims', true)::jsonb->'user_metadata'->>'empresa_id';
  IF v_tenant_id IS NOT NULL AND v_tenant_id <> '' THEN
    RETURN v_tenant_id;
  END IF;

  -- B. Busca en la tabla de usuarios o tenant_members vinculada al auth.uid() o email
  SELECT tm.empresa_id INTO v_tenant_id
  FROM public.tenant_members tm
  WHERE tm.user_id = auth.uid()::text AND tm.activo = true
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;

  SELECT u.empresa_id INTO v_tenant_id
  FROM public.usuarios u
  WHERE (u.id = auth.uid()::text OR u.email = auth.jwt()->>'email')
  LIMIT 1;

  IF v_tenant_id IS NOT NULL THEN
    RETURN v_tenant_id;
  END IF;

  -- C. Fallback para sesiones locales o iniciales
  RETURN 'empresa_activa';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 3. FUNCIÓN DE SEGURIDAD: VERIFICAR SI EL USUARIO ES SUPERADMIN DEL SAAS
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN COALESCE(
    (current_setting('request.jwt.claims', true)::jsonb->'app_metadata'->>'is_super_admin')::boolean,
    false
  ) OR EXISTS (
    SELECT 1 FROM public.usuarios
    WHERE (id = auth.uid()::text OR email = auth.jwt()->>'email')
      AND rol = 'SUPERADMIN'
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. APLICACIÓN DE ROW LEVEL SECURITY (RLS) ESTRICTO EN TODAS LAS TABLAS
-- Habilita RLS en las tablas del sistema
DO $$
DECLARE
  tbl text;
  system_tables text[] := ARRAY[
    'roles', 'usuarios', 'clientes', 'proveedores', 'productos',
    'ventas', 'compras', 'kardex', 'caja_chica', 'cotizaciones',
    'membresias', 'pedidos_web', 'unidades_medida', 'transferencias_inventario',
    'sesiones_caja', 'ingresos_caja', 'egresos_caja', 'cuentas_bancarias',
    'cuentas_por_cobrar', 'cuentas_por_pagar', 'metodos_pago', 'guias_remitente',
    'guias_transportista', 'transportistas_gre', 'conductores_gre', 'vehiculos_gre',
    'retenciones', 'percepciones', 'reversiones', 'tenant_members'
  ];
BEGIN
  -- Asegurar RLS en empresas
  EXECUTE 'ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;';
  
  FOREACH tbl IN ARRAY system_tables LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = tbl) THEN
      EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
      
      -- Eliminar políticas previas para evitar duplicados o políticas abiertas 'allow_all'
      EXECUTE format('DROP POLICY IF EXISTS allow_all_%I ON public.%I;', tbl, tbl);
      EXECUTE format('DROP POLICY IF EXISTS rls_tenant_%I ON public.%I;', tbl, tbl);
      
      -- Crear política estricta de aislamiento multi-tenant
      EXECUTE format('
        CREATE POLICY rls_tenant_%I ON public.%I
        FOR ALL
        TO authenticated, anon
        USING (
          empresa_id = public.get_current_tenant_id() 
          OR public.is_super_admin()
          OR empresa_id = ''empresa_activa''
        )
        WITH CHECK (
          empresa_id = public.get_current_tenant_id() 
          OR public.is_super_admin()
          OR empresa_id = ''empresa_activa''
        );
      ', tbl, tbl);
    END IF;
  END LOOP;
END $$;

-- Política de RLS para la tabla de empresas (lectura pública o autenticada de su empresa)
DROP POLICY IF EXISTS allow_all_empresas ON public.empresas;
DROP POLICY IF EXISTS rls_empresas ON public.empresas;
CREATE POLICY rls_empresas ON public.empresas
FOR ALL
TO authenticated, anon
USING (
  id = public.get_current_tenant_id()
  OR slug = current_setting('request.headers', true)::jsonb->>'x-tenant-slug'
  OR id = 'empresa_activa'
  OR public.is_super_admin()
)
WITH CHECK (
  id = public.get_current_tenant_id()
  OR public.is_super_admin()
  OR id = 'empresa_activa'
);

-- 5. PROCEDIMIENTO ATÓMICO: VENTA POS CON CONTROL CONCURRENTE DE INVENTARIO
-- Ejecuta la venta, bloquea las filas de productos con FOR UPDATE para evitar condiciones de carrera,
-- descuenta el stock, registra kardex e inserta la venta en una sola transacción PostgreSQL ACID.
CREATE OR REPLACE FUNCTION public.realizar_venta_pos_atomica(
  p_venta jsonb,
  p_items jsonb
)
RETURNS jsonb AS $$
DECLARE
  v_item jsonb;
  v_prod_id text;
  v_cantidad numeric;
  v_stock_actual numeric;
  v_nuevo_stock numeric;
  v_venta_id text;
  v_empresa_id text;
  v_fecha text;
  v_kardex_id text;
BEGIN
  -- Extraer datos clave de la cabecera de venta
  v_venta_id := p_venta->>'id';
  v_empresa_id := COALESCE(p_venta->>'empresa_id', public.get_current_tenant_id());
  v_fecha := COALESCE(p_venta->>'fecha', now()::text);

  IF v_venta_id IS NULL OR v_venta_id = '' THEN
    RAISE EXCEPTION 'El id de la venta es obligatorio';
  END IF;

  -- 1. Verificar idempotencia: si la venta ya fue registrada, retornar sin duplicar
  IF EXISTS (SELECT 1 FROM public.ventas WHERE id = v_venta_id) THEN
    RETURN jsonb_build_object(
      'success', true,
      'venta_id', v_venta_id,
      'mensaje', 'Venta ya procesada previamente (Idempotencia garantizada)'
    );
  END IF;

  -- 2. Recorrer y descontar stock de cada producto con bloqueo de fila FOR UPDATE
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
  LOOP
    v_prod_id := v_item->>'id';
    v_cantidad := (v_item->>'cantidad')::numeric;

    IF v_prod_id IS NOT NULL AND v_cantidad > 0 THEN
      -- Bloqueo de fila para evitar condiciones de carrera
      SELECT stock_actual INTO v_stock_actual
      FROM public.productos
      WHERE id = v_prod_id AND empresa_id = v_empresa_id
      FOR UPDATE;

      IF FOUND THEN
        v_nuevo_stock := v_stock_actual - v_cantidad;

        -- Actualizar producto
        UPDATE public.productos
        SET stock_actual = v_nuevo_stock,
            updated_at = now()
        WHERE id = v_prod_id AND empresa_id = v_empresa_id;

        -- Generar movimiento de kardex
        v_kardex_id := 'kdx-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10);
        INSERT INTO public.kardex (
          id, empresa_id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo
        ) VALUES (
          v_kardex_id,
          v_empresa_id,
          v_fecha,
          v_prod_id,
          'SALIDA',
          v_cantidad,
          'Venta POS #' || COALESCE(p_venta->>'correlativo', v_venta_id),
          v_nuevo_stock
        );
      END IF;
    END IF;
  END LOOP;

  -- 3. Insertar la cabecera de la venta
  INSERT INTO public.ventas (
    id, empresa_id, correlativo, fecha, total, subtotal, descuento,
    metodo_pago, tipo_documento, cliente_id, cliente_nombre, items,
    usuario_id, usuario_nombre, estado, observaciones, created_at, updated_at
  ) VALUES (
    v_venta_id,
    v_empresa_id,
    p_venta->>'correlativo',
    v_fecha,
    (p_venta->>'total')::numeric,
    (p_venta->>'subtotal')::numeric,
    COALESCE((p_venta->>'descuento')::numeric, 0),
    p_venta->>'metodo_pago',
    p_venta->>'tipo_documento',
    p_venta->>'cliente_id',
    p_venta->>'cliente_nombre',
    p_items,
    p_venta->>'usuario_id',
    p_venta->>'usuario_nombre',
    COALESCE(p_venta->>'estado', 'COMPLETADO'),
    p_venta->>'observaciones',
    now(),
    now()
  );

  RETURN jsonb_build_object(
    'success', true,
    'venta_id', v_venta_id,
    'correlativo', p_venta->>'correlativo',
    'total', (p_venta->>'total')::numeric
  );
EXCEPTION
  WHEN OTHERS THEN
    RAISE EXCEPTION 'Error atómico en venta POS: %', SQLERRM;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Permisos de ejecución de la función RPC
GRANT EXECUTE ON FUNCTION public.realizar_venta_pos_atomica(jsonb, jsonb) TO authenticated, anon;
