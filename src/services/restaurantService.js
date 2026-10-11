// GLORYCHEF · Lógica del módulo de restaurante (salones, mesas, comandas, cocina y recetas).
// Todo se guarda primero en Dexie (offline) y se sincroniza a Supabase vía syncService.
import { db } from '../db/dexie';
import { syncService } from './syncService';

export const ESTACIONES = [
  { id: 'COCINA', label: 'Cocina' },
  { id: 'PARRILLA', label: 'Parrilla' },
  { id: 'BAR', label: 'Bar / Barra' },
];

export const TIPOS_PEDIDO = {
  MESA: 'Mesa',
  LLEVAR: 'Para llevar',
  DELIVERY: 'Delivery',
};

// Estados de cada plato dentro de una comanda
export const ITEM_ESTADOS = {
  PENDIENTE: 'Por enviar',
  ENVIADO: 'En cola',
  PREPARANDO: 'Preparando',
  LISTO: 'Listo',
  ENTREGADO: 'Entregado',
  ANULADO: 'Anulado',
};

const EVENT_NAME = 'glorychef_updated';
let channel = null;
try {
  channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('glorychef') : null;
} catch {
  channel = null;
}

function notify(detail = {}) {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail }));
  }
  try {
    channel?.postMessage(detail);
  } catch {}
  syncService.triggerBackgroundSync?.();
}

// Suscripción a cambios (misma pestaña y otras pestañas del navegador, ej. pantalla de cocina)
export function onGlorychefChange(callback) {
  const handler = (e) => callback(e?.detail || e?.data || {});
  window.addEventListener(EVENT_NAME, handler);
  channel?.addEventListener('message', handler);
  return () => {
    window.removeEventListener(EVENT_NAME, handler);
    channel?.removeEventListener('message', handler);
  };
}

const uid = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
const round3 = (n) => Math.round((Number(n) || 0) * 1000) / 1000;
const round2 = (n) => Math.round((Number(n) || 0) * 100) / 100;

export const itemActivo = (it) => it.estado !== 'ANULADO';
export const totalComanda = (comanda) =>
  round2((comanda?.items || []).filter(itemActivo).reduce((acc, it) => acc + it.precio * it.cantidad, 0));
export const totalPendienteCobro = (comanda) =>
  round2((comanda?.items || []).filter(it => itemActivo(it) && !it.pagado).reduce((acc, it) => acc + it.precio * it.cantidad, 0));

export const restaurantService = {
  // ── Salones y mesas ────────────────────────────────────────────────────
  async ensureSeed() {
    const count = await db.salones.count();
    if (count > 0) return;
    const salones = [
      { id: 'salon-principal', nombre: 'Principal', orden: 1 },
      { id: 'salon-terraza', nombre: 'Terraza', orden: 2 },
    ];
    const mesas = [];
    for (let i = 1; i <= 6; i++) {
      mesas.push({ id: `mesa-p${i}`, salon_id: 'salon-principal', numero: String(i).padStart(2, '0'), capacidad: i % 3 === 0 ? 6 : 4, estado: 'LIBRE', comanda_id: null });
    }
    for (let i = 1; i <= 4; i++) {
      mesas.push({ id: `mesa-t${i}`, salon_id: 'salon-terraza', numero: `T${i}`, capacidad: 4, estado: 'LIBRE', comanda_id: null });
    }
    await db.salones.bulkPut(salones);
    await db.mesas.bulkPut(mesas);
  },

  async listSalones() {
    return (await db.salones.toArray()).sort((a, b) => (a.orden || 0) - (b.orden || 0));
  },

  async saveSalon(salon) {
    const data = { ...salon, id: salon.id || uid('salon'), orden: salon.orden ?? (await db.salones.count()) + 1 };
    await db.salones.put(data);
    notify({ tipo: 'salon' });
    return data;
  },

  async deleteSalon(salonId) {
    const mesas = await db.mesas.where('salon_id').equals(salonId).toArray();
    if (mesas.some(m => m.estado !== 'LIBRE' && m.estado !== 'RESERVADA')) {
      throw new Error('El salón tiene mesas con comandas abiertas.');
    }
    await db.mesas.bulkDelete(mesas.map(m => m.id));
    await db.salones.delete(salonId);
    notify({ tipo: 'salon' });
  },

  async listMesas() {
    return (await db.mesas.toArray()).sort((a, b) => String(a.numero).localeCompare(String(b.numero), 'es', { numeric: true }));
  },

  async saveMesa(mesa) {
    const data = { estado: 'LIBRE', comanda_id: null, capacidad: 4, ...mesa, id: mesa.id || uid('mesa') };
    await db.mesas.put(data);
    notify({ tipo: 'mesa' });
    return data;
  },

  async deleteMesa(mesaId) {
    const mesa = await db.mesas.get(mesaId);
    if (mesa?.comanda_id) throw new Error('La mesa tiene una comanda abierta.');
    await db.mesas.delete(mesaId);
    notify({ tipo: 'mesa' });
  },

  async setReserva(mesaId, reservada) {
    const mesa = await db.mesas.get(mesaId);
    if (!mesa || mesa.comanda_id) return;
    await db.mesas.update(mesaId, { estado: reservada ? 'RESERVADA' : 'LIBRE' });
    notify({ tipo: 'mesa' });
  },

  // ── Comandas ──────────────────────────────────────────────────────────
  async nextNumero() {
    const all = await db.comandas.toArray();
    return all.reduce((max, c) => Math.max(max, Number(c.numero) || 0), 0) + 1;
  },

  async crearComanda({ tipo = 'MESA', mesa = null, mozo = '', comensales = 1, cliente_nombre = '', telefono = '', direccion = '', origen = 'GLORYCHEF', items = [] }) {
    const comanda = {
      id: uid('cmd'),
      numero: await this.nextNumero(),
      tipo,
      mesa_id: mesa?.id || null,
      mesa_numero: mesa?.numero || null,
      mozo,
      comensales: Number(comensales) || 1,
      cliente_nombre,
      telefono,
      direccion,
      origen,
      estado: 'ABIERTA',
      fecha_apertura: new Date().toISOString(),
      fecha_cierre: null,
      venta_id: null,
      items,
    };
    await db.comandas.put(comanda);
    if (mesa) {
      await db.mesas.update(mesa.id, { estado: 'OCUPADA', comanda_id: comanda.id });
    }
    notify({ tipo: 'comanda', id: comanda.id });
    return comanda;
  },

  async abrirMesa(mesa, { mozo, comensales }) {
    if (mesa.comanda_id) return db.comandas.get(mesa.comanda_id);
    return this.crearComanda({ tipo: 'MESA', mesa, mozo, comensales });
  },

  async getComanda(id) {
    return db.comandas.get(id);
  },

  async listComandasAbiertas() {
    return db.comandas.where('estado').anyOf('ABIERTA', 'CUENTA').toArray();
  },

  async updateComanda(id, changes) {
    await db.comandas.update(id, changes);
    notify({ tipo: 'comanda', id });
    return db.comandas.get(id);
  },

  async agregarItem(comandaId, producto, cantidad = 1, nota = '') {
    const comanda = await db.comandas.get(comandaId);
    if (!comanda) return null;
    const items = [...(comanda.items || [])];
    // Si ya existe el mismo plato sin enviar y con la misma nota, se suma la cantidad
    const existing = items.find(it => it.producto_id === producto.id && it.estado === 'PENDIENTE' && (it.nota || '') === (nota || ''));
    if (existing) {
      existing.cantidad = round3(existing.cantidad + cantidad);
    } else {
      items.push({
        id: uid('it'),
        producto_id: producto.id,
        nombre: producto.nombre,
        categoria: producto.categoria,
        precio: Number(producto.precio_venta) || 0,
        cantidad,
        nota,
        estacion: producto.estacion || 'COCINA',
        estado: 'PENDIENTE',
        ronda: null,
        enviado_at: null,
        listo_at: null,
        pagado: false,
      });
    }
    return this.updateComanda(comandaId, { items });
  },

  async actualizarItem(comandaId, itemId, changes) {
    const comanda = await db.comandas.get(comandaId);
    if (!comanda) return null;
    const items = (comanda.items || []).map(it => (it.id === itemId ? { ...it, ...changes } : it));
    return this.updateComanda(comandaId, { items: items.filter(it => it.cantidad > 0) });
  },

  async anularItem(comandaId, itemId, motivo) {
    const comanda = await db.comandas.get(comandaId);
    const item = comanda?.items?.find(it => it.id === itemId);
    if (!item) return null;
    // Lo que aún no salió a cocina se borra; lo enviado queda registrado como anulado
    if (item.estado === 'PENDIENTE') {
      return this.updateComanda(comandaId, { items: comanda.items.filter(it => it.id !== itemId) });
    }
    return this.actualizarItem(comandaId, itemId, { estado: 'ANULADO', anulado_motivo: motivo || 'Sin motivo', anulado_at: new Date().toISOString() });
  },

  async enviarACocina(comandaId) {
    const comanda = await db.comandas.get(comandaId);
    if (!comanda) return null;
    const ronda = Math.max(0, ...comanda.items.map(it => it.ronda || 0)) + 1;
    const now = new Date().toISOString();
    let enviados = 0;
    const items = comanda.items.map(it => {
      if (it.estado !== 'PENDIENTE') return it;
      enviados++;
      return { ...it, estado: 'ENVIADO', ronda, enviado_at: now };
    });
    if (enviados === 0) return comanda;
    const updated = await this.updateComanda(comandaId, { items, ultima_ronda_at: now });
    notify({ tipo: 'cocina', id: comandaId, nuevo: true });
    return updated;
  },

  async setEstadoItemCocina(comandaId, itemId, estado) {
    const changes = { estado };
    if (estado === 'PREPARANDO') changes.preparando_at = new Date().toISOString();
    if (estado === 'LISTO') changes.listo_at = new Date().toISOString();
    if (estado === 'ENTREGADO') changes.entregado_at = new Date().toISOString();
    return this.actualizarItem(comandaId, itemId, changes);
  },

  async pedirCuenta(comandaId) {
    const comanda = await this.updateComanda(comandaId, { estado: 'CUENTA' });
    if (comanda?.mesa_id) await db.mesas.update(comanda.mesa_id, { estado: 'CUENTA' });
    notify({ tipo: 'mesa' });
    return comanda;
  },

  async cambiarMesa(comandaId, nuevaMesaId) {
    const comanda = await db.comandas.get(comandaId);
    const nueva = await db.mesas.get(nuevaMesaId);
    if (!comanda || !nueva) return null;
    if (nueva.comanda_id) throw new Error(`La mesa ${nueva.numero} ya está ocupada.`);
    if (comanda.mesa_id) await db.mesas.update(comanda.mesa_id, { estado: 'LIBRE', comanda_id: null });
    await db.mesas.update(nueva.id, { estado: comanda.estado === 'CUENTA' ? 'CUENTA' : 'OCUPADA', comanda_id: comanda.id });
    return this.updateComanda(comandaId, { mesa_id: nueva.id, mesa_numero: nueva.numero, tipo: 'MESA' });
  },

  async liberarMesa(comanda) {
    if (comanda?.mesa_id) {
      const mesa = await db.mesas.get(comanda.mesa_id);
      if (mesa && mesa.comanda_id === comanda.id) {
        await db.mesas.update(comanda.mesa_id, { estado: 'LIBRE', comanda_id: null });
      }
    }
  },

  async anularComanda(comandaId, motivo) {
    const comanda = await db.comandas.get(comandaId);
    if (!comanda) return;
    await this.liberarMesa(comanda);
    await this.updateComanda(comandaId, { estado: 'ANULADA', fecha_cierre: new Date().toISOString(), anulado_motivo: motivo || '' });
  },

  // Ítems que se llevan al carrito del POS para cobrar (todos o una selección para dividir la cuenta)
  itemsParaCobro(comanda, itemIds = null) {
    return (comanda.items || [])
      .filter(it => itemActivo(it) && !it.pagado && (!itemIds || itemIds.includes(it.id)))
      .map(it => ({
        id: `cmd-${comanda.id}-${it.id}`,
        productId: it.producto_id,
        nombre: it.nombre + (it.nota ? ` (${it.nota})` : ''),
        categoria: it.categoria,
        unidad_medida: 'Plato / Porción',
        tipo_venta: 'UNIDAD',
        presId: 'u',
        presNombre: 'Unidad',
        precio: it.precio,
        cantidad: it.cantidad,
        subtotal: round2(it.precio * it.cantidad),
        customDetails: { tipo: 'GLORYCHEF', comanda_id: comanda.id, item_id: it.id, nota: it.nota || '' },
      }));
  },

  // Se llama desde CheckoutModal cuando la venta proviene de una comanda
  async registrarPago(comandaId, itemIds, venta) {
    const comanda = await db.comandas.get(comandaId);
    if (!comanda) return;
    const items = comanda.items.map(it => (itemIds.includes(it.id) ? { ...it, pagado: true, venta_id: venta.id } : it));
    const quedaPorCobrar = items.some(it => itemActivo(it) && !it.pagado);
    const ventas = [...(comanda.ventas || []), { id: venta.id, correlativo: venta.correlativo, total: venta.total }];
    if (quedaPorCobrar) {
      await this.updateComanda(comandaId, { items, ventas });
      return;
    }
    await this.liberarMesa(comanda);
    await this.updateComanda(comandaId, {
      items,
      ventas,
      venta_id: venta.id,
      estado: 'PAGADA',
      fecha_cierre: new Date().toISOString(),
    });
  },

  // Módulo Hoteles: carga los platos a la cuenta del huésped en lugar de cobrarlos ahora.
  // El inventario (recetas) se descuenta cuando el hotel cobra el folio.
  async cargarAHabitacion(comandaId, reservaId, itemIds = null) {
    const comanda = await db.comandas.get(comandaId);
    const reserva = await db.reservas.get(reservaId);
    if (!comanda || !reserva) return;
    if (reserva.estado !== 'EN_CASA') throw new Error('El huésped ya no está en casa.');
    const aCargar = (comanda.items || []).filter(it => itemActivo(it) && !it.pagado && (!itemIds || itemIds.includes(it.id)));
    const consumos = [...(reserva.consumos || []), ...aCargar.map(it => ({
      id: uid('cons'),
      producto_id: it.producto_id,
      nombre: it.nombre + (it.nota ? ` (${it.nota})` : ''),
      precio: it.precio,
      cantidad: it.cantidad,
      fecha: new Date().toISOString(),
      origen: `Restaurante · comanda #${comanda.numero}`,
      pagado: false,
    }))];
    await db.reservas.update(reservaId, { consumos });
    await this.registrarPago(comandaId, aCargar.map(it => it.id), {
      id: `cargo-${reservaId}`,
      correlativo: `Cargo a hab. (${reserva.codigo})`,
      total: round2(aCargar.reduce((a, it) => a + it.precio * it.cantidad, 0)),
    });
    window.dispatchEvent(new CustomEvent('hoteles_updated', { detail: { id: reservaId } }));
  },

  // ── Recetas e inventario ──────────────────────────────────────────────
  costoPlato(producto, productosById) {
    if (!Array.isArray(producto?.receta) || producto.receta.length === 0) {
      return Number(producto?.precio_compra) || 0;
    }
    const merma = 1 + (Number(producto.merma_pct) || 0) / 100;
    return round2(producto.receta.reduce((acc, r) => {
      const ins = productosById[r.insumo_id];
      return acc + (Number(ins?.precio_compra) || 0) * (Number(r.cantidad) || 0) * merma;
    }, 0));
  },

  // Cuántas porciones se pueden preparar con el stock actual de insumos
  porcionesDisponibles(producto, productosById) {
    if (!Array.isArray(producto?.receta) || producto.receta.length === 0) return null;
    const merma = 1 + (Number(producto.merma_pct) || 0) / 100;
    let min = Infinity;
    for (const r of producto.receta) {
      const ins = productosById[r.insumo_id];
      const necesario = (Number(r.cantidad) || 0) * merma;
      if (!ins || necesario <= 0) continue;
      min = Math.min(min, Math.floor((Number(ins.stock_actual) || 0) / necesario));
    }
    return min === Infinity ? null : Math.max(0, min);
  },

  /**
   * Descuenta el inventario de una venta. Los platos con receta descuentan sus insumos
   * (con % de merma) y registran el consumo en el kardex; el resto descuenta su propio stock.
   */
  async descontarInventarioVenta(items, correlativo) {
    let seq = 0;
    const addKardex = async (data) => {
      if (!db.kardex) return;
      seq++;
      await db.kardex.add({ id: `kdx-${Date.now()}-${seq}-${data.producto_id}`, fecha: new Date().toISOString(), ...data });
    };

    for (const item of items) {
      if (!item.productId) continue;
      const prod = await db.productos_tienda.get(item.productId);
      if (!prod) continue;

      if (Array.isArray(prod.receta) && prod.receta.length > 0) {
        const merma = 1 + (Number(prod.merma_pct) || 0) / 100;
        for (const r of prod.receta) {
          const insumo = await db.productos_tienda.get(r.insumo_id);
          if (!insumo) continue;
          const consumo = round3((Number(r.cantidad) || 0) * item.cantidad * merma);
          const nuevoStock = Math.max(0, round3((insumo.stock_actual || 0) - consumo));
          await db.productos_tienda.update(insumo.id, { stock_actual: nuevoStock });
          await addKardex({
            producto_id: insumo.id,
            producto_nombre: insumo.nombre,
            tipo: 'SALIDA',
            cantidad: consumo,
            motivo: `Consumo receta "${prod.nombre}" x${item.cantidad} (${correlativo})`,
            saldo_nuevo: nuevoStock,
            costo_unitario: insumo.precio_compra || 0,
          });
        }
        continue;
      }

      const nuevoStock = Math.max(0, round3((prod.stock_actual || 0) - item.cantidad));
      await db.productos_tienda.update(item.productId, { stock_actual: nuevoStock });
      await addKardex({
        producto_id: item.productId,
        producto_nombre: item.nombre,
        tipo: 'SALIDA',
        cantidad: item.cantidad,
        motivo: `Venta POS (${correlativo})`,
        saldo_nuevo: nuevoStock,
        costo_unitario: prod.precio_compra || (prod.precio_venta * 0.8),
      });
    }
  },

  // ── Integración con Tienda en Línea ───────────────────────────────────
  // Convierte un pedido web en comanda DELIVERY para que llegue a la cocina.
  async crearComandaDesdeTienda(pedido) {
    const productos = await db.productos_tienda.toArray();
    const byName = new Map(productos.map(p => [String(p.nombre).trim().toLowerCase(), p]));
    const now = new Date().toISOString();
    const items = (pedido.items || []).map(it => {
      const prod = (it.producto_id && productos.find(p => p.id === it.producto_id)) || byName.get(String(it.nombre).trim().toLowerCase());
      return {
        id: uid('it'),
        producto_id: prod?.id || null,
        nombre: it.nombre,
        categoria: prod?.categoria || '',
        precio: Number(it.precio) || 0,
        cantidad: Number(it.cantidad) || 1,
        nota: '',
        estacion: prod?.estacion || 'COCINA',
        estado: 'ENVIADO',
        ronda: 1,
        enviado_at: now,
        listo_at: null,
        pagado: false,
      };
    });
    const comanda = await this.crearComanda({
      tipo: 'DELIVERY',
      origen: 'TIENDA',
      cliente_nombre: pedido.cliente_nombre,
      telefono: pedido.telefono,
      direccion: pedido.direccion,
      items,
    });
    await db.comandas.update(comanda.id, { pedido_web_id: pedido.id, ultima_ronda_at: now });
    notify({ tipo: 'cocina', id: comanda.id, nuevo: true });
    return comanda;
  },
};
