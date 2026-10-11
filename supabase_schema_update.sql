-- ==============================================================================
-- GLORYPOS BOLIVIA - SCRIPT SQL MAESTRO UNIFICADO DE TODAS LAS TABLAS
-- Proyecto Supabase: https://supabase.com/dashboard/project/zeftqkwnogcrbklolwzs/sql
-- Ejecuta este script en el SQL Editor de Supabase para crear o actualizar
-- TODAS las tablas de todas las ventanas del sistema.
-- ==============================================================================

-- ── 1. TABLA 'empresas' (MULTI-TENANT & SAAS) ─────────────────────────────────
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
    slug TEXT UNIQUE,
    estado_suscripcion TEXT DEFAULT 'ACTIVO',
    modulos_activos JSONB DEFAULT '["inicio","dashboard","preventa","ventas","tienda_virtual","compras","clientes","productos","inventario","finanzas","guias_remision","comprobantes_pendientes","documentos_avanzados","contabilidad","reportes","administracion","modulos","restaurante","farmacia","hoteles"]'::jsonb,
    propietario TEXT,
    fecha_inicio TIMESTAMPTZ DEFAULT now(),
    fecha_vencimiento TIMESTAMPTZ,
    dias_prueba INTEGER DEFAULT 30,
    monto_mensual NUMERIC DEFAULT 150,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Asegurar columnas si la tabla ya existía
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS slug TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS estado_suscripcion TEXT DEFAULT 'ACTIVO';
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS modulos_activos JSONB DEFAULT '["inicio","dashboard","preventa","ventas","tienda_virtual","compras","clientes","productos","inventario","finanzas","guias_remision","comprobantes_pendientes","documentos_avanzados","contabilidad","reportes","administracion","modulos"]'::jsonb;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS propietario TEXT;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS fecha_inicio TIMESTAMPTZ DEFAULT now();
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS fecha_vencimiento TIMESTAMPTZ;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS dias_prueba INTEGER DEFAULT 30;
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS monto_mensual NUMERIC DEFAULT 150;

-- ── 2. TABLA 'roles' (ROLES Y PERMISOS) ────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.roles (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    permisos JSONB DEFAULT '[]'::jsonb,
    activo BOOLEAN DEFAULT true,
    es_sistema BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 3. TABLA 'usuarios' ────────────────────────────────────────────────────────
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
    avatar TEXT,
    color TEXT,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 4. TABLA 'clientes' ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.clientes (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    razon_social TEXT NOT NULL,
    nit_ci TEXT DEFAULT '0',
    telefono TEXT,
    direccion TEXT,
    ciudad TEXT,
    email TEXT,
    saldo_credito NUMERIC(10,2) DEFAULT 0,
    total_compras NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 5. TABLA 'proveedores' ────────────────────────────────────────────────────
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
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── 6. TABLA 'productos' ──────────────────────────────────────────────────────
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

-- ── 7. TABLA 'ventas' ─────────────────────────────────────────────────────────
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
    estado TEXT DEFAULT 'EMITIDO',
    estado_siat TEXT DEFAULT 'NO_APLICA',
    cuf TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    despacho_estado TEXT DEFAULT 'ENTREGADO',
    informacion_adicional JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS estado TEXT DEFAULT 'EMITIDO';
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS despacho_estado TEXT DEFAULT 'ENTREGADO';
ALTER TABLE public.ventas ADD COLUMN IF NOT EXISTS informacion_adicional JSONB DEFAULT '{}'::jsonb;

-- ── 8. TABLA 'compras' ────────────────────────────────────────────────────────
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

-- ── 9. TABLA 'kardex' ─────────────────────────────────────────────────────────
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

-- ── 10. TABLA 'caja_chica' ────────────────────────────────────────────────────
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
    tipo TEXT,
    monto NUMERIC,
    motivo TEXT,
    responsable TEXT,
    comprobante TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.caja_chica ADD COLUMN IF NOT EXISTS tipo TEXT;
ALTER TABLE public.caja_chica ADD COLUMN IF NOT EXISTS monto NUMERIC;
ALTER TABLE public.caja_chica ADD COLUMN IF NOT EXISTS motivo TEXT;
ALTER TABLE public.caja_chica ADD COLUMN IF NOT EXISTS responsable TEXT;
ALTER TABLE public.caja_chica ADD COLUMN IF NOT EXISTS comprobante TEXT;

-- ── 11. TABLA 'cotizaciones' ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cotizaciones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    vencimiento TIMESTAMPTZ,
    correlativo TEXT NOT NULL,
    cliente_nombre TEXT NOT NULL,
    cliente_ci_nit TEXT,
    cliente_telefono TEXT,
    validez_dias INTEGER DEFAULT 15,
    condiciones TEXT,
    items JSONB DEFAULT '[]'::jsonb,
    subtotal NUMERIC DEFAULT 0,
    descuento NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT DEFAULT 'Vigente',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 12. TABLA 'membresias' ────────────────────────────────────────────────────
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

-- ── 13. TABLA 'pedidos_web' ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.pedidos_web (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    numero_orden TEXT,
    cliente_nombre TEXT NOT NULL,
    telefono TEXT,
    total NUMERIC NOT NULL DEFAULT 0,
    estado TEXT DEFAULT 'Nuevo',
    items JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 14. TABLA 'unidades_medida' ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.unidades_medida (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    codigo TEXT NOT NULL,
    nombre TEXT NOT NULL,
    simbolo TEXT,
    origen TEXT DEFAULT 'Sistema',
    estado TEXT DEFAULT 'Activa',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 15. TABLA 'transferencias_inventario' ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.transferencias_inventario (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TIMESTAMPTZ DEFAULT now(),
    fecha_display TEXT,
    origen TEXT NOT NULL,
    destino TEXT NOT NULL,
    productos JSONB DEFAULT '[]'::jsonb,
    productos_display TEXT,
    estado TEXT DEFAULT 'Confirmado',
    notas TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 16. TABLA 'sesiones_caja' (FINANZAS) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.sesiones_caja (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    usuario TEXT NOT NULL,
    fecha_apertura TEXT,
    fecha_cierre TEXT,
    balance_apertura NUMERIC(12,2) DEFAULT 0,
    balance_cierre NUMERIC(12,2),
    saldo_actual NUMERIC(12,2) DEFAULT 0,
    estado TEXT DEFAULT 'Abierta',
    arqueo_estado TEXT DEFAULT 'Arqueo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 17. TABLA 'ingresos_caja' (FINANZAS) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.ingresos_caja (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    sesion TEXT,
    categoria TEXT,
    badge_categoria TEXT,
    documento TEXT,
    usuario TEXT,
    metodo_pago TEXT,
    monto NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 18. TABLA 'egresos_caja' (FINANZAS) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.egresos_caja (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    sesion TEXT,
    categoria TEXT,
    badge_categoria TEXT,
    proveedor TEXT,
    documento TEXT,
    usuario TEXT,
    metodo_pago TEXT,
    monto NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 19. TABLA 'cuentas_bancarias' (FINANZAS) ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cuentas_bancarias (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    entidad TEXT,
    numero TEXT,
    tipo TEXT,
    saldo NUMERIC(12,2) DEFAULT 0,
    moneda TEXT DEFAULT 'PEN',
    estado TEXT DEFAULT 'Activa',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 20. TABLA 'cuentas_por_cobrar' (FINANZAS) ────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cuentas_por_cobrar (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    comprobante TEXT,
    cliente_nombre TEXT,
    ruc_nit TEXT,
    fecha_vencimiento TEXT,
    cuotas TEXT,
    total NUMERIC(12,2) DEFAULT 0,
    cobrado NUMERIC(12,2) DEFAULT 0,
    saldo NUMERIC(12,2) DEFAULT 0,
    spot_bn NUMERIC(12,2) DEFAULT 0,
    spot_status TEXT,
    estado TEXT DEFAULT 'Abierta',
    is_vencido BOOLEAN DEFAULT false,
    can_confirm_bn BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 21. TABLA 'cuentas_por_pagar' (FINANZAS) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.cuentas_por_pagar (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    proveedor_nombre TEXT,
    documento TEXT,
    fecha_emision TEXT,
    fecha_vencimiento TEXT,
    estado TEXT DEFAULT 'Pendiente',
    total NUMERIC(12,2) DEFAULT 0,
    pagado NUMERIC(12,2) DEFAULT 0,
    saldo NUMERIC(12,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 22. TABLA 'metodos_pago' (FINANZAS) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.metodos_pago (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    codigo TEXT,
    destino TEXT,
    destino_id TEXT,
    estado TEXT DEFAULT 'Activo',
    is_protected BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 23. TABLA 'guias_remitente' (DESPACHO GRE) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.guias_remitente (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    guia TEXT,
    destinatario TEXT,
    doc_destinatario TEXT,
    siat_code TEXT,
    items_count INTEGER DEFAULT 1,
    estado_siat TEXT DEFAULT 'Registrado',
    partida TEXT,
    llegada TEXT,
    modalidad TEXT,
    conductor TEXT,
    vehiculo TEXT,
    items_desc TEXT,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 24. TABLA 'guias_transportista' (DESPACHO GRE) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.guias_transportista (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    guia TEXT,
    destinatario TEXT,
    doc_destinatario TEXT,
    siat_code TEXT,
    items_count INTEGER DEFAULT 1,
    estado_siat TEXT DEFAULT 'Aceptado',
    remitente TEXT,
    doc_remitente TEXT,
    partida TEXT,
    llegada TEXT,
    modalidad TEXT,
    pagador_flete TEXT,
    items_desc TEXT,
    motivo TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 25. TABLA 'transportistas_gre' (DESPACHO GRE) ────────────────────────────
CREATE TABLE IF NOT EXISTS public.transportistas_gre (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    documento TEXT,
    nombre TEXT NOT NULL,
    mtc TEXT,
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 26. TABLA 'conductores_gre' (DESPACHO GRE) ───────────────────────────────
CREATE TABLE IF NOT EXISTS public.conductores_gre (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    documento TEXT,
    has_star BOOLEAN DEFAULT false,
    nombre TEXT NOT NULL,
    licencia TEXT,
    telefono TEXT,
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 27. TABLA 'vehiculos_gre' (DESPACHO GRE) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS public.vehiculos_gre (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    placa TEXT NOT NULL,
    marca TEXT,
    modelo TEXT,
    cert_habilitacion TEXT,
    estado TEXT DEFAULT 'Activo',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 28. TABLA 'retenciones' (DOCUMENTOS AVANZADOS) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.retenciones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    serie_nro TEXT NOT NULL,
    serie TEXT,
    correlativo TEXT,
    origen TEXT,
    proveedor_nombre TEXT,
    proveedor_doc TEXT,
    retenido NUMERIC(10,2) DEFAULT 0,
    moneda TEXT DEFAULT 'S/',
    tasa_porcentaje NUMERIC(5,2) DEFAULT 3,
    monto_total_comprobante NUMERIC(10,2) DEFAULT 0,
    estado_sunat TEXT DEFAULT 'Registrado',
    sunat_obs TEXT,
    rr TEXT DEFAULT '—',
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 29. TABLA 'percepciones' (DOCUMENTOS AVANZADOS) ──────────────────────────
CREATE TABLE IF NOT EXISTS public.percepciones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    serie_nro TEXT NOT NULL,
    serie TEXT,
    correlativo TEXT,
    origen TEXT,
    sujeto_nombre TEXT,
    sujeto_doc TEXT,
    percibido NUMERIC(10,2) DEFAULT 0,
    moneda TEXT DEFAULT 'S/',
    tasa_porcentaje NUMERIC(5,2) DEFAULT 2,
    monto_total_comprobante NUMERIC(10,2) DEFAULT 0,
    estado_sunat TEXT DEFAULT 'Registrado',
    sunat_obs TEXT,
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── 30. TABLA 'reversiones' (DOCUMENTOS AVANZADOS) ───────────────────────────
CREATE TABLE IF NOT EXISTS public.reversiones (
    id TEXT PRIMARY KEY,
    empresa_id TEXT REFERENCES public.empresas(id) ON DELETE CASCADE,
    fecha TEXT,
    serie_nro TEXT NOT NULL,
    serie TEXT,
    correlativo TEXT,
    origen TEXT,
    sujeto_nombre TEXT,
    sujeto_doc TEXT,
    monto NUMERIC(10,2) DEFAULT 0,
    motivo_reversion TEXT,
    estado_sunat TEXT DEFAULT 'Registrado',
    sunat_obs TEXT,
    observacion TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ── HABILITAR ROW LEVEL SECURITY (RLS) EN TODAS LAS TABLAS ───────────────────
DO $$ 
DECLARE 
  t text;
  tables text[] := ARRAY[
    'empresas', 'roles', 'usuarios', 'clientes', 'proveedores', 'productos',
    'ventas', 'compras', 'kardex', 'caja_chica', 'cotizaciones', 'membresias',
    'pedidos_web', 'unidades_medida', 'transferencias_inventario', 'sesiones_caja',
    'ingresos_caja', 'egresos_caja', 'cuentas_bancarias', 'cuentas_por_cobrar',
    'cuentas_por_pagar', 'metodos_pago', 'guias_remitente', 'guias_transportista',
    'transportistas_gre', 'conductores_gre', 'vehiculos_gre', 'retenciones',
    'percepciones', 'reversiones'
  ];
BEGIN
  FOREACH t IN ARRAY tables LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I;', 'Allow_all_' || t, t);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL USING (true) WITH CHECK (true);', 'Allow_all_' || t, t);
  END LOOP;
END $$;

-- ── ASIGNAR PERMISOS TOTALES A ROLES DE ACCESO CLIENTE ───────────────────────
GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO anon, authenticated, service_role;

-- ── SEMBRAR EMPRESA ACTIVA POR DEFECTO ────────────────────────────────────────
INSERT INTO public.empresas (id, slug, nombre, nit_ci, rubro, plan_tipo, ciudad, direccion, telefono)
VALUES (
  'empresa_activa',
  'admin',
  'GLORYPOS BOLIVIA S.R.L.',
  '8472910014',
  'ABARROTES',
  'PRO',
  'Santa Cruz, Bolivia',
  'Av. Monseñor Rivero #240',
  '77012345'
) ON CONFLICT (id) DO UPDATE SET 
  slug = EXCLUDED.slug,
  nombre = EXCLUDED.nombre;

-- ── SEMBRAR LOS 6 ROLES BASE DE SEGURIDAD ─────────────────────────────────────
INSERT INTO public.roles (id, empresa_id, nombre, descripcion, permisos, activo, es_sistema)
VALUES 
  ('rol-admin', 'empresa_activa', 'Administrador', 'Acceso completo al sistema', '["inicio","dashboard","preventa","ventas","tienda_virtual","compras","clientes","productos","inventario","finanzas","guias_remision","documentos_avanzados","contabilidad","reportes","administracion","modulos"]'::jsonb, true, true),
  ('rol-almacenero', 'empresa_activa', 'Almacenero', 'Gestión de inventario', '["productos","inventario","guias_remision","compras"]'::jsonb, true, true),
  ('rol-cajero', 'empresa_activa', 'Cajero', 'Caja y movimientos', '["ventas","pos","caja","finanzas","clientes"]'::jsonb, true, true),
  ('rol-contador', 'empresa_activa', 'Contador', 'Gestión contable', '["contabilidad","reportes","finanzas","compras","documentos_avanzados"]'::jsonb, true, true),
  ('rol-supervisor', 'empresa_activa', 'Supervisor', 'Supervisión y reportes', '["inicio","dashboard","ventas","reportes","inventario","clientes","caja"]'::jsonb, true, true),
  ('rol-vendedor', 'empresa_activa', 'Vendedor', 'Gestión de ventas y POS', '["pos","ventas","clientes","preventa","tienda_virtual"]'::jsonb, true, true)
ON CONFLICT (id) DO UPDATE SET 
  nombre = EXCLUDED.nombre,
  descripcion = EXCLUDED.descripcion,
  permisos = EXCLUDED.permisos;
