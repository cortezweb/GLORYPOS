-- ════════════════════════════════════════════════════════════════════════════
-- GLORYCHEF · Módulo de restaurante de GLORYPOS
-- Ejecutar en el SQL Editor de Supabase después de supabase_master_schema.sql
-- ════════════════════════════════════════════════════════════════════════════

-- ── Salones del restaurante ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.salones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    orden INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Mesas ───────────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.mesas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    salon_id TEXT,
    numero TEXT NOT NULL,
    capacidad INTEGER DEFAULT 4,
    estado TEXT DEFAULT 'LIBRE',          -- LIBRE | OCUPADA | CUENTA | RESERVADA
    comanda_id TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Comandas (pedidos de mesa, para llevar y delivery) ─────────────────────
CREATE TABLE IF NOT EXISTS public.comandas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero INTEGER,
    tipo TEXT DEFAULT 'MESA',             -- MESA | LLEVAR | DELIVERY
    origen TEXT DEFAULT 'GLORYCHEF',      -- GLORYCHEF | POS | TIENDA
    mesa_id TEXT,
    mesa_numero TEXT,
    mozo TEXT,
    comensales INTEGER DEFAULT 1,
    cliente_nombre TEXT,
    telefono TEXT,
    direccion TEXT,
    estado TEXT DEFAULT 'ABIERTA',        -- ABIERTA | CUENTA | PAGADA | ANULADA
    items JSONB DEFAULT '[]'::jsonb,      -- platos con estado de cocina, notas y pago
    ventas JSONB DEFAULT '[]'::jsonb,     -- ventas (comprobantes) que cobraron la comanda
    venta_id TEXT,
    pedido_web_id TEXT,
    fecha_apertura TIMESTAMPTZ DEFAULT now(),
    fecha_cierre TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Recetas: datos de cocina de cada producto de la carta ──────────────────
CREATE TABLE IF NOT EXISTS public.glorychef_recetas (
    producto_id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    es_plato BOOLEAN DEFAULT false,
    es_insumo BOOLEAN DEFAULT false,
    estacion TEXT DEFAULT 'COCINA',       -- COCINA | PARRILLA | BAR
    merma_pct NUMERIC(5,2) DEFAULT 0,
    receta JSONB DEFAULT '[]'::jsonb,     -- [{ insumo_id, cantidad }] por porción
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seguridad: si ya ejecutaste supabase_phase2_security_rls.sql se aplica el mismo
-- aislamiento por empresa (rls_tenant_*); si no, se usa el acceso abierto del esquema maestro.
DO $$
DECLARE
  tbl text;
  tablas text[] := ARRAY['salones', 'mesas', 'comandas', 'glorychef_recetas'];
  con_tenant boolean := EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'get_current_tenant_id');
BEGIN
  FOREACH tbl IN ARRAY tablas LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', tbl);
    EXECUTE format('DROP POLICY IF EXISTS "Allow public access %s" ON public.%I;', tbl, tbl);
    EXECUTE format('DROP POLICY IF EXISTS rls_tenant_%I ON public.%I;', tbl, tbl);
    IF con_tenant THEN
      EXECUTE format('
        CREATE POLICY rls_tenant_%I ON public.%I
        FOR ALL TO authenticated, anon
        USING (empresa_id = public.get_current_tenant_id() OR public.is_super_admin() OR empresa_id = ''empresa_activa'')
        WITH CHECK (empresa_id = public.get_current_tenant_id() OR public.is_super_admin() OR empresa_id = ''empresa_activa'');
      ', tbl, tbl);
    ELSE
      EXECUTE format('CREATE POLICY "Allow public access %s" ON public.%I FOR ALL USING (true) WITH CHECK (true);', tbl, tbl);
    END IF;
  END LOOP;
END $$;

CREATE INDEX IF NOT EXISTS idx_salones_empresa ON public.salones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mesas_empresa ON public.mesas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comandas_empresa_estado ON public.comandas(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_glorychef_recetas_empresa ON public.glorychef_recetas(empresa_id);
