import { db } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Cola de Sincronización Offline → Nube ─────────────────────────────────────
// Cada vez que se guarda un registro en Dexie, se puede encolar o sincronizar directamente.
// Al recuperar conexión o ante cualquier cambio, el sync procesa la información de forma resiliente.

const MAX_INTENTOS = 3;
const BACKOFF_MS = [2000, 5000, 15000];

let backgroundSyncTimeout = null;

export const syncService = {

  // ── COLA OFFLINE ──────────────────────────────────────────────────────────

  /**
   * Agrega un registro a la cola de sincronización pendiente.
   */
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

  /**
   * Devuelve cuántos registros hay pendientes de sincronizar.
   */
  async getQueueCount() {
    try {
      return await db.sync_queue.where('synced_at').equals(null).count();
    } catch {
      return 0;
    }
  },

  // ── PROCESAMIENTO DE COLA ─────────────────────────────────────────────────

  /**
   * Procesa todos los registros pendientes en la cola offline.
   */
  async processQueue() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { synced: 0, failed: 0, reason: 'offline_or_unconfigured' };
    }

    let synced = 0;
    let failed = 0;

    try {
      const pending = await db.sync_queue
        .filter(item => !item.synced_at && item.intentos < MAX_INTENTOS)
        .toArray();

      for (const item of pending) {
        try {
          const data = JSON.parse(item.data || '{}');

          if (item.accion === 'upsert') {
            const { error } = await supabase
              .from(item.tabla)
              .upsert(data, { onConflict: 'id' });
            if (error) throw error;
          } else if (item.accion === 'delete') {
            const { error } = await supabase
              .from(item.tabla)
              .delete()
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

      // Limpiar registros antiguos ya sincronizados (> 7 días)
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.sync_queue
        .filter(item => item.synced_at && item.synced_at < cutoff)
        .delete();

    } catch (err) {
      console.error('[syncService] Error en processQueue:', err);
    }

    return { synced, failed };
  },

  // ── SYNC COMPLETO LOCAL → NUBE (CON TOLERANCIA TOTAL A FALLOS) ─────────────

  /**
   * Sincroniza todas las entidades locales hacia Supabase.
   * Cada tabla se ejecuta en un bloque try/catch aislado para que un fallo en
   * una tabla jamás bloquee la sincronización de productos, ventas o clientes.
   */
  async syncLocalToCloud() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    const summary = {
      empresa: false,
      productos: 0,
      clientes: 0,
      ventas: 0,
      kardex: 0,
      caja_chica: 0,
      compras: 0,
      errors: []
    };

    try {
      const localEmpresa = await db.config_empresa.get('empresa_activa');
      const empresaId = localEmpresa?.id || 'empresa_activa';

      // 1. Procesar cola offline primero
      try {
        await this.processQueue();
      } catch (qErr) {
        console.warn('[syncService] Advertencia procesando cola:', qErr);
      }

      // 2. Sincronizar Empresa (Sanitizada contra columnas remotas existentes)
      if (localEmpresa) {
        try {
          const empresaPayload = {
            id: empresaId,
            nombre: localEmpresa.nombre || 'GLORYPOS BOLIVIA S.R.L.',
            nit_ci: String(localEmpresa.nit_ci || '0'),
            rubro: localEmpresa.rubro || 'ABARROTES',
            plan_tipo: localEmpresa.plan_tipo || 'PRO',
            ciudad: localEmpresa.ciudad || 'Santa Cruz, Bolivia',
            direccion: localEmpresa.direccion || '',
            telefono: localEmpresa.telefono || '',
            email: localEmpresa.email || '',
            updated_at: new Date().toISOString()
          };

          const { error: empErr } = await supabase.from('empresas').upsert(empresaPayload, { onConflict: 'id' });
          if (empErr) {
            summary.errors.push({ tabla: 'empresas', error: empErr.message });
          } else {
            summary.empresa = true;
          }
        } catch (eErr) {
          summary.errors.push({ tabla: 'empresas', error: eErr.message });
        }
      }

      // 3. Sincronizar Catálogo de Productos
      try {
        const localProducts = await db.productos_tienda.toArray();
        if (localProducts.length > 0) {
          const payload = localProducts.map(p => ({
            id: String(p.id),
            empresa_id: empresaId,
            codigo_barras: p.codigo_barras || null,
            nombre: p.nombre,
            categoria: p.categoria || 'General',
            unidad_medida: p.unidad_medida || 'Unidad',
            foto_url: p.foto_url || null,
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

          const { error: prodErr } = await supabase.from('productos').upsert(payload, { onConflict: 'id' });
          if (prodErr) {
            summary.errors.push({ tabla: 'productos', error: prodErr.message });
          } else {
            summary.productos = payload.length;
          }
        }
      } catch (pErr) {
        summary.errors.push({ tabla: 'productos', error: pErr.message });
      }

      // 4. Sincronizar Directorio de Clientes
      try {
        const localClients = await db.clientes.toArray();
        if (localClients.length > 0) {
          const payload = localClients.map(c => ({
            id: String(c.id),
            empresa_id: empresaId,
            razon_social: c.razon_social,
            nit_ci: String(c.nit_ci || '0'),
            telefono: c.telefono || null,
            direccion: c.direccion || null,
            email: c.email || null,
            saldo_credito: Number(c.saldo_credito) || 0,
            total_compras: Number(c.total_compras) || 0
          }));

          const { error: cliErr } = await supabase.from('clientes').upsert(payload, { onConflict: 'id' });
          if (cliErr) {
            summary.errors.push({ tabla: 'clientes', error: cliErr.message });
          } else {
            summary.clientes = payload.length;
          }
        }
      } catch (cErr) {
        summary.errors.push({ tabla: 'clientes', error: cErr.message });
      }

      // 5. Sincronizar Ventas y Documentos
      try {
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
            estado_siat: v.estado_siat || 'NO_APLICA',
            cuf: v.cuf || null,
            items: Array.isArray(v.items) ? v.items : []
          }));

          const { error: vtaErr } = await supabase.from('ventas').upsert(payload, { onConflict: 'id' });
          if (vtaErr) {
            summary.errors.push({ tabla: 'ventas', error: vtaErr.message });
          } else {
            summary.ventas = payload.length;
          }
        }
      } catch (vErr) {
        summary.errors.push({ tabla: 'ventas', error: vErr.message });
      }

      // 6. Sincronizar Kardex (Movimientos de Stock)
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
              costo_unitario: Number(k.costo_unitario) || 0,
              created_at: k.fecha || new Date().toISOString()
            }));

            const { error: kdxErr } = await supabase.from('kardex').upsert(payload, { onConflict: 'id' });
            if (kdxErr) {
              summary.errors.push({ tabla: 'kardex', error: kdxErr.message });
            } else {
              summary.kardex = payload.length;
            }
          }
        }
      } catch (kErr) {
        summary.errors.push({ tabla: 'kardex', error: kErr.message });
      }

      // 7. Sincronizar Movimientos de Caja Chica
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
              created_at: m.fecha || new Date().toISOString()
            }));

            const { error: cajaErr } = await supabase.from('caja_chica').upsert(payload, { onConflict: 'id' });
            if (cajaErr) {
              summary.errors.push({ tabla: 'caja_chica', error: cajaErr.message });
            } else {
              summary.caja_chica = payload.length;
            }
          }
        }
      } catch (cjErr) {
        summary.errors.push({ tabla: 'caja_chica', error: cjErr.message });
      }

      // Notificar a la interfaz de usuario
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('glorypos_sync_completed', { detail: summary }));
      }

      return {
        success: true,
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
   * Evita saturar la conexión si se realizan múltiples modificaciones en ráfaga.
   */
  triggerBackgroundSync() {
    if (backgroundSyncTimeout) clearTimeout(backgroundSyncTimeout);
    backgroundSyncTimeout = setTimeout(() => {
      this.syncLocalToCloud()
        .then(res => {
          if (res.success) {
            console.info('[syncService] Sincronización en segundo plano completada con éxito.');
          }
        })
        .catch(err => console.warn('[syncService] Error en sincronización de fondo:', err));
    }, 500);
  },

  // ── PULL DESDE NUBE ───────────────────────────────────────────────────────

  async pullFromCloud() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    try {
      const localEmpresa = await db.config_empresa.get('empresa_activa');
      const empresaId = localEmpresa?.id || 'empresa_activa';

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

  // ── AUTO-SYNC AL RECUPERAR INTERNET ──────────────────────────────────────

  /**
   * Listener automático para reintentar la sincronización cuando se reconecta internet.
   */
  startAutoSync() {
    if (typeof window === 'undefined') return;
    window.addEventListener('online', async () => {
      console.info('[syncService] Conexión online detectada — sincronizando datos pendientes...');
      await this.syncLocalToCloud();
    });
  },
};

// Iniciar auto-sync al importar el módulo
syncService.startAutoSync();
