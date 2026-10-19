// PDF A4 de una cotización: se genera en el navegador (sin enviar datos a ningún servicio).
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { CURRENCIES, getCurrency } from './currency';

// ── Número en letras (español) ─────────────────────────────────────────────
const UNIDADES = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE'];
const DECENAS = ['', '', 'VEINTI', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const VEINTI = { 21: 'VEINTIÚN', 22: 'VEINTIDÓS', 23: 'VEINTITRÉS', 24: 'VEINTICUATRO', 25: 'VEINTICINCO', 26: 'VEINTISÉIS', 27: 'VEINTISIETE', 28: 'VEINTIOCHO', 29: 'VEINTINUEVE' };
const CENTENAS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

function menorDeMil(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const partes = [];
  if (c) partes.push(CENTENAS[c]);
  if (r <= 20) {
    if (r) partes.push(UNIDADES[r]);
  } else if (r < 30) {
    partes.push(VEINTI[r]);
  } else {
    const d = Math.floor(r / 10);
    const u = r % 10;
    partes.push(u ? `${DECENAS[d]} Y ${u === 1 ? 'UN' : UNIDADES[u]}` : DECENAS[d]);
  }
  return partes.join(' ');
}

export function enteroALetras(n) {
  if (n === 0) return 'CERO';
  const millones = Math.floor(n / 1000000);
  const miles = Math.floor((n % 1000000) / 1000);
  const resto = n % 1000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? 'UN MILLÓN' : `${enteroALetras(millones)} MILLONES`);
  if (miles) partes.push(miles === 1 ? 'MIL' : `${menorDeMil(miles)} MIL`);
  if (resto) partes.push(menorDeMil(resto));
  return partes.join(' ').replace(/\s+/g, ' ').trim();
}

// 207 -> "DOSCIENTOS SIETE CON 00/100 BOLIVIANOS"
export function montoEnLetras(total, nombreMoneda) {
  const valor = Math.max(0, Math.round((Number(total) || 0) * 100) / 100);
  const entero = Math.floor(valor);
  const centavos = Math.round((valor - entero) * 100);
  return `${enteroALetras(entero)} CON ${String(centavos).padStart(2, '0')}/100 ${String(nombreMoneda || '').toUpperCase()}`.trim();
}

// ── Moneda de la cotización ───────────────────────────────────────────────
function monedaDe(cot) {
  const txt = String(cot?.moneda || '');
  const found = CURRENCIES.find(c => txt.includes(`(${c.code})`));
  if (found) return { simbolo: found.symbol, nombre: found.name };
  if (txt.includes('USD')) return { simbolo: '$', nombre: 'Dólares' };
  const actual = getCurrency();
  return { simbolo: actual.symbol, nombre: actual.name };
}

const fmt = (n) => (Number(n) || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function fechaCorta(iso) {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : String(iso || '');
}

// Texto en diagonal, rojo y semitransparente sobre cada página (p. ej. "Previsualización")
export function ponerMarcaAgua(doc, texto) {
  if (!texto) return;
  const paginas = doc.getNumberOfPages();
  for (let i = 1; i <= paginas; i++) {
    doc.setPage(i);
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    doc.saveGraphicsState();
    doc.setGState(new doc.GState({ opacity: 0.22 }));
    doc.setTextColor(220, 38, 38);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(Math.max(18, Math.min(W, H) / 4.5));
    // Centrado a mano: jsPDF no alinea al centro texto rotado
    const mitad = doc.getTextWidth(texto) / 2;
    const r = Math.PI / 4;
    doc.text(texto, W / 2 - mitad * Math.cos(r), H / 2 + mitad * Math.sin(r), { angle: 45 });
    doc.restoreGraphicsState();
  }
}

// ── Documento ─────────────────────────────────────────────────────────────
// cot: registro de la tabla cotizaciones; empresa: datos de la empresa; vendedor: nombre del usuario.
// opts.titulo y opts.esVenta reutilizan el mismo formato para notas de venta, boletas y facturas.
export function crearCotizacionPdf(cot, empresa = {}, vendedor = '', opts = {}) {
  const titulo = opts.titulo || 'COTIZACIÓN';
  const esVenta = !!opts.esVenta;
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = doc.internal.pageSize.getWidth();
  const M = 12;
  const { simbolo, nombre: nombreMoneda } = monedaDe(cot);
  const negro = [20, 20, 20];

  doc.setTextColor(...negro);
  doc.setDrawColor(...negro);
  doc.setLineWidth(0.25);

  // Cabecera: logo, datos de la empresa y recuadro del documento
  const cajaW = 64;
  let logoW = 0;
  if (empresa.logo_url && String(empresa.logo_url).startsWith('data:image')) {
    try {
      const props = doc.getImageProperties(empresa.logo_url);
      const maxW = 40;
      const maxH = 22;
      const escala = Math.min(maxW / props.width, maxH / props.height);
      logoW = props.width * escala;
      const logoH = props.height * escala;
      doc.addImage(empresa.logo_url, props.fileType, M, M, logoW, logoH);
      logoW += 4;
    } catch (err) {
      console.warn('[cotizacionPdf] No se pudo insertar el logo:', err);
      logoW = 0;
    }
  }
  const xTexto = M + logoW;
  const textoW = W - M - xTexto - cajaW - 6;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  const nombreLineas = doc.splitTextToSize(String(empresa.nombre || 'EMPRESA').toUpperCase(), textoW);
  doc.text(nombreLineas, xTexto, M + 5);
  let y = M + 5 + nombreLineas.length * 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  const datos = [
    empresa.nit_ci ? `NIT: ${empresa.nit_ci}` : '',
    [empresa.direccion, empresa.ciudad].filter(Boolean).join(' - '),
    empresa.telefono ? `Teléfono: ${empresa.telefono}` : '',
    empresa.email ? `Email: ${empresa.email}` : '',
  ].filter(Boolean);
  datos.forEach((linea) => {
    const partes = doc.splitTextToSize(linea, textoW);
    doc.text(partes, xTexto, y);
    y += partes.length * 4;
  });

  const cajaX = W - M - cajaW;
  const cajaH = 26;
  doc.roundedRect(cajaX, M, cajaW, cajaH, 2, 2);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(empresa.nit_ci ? `N.I.T. ${empresa.nit_ci}` : titulo, cajaX + cajaW / 2, M + 8, { align: 'center' });
  doc.setFontSize(12);
  doc.text(titulo, cajaX + cajaW / 2, M + 15, { align: 'center' });
  doc.setFontSize(10);
  doc.text(String(cot.correlativo || ''), cajaX + cajaW / 2, M + 22, { align: 'center' });

  // Recuadros de cliente y de fechas
  y = Math.max(y, M + cajaH, logoW ? M + 24 : 0) + 5;
  const colIzqW = 112;
  const colDerW = W - M * 2 - colIzqW - 4;
  const boxH = 24;
  doc.rect(M, y, colIzqW, boxH);
  doc.rect(M + colIzqW + 4, y, colDerW, boxH);

  const fila = (x, yy, etiqueta, valor, anchoEtiqueta, anchoValor) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(etiqueta, x, yy);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(String(valor ?? ''), anchoValor);
    doc.text(lineas, x + anchoEtiqueta, yy);
    return lineas.length;
  };
  const docCliente = cot.cliente_ci_nit && cot.cliente_ci_nit !== '99999999' && cot.cliente_ci_nit !== '0' ? cot.cliente_ci_nit : 'SIN NIT';
  fila(M + 3, y + 6, 'Cliente', `: ${cot.cliente_nombre || 'Clientes varios'}`, 22, colIzqW - 28);
  fila(M + 3, y + 12, 'NIT / CI', `: ${docCliente}`, 22, colIzqW - 28);
  fila(M + 3, y + 18, 'Dirección', `: ${cot.cliente_direccion || '-'}`, 22, colIzqW - 28);

  const xd = M + colIzqW + 4 + 3;
  const emision = fechaCorta(cot.fecha);
  const vigencia = cot.fecha_vencimiento
    ? fechaCorta(cot.fecha_vencimiento)
    : (() => {
        const base = new Date(`${String(cot.fecha || '').slice(0, 10)}T00:00:00`);
        base.setDate(base.getDate() + (Number(cot.validez_dias) || 15));
        return Number.isNaN(base.getTime()) ? '' : fechaCorta(base.toISOString().slice(0, 10));
      })();
  fila(xd, y + 6, 'Fecha emisión', `: ${emision}`, 27, colDerW - 32);
  if (esVenta) fila(xd, y + 12, 'Método pago', `: ${cot.metodo_pago || '-'}`, 27, colDerW - 32);
  else fila(xd, y + 12, 'Vigencia hasta', `: ${vigencia}`, 27, colDerW - 32);
  fila(xd, y + 18, 'Moneda', `: ${nombreMoneda}`, 27, colDerW - 32);

  // Tabla de ítems
  const items = Array.isArray(cot.items) ? cot.items : [];
  const filas = items.map((it) => {
    const cant = Number(it.cantidad) || 0;
    const precio = Number(it.precio ?? it.precio_unitario) || 0;
    const total = it.subtotal != null ? Number(it.subtotal) : Math.max(0, cant * precio - (Number(it.descuento) || 0));
    return [
      String(it.codigo || it.codigo_barras || '-'),
      String(cant),
      String(it.unidad || 'UND'),
      String(it.nombre || it.descripcion || ''),
      fmt(precio),
      fmt(total),
    ];
  });

  autoTable(doc, {
    startY: y + boxH + 5,
    margin: { left: M, right: M },
    head: [['CÓDIGO', 'CANT.', 'U.M.', 'DESCRIPCIÓN', 'P. UNIT.', 'TOTAL']],
    body: filas,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.6, lineColor: negro, lineWidth: 0.2, textColor: negro },
    headStyles: { fillColor: [255, 255, 255], textColor: negro, fontStyle: 'bold', halign: 'center' },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 14, halign: 'center' },
      3: { cellWidth: 'auto' },
      4: { cellWidth: 24, halign: 'right' },
      5: { cellWidth: 26, halign: 'right' },
    },
  });

  // Totales
  const subtotal = cot.subtotal != null ? Number(cot.subtotal) : items.reduce((a, it) => a + (Number(it.subtotal) || 0), 0);
  // Las ventas guardan el descuento como porcentaje: se deduce de subtotal − total
  const descuento = Number(cot.descuento) || (esVenta && cot.total != null ? Math.max(0, Math.round((subtotal - Number(cot.total)) * 100) / 100) : 0);
  const total = Number(cot.total) || Math.max(0, subtotal - descuento);

  let yy = doc.lastAutoTable.finalY + 4;
  if (yy > 235) {
    doc.addPage();
    yy = M;
  }
  const totalesW = 62;
  const izqW = W - M * 2 - totalesW - 4;
  const altoTotales = descuento > 0 ? 22 : 15;
  doc.rect(M, yy, izqW, altoTotales + 5);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(`Vendedor: ${vendedor || '-'}`, M + 3, yy + 5);
  doc.text(`SON: ${montoEnLetras(total, nombreMoneda)}`, M + 3, yy + 12, { maxWidth: izqW - 6 });

  const filasTot = [[`SUBTOTAL ${simbolo}`, fmt(subtotal)]];
  if (descuento > 0) filasTot.push([`DESCUENTO ${simbolo}`, fmt(descuento)]);
  filasTot.push([`TOTAL A PAGAR ${simbolo}`, fmt(total)]);
  autoTable(doc, {
    startY: yy,
    margin: { left: W - M - totalesW, right: M },
    body: filasTot,
    theme: 'grid',
    styles: { font: 'helvetica', fontSize: 8, cellPadding: 1.6, lineColor: negro, lineWidth: 0.2, textColor: negro, fontStyle: 'bold' },
    columnStyles: { 0: { cellWidth: totalesW - 26 }, 1: { cellWidth: 26, halign: 'right' } },
  });

  // Notas, método de pago de referencia y términos
  let ny = Math.max(doc.lastAutoTable.finalY, yy + altoTotales + 5) + 6;
  const bloque = (titulo, texto) => {
    if (!texto) return;
    if (ny > 265) { doc.addPage(); ny = M; }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(titulo, M, ny);
    ny += 4;
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(texto, W - M * 2);
    doc.text(lineas, M, ny);
    ny += lineas.length * 3.8 + 3;
  };

  bloque('NOTAS:', cot.notas);
  const pagos = Array.isArray(cot.metodos_pago_referencia) ? cot.metodos_pago_referencia : [];
  if (pagos.length > 0) {
    bloque('MÉTODO DE PAGO (REFERENCIA):', pagos.map(p => `• ${p.metodo}${p.referencia ? ` — ${p.referencia}` : ''}`).join('\n'));
  }
  if (!esVenta && cot.mostrar_terminos) {
    bloque('TÉRMINOS Y CONDICIONES:', `Precios válidos hasta ${vigencia || 'la fecha de vigencia'}. Sujeto a disponibilidad de stock. ${cot.condiciones || ''}`.trim());
  }

  // Pie
  const alto = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('GRACIAS POR SU PREFERENCIA', W / 2, alto - 18, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.text('Comprobante emitido a través de GLORYPOS', W / 2, alto - 14, { align: 'center' });
  if (!titulo.includes('FACTURA')) doc.text('Documento comercial — no válido como factura', W / 2, alto - 10.5, { align: 'center' });

  ponerMarcaAgua(doc, opts.marcaAgua);
  return doc;
}

export const nombreArchivoCotizacion = (cot) => `cotizacion-${cot?.correlativo || 'sin-numero'}.pdf`;

export function cotizacionPdfBlob(cot, empresa, vendedor) {
  return crearCotizacionPdf(cot, empresa, vendedor).output('blob');
}

export function descargarCotizacionPdf(cot, empresa, vendedor) {
  crearCotizacionPdf(cot, empresa, vendedor).save(nombreArchivoCotizacion(cot));
}

// Base64 sin el prefijo data:, para enviarlo por correo
export function cotizacionPdfBase64(cot, empresa, vendedor) {
  const uri = crearCotizacionPdf(cot, empresa, vendedor).output('datauristring');
  return uri.split(',')[1] || '';
}

// ── Ventas (notas de venta, boletas y facturas) en el mismo formato A4 ────
export function tituloVenta(tipo) {
  if (tipo === 'FACTURA' || tipo === 'FACTURA_SIAT') return 'FACTURA';
  if (tipo === 'BOLETA') return 'BOLETA DE VENTA';
  return 'NOTA DE VENTA';
}

export function descargarVentaPdf(venta, empresa, vendedor) {
  crearCotizacionPdf(venta, empresa, vendedor || venta?.cajero || '', { titulo: tituloVenta(venta?.tipo_documento), esVenta: true })
    .save(`${tituloVenta(venta?.tipo_documento).toLowerCase().replace(/\s+/g, '-')}-${venta?.correlativo || 'sin-numero'}.pdf`);
}
