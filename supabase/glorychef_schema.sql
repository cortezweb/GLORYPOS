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

ALTER TABLE public.salones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mesas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comandas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.glorychef_recetas ENABLE ROW LEVEL SECURITY;

-- Mismo esquema de acceso que el resto de tablas del proyecto (supabase_master_schema.sql)
DROP POLICY IF EXISTS "Allow public access salones" ON public.salones;
CREATE POLICY "Allow public access salones" ON public.salones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access mesas" ON public.mesas;
CREATE POLICY "Allow public access mesas" ON public.mesas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access comandas" ON public.comandas;
CREATE POLICY "Allow public access comandas" ON public.comandas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access glorychef_recetas" ON public.glorychef_recetas;
CREATE POLICY "Allow public access glorychef_recetas" ON public.glorychef_recetas FOR ALL USING (true) WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_salones_empresa ON public.salones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_mesas_empresa ON public.mesas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_comandas_empresa_estado ON public.comandas(empresa_id, estado);
CREATE INDEX IF NOT EXISTS idx_glorychef_recetas_empresa ON public.glorychef_recetas(empresa_id);
