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
}
