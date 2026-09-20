import { db } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

// ── Cola de Sincronización Offline → Nube ─────────────────────────────────────
// Cada vez que se guarda un registro importante en Dexie, se encola aquí.
// Al recuperar internet, el worker procesa la cola automáticamente.

const MAX_INTENTOS = 3;
const BACKOFF_MS = [2000, 5000, 15000]; // Tiempos de espera entre reintentos

export const syncService = {

  // ── COLA ──────────────────────────────────────────────────────────────────

  /**
   * Agrega un registro a la cola de sincronización pendiente.
   * @param {string} tabla — nombre de la tabla Supabase destino
   * @param {'upsert'|'delete'} accion
   * @param {object} data — datos del registro
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
   * @returns {Promise<number>}
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
   * Procesa todos los registros pendientes en la cola.
   * Usa backoff exponencial en caso de error.
   * @returns {Promise<{synced: number, failed: number}>}
   */
  async processQueue() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { synced: 0, failed: 0, reason: 'offline_or_unconfigured' };
    }

    let synced = 0;
    let failed = 0;

    try {
      // Solo traer pendientes (synced_at = null) con menos de MAX_INTENTOS
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

          // Marcar como sincronizado
          await db.sync_queue.update(item.id, {
            synced_at: new Date().toISOString(),
          });
          synced++;
        } catch (err) {
          console.warn(`[syncService] Error al sync ${item.tabla}#${item.registro_id}:`, err.message);
          // Incrementar intento con backoff
          const nextIntento = item.intentos + 1;
          await db.sync_queue.update(item.id, { intentos: nextIntento });
          if (nextIntento < MAX_INTENTOS) {
            await new Promise(r => setTimeout(r, BACKOFF_MS[item.intentos] || 15000));
          }
          failed++;
        }
      }

      // Limpiar registros ya sincronizados con más de 7 días
      const cutoff = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      await db.sync_queue
        .filter(item => item.synced_at && item.synced_at < cutoff)
        .delete();

    } catch (err) {
      console.error('[syncService] Error general en processQueue:', err);
    }

    return { synced, failed };
  },

  // ── SYNC COMPLETO (LEGADO / MANUAL) ──────────────────────────────────────

  /**
   * Sincroniza todos los datos locales hacia Supabase (modo push completo).
   * Obtiene el empresa_id dinámicamente de Dexie.
   */
  async syncLocalToCloud() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    try {
      const localEmpresa = await db.config_empresa.get('empresa_activa');
      const empresaId = localEmpresa?.id || 'empresa_activa';

      // Primero procesar la cola pendiente
      await this.processQueue();

      // Sincronizar Empresa
      if (localEmpresa) {
        await supabase.from('empresas').upsert({
          id: empresaId,
          slug: localEmpresa.slug || 'admin',
          nombre: localEmpresa.nombre || 'GLORYPOS BOLIVIA',
          nit_ci: localEmpresa.nit_ci || '',
          rubro: localEmpresa.rubro || 'ABARROTES',
          ciudad: localEmpresa.ciudad || 'Santa Cruz',
          direccion: localEmpresa.direccion || '',
          telefono: localEmpresa.telefono || '',
          plan_tipo: localEmpresa.plan_tipo || 'TRIAL',
          estado_suscripcion: localEmpresa.estado_suscripcion || 'ACTIVO',
          updated_at: new Date().toISOString()
        }, { onConflict: 'id' });
      }

      // Sincronizar Productos
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
          tallas: p.tallas || [],
          colores: p.colores || [],
          sabores: p.sabores || [],
          toppings: p.toppings || [],
          presentaciones: p.presentaciones || [],
          activo: p.activo !== false,
          updated_at: new Date().toISOString()
        }));

        const { error: prodErr } = await supabase.from('productos').upsert(payload, { onConflict: 'id' });
        if (prodErr) console.warn('[syncService] productos:', prodErr);
      }

      // Sincronizar Clientes
      const localClients = await db.clientes.toArray();
      if (localClients.length > 0) {
        const payload = localClients.map(c => ({
          id: String(c.id),
          empresa_id: empresaId,
          razon_social: c.razon_social,
          nit_ci: String(c.nit_ci || '0'),
          telefono: c.telefono || null,
          saldo_credito: Number(c.saldo_credito) || 0,
          total_compras: Number(c.total_compras) || 0
        }));

        const { error: cliErr } = await supabase.from('clientes').upsert(payload, { onConflict: 'id' });
        if (cliErr) console.warn('[syncService] clientes:', cliErr);
      }

      // Sincronizar Ventas
      const localVentas = await db.ventas.toArray();
      if (localVentas.length > 0) {
        const payload = localVentas.map(v => ({
          id: String(v.id),
          empresa_id: empresaId,
          fecha: v.fecha,
          correlativo: v.correlativo,
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
          items: v.items || []
        }));

        const { error: vtaErr } = await supabase.from('ventas').upsert(payload, { onConflict: 'id' });
        if (vtaErr) console.warn('[syncService] ventas:', vtaErr);
      }

      return { success: true, timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('[syncService] Error general:', err);
      return { success: false, error: err.message };
    }
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
      console.error('[syncService] Error al descargar:', err);
      return { success: false, error: err.message };
    }
  },

  // ── AUTO-SYNC AL RECUPERAR INTERNET ──────────────────────────────────────

  /**
   * Registra un listener que dispara processQueue automáticamente
   * cuando el dispositivo recupera la conexión a internet.
   */
  startAutoSync() {
    window.addEventListener('online', async () => {
      console.info('[syncService] Conexión recuperada — procesando cola...');
      const result = await this.processQueue();
      console.info(`[syncService] Cola procesada: ${result.synced} sync, ${result.failed} fallidos`);
    });
  },
};

// Iniciar auto-sync al importar el módulo
syncService.startAutoSync();
