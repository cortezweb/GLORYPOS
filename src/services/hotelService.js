// Módulo Hoteles · Lógica de habitaciones, reservas, estadías (folio) y limpieza.
// Una reserva es también la estadía: RESERVADA → EN_CASA (check-in) → FINALIZADA (check-out).
// Todo se guarda primero en Dexie (offline) y se sincroniza a Supabase vía syncService.
import { db } from '../db/dexie';
import { syncService } from './syncService';

export const RESERVA_ESTADOS = {
  RESERVADA: 'Reservada',
  EN_CASA: 'En casa',
  FINALIZADA: 'Finalizada',
  CANCELADA: 'Cancelada',
  NO_SHOW: 'No show',
};

export const CANALES = ['Directo', 'WhatsApp', 'Teléfono', 'Booking', 'Airbnb', 'Expedia', 'Agencia', 'Walk-in'];
export const TIPOS_DOC = ['CI', 'Pasaporte', 'DNI', 'Otro'];

// Estado visible de una habitación en el rack de recepción
export const HAB_ESTADOS = {
  LIBRE: { label: 'Libre', card: 'bg-white border-slate-200', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RESERVADA: { label: 'Llega hoy', card: 'bg-indigo-50/50 border-indigo-200', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  OCUPADA: { label: 'Ocupada', card: 'bg-sky-50/60 border-sky-200', badge: 'bg-sky-100 text-sky-800 border-sky-200' },
  SALIDA: { label: 'Sale hoy', card: 'bg-amber-50/60 border-amber-300', badge: 'bg-amber-100 text-amber-800 border-amber-300' },
  SUCIA: { label: 'Por limpiar', card: 'bg-orange-50/50 border-orange-200', badge: 'bg-orange-100 text-orange-800 border-orange-200' },
  MANTENIMIENTO: { label: 'Mantenimiento', card: 'bg-slate-100 border-slate-300', badge: 'bg-slate-200 text-slate-700 border-slate-300' },
};

const EVENT_NAME = 'hoteles_updated';
let channel = null;
try {
  channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('glorypos_hoteles') : null;
} catch {
  channel = null;
}

function notify(detail = {}) {
  if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  try { channel?.postMessage(detail); } catch {}
  syncService.triggerBackgroundSync?.();
}

export function onHotelChange(callback) {
  const handler = (e) => callback(e?.detail || e?.data || {});
  window.addEventListener(EVENT_NAME, handler);
  channel?.addEventListener('message', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    channel?.removeEventListener('message', handler);
  };
}

const uid = (p) => `${p}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

// ── Fechas (YYYY-MM-DD en hora local) ────────────────────────────────────
export function hoyISO(offsetDias = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offsetDias);
  return toISODate(d);
}
export function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}
export function addDias(iso, n) {
  const [y, m, d] = iso.split('-').map(Number);
  return toISODate(new Date(y, m - 1, d + n));
}
export function noches(llegada, salida) {
  const [y1, m1, d1] = llegada.split('-').map(Number);
  const [y2, m2, d2] = salida.split('-').map(Number);
  const diff = Math.round((new Date(y2, m2 - 1, d2) - new Date(y1, m1 - 1, d1)) / 86400000);
  return Math.max(1, diff);
}
export function formatFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, m - 1, d).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' });
}

// Reservas que bloquean la habitación (no canceladas ni finalizadas)
const reservaActiva = (r) => r.estado === 'RESERVADA' || r.estado === 'EN_CASA';
const seCruzan = (a1, a2, b1, b2) => a1 < b2 && b1 < a2;

// ── Folio (cuenta del huésped) ───────────────────────────────────────────
export function folio(reserva) {
  const n = noches(reserva.llegada, reserva.salida);
  const alojamiento = round2(n * (Number(reserva.tarifa) || 0));
  const consumos = (reserva.consumos || []).filter(c => !c.anulado);
  const totalConsumos = round2(consumos.reduce((a, c) => a + c.precio * c.cantidad, 0));
  const consumosPendientes = consumos.filter(c => !c.pagado);
  const pagadoAlojamiento = round2((reserva.pagos || []).reduce((a, p) => a + (Number(p.alojamiento) || 0), 0));
  const totalPagado = round2((reserva.pagos || []).reduce((a, p) => a + (Number(p.monto) || 0), 0));
  const saldoAlojamiento = round2(Math.max(0, alojamiento - pagadoAlojamiento));
  const saldoConsumos = round2(consumosPendientes.reduce((a, c) => a + c.precio * c.cantidad, 0));
  return {
    noches: n,
    alojamiento,
    totalConsumos,
    total: round2(alojamiento + totalConsumos),
    totalPagado,
    saldoAlojamiento,
    saldoConsumos,
    saldo: round2(saldoAlojamiento + saldoConsumos),
    consumosPendientes,
  };
}

export const hotelService = {
  // ── Configuración ──────────────────────────────────────────────────────
  async ensureSeed() {
    if ((await db.hab_tipos.count()) > 0) return;
    const tipos = [
      { id: 'tipo-simple', nombre: 'Simple', capacidad: 1, tarifa: 150, descripcion: 'Cama de 1.5 plazas, baño privado, TV, WiFi' },
      { id: 'tipo-doble', nombre: 'Doble Matrimonial', capacidad: 2, tarifa: 220, descripcion: 'Cama de 2 plazas, baño privado, TV, WiFi' },
      { id: 'tipo-twin', nombre: 'Doble Twin', capacidad: 2, tarifa: 230, descripcion: 'Dos camas de 1.5 plazas' },
      { id: 'tipo-suite', nombre: 'Suite Ejecutiva', capacidad: 2, tarifa: 380, descripcion: 'Sala de estar, minibar, jacuzzi' },
      { id: 'tipo-familiar', nombre: 'Familiar', capacidad: 4, tarifa: 320, descripcion: 'Cama matrimonial + 2 camas simples' },
    ];
    const habs = [
      ['101', 1, 'tipo-simple'], ['102', 1, 'tipo-doble'], ['103', 1, 'tipo-doble'], ['104', 1, 'tipo-twin'],
      ['201', 2, 'tipo-doble'], ['202', 2, 'tipo-twin'], ['203', 2, 'tipo-familiar'], ['204', 2, 'tipo-suite'],
    ].map(([numero, piso, tipo_id]) => ({ id: `hab-${numero}`, numero, piso, tipo_id, limpieza: 'LIMPIA', nota: '' }));
    await db.hab_tipos.bulkPut(tipos);
    await db.habitaciones.bulkPut(habs);
  },

  async saveTipo(tipo) {
    const data = { capacidad: 2, tarifa: 0, ...tipo, id: tipo.id || uid('tipo') };
    await db.hab_tipos.put(data);
    notify();
    return data;
  },

  async deleteTipo(id) {
    if ((await db.habitaciones.where('tipo_id').equals(id).count()) > 0) {
      throw new Error('Hay habitaciones de este tipo. Cámbialas de tipo antes de eliminarlo.');
    }
    await db.hab_tipos.delete(id);
    notify();
  },

  async saveHabitacion(hab) {
    const numero = String(hab.numero || '').trim();
    if (!numero) throw new Error('Ingresa el número de habitación.');
    const dup = (await db.habitaciones.toArray()).find(h => h.numero === numero && h.id !== hab.id);
    if (dup) throw new Error(`Ya existe la habitación ${numero}.`);
    const data = { limpieza: 'LIMPIA', nota: '', piso: 1, ...hab, numero, id: hab.id || uid('hab') };
    await db.habitaciones.put(data);
    notify();
    return data;
  },

  async deleteHabitacion(id) {
    const activas = (await db.reservas.where('habitacion_id').equals(id).toArray()).filter(reservaActiva);
    if (activas.length > 0) throw new Error('La habitación tiene reservas o huéspedes activos.');
    await db.habitaciones.delete(id);
    notify();
  },

  // ── Limpieza y mantenimiento ───────────────────────────────────────────
  async setLimpieza(habId, limpieza, nota = '') {
    const changes = { limpieza, nota };
    if (limpieza === 'LIMPIA') changes.limpiada_at = new Date().toISOString();
    await db.habitaciones.update(habId, changes);
    notify();
  },

  // ── Reservas y estadías ────────────────────────────────────────────────
  async disponibilidad(habId, llegada, salida, excluirId = null) {
    const reservas = await db.reservas.where('habitacion_id').equals(habId).toArray();
    return !reservas.some(r => r.id !== excluirId && reservaActiva(r) && seCruzan(llegada, salida, r.llegada, r.salida));
  },

  async habitacionesLibres(llegada, salida, excluirId = null) {
    const [habs, reservas] = await Promise.all([db.habitaciones.toArray(), db.reservas.toArray()]);
    return habs.filter(h =>
      h.limpieza !== 'MANTENIMIENTO' &&
      !reservas.some(r => r.id !== excluirId && r.habitacion_id === h.id && reservaActiva(r) && seCruzan(llegada, salida, r.llegada, r.salida))
    );
  },

  async nextCodigo() {
    const all = await db.reservas.toArray();
    const max = all.reduce((m, r) => Math.max(m, Number(String(r.codigo || '').replace(/\D/g, '')) || 0), 0);
    return `R-${String(max + 1).padStart(5, '0')}`;
  },

  async guardarReserva(data) {
    if (!data.huesped?.nombre?.trim()) throw new Error('Ingresa el nombre del huésped.');
    if (!data.habitacion_id) throw new Error('Elige una habitación.');
    if (!(data.llegada < data.salida)) throw new Error('La salida debe ser posterior a la llegada.');
    const libre = await this.disponibilidad(data.habitacion_id, data.llegada, data.salida, data.id);
    if (!libre) throw new Error('La habitación ya está ocupada o reservada en esas fechas.');

    const existente = data.id ? await db.reservas.get(data.id) : null;
    const reserva = {
      estado: 'RESERVADA',
      adultos: 1,
      ninos: 0,
      canal: 'Directo',
      consumos: [],
      pagos: [],
      notas: '',
      created_at: new Date().toISOString(),
      ...existente,
      ...data,
      id: data.id || uid('res'),
      codigo: existente?.codigo || data.codigo || (await this.nextCodigo()),
      tarifa: Number(data.tarifa) || 0,
      updated_at: new Date().toISOString(),
    };
    await db.reservas.put(reserva);
    await this.registrarHuesped(reserva.huesped);
    notify({ id: reserva.id });
    return reserva;
  },

  async registrarHuesped(h) {
    if (!h?.nombre) return;
    const id = h.documento ? `hues-${String(h.documento).trim().toUpperCase()}` : uid('hues');
    const prev = await db.huespedes.get(id);
    await db.huespedes.put({ ...prev, ...h, id, visitas: prev?.visitas || 0, updated_at: new Date().toISOString() });
  },

  async buscarHuesped(texto) {
    const t = String(texto || '').trim().toLowerCase();
    if (t.length < 2) return [];
    return (await db.huespedes.toArray())
      .filter(h => h.nombre?.toLowerCase().includes(t) || String(h.documento || '').toLowerCase().includes(t))
      .slice(0, 6);
  },

  async checkIn(reservaId) {
    const r = await db.reservas.get(reservaId);
    if (!r) return null;
    const hab = await db.habitaciones.get(r.habitacion_id);
    if (hab?.limpieza === 'MANTENIMIENTO') throw new Error(`La habitación ${hab.numero} está en mantenimiento.`);
    const otraEnCasa = (await db.reservas.where('habitacion_id').equals(r.habitacion_id).toArray())
      .find(x => x.id !== r.id && x.estado === 'EN_CASA');
    if (otraEnCasa) throw new Error(`La habitación ${hab?.numero} todavía tiene un huésped en casa.`);
    await db.reservas.update(reservaId, { estado: 'EN_CASA', checkin_at: new Date().toISOString() });
    const h = await db.huespedes.get(`hues-${String(r.huesped?.documento || '').trim().toUpperCase()}`);
    if (h) await db.huespedes.update(h.id, { visitas: (h.visitas || 0) + 1, ultima_visita: r.llegada });
    notify({ id: reservaId });
    return db.reservas.get(reservaId);
  },

  async cancelar(reservaId, motivo, estado = 'CANCELADA') {
    await db.reservas.update(reservaId, { estado, motivo_cancelacion: motivo || '', cancelada_at: new Date().toISOString() });
    notify({ id: reservaId });
  },

  async cambiarHabitacion(reservaId, nuevaHabId) {
    const r = await db.reservas.get(reservaId);
    if (!r) return null;
    const libre = await this.disponibilidad(nuevaHabId, r.estado === 'EN_CASA' ? hoyISO() : r.llegada, r.salida, r.id);
    if (!libre) throw new Error('La nueva habitación no está libre en esas fechas.');
    await db.reservas.update(reservaId, { habitacion_id: nuevaHabId });
    if (r.estado === 'EN_CASA') await db.habitaciones.update(r.habitacion_id, { limpieza: 'SUCIA' });
    notify({ id: reservaId });
    return db.reservas.get(reservaId);
  },

  async agregarConsumo(reservaId, producto, cantidad = 1, origen = 'Recepción') {
    const r = await db.reservas.get(reservaId);
    if (!r) return null;
    const consumos = [...(r.consumos || []), {
      id: uid('cons'),
      producto_id: producto.id || null,
      nombre: producto.nombre,
      precio: Number(producto.precio_venta ?? producto.precio) || 0,
      cantidad: Number(cantidad) || 1,
      fecha: new Date().toISOString(),
      origen,
      pagado: false,
    }];
    await db.reservas.update(reservaId, { consumos });
    notify({ id: reservaId });
    return db.reservas.get(reservaId);
  },

  async anularConsumo(reservaId, consumoId) {
    const r = await db.reservas.get(reservaId);
    const consumos = (r?.consumos || []).map(c => (c.id === consumoId ? { ...c, anulado: true } : c));
    await db.reservas.update(reservaId, { consumos });
    notify({ id: reservaId });
  },

  // Líneas para el carrito del POS. tipo: 'ADELANTO' (monto) o 'CUENTA' (saldo completo del folio)
  itemsParaCobro(reserva, habNumero, { tipo = 'CUENTA', monto = 0 } = {}) {
    const f = folio(reserva);
    const base = { unidad_medida: 'Servicio', tipo_venta: 'UNIDAD', presId: 'u', presNombre: 'Unidad', categoria: 'Hospedaje' };
    if (tipo === 'ADELANTO') {
      const m = round2(Math.min(Number(monto) || 0, f.saldoAlojamiento));
      if (m <= 0) return [];
      return [{
        ...base,
        id: `hotel-${reserva.id}-adelanto-${Date.now()}`,
        productId: null,
        nombre: `Adelanto hospedaje Hab. ${habNumero} (${reserva.codigo})`,
        precio: m,
        cantidad: 1,
        subtotal: m,
        customDetails: { tipo: 'HOTEL', concepto: 'ALOJAMIENTO', monto: m },
      }];
    }
    const lineas = [];
    if (f.saldoAlojamiento > 0) {
      const pagado = round2(f.alojamiento - f.saldoAlojamiento);
      lineas.push({
        ...base,
        id: `hotel-${reserva.id}-aloj`,
        productId: null,
        nombre: `Hospedaje Hab. ${habNumero} · ${f.noches} noche(s) x Bs. ${Number(reserva.tarifa).toFixed(2)}${pagado > 0 ? ` (saldo, adelanto Bs. ${pagado.toFixed(2)})` : ''}`,
        precio: f.saldoAlojamiento,
        cantidad: 1,
        subtotal: f.saldoAlojamiento,
        customDetails: { tipo: 'HOTEL', concepto: 'ALOJAMIENTO', monto: f.saldoAlojamiento },
      });
    }
    for (const c of f.consumosPendientes) {
      lineas.push({
        ...base,
        id: `hotel-${reserva.id}-${c.id}`,
        productId: c.producto_id,
        nombre: `${c.nombre} (Hab. ${habNumero})`,
        categoria: 'Consumo habitación',
        precio: c.precio,
        cantidad: c.cantidad,
        subtotal: round2(c.precio * c.cantidad),
        customDetails: { tipo: 'HOTEL', concepto: 'CONSUMO', consumo_id: c.id },
      });
    }
    return lineas;
  },

  // Se llama desde CheckoutModal cuando la venta proviene de un folio de hotel
  async registrarPago(reservaId, items, venta, { checkout = false } = {}) {
    const r = await db.reservas.get(reservaId);
    if (!r) return;
    const alojamiento = round2(items.filter(i => i.customDetails?.concepto === 'ALOJAMIENTO').reduce((a, i) => a + i.subtotal, 0));
    const consumoIds = items.filter(i => i.customDetails?.concepto === 'CONSUMO').map(i => i.customDetails.consumo_id);
    const pagos = [...(r.pagos || []), {
      id: uid('pago'),
      venta_id: venta.id,
      correlativo: venta.correlativo,
      metodo: venta.metodo_pago,
      monto: venta.total,
      alojamiento,
      fecha: new Date().toISOString(),
    }];
    const consumos = (r.consumos || []).map(c => (consumoIds.includes(c.id) ? { ...c, pagado: true, venta_id: venta.id } : c));
    await db.reservas.update(reservaId, { pagos, consumos });
    if (checkout) await this.checkOut(reservaId);
    notify({ id: reservaId });
  },

  async checkOut(reservaId) {
    const r = await db.reservas.get(reservaId);
    if (!r) return;
    const f = folio(r);
    if (f.saldo > 0.009) throw new Error(`El huésped tiene un saldo pendiente de Bs. ${f.saldo.toFixed(2)}.`);
    await db.reservas.update(reservaId, { estado: 'FINALIZADA', checkout_at: new Date().toISOString(), salida_real: hoyISO() });
    await db.habitaciones.update(r.habitacion_id, { limpieza: 'SUCIA' });
    notify({ id: reservaId });
  },

  // Estado de cada habitación para el rack, en una fecha
  estadoHabitacion(hab, reservas, fecha = hoyISO()) {
    const enCasa = reservas.find(r => r.habitacion_id === hab.id && r.estado === 'EN_CASA');
    if (enCasa) return { estado: enCasa.salida <= fecha ? 'SALIDA' : 'OCUPADA', reserva: enCasa };
    if (hab.limpieza === 'MANTENIMIENTO') return { estado: 'MANTENIMIENTO', reserva: null };
    const llega = reservas.find(r => r.habitacion_id === hab.id && r.estado === 'RESERVADA' && r.llegada <= fecha && fecha < r.salida);
    if (hab.limpieza === 'SUCIA') return { estado: 'SUCIA', reserva: llega || null };
    if (llega) return { estado: 'RESERVADA', reserva: llega };
    return { estado: 'LIBRE', reserva: null };
  },
};
