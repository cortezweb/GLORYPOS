// Ticket 58 / 80 mm en PDF (jsPDF): página del ancho exacto del rollo y alto según el contenido.
import { jsPDF } from 'jspdf';
import { simbolo, getCurrency } from './currency';
import { montoEnLetras } from './cotizacionPdf';

const fmt = (n) => (Number(n) || 0).toFixed(2);

function fechaHora(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return String(iso || '');
  return d.toLocaleString('es-BO', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// Dibuja el ticket y devuelve la altura usada (mm)
function dibujar(doc, datos, empresa, ancho, titulo) {
  const M = ancho <= 58 ? 2.5 : 4;
  const W = ancho - M * 2;
  const base = ancho <= 58 ? 7 : 8;
  const sym = simbolo();
  let y = M + 3;

  const centro = (txt, size = base, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(size);
    const lineas = doc.splitTextToSize(String(txt), W);
    doc.text(lineas, ancho / 2, y, { align: 'center' });
    y += lineas.length * size * 0.42 + 0.8;
  };
  const par = (izq, der, bold = false) => {
    doc.setFont('helvetica', bold ? 'bold' : 'normal');
    doc.setFontSize(base);
    doc.text(String(izq), M, y);
    doc.text(String(der), ancho - M, y, { align: 'right' });
    y += base * 0.42 + 0.8;
  };
  const raya = () => {
    doc.setLineDashPattern([0.8, 0.6], 0);
    doc.line(M, y - 1.5, ancho - M, y - 1.5);
    doc.setLineDashPattern([], 0);
    y += 1.5;
  };

  // Logo de la empresa (data URL guardada en Administración), centrado sobre el nombre
  if (empresa?.logo_url && String(empresa.logo_url).startsWith('data:image')) {
    try {
      const props = doc.getImageProperties(empresa.logo_url);
      const escala = Math.min((W * 0.6) / props.width, 20 / props.height);
      const lw = props.width * escala;
      const lh = props.height * escala;
      doc.addImage(empresa.logo_url, props.fileType, (ancho - lw) / 2, y - 2, lw, lh);
      y += lh + 3;
    } catch (err) {
      console.warn('[ticketPdf] No se pudo insertar el logo:', err);
    }
  }
  centro(String(empresa?.nombre || 'EMPRESA').toUpperCase(), base + 2, true);
  if (empresa?.nit_ci) centro(`NIT: ${empresa.nit_ci}`);
  const dir = [empresa?.direccion, empresa?.ciudad].filter(Boolean).join(' - ');
  if (dir) centro(dir);
  if (empresa?.telefono) centro(`Tel: ${empresa.telefono}`);
  y += 1;
  raya();
  centro(titulo, base + 1, true);
  centro(String(datos.correlativo || ''), base, true);
  centro(fechaHora(datos.fecha));
  raya();
  const docCli = datos.cliente_ci_nit && !['0', '99999999'].includes(String(datos.cliente_ci_nit)) ? datos.cliente_ci_nit : 'S/N';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(base);
  [`Cliente: ${datos.cliente_nombre || 'Clientes varios'}`, `NIT/CI: ${docCli}`].forEach((t) => {
    const l = doc.splitTextToSize(t, W);
    doc.text(l, M, y);
    y += l.length * base * 0.42 + 0.8;
  });
  raya();

  const items = Array.isArray(datos.items) ? datos.items : [];
  items.forEach((it) => {
    const cant = Number(it.cantidad) || 0;
    const precio = Number(it.precio ?? it.precio_unitario) || 0;
    const sub = it.subtotal != null ? Number(it.subtotal) : cant * precio;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(base);
    const l = doc.splitTextToSize(String(it.nombre || it.descripcion || ''), W);
    doc.text(l, M, y);
    y += l.length * base * 0.42 + 0.5;
    par(`${cant} x ${fmt(precio)}`, fmt(sub));
  });
  raya();

  const subtotal = datos.subtotal != null ? Number(datos.subtotal) : items.reduce((a, it) => a + (Number(it.subtotal) || 0), 0);
  const total = Number(datos.total) || subtotal;
  if (Math.abs(subtotal - total) > 0.005) {
    par(`SUBTOTAL ${sym}`, fmt(subtotal));
    par(`DESCUENTO ${sym}`, fmt(subtotal - total));
  }
  par(`TOTAL ${sym}`, fmt(total), true);
  if (datos.metodo_pago) par('Pago', datos.metodo_pago);
  if (Number(datos.cambio) > 0) par(`Cambio ${sym}`, fmt(datos.cambio));
  y += 1;
  centro(`SON: ${montoEnLetras(total, getCurrency().name)}`, base - 1);
  y += 1;
  centro('¡GRACIAS POR SU PREFERENCIA!', base, true);
  centro('Sistema GLORYPOS', base - 1);
  return y + M;
}

// datos: venta o cotización (correlativo, fecha, cliente, items, total)
export function crearTicketPdf(datos, empresa, anchoMm = 80, titulo = 'NOTA DE VENTA') {
  const ancho = Number(anchoMm) === 58 ? 58 : 80;
  const alto = dibujar(new jsPDF({ unit: 'mm', format: [ancho, 2000] }), datos, empresa, ancho, titulo);
  const doc = new jsPDF({ unit: 'mm', format: [ancho, Math.max(alto, 60)] });
  dibujar(doc, datos, empresa, ancho, titulo);
  return doc;
}

// Abre el ticket en una pestaña nueva con el diálogo de impresión; si el navegador bloquea la pestaña, lo descarga.
export function imprimirTicketPdf(datos, empresa, anchoMm = 80, titulo) {
  const doc = crearTicketPdf(datos, empresa, anchoMm, titulo);
  doc.autoPrint();
  const win = window.open(doc.output('bloburl'), '_blank');
  if (!win) doc.save(nombreArchivoTicket(datos, anchoMm));
}

export const nombreArchivoTicket = (datos, anchoMm = 80) => `ticket-${anchoMm}mm-${datos?.correlativo || 'sin-numero'}.pdf`;

export function ticketPdfBlob(datos, empresa, anchoMm = 80, titulo) {
  return crearTicketPdf(datos, empresa, anchoMm, titulo).output('blob');
}

export function descargarTicketPdf(datos, empresa, anchoMm = 80, titulo) {
  crearTicketPdf(datos, empresa, anchoMm, titulo).save(nombreArchivoTicket(datos, anchoMm));
}
