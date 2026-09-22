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
      proveedores: 0,
      cotizaciones: 0,
      membresias: 0,
      pedidos_web: 0,
      roles: 0,
      usuarios: 0,
      retenciones: 0,
      percepciones: 0,
      reversiones: 0,
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

      // 8. Sincronizar Compras
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
              proveedor_nit: c.proveedor_nit || '0',
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

            const { error: cmpErr } = await supabase.from('compras').upsert(payload, { onConflict: 'id' });
            if (cmpErr) {
              summary.errors.push({ tabla: 'compras', error: cmpErr.message });
            } else {
              summary.compras = payload.length;
            }
          }
        }
      } catch (cmpE) {
        summary.errors.push({ tabla: 'compras', error: cmpE.message });
      }

      // 9. Sincronizar Proveedores
      try {
        if (db.proveedores) {
          const localProvs = await db.proveedores.toArray();
          if (localProvs.length > 0) {
            const payload = localProvs.map(p => ({
              id: String(p.id),
              empresa_id: empresaId,
              razon_social: p.razon_social || 'Proveedor',
              nit: p.nit || '0',
              telefono: p.telefono || null,
              ciudad: p.ciudad || null,
              direccion: p.direccion || null,
              contacto: p.contacto || null,
              rubro: p.rubro || 'General'
            }));

            const { error: provErr } = await supabase.from('proveedores').upsert(payload, { onConflict: 'id' });
            if (provErr) {
              summary.errors.push({ tabla: 'proveedores', error: provErr.message });
            } else {
              summary.proveedores = payload.length;
            }
          }
        }
      } catch (prvE) {
        summary.errors.push({ tabla: 'proveedores', error: prvE.message });
      }

      // 10. Sincronizar Cotizaciones
      try {
        if (db.cotizaciones) {
          const localCotiz = await db.cotizaciones.toArray();
          if (localCotiz.length > 0) {
            const payload = localCotiz.map(c => ({
              id: String(c.id),
              empresa_id: empresaId,
              fecha: c.fecha || new Date().toISOString(),
              correlativo: c.correlativo || `CT01-${Date.now()}`,
              cliente_nombre: c.cliente_nombre || 'Cliente',
              cliente_ci_nit: c.cliente_ci_nit || '0',
              cliente_telefono: c.cliente_telefono || null,
              validez_dias: Number(c.validez_dias) || 15,
              condiciones: c.condiciones || null,
              items: Array.isArray(c.items) ? c.items : [],
              descuento: Number(c.descuento) || 0,
              total: Number(c.total) || 0,
              estado: c.estado || 'Borrador'
            }));

            const { error: cotErr } = await supabase.from('cotizaciones').upsert(payload, { onConflict: 'id' });
            if (cotErr) {
              summary.errors.push({ tabla: 'cotizaciones', error: cotErr.message });
            } else {
              summary.cotizaciones = payload.length;
            }
          }
        }
      } catch (cotE) {
        summary.errors.push({ tabla: 'cotizaciones', error: cotE.message });
      }

      // 11. Sincronizar Membresías
      try {
        let localMemb = [];
        if (db.membresias) {
          localMemb = await db.membresias.toArray();
        }
        if (localMemb.length === 0) {
          const saved = localStorage.getItem('glorypos_membresias_v2');
          if (saved) localMemb = JSON.parse(saved);
        }
        if (localMemb.length > 0) {
          const payload = localMemb.map(m => ({
            id: String(m.id || `mem-${Date.now()}`),
            empresa_id: empresaId,
            cliente_nombre: m.cliente_nombre || 'Cliente',
            cliente_doc: m.cliente_doc || null,
            plan_nombre: m.plan_nombre || 'Membresía Mensual',
            sucursal: m.sucursal || 'Principal',
            monto_cuota: Number(m.monto_cuota) || 0,
            frecuencia: m.frecuencia || 'Mensual',
            fecha_inicio: m.fecha_inicio || new Date().toISOString().split('T')[0],
            proximo_cobro: m.proximo_cobro || null,
            estado: m.estado || 'Activa'
          }));

          const { error: memErr } = await supabase.from('membresias').upsert(payload, { onConflict: 'id' });
          if (memErr) {
            summary.errors.push({ tabla: 'membresias', error: memErr.message });
          } else {
            summary.membresias = payload.length;
          }
        }
      } catch (memE) {
        summary.errors.push({ tabla: 'membresias', error: memE.message });
      }

      // 12. Sincronizar Pedidos Web
      try {
        let localPedidos = [];
        if (db.pedidos_web) {
          localPedidos = await db.pedidos_web.toArray();
        }
        if (localPedidos.length === 0) {
          const saved = localStorage.getItem('glorypos_pedidos_web_v2');
          if (saved) localPedidos = JSON.parse(saved);
        }
        if (localPedidos.length > 0) {
          const payload = localPedidos.map(p => ({
            id: String(p.id || `pw-${Date.now()}`),
            empresa_id: empresaId,
            fecha: p.fecha || new Date().toISOString(),
            cliente_nombre: p.cliente_nombre || 'Cliente',
            telefono: p.telefono || null,
            total: Number(p.total) || 0,
            estado: p.estado || 'Nuevo',
            items: Array.isArray(p.items) ? p.items : []
          }));

          const { error: pwErr } = await supabase.from('pedidos_web').upsert(payload, { onConflict: 'id' });
          if (pwErr) {
            summary.errors.push({ tabla: 'pedidos_web', error: pwErr.message });
          } else {
            summary.pedidos_web = payload.length;
          }
        }
      } catch (pwE) {
        summary.errors.push({ tabla: 'pedidos_web', error: pwE.message });
      }

      // 13. Sincronizar Roles y Permisos
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
              updated_at: new Date().toISOString()
            }));

            const { error: rolErr } = await supabase.from('roles').upsert(payload, { onConflict: 'id' });
            if (rolErr) {
              summary.errors.push({ tabla: 'roles', error: rolErr.message });
            } else {
              summary.roles = payload.length;
            }
          }
        }
      } catch (rE) {
        summary.errors.push({ tabla: 'roles', error: rE.message });
      }

      // 14. Sincronizar Usuarios
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
              activo: u.activo !== false,
              updated_at: new Date().toISOString()
            }));

            const { error: usrErr } = await supabase.from('usuarios').upsert(payload, { onConflict: 'id' });
            if (usrErr) {
              summary.errors.push({ tabla: 'usuarios', error: usrErr.message });
            } else {
              summary.usuarios = payload.length;
            }
          }
        }
      } catch (uE) {
        summary.errors.push({ tabla: 'usuarios', error: uE.message });
      }

      // 15. Sincronizar Retenciones
      try {
        if (db.retenciones) {
          const localRet = await db.retenciones.toArray();
          if (localRet.length > 0) {
            const payload = localRet.map(r => ({
              id: String(r.id),
              empresa_id: empresaId,
              fecha: r.fecha || new Date().toISOString(),
              serie_nro: r.serie_nro || '',
              origen: r.origen || '',
              proveedor_nombre: r.proveedor_nombre || '',
              proveedor_doc: r.proveedor_doc || '',
              retenido: Number(r.retenido) || 0,
              moneda: r.moneda || 'S/',
              tasa_porcentaje: Number(r.tasa_porcentaje) || 3,
              monto_total_comprobante: Number(r.monto_total_comprobante) || 0,
              estado_sunat: r.estado_sunat || 'Registrado'
            }));

            const { error: retErr } = await supabase.from('retenciones').upsert(payload, { onConflict: 'id' });
            if (retErr) {
              summary.errors.push({ tabla: 'retenciones', error: retErr.message });
            } else {
              summary.retenciones = payload.length;
            }
          }
        }
      } catch (retE) {
        summary.errors.push({ tabla: 'retenciones', error: retE.message });
      }

      // 16. Sincronizar Percepciones
      try {
        if (db.percepciones) {
          const localPerc = await db.percepciones.toArray();
          if (localPerc.length > 0) {
            const payload = localPerc.map(p => ({
              id: String(p.id),
              empresa_id: empresaId,
              fecha: p.fecha || new Date().toISOString(),
              serie_nro: p.serie_nro || '',
              origen: p.origen || '',
              sujeto_nombre: p.sujeto_nombre || '',
              sujeto_doc: p.sujeto_doc || '',
              percibido: Number(p.percibido) || 0,
              moneda: p.moneda || 'S/',
              tasa_porcentaje: Number(p.tasa_porcentaje) || 2,
              monto_total_comprobante: Number(p.monto_total_comprobante) || 0,
              estado_sunat: p.estado_sunat || 'Registrado'
            }));

            const { error: percErr } = await supabase.from('percepciones').upsert(payload, { onConflict: 'id' });
            if (percErr) {
              summary.errors.push({ tabla: 'percepciones', error: percErr.message });
            } else {
              summary.percepciones = payload.length;
            }
          }
        }
      } catch (percE) {
        summary.errors.push({ tabla: 'percepciones', error: percE.message });
      }

      // 17. Sincronizar Reversiones
      try {
        if (db.reversiones) {
          const localRev = await db.reversiones.toArray();
          if (localRev.length > 0) {
            const payload = localRev.map(r => ({
              id: String(r.id),
              empresa_id: empresaId,
              fecha: r.fecha || new Date().toISOString(),
              serie_nro: r.serie_nro || '',
              origen: r.origen || '',
              sujeto_nombre: r.sujeto_nombre || '',
              sujeto_doc: r.sujeto_doc || '',
              monto: Number(r.monto) || 0,
              motivo_reversion: r.motivo_reversion || '',
              estado_sunat: r.estado_sunat || 'Registrado'
            }));

            const { error: revErr } = await supabase.from('reversiones').upsert(payload, { onConflict: 'id' });
            if (revErr) {
              summary.errors.push({ tabla: 'reversiones', error: revErr.message });
            } else {
              summary.reversiones = payload.length;
            }
          }
        }
      } catch (revE) {
        summary.errors.push({ tabla: 'reversiones', error: revE.message });
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
