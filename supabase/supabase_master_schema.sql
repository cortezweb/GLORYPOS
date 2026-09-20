-- ==============================================================================
-- GLORYPOS BOLIVIA - ESQUEMA COMPLETO Y MIGRACIÓN SUPABASE (POSTGRESQL)
-- Proyecto: https://supabase.com/dashboard/project/zeftqkwnogcrbklolwzs/sql
-- Soporte Multi-Tenant, SaaS, Offline-First y Módulos Avanzados
-- ==============================================================================

-- ── 1. EXTENDER TABLA 'empresas' (MULTI-TENANT & SAAS) ────────────────────────
CREATE TABLE IF NOT EXISTS public.empresas (
    id TEXT PRIMARY KEY,
    nombre TEXT NOT NULL DEFAULT 'GLORYPOS BOLIVIA S.R.L.',
    nit_ci TEXT DEFAULT '8472910014',
    rubro TEXT NOT NULL DEFAULT 'ABARROTES',
    plan_tipo TEXT DEFAULT 'PRO',
    ciudad TEXT DEFAULT 'Santa Cruz',
    direccion TEXT DEFAULT 'Av. Monseñor Rivero #240',
    telefono TEXT DEFAULT '77012345',
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'ACTIVO';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS modulos_activos JSONB DEFAULT '["preventa","ventas","compras","clientes","productos","inventario","finanzas","guias_remision","comprobantes_pendientes","documentos_avanzados","contabilidad","reportes","tienda_virtual","restaurante","farmacia","hoteles"]'::jsonb;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS propietario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dias_prueba INTEGER DEFAULT 30;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS monto_mensual NUMERIC DEFAULT 150;

-- ── 2. TABLA 'usuarios' ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT,
    password TEXT,
    password_hash TEXT,
    pin TEXT,
    pin_hash TEXT,
    rol TEXT DEFAULT 'CAJERO',
    color TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. TABLA 'clientes' ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL,
    nit_ci TEXT DEFAULT '0',
    telefono TEXT,
    direccion TEXT,
    email TEXT,
    saldo_credito NUMERIC(10,2) DEFAULT 0,
    total_compras NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. TABLA 'proveedores' ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.proveedores (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL,
    nit TEXT,
    telefono TEXT,
    ciudad TEXT,
    direccion TEXT,
    contacto TEXT,
    rubro TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. TABLA 'productos' ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.productos (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo_barras TEXT,
    nombre TEXT NOT NULL,
    categoria TEXT DEFAULT 'General',
    unidad_medida TEXT DEFAULT 'Unidad',
    foto_url TEXT,
    precio_venta NUMERIC(10,2) NOT NULL DEFAULT 0,
    precio_compra NUMERIC(10,2) DEFAULT 0,
    stock_actual NUMERIC(10,3) DEFAULT 0,
    stock_minimo NUMERIC(10,3) DEFAULT 5,
    tipo_venta TEXT DEFAULT 'UNIDAD',
    lote TEXT,
    fecha_vencimiento DATE,
    principio_activo TEXT,
    tallas JSONB DEFAULT '[]'::jsonb,
    colores JSONB DEFAULT '[]'::jsonb,
    sabores JSONB DEFAULT '[]'::jsonb,
    toppings JSONB DEFAULT '[]'::jsonb,
    presentaciones JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. TABLA 'ventas' ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ventas (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    correlativo TEXT NOT NULL,
    tipo_documento TEXT DEFAULT 'NOTA_VENTA',
    serie TEXT DEFAULT 'NV001',
    cliente_nombre TEXT DEFAULT 'Clientes Varios',
    cliente_ci_nit TEXT DEFAULT '0',
    metodo_pago TEXT DEFAULT 'EFECTIVO',
    num_operacion TEXT,
    descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
    subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
    total NUMERIC(10,2) NOT NULL DEFAULT 0,
    monto_recibido NUMERIC(10,2) DEFAULT 0,
    cambio NUMERIC(10,2) DEFAULT 0,
    estado_siat TEXT DEFAULT 'NO_APLICA',
    cuf TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 7. TABLA 'compras' ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.compras (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    proveedor_id TEXT,
    proveedor_nombre TEXT,
    proveedor_nit TEXT,
    numero_factura TEXT,
    tipo_documento TEXT DEFAULT 'FACTURA',
    serie TEXT DEFAULT 'F001',
    producto_id TEXT,
    producto_nombre TEXT,
    cantidad NUMERIC DEFAULT 0,
    costo_unitario NUMERIC DEFAULT 0,
    subtotal NUMERIC DEFAULT 0,
    igv NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    incluye_igv BOOLEAN DEFAULT false,
    items JSONB DEFAULT '[]'::jsonb,
    estado_pago TEXT DEFAULT 'CONTADO',
    metodo_pago TEXT DEFAULT 'CONTADO',
    almacen_destino TEXT DEFAULT 'Almacén Principal',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 8. TABLA 'kardex' ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.kardex (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    producto_id TEXT,
    producto_nombre TEXT,
    tipo TEXT NOT NULL,
    cantidad NUMERIC DEFAULT 0,
    motivo TEXT,
    saldo_nuevo NUMERIC DEFAULT 0,
    costo_unitario NUMERIC DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 9. TABLA 'caja_chica' ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.caja_chica (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha_apertura TIMESTAMPTZ DEFAULT now(),
    fecha_cierre TIMESTAMPTZ,
    monto_inicial NUMERIC DEFAULT 0,
    total_ventas NUMERIC DEFAULT 0,
    total_ingresos NUMERIC DEFAULT 0,
    total_egresos NUMERIC DEFAULT 0,
    saldo_esperado NUMERIC DEFAULT 0,
    saldo_real NUMERIC DEFAULT 0,
    diferencia NUMERIC DEFAULT 0,
    estado TEXT DEFAULT 'ABIERTA',
    cajero_nombre TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 10. TABLA 'cotizaciones' ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    correlativo TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_ci_nit TEXT,
    cliente_telefono TEXT,
    validez_dias INTEGER DEFAULT 15,
    condiciones TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    descuento NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT DEFAULT 'Borrador',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 11. TABLA 'membresias' ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.membresias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    cliente_nombre TEXT NOT NULL,
    cliente_doc TEXT,
    plan_nombre TEXT NOT NULL,
    sucursal TEXT DEFAULT 'Principal',
    monto_cuota NUMERIC NOT NULL DEFAULT 0,
    frecuencia TEXT DEFAULT 'Mensual',
    fecha_inicio DATE DEFAULT CURRENT_DATE,
    proximo_cobro DATE,
    estado TEXT DEFAULT 'Activa',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 12. TABLA 'pedidos_web' ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos_web (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    cliente_nombre TEXT NOT NULL,
    telefono TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT DEFAULT 'Nuevo',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS ───────────────────
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_chica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cotizaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membresias ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pedidos_web ENABLE ROW LEVEL SECURITY;

-- ── POLÍTICAS DE ACCESO PÚBLICO RESILIENTE (PWA CLIENT KEY) ───────────────────
DROP POLICY IF EXISTS "Allow public access empresas" ON public.empresas;
CREATE POLICY "Allow public access empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access usuarios" ON public.usuarios;
CREATE POLICY "Allow public access usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access clientes" ON public.clientes;
CREATE POLICY "Allow public access clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access proveedores" ON public.proveedores;
CREATE POLICY "Allow public access proveedores" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access productos" ON public.productos;
CREATE POLICY "Allow public access productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access ventas" ON public.ventas;
CREATE POLICY "Allow public access ventas" ON public.ventas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access compras" ON public.compras;
CREATE POLICY "Allow public access compras" ON public.compras FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access kardex" ON public.kardex;
CREATE POLICY "Allow public access kardex" ON public.kardex FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access caja_chica" ON public.caja_chica;
CREATE POLICY "Allow public access caja_chica" ON public.caja_chica FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access cotizaciones" ON public.cotizaciones;
CREATE POLICY "Allow public access cotizaciones" ON public.cotizaciones FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access membresias" ON public.membresias;
CREATE POLICY "Allow public access membresias" ON public.membresias FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access pedidos_web" ON public.pedidos_web;
CREATE POLICY "Allow public access pedidos_web" ON public.pedidos_web FOR ALL USING (true) WITH CHECK (true);

-- ── ÍNDICES PARA ALTO RENDIMIENTO ────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON public.productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa_fecha ON public.ventas(empresa_id, fecha);
CREATE INDEX IF NOT EXISTS idx_compras_empresa ON public.compras(empresa_id);
CREATE INDEX IF NOT EXISTS idx_cotizaciones_empresa ON public.cotizaciones(empresa_id);
CREATE INDEX IF NOT EXISTS idx_membresias_empresa ON public.membresias(empresa_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_web_empresa ON public.pedidos_web(empresa_id);
