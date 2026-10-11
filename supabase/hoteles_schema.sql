-- ════════════════════════════════════════════════════════════════════════════
-- HOTELES · Módulo de hospedaje de GLORYPOS (recepción, reservas, folio, limpieza)
-- Ejecutar en el SQL Editor de Supabase después de supabase_master_schema.sql
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.hab_tipos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    capacidad INTEGER DEFAULT 2,
    tarifa NUMERIC(10,2) DEFAULT 0,
    descripcion TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.habitaciones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    numero TEXT NOT NULL,
    piso INTEGER DEFAULT 1,
    tipo_id TEXT,
    limpieza TEXT DEFAULT 'LIMPIA',       -- LIMPIA | SUCIA | MANTENIMIENTO
    nota TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Una reserva es también la estadía: RESERVADA → EN_CASA → FINALIZADA (o CANCELADA / NO_SHOW)
CREATE TABLE IF NOT EXISTS public.reservas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo TEXT,
    habitacion_id TEXT,
    estado TEXT DEFAULT 'RESERVADA',
    llegada DATE,
    salida DATE,
    salida_real DATE,
    tarifa NUMERIC(10,2) DEFAULT 0,
    adultos INTEGER DEFAULT 1,
    ninos INTEGER DEFAULT 0,
    canal TEXT DEFAULT 'Directo',
    huesped JSONB DEFAULT '{}'::jsonb,
    consumos JSONB DEFAULT '[]'::jsonb,   -- cargos al folio (minibar, restaurante, servicios)
    pagos JSONB DEFAULT '[]'::jsonb,      -- ventas (comprobantes) aplicadas al folio
    notas TEXT,
    checkin_at TIMESTAMPTZ,
    checkout_at TIMESTAMPTZ,
    motivo_cancelacion TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.huespedes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    tipo_doc TEXT,
    documento TEXT,
    nacionalidad TEXT,
    telefono TEXT,
    email TEXT,
    visitas INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seguridad: si ya ejecutaste supabase_phase2_security_rls.sql se aplica el mismo
-- aislamiento por empresa (rls_tenant_*); si no, se usa el acceso abierto del esquema maestro.
DO $$
DECLARE
  tbl text;
  tablas text[] := ARRAY['hab_tipos', 'habitaciones', 'reservas', 'huespedes'];
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

CREATE INDEX IF NOT EXISTS idx_habitaciones_empresa ON public.habitaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_reservas_empresa_fechas ON public.reservas(empresa_id, llegada, salida);
CREATE INDEX IF NOT EXISTS idx_huespedes_empresa_doc ON public.huespedes(empresa_id, documento);
