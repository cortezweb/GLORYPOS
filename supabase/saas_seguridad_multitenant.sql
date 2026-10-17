-- ════════════════════════════════════════════════════════════════════════════
-- GLORYPOS SaaS · SEGURIDAD MULTI-EMPRESA (reemplaza las políticas abiertas)
--
-- Ejecutar en el SQL Editor de Supabase DESPUÉS de todos los demás scripts
-- (supabase_master_all_tables.sql, glorychef_schema.sql, hoteles_schema.sql,
-- tienda_pedidos_update.sql, supabase_phase2_security_rls.sql).
-- Se puede volver a ejecutar sin problema. Si después corres otra vez alguno de
-- esos scripts, vuelve a ejecutar este al final: ellos recrean políticas abiertas.
--
-- Qué hace:
--   1. La empresa del usuario sale SOLO de la tabla tenant_members (nunca de datos
--      que el propio usuario puede escribir, como user_metadata o usuarios.rol).
--   2. Super Admin = tabla platform_admins (solo editable desde este SQL Editor).
--   3. Cada tabla con empresa_id: RLS estricto, sin acceso anónimo, sin 'empresa_activa'.
--   4. Clave primaria (empresa_id, id) para que dos empresas puedan usar el mismo id.
--   5. Los campos de plan, vencimiento y módulos de una empresa solo los cambia el Super Admin.
--   6. La tienda en línea pública usa funciones RPC que exponen solo lo necesario.
--
-- Después de ejecutarlo, regístrate como Super Admin (ver el final del archivo).
-- ════════════════════════════════════════════════════════════════════════════

-- Moneda de la empresa (BOB, PEN, ARS o CLP). Por defecto Bolivianos.
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'BOB';

-- ── 1. SUPER ADMINISTRADORES DE LA PLATAFORMA ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.platform_admins (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.platform_admins ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.platform_admins FROM anon, authenticated;

-- ── 2. MEMBRESÍAS: QUIÉN PERTENECE A QUÉ EMPRESA ─────────────────────────────
-- user_id = auth.users.id. Una fila con user_id NULL y email es una invitación
-- pendiente: se vincula sola cuando esa persona inicia sesión con su correo verificado.
CREATE TABLE IF NOT EXISTS public.tenant_members (
  id text PRIMARY KEY DEFAULT ('tm-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12)),
  empresa_id text NOT NULL REFERENCES public.empresas(id) ON DELETE CASCADE,
  user_id text,
  email text,
  rol text NOT NULL DEFAULT 'CAJERO',
  activo boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.tenant_members ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.tenant_members ALTER COLUMN user_id DROP NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tenant_members_user ON public.tenant_members(user_id);
CREATE INDEX IF NOT EXISTS idx_tenant_members_empresa ON public.tenant_members(empresa_id);
CREATE UNIQUE INDEX IF NOT EXISTS uq_tenant_members_email
  ON public.tenant_members(empresa_id, lower(email)) WHERE email IS NOT NULL;

-- ── 3. FUNCIONES DE SEGURIDAD ───────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT auth.uid() IS NOT NULL
     AND EXISTS (SELECT 1 FROM public.platform_admins WHERE user_id = auth.uid());
$$;

-- Subdominio que pide el navegador (cabecera x-tenant-slug que envía la app)
CREATE OR REPLACE FUNCTION public.request_tenant_slug()
RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT NULLIF(lower(COALESCE(NULLIF(current_setting('request.headers', true), ''), '{}')::jsonb->>'x-tenant-slug'), '');
$$;

-- Empresa del usuario autenticado. Si la app indica un subdominio, solo se devuelve
-- esa empresa cuando el usuario es miembro (o Super Admin); si no, NULL = sin acceso.
CREATE OR REPLACE FUNCTION public.get_current_tenant_id()
RETURNS text
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_id text;
  v_slug text := public.request_tenant_slug();
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_slug IS NOT NULL AND v_slug <> 'admin' THEN
    SELECT e.id INTO v_id
    FROM public.empresas e
    WHERE e.slug = v_slug
      AND (
        public.is_super_admin()
        OR EXISTS (
          SELECT 1 FROM public.tenant_members tm
          WHERE tm.empresa_id = e.id AND tm.user_id = auth.uid()::text AND tm.activo
        )
      );
    RETURN v_id;
  END IF;

  SELECT tm.empresa_id INTO v_id
  FROM public.tenant_members tm
  WHERE tm.user_id = auth.uid()::text AND tm.activo
  ORDER BY tm.created_at
  LIMIT 1;
  RETURN v_id;
END;
$$;

-- ¿Quién llama? Accesos directos desde el SQL Editor o con service_role no tienen JWT de usuario.
CREATE OR REPLACE FUNCTION public.es_acceso_interno()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb->>'role' IS NULL
      OR COALESCE(NULLIF(current_setting('request.jwt.claims', true), ''), '{}')::jsonb->>'role' = 'service_role';
$$;

-- ── 4. RLS ESTRICTO EN TODAS LAS TABLAS CON empresa_id ──────────────────────
DO $$
DECLARE
  r record;
  pol record;
  v_pk_name text;
  v_pk_cols text;
  v_tiene_empresa boolean;
  v_nulos boolean;
BEGIN
  FOR r IN
    SELECT c.table_name
    FROM information_schema.columns c
    JOIN information_schema.tables t
      ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public'
      AND c.column_name = 'empresa_id'
      AND t.table_type = 'BASE TABLE'
      AND c.table_name NOT IN ('tenant_members')
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);

    -- Borra TODAS las políticas anteriores (Allow_all_*, "Allow public access *", rls_tenant_* ...)
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = r.table_name LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, r.table_name);
    END LOOP;

    -- Nadie sin sesión toca estas tablas (la tienda pública usa las funciones RPC de abajo)
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.table_name);

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated
         USING (empresa_id = (SELECT public.get_current_tenant_id()) OR (SELECT public.is_super_admin()))
         WITH CHECK (empresa_id = (SELECT public.get_current_tenant_id()) OR (SELECT public.is_super_admin()))',
      'rls_tenant_' || r.table_name, r.table_name
    );

    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(empresa_id)', 'idx_' || r.table_name || '_empresa_id', r.table_name);

    -- Clave primaria por empresa: (empresa_id, id). Evita que una empresa pise o
    -- bloquee los registros de otra que usa el mismo id (ej. 'rol-admin', 'mp-1').
    v_pk_name := NULL;
    v_pk_cols := NULL;
    v_nulos := NULL;
    SELECT con.conname,
           string_agg(quote_ident(a.attname), ', ' ORDER BY array_position(con.conkey, a.attnum)),
           bool_or(a.attname = 'empresa_id')
      INTO v_pk_name, v_pk_cols, v_tiene_empresa
    FROM pg_constraint con
    JOIN pg_attribute a ON a.attrelid = con.conrelid AND a.attnum = ANY (con.conkey)
    WHERE con.conrelid = format('public.%I', r.table_name)::regclass
      AND con.contype = 'p'
    GROUP BY con.conname;

    IF v_pk_name IS NOT NULL AND NOT v_tiene_empresa THEN
      IF EXISTS (SELECT 1 FROM pg_constraint WHERE confrelid = format('public.%I', r.table_name)::regclass AND contype = 'f') THEN
        RAISE NOTICE 'Tabla %: otra tabla la referencia por llave foránea, se mantiene su clave primaria actual.', r.table_name;
      ELSE
        EXECUTE format('SELECT EXISTS (SELECT 1 FROM public.%I WHERE empresa_id IS NULL)', r.table_name) INTO v_nulos;
      END IF;

      IF v_nulos IS NULL THEN
        NULL; -- se mantuvo la clave por la llave foránea
      ELSIF v_nulos THEN
        RAISE NOTICE 'Tabla %: tiene filas sin empresa_id; asígnales una empresa y vuelve a ejecutar el script.', r.table_name;
      ELSE
        EXECUTE format('ALTER TABLE public.%I ALTER COLUMN empresa_id SET NOT NULL', r.table_name);
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I', r.table_name, v_pk_name);
        EXECUTE format('ALTER TABLE public.%I ADD PRIMARY KEY (empresa_id, %s)', r.table_name, v_pk_cols);
      END IF;
    END IF;
  END LOOP;
END $$;

-- Tablas sin empresa_id (catálogos globales): solo lectura para usuarios con sesión.
DO $$
DECLARE
  r record;
  pol record;
BEGIN
  FOR r IN
    SELECT t.table_name
    FROM information_schema.tables t
    WHERE t.table_schema = 'public'
      AND t.table_type = 'BASE TABLE'
      AND t.table_name NOT IN ('empresas', 'tenant_members', 'platform_admins')
      AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns c
        WHERE c.table_schema = 'public' AND c.table_name = t.table_name AND c.column_name = 'empresa_id'
      )
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.table_name);
    FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = r.table_name LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, r.table_name);
    END LOOP;
    EXECUTE format('REVOKE ALL ON public.%I FROM anon', r.table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', 'leer_' || r.table_name, r.table_name);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING ((SELECT public.is_super_admin())) WITH CHECK ((SELECT public.is_super_admin()))', 'admin_' || r.table_name, r.table_name);
  END LOOP;
END $$;

-- ── 5. EMPRESAS ─────────────────────────────────────────────────────────────
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'empresas' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.empresas', pol.policyname);
  END LOOP;
END $$;
REVOKE ALL ON public.empresas FROM anon;

CREATE POLICY empresas_leer ON public.empresas FOR SELECT TO authenticated
USING (
  (SELECT public.is_super_admin())
  OR id IN (SELECT tm.empresa_id FROM public.tenant_members tm WHERE tm.user_id = auth.uid()::text AND tm.activo)
);

CREATE POLICY empresas_editar ON public.empresas FOR UPDATE TO authenticated
USING (id = (SELECT public.get_current_tenant_id()) OR (SELECT public.is_super_admin()))
WITH CHECK (id = (SELECT public.get_current_tenant_id()) OR (SELECT public.is_super_admin()));

CREATE POLICY empresas_crear ON public.empresas FOR INSERT TO authenticated
WITH CHECK ((SELECT public.is_super_admin()));

CREATE POLICY empresas_borrar ON public.empresas FOR DELETE TO authenticated
USING ((SELECT public.is_super_admin()));

-- Plan, vencimiento, módulos y subdominio solo los cambia el Super Admin.
-- Si una empresa intenta cambiarlos (por la sincronización o a mano) se conservan los valores anteriores.
CREATE OR REPLACE FUNCTION public.proteger_campos_empresa()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_campo text;
  v_new jsonb;
  v_old jsonb;
BEGIN
  IF public.es_acceso_interno() OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;
  v_new := to_jsonb(NEW);
  v_old := to_jsonb(OLD);
  FOREACH v_campo IN ARRAY ARRAY[
    'id', 'slug', 'plan_tipo', 'estado_suscripcion', 'modulos_activos', 'fecha_inicio',
    'fecha_vencimiento', 'dias_prueba', 'monto_mensual'
  ] LOOP
    IF v_old ? v_campo THEN
      v_new := jsonb_set(v_new, ARRAY[v_campo], v_old->v_campo);
    END IF;
  END LOOP;
  NEW := jsonb_populate_record(NEW, v_new);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proteger_campos_empresa ON public.empresas;
CREATE TRIGGER trg_proteger_campos_empresa
BEFORE UPDATE ON public.empresas
FOR EACH ROW EXECUTE FUNCTION public.proteger_campos_empresa();

-- ── 6. USUARIOS: nadie se asigna el rol SUPERADMIN desde la app ─────────────
CREATE OR REPLACE FUNCTION public.proteger_rol_usuarios()
RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF public.es_acceso_interno() OR public.is_super_admin() THEN
    RETURN NEW;
  END IF;
  IF upper(COALESCE(NEW.rol, '')) IN ('SUPERADMIN', 'SUPER_ADMIN') THEN
    RAISE EXCEPTION 'Rol no permitido';
  END IF;
  RETURN NEW;
END;
$$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'usuarios') THEN
    EXECUTE 'DROP TRIGGER IF EXISTS trg_proteger_rol_usuarios ON public.usuarios';
    EXECUTE 'CREATE TRIGGER trg_proteger_rol_usuarios BEFORE INSERT OR UPDATE ON public.usuarios
             FOR EACH ROW EXECUTE FUNCTION public.proteger_rol_usuarios()';
  END IF;
END $$;

-- ── 7. TENANT_MEMBERS ───────────────────────────────────────────────────────
ALTER TABLE public.tenant_members ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE pol record;
BEGIN
  FOR pol IN SELECT policyname FROM pg_policies WHERE schemaname = 'public' AND tablename = 'tenant_members' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.tenant_members', pol.policyname);
  END LOOP;
END $$;
REVOKE ALL ON public.tenant_members FROM anon;

CREATE OR REPLACE FUNCTION public.es_admin_empresa(p_empresa_id text)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.tenant_members
    WHERE empresa_id = p_empresa_id AND user_id = auth.uid()::text AND activo AND upper(rol) = 'ADMIN'
  );
$$;

CREATE POLICY miembros_leer ON public.tenant_members FOR SELECT TO authenticated
USING (
  user_id = auth.uid()::text
  OR empresa_id = (SELECT public.get_current_tenant_id())
  OR (SELECT public.is_super_admin())
);

-- El ADMIN de una empresa invita o desactiva miembros de SU empresa; el Super Admin, de cualquiera.
CREATE POLICY miembros_gestionar ON public.tenant_members FOR ALL TO authenticated
USING ((SELECT public.is_super_admin()) OR public.es_admin_empresa(empresa_id))
WITH CHECK ((SELECT public.is_super_admin()) OR public.es_admin_empresa(empresa_id));

-- ── 8. RPC: SESIÓN DEL USUARIO EN UNA EMPRESA ───────────────────────────────
-- Vincula invitaciones pendientes (correo verificado) y devuelve el rol en la empresa del subdominio.
CREATE OR REPLACE FUNCTION public.mi_membresia(p_slug text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_email text := lower(auth.jwt()->>'email');
  v_super boolean;
  v_empresa record;
  v_rol text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  IF v_email IS NOT NULL AND EXISTS (
    SELECT 1 FROM auth.users WHERE id = auth.uid() AND email_confirmed_at IS NOT NULL
  ) THEN
    UPDATE public.tenant_members
       SET user_id = auth.uid()::text
     WHERE user_id IS NULL AND lower(email) = v_email;
  END IF;

  v_super := public.is_super_admin();

  SELECT id, slug INTO v_empresa FROM public.empresas WHERE slug = lower(p_slug);
  IF v_empresa.id IS NOT NULL THEN
    SELECT rol INTO v_rol FROM public.tenant_members
    WHERE empresa_id = v_empresa.id AND user_id = auth.uid()::text AND activo
    LIMIT 1;
  END IF;

  RETURN jsonb_build_object(
    'super_admin', v_super,
    'empresa_id', CASE WHEN v_rol IS NOT NULL OR v_super THEN v_empresa.id END,
    'slug', v_empresa.slug,
    'rol', COALESCE(v_rol, CASE WHEN v_super THEN 'SUPERADMIN' END),
    'miembro', v_rol IS NOT NULL
  );
END;
$$;

-- ── 9. RPC: REGISTRAR UNA EMPRESA NUEVA ─────────────────────────────────────
-- Autoregistro: crea la empresa en prueba de 30 días y deja al usuario como ADMIN.
-- Super Admin: puede elegir plan y módulos e invitar al administrador por correo.
CREATE OR REPLACE FUNCTION public.registrar_empresa(p_empresa jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_super boolean := public.is_super_admin();
  v_slug text;
  v_id text;
  v_email text := lower(auth.jwt()->>'email');
  v_modulos jsonb;
  v_plan text;
  v_dias int;
  v_admin_email text := NULLIF(lower(trim(p_empresa->>'admin_email')), '');
  v_moneda text := upper(COALESCE(NULLIF(p_empresa->>'moneda', ''), 'BOB'));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  IF NOT v_super AND EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = auth.uid()::text) THEN
    RAISE EXCEPTION 'Tu cuenta ya pertenece a una empresa';
  END IF;

  v_slug := regexp_replace(lower(COALESCE(p_empresa->>'slug', '')), '[^a-z0-9-]', '', 'g');
  v_slug := left(trim(both '-' from v_slug), 30);
  IF length(v_slug) < 3 THEN
    RAISE EXCEPTION 'El identificador debe tener al menos 3 caracteres';
  END IF;
  IF v_slug IN ('admin', 'www', 'app', 'pos', 'api', 'cdn', 'static', 'mail', 'staging', 'dev', 'empresa_activa') THEN
    RAISE EXCEPTION 'Ese identificador está reservado';
  END IF;
  IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'El identificador ya está en uso';
  END IF;

  IF v_moneda NOT IN ('BOB', 'PEN', 'ARS', 'CLP') THEN
    RAISE EXCEPTION 'Moneda no válida';
  END IF;

  IF v_super THEN
    v_plan := COALESCE(NULLIF(p_empresa->>'plan_tipo', ''), 'TRIAL');
    v_dias := COALESCE(NULLIF(p_empresa->>'duracion_dias', '')::int, 30);
    v_modulos := CASE WHEN jsonb_typeof(p_empresa->'modulos_activos') = 'array' THEN p_empresa->'modulos_activos' END;
  ELSE
    v_plan := 'TRIAL';
    v_dias := 30;
    v_modulos := NULL; -- usa el valor por defecto de la columna
  END IF;

  v_id := 'emp-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);

  INSERT INTO public.empresas (
    id, slug, nombre, nit_ci, rubro, ciudad, moneda, direccion, telefono, email, propietario,
    plan_tipo, estado_suscripcion, fecha_inicio, fecha_vencimiento, dias_prueba, created_at, updated_at
  ) VALUES (
    v_id, v_slug,
    COALESCE(NULLIF(trim(p_empresa->>'nombre'), ''), v_slug),
    COALESCE(NULLIF(trim(p_empresa->>'nit_ci'), ''), '0'),
    COALESCE(NULLIF(p_empresa->>'rubro', ''), 'ABARROTES'),
    COALESCE(p_empresa->>'ciudad', ''),
    v_moneda,
    COALESCE(p_empresa->>'direccion', ''),
    COALESCE(p_empresa->>'telefono', ''),
    COALESCE(NULLIF(lower(p_empresa->>'email'), ''), v_admin_email, v_email),
    COALESCE(p_empresa->>'propietario', ''),
    v_plan, 'ACTIVO', now(), now() + make_interval(days => v_dias), v_dias, now(), now()
  );

  IF v_modulos IS NOT NULL THEN
    UPDATE public.empresas SET modulos_activos = v_modulos WHERE id = v_id;
  END IF;

  IF NOT v_super THEN
    INSERT INTO public.tenant_members (empresa_id, user_id, email, rol)
    VALUES (v_id, auth.uid()::text, v_email, 'ADMIN');
  ELSIF v_admin_email IS NOT NULL THEN
    INSERT INTO public.tenant_members (empresa_id, user_id, email, rol)
    VALUES (v_id, NULL, v_admin_email, 'ADMIN');
  END IF;

  RETURN (SELECT to_jsonb(e) FROM public.empresas e WHERE e.id = v_id);
END;
$$;

-- ── 10. RPC PÚBLICAS (sin sesión): datos de la empresa y tienda en línea ────
-- Solo datos de presentación; nada de costos, usuarios ni configuración interna.
CREATE OR REPLACE FUNCTION public.empresa_publica(p_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', e.id, 'slug', e.slug, 'nombre', e.nombre, 'rubro', e.rubro,
    'ciudad', e.ciudad, 'moneda', e.moneda, 'direccion', e.direccion, 'telefono', e.telefono,
    'logo_url', to_jsonb(e)->'logo_url',
    'plan_tipo', e.plan_tipo, 'estado_suscripcion', e.estado_suscripcion,
    'fecha_vencimiento', e.fecha_vencimiento, 'modulos_activos', e.modulos_activos
  )
  FROM public.empresas e
  WHERE e.slug = lower(p_slug);
$$;

CREATE OR REPLACE FUNCTION public.tienda_catalogo(p_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(
           to_jsonb(p) - 'precio_compra' - 'costo' - 'costo_unitario' - 'costo_promedio'
         ), '[]'::jsonb)
  FROM public.productos p
  JOIN public.empresas e ON e.id = p.empresa_id
  WHERE e.slug = lower(p_slug)
    AND COALESCE(e.estado_suscripcion, 'ACTIVO') <> 'VENCIDO'
    AND COALESCE((to_jsonb(p)->>'activo')::boolean, true)
    AND NOT COALESCE((to_jsonb(p)->>'es_insumo')::boolean, false);
$$;

-- El cliente de la tienda crea su pedido; la empresa sale del subdominio, nunca del navegador.
CREATE OR REPLACE FUNCTION public.tienda_crear_pedido(p_slug text, p_pedido jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_empresa_id text;
  v_id text;
BEGIN
  SELECT id INTO v_empresa_id FROM public.empresas
  WHERE slug = lower(p_slug) AND COALESCE(estado_suscripcion, 'ACTIVO') <> 'VENCIDO';
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Tienda no disponible';
  END IF;
  IF jsonb_typeof(p_pedido->'items') <> 'array'
     OR jsonb_array_length(p_pedido->'items') = 0
     OR jsonb_array_length(p_pedido->'items') > 100 THEN
    RAISE EXCEPTION 'Pedido sin productos válidos';
  END IF;
  IF length(p_pedido::text) > 50000 THEN
    RAISE EXCEPTION 'Pedido demasiado grande';
  END IF;

  v_id := left(COALESCE(NULLIF(p_pedido->>'id', ''), 'pw-' || substr(md5(random()::text), 1, 10)), 40);

  INSERT INTO public.pedidos_web
  SELECT * FROM jsonb_populate_record(NULL::public.pedidos_web, jsonb_build_object(
    'id', v_id,
    'empresa_id', v_empresa_id,
    'fecha', now(),
    'numero_orden', left(p_pedido->>'numero_orden', 30),
    'cliente_nombre', left(COALESCE(NULLIF(trim(p_pedido->>'cliente_nombre'), ''), 'Cliente'), 120),
    'telefono', left(p_pedido->>'telefono', 30),
    'documento', left(p_pedido->>'documento', 30),
    'email', left(p_pedido->>'email', 120),
    'direccion', left(p_pedido->>'direccion', 300),
    'entrega', COALESCE(p_pedido->'entrega', '{}'::jsonb),
    'pago', COALESCE(p_pedido->'pago', '{}'::jsonb),
    'comprobante', jsonb_build_object('estado', 'PENDIENTE'),
    'notas', left(p_pedido->>'notas', 500),
    'subtotal', GREATEST(COALESCE((p_pedido->>'subtotal')::numeric, 0), 0),
    'envio', GREATEST(COALESCE((p_pedido->>'envio')::numeric, 0), 0),
    'total', GREATEST(COALESCE((p_pedido->>'total')::numeric, 0), 0),
    'estado', 'NUEVO',
    'items', p_pedido->'items',
    'venta_id', NULL,
    'created_at', now(),
    'updated_at', now()
  ))
  ON CONFLICT DO NOTHING;

  RETURN jsonb_build_object('success', true, 'id', v_id);
END;
$$;

-- ── 11. VENTA ATÓMICA: la empresa sale de la sesión, no del payload ─────────
CREATE OR REPLACE FUNCTION public.realizar_venta_pos_atomica(
  p_venta jsonb,
  p_items jsonb
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_item jsonb;
  v_prod_id text;
  v_cantidad numeric;
  v_stock_actual numeric;
  v_nuevo_stock numeric;
  v_venta_id text;
  v_empresa_id text := public.get_current_tenant_id();
  v_fecha text;
BEGIN
  IF v_empresa_id IS NULL THEN
    RAISE EXCEPTION 'Sesión sin empresa';
  END IF;

  v_venta_id := p_venta->>'id';
  v_fecha := COALESCE(p_venta->>'fecha', now()::text);
  IF v_venta_id IS NULL OR v_venta_id = '' THEN
    RAISE EXCEPTION 'El id de la venta es obligatorio';
  END IF;

  IF EXISTS (SELECT 1 FROM public.ventas WHERE id = v_venta_id AND empresa_id = v_empresa_id) THEN
    RETURN jsonb_build_object('success', true, 'venta_id', v_venta_id, 'mensaje', 'Venta ya procesada previamente');
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_prod_id := v_item->>'id';
    v_cantidad := (v_item->>'cantidad')::numeric;
    IF v_prod_id IS NOT NULL AND v_cantidad > 0 THEN
      SELECT stock_actual INTO v_stock_actual
      FROM public.productos
      WHERE id = v_prod_id AND empresa_id = v_empresa_id
      FOR UPDATE;

      IF FOUND THEN
        v_nuevo_stock := v_stock_actual - v_cantidad;
        UPDATE public.productos
           SET stock_actual = v_nuevo_stock, updated_at = now()
         WHERE id = v_prod_id AND empresa_id = v_empresa_id;

        INSERT INTO public.kardex (id, empresa_id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo)
        VALUES (
          'kdx-' || substr(md5(random()::text || clock_timestamp()::text), 1, 10),
          v_empresa_id, v_fecha, v_prod_id, 'SALIDA', v_cantidad,
          'Venta POS #' || COALESCE(p_venta->>'correlativo', v_venta_id), v_nuevo_stock
        );
      END IF;
    END IF;
  END LOOP;

  -- Solo se guardan las columnas que existen en la tabla ventas
  INSERT INTO public.ventas
  SELECT * FROM jsonb_populate_record(NULL::public.ventas, p_venta || jsonb_build_object(
    'id', v_venta_id,
    'empresa_id', v_empresa_id,
    'fecha', v_fecha,
    'correlativo', COALESCE(p_venta->>'correlativo', v_venta_id),
    'items', p_items,
    'estado', COALESCE(p_venta->>'estado', 'COMPLETADO'),
    'created_at', now(),
    'updated_at', now()
  ));

  RETURN jsonb_build_object(
    'success', true, 'venta_id', v_venta_id,
    'correlativo', p_venta->>'correlativo', 'total', (p_venta->>'total')::numeric
  );
END;
$$;

-- ── 12. MIGRAR DATOS VIEJOS GUARDADOS COMO 'empresa_activa' ─────────────────
-- Antes todas las empresas sincronizaban con empresa_id = 'empresa_activa'. Con las
-- nuevas reglas esas filas ya no son visibles para nadie salvo el Super Admin.
-- Para asignarlas a una empresa real (ejecutar como Super Admin o en el SQL Editor):
--   SELECT public.migrar_empresa_activa('emp-xxxxxxxx');
CREATE OR REPLACE FUNCTION public.migrar_empresa_activa(p_empresa_id text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  r record;
  v_n bigint;
  v_res jsonb := '{}'::jsonb;
BEGIN
  IF NOT (public.es_acceso_interno() OR public.is_super_admin()) THEN
    RAISE EXCEPTION 'Solo el Super Admin';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.empresas WHERE id = p_empresa_id) THEN
    RAISE EXCEPTION 'La empresa % no existe', p_empresa_id;
  END IF;
  FOR r IN
    SELECT c.table_name FROM information_schema.columns c
    JOIN information_schema.tables t ON t.table_schema = c.table_schema AND t.table_name = c.table_name
    WHERE c.table_schema = 'public' AND c.column_name = 'empresa_id' AND t.table_type = 'BASE TABLE'
  LOOP
    EXECUTE format('UPDATE public.%I SET empresa_id = $1 WHERE empresa_id = %L', r.table_name, 'empresa_activa')
      USING p_empresa_id;
    GET DIAGNOSTICS v_n = ROW_COUNT;
    IF v_n > 0 THEN
      v_res := v_res || jsonb_build_object(r.table_name, v_n);
    END IF;
  END LOOP;
  RETURN v_res;
END;
$$;

-- ── 13. PERMISOS DE EJECUCIÓN ───────────────────────────────────────────────
REVOKE EXECUTE ON FUNCTION public.realizar_venta_pos_atomica(jsonb, jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.realizar_venta_pos_atomica(jsonb, jsonb) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.migrar_empresa_activa(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.registrar_empresa(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_empresa(jsonb) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.mi_membresia(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.mi_membresia(text) TO authenticated;

GRANT EXECUTE ON FUNCTION public.empresa_publica(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tienda_catalogo(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.tienda_crear_pedido(text, jsonb) TO anon, authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- DARTE PERMISOS DE SUPER ADMIN (una sola vez)
-- 1. En la app (o en Supabase > Authentication > Users) crea tu usuario con tu correo.
-- 2. Ejecuta, cambiando el correo:
--      INSERT INTO public.platform_admins (user_id)
--      SELECT id FROM auth.users WHERE email = 'tu-correo@ejemplo.com'
--      ON CONFLICT DO NOTHING;
--
-- Recomendado en Supabase > Authentication > Providers > Email: activar "Confirm email",
-- para que nadie pueda reclamar una invitación con un correo que no es suyo.
-- ════════════════════════════════════════════════════════════════════════════
