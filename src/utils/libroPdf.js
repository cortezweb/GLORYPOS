// Libros contables en PDF (A4 horizontal) con los datos reales del periodo guardados en este equipo.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { db } from '../db/dexie';
import { simbolo } from './currency';

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fecha = (iso) => {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};
const delPeriodo = (rows, periodo) => rows.filter(r => String(r.fecha || '').slice(0, 7) === periodo);

// Cada libro arma su tabla a partir de Dexie. periodo: 'AAAA-MM'
const LIBROS = {
  '14.1': async (periodo) => {
    const tipos = ['FACTURA', 'FACTURA_SIAT', 'BOLETA'];
    const ventas = delPeriodo(await db.ventas.toArray(), periodo)
      .filter(v => tipos.includes(v.tipo_documento) && v.estado !== 'ANULADA')
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const total = ventas.reduce((a, v) => a + (Number(v.total) || 0), 0);
    return {
      head: ['N°', 'FECHA', 'COMPROBANTE', 'NIT / CI', 'CLIENTE', 'IMPORTE', 'BASE IVA', 'IVA 13%'],
      body: ventas.map((v, i) => {
        const t = Number(v.total) || 0;
        return [i + 1, fecha(v.fecha), v.correlativo || '', v.cliente_ci_nit || '0', v.cliente_nombre || '', fmt(t), fmt(t / 1.13), fmt(t - t / 1.13)];
      }),
      foot: ['', '', '', '', 'TOTALES', fmt(total), fmt(total / 1.13), fmt(total - total / 1.13)],
      numericas: [5, 6, 7],
    };
  },
  '8.1': async (periodo) => {
    const compras = delPeriodo(await db.compras.toArray(), periodo)
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    const sum = (k) => compras.reduce((a, c) => a + (Number(c[k]) || 0), 0);
    return {
      head: ['N°', 'FECHA', 'COMPROBANTE', 'NIT PROVEEDOR', 'PROVEEDOR', 'SUBTOTAL', 'IMPUESTO', 'TOTAL'],
      body: compras.map((c, i) => [i + 1, fecha(c.fecha), c.numero_factura || '', c.proveedor_nit || '0', c.proveedor_nombre || '', fmt(c.subtotal), fmt(c.igv), fmt(c.total)]),
      foot: ['', '', '', '', 'TOTALES', fmt(sum('subtotal')), fmt(sum('igv')), fmt(sum('total'))],
      numericas: [5, 6, 7],
    };
  },
  '3.7': async (periodo) => {
    const movs = delPeriodo(await db.kardex.toArray(), periodo)
      .sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
    return {
      head: ['N°', 'FECHA', 'PRODUCTO', 'TIPO', 'CANTIDAD', 'COSTO UNIT.', 'SALDO', 'MOTIVO'],
      body: movs.map((k, i) => [i + 1, fecha(k.fecha), k.producto_nombre || k.producto_id || '', k.tipo || '', String(k.cantidad ?? ''), k.costo_unitario != null ? fmt(k.costo_unitario) : '-', String(k.saldo_nuevo ?? ''), k.motivo || '']),
      foot: null,
      numericas: [4, 5, 6],
    };
  },
};

export const librosConPdf = Object.keys(LIBROS);

// Devuelve la cantidad de filas exportadas (0 si el periodo no tiene movimientos)
export async function descargarLibroPdf(libro, periodo, empresa = {}) {
  const datos = await LIBROS[libro.id]?.(periodo);
  if (!datos) throw new Error('Este libro todavía no tiene exportación a PDF.');

  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'landscape' });
  const W = doc.internal.pageSize.getWidth();
  const M = 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(String(libro.name).toUpperCase(), M, M + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`${empresa.nombre || 'Empresa'}${empresa.nit_ci ? ` — NIT ${empresa.nit_ci}` : ''}`, M, M + 10);
  doc.text(`Periodo: ${periodo}   ·   Código: ${libro.code}   ·   Moneda: ${simbolo()}`, M, M + 15);
  doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, W - M, M + 4, { align: 'right' });

  const columnStyles = Object.fromEntries(datos.numericas.map(i => [i, { halign: 'right' }]));
  autoTable(doc, {
    startY: M + 20,
    margin: { left: M, right: M },
    head: [datos.head],
    body: datos.body.length ? datos.body : [[{ content: 'Sin movimientos en el periodo', colSpan: datos.head.length, styles: { halign: 'center' } }]],
    foot: datos.foot && datos.body.length ? [datos.foot] : undefined,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 7.5, cellPadding: 1.4, lineColor: [20, 20, 20], lineWidth: 0.15, textColor: [20, 20, 20] },
    headStyles: { fillColor: [235, 235, 235], textColor: [20, 20, 20], fontStyle: 'bold', halign: 'center' },
    footStyles: { fillColor: [245, 245, 245], textColor: [20, 20, 20], fontStyle: 'bold', halign: 'right' },
    columnStyles,
  });

  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.text(`Página ${i} de ${paginas} · GLORYPOS`, W / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
  }

  doc.save(`${libro.code}-${periodo}.pdf`);
  return datos.body.length;
}
