// Conversión directa de una cotización en venta (sin abrir el formulario de comprobante).
import { db } from '../db/dexie';
import { syncService } from './syncService';

export const TIPOS_CONVERSION = [
  { tipo: 'Nota de Venta', serie: 'NV01' },
  { tipo: 'Boleta', serie: 'B001' },
  { tipo: 'Factura', serie: 'F001' },
];

export const METODOS_CONVERSION = ['Efectivo', 'QR', 'Tarjeta', 'Transferencia'];

// Crea la venta con los mismos datos que emite el formulario de comprobante, descuenta stock,
// registra el kardex y marca la cotización como convertida. Devuelve la venta creada.
export async function convertirCotizacionEnVenta(cot, { tipo = 'Nota de Venta', metodo = 'Efectivo', cajero = '' } = {}) {
  const items = Array.isArray(cot?.items) ? cot.items : [];
  if (items.length === 0) throw new Error('La cotización no tiene productos.');
  if (cot.estado === 'Convertida') throw new Error('Esta cotización ya fue convertida en venta.');

  const { serie } = TIPOS_CONVERSION.find(t => t.tipo === tipo) || TIPOS_CONVERSION[0];
  const correlativo = `${serie}-${String(Date.now()).slice(-4)}`;
  const ahora = new Date();
  const total = Number(cot.total) || 0;

  const venta = {
    id: `vta-${Date.now()}`,
    fecha: ahora.toISOString(),
    correlativo,
    tipo_documento: tipo.toUpperCase(),
    tipo_label: tipo,
    serie,
    tipo_operacion: 'Venta interna',
    cliente_nombre: cot.cliente_nombre || 'Clientes Varios',
    cliente_ci_nit: cot.cliente_ci_nit || '99999999',
    cliente_direccion: cot.cliente_direccion || '',
    moneda: cot.moneda,
    tipo_cambio: Number(cot.tipo_cambio) || 1,
    condicion_pago: 'Contado',
    pagos: [{ id: 1, metodo, referencia: '', monto: total }],
    metodo_pago: metodo,
    items: items.map(it => ({
      producto_id: it.id || it.producto_id,
      nombre: it.nombre,
      codigo: it.codigo,
      unidad: it.unidad,
      cantidad: Number(it.cantidad) || 1,
      precio: Number(it.precio) || 0,
      afectacion: it.afectacion,
      igv_incluido: it.igv_incluido,
      descuento: Number(it.descuento) || 0,
      subtotal: it.subtotal != null ? Number(it.subtotal) : (Number(it.cantidad) || 1) * (Number(it.precio) || 0),
    })),
    subtotal: Number(cot.subtotal) || total,
    descuento: Number(cot.descuento) || 0,
    total,
    monto_recibido: total,
    cambio: 0,
    estado: 'EMITIDO',
    cajero: cajero || null,
    cotizacion_id: cot.id,
  };

  await db.ventas.add(venta);

  // Descontar stock de los productos del catálogo (los ítems manuales no tienen stock)
  for (const it of venta.items) {
    if (!it.producto_id || String(it.producto_id).startsWith('manual-')) continue;
    const prod = await db.productos_tienda.get(it.producto_id);
    if (!prod) continue;
    const nuevoStock = Math.max(0, (Number(prod.stock_actual) || 0) - it.cantidad);
    await db.productos_tienda.update(prod.id, { stock_actual: nuevoStock });
    await db.kardex.add({
      id: `kdx-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      fecha: ahora.toISOString(),
      producto_id: prod.id,
      producto_nombre: prod.nombre,
      tipo: 'VENTA',
      cantidad: it.cantidad,
      motivo: `Conversión de cotización ${cot.correlativo} en ${correlativo}`,
      saldo_nuevo: nuevoStock,
    });
  }

  await db.cotizaciones.update(cot.id, { estado: 'Convertida', venta_id: venta.id });
  syncService.triggerBackgroundSync();
  return venta;
}
