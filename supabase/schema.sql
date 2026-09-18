-- ==============================================================================
-- GLORYPOS BOLIVIA - ESQUEMA DE BASE DE DATOS SUPABASE (POSTGRESQL)
-- Multi-Tenant, Multi-Rubro, Multi-Sucursal con Soporte Offline
-- ==============================================================================

-- 1. TABLA DE EMPRESAS / SUCURSALES
CREATE TABLE IF NOT EXISTS empresas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL DEFAULT 'GLORYPOS BOLIVIA',
  nit_ci TEXT DEFAULT '8472910014',
  rubro TEXT NOT NULL DEFAULT 'ABARROTES', -- 'ABARROTES', 'FERRETERIA', 'FARMACIA', 'ROPA', 'CARNICERIA', 'HELADERIA'
  plan_tipo TEXT DEFAULT 'PRO',
  ciudad TEXT DEFAULT 'Santa Cruz',
  direccion TEXT DEFAULT 'Av. Monseñor Rivero #240',
  telefono TEXT DEFAULT '77012345',
  email TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE CLIENTES
CREATE TABLE IF NOT EXISTS clientes (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  razon_social TEXT NOT NULL,
  nit_ci TEXT DEFAULT '0',
  telefono TEXT,
  direccion TEXT,
  email TEXT,
  saldo_credito NUMERIC(10,2) DEFAULT 0,
  total_compras NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. TABLA DE PRODUCTOS MULTI-RUBRO
CREATE TABLE IF NOT EXISTS productos (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  codigo_barras TEXT,
  nombre TEXT NOT NULL,
  categoria TEXT DEFAULT 'General',
  unidad_medida TEXT DEFAULT 'Unidad',
  foto_url TEXT,
  precio_venta NUMERIC(10,2) NOT NULL DEFAULT 0,
  precio_compra NUMERIC(10,2) DEFAULT 0,
  stock_actual NUMERIC(10,3) DEFAULT 0,
  stock_minimo NUMERIC(10,3) DEFAULT 5,
  tipo_venta TEXT DEFAULT 'UNIDAD', -- 'UNIDAD' o 'PESO'
  lote TEXT,
  fecha_vencimiento DATE,
  principio_activo TEXT,
  tallas JSONB DEFAULT '[]'::jsonb,
  colores JSONB DEFAULT '[]'::jsonb,
  sabores JSONB DEFAULT '[]'::jsonb,
  toppings JSONB DEFAULT '[]'::jsonb,
  presentaciones JSONB DEFAULT '[]'::jsonb,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. TABLA DE VENTAS Y FACTURACIÓN SIAT
CREATE TABLE IF NOT EXISTS ventas (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  correlativo TEXT NOT NULL,
  tipo_documento TEXT DEFAULT 'NOTA_VENTA', -- 'NOTA_VENTA', 'BOLETA', 'FACTURA'
  serie TEXT DEFAULT 'NV001',
  cliente_nombre TEXT DEFAULT 'Clientes Varios',
  cliente_ci_nit TEXT DEFAULT '0',
  metodo_pago TEXT DEFAULT 'EFECTIVO', -- 'EFECTIVO', 'QR', 'TARJETA', 'TRANSFERENCIA'
  num_operacion TEXT,
  descuento_porcentaje NUMERIC(5,2) DEFAULT 0,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0,
  total NUMERIC(10,2) NOT NULL DEFAULT 0,
  monto_recibido NUMERIC(10,2) DEFAULT 0,
  cambio NUMERIC(10,2) DEFAULT 0,
  estado_siat TEXT DEFAULT 'NO_APLICA', -- 'EMITIDA_ONLINE_SIAT', 'EMITIDA_OFFLINE_PROCESANDO', 'ANULADA'
  cuf TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TABLA DE KARDEX (MOVIMIENTOS DE ALMACÉN)
CREATE TABLE IF NOT EXISTS kardex (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  fecha TIMESTAMPTZ DEFAULT NOW(),
  producto_id TEXT,
  producto_nombre TEXT NOT NULL,
  tipo TEXT NOT NULL, -- 'ENTRADA', 'SALIDA', 'AJUSTE', 'MERMA'
  cantidad NUMERIC(10,3) NOT NULL,
  motivo TEXT,
  saldo_nuevo NUMERIC(10,3) NOT NULL,
  costo_unitario NUMERIC(10,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TABLA DE CIERRES DE CAJA Y ARQUEO
CREATE TABLE IF NOT EXISTS caja_chica (
  id TEXT PRIMARY KEY,
  empresa_id TEXT REFERENCES empresas(id) ON DELETE CASCADE,
  fecha_apertura TIMESTAMPTZ DEFAULT NOW(),
  fecha_cierre TIMESTAMPTZ,
  monto_inicial NUMERIC(10,2) DEFAULT 0,
  total_ventas NUMERIC(10,2) DEFAULT 0,
  total_ingresos NUMERIC(10,2) DEFAULT 0,
  total_egresos NUMERIC(10,2) DEFAULT 0,
  saldo_esperado NUMERIC(10,2) DEFAULT 0,
  saldo_real NUMERIC(10,2) DEFAULT 0,
  diferencia NUMERIC(10,2) DEFAULT 0,
  estado TEXT DEFAULT 'ABIERTA', -- 'ABIERTA', 'CERRADA'
  cajero_nombre TEXT DEFAULT 'Carlos Gutiérrez',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ÍNDICES PARA BÚSQUEDA RÁPIDA
CREATE INDEX IF NOT EXISTS idx_productos_empresa ON productos(empresa_id);
CREATE INDEX IF NOT EXISTS idx_productos_codigo ON productos(codigo_barras);
CREATE INDEX IF NOT EXISTS idx_ventas_empresa ON ventas(empresa_id);
CREATE INDEX IF NOT EXISTS idx_ventas_fecha ON ventas(fecha);
CREATE INDEX IF NOT EXISTS idx_kardex_producto ON kardex(producto_id);

-- POLÍTICAS DE SEGURIDAD ROW LEVEL SECURITY (RLS) PARA POS EN TIEMPO REAL
ALTER TABLE empresas ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ventas ENABLE ROW LEVEL SECURITY;
ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE kardex ENABLE ROW LEVEL SECURITY;
ALTER TABLE caja_chica ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Acceso publico empresas" ON empresas;
CREATE POLICY "Acceso publico empresas" ON empresas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico productos" ON productos;
CREATE POLICY "Acceso publico productos" ON productos FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico ventas" ON ventas;
CREATE POLICY "Acceso publico ventas" ON ventas FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico clientes" ON clientes;
CREATE POLICY "Acceso publico clientes" ON clientes FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico kardex" ON kardex;
CREATE POLICY "Acceso publico kardex" ON kardex FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Acceso publico caja_chica" ON caja_chica;
CREATE POLICY "Acceso publico caja_chica" ON caja_chica FOR ALL USING (true) WITH CHECK (true);

-- EMPRESA DEMO INICIAL
INSERT INTO empresas (id, nombre, nit_ci, rubro, plan_tipo, ciudad, direccion, telefono)
VALUES (
  'empresa_activa',
  'GLORYPOS BOLIVIA S.R.L.',
  '8472910014',
  'ABARROTES',
  'PRO',
  'Santa Cruz, Bolivia',
  'Av. Monseñor Rivero #240',
  '77012345'
) ON CONFLICT (id) DO NOTHING;
