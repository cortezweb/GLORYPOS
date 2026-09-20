-- ==============================================================================
-- GLORYPOS BOLIVIA: MIGRACIÓN SUPABASE CLOUD MULTI-TENANT
-- Copia y ejecuta este script en el SQL Editor de tu Dashboard de Supabase
-- (https://supabase.com/dashboard/project/zeftqkwnogcrbklolwzs/sql)
-- ==============================================================================

-- 1. EXTENDER TABLA 'empresas' CON SOPORTE MULTI-TENANT Y MÓDULOS ACTIVOS
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'ACTIVO';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS modulos_activos JSONB DEFAULT '["preventa","ventas","compras","clientes","productos","inventario","finanzas","guias_remision","comprobantes_pendientes","documentos_avanzados","contabilidad","reportes","tienda_virtual","restaurante","farmacia","hoteles"]'::jsonb;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS propietario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dias_prueba INTEGER DEFAULT 30;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS monto_mensual NUMERIC DEFAULT 150;

-- 2. TABLA 'usuarios' (Para login y asignación de cajeros / administradores)
CREATE TABLE IF NOT EXISTS public.usuarios (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
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

-- 3. TABLA 'compras' (Registro de facturas de compra y proveedores)
CREATE TABLE IF NOT EXISTS public.compras (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    proveedor_id TEXT,
    proveedor_nombre TEXT,
    proveedor_nit TEXT,
    numero_factura TEXT,
    producto_id TEXT,
    producto_nombre TEXT,
    cantidad NUMERIC DEFAULT 0,
    costo_unitario NUMERIC DEFAULT 0,
    total NUMERIC DEFAULT 0,
    estado_pago TEXT DEFAULT 'CONTADO',
    almacen_destino TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. TABLA 'proveedores' (Directorio de proveedores)
CREATE TABLE IF NOT EXISTS public.proveedores (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL,
    nit TEXT,
    telefono TEXT,
    ciudad TEXT,
    direccion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. HABILITAR SEGURIDAD (ROW LEVEL SECURITY) CON PERMISOS COMPLETOS PARA LA CLAVE ANON
ALTER TABLE public.empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.caja_chica ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.compras ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proveedores ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso para API pública de PWA / Clientes
DROP POLICY IF EXISTS "Allow public access empresas" ON public.empresas;
CREATE POLICY "Allow public access empresas" ON public.empresas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access productos" ON public.productos;
CREATE POLICY "Allow public access productos" ON public.productos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access clientes" ON public.clientes;
CREATE POLICY "Allow public access clientes" ON public.clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access ventas" ON public.ventas;
CREATE POLICY "Allow public access ventas" ON public.ventas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access caja_chica" ON public.caja_chica;
CREATE POLICY "Allow public access caja_chica" ON public.caja_chica FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access kardex" ON public.kardex;
CREATE POLICY "Allow public access kardex" ON public.kardex FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access usuarios" ON public.usuarios;
CREATE POLICY "Allow public access usuarios" ON public.usuarios FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access compras" ON public.compras;
CREATE POLICY "Allow public access compras" ON public.compras FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public access proveedores" ON public.proveedores;
CREATE POLICY "Allow public access proveedores" ON public.proveedores FOR ALL USING (true) WITH CHECK (true);
