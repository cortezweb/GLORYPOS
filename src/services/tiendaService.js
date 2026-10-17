// Tienda en línea · Pedidos web con comprobante automático y cierre por el administrador.
// Flujo: el cliente confirma en la tienda → el pedido entra a "Pedidos Web" con su comprobante
// generado (pendiente) → el administrador lo prepara, confirma el cierre (se registra la venta,
// se descuenta el inventario) e imprime.
import { db } from '../db/dexie';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncService } from './syncService';
import { restaurantService } from './restaurantService';
import { empresaHasModule, GLORYCHEF_MODULE_ID } from '../config/modules';

const LEGACY_KEY = 'glorypos_pedidos_web_v2';
const SETTINGS_KEY = 'glorypos_tienda_checkout';

export const ESTADOS_PEDIDO = {
  NUEVO: { label: 'Nuevo', badge: 'bg-[#FF6B35]/10 text-[#E85B28] border-[#FF6B35]/30' },
  PREPARANDO: { label: 'En preparación', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  LISTO: { label: 'Listo / en camino', badge: 'bg-sky-50 text-sky-700 border-sky-200' },
  CERRADO: { label: 'Cerrado', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  ANULADO: { label: 'Anulado', badge: 'bg-rose-50 text-rose-700 border-rose-200' },
};

export const METODOS_PAGO_WEB = [
  { id: 'EFECTIVO', label: 'Efectivo contra entrega', desc: 'Pagas al recibir o recoger tu pedido' },
  { id: 'QR', label: 'QR Simple', desc: 'Te enviamos el QR por WhatsApp para pagar' },
  { id: 'TRANSFERENCIA', label: 'Transferencia bancaria', desc: 'Te enviamos los datos de la cuenta' },
  { id: 'TARJETA', label: 'Tarjeta (POS al entregar)', desc: 'Llevamos el POS a tu domicilio o pagas en tienda' },
];

// Configuración del checkout (editable desde Tienda Virtual)
export function getCheckoutSettings() {
  const base = {
    delivery_activo: true,
    recojo_activo: true,
    costo_delivery: 10,
    envio_gratis_desde: 0,
    direccion_recojo: '',
    tipo_comprobante: 'NOTA_VENTA',
    serie: 'NVW1',
  };
  try {
    return { ...base, ...JSON.parse(localStorage.getItem(SETTINGS_KEY) || '{}') };
  } catch {
    return base;
  }
}

export function saveCheckoutSettings(settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ ...getCheckoutSettings(), ...settings }));
}

export function costoEnvio(tipoEntrega, subtotal, settings = getCheckoutSettings()) {
  if (tipoEntrega !== 'DELIVERY') return 0;
  if (settings.envio_gratis_desde > 0 && subtotal >= settings.envio_gratis_desde) return 0;
  return Number(settings.costo_delivery) || 0;
}

const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// Normaliza pedidos antiguos (estado 'Nuevo'/'Cerrado', fecha en texto) al formato actual
function normalizar(p) {
  const estadoMap = { nuevo: 'NUEVO', cerrado: 'CERRADO', anulado: 'ANULADO' };
  const estado = ESTADOS_PEDIDO[p.estado] ? p.estado : (estadoMap[String(p.estado || '').toLowerCase()] || 'NUEVO');
  const fechaIso = p.fecha_iso || (p.fecha && !Number.isNaN(Date.parse(p.fecha)) ? new Date(p.fecha).toISOString() : null) || p.created_at || new Date().toISOString();
  return { ...p, estado, fecha_iso: fechaIso };
}

async function siguienteComprobante(settings) {
  const pedidos = await db.pedidos_web.toArray();
  const max = pedidos.reduce((m, p) => {
    if (!p.comprobante?.numero || p.comprobante.serie !== settings.serie) return m;
    return Math.max(m, Number(String(p.comprobante.numero || '').replace(/\D/g, '')) || 0);
  }, 0);
  const numero = String(max + 1).padStart(6, '0');
  return { tipo: settings.tipo_comprobante, serie: settings.serie, numero, correlativo: `${settings.serie}-${numero}`, estado: 'PENDIENTE' };
}

function payloadNube(p, empresaId) {
  return {
    id: p.id,
    empresa_id: empresaId,
    fecha: p.fecha_iso,
    cliente_nombre: p.cliente_nombre,
    telefono: p.telefono || null,
    total: Number(p.total) || 0,
    estado: p.estado,
    items: p.items || [],
    // Columnas agregadas por supabase/tienda_pedidos_update.sql
    numero_orden: p.numero_orden || null,
    documento: p.documento || null,
    email: p.email || null,
    direccion: p.direccion || null,
    entrega: p.entrega || {},
    pago: p.pago || {},
    comprobante: p.comprobante || {},
    notas: p.notas || null,
    subtotal: Number(p.subtotal ?? p.total) || 0,
    envio: Number(p.envio) || 0,
    venta_id: p.venta_id || null,
    updated_at: new Date().toISOString(),
  };
}

async function subirPedido(p, empresaId) {
  if (!isSupabaseConfigured || !supabase || !navigator.onLine) return;
  const full = payloadNube(p, empresaId);
  const { error } = await supabase.from('pedidos_web').upsert(full);
  if (error) {
    // Si aún no se ejecutó la migración, guarda las columnas base para no perder el pedido
    const { id, empresa_id, fecha, cliente_nombre, telefono, total, estado, items } = full;
    await supabase.from('pedidos_web').upsert({ id, empresa_id, fecha, cliente_nombre, telefono, total, estado, items });
  }
}

export const tiendaService = {
  // ── Lado cliente (tienda pública) ─────────────────────────────────────
  async crearPedido({ empresa, cart, cliente, entrega, pago, notas }) {
    const settings = getCheckoutSettings();
    const subtotal = round2(cart.reduce((a, it) => a + it.precio * it.cantidad, 0));
    const envio = costoEnvio(entrega.tipo, subtotal, settings);
    const now = new Date();
    const pedido = {
      id: `pw-${now.getTime()}`,
      numero_orden: `PW-${String(now.getTime()).slice(-6)}`,
      fecha: now.toLocaleString('es-BO'),
      fecha_iso: now.toISOString(),
      cliente_nombre: cliente.nombre.trim(),
      documento: cliente.documento?.trim() || '',
      telefono: cliente.telefono.trim(),
      email: cliente.email?.trim() || '',
      direccion: entrega.tipo === 'DELIVERY' ? entrega.direccion.trim() : 'Recojo en tienda',
      entrega: { tipo: entrega.tipo, referencia: entrega.referencia || '', costo: envio },
      pago: { metodo: pago.metodo, cambio_de: pago.cambio_de ? Number(pago.cambio_de) : null },
      notas: notas || '',
      subtotal,
      envio,
      total: round2(subtotal + envio),
      estado: 'NUEVO',
      items: cart.map(it => ({
        producto_id: it.id,
        nombre: it.nombre,
        cantidad: it.cantidad,
        precio: it.precio,
        subtotal: round2(it.precio * it.cantidad),
      })),
    };
    // El número de comprobante lo asigna el sistema del negocio al recibir el pedido (ver listar()),
    // así no se repite aunque muchos clientes compren a la vez desde sus celulares.
    pedido.comprobante = { tipo: settings.tipo_comprobante, serie: settings.serie, numero: null, correlativo: null, estado: 'PENDIENTE' };

    const { data: sesion } = isSupabaseConfigured && supabase ? await supabase.auth.getSession() : { data: null };
    if (isSupabaseConfigured && supabase && !sesion?.session) {
      // Cliente sin sesión: el servidor asigna la empresa según el subdominio de la tienda.
      // Si falla, el cliente debe saberlo (desde su celular el pedido no se reintenta solo).
      const { error } = await supabase.rpc('tienda_crear_pedido', {
        p_slug: empresa?.slug,
        p_pedido: payloadNube(pedido, null),
      });
      if (error) throw new Error('No se pudo enviar tu pedido. Revisa tu conexión e intenta de nuevo.');
    }

    await db.pedidos_web.put(pedido);
    // GLORYCHEF: si el negocio también es restaurante, el pedido entra a cocina como delivery
    if (empresaHasModule(empresa, GLORYCHEF_MODULE_ID)) {
      restaurantService.crearComandaDesdeTienda(pedido).catch(err => console.warn('[tiendaService] GLORYCHEF:', err));
    }
    try {
      if (sesion?.session) await subirPedido(pedido, empresa?.id);
    } catch (err) {
      console.warn('[tiendaService] Pedido guardado local; se sincronizará luego:', err);
    }
    window.dispatchEvent(new CustomEvent('glorypos_order_created', { detail: pedido }));
    syncService.triggerBackgroundSync?.();
    return pedido;
  },

  // ── Lado administrador (ventana Pedidos Web) ──────────────────────────
  async migrarLegacy() {
    try {
      const legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) || '[]');
      if (!Array.isArray(legacy) || legacy.length === 0) return;
      const existentes = new Set((await db.pedidos_web.toArray()).map(p => p.id));
      const nuevos = legacy.filter(p => p?.id && !existentes.has(p.id)).map(normalizar);
      if (nuevos.length) await db.pedidos_web.bulkPut(nuevos);
    } catch (err) {
      console.warn('[tiendaService] No se pudo migrar pedidos antiguos:', err);
    }
  },

  // Trae los pedidos hechos desde otros dispositivos (los clientes compran desde su celular)
  async traerDeLaNube(empresaId) {
    if (!isSupabaseConfigured || !supabase || !navigator.onLine) return 0;
    const { data, error } = await supabase.from('pedidos_web').select('*').eq('empresa_id', empresaId || 'empresa_activa');
    if (error || !data) return 0;
    const locales = Object.fromEntries((await db.pedidos_web.toArray()).map(p => [p.id, p]));
    const nuevos = data
      .filter(r => !locales[r.id] || (locales[r.id].estado === 'NUEVO' && r.estado !== 'NUEVO'))
      .map(r => normalizar({ ...locales[r.id], ...r, fecha_iso: r.fecha, fecha: new Date(r.fecha).toLocaleString('es-BO') }));
    if (nuevos.length) await db.pedidos_web.bulkPut(nuevos);
    return nuevos.length;
  },

  // Lista los pedidos y genera automáticamente el comprobante (pendiente) de los que aún no lo tienen
  async listar(empresaId) {
    const todos = (await db.pedidos_web.toArray()).map(normalizar).sort((a, b) => a.fecha_iso.localeCompare(b.fecha_iso));
    const settings = getCheckoutSettings();
    for (const p of todos) {
      if (p.estado === 'ANULADO' || p.estado === 'CERRADO' || p.comprobante?.correlativo) continue;
      p.comprobante = { ...(await siguienteComprobante(settings)), tipo: p.comprobante?.tipo || settings.tipo_comprobante };
      await db.pedidos_web.put(p);
      await subirPedido(p, empresaId).catch(() => {});
    }
    return todos.reverse();
  },

  async cambiarEstado(pedido, estado, empresaId) {
    const updated = { ...pedido, estado, [`${estado.toLowerCase()}_at`]: new Date().toISOString() };
    await db.pedidos_web.put(updated);
    await subirPedido(updated, empresaId).catch(() => {});
    return updated;
  },

  async anular(pedido, motivo, empresaId) {
    const updated = {
      ...pedido,
      estado: 'ANULADO',
      motivo_anulacion: motivo || '',
      comprobante: pedido.comprobante ? { ...pedido.comprobante, estado: 'ANULADO' } : null,
    };
    await db.pedidos_web.put(updated);
    await subirPedido(updated, empresaId).catch(() => {});
    return updated;
  },

  // Confirma el cierre: registra la venta con el comprobante del pedido y descuenta el inventario
  async confirmarCierre(pedido, { metodoPago, empresaId, usuario } = {}) {
    if (pedido.estado === 'CERRADO' && pedido.venta_id) return db.ventas.get(pedido.venta_id);
    if (pedido.estado === 'ANULADO') throw new Error('El pedido está anulado.');
    const comprobante = pedido.comprobante || (await siguienteComprobante(getCheckoutSettings()));
    const items = (pedido.items || []).map((it, idx) => ({
      id: `web-${pedido.id}-${idx}`,
      productId: it.producto_id || null,
      nombre: it.nombre,
      categoria: 'Tienda en línea',
      unidad_medida: 'Unidad',
      tipo_venta: 'UNIDAD',
      presId: 'u',
      presNombre: 'Unidad',
      precio: Number(it.precio) || 0,
      cantidad: Number(it.cantidad) || 1,
      subtotal: round2((Number(it.precio) || 0) * (Number(it.cantidad) || 1)),
      customDetails: null,
    }));
    if (pedido.envio > 0) {
      items.push({
        id: `web-${pedido.id}-envio`, productId: null, nombre: 'Costo de envío (delivery)', categoria: 'Servicio',
        unidad_medida: 'Servicio', tipo_venta: 'UNIDAD', presId: 'u', presNombre: 'Unidad',
        precio: pedido.envio, cantidad: 1, subtotal: pedido.envio, customDetails: null,
      });
    }
    const total = round2(items.reduce((a, i) => a + i.subtotal, 0));
    const venta = {
      // Mismo id que el reflejo del pedido en Supabase: al cerrar se reemplaza por la venta real
      id: `vta-${pedido.id}`,
      fecha: new Date().toISOString(),
      correlativo: comprobante.correlativo,
      tipo_documento: comprobante.tipo || 'NOTA_VENTA',
      serie: comprobante.serie,
      cliente_nombre: pedido.cliente_nombre,
      cliente_ci_nit: pedido.documento || '0',
      cliente_telefono: pedido.telefono,
      metodo_pago: metodoPago || pedido.pago?.metodo || 'EFECTIVO',
      num_operacion: null,
      descuento_porcentaje: 0,
      subtotal: total,
      total,
      monto_recibido: total,
      cambio: 0,
      estado_siat: 'NO_APLICA',
      cuf: null,
      origen: 'TIENDA_EN_LINEA',
      pedido_web_id: pedido.id,
      entrega: pedido.entrega,
      usuario: usuario || null,
      items,
    };
    await db.ventas.put(venta);
    await restaurantService.descontarInventarioVenta(items, venta.correlativo);
    const cerrado = {
      ...pedido,
      estado: 'CERRADO',
      venta_id: venta.id,
      cerrado_at: venta.fecha,
      comprobante: { ...comprobante, estado: 'EMITIDO' },
      pago: { ...(pedido.pago || {}), metodo: venta.metodo_pago },
    };
    await db.pedidos_web.put(cerrado);
    await subirPedido(cerrado, empresaId).catch(() => {});
    syncService.triggerBackgroundSync?.();
    return venta;
  },
};
