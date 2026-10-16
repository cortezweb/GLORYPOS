import { db } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Cola de Sincronización Offline → Nube ─────────────────────────────────────
// Manejo automático de sincronización en tiempo real y offline-first con Supabase.

const MAX_INTENTOS = 3;
const BACKOFF_MS = [2000, 5000, 15000];

let backgroundSyncTimeout = null;
let hooksAttached = false;

// Id real de la empresa en Supabase (en Dexie la empresa vive bajo la clave 'empresa_activa')
async function getCloudEmpresaId() {
  try {
    const local = await db.config_empresa.get('empresa_activa');
    if (!local) return null;
    if (local.cloud_id) return local.cloud_id;
    return local.id && local.id !== 'empresa_activa' ? local.id : null;
  } catch {
    return null;
  }
}

// Solo se sincroniza con una sesión de Supabase Auth: RLS rechaza todo lo demás
async function hasCloudSession() {
  try {
    const { data } = await supabase.auth.getSession();
    return Boolean(data?.session);
  } catch {
    return false;
  }
}

export const ALL_SYSTEM_TABLES = [
  'empresas',
  'roles',
  'usuarios',
  'clientes',
  'proveedores',
  'productos',
  'ventas',
  'compras',
  'kardex',
  'caja_chica',
  'cotizaciones',
  'membresias',
  'pedidos_web',
  'unidades_medida',
  'transferencias_inventario',
  'sesiones_caja',
  'ingresos_caja',
  'egresos_caja',
  'cuentas_bancarias',
  'cuentas_por_cobrar',
  'cuentas_por_pagar',
  'metodos_pago',
  'guias_remitente',
  'guias_transportista',
  'transportistas_gre',
  'conductores_gre',
  'vehiculos_gre',
  'retenciones',
  'percepciones',
  'reversiones'
];

export const syncService = {

  // ── DIAGNÓSTICO DE TABLAS EN SUPABASE ──────────────────────────────────────
  /**
   * Verifica el estado de conexión y qué tablas existen actualmente en Supabase.
   */
  async checkCloudStatus() {
    if (!isSupabaseConfigured || !supabase) {
      return {
        configured: false,
        online: typeof navigator !== 'undefined' ? navigator.onLine : true,
        existingTables: [],
        missingTables: ALL_SYSTEM_TABLES,
        statusText: 'Supabase no está configurado en .env'
      };
    }

    const online = typeof navigator !== 'undefined' ? navigator.onLine : true;
    if (!online) {
      return {
        configured: true,
        online: false,
        existingTables: [],
        missingTables: [],
        statusText: 'Sin conexión a internet (Modo Offline)'
      };
    }

    const existingTables = [];
    const missingTables = [];

    await Promise.all(
      ALL_SYSTEM_TABLES.map(async (table) => {
        try {
          const { error } = await supabase.from(table).select('id').limit(1);
          if (error && (error.code === 'PGRST205' || error.message?.includes('schema cache'))) {
            missingTables.push(table);
          } else {
            existingTables.push(table);
          }
        } catch {
          missingTables.push(table);
        }
      })
    );

    return {
      configured: true,
      online: true,
      existingTables,
      missingTables,
      statusText: missingTables.length === 0 
        ? 'Todas las tablas configuradas y sincronizadas' 
        : `Faltan ${missingTables.length} tablas por crear en Supabase`
    };
  },

  // ── COLA OFFLINE ──────────────────────────────────────────────────────────

  async addToQueue(tabla, accion, data) {
    try {
      await db.sync_queue.add({
        tabla,
        accion,
        registro_id: String(data?.id || ''),
        data: JSON.stringify(data),
        intentos: 0,
        created_at: new Date().toISOString(),
        synced_at: null,
      });
    } catch (err) {
      console.warn('[syncService] No se pudo encolar:', err);
    }
  },

  async getQueueCount() {
    try {
      return await db.sync_queue.where('synced_at').equals(null).count();
    } catch {
      return 0;
    }
  },

  // ── PROCESAMIENTO DE COLA ─────────────────────────────────────────────────

  async processQueue() {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine) || !supabase) {
      return { synced: 0, failed: 0, reason: 'offline_or_unconfigured' };
    }

    let synced = 0;
    let failed = 0;

    const empresaId = await getCloudEmpresaId();
    if (!empresaId || !(await hasCloudSession())) {
      return { synced: 0, failed: 0, reason: 'sin_sesion_o_empresa' };
    }

    try {
      const pending = await db.sync_queue
        .filter(item => !item.synced_at && item.intentos < MAX_INTENTOS)
        .toArray();

      for (const item of pending) {
        try {
          const data = { ...JSON.parse(item.data || '{}'), empresa_id: empresaId };

          if (item.accion === 'upsert') {
            const { error } = await supabase
              .from(item.tabla)
              .upsert(data, { onConflict: 'empresa_id,id' });
            if (error) throw error;
          } else if (item.accion === 'delete') {
            const { error } = await supabase
              .from(item.tabla)
              .delete()
              .eq('empresa_id', empresaId)
              .eq('id', item.registro_id);
            if (error) throw error;
          }

          await db.sync_queue.update(item.id, {
            synced_at: new Date().toISOString(),
          });
          synced++;
        } catch (err) {
          console.warn(`[syncService] Error al procesar cola ${item.tabla}#${item.registro_id}:`, err.message);
          const nextIntento = item.intentos + 1;
          await db.sync_queue.update(item.id, { intentos: nextIntento });
          if (nextIntento < MAX_INTENTOS) {
            await new Promise(r => setTimeout(r, BACKOFF_MS[item.intentos] || 15000));
          }
          failed++;
        }
      }

      // Limpiar registros sincronizados antiguos (> 7 días)
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.sync_queue
        .filter(item => item.synced_at && item.synced_at < cutoff)
        .delete();

    } catch (err) {
      console.error('[syncService] Error en processQueue:', err);
    }

    return { synced, failed };
  },

  // ── SYNC COMPLETO LOCAL → NUBE (LAS 30 TABLAS DEL SISTEMA) ──────────────────

  async syncLocalToCloud() {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine) || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    const summary = {
      empresa: false,
      roles: 0,
      usuarios: 0,
      clientes: 0,
      proveedores: 0,
      productos: 0,
      ventas: 0,
      compras: 0,
      kardex: 0,
      caja_chica: 0,
      cotizaciones: 0,
      membresias: 0,
      pedidos_web: 0,
      unidades_medida: 0,
      transferencias_inventario: 0,
      sesiones_caja: 0,
      ingresos_caja: 0,
      egresos_caja: 0,
      cuentas_bancarias: 0,
      cuentas_por_cobrar: 0,
      cuentas_por_pagar: 0,
      metodos_pago: 0,
      guias_remitente: 0,
      guias_transportista: 0,
      transportistas_gre: 0,
      conductores_gre: 0,
      vehiculos_gre: 0,
      retenciones: 0,
      percepciones: 0,
      reversiones: 0,
      glorychef: 0,
      glorychef_errors: [],
      errors: []
    };

    const empresaId = await getCloudEmpresaId();
    if (!empresaId || !(await hasCloudSession())) {
      return { success: false, reason: 'sin_sesion_o_empresa', summary };
    }

    try {
      const localEmpresa = await db.config_empresa.get('empresa_activa');

      // 1. Procesar cola offline primero
      try {
        await this.processQueue();
      } catch (qErr) {
        console.warn('[syncService] Advertencia procesando cola:', qErr);
      }

      // 2. Sincronizar Empresa
      if (localEmpresa) {
        try {
          // Plan, vencimiento, módulos y subdominio los controla el Super Admin en la nube
          const empresaPayload = {
            nombre: localEmpresa.nombre || 'GLORYPOS BOLIVIA S.R.L.',
            nit_ci: String(localEmpresa.nit_ci || '0'),
            rubro: localEmpresa.rubro || 'ABARROTES',
            ciudad: localEmpresa.ciudad || 'Santa Cruz, Bolivia',
            direccion: localEmpresa.direccion || '',
            telefono: localEmpresa.telefono || '',
            email: localEmpresa.email || '',
            propietario: localEmpresa.propietario || '',
            updated_at: new Date().toISOString()
          };

          const { error: empErr } = await supabase.from('empresas').update(empresaPayload).eq('id', empresaId);
          if (empErr) {
            summary.errors.push({ tabla: 'empresas', error: empErr.message });
          } else {
            summary.empresa = true;
          }
        } catch (eErr) {
          summary.errors.push({ tabla: 'empresas', error: eErr.message });
        }
      }

      // 3. Sincronizar Roles y Permisos
      try {
        if (db.roles) {
          const localRoles = await db.roles.toArray();
          if (localRoles.length > 0) {
            const payload = localRoles.map(r => ({
              id: String(r.id),
              empresa_id: empresaId,
              nombre: r.nombre,
              descripcion: r.descripcion || '',
              permisos: Array.isArray(r.permisos) ? r.permisos : [],
              activo: r.activo !== false,
              es_sistema: Boolean(r.esSistema || r.es_sistema),
              updated_at: new Date().toISOString()
            }));

            const { error: rolErr } = await supabase.from('roles').upsert(payload, { onConflict: 'empresa_id,id' });
            if (rolErr) summary.errors.push({ tabla: 'roles', error: rolErr.message });
            else summary.roles = payload.length;
          }
        }
      } catch (rE) {
        summary.errors.push({ tabla: 'roles', error: rE.message });
      }

      // 4. Sincronizar Usuarios
      try {
        if (db.usuarios) {
          const localUsers = await db.usuarios.toArray();
          if (localUsers.length > 0) {
            const payload = localUsers.map(u => ({
              id: String(u.id),
              empresa_id: empresaId,
              nombre: u.nombre,
              email: u.email || '',
              rol: u.rol || 'CAJERO',
              pin: u.pin || null,
              password: u.password || null,
              password_hash: u.password_hash || null,
              pin_hash: u.pin_hash || null,
              avatar: u.avatar || null,
              color: u.color || null,
              activo: u.activo !== false,
              updated_at: new Date().toISOString()
            }));

            const { error: usrErr } = await supabase.from('usuarios').upsert(payload, { onConflict: 'empresa_id,id' });
            if (usrErr) summary.errors.push({ tabla: 'usuarios', error: usrErr.message });
            else summary.usuarios = payload.length;
          }
        }
      } catch (uE) {
        summary.errors.push({ tabla: 'usuarios', error: uE.message });
      }

      // 5. Sincronizar Clientes
      try {
        if (db.clientes) {
          const localClients = await db.clientes.toArray();
          if (localClients.length > 0) {
            const payload = localClients.map(c => ({
              id: String(c.id),
              empresa_id: empresaId,
              razon_social: c.razon_social,
              nit_ci: String(c.nit_ci || '0'),
              telefono: c.telefono || null,
              direccion: c.direccion || null,
              ciudad: c.ciudad || null,
              email: c.email || null,
              saldo_credito: Number(c.saldo_credito) || 0,
              total_compras: Number(c.total_compras) || 0,
              updated_at: new Date().toISOString()
            }));

            const { error: cliErr } = await supabase.from('clientes').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cliErr) summary.errors.push({ tabla: 'clientes', error: cliErr.message });
            else summary.clientes = payload.length;
          }
        }
      } catch (cErr) {
        summary.errors.push({ tabla: 'clientes', error: cErr.message });
      }

      // 6. Sincronizar Proveedores
      try {
        if (db.proveedores) {
          const localProvs = await db.proveedores.toArray();
          if (localProvs.length > 0) {
            const payload = localProvs.map(p => ({
              id: String(p.id),
              empresa_id: empresaId,
              razon_social: p.razon_social || 'Proveedor',
              nit: String(p.nit || '0'),
              telefono: p.telefono || null,
              ciudad: p.ciudad || null,
              direccion: p.direccion || null,
              contacto: p.contacto || null,
              rubro: p.rubro || 'General',
              updated_at: new Date().toISOString()
            }));

            const { error: provErr } = await supabase.from('proveedores').upsert(payload, { onConflict: 'empresa_id,id' });
            if (provErr) summary.errors.push({ tabla: 'proveedores', error: provErr.message });
            else summary.proveedores = payload.length;
          }
        }
      } catch (prvE) {
        summary.errors.push({ tabla: 'proveedores', error: prvE.message });
      }

      // 7. Sincronizar Productos
      try {
        if (db.productos_tienda) {
          const localProducts = await db.productos_tienda.toArray();
          if (localProducts.length > 0) {
            const payload = localProducts.map(p => ({
              id: String(p.id),
              empresa_id: empresaId,
              codigo_barras: p.codigo_barras || null,
              nombre: p.nombre,
              categoria: p.categoria || 'General',
              unidad_medida: p.unidad_medida || 'Unidad',
              foto_url: p.foto_url || p.imagen_url || null,
              precio_venta: Number(p.precio_venta) || 0,
              precio_compra: Number(p.precio_compra) || 0,
              stock_actual: Number(p.stock_actual) || 0,
              stock_minimo: Number(p.stock_minimo) || 5,
              tipo_venta: p.tipo_venta || 'UNIDAD',
              lote: p.lote || null,
              fecha_vencimiento: p.fecha_vencimiento || null,
              principio_activo: p.principio_activo || null,
              tallas: Array.isArray(p.tallas) ? p.tallas : [],
              colores: Array.isArray(p.colores) ? p.colores : [],
              sabores: Array.isArray(p.sabores) ? p.sabores : [],
              toppings: Array.isArray(p.toppings) ? p.toppings : [],
              presentaciones: Array.isArray(p.presentaciones) ? p.presentaciones : [],
              activo: p.activo !== false,
              updated_at: new Date().toISOString()
            }));

            const { error: prodErr } = await supabase.from('productos').upsert(payload, { onConflict: 'empresa_id,id' });
            if (prodErr) summary.errors.push({ tabla: 'productos', error: prodErr.message });
            else summary.productos = payload.length;
          }
        }
      } catch (pErr) {
        summary.errors.push({ tabla: 'productos', error: pErr.message });
      }

      // 8. Sincronizar Ventas
      try {
        if (db.ventas) {
          const localVentas = await db.ventas.toArray();
          if (localVentas.length > 0) {
            const payload = localVentas.map(v => ({
              id: String(v.id),
              empresa_id: empresaId,
              fecha: v.fecha || new Date().toISOString(),
              correlativo: v.correlativo || `VTA-${Date.now()}`,
              tipo_documento: v.tipo_documento || 'NOTA_VENTA',
              serie: v.serie || 'NV001',
              cliente_nombre: v.cliente_nombre || 'Clientes Varios',
              cliente_ci_nit: String(v.cliente_ci_nit || '0'),
              metodo_pago: v.metodo_pago || 'EFECTIVO',
              num_operacion: v.num_operacion || null,
              descuento_porcentaje: Number(v.descuento_porcentaje) || 0,
              subtotal: Number(v.subtotal) || Number(v.total) || 0,
              total: Number(v.total) || 0,
              monto_recibido: Number(v.monto_recibido) || Number(v.total) || 0,
              cambio: Number(v.cambio) || 0,
              estado: v.estado || 'EMITIDO',
              estado_siat: v.estado_siat || 'NO_APLICA',
              cuf: v.cuf || null,
              items: Array.isArray(v.items) ? v.items : [],
              despacho_estado: v.despacho_estado || 'ENTREGADO',
              informacion_adicional: v.informacion_adicional || {}
            }));

            const { error: vtaErr } = await supabase.from('ventas').upsert(payload, { onConflict: 'empresa_id,id' });
            if (vtaErr) summary.errors.push({ tabla: 'ventas', error: vtaErr.message });
            else summary.ventas = payload.length;
          }
        }
      } catch (vErr) {
        summary.errors.push({ tabla: 'ventas', error: vErr.message });
      }

      // 9. Sincronizar Compras
      try {
        if (db.compras) {
          const localCompras = await db.compras.toArray();
          if (localCompras.length > 0) {
            const payload = localCompras.map(c => ({
              id: String(c.id),
              empresa_id: empresaId,
              fecha: c.fecha || new Date().toISOString(),
              proveedor_id: c.proveedor_id ? String(c.proveedor_id) : null,
              proveedor_nombre: c.proveedor_nombre || 'Proveedor',
              proveedor_nit: String(c.proveedor_nit || '0'),
              numero_factura: c.numero_factura || 'FC-001',
              tipo_documento: c.tipo_documento || 'FACTURA',
              serie: c.serie || 'F001',
              subtotal: Number(c.subtotal || c.total) || 0,
              igv: Number(c.igv) || 0,
              total: Number(c.total) || 0,
              incluye_igv: Boolean(c.incluye_igv),
              items: Array.isArray(c.items) ? c.items : [],
              estado_pago: c.estado_pago || 'CONTADO',
              metodo_pago: c.metodo_pago || 'CONTADO',
              almacen_destino: c.almacen_destino || 'Almacén Principal'
            }));

            const { error: cmpErr } = await supabase.from('compras').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cmpErr) summary.errors.push({ tabla: 'compras', error: cmpErr.message });
            else summary.compras = payload.length;
          }
        }
      } catch (cmpE) {
        summary.errors.push({ tabla: 'compras', error: cmpE.message });
      }

      // 10. Sincronizar Kardex
      try {
        if (db.kardex) {
          const localKardex = await db.kardex.toArray();
          if (localKardex.length > 0) {
            const payload = localKardex.map(k => ({
              id: String(k.id),
              empresa_id: empresaId,
              fecha: k.fecha || new Date().toISOString(),
              producto_id: k.producto_id ? String(k.producto_id) : null,
              producto_nombre: k.producto_nombre || 'Producto',
              tipo: k.tipo || 'ENTRADA',
              cantidad: Number(k.cantidad) || 0,
              motivo: k.motivo || null,
              saldo_nuevo: Number(k.saldo_nuevo) || 0,
              costo_unitario: Number(k.costo_unitario) || 0
            }));

            const { error: kdxErr } = await supabase.from('kardex').upsert(payload, { onConflict: 'empresa_id,id' });
            if (kdxErr) summary.errors.push({ tabla: 'kardex', error: kdxErr.message });
            else summary.kardex = payload.length;
          }
        }
      } catch (kErr) {
        summary.errors.push({ tabla: 'kardex', error: kErr.message });
      }

      // 11. Sincronizar Movimientos de Caja Chica
      try {
        if (db.movimientos_caja) {
          const localMovs = await db.movimientos_caja.toArray();
          if (localMovs.length > 0) {
            const payload = localMovs.map(m => ({
              id: String(m.id),
              empresa_id: empresaId,
              fecha_apertura: m.fecha || new Date().toISOString(),
              monto_inicial: m.tipo === 'APERTURA' ? Number(m.monto) : 0,
              total_ventas: 0,
              total_ingresos: m.tipo === 'INGRESO' ? Number(m.monto) : 0,
              total_egresos: m.tipo === 'EGRESO' ? Number(m.monto) : 0,
              saldo_esperado: Number(m.monto) || 0,
              saldo_real: Number(m.monto) || 0,
              diferencia: 0,
              estado: 'ABIERTA',
              cajero_nombre: m.responsable || 'Carlos Gutiérrez',
              tipo: m.tipo || null,
              monto: Number(m.monto) || 0,
              motivo: m.motivo || null,
              responsable: m.responsable || null,
              comprobante: m.comprobante || null
            }));

            const { error: cajaErr } = await supabase.from('caja_chica').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cajaErr) summary.errors.push({ tabla: 'caja_chica', error: cajaErr.message });
            else summary.caja_chica = payload.length;
          }
        }
      } catch (cjErr) {
        summary.errors.push({ tabla: 'caja_chica', error: cjErr.message });
      }

      // 12. Sincronizar Cotizaciones
      try {
        if (db.cotizaciones) {
          const localCotiz = await db.cotizaciones.toArray();
          if (localCotiz.length > 0) {
            const payload = localCotiz.map(c => ({
              id: String(c.id),
              empresa_id: empresaId,
              fecha: c.fecha || new Date().toISOString(),
              vencimiento: c.vencimiento || null,
              correlativo: c.correlativo || `CT01-${Date.now()}`,
              cliente_nombre: c.cliente_nombre || 'Cliente',
              cliente_ci_nit: c.cliente_ci_nit || '0',
              cliente_telefono: c.cliente_telefono || null,
              validez_dias: Number(c.validez_dias) || 15,
              condiciones: c.condiciones || null,
              items: Array.isArray(c.items) ? c.items : [],
              subtotal: Number(c.subtotal || c.total) || 0,
              descuento: Number(c.descuento) || 0,
              total: Number(c.total) || 0,
              estado: c.estado || 'Vigente'
            }));

            const { error: cotErr } = await supabase.from('cotizaciones').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cotErr) summary.errors.push({ tabla: 'cotizaciones', error: cotErr.message });
            else summary.cotizaciones = payload.length;
          }
        }
      } catch (cotE) {
        summary.errors.push({ tabla: 'cotizaciones', error: cotE.message });
      }

      // 13. Sincronizar Membresías
      try {
        let localMemb = [];
        if (db.membresias) localMemb = await db.membresias.toArray();
        if (localMemb.length === 0 && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('glorypos_membresias_v2');
          if (saved) localMemb = JSON.parse(saved);
        }
        if (localMemb.length > 0) {
          const payload = localMemb.map(m => ({
            id: String(m.id || `mem-${Date.now()}`),
            empresa_id: empresaId,
            cliente_nombre: m.cliente_nombre || 'Cliente',
            cliente_doc: m.cliente_doc || null,
            plan_nombre: m.plan_nombre || 'Membresía',
            sucursal: m.sucursal || 'Principal',
            monto_cuota: Number(m.monto_cuota) || 0,
            frecuencia: m.frecuencia || 'Mensual',
            fecha_inicio: m.fecha_inicio || new Date().toISOString().split('T')[0],
            proximo_cobro: m.proximo_cobro || null,
            estado: m.estado || 'Activa'
          }));

          const { error: memErr } = await supabase.from('membresias').upsert(payload, { onConflict: 'empresa_id,id' });
          if (memErr) summary.errors.push({ tabla: 'membresias', error: memErr.message });
          else summary.membresias = payload.length;
        }
      } catch (memE) {
        summary.errors.push({ tabla: 'membresias', error: memE.message });
      }

      // 14. Sincronizar Pedidos Web
      try {
        let localPedidos = [];
        if (db.pedidos_web) localPedidos = await db.pedidos_web.toArray();
        if (localPedidos.length === 0 && typeof localStorage !== 'undefined') {
          const saved = localStorage.getItem('glorypos_pedidos_web_v2');
          if (saved) localPedidos = JSON.parse(saved);
        }
        if (localPedidos.length > 0) {
          const payload = localPedidos.map(p => ({
            id: String(p.id || `pw-${Date.now()}`),
            empresa_id: empresaId,
            fecha: p.fecha_iso || p.fecha || new Date().toISOString(),
            numero_orden: p.numero_orden || p.id,
            cliente_nombre: p.cliente_nombre || 'Cliente Web',
            telefono: p.telefono || null,
            total: Number(p.total) || 0,
            estado: p.estado || 'Nuevo',
            items: Array.isArray(p.items) ? p.items : []
          }));

          const { error: pwErr } = await supabase.from('pedidos_web').upsert(payload, { onConflict: 'empresa_id,id' });
          if (pwErr) summary.errors.push({ tabla: 'pedidos_web', error: pwErr.message });
          else summary.pedidos_web = payload.length;
        }
      } catch (pwE) {
        summary.errors.push({ tabla: 'pedidos_web', error: pwE.message });
      }

      // 15. Sincronizar Unidades de Medida
      try {
        if (db.unidades_medida) {
          const localUnits = await db.unidades_medida.toArray();
          if (localUnits.length > 0) {
            const payload = localUnits.map(u => ({
              id: String(u.id),
              empresa_id: empresaId,
              codigo: u.codigo,
              nombre: u.nombre,
              simbolo: u.simbolo || null,
              origen: u.origen || 'Sistema',
              estado: u.estado || 'Activa'
            }));

            const { error: uErr } = await supabase.from('unidades_medida').upsert(payload, { onConflict: 'empresa_id,id' });
            if (uErr) summary.errors.push({ tabla: 'unidades_medida', error: uErr.message });
            else summary.unidades_medida = payload.length;
          }
        }
      } catch (uErr) {
        summary.errors.push({ tabla: 'unidades_medida', error: uErr.message });
      }

      // 16. Sincronizar Transferencias de Inventario
      try {
        if (db.transferencias_inventario) {
          const localTrf = await db.transferencias_inventario.toArray();
          if (localTrf.length > 0) {
            const payload = localTrf.map(t => ({
              id: String(t.id),
              empresa_id: empresaId,
              fecha: t.fecha ? new Date(t.fecha).toISOString() : new Date().toISOString(),
              fecha_display: t.fechaDisplay || null,
              origen: t.origen || 'Principal',
              destino: t.destino || 'Almacén',
              productos: Array.isArray(t.productos) ? t.productos : [],
              productos_display: t.productosDisplay || null,
              estado: t.estado || 'Confirmado',
              notas: t.notas || null
            }));

            const { error: trfErr } = await supabase.from('transferencias_inventario').upsert(payload, { onConflict: 'empresa_id,id' });
            if (trfErr) summary.errors.push({ tabla: 'transferencias_inventario', error: trfErr.message });
            else summary.transferencias_inventario = payload.length;
          }
        }
      } catch (trfE) {
        summary.errors.push({ tabla: 'transferencias_inventario', error: trfE.message });
      }

      // 17. Sincronizar Sesiones de Caja (Finanzas)
      try {
        if (db.sesiones_caja) {
          const localSes = await db.sesiones_caja.toArray();
          if (localSes.length > 0) {
            const payload = localSes.map(s => ({
              id: String(s.id),
              empresa_id: empresaId,
              usuario: s.usuario || 'Cajero',
              fecha_apertura: s.fecha_apertura || null,
              fecha_cierre: s.fecha_cierre || null,
              balance_apertura: Number(s.balance_apertura) || 0,
              balance_cierre: s.balance_cierre !== null ? Number(s.balance_cierre) : null,
              saldo_actual: Number(s.saldo_actual) || 0,
              estado: s.estado || 'Abierta',
              arqueo_estado: s.arqueo_estado || 'Arqueo'
            }));

            const { error: sErr } = await supabase.from('sesiones_caja').upsert(payload, { onConflict: 'empresa_id,id' });
            if (sErr) summary.errors.push({ tabla: 'sesiones_caja', error: sErr.message });
            else summary.sesiones_caja = payload.length;
          }
        }
      } catch (sErr) {
        summary.errors.push({ tabla: 'sesiones_caja', error: sErr.message });
      }

      // 18. Sincronizar Ingresos de Caja (Finanzas)
      try {
        if (db.ingresos_caja) {
          const localIng = await db.ingresos_caja.toArray();
          if (localIng.length > 0) {
            const payload = localIng.map(i => ({
              id: String(i.id),
              empresa_id: empresaId,
              fecha: i.fecha || null,
              sesion: i.sesion || null,
              categoria: i.categoria || 'Ingreso',
              badge_categoria: i.badgeCategoria || null,
              documento: i.documento || null,
              usuario: i.usuario || null,
              metodo_pago: i.metodo_pago || 'Efectivo',
              monto: Number(i.monto) || 0
            }));

            const { error: iErr } = await supabase.from('ingresos_caja').upsert(payload, { onConflict: 'empresa_id,id' });
            if (iErr) summary.errors.push({ tabla: 'ingresos_caja', error: iErr.message });
            else summary.ingresos_caja = payload.length;
          }
        }
      } catch (iErr) {
        summary.errors.push({ tabla: 'ingresos_caja', error: iErr.message });
      }

      // 19. Sincronizar Egresos de Caja (Finanzas)
      try {
        if (db.egresos_caja) {
          const localEgr = await db.egresos_caja.toArray();
          if (localEgr.length > 0) {
            const payload = localEgr.map(e => ({
              id: String(e.id),
              empresa_id: empresaId,
              fecha: e.fecha || null,
              sesion: e.sesion || null,
              categoria: e.categoria || 'Egreso',
              badge_categoria: e.badgeCategoria || null,
              proveedor: e.proveedor || null,
              documento: e.documento || null,
              usuario: e.usuario || null,
              metodo_pago: e.metodo_pago || 'Efectivo',
              monto: Number(e.monto) || 0
            }));

            const { error: eErr } = await supabase.from('egresos_caja').upsert(payload, { onConflict: 'empresa_id,id' });
            if (eErr) summary.errors.push({ tabla: 'egresos_caja', error: eErr.message });
            else summary.egresos_caja = payload.length;
          }
        }
      } catch (eErr) {
        summary.errors.push({ tabla: 'egresos_caja', error: eErr.message });
      }

      // 20. Sincronizar Cuentas Bancarias (Finanzas)
      try {
        if (db.cuentas_bancarias) {
          const localCuentas = await db.cuentas_bancarias.toArray();
          if (localCuentas.length > 0) {
            const payload = localCuentas.map(cb => ({
              id: String(cb.id),
              empresa_id: empresaId,
              nombre: cb.nombre,
              entidad: cb.entidad || null,
              numero: cb.numero || null,
              tipo: cb.tipo || 'Bancaria',
              saldo: Number(cb.saldo) || 0,
              moneda: cb.moneda || 'PEN',
              estado: cb.estado || 'Activa'
            }));

            const { error: cbErr } = await supabase.from('cuentas_bancarias').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cbErr) summary.errors.push({ tabla: 'cuentas_bancarias', error: cbErr.message });
            else summary.cuentas_bancarias = payload.length;
          }
        }
      } catch (cbErr) {
        summary.errors.push({ tabla: 'cuentas_bancarias', error: cbErr.message });
      }

      // 21. Sincronizar Cuentas por Cobrar (Finanzas)
      try {
        if (db.cuentas_por_cobrar) {
          const localCpc = await db.cuentas_por_cobrar.toArray();
          if (localCpc.length > 0) {
            const payload = localCpc.map(c => ({
              id: String(c.id),
              empresa_id: empresaId,
              comprobante: c.comprobante || null,
              cliente_nombre: c.cliente_nombre || null,
              ruc_nit: c.ruc_nit || null,
              fecha_vencimiento: c.fecha_vencimiento || null,
              cuotas: c.cuotas || null,
              total: Number(c.total) || 0,
              cobrado: Number(c.cobrado) || 0,
              saldo: Number(c.saldo) || 0,
              spot_bn: Number(c.spot_bn) || 0,
              spot_status: c.spot_status || null,
              estado: c.estado || 'Abierta',
              is_vencido: Boolean(c.isVencido),
              can_confirm_bn: Boolean(c.canConfirmBN)
            }));

            const { error: cpcErr } = await supabase.from('cuentas_por_cobrar').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cpcErr) summary.errors.push({ tabla: 'cuentas_por_cobrar', error: cpcErr.message });
            else summary.cuentas_por_cobrar = payload.length;
          }
        }
      } catch (cpcErr) {
        summary.errors.push({ tabla: 'cuentas_por_cobrar', error: cpcErr.message });
      }

      // 22. Sincronizar Cuentas por Pagar (Finanzas)
      try {
        if (db.cuentas_por_pagar) {
          const localCpp = await db.cuentas_por_pagar.toArray();
          if (localCpp.length > 0) {
            const payload = localCpp.map(p => ({
              id: String(p.id),
              empresa_id: empresaId,
              proveedor_nombre: p.proveedor_nombre || null,
              documento: p.documento || null,
              fecha_emision: p.fecha_emision || null,
              fecha_vencimiento: p.fecha_vencimiento || null,
              estado: p.estado || 'Pendiente',
              total: Number(p.total) || 0,
              pagado: Number(p.pagado) || 0,
              saldo: Number(p.saldo) || 0
            }));

            const { error: cppErr } = await supabase.from('cuentas_por_pagar').upsert(payload, { onConflict: 'empresa_id,id' });
            if (cppErr) summary.errors.push({ tabla: 'cuentas_por_pagar', error: cppErr.message });
            else summary.cuentas_por_pagar = payload.length;
          }
        }
      } catch (cppErr) {
        summary.errors.push({ tabla: 'cuentas_por_pagar', error: cppErr.message });
      }

      // 23. Sincronizar Métodos de Pago (Finanzas)
      try {
        if (db.metodos_pago) {
          const localMp = await db.metodos_pago.toArray();
          if (localMp.length > 0) {
            const payload = localMp.map(m => ({
              id: String(m.id),
              empresa_id: empresaId,
              nombre: m.nombre,
              codigo: m.codigo || null,
              destino: m.destino || null,
              destino_id: m.destinoId ? String(m.destinoId) : null,
              estado: m.estado || 'Activo',
              is_protected: Boolean(m.isProtected)
            }));

            const { error: mpErr } = await supabase.from('metodos_pago').upsert(payload, { onConflict: 'empresa_id,id' });
            if (mpErr) summary.errors.push({ tabla: 'metodos_pago', error: mpErr.message });
            else summary.metodos_pago = payload.length;
          }
        }
      } catch (mpErr) {
        summary.errors.push({ tabla: 'metodos_pago', error: mpErr.message });
      }

      // 24. Sincronizar Guías Remitente (GRE)
      try {
        if (db.guias_remitente) {
          const localGr = await db.guias_remitente.toArray();
          if (localGr.length > 0) {
            const payload = localGr.map(g => ({
              id: String(g.id),
              empresa_id: empresaId,
              fecha: g.fecha || null,
              guia: g.guia || null,
              destinatario: g.destinatario || null,
              doc_destinatario: g.doc_destinatario || null,
              siat_code: g.siat_code || null,
              items_count: Number(g.items_count) || 1,
              estado_siat: g.estado_siat || 'Registrado',
              partida: g.partida || null,
              llegada: g.llegada || null,
              modalidad: g.modalidad || null,
              conductor: g.conductor || null,
              vehiculo: g.vehiculo || null,
              items_desc: g.items_desc || null,
              motivo: g.motivo || null
            }));

            const { error: grErr } = await supabase.from('guias_remitente').upsert(payload, { onConflict: 'empresa_id,id' });
            if (grErr) summary.errors.push({ tabla: 'guias_remitente', error: grErr.message });
            else summary.guias_remitente = payload.length;
          }
        }
      } catch (grErr) {
        summary.errors.push({ tabla: 'guias_remitente', error: grErr.message });
      }

      // 25. Sincronizar Guías Transportista (GRE)
      try {
        if (db.guias_transportista) {
          const localGt = await db.guias_transportista.toArray();
          if (localGt.length > 0) {
            const payload = localGt.map(g => ({
              id: String(g.id),
              empresa_id: empresaId,
              fecha: g.fecha || null,
              guia: g.guia || null,
              destinatario: g.destinatario || null,
              doc_destinatario: g.doc_destinatario || null,
              siat_code: g.siat_code || null,
              items_count: Number(g.items_count) || 1,
              estado_siat: g.estado_siat || 'Aceptado',
              remitente: g.remitente || null,
              doc_remitente: g.doc_remitente || null,
              partida: g.partida || null,
              llegada: g.llegada || null,
              modalidad: g.modalidad || null,
              pagador_flete: g.pagador_flete || null,
              items_desc: g.items_desc || null,
              motivo: g.motivo || null
            }));

            const { error: gtErr } = await supabase.from('guias_transportista').upsert(payload, { onConflict: 'empresa_id,id' });
            if (gtErr) summary.errors.push({ tabla: 'guias_transportista', error: gtErr.message });
            else summary.guias_transportista = payload.length;
          }
        }
      } catch (gtErr) {
        summary.errors.push({ tabla: 'guias_transportista', error: gtErr.message });
      }

      // 26. Sincronizar Transportistas GRE
      try {
        if (db.transportistas_gre) {
          const localTrans = await db.transportistas_gre.toArray();
          if (localTrans.length > 0) {
            const payload = localTrans.map(t => ({
              id: String(t.id),
              empresa_id: empresaId,
              documento: t.documento || null,
              nombre: t.nombre,
              mtc: t.mtc || null,
              estado: t.estado || 'Activo'
            }));

            const { error: tErr } = await supabase.from('transportistas_gre').upsert(payload, { onConflict: 'empresa_id,id' });
            if (tErr) summary.errors.push({ tabla: 'transportistas_gre', error: tErr.message });
            else summary.transportistas_gre = payload.length;
          }
        }
      } catch (tErr) {
        summary.errors.push({ tabla: 'transportistas_gre', error: tErr.message });
      }

      // 27. Sincronizar Conductores GRE
      try {
        if (db.conductores_gre) {
          const localCond = await db.conductores_gre.toArray();
          if (localCond.length > 0) {
            const payload = localCond.map(c => ({
              id: String(c.id),
              empresa_id: empresaId,
              documento: c.documento || null,
              has_star: Boolean(c.hasStar),
              nombre: c.nombre,
              licencia: c.licencia || null,
              telefono: c.telefono || null,
              estado: c.estado || 'Activo'
            }));

            const { error: condErr } = await supabase.from('conductores_gre').upsert(payload, { onConflict: 'empresa_id,id' });
            if (condErr) summary.errors.push({ tabla: 'conductores_gre', error: condErr.message });
            else summary.conductores_gre = payload.length;
          }
        }
      } catch (cErr) {
        summary.errors.push({ tabla: 'conductores_gre', error: cErr.message });
      }

      // 28. Sincronizar Vehículos GRE
      try {
        if (db.vehiculos_gre) {
          const localVeh = await db.vehiculos_gre.toArray();
          if (localVeh.length > 0) {
            const payload = localVeh.map(v => ({
              id: String(v.id),
              empresa_id: empresaId,
              placa: v.placa,
              marca: v.marca || null,
              modelo: v.modelo || null,
              cert_habilitacion: v.cert_habilitacion || null,
              estado: v.estado || 'Activo'
            }));

            const { error: vehErr } = await supabase.from('vehiculos_gre').upsert(payload, { onConflict: 'empresa_id,id' });
            if (vehErr) summary.errors.push({ tabla: 'vehiculos_gre', error: vehErr.message });
            else summary.vehiculos_gre = payload.length;
          }
        }
      } catch (vErr) {
        summary.errors.push({ tabla: 'vehiculos_gre', error: vErr.message });
      }

      // 29. Sincronizar Retenciones
      try {
        if (db.retenciones) {
          const localRet = await db.retenciones.toArray();
          if (localRet.length > 0) {
            const payload = localRet.map(r => ({
              id: String(r.id),
              empresa_id: empresaId,
              fecha: r.fecha || new Date().toISOString(),
              serie_nro: r.serie_nro || '',
              serie: r.serie || '',
              correlativo: r.correlativo || '',
              origen: r.origen || '',
              proveedor_nombre: r.proveedor_nombre || '',
              proveedor_doc: r.proveedor_doc || '',
              retenido: Number(r.retenido) || 0,
              moneda: r.moneda || 'S/',
              tasa_porcentaje: Number(r.tasa_porcentaje) || 3,
              monto_total_comprobante: Number(r.monto_total_comprobante) || 0,
              estado_sunat: r.estado_sunat || 'Registrado',
              sunat_obs: r.sunat_obs || null,
              rr: r.rr || '—',
              observacion: r.observacion || null
            }));

            const { error: retErr } = await supabase.from('retenciones').upsert(payload, { onConflict: 'empresa_id,id' });
            if (retErr) summary.errors.push({ tabla: 'retenciones', error: retErr.message });
            else summary.retenciones = payload.length;
          }
        }
      } catch (retE) {
        summary.errors.push({ tabla: 'retenciones', error: retE.message });
      }

      // 30. Sincronizar Percepciones
      try {
        if (db.percepciones) {
          const localPerc = await db.percepciones.toArray();
          if (localPerc.length > 0) {
            const payload = localPerc.map(p => ({
              id: String(p.id),
              empresa_id: empresaId,
              fecha: p.fecha_iso || p.fecha || new Date().toISOString(),
              serie_nro: p.serie_nro || '',
              serie: p.serie || '',
              correlativo: p.correlativo || '',
              origen: p.origen || '',
              sujeto_nombre: p.sujeto_nombre || '',
              sujeto_doc: p.sujeto_doc || '',
              percibido: Number(p.percibido) || 0,
              moneda: p.moneda || 'S/',
              tasa_porcentaje: Number(p.tasa_porcentaje) || 2,
              monto_total_comprobante: Number(p.monto_total_comprobante) || 0,
              estado_sunat: p.estado_sunat || 'Registrado',
              sunat_obs: p.sunat_obs || null,
              observacion: p.observacion || null
            }));

            const { error: percErr } = await supabase.from('percepciones').upsert(payload, { onConflict: 'empresa_id,id' });
            if (percErr) summary.errors.push({ tabla: 'percepciones', error: percErr.message });
            else summary.percepciones = payload.length;
          }
        }
      } catch (percE) {
        summary.errors.push({ tabla: 'percepciones', error: percE.message });
      }

      // 31. Sincronizar Reversiones
      try {
        if (db.reversiones) {
          const localRev = await db.reversiones.toArray();
          if (localRev.length > 0) {
            const payload = localRev.map(r => ({
              id: String(r.id),
              empresa_id: empresaId,
              fecha: r.fecha || new Date().toISOString(),
              serie_nro: r.serie_nro || '',
              serie: r.serie || '',
              correlativo: r.correlativo || '',
              origen: r.origen || '',
              sujeto_nombre: r.sujeto_nombre || '',
              sujeto_doc: r.sujeto_doc || '',
              monto: Number(r.monto) || 0,
              motivo_reversion: r.motivo_reversion || '',
              estado_sunat: r.estado_sunat || 'Registrado',
              sunat_obs: r.sunat_obs || null,
              observacion: r.observacion || null
            }));

            const { error: revErr } = await supabase.from('reversiones').upsert(payload, { onConflict: 'empresa_id,id' });
            if (revErr) summary.errors.push({ tabla: 'reversiones', error: revErr.message });
            else summary.reversiones = payload.length;
          }
        }
      } catch (revE) {
        summary.errors.push({ tabla: 'reversiones', error: revE.message });
      }

      // 18. Sincronizar módulos especializados: GLORYCHEF (salones, mesas, comandas, recetas) y Hoteles. Cada tabla aislada.
      const glorychefTablas = [
        { tabla: 'salones', leer: () => db.salones?.toArray() || [], mapear: s => ({ id: String(s.id), empresa_id: empresaId, nombre: s.nombre, orden: Number(s.orden) || 0 }) },
        { tabla: 'mesas', leer: () => db.mesas?.toArray() || [], mapear: m => ({ id: String(m.id), empresa_id: empresaId, salon_id: m.salon_id, numero: String(m.numero), capacidad: Number(m.capacidad) || 1, estado: m.estado, comanda_id: m.comanda_id || null }) },
        {
          tabla: 'comandas',
          leer: () => db.comandas?.toArray() || [],
          mapear: c => ({
            id: String(c.id), empresa_id: empresaId, numero: c.numero, tipo: c.tipo, origen: c.origen || 'GLORYCHEF',
            mesa_id: c.mesa_id || null, mesa_numero: c.mesa_numero || null, mozo: c.mozo || null, comensales: Number(c.comensales) || 1,
            cliente_nombre: c.cliente_nombre || null, telefono: c.telefono || null, direccion: c.direccion || null,
            estado: c.estado, items: c.items || [], ventas: c.ventas || [], venta_id: c.venta_id || null,
            pedido_web_id: c.pedido_web_id || null, fecha_apertura: c.fecha_apertura, fecha_cierre: c.fecha_cierre || null
          })
        },
        {
          tabla: 'glorychef_recetas',
          leer: async () => (await db.productos_tienda.toArray()).filter(p => p.es_plato || p.es_insumo || (Array.isArray(p.receta) && p.receta.length > 0)),
          mapear: p => ({
            producto_id: String(p.id), empresa_id: empresaId, es_plato: !!p.es_plato, es_insumo: !!p.es_insumo,
            estacion: p.estacion || 'COCINA', merma_pct: Number(p.merma_pct) || 0, receta: Array.isArray(p.receta) ? p.receta : []
          }),
          conflicto: 'producto_id'
        },
        // Módulo Hoteles
        { tabla: 'hab_tipos', leer: () => db.hab_tipos?.toArray() || [], mapear: t => ({ id: String(t.id), empresa_id: empresaId, nombre: t.nombre, capacidad: Number(t.capacidad) || 1, tarifa: Number(t.tarifa) || 0, descripcion: t.descripcion || null }) },
        { tabla: 'habitaciones', leer: () => db.habitaciones?.toArray() || [], mapear: h => ({ id: String(h.id), empresa_id: empresaId, numero: String(h.numero), piso: Number(h.piso) || 0, tipo_id: h.tipo_id, limpieza: h.limpieza || 'LIMPIA', nota: h.nota || null }) },
        {
          tabla: 'reservas',
          leer: () => db.reservas?.toArray() || [],
          mapear: r => ({
            id: String(r.id), empresa_id: empresaId, codigo: r.codigo, habitacion_id: r.habitacion_id, estado: r.estado,
            llegada: r.llegada, salida: r.salida, salida_real: r.salida_real || null, tarifa: Number(r.tarifa) || 0,
            adultos: Number(r.adultos) || 1, ninos: Number(r.ninos) || 0, canal: r.canal || 'Directo', huesped: r.huesped || {},
            consumos: r.consumos || [], pagos: r.pagos || [], notas: r.notas || null,
            checkin_at: r.checkin_at || null, checkout_at: r.checkout_at || null, motivo_cancelacion: r.motivo_cancelacion || null
          })
        },
        { tabla: 'huespedes', leer: () => db.huespedes?.toArray() || [], mapear: h => ({ id: String(h.id), empresa_id: empresaId, nombre: h.nombre, tipo_doc: h.tipo_doc || null, documento: h.documento || null, nacionalidad: h.nacionalidad || null, telefono: h.telefono || null, email: h.email || null, visitas: Number(h.visitas) || 0 }) },
      ];
      for (const t of glorychefTablas) {
        try {
          const filas = await t.leer();
          if (!filas || filas.length === 0) continue;
          const payload = filas.map(f => ({ ...t.mapear(f), updated_at: new Date().toISOString() }));
          const { error: gcErr } = await supabase.from(t.tabla).upsert(payload, { onConflict: `empresa_id,${t.conflicto || 'id'}` });
          if (gcErr) {
            // No marca toda la sincronización como fallida si aún no se ejecutó glorychef_schema.sql
            summary.glorychef_errors.push({ tabla: t.tabla, error: gcErr.message });
          } else {
            summary.glorychef += payload.length;
          }
        } catch (gcE) {
          summary.glorychef_errors.push({ tabla: t.tabla, error: gcE.message });
        }
      }

      // Notificar a la interfaz de usuario
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glorypos_sync_completed', { detail: summary }));
      }

      return {
        success: summary.errors.length === 0,
        timestamp: new Date().toISOString(),
        summary
      };
    } catch (err) {
      console.error('[syncService] Error general en syncLocalToCloud:', err);
      return { success: false, error: err.message, summary };
    }
  },

  /**
   * Dispara una sincronización en segundo plano con debounce de 500ms.
   */
  triggerBackgroundSync() {
    if (backgroundSyncTimeout) clearTimeout(backgroundSyncTimeout);
    backgroundSyncTimeout = setTimeout(() => {
      this.syncLocalToCloud()
        .then(res => {
          if (res.success) {
            console.info('[syncService] Sincronización en segundo plano completada con éxito.');
          } else if (res.summary?.errors?.length) {
            console.warn('[syncService] Sincronización completada con advertencias (algunas tablas requieren el script SQL en Supabase):', res.summary.errors);
          }
        })
        .catch(err => console.warn('[syncService] Error en sincronización de fondo:', err));
    }, 500);
  },

  // ── DESCARGA DESDE LA NUBE ────────────────────────────────────────────────
  async pullFromCloud() {
    if (!isSupabaseConfigured || (typeof navigator !== 'undefined' && !navigator.onLine) || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    const empresaId = await getCloudEmpresaId();
    if (!empresaId || !(await hasCloudSession())) {
      return { success: false, reason: 'sin_sesion_o_empresa' };
    }

    try {
      const { data: cloudProducts, error } = await supabase
        .from('productos')
        .select('*')
        .eq('empresa_id', empresaId);

      if (error) throw error;

      if (cloudProducts && cloudProducts.length > 0) {
        for (const p of cloudProducts) {
          await db.productos_tienda.put({
            id: p.id,
            codigo_barras: p.codigo_barras,
            nombre: p.nombre,
            categoria: p.categoria,
            unidad_medida: p.unidad_medida,
            foto_url: p.foto_url,
            imagen_url: p.foto_url,
            precio_venta: Number(p.precio_venta),
            precio_compra: Number(p.precio_compra),
            stock_actual: Number(p.stock_actual),
            stock_minimo: Number(p.stock_minimo),
            tipo_venta: p.tipo_venta,
            lote: p.lote,
            fecha_vencimiento: p.fecha_vencimiento,
            principio_activo: p.principio_activo,
            tallas: p.tallas,
            colores: p.colores,
            sabores: p.sabores,
            toppings: p.toppings,
            presentaciones: p.presentaciones,
            activo: p.activo
          });
        }
      }

      return { success: true, count: cloudProducts?.length || 0 };
    } catch (err) {
      console.error('[syncService] Error al descargar de la nube:', err);
      return { success: false, error: err.message };
    }
  },

  // ── ATTACH DEXIE HOOKS AUTOMÁTICOS ────────────────────────────────────────
  /**
   * Se engancha a las operaciones de crear, modificar y eliminar en Dexie
   * para disparar sincronización en tiempo real sin requerir llamadas manuales en cada componente.
   */
  setupDexieSyncHooks() {
    if (hooksAttached || !db || !db.tables) return;
    try {
      db.tables.forEach(table => {
        if (table.name === 'sync_queue' || table.name === 'catalogo_maestro') return;
        
        table.hook('creating', (primKey, obj, trans) => {
          trans.on('complete', () => {
            syncService.triggerBackgroundSync();
          });
        });

        table.hook('updating', (modifications, primKey, obj, trans) => {
          trans.on('complete', () => {
            syncService.triggerBackgroundSync();
          });
        });

        table.hook('deleting', (primKey, obj, trans) => {
          trans.on('complete', () => {
            syncService.triggerBackgroundSync();
          });
        });
      });
      hooksAttached = true;
      console.info('[syncService] Hooks reactivos de Dexie conectados exitosamente.');
    } catch (e) {
      console.warn('[syncService] Advertencia al registrar hooks reactivos de Dexie:', e);
    }
  },

  // ── AUTO-SYNC AL RECUPERAR CONEXIÓN ───────────────────────────────────────
  startAutoSync() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', async () => {
      console.info('[syncService] Conexión a internet restablecida — sincronizando todas las tablas...');
      await this.syncLocalToCloud();
    });
  }
};

// Inicializar hooks reactivos y auto-sync
syncService.setupDexieSyncHooks();
syncService.startAutoSync();
