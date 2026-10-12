// Registro central de módulos del SaaS GLORYPOS.
// Única fuente de verdad para: alta de clientes (SuperAdmin), menús laterales,
// rutas de App.jsx y funciones que cambian según los módulos contratados.

export const ALL_CLIENT_MODULES = [
  { id: 'preventa', label: 'Preventa & Cotizaciones', icon: '📝', desc: 'Cotizaciones, proformas y pedidos' },
  { id: 'ventas', label: 'Ventas & Facturación (POS)', icon: '🛒', desc: 'Caja rápida, facturas SIAT / SUNAT y boletas' },
  { id: 'compras', label: 'Compras & Proveedores', icon: '🛍️', desc: 'Facturas de compras y proveedores' },
  { id: 'clientes', label: 'Directorio de Clientes', icon: '👥', desc: 'Directorio, cuentas y crédito' },
  { id: 'productos', label: 'Productos / Servicios', icon: '🏷️', desc: 'Catálogo con variantes, códigos y precios' },
  { id: 'inventario', label: 'Inventario & Kardex', icon: '📦', desc: 'Stock valorizado y ajustes de merma' },
  { id: 'finanzas', label: 'Finanzas & Caja Chica', icon: '💵', desc: 'Arqueos, movimientos de turno e ingresos/egresos' },
  { id: 'guias_remision', label: 'Guías de Remisión', icon: '🚚', desc: 'Guías de despacho electrónicas' },
  { id: 'comprobantes_pendientes', label: 'Comprobantes Pendientes', icon: '⏳', desc: 'Cola offline y contingencia' },
  { id: 'documentos_avanzados', label: 'Comprobantes Avanzados', icon: '📄', desc: 'Retenciones, percepciones y especiales' },
  { id: 'contabilidad', label: 'Contabilidad & Libros', icon: '🧮', desc: 'Exportación PLE, SIAT y resúmenes' },
  { id: 'reportes', label: 'Reportes & Analíticas', icon: '📊', desc: 'Métricas de ventas, utilidades y Excel' },
  { id: 'tienda_virtual', label: 'Tienda en Línea', icon: '🌐', desc: 'Catálogo online y pedidos WhatsApp' },
  // El id 'restaurante' se mantiene para no romper empresas ya registradas.
  { id: 'restaurante', label: 'GLORYCHEF · Restaurante', icon: '👨‍🍳', desc: 'Mesas, comandas, cocina y recetas ligadas al inventario' },
  { id: 'farmacia', label: 'Farmacia & Botica', icon: '💊', desc: 'Lotes, vencimientos y boticas' },
  { id: 'hoteles', label: 'Hoteles & Hospedajes', icon: '🏨', desc: 'Recepción y habitaciones' },
];

export const GLORYCHEF_MODULE_ID = 'restaurante';
export const TIENDA_MODULE_ID = 'tienda_virtual';

export const MODULE_PRESETS = {
  FULL: {
    name: 'Full Suite (16)',
    ids: ALL_CLIENT_MODULES.map(m => m.id)
  },
  RETAIL: {
    name: 'Comercio / Retail',
    ids: ['preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'reportes', 'tienda_virtual']
  },
  GASTRONOMIA: {
    name: 'GLORYCHEF Restaurante',
    rubro: 'RESTAURANTE',
    ids: ['ventas', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'restaurante', 'reportes']
  },
  FARMACIA: {
    name: 'Farmacia',
    ids: ['ventas', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'farmacia', 'guias_remision', 'reportes']
  },
  HOTEL: {
    name: 'Hoteles',
    ids: ['ventas', 'clientes', 'productos', 'finanzas', 'hoteles', 'reportes']
  },
  FACTURACION: {
    name: 'Facturación Básica',
    ids: ['preventa', 'ventas', 'clientes', 'productos', 'reportes']
  }
};

// Módulos base que todo cliente ve aunque no estén marcados (comportamiento histórico).
export const CORE_MODULES = [
  'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
  'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
  'contabilidad', 'reportes', 'administracion', 'modulos'
];

export const DEFAULT_CLIENT_MODULES = [...CORE_MODULES.filter(m => m !== 'administracion' && m !== 'modulos'), 'tienda_virtual'];

// Vistas (currentView) que pertenecen a un módulo contratable.
// Si el cliente no tiene el módulo, App.jsx muestra la pantalla de "módulo no contratado".
export const VIEW_MODULE_MAP = {
  tienda_virtual: 'tienda_virtual',
  catalogo_online: 'tienda_virtual',
  tienda: 'tienda_virtual',
  ecommerce: 'tienda_virtual',
  pedidos_web: 'tienda_virtual',
  pedidosweb: 'tienda_virtual',
  ventas_pedidosweb: 'tienda_virtual',
  restaurante: 'restaurante',
  chef_mesas: 'restaurante',
  chef_pedidos: 'restaurante',
  chef_cocina: 'restaurante',
  chef_carta: 'restaurante',
  chef_reportes: 'restaurante',
  chef_config: 'restaurante',
  farmacia: 'farmacia',
  hoteles: 'hoteles',
};

export function isSuperAdminSession(tenantSlug, currentUser) {
  return tenantSlug === 'admin' || currentUser?.rol === 'SUPERADMIN' || currentUser?.id === 'usr-admin';
}

export function getEmpresaModules(empresa) {
  return Array.isArray(empresa?.modulos_activos) ? empresa.modulos_activos : DEFAULT_CLIENT_MODULES;
}

export function empresaHasModule(empresa, modId, { tenantSlug, currentUser } = {}) {
  if (isSuperAdminSession(tenantSlug, currentUser)) return true;
  if (CORE_MODULES.includes(modId)) return true;
  return getEmpresaModules(empresa).includes(modId);
}

export function getModuleForView(view) {
  return VIEW_MODULE_MAP[view] || null;
}

export function getModuleLabel(modId) {
  return ALL_CLIENT_MODULES.find(m => m.id === modId)?.label || modId;
}
