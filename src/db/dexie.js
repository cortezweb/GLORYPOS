import Dexie from 'dexie';
import { MASTER_PRODUCTS } from './seedMaster';
import { hashText, isAlreadyHashed } from '../utils/crypto';

export const db = new Dexie('GloryPosBoliviaDB');

db.version(2).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total'
});

db.version(3).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo'
});

db.version(4).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo'
});

db.version(5).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, email, pin, rol, nombre'
});

// v6: agrega cola de sincronización offline → nube
db.version(6).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, email, pin, rol, nombre',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v7: soporte multi-tenant (slug en config_empresa, empresa_id en usuarios)
db.version(7).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v8: soporte para membresías y pedidos web
db.version(8).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v9: soporte para catálogo de unidades de medida (SIAT N°03)
db.version(9).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  unidades_medida: 'id, codigo, nombre, simbolo, estado',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v10: soporte para transferencias de inventario
db.version(10).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  unidades_medida: 'id, codigo, nombre, simbolo, estado',
  transferencias_inventario: 'id, fecha, origen, destino, estado',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v11: soporte integral para finanzas (sesiones de caja, ingresos, egresos, cuentas bancarias, cuentas por cobrar, cuentas por pagar, métodos de pago)
db.version(11).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  unidades_medida: 'id, codigo, nombre, simbolo, estado',
  transferencias_inventario: 'id, fecha, origen, destino, estado',
  sesiones_caja: 'id, fecha_apertura, fecha_cierre, usuario, estado, saldo_actual',
  ingresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  egresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  cuentas_bancarias: 'id, nombre, entidad, numero, tipo, saldo, estado',
  cuentas_por_cobrar: 'id, comprobante, cliente_nombre, fecha_vencimiento, estado, saldo',
  cuentas_por_pagar: 'id, proveedor_nombre, documento, fecha_emision, fecha_vencimiento, estado',
  metodos_pago: 'id, nombre, codigo, destino, estado',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v12: soporte integral para Guías de Remisión Electrónica (GRE) y catálogos asociados
db.version(12).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  unidades_medida: 'id, codigo, nombre, simbolo, estado',
  transferencias_inventario: 'id, fecha, origen, destino, estado',
  sesiones_caja: 'id, fecha_apertura, fecha_cierre, usuario, estado, saldo_actual',
  ingresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  egresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  cuentas_bancarias: 'id, nombre, entidad, numero, tipo, saldo, estado',
  cuentas_por_cobrar: 'id, comprobante, cliente_nombre, fecha_vencimiento, estado, saldo',
  cuentas_por_pagar: 'id, proveedor_nombre, documento, fecha_emision, fecha_vencimiento, estado',
  metodos_pago: 'id, nombre, codigo, destino, estado',
  guias_remitente: 'id, fecha, guia, destinatario, estado_siat',
  guias_transportista: 'id, fecha, guia, destinatario, estado_siat',
  transportistas_gre: 'id, documento, nombre, mtc, estado',
  conductores_gre: 'id, documento, nombre, licencia, telefono, estado',
  vehiculos_gre: 'id, placa, marca, modelo, cert_habilitacion, estado',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v13: soporte integral para Comprobantes Avanzados (Retenciones, Percepciones y Reversiones)
db.version(13).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  unidades_medida: 'id, codigo, nombre, simbolo, estado',
  transferencias_inventario: 'id, fecha, origen, destino, estado',
  sesiones_caja: 'id, fecha_apertura, fecha_cierre, usuario, estado, saldo_actual',
  ingresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  egresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  cuentas_bancarias: 'id, nombre, entidad, numero, tipo, saldo, estado',
  cuentas_por_cobrar: 'id, comprobante, cliente_nombre, fecha_vencimiento, estado, saldo',
  cuentas_por_pagar: 'id, proveedor_nombre, documento, fecha_emision, fecha_vencimiento, estado',
  metodos_pago: 'id, nombre, codigo, destino, estado',
  guias_remitente: 'id, fecha, guia, destinatario, estado_siat',
  guias_transportista: 'id, fecha, guia, destinatario, estado_siat',
  transportistas_gre: 'id, documento, nombre, mtc, estado',
  conductores_gre: 'id, documento, nombre, licencia, telefono, estado',
  vehiculos_gre: 'id, placa, marca, modelo, cert_habilitacion, estado',
  retenciones: 'id, fecha, serie_nro, origen, proveedor_nombre, estado_sunat, retenido',
  percepciones: 'id, fecha, serie_nro, origen, sujeto_nombre, estado_sunat, percibido',
  reversiones: 'id, fecha, serie_nro, origen, sujeto_nombre, estado_sunat, monto',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

// v14: soporte integral para Roles y Permisos en Administración
db.version(14).stores({
  catalogo_maestro: 'id, codigo_barras, nombre, categoria',
  productos_tienda: 'id, maestro_id, codigo_barras, nombre, categoria, activo',
  ventas: 'id, fecha, correlativo, tipo_documento, metodo_pago, total',
  config_empresa: 'id, slug',
  clientes: 'id, nit_ci, razon_social, telefono',
  proveedores: 'id, nit, razon_social, telefono',
  compras: 'id, fecha, proveedor_id, total',
  cotizaciones: 'id, fecha, correlativo, cliente_nombre, estado, total',
  movimientos_caja: 'id, fecha, tipo, monto, motivo',
  kardex: 'id, fecha, producto_id, tipo, cantidad, motivo, saldo_nuevo',
  usuarios: 'id, empresa_id, email, pin, rol, nombre',
  membresias: 'id, cliente_nombre, plan_nombre, estado, proximo_cobro',
  pedidos_web: 'id, fecha, cliente_nombre, estado, total',
  unidades_medida: 'id, codigo, nombre, simbolo, estado',
  transferencias_inventario: 'id, fecha, origen, destino, estado',
  sesiones_caja: 'id, fecha_apertura, fecha_cierre, usuario, estado, saldo_actual',
  ingresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  egresos_caja: 'id, fecha, sesion, categoria, usuario, metodo_pago, monto',
  cuentas_bancarias: 'id, nombre, entidad, numero, tipo, saldo, estado',
  cuentas_por_cobrar: 'id, comprobante, cliente_nombre, fecha_vencimiento, estado, saldo',
  cuentas_por_pagar: 'id, proveedor_nombre, documento, fecha_emision, fecha_vencimiento, estado',
  metodos_pago: 'id, nombre, codigo, destino, estado',
  guias_remitente: 'id, fecha, guia, destinatario, estado_siat',
  guias_transportista: 'id, fecha, guia, destinatario, estado_siat',
  transportistas_gre: 'id, documento, nombre, mtc, estado',
  conductores_gre: 'id, documento, nombre, licencia, telefono, estado',
  vehiculos_gre: 'id, placa, marca, modelo, cert_habilitacion, estado',
  retenciones: 'id, fecha, serie_nro, origen, proveedor_nombre, estado_sunat, retenido',
  percepciones: 'id, fecha, serie_nro, origen, sujeto_nombre, estado_sunat, percibido',
  reversiones: 'id, fecha, serie_nro, origen, sujeto_nombre, estado_sunat, monto',
  roles: 'id, nombre, descripcion, permisos, activo',
  sync_queue: '++id, tabla, accion, registro_id, intentos, created_at, synced_at'
});

export async function initDatabase() {
  const masterCount = await db.catalogo_maestro.count();
  if (masterCount === 0) {
    await db.catalogo_maestro.bulkAdd(MASTER_PRODUCTS);
  }

  const tiendaCount = await db.productos_tienda.count();
  if (tiendaCount === 0) {
    const initialShopProducts = [
      {
        id: 'prod-coca-2l',
        maestro_id: 'master-coca-2l',
        codigo_barras: '7771234000018',
        nombre: 'Coca-Cola Original 2L Retornable',
        categoria: 'Bebidas & Gaseosas',
        unidad_medida: 'Botella',
        foto_url: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=400&q=80',
        precio_venta: 11.50,
        precio_compra: 9.50,
        stock_actual: 36,
        stock_minimo: 6,
        activo: true,
        presentaciones: [
          { id: 'u', nombre: 'Unidad', factor: 1, precio: 11.50 },
          { id: 'pack-6', nombre: 'Pack x6', factor: 6, precio: 65.00 },
          { id: 'caja-12', nombre: 'Caja x12', factor: 12, precio: 128.00 }
        ]
      },
      {
        id: 'prod-pacena',
        maestro_id: 'master-pacena-pilsener',
        codigo_barras: '7771234000032',
        nombre: 'Cerveza Paceña Pilsener 710ml',
        categoria: 'Licores & Cervezas',
        unidad_medida: 'Botella',
        foto_url: 'https://images.unsplash.com/photo-1608270190977-841961ee4f14?auto=format&fit=crop&w=400&q=80',
        precio_venta: 15.00,
        precio_compra: 12.00,
        stock_actual: 24,
        stock_minimo: 4,
        activo: true,
        presentaciones: [
          { id: 'u', nombre: 'Unidad', factor: 1, precio: 15.00 },
          { id: 'caja-12', nombre: 'Caja x12', factor: 12, precio: 165.00 }
        ]
      },
      {
        id: 'prod-leche-pil',
        maestro_id: 'master-leche-pil-1l',
        codigo_barras: '7771234000049',
        nombre: 'Leche PIL Entera 1L UHT',
        categoria: 'Lácteos & Huevos',
        unidad_medida: 'Sachet',
        foto_url: 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=400&q=80',
        precio_venta: 6.00,
        precio_compra: 5.20,
        stock_actual: 40,
        stock_minimo: 10,
        activo: true
      },
      {
        id: 'prod-fideo-famosa',
        maestro_id: 'master-fideo-famosa',
        codigo_barras: '7771234000056',
        nombre: 'Fideo Famosa Spaguetti 400g',
        categoria: 'Abarrotes',
        unidad_medida: 'Paquete',
        foto_url: 'https://images.unsplash.com/photo-1612927601601-6638404737ce?auto=format&fit=crop&w=400&q=80',
        precio_venta: 5.50,
        precio_compra: 4.30,
        stock_actual: 20,
        stock_minimo: 5,
        activo: true
      },
      {
        id: 'prod-aceite-fino',
        maestro_id: 'master-aceite-fino-900ml',
        codigo_barras: '7771234000063',
        nombre: 'Aceite Vegetal Fino 900ml',
        categoria: 'Abarrotes',
        unidad_medida: 'Botella',
        foto_url: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=400&q=80',
        precio_venta: 12.00,
        precio_compra: 10.00,
        stock_actual: 15,
        stock_minimo: 3,
        activo: true
      },
      {
        id: 'prod-galleta-mabels',
        maestro_id: 'master-galleta-mabels',
        codigo_barras: '7771234000070',
        nombre: 'Galletas Mabel Moraditas 140g',
        categoria: 'Snacks & Golosinas',
        unidad_medida: 'Paquete',
        foto_url: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=400&q=80',
        precio_venta: 4.50,
        precio_compra: 3.20,
        stock_actual: 18,
        stock_minimo: 4,
        activo: true
      }
    ];
    await db.productos_tienda.bulkAdd(initialShopProducts);
  }

  // Clientes iniciales
  const clientCount = await db.clientes.count();
  if (clientCount === 0) {
    await db.clientes.bulkAdd([
      {
        id: 'cli-1',
        nit_ci: '1028394012',
        razon_social: 'Empresa Constructora Illimani S.R.L.',
        telefono: '77212345',
        ciudad: 'Santa Cruz',
        direccion: 'Av. Banzer 4to Anillo',
        saldo_credito: 0.00,
        total_compras: 3450.00
      },
      {
        id: 'cli-2',
        nit_ci: '4892019',
        razon_social: 'Doña Rosita Mercado',
        telefono: '78054321',
        ciudad: 'Cochabamba',
        direccion: 'Calle Sucre #150',
        saldo_credito: 45.00,
        total_compras: 1280.00
      },
      {
        id: 'cli-3',
        nit_ci: '6120394',
        razon_social: 'Juan Carlos Mamani',
        telefono: '69011223',
        ciudad: 'La Paz',
        direccion: 'Av. 6 de Agosto #890',
        saldo_credito: 0.00,
        total_compras: 620.00
      }
    ]);
  }

  // Proveedores iniciales
  const provCount = await db.proveedores.count();
  if (provCount === 0) {
    await db.proveedores.bulkAdd([
      {
        id: 'prov-cbn',
        nit: '1002345012',
        razon_social: 'Cervecería Boliviana Nacional (CBN)',
        contacto: 'Ramiro Choque',
        telefono: '800104050',
        ciudad: 'La Paz / Santa Cruz',
        rubro: 'Cervezas y Bebidas de Malta'
      },
      {
        id: 'prov-embol',
        nit: '1020304050',
        razon_social: 'Embotelladoras Bolivianas Unidas (EMBOL S.A. - Coca-Cola)',
        contacto: 'Patricia Vaca',
        telefono: '800102030',
        ciudad: 'Santa Cruz',
        rubro: 'Gaseosas y Aguas'
      },
      {
        id: 'prov-pil',
        nit: '1019283014',
        razon_social: 'PIL Andina S.A.',
        contacto: 'Carlos Mercado',
        telefono: '800107452',
        ciudad: 'Cochabamba',
        rubro: 'Lácteos y Derivados'
      },
      {
        id: 'prov-fino',
        nit: '1029384756',
        razon_social: 'Industrias de Aceite S.A. (Fino)',
        contacto: 'Fernando Paz',
        telefono: '800103466',
        ciudad: 'Santa Cruz',
        rubro: 'Aceites y Mantecas'
      },
      {
        id: 'prov-famosa',
        nit: '1038475619',
        razon_social: 'Molinera Famosa S.A.',
        contacto: 'Silvia Morales',
        telefono: '800108990',
        ciudad: 'Santa Cruz',
        rubro: 'Fideos, Pastas y Harinas'
      }
    ]);
  }

  const config = await db.config_empresa.get('empresa_activa');
  if (!config) {
    const hoy = new Date();
    const vencimiento = new Date();
    vencimiento.setDate(hoy.getDate() + 30);

    await db.config_empresa.put({
      id: 'empresa_activa',
      slug: 'admin',
      nombre: 'Minimarket & Abarrotes El Prado',
      nit_ci: '8472910014',
      propietario: 'Carlos Gutiérrez',
      ciudad: 'Santa Cruz, Bolivia',
      direccion: 'Av. Monseñor Rivero #240',
      telefono: '77012345',
      plan_tipo: 'TRIAL',
      dias_prueba: 30,
      fecha_inicio: hoy.toISOString(),
      fecha_vencimiento: vencimiento.toISOString(),
      estado_suscripcion: 'ACTIVO'
    });
  } else if (!config.slug) {
    await db.config_empresa.update('empresa_activa', { slug: 'admin' });
  }

  // Ventas iniciales de demostración
  const salesCount = await db.ventas.count();
  if (salesCount === 0) {
    await db.ventas.bulkAdd([
      {
        id: 'vta-001',
        fecha: new Date(Date.now() - 3600000 * 2).toISOString(),
        correlativo: 'F-000104',
        tipo_documento: 'FACTURA_SIAT',
        tipo_label: 'Factura Electrónica SIAT',
        cuf: '4A7B8C9D0E1F2A3B4C5D6E7F8A9B0C1D2E3F4A5B6C7D8E9F',
        cliente_nombre: 'Empresa Constructora Illimani S.R.L.',
        cliente_ci_nit: '1028394012',
        metodo_pago: 'QR Simple',
        items: [
          { producto_id: 'prod-pacena', nombre: 'Cerveza Paceña Pilsener 710ml', cantidad: 6, precio: 15.00, subtotal: 90.00 },
          { producto_id: 'prod-coca-2l', nombre: 'Coca-Cola Original 2L Retornable', cantidad: 4, precio: 11.50, subtotal: 46.00 }
        ],
        subtotal: 136.00,
        descuento: 0,
        total: 136.00,
        monto_recibido: 136.00,
        cambio: 0,
        estado: 'EMITIDO'
      },
      {
        id: 'vta-002',
        fecha: new Date(Date.now() - 3600000 * 5).toISOString(),
        correlativo: 'B-000421',
        tipo_documento: 'BOLETA',
        tipo_label: 'Boleta de Venta',
        cliente_nombre: 'Doña Rosita Mercado',
        cliente_ci_nit: '4892019',
        metodo_pago: 'Efectivo',
        items: [
          { producto_id: 'prod-aceite-fino', nombre: 'Aceite Vegetal Fino 900ml', cantidad: 2, precio: 12.00, subtotal: 24.00 },
          { producto_id: 'prod-fideo-famosa', nombre: 'Fideo Famosa Spaguetti 400g', cantidad: 3, precio: 5.50, subtotal: 16.50 },
          { producto_id: 'prod-leche-pil', nombre: 'Leche PIL Entera 1L UHT', cantidad: 2, precio: 6.00, subtotal: 12.00 }
        ],
        subtotal: 52.50,
        descuento: 0,
        total: 52.50,
        monto_recibido: 60.00,
        cambio: 7.50,
        estado: 'EMITIDO'
      },
      {
        id: 'vta-003',
        fecha: new Date(Date.now() - 3600000 * 8).toISOString(),
        correlativo: 'NV-00089',
        tipo_documento: 'NOTA_VENTA',
        tipo_label: 'Nota de Venta',
        cliente_nombre: 'Juan Carlos Mamani',
        cliente_ci_nit: '6120394',
        metodo_pago: 'Efectivo',
        items: [
          { producto_id: 'prod-galleta-mabels', nombre: 'Galletas Mabel Moraditas 140g', cantidad: 4, precio: 4.50, subtotal: 18.00 }
        ],
        subtotal: 18.00,
        descuento: 0,
        total: 18.00,
        monto_recibido: 20.00,
        cambio: 2.00,
        estado: 'PAGADO',
        despacho_estado: 'ENTREGADO'
      },
      {
        id: 'vta-004',
        fecha: new Date(Date.now() - 86400000).toISOString(),
        correlativo: 'NV-00088',
        tipo_documento: 'NOTA_VENTA',
        tipo_label: 'Nota de Venta',
        cliente_nombre: 'Distribuidora San Martin',
        cliente_ci_nit: '3491028',
        metodo_pago: 'Por Cobrar',
        items: [
          { producto_id: 'prod-pacena', nombre: 'Cerveza Paceña Pilsener 710ml (Caja x12)', cantidad: 2, precio: 165.00, subtotal: 330.00 }
        ],
        subtotal: 330.00,
        descuento: 0,
        total: 330.00,
        monto_recibido: 0,
        cambio: 0,
        estado: 'PENDIENTE',
        despacho_estado: 'PENDIENTE'
      }
    ]);
  }

  // Cotizaciones iniciales
  const cotCount = await db.cotizaciones.count();
  if (cotCount === 0) {
    await db.cotizaciones.bulkAdd([
      {
        id: 'cot-101',
        fecha: new Date(Date.now() - 86400000).toISOString(),
        vencimiento: new Date(Date.now() + 86400000 * 14).toISOString(),
        correlativo: 'COT-00101',
        cliente_nombre: 'Empresa Constructora Illimani S.R.L.',
        cliente_ci_nit: '1028394012',
        cliente_telefono: '77212345',
        estado: 'VIGENTE',
        items: [
          { producto_id: 'prod-coca-2l', nombre: 'Coca-Cola Original 2L Retornable (Caja x12)', cantidad: 5, precio: 128.00, subtotal: 640.00 },
          { producto_id: 'prod-pacena', nombre: 'Cerveza Paceña Pilsener 710ml (Caja x12)', cantidad: 4, precio: 165.00, subtotal: 660.00 }
        ],
        subtotal: 1300.00,
        descuento: 50.00,
        total: 1250.00,
        validez_dias: 15,
        condiciones: 'Precios en Bolivianos, entrega en almacén central. Validez 15 días.'
      },
      {
        id: 'cot-102',
        fecha: new Date().toISOString(),
        vencimiento: new Date(Date.now() + 86400000 * 7).toISOString(),
        correlativo: 'COT-00102',
        cliente_nombre: 'Doña Rosita Mercado',
        cliente_ci_nit: '4892019',
        cliente_telefono: '78054321',
        estado: 'VIGENTE',
        items: [
          { producto_id: 'prod-aceite-fino', nombre: 'Aceite Vegetal Fino 900ml', cantidad: 10, precio: 12.00, subtotal: 120.00 },
          { producto_id: 'prod-fideo-famosa', nombre: 'Fideo Famosa Spaguetti 400g', cantidad: 20, precio: 5.50, subtotal: 110.00 }
        ],
        subtotal: 230.00,
        descuento: 10.00,
        total: 220.00,
        validez_dias: 7,
        condiciones: 'Pago al contado contra entrega.'
      }
    ]);
  }

  // Movimientos de Caja Chica
  const movCount = await db.movimientos_caja.count();
  if (movCount === 0) {
    await db.movimientos_caja.bulkAdd([
      {
        id: 'mov-1',
        fecha: new Date(Date.now() - 3600000 * 6).toISOString(),
        tipo: 'APERTURA',
        monto: 300.00,
        motivo: 'Fondo Inicial de Caja (Apertura de Turno)',
        responsable: 'Carlos Gutiérrez',
        comprobante: 'AP-001'
      },
      {
        id: 'mov-2',
        fecha: new Date(Date.now() - 3600000 * 4).toISOString(),
        tipo: 'EGRESO',
        monto: 35.00,
        motivo: 'Compra de rollos térmicos 80mm y bolsas plásticas',
        responsable: 'Carlos Gutiérrez',
        comprobante: 'REC-084'
      },
      {
        id: 'mov-3',
        fecha: new Date(Date.now() - 3600000 * 3).toISOString(),
        tipo: 'INGRESO',
        monto: 50.00,
        motivo: 'Cobro de saldo crédito cliente Doña Rosita',
        responsable: 'Carlos Gutiérrez',
        comprobante: 'REC-085'
      }
    ]);
  }

  // Kardex inicial de demostración
  const kardexCount = await db.kardex.count();
  if (kardexCount === 0) {
    await db.kardex.bulkAdd([
      {
        id: 'kdx-001',
        fecha: new Date(Date.now() - 3600000 * 1.5).toISOString(),
        producto_id: 'prod-coca-2l',
        producto_nombre: 'Coca-Cola Original 2L Retornable',
        tipo: 'SALIDA',
        cantidad: 2,
        motivo: 'Venta Boleta B001-00249',
        saldo_nuevo: 36,
        costo_unitario: 9.50
      },
      {
        id: 'kdx-002',
        fecha: new Date(Date.now() - 86400000).toISOString(),
        producto_id: 'prod-leche-pil',
        producto_nombre: 'Leche PIL Entera 1L UHT',
        tipo: 'ENTRADA',
        cantidad: 24,
        motivo: 'Ingreso Factura Compra F002-8812 - PIL Andina',
        saldo_nuevo: 40,
        costo_unitario: 5.20
      },
      {
        id: 'kdx-003',
        fecha: new Date(Date.now() - 86400000 * 2).toISOString(),
        producto_id: 'prod-galleta-mabels',
        producto_nombre: 'Galletas Mabel Moraditas 140g',
        tipo: 'MERMA',
        cantidad: 1,
        motivo: 'Ajuste por Merma / Empaque Dañado',
        saldo_nuevo: 18,
        costo_unitario: 3.20
      }
    ]);
  }

  // ─── Usuarios con contraseñas hasheadas (SHA-256) ───────────────────────────
  // Si existen usuarios legacy con contraseñas en texto plano, los migramos.
  const existingUsers = await db.usuarios.toArray();
  const needsRehash = existingUsers.some(u => !isAlreadyHashed(u.password || '') || !isAlreadyHashed(u.pin || ''));

  if (existingUsers.length === 0 || needsRehash) {
    // Borrar usuarios legacy de demo (nunca tienen ventas reales)
    const demoIds = ['usr-admin', 'usr-carlos', 'usr-maria'];
    await db.usuarios.where('id').anyOf(demoIds).delete();

    // Re-sembrar con hashes
    const [hashAdmin, hashCarlos, hashMaria, hashPin1234, hashPin0000, hashPin4321] = await Promise.all([
      hashText('admin'), hashText('caja'), hashText('123'),
      hashText('1234'), hashText('0000'), hashText('4321')
    ]);

    await db.usuarios.bulkPut([
      {
        id: 'usr-admin',
        empresa_id: 'empresa_activa',
        nombre: 'Administrador General',
        email: 'admin@glorypos.bo',
        password: hashAdmin,
        pin: hashPin1234,
        rol: 'ADMIN',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
        color: 'from-blue-600 to-indigo-600',
        activo: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-carlos',
        empresa_id: 'empresa_activa',
        nombre: 'Carlos Gutiérrez',
        email: 'carlos@glorypos.bo',
        password: hashCarlos,
        pin: hashPin0000,
        rol: 'CAJERO',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=200&q=80',
        color: 'from-emerald-600 to-teal-600',
        activo: true,
        created_at: new Date().toISOString()
      },
      {
        id: 'usr-maria',
        empresa_id: 'empresa_activa',
        nombre: 'María Fernández',
        email: 'maria@glorypos.bo',
        password: hashMaria,
        pin: hashPin4321,
        rol: 'VENDEDOR',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=200&q=80',
        color: 'from-purple-600 to-pink-600',
        activo: true,
        created_at: new Date().toISOString()
      }
    ]);
  }

  // ─── Transferencias de Inventario (Seed exacto al screenshot) ───────────────
  if (db.transferencias_inventario) {
    const trfCount = await db.transferencias_inventario.count();
    if (trfCount === 0) {
      await db.transferencias_inventario.bulkAdd([
        {
          id: 'trf-1',
          fecha: '2026-09-16T13:30:01',
          fechaDisplay: '16/9/2026, 1:30:01 p.m.',
          origen: 'Principal',
          destino: 'ALMACEN',
          productos: [{ id: 'prod-seed-1', nombre: 'Fresa', cantidad: 7, presentacion: 'Unidad' }],
          productosDisplay: '× 7',
          estado: 'Confirmado',
          notas: 'Traslado de reposición de tienda a almacén'
        },
        {
          id: 'trf-2',
          fecha: '2026-09-13T19:22:10',
          fechaDisplay: '13/9/2026, 7:22:10 p.m.',
          origen: 'Principal',
          destino: 'ALMACEN',
          productos: [
            { id: 'prod-seed-2', nombre: 'Boxer', cantidad: 25, presentacion: 'Unidad' },
            { id: 'prod-seed-6', nombre: 'Bolsa para basura grande', cantidad: 30, presentacion: 'Paquete' },
            { id: 'prod-seed-7', nombre: 'Vaso plástico PET 16 oz', cantidad: 40, presentacion: 'Ciento' }
          ],
          productosDisplay: '× 25  × 30  × 40',
          estado: 'Confirmado',
          notas: 'Traslado múltiple de insumos'
        },
        {
          id: 'trf-3',
          fecha: '2026-08-06T15:48:15',
          fechaDisplay: '6/8/2026, 3:48:15 p.m.',
          origen: 'Principal',
          destino: 'ALMACEN',
          productos: [{ id: 'prod-seed-3', nombre: 'Escurridor plástico para vajilla', cantidad: 5, presentacion: 'Unidad' }],
          productosDisplay: '× 5',
          estado: 'Confirmado',
          notas: 'Reposición programada'
        },
        {
          id: 'trf-4',
          fecha: '2026-08-06T15:45:58',
          fechaDisplay: '6/8/2026, 3:45:58 p.m.',
          origen: 'Principal',
          destino: 'ALMACEN',
          productos: [{ id: 'prod-seed-4', nombre: 'Colador plástico mediano', cantidad: 3, presentacion: 'Unidad' }],
          productosDisplay: '× 3',
          estado: 'Confirmado',
          notas: 'Traslado por solicitud de inventario'
        },
        {
          id: 'trf-5',
          fecha: '2026-08-06T15:41:05',
          fechaDisplay: '6/8/2026, 3:41:05 p.m.',
          origen: 'Principal',
          destino: 'ALMACEN',
          productos: [{ id: 'prod-seed-5', nombre: 'Balde plástico 20 litros', cantidad: 5, presentacion: 'Unidad' }],
          productosDisplay: '× 5',
          estado: 'Confirmado',
          notas: 'Traslado inicial'
        }
      ]);
    }
  }

  // ─── Sesiones de Caja (Seed exacto al screenshot media_1789926081566.png) ──
  if (db.sesiones_caja) {
    const scCount = await db.sesiones_caja.count();
    if (scCount === 0) {
      await db.sesiones_caja.bulkAdd([
        { id: 'ses-1', usuario: 'Esteffany Cordova', fecha_apertura: '17/9/2026, 22:18:32', fecha_cierre: '—', balance_apertura: 0.00, balance_cierre: null, saldo_actual: 762.60, estado: 'Abierta', arqueo_estado: 'Arqueo' },
        { id: 'ses-2', usuario: 'Esteffany Cordova', fecha_apertura: '17/9/2026, 16:31:07', fecha_cierre: '17/9/2026, 17:49:17', balance_apertura: 2000.00, balance_cierre: 2968.80, saldo_actual: 1368.80, estado: 'Cerrada', arqueo_estado: 'Ver arqueo' },
        { id: 'ses-3', usuario: 'Esteffany Cordova', fecha_apertura: '7/9/2026, 12:59:11', fecha_cierre: '17/9/2026, 16:29:54', balance_apertura: 20.00, balance_cierre: 36553.35, saldo_actual: 81026.71, estado: 'Cerrada', arqueo_estado: 'Ver arqueo' },
        { id: 'ses-4', usuario: 'Esteffany Cordova', fecha_apertura: '4/9/2026, 18:31:49', fecha_cierre: '7/9/2026, 12:33:49', balance_apertura: 10.00, balance_cierre: 638.29, saldo_actual: 11455.88, estado: 'Cerrada', arqueo_estado: 'Hacer arqueo' },
        { id: 'ses-5', usuario: 'Esteffany Cordova', fecha_apertura: '3/9/2026, 10:28:30', fecha_cierre: '4/9/2026, 18:31:27', balance_apertura: 280.00, balance_cierre: 3465.58, saldo_actual: 3465.58, estado: 'Cerrada', arqueo_estado: 'Hacer arqueo' },
        { id: 'ses-6', usuario: 'Esteffany Cordova', fecha_apertura: '2/9/2026, 22:19:14', fecha_cierre: '3/9/2026, 10:28:10', balance_apertura: 300.00, balance_cierre: 2321.01, saldo_actual: 2321.01, estado: 'Cerrada', arqueo_estado: 'Hacer arqueo' },
        { id: 'ses-7', usuario: 'Esteffany Cordova', fecha_apertura: '1/9/2026, 12:51:04', fecha_cierre: '2/9/2026, 22:19:01', balance_apertura: 3000.00, balance_cierre: 3000.00, saldo_actual: 4019.51, estado: 'Cerrada', arqueo_estado: 'Ver arqueo' },
        { id: 'ses-8', usuario: 'Esteffany Cordova', fecha_apertura: '29/8/2026, 23:36:07', fecha_cierre: '1/9/2026, 12:50:01', balance_apertura: 200.00, balance_cierre: 6393.25, saldo_actual: 6393.25, estado: 'Cerrada', arqueo_estado: 'Hacer arqueo' },
        { id: 'ses-9', usuario: 'Esteffany Cordova', fecha_apertura: '29/8/2026, 13:24:57', fecha_cierre: '29/8/2026, 23:35:59', balance_apertura: 2000.00, balance_cierre: 2000.00, saldo_actual: 2012.90, estado: 'Cerrada', arqueo_estado: 'Ver arqueo' },
        { id: 'ses-10', usuario: 'Administrador', fecha_apertura: '19/8/2026, 13:18:02', fecha_cierre: '—', balance_apertura: 10.00, balance_cierre: null, saldo_actual: 712.01, estado: 'Abierta', arqueo_estado: 'Arqueo' },
        { id: 'ses-11', usuario: 'Administrador', fecha_apertura: '18/8/2026, 13:40:26', fecha_cierre: '18/8/2026, 13:48:12', balance_apertura: 100.00, balance_cierre: 134.00, saldo_actual: 134.00, estado: 'Cerrada', arqueo_estado: 'Ver arqueo' },
        { id: 'ses-12', usuario: 'Esteffany Cordova', fecha_apertura: '6/8/2026, 15:01:42', fecha_cierre: '29/8/2026, 12:50:59', balance_apertura: 150.00, balance_cierre: 106866.21, saldo_actual: 106866.21, estado: 'Cerrada', arqueo_estado: 'Hacer arqueo' },
        { id: 'ses-13', usuario: 'Esteffany Cordova', fecha_apertura: '13/7/2026, 16:37:23', fecha_cierre: '6/8/2026, 15:01:34', balance_apertura: 10.00, balance_cierre: 2488.86, saldo_actual: 130380.87, estado: 'Cerrada', arqueo_estado: 'Ver arqueo' },
        { id: 'ses-14', usuario: 'Administrador', fecha_apertura: '7/7/2026, 11:08:34', fecha_cierre: '18/8/2026, 13:40:05', balance_apertura: 0.00, balance_cierre: 4518.81, saldo_actual: 4518.81, estado: 'Cerrada', arqueo_estado: 'Hacer arqueo' }
      ]);
    }
  }

  // ─── Egresos de Caja (Seed exacto al screenshot media_1789926081553.png) ────
  if (db.egresos_caja) {
    const egCount = await db.egresos_caja.count();
    if (egCount === 0) {
      await db.egresos_caja.bulkAdd([
        { id: 'eg-1', fecha: '17/9/2026, 16:39:32', sesion: '#17', categoria: 'Otro egreso', proveedor: '—', documento: 'PIDIO QUE SE DE EN EFECTIVO Y YAPEO', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 150.00 },
        { id: 'eg-2', fecha: '17/9/2026, 16:38:07', sesion: '#17', categoria: 'Gasto', proveedor: 'PAGO DE 3 BOLSAS', documento: 'PAGO DE BOLSA', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 45.00 },
        { id: 'eg-3', fecha: '16/9/2026, 12:46:59', sesion: '#14', categoria: 'Anulación venta', badgeCategoria: 'Venta', proveedor: '—', documento: 'F001-00000321', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 33.50 },
        { id: 'eg-4', fecha: '14/9/2026, 22:07:51', sesion: '#14', categoria: 'Gasto', proveedor: '2 PER', documento: 'DESAY', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 21.00 },
        { id: 'eg-5', fecha: '14/9/2026, 22:06:46', sesion: '#14', categoria: 'Devolución por nota de crédito', badgeCategoria: 'Venta', proveedor: '—', documento: 'B001-00000718', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 30.00 },
        { id: 'eg-6', fecha: '18/8/2026, 13:44:41', sesion: '#5', categoria: 'Egreso manual', proveedor: '—', documento: 'Sin referencia', usuario: 'Administrador', metodo_pago: 'Efectivo', monto: 10.00 },
        { id: 'eg-7', fecha: '18/8/2026, 13:34:10', sesion: '#1', categoria: 'Anulación venta', badgeCategoria: 'Venta', proveedor: '—', documento: 'NV001-00000289', usuario: 'Administrador', metodo_pago: 'Efectivo', monto: 10.00 },
        { id: 'eg-8', fecha: '6/8/2026, 15:01:16', sesion: '#2', categoria: 'Devolución por anulación', badgeCategoria: 'Venta', proveedor: '—', documento: 'B001-00000002', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 21.75 },
        { id: 'eg-9', fecha: '17/9/2026, 16:38:58', sesion: '#17', categoria: 'Pago a proveedor', proveedor: 'ADELANTO PARA POLOS A MANUEL.. DEL PEDIDO 550', documento: 'ADELANTO PARA POLOS', usuario: 'Esteffany Cordova', metodo_pago: 'Transferencia', monto: 1500.00 },
        { id: 'eg-10', fecha: '16/9/2026, 12:52:42', sesion: '#14', categoria: 'Anulación venta', proveedor: 'CASAS MEJIA RAFAEL FERNANDO', documento: 'F001-00000328', usuario: 'Esteffany Cordova', metodo_pago: 'Yape', monto: 103.60 },
        { id: 'eg-11', fecha: '16/9/2026, 12:50:39', sesion: '#14', categoria: 'Anulación venta', proveedor: 'BASHUA S.A.C.', documento: 'F001-00000329', usuario: 'Esteffany Cordova', metodo_pago: 'Yape', monto: 880.25 },
        { id: 'eg-12', fecha: '16/9/2026, 12:50:02', sesion: '#14', categoria: 'Compra', badgeCategoria: 'Compra', proveedor: 'CORPORACION INDUSTRIAL PSG E.I.R.L.', documento: 'E001-458', usuario: 'Esteffany Cordova', metodo_pago: 'Yape', monto: 17511.66 },
        { id: 'eg-13', fecha: '4/9/2026, 18:29:45', sesion: '#11', categoria: 'Devolución por nota de crédito', badgeCategoria: 'Venta', proveedor: '—', documento: 'F001-00000264', usuario: 'Esteffany Cordova', metodo_pago: 'Tarjeta', monto: 89.80 },
        { id: 'eg-14', fecha: '18/8/2026, 13:31:32', sesion: '#1', categoria: 'Anulación venta', proveedor: 'Público en general', documento: 'B001-00000342', usuario: 'Administrador', metodo_pago: 'Yape', monto: 10.00 }
      ]);
    }
  }

  // ─── Ingresos de Caja (Seed exacto al screenshot media_1789926081562.png) ───
  if (db.ingresos_caja) {
    const ingCount = await db.ingresos_caja.count();
    if (ingCount === 0) {
      await db.ingresos_caja.bulkAdd([
        { id: 'ing-1', fecha: '20/9/2026, 2:57:07', sesion: '#18', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'CT-00000002', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 30.40 },
        { id: 'ing-2', fecha: '18/9/2026, 14:01:19', sesion: '#18', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000457', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 54.90 },
        { id: 'ing-3', fecha: '18/9/2026, 13:48:31', sesion: '#18', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'B001-00000790', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 145.05 },
        { id: 'ing-4', fecha: '17/9/2026, 22:32:00', sesion: '#18', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000466', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 496.25 },
        { id: 'ing-5', fecha: '17/9/2026, 17:12:10', sesion: '#17', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'F001-00000337', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 303.30 },
        { id: 'ing-6', fecha: '17/9/2026, 17:10:06', sesion: '#17', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000465', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 80.50 },
        { id: 'ing-7', fecha: '17/9/2026, 16:37:45', sesion: '#17', categoria: 'Otro ingreso', documento: 'OP 328691', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 580.00 },
        { id: 'ing-8', fecha: '17/9/2026, 12:44:42', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000464', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 53.40 },
        { id: 'ing-9', fecha: '17/9/2026, 11:22:46', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'B001-00000789', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 3155.60 },
        { id: 'ing-10', fecha: '17/9/2026, 11:20:10', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'F001-00000336', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 1066.80 },
        { id: 'ing-11', fecha: '17/9/2026, 9:29:40', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'B001-00000788', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 12.00 },
        { id: 'ing-12', fecha: '17/9/2026, 7:59:44', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'F001-00000334', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 1007.50 },
        { id: 'ing-13', fecha: '17/9/2026, 7:50:48', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000461', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 123.60 },
        { id: 'ing-14', fecha: '17/9/2026, 7:18:00', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000459', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 52.56 },
        { id: 'ing-15', fecha: '17/9/2026, 7:11:34', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'B001-00000768', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 102.43 },
        { id: 'ing-16', fecha: '16/9/2026, 20:53:06', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000458', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 119.00 },
        { id: 'ing-17', fecha: '16/9/2026, 18:30:47', sesion: '#14', categoria: 'Venta', badgeCategoria: 'Venta', documento: 'NV001-00000457', usuario: 'Esteffany Cordova', metodo_pago: 'Efectivo', monto: 210.00 }
      ]);
    }
  }

  // ─── Cuentas Bancarias (Seed exacto al screenshot media_1789926163888.png) ──
  if (db.cuentas_bancarias) {
    const cbCount = await db.cuentas_bancarias.count();
    if (cbCount === 0) {
      await db.cuentas_bancarias.bulkAdd([
        { id: 'cb-1', nombre: 'Cuenta bancaria', entidad: 'BCP', numero: '5467461313584864', tipo: 'Bancaria', saldo: 24063.00, moneda: 'PEN', estado: 'Activa' },
        { id: 'cb-2', nombre: 'Terminal tarjetas', entidad: 'POS Niubiz/Izipay', numero: 'POS-01', tipo: 'Tarjeta', saldo: 8471.61, moneda: 'PEN', estado: 'Activa' },
        { id: 'cb-3', nombre: 'Billetera Plin', entidad: 'Plin', numero: 'Billetera', tipo: 'Billetera', saldo: 96337.51, moneda: 'PEN', estado: 'Activa' },
        { id: 'cb-4', nombre: 'Billetera Yape', entidad: 'Yape', numero: '9358865187', tipo: 'Billetera', saldo: 211415.07, moneda: 'PEN', estado: 'Activa' }
      ]);
    }
  }

  // ─── Cuentas por Cobrar (Seed exacto al screenshot media_1789925791170.png) ─
  if (db.cuentas_por_cobrar) {
    const cpcCount = await db.cuentas_por_cobrar.count();
    if (cpcCount === 0) {
      await db.cuentas_por_cobrar.bulkAdd([
        { id: 'cpc-101', comprobante: 'F001-00000318', cliente_nombre: 'BASHUA S.A.C.', ruc_nit: '20616352327', fecha_vencimiento: '15/09/2026', cuotas: '—', total: 4451.04, cobrado: 4451.04, saldo: 0.00, spot_bn: 980.96, spot_status: 'pending', estado: 'Abierta', isVencido: false, canConfirmBN: true },
        { id: 'cpc-102', comprobante: 'F001-00000317', cliente_nombre: 'BASHUA S.A.C.', ruc_nit: '20616352327', fecha_vencimiento: '15/09/2026', cuotas: '—', total: 960.00, cobrado: 960.00, saldo: 0.00, spot_bn: 40.00, spot_status: 'pending', estado: 'Abierta', isVencido: false, canConfirmBN: true },
        { id: 'cpc-103', comprobante: 'F001-00000227', cliente_nombre: 'GREENCENTER EMOBILITY S.A.C.', ruc_nit: '20613074342', fecha_vencimiento: '28/08/2026', cuotas: '1 pend. / 1 A crédito', total: 131.40, cobrado: 0.00, saldo: 131.40, spot_bn: 0.00, spot_status: null, estado: 'Abierta', isVencido: true, canConfirmBN: false },
        { id: 'cpc-104', comprobante: 'F001-00000225', cliente_nombre: 'GRUPO EMPRESARIAL PACHAY S.A.C.', ruc_nit: '20614717697', fecha_vencimiento: '28/08/2026', cuotas: '1 pend. / 1 A crédito', total: 2332.85, cobrado: 0.00, saldo: 2332.85, spot_bn: 0.00, spot_status: null, estado: 'Abierta', isVencido: true, canConfirmBN: false },
        { id: 'cpc-105', comprobante: 'F001-00000222', cliente_nombre: 'BASHUA S.A.C.', ruc_nit: '20616352327', fecha_vencimiento: '28/08/2026', cuotas: '1 pend. / 1 A crédito', total: 911.76, cobrado: 0.00, saldo: 911.76, spot_bn: 0.00, spot_status: null, estado: 'Abierta', isVencido: true, canConfirmBN: false },
        { id: 'cpc-106', comprobante: 'NV001-00000327', cliente_nombre: 'GREENCENTER EMOBILITY S.A.C.', ruc_nit: '20613074342', fecha_vencimiento: '24/08/2026', cuotas: '3 pend. / 3 A crédito', total: 14.50, cobrado: 0.00, saldo: 14.50, spot_bn: 0.00, spot_status: null, estado: 'Abierta', isVencido: true, canConfirmBN: false },
        { id: 'cpc-107', comprobante: 'F001-00000126', cliente_nombre: 'NEGOCIOS DIGITALES TUKIFAC S.A.C.', ruc_nit: '20612257320', fecha_vencimiento: '06/08/2026', cuotas: '1 pend. / 1 A crédito', total: 338.04, cobrado: 0.00, saldo: 338.04, spot_bn: 0.00, spot_status: null, estado: 'Abierta', isVencido: true, canConfirmBN: false }
      ]);
    }
  }

  // ─── Métodos de Pago (Seed exacto al screenshot media_1789925791176.png) ────
  if (db.metodos_pago) {
    const mpCount = await db.metodos_pago.count();
    if (mpCount === 0) {
      await db.metodos_pago.bulkAdd([
        { id: 'mp-1', nombre: 'Efectivo', codigo: 'cash', destino: 'Caja', destinoId: null, estado: 'Activo', isProtected: true },
        { id: 'mp-2', nombre: 'Yape', codigo: 'yape', destino: 'Cuenta bancaria', destinoId: '4', estado: 'Activo', isProtected: false },
        { id: 'mp-3', nombre: 'Plin', codigo: 'plin', destino: 'Cuenta bancaria', destinoId: '1', estado: 'Activo', isProtected: false },
        { id: 'mp-4', nombre: 'Transferencia', codigo: 'transferencia', destino: 'Cuenta bancaria', destinoId: '2', estado: 'Activo', isProtected: false },
        { id: 'mp-5', nombre: 'Tarjeta', codigo: 'tarjeta', destino: 'Cuenta bancaria', destinoId: '3', estado: 'Activo', isProtected: false }
      ]);
    }
  }

  // ─── Guías Remitente (Seed exacto al screenshot media_1789932575569.png) ────
  if (db.guias_remitente) {
    const grCount = await db.guias_remitente.count();
    if (grCount === 0) {
      await db.guias_remitente.bulkAdd([
        { 
          id: 'gr-1', 
          fecha: '09/09/2026', 
          guia: 'T001-3', 
          destinatario: 'BASHUA S.A.C.', 
          doc_destinatario: '20614752327', 
          siat_code: 'SIAT 2108', 
          items_count: 1, 
          estado_siat: 'Rechazado',
          partida: 'Av. Juan Pablo II #450, El Alto',
          llegada: 'Calle Comercio #890, La Paz',
          modalidad: 'Transporte Privado',
          conductor: 'Juan gabriel quispe huacarpuma',
          vehiculo: 'V2105 (huyndai sedan)',
          items_desc: '1 Pallet cajas de bebidas y víveres',
          motivo: 'Venta con entrega a domicilio'
        },
        { 
          id: 'gr-2', 
          fecha: '31/08/2026', 
          guia: 'T001-2', 
          destinatario: 'GRUPO EMPRESARIAL PACHAY S.A.C.', 
          doc_destinatario: '20614717697', 
          siat_code: 'SIAT 2108', 
          items_count: 3, 
          estado_siat: 'Rechazado',
          partida: 'Almacén Central - Santa Cruz',
          llegada: 'Sucursal 2 - Av. Banzer Km 6',
          modalidad: 'Transporte Privado',
          conductor: 'Juan gabriel quispe huacarpuma',
          vehiculo: 'V2105 (huyndai sedan)',
          items_desc: '3 Bultos de mercadería variada',
          motivo: 'Traslado entre almacenes'
        },
        { 
          id: 'gr-3', 
          fecha: '17/08/2026', 
          guia: 'T001-1', 
          destinatario: 'Clientes Varios', 
          doc_destinatario: '99999999', 
          siat_code: 'SIAT 2108', 
          items_count: 6, 
          estado_siat: 'Rechazado',
          partida: 'Almacén Central',
          llegada: 'Puntos de venta feria',
          modalidad: 'Transporte Privado',
          conductor: 'Juan gabriel quispe huacarpuma',
          vehiculo: 'V2105 (huyndai sedan)',
          items_desc: '6 Cajas de fideos y aceites surtidos',
          motivo: 'Traslado a ferias'
        }
      ]);
    }
  }

  // ─── Guías Transportista (Seed exacto al screenshot media_1789932575543.png) ─
  if (db.guias_transportista) {
    const gtCount = await db.guias_transportista.count();
    if (gtCount === 0) {
      await db.guias_transportista.bulkAdd([
        { 
          id: 'gt-1', 
          fecha: '01/09/2026', 
          guia: 'V001-1', 
          destinatario: 'CASAS MEJIA RAFAEL FERNANDO', 
          doc_destinatario: '10428288527', 
          siat_code: 'SIAT 0', 
          items_count: 1, 
          estado_siat: 'Aceptado',
          remitente: 'INVERSIONES SAN ROQUE S.R.L.',
          doc_remitente: '20491823910',
          partida: 'Km 12 Doble Vía La Guardia',
          llegada: 'Terminal Bimodal Santa Cruz',
          modalidad: 'Transporte Público',
          pagador_flete: 'Destinatario',
          items_desc: '1 Contenedor refrigerado de insumos',
          motivo: 'Servicio de flete y transporte'
        }
      ]);
    }
  }

  // ─── Transportistas GRE (Seed exacto al screenshot media_1789932575539.png) ──
  if (db.transportistas_gre) {
    const tCount = await db.transportistas_gre.count();
    if (tCount === 0) {
      await db.transportistas_gre.bulkAdd([
        { id: 'trans-1', documento: '20556677881', nombre: 'TRANS LOGÍSTICA BOLIVIA S.R.L.', mtc: 'MTC-SCZ-8821', estado: 'Activo' }
      ]);
    }
  }

  // ─── Conductores GRE (Seed exacto al screenshot media_1789932575537.png) ────
  if (db.conductores_gre) {
    const cCount = await db.conductores_gre.count();
    if (cCount === 0) {
      await db.conductores_gre.bulkAdd([
        { id: 'cond-1', documento: '1-71079426', hasStar: true, nombre: 'Juan gabriel quispe huacarpuma', licencia: 'V710794265', telefono: '927303279', estado: 'Activo' }
      ]);
    }
  }

  // ─── Vehículos GRE (Seed exacto al screenshot media_1789932575536.png) ──────
  if (db.vehiculos_gre) {
    const vCount = await db.vehiculos_gre.count();
    if (vCount === 0) {
      await db.vehiculos_gre.bulkAdd([
        { id: 'veh-1', placa: 'V2105', marca: 'huyndai', modelo: 'sedan', cert_habilitacion: '64211554', estado: 'Activo' }
      ]);
    }
  }

  // ─── Documentos Avanzados: Retenciones (Seed exacto al screenshot media_1790118101543.png) ─
  if (db.retenciones) {
    const retCount = await db.retenciones.count();
    if (retCount === 0) {
      await db.retenciones.bulkAdd([
        {
          id: 'ret-seed-1',
          fecha: '15/09/2026',
          serie_nro: 'R001-1',
          serie: 'R001',
          correlativo: '1',
          origen: 'Fdh-00004478',
          proveedor_nombre: 'Clientes varios',
          proveedor_doc: '000000',
          retenido: 6.45,
          moneda: 'S/',
          tasa_porcentaje: 3,
          monto_total_comprobante: 215.00,
          estado_sunat: 'Error envio',
          sunat_obs: 'Error 1033: El comprobante fue registrado previamente con errores de formato o timeout en conexión con SUNAT.',
          rr: '—',
          observacion: 'Retención de IGV 3% aplicada sobre comprobante Fdh-00004478'
        }
      ]);
    }
  }

  // ─── Roles y Permisos (Seed exacto al screenshot media_1790120030272.png) ─────
  if (db.roles) {
    const rolesCount = await db.roles.count();
    if (rolesCount === 0) {
      await db.roles.bulkAdd([
        {
          id: 'rol-admin',
          nombre: 'Administrador',
          descripcion: 'Acceso completo al sistema',
          permisos: ['inicio', 'dashboard', 'preventa', 'ventas', 'tienda_virtual', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'guias_remision', 'documentos_avanzados', 'contabilidad', 'reportes', 'administracion', 'modulos'],
          activo: true,
          esSistema: true
        },
        {
          id: 'rol-almacenero',
          nombre: 'Almacenero',
          descripcion: 'Gestión de inventario',
          permisos: ['productos', 'inventario', 'guias_remision', 'compras'],
          activo: true,
          esSistema: true
        },
        {
          id: 'rol-cajero',
          nombre: 'Cajero',
          descripcion: 'Caja y movimientos',
          permisos: ['ventas', 'pos', 'caja', 'finanzas', 'clientes'],
          activo: true,
          esSistema: true
        },
        {
          id: 'rol-contador',
          nombre: 'Contador',
          descripcion: 'Gestión contable',
          permisos: ['contabilidad', 'reportes', 'finanzas', 'compras', 'documentos_avanzados'],
          activo: true,
          esSistema: true
        },
        {
          id: 'rol-supervisor',
          nombre: 'Supervisor',
          descripcion: 'Supervisión y reportes',
          permisos: ['inicio', 'dashboard', 'ventas', 'reportes', 'inventario', 'clientes', 'caja'],
          activo: true,
          esSistema: true
        },
        {
          id: 'rol-vendedor',
          nombre: 'Vendedor',
          descripcion: 'Gestión de ventas y POS',
          permisos: ['pos', 'ventas', 'clientes', 'preventa', 'tienda_virtual'],
          activo: true,
          esSistema: true
        }
      ]);
    }
  }
}
