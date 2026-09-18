import { db } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

export const syncService = {
  // Sincronizar datos locales de Dexie hacia Supabase
  async syncLocalToCloud() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    try {
      // 1. Sincronizar Empresa
      const localEmpresa = await db.config_empresa.get('empresa_activa');
      if (localEmpresa) {
        await supabase.from('empresas').upsert({
          id: 'empresa_activa',
          nombre: localEmpresa.nombre || 'GLORYPOS BOLIVIA',
          nit_ci: localEmpresa.nit_ci || '8472910014',
          rubro: localEmpresa.rubro || 'ABARROTES',
          ciudad: localEmpresa.ciudad || 'Santa Cruz',
          direccion: localEmpresa.direccion || '',
          telefono: localEmpresa.telefono || '',
          updated_at: new Date().toISOString()
        });
      }

      // 2. Sincronizar Productos
      const localProducts = await db.productos_tienda.toArray();
      if (localProducts.length > 0) {
        const payload = localProducts.map(p => ({
          id: String(p.id),
          empresa_id: 'empresa_activa',
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
        if (prodErr) console.warn('Sync productos warning:', prodErr);
      }

      // 3. Sincronizar Clientes
      const localClients = await db.clientes.toArray();
      if (localClients.length > 0) {
        const payload = localClients.map(c => ({
          id: String(c.id),
          empresa_id: 'empresa_activa',
          razon_social: c.razon_social,
          nit_ci: String(c.nit_ci || '0'),
          telefono: c.telefono || null,
          saldo_credito: Number(c.saldo_credito) || 0,
          total_compras: Number(c.total_compras) || 0
        }));

        const { error: cliErr } = await supabase.from('clientes').upsert(payload, { onConflict: 'id' });
        if (cliErr) console.warn('Sync clientes warning:', cliErr);
      }

      // 4. Sincronizar Ventas
      const localVentas = await db.ventas.toArray();
      if (localVentas.length > 0) {
        const payload = localVentas.map(v => ({
          id: String(v.id),
          empresa_id: 'empresa_activa',
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
        if (vtaErr) console.warn('Sync ventas warning:', vtaErr);
      }

      return { success: true, timestamp: new Date().toISOString() };
    } catch (err) {
      console.error('Error durante la sincronización a Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  // Descargar productos de la nube a Dexie
  async pullFromCloud() {
    if (!isSupabaseConfigured || !navigator.onLine || !supabase) {
      return { success: false, reason: 'offline_or_unconfigured' };
    }

    try {
      const { data: cloudProducts, error } = await supabase
        .from('productos')
        .select('*')
        .eq('empresa_id', 'empresa_activa');

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
      console.error('Error al descargar de Supabase:', err);
      return { success: false, error: err.message };
    }
  }
};
