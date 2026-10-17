// Permisos por rol: qué puede ver y hacer cada usuario dentro de su empresa.
// Los permisos de cada rol se editan en Administración > Roles y permisos (tabla `roles`).
// Esto controla la interfaz; el aislamiento entre empresas lo garantiza Supabase (RLS).
import {
  COLUMNA_IZQUIERDA_CATEGORIAS,
  COLUMNA_DERECHA_CATEGORIAS,
  getAllCategoryPermissionIds,
} from '../components/Admin/ModalRol';

export const ALL_PERMISSION_IDS = [
  ...COLUMNA_IZQUIERDA_CATEGORIAS.flatMap(getAllCategoryPermissionIds),
  ...COLUMNA_DERECHA_CATEGORIAS.flatMap(getAllCategoryPermissionIds),
];

const ALMACENERO_PERMISOS = [
  'ver_dashboard',
  'anular_ventas',
  'cambiar_precio_vender',
  'gestionar_inventario',
  'ver_inventario',
  'crear_contactos',
  'editar_contactos',
  'eliminar_contactos',
  'ver_contactos',
  'registrar_arqueo_caja',
  'retenciones_percepciones_reversiones',
  'emitir_nota_debito',
  'anular_venta_nota_credito',
  'emitir_guias_remision',
  'enviar_sunat',
  'ver_reporte_kardex',
  'gestionar_transportistas_flota',
  'ver_transportistas_flota',
  'configurar_tienda_virtual',
  'ver_tienda_virtual_pedidos',
  'gestionar_pedidos_web',
  'editar_config_empresa',
  'ver_config_empresa',
  'activar_desactivar_modulos',
  'registrar_pagos_paquetes',
  'ver_suscripcion_facturacion',
];

export const DEFAULT_ROLES = [
  {
    id: 'rol-admin',
    nombre: 'Administrador',
    descripcion: 'Acceso completo al sistema',
    permisos: ALL_PERMISSION_IDS,
    activo: true,
    esSistema: true,
  },
  {
    id: 'rol-almacenero',
    nombre: 'Almacenero',
    descripcion: 'Gestión de inventario',
    permisos: ALMACENERO_PERMISOS,
    activo: true,
    esSistema: true,
  },
  {
    id: 'rol-cajero',
    nombre: 'Cajero',
    descripcion: 'Caja y movimientos',
    permisos: [
      'ver_dashboard', 'usar_pos', 'crear_ventas', 'ver_ventas',
      'registrar_arqueo_caja', 'cerrar_caja', 'abrir_caja', 'movimientos_caja',
      'ver_caja_bancos', 'ver_productos', 'ver_contactos', 'crear_contactos',
    ],
    activo: true,
    esSistema: true,
  },
  {
    id: 'rol-contador',
    nombre: 'Contador',
    descripcion: 'Gestión contable',
    permisos: [
      'ver_dashboard', 'ver_ventas', 'ver_compras', 'ver_cuentas_cobrar', 'ver_cuentas_pagar',
      'ver_todos_reportes', 'ver_reporte_ventas', 'ver_reporte_compras', 'ver_reporte_caja',
      'ver_reporte_kardex', 'ver_reporte_notas', 'retenciones_percepciones_reversiones',
    ],
    activo: true,
    esSistema: true,
  },
  {
    id: 'rol-supervisor',
    nombre: 'Supervisor',
    descripcion: 'Supervisión y reportes',
    permisos: [
      'ver_dashboard', 'ver_ventas', 'anular_ventas', 'crear_ventas', 'usar_pos',
      'ver_cotizaciones', 'ver_cuentas_cobrar', 'ver_compras', 'ver_cuentas_pagar',
      'ver_productos', 'ver_inventario', 'gestionar_inventario', 'ver_caja_bancos',
      'ver_todos_reportes', 'ver_reporte_ventas', 'ver_reporte_caja',
    ],
    activo: true,
    esSistema: true,
  },
  {
    id: 'rol-vendedor',
    nombre: 'Vendedor',
    descripcion: 'Gestión de ventas y POS',
    permisos: [
      'usar_pos', 'crear_ventas', 'ver_ventas', 'crear_cotizaciones', 'ver_cotizaciones',
      'ver_productos', 'crear_contactos', 'ver_contactos',
    ],
    activo: true,
    esSistema: true,
  },
];

// Nombres con los que el sistema guarda el rol de un usuario → rol por defecto
const ROLE_ALIASES = {
  admin: 'rol-admin',
  administrador: 'rol-admin',
  almacenero: 'rol-almacenero',
  cajero: 'rol-cajero',
  contador: 'rol-contador',
  supervisor: 'rol-supervisor',
  vendedor: 'rol-vendedor',
};

export const normalizeRole = (rol) => String(rol || '').trim().toLowerCase();

// El administrador de la empresa y el Super Admin lo pueden todo
export const isAdminRole = (rol) => ['admin', 'administrador', 'superadmin'].includes(normalizeRole(rol));

// Permiso especial: solo administradores
export const ADMIN_ONLY = '__admin__';

const ID_SET = new Set(ALL_PERMISSION_IDS);

// Un rol guardado con el esquema antiguo (módulos como 'inicio', 'ventas') no sirve: se usa el por defecto
const usaEsquemaActual = (rolRecord) =>
  Array.isArray(rolRecord?.permisos) && rolRecord.permisos.some(p => ID_SET.has(p));

// Devuelve el conjunto de permisos del rol del usuario (o null si es administrador = todos)
export function resolvePermisos(rolName, storedRoles = []) {
  if (isAdminRole(rolName)) return null;
  const key = normalizeRole(rolName);
  const stored = storedRoles.find(r =>
    r.activo !== false && (normalizeRole(r.nombre) === key || r.id === rolName)
  );
  if (stored && usaEsquemaActual(stored)) return new Set(stored.permisos);
  const defId = ROLE_ALIASES[key];
  const def = DEFAULT_ROLES.find(r => r.id === defId);
  return new Set(def ? def.permisos : []);
}

// ── Qué permiso abre cada pantalla (basta con tener uno de la lista) ────────────
const PERMS = {
  ventas: ['ver_ventas'],
  crear_venta: ['crear_ventas'],
  membresias: ['ver_membresias', 'crear_membresias', 'editar_membresias'],
  pedidos_web: ['ver_tienda_virtual_pedidos', 'gestionar_pedidos_web'],
  cxc: ['ver_cuentas_cobrar', 'registrar_cobro_cxc'],
  cotizaciones: ['ver_cotizaciones', 'crear_cotizaciones'],
  caja: ['ver_caja_bancos', 'registrar_arqueo_caja', 'abrir_caja', 'cerrar_caja', 'movimientos_caja', 'ver_reporte_caja'],
  productos: ['ver_productos', 'crear_productos', 'editar_productos'],
  inventario: ['ver_inventario', 'gestionar_inventario', 'ajustar_stock', 'ver_reporte_kardex'],
  contactos: ['ver_contactos', 'crear_contactos', 'editar_contactos'],
  compras: ['ver_compras', 'crear_compras'],
  reportes: [
    'ver_todos_reportes', 'ver_reporte_ventas', 'ver_reporte_productos', 'ver_reporte_caja',
    'ver_reporte_kardex', 'ver_reporte_notas', 'ver_reporte_compras', 'ver_reporte_ventas_producto',
  ],
  suscripcion: ['ver_suscripcion_facturacion', 'registrar_pagos_paquetes'],
  tienda: ['configurar_tienda_virtual', 'ver_tienda_virtual_pedidos', 'gestionar_pedidos_web'],
  finanzas: ['ver_caja_bancos', 'gestionar_caja_bancos', 'ver_cuentas_cobrar', 'ver_cuentas_pagar', 'movimientos_caja', 'abrir_caja', 'cerrar_caja'],
  guias: ['emitir_guias_remision', 'ver_transportistas_flota', 'gestionar_transportistas_flota'],
  pendientes: ['enviar_sunat', 'gestionar_facturacion_electronica', 'crear_ventas'],
  documentos: ['retenciones_percepciones_reversiones', 'gestionar_facturacion_electronica', 'emitir_nota_debito'],
  contabilidad: ['ver_todos_reportes', 'ver_reporte_ventas', 'ver_cuentas_cobrar', 'ver_cuentas_pagar'],
  restaurante: ['usar_pos', 'gestionar_pedidos_web', 'crear_ventas'],
  farmacia: ['usar_pos', 'ver_productos'],
  hoteles: ['crear_ventas', 'ver_ventas'],
  administracion: ['ver_config_empresa', 'editar_config_empresa', 'ver_usuarios', 'crear_usuarios', 'editar_usuarios'],
  usuarios: ['ver_usuarios', 'crear_usuarios', 'editar_usuarios'],
  modulos: ['activar_desactivar_modulos'],
};

const VIEW_PERMS = {};
const add = (views, perms) => views.forEach(v => { VIEW_PERMS[v] = perms; });

add(['pos'], ['usar_pos', 'crear_ventas']);
add(['ventas_comprobantes', 'comprobantes', 'consulta_comprobantes', 'sales', 'ventas_notas', 'notas_venta', 'notas'], PERMS.ventas);
add(['nuevo_comprobante', 'ventas_nuevo'], PERMS.crear_venta);
add(['membresias', 'suscripciones', 'ventas_membresias'], PERMS.membresias);
add(['pedidos_web', 'pedidosweb', 'ventas_pedidosweb'], PERMS.pedidos_web);
add(['cuentas_por_cobrar', 'cuentas_cobrar', 'creditos', 'ventas_cuentas_cobrar'], PERMS.cxc);
add(['ventas_cotizaciones', 'cotizaciones', 'preventa'], PERMS.cotizaciones);
add(['ventas_caja', 'caja_chica', 'caja', 'reporte_cajas', 'reporte_caja'], PERMS.caja);
add(['productos', 'products', 'combos_promociones', 'combos', 'promociones', 'servicios', 'services', 'categorias_marcas', 'categorias', 'marcas', 'unidades_medida', 'unidades', 'unidades-medida'], PERMS.productos);
add(['inventory', 'inventario', 'movimientos', 'inventario_movimientos', 'transferencias', 'inventario_transferencias', 'historial_transferencias', 'inventario_historial_transferencias', 'kardex', 'inventario_kardex'], PERMS.inventario);
add(['clients', 'clientes'], PERMS.contactos);
add(['purchases', 'compras', 'nueva_compra', 'compras_historial', 'proveedores'], PERMS.compras);
add(['reports', 'reportes', 'reporte_ventas', 'reporte_productos', 'ventas_por_producto', 'reporte_ventas_producto', 'reporte_compras', 'reporte_notas', 'notas_credito_debito', 'reporte_kardex', 'reporte_cajas_tab'], PERMS.reportes);
add(['subscription', 'suscripcion', 'planes'], PERMS.suscripcion);
add(['tienda_virtual', 'catalogo_online', 'tienda'], PERMS.tienda);
add(['finanzas', 'sesiones_caja', 'ingresos', 'egresos', 'cuentas_bancarias', 'cuentas_por_cobrar_finanzas', 'cuentas_por_pagar', 'reportes_caja_finanzas', 'metodos_pago'], PERMS.finanzas);
add(['guias_remision', 'guias', 'despacho', 'guias_remitente', 'guias_transportista', 'transportistas_gre', 'transportistas', 'conductores_gre', 'conductores', 'vehiculos_gre', 'vehiculos'], PERMS.guias);
add(['comprobantes_pendientes', 'pendientes'], PERMS.pendientes);
add(['documentos_avanzados', 'documentos', 'retenciones', 'percepciones', 'reversiones'], PERMS.documentos);
add(['contabilidad'], PERMS.contabilidad);
add(['restaurante', 'chef_mesas', 'chef_pedidos', 'chef_cocina', 'chef_carta', 'chef_reportes', 'chef_config'], PERMS.restaurante);
add(['farmacia'], PERMS.farmacia);
add(['hoteles', 'hotel_recepcion', 'hotel_calendario', 'hotel_reservas', 'hotel_limpieza', 'hotel_huespedes', 'hotel_reportes', 'hotel_config'], PERMS.hoteles);
add(['administracion', 'admin', 'configuracion'], PERMS.administracion);
add(['usuarios', 'admin_usuarios'], PERMS.usuarios);
add(['roles_permisos', 'admin_roles'], [ADMIN_ONLY]);
add(['modulos'], PERMS.modulos);

// Permiso (lista "alguno de") para ver un grupo del menú lateral
const GROUP_PERMS = {
  preventa: PERMS.cotizaciones,
  ventas: [...PERMS.ventas, ...PERMS.crear_venta, 'usar_pos', ...PERMS.cxc, ...PERMS.membresias, ...PERMS.pedidos_web, ...PERMS.caja],
  compras: PERMS.compras,
  clientes: PERMS.contactos,
  productos: PERMS.productos,
  inventario: PERMS.inventario,
  finanzas: PERMS.finanzas,
  guias_remision: PERMS.guias,
  comprobantes_pendientes: PERMS.pendientes,
  documentos_avanzados: PERMS.documentos,
  contabilidad: PERMS.contabilidad,
  reportes: PERMS.reportes,
  administracion: PERMS.administracion,
  modulos: PERMS.modulos,
  tienda_virtual: PERMS.tienda,
  restaurante: PERMS.restaurante,
  farmacia: PERMS.farmacia,
  hoteles: PERMS.hoteles,
};

// Pantallas que ve cualquier usuario con sesión
const OPEN_VIEWS = new Set(['inicio']);

export function viewPermissionList(view) {
  return VIEW_PERMS[view] || null;
}

export function groupPermissionList(modId) {
  return GROUP_PERMS[modId] || null;
}

// ¿Tiene el usuario alguno de los permisos? `permisos` null = administrador (todos)
export function hasAnyPermission(permisos, lista) {
  if (permisos === null) return true;
  if (!lista) return true;
  return lista.some(p => p !== ADMIN_ONLY && permisos.has(p));
}

export function canAccessViewWith(permisos, view) {
  if (OPEN_VIEWS.has(view)) return true;
  const lista = VIEW_PERMS[view];
  if (!lista) return true; // pantallas sin regla (p. ej. de la plataforma) las resuelve otra capa
  if (lista.includes(ADMIN_ONLY)) return permisos === null;
  return hasAnyPermission(permisos, lista);
}
