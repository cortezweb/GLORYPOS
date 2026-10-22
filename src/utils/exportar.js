// Exportar e imprimir desde cualquier pantalla: Excel (.xlsx real), PDF de tabla (A4) e impresión de un bloque.
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { zipSync, strToU8 } from 'fflate';

// Descarga un Blob con nombre. La URL se libera después para que Safari/Firefox alcancen a leerla.
export function descargarBlob(blob, nombre) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = nombre;
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  // Caracteres de control que rompen el XML de Excel
  // eslint-disable-next-line no-control-regex
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '');

const colLetra = (i) => {
  let s = '';
  for (let n = i + 1; n > 0; n = Math.floor((n - 1) / 26)) s = String.fromCharCode(65 + ((n - 1) % 26)) + s;
  return s;
};

const celda = (v, ref, estilo = 0) => {
  const s = estilo ? ` s="${estilo}"` : '';
  if (typeof v === 'number' && Number.isFinite(v)) return `<c r="${ref}"${s}><v>${v}</v></c>`;
  if (v === null || v === undefined || v === '') return '';
  return `<c r="${ref}" t="inlineStr"${s}><is><t xml:space="preserve">${esc(v)}</t></is></c>`;
};

/**
 * Descarga un Excel .xlsx de una hoja.
 * columnas: ['Fecha', 'Total', ...]; filas: [['2026-10-01', 12.5], ...]
 * Los números se guardan como número (Excel puede sumarlos); el resto como texto.
 */
export function descargarExcel(nombre, columnas, filas, hoja = 'Reporte') {
  const todas = [columnas, ...filas];
  const xmlFilas = todas.map((fila, r) =>
    `<row r="${r + 1}">${fila.map((v, c) => celda(v, `${colLetra(c)}${r + 1}`, r === 0 ? 1 : (typeof v === 'number' ? 2 : 0))).join('')}</row>`
  ).join('');
  const anchos = columnas.map((_, c) => {
    const largo = Math.max(...todas.slice(0, 200).map(f => String(f[c] ?? '').length));
    return `<col min="${c + 1}" max="${c + 1}" width="${Math.min(Math.max(largo + 2, 8), 50)}" customWidth="1"/>`;
  }).join('');

  const hojaXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetViews><sheetView workbookViewId="0"><pane ySplit="1" topLeftCell="A2" activePane="bottomLeft" state="frozen"/></sheetView></sheetViews><cols>${anchos}</cols><sheetData>${xmlFilas}</sheetData></worksheet>`;

  const archivos = {
    '[Content_Types].xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/><Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/></Types>`,
    '_rels/.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>`,
    'xl/workbook.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="${esc(hoja).slice(0, 31)}" sheetId="1" r:id="rId1"/></sheets></workbook>`,
    'xl/_rels/workbook.xml.rels': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/><Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>`,
    // Estilos: 0 normal, 1 encabezado en negrita con fondo, 2 número con 2 decimales
    'xl/styles.xml': `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><numFmts count="1"><numFmt numFmtId="164" formatCode="#,##0.00"/></numFmts><fonts count="2"><font><sz val="11"/><name val="Calibri"/></font><font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font></fonts><fills count="3"><fill><patternFill patternType="none"/></fill><fill><patternFill patternType="gray125"/></fill><fill><patternFill patternType="solid"><fgColor rgb="FFFF6B35"/></patternFill></fill></fills><borders count="1"><border><left/><right/><top/><bottom/><diagonal/></border></borders><cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs><cellXfs count="3"><xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/><xf numFmtId="0" fontId="1" fillId="2" borderId="0" xfId="0" applyFont="1" applyFill="1"/><xf numFmtId="164" fontId="0" fillId="0" borderId="0" xfId="0" applyNumberFormat="1"/></cellXfs><cellStyles count="1"><cellStyle name="Normal" xfId="0" builtinId="0"/></cellStyles></styleSheet>`,
    'xl/worksheets/sheet1.xml': hojaXml,
  };
  const zip = zipSync(Object.fromEntries(Object.entries(archivos).map(([k, v]) => [k, strToU8(v)])));
  const archivo = nombre.endsWith('.xlsx') ? nombre : `${nombre}.xlsx`;
  descargarBlob(new Blob([zip], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }), archivo);
}

const fmtCelda = (v) => (typeof v === 'number' && Number.isFinite(v)
  ? v.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  : String(v ?? ''));

/**
 * Descarga un PDF A4 con una tabla (reportes).
 * opts: { titulo, subtitulo, empresa, columnas, filas, totales, horizontal }
 * Las columnas con números se alinean a la derecha.
 */
export function descargarPdfTabla(nombre, { titulo, subtitulo = '', empresa = {}, columnas, filas, totales = null, horizontal }) {
  const apaisado = horizontal ?? columnas.length > 6;
  const doc = new jsPDF({ unit: 'mm', format: 'a4', orientation: apaisado ? 'landscape' : 'portrait' });
  const W = doc.internal.pageSize.getWidth();
  const M = 12;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text(String(titulo || 'Reporte').toUpperCase(), M, M + 4);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const nombreEmpresa = empresa.nombre || empresa.razon_social;
  if (nombreEmpresa) doc.text(`${nombreEmpresa}${empresa.nit_ci ? ` — NIT ${empresa.nit_ci}` : ''}`, M, M + 10);
  if (subtitulo) doc.text(String(subtitulo), M, M + (nombreEmpresa ? 15 : 10));
  doc.text(`Generado: ${new Date().toLocaleString('es-BO')}`, W - M, M + 4, { align: 'right' });

  const numericas = columnas.map((_, c) => filas.some(f => typeof f[c] === 'number'));
  autoTable(doc, {
    startY: M + 20,
    margin: { left: M, right: M },
    head: [columnas],
    body: filas.length
      ? filas.map(f => f.map(fmtCelda))
      : [[{ content: 'Sin registros', colSpan: columnas.length, styles: { halign: 'center' } }]],
    foot: totales && filas.length ? [totales.map(fmtCelda)] : undefined,
    styles: { fontSize: 7.5, cellPadding: 1.5 },
    headStyles: { fillColor: [255, 107, 53], textColor: 255, fontStyle: 'bold' },
    footStyles: { fillColor: [241, 245, 249], textColor: 20, fontStyle: 'bold' },
    columnStyles: Object.fromEntries(numericas.map((n, i) => [i, n ? { halign: 'right' } : {}])),
    didDrawPage: () => {
      const H = doc.internal.pageSize.getHeight();
      doc.setFontSize(7);
      doc.text(`Página ${doc.getCurrentPageInfo().pageNumber}`, W - M, H - 6, { align: 'right' });
    },
  });
  doc.save(nombre.endsWith('.pdf') ? nombre : `${nombre}.pdf`);
}

/**
 * Imprime solo un bloque de la pantalla (un ticket, un documento, un QR) en un iframe oculto,
 * con los mismos estilos de la app. Así no se imprime la página en blanco ni el menú lateral.
 * objetivo: elemento, id o selector CSS. Para tickets térmicos usar { margen: '0' }.
 */
export function imprimirElemento(objetivo, titulo = document.title, { margen = '8mm' } = {}) {
  const el = typeof objetivo === 'string'
    ? (document.getElementById(objetivo) || document.querySelector(objetivo))
    : objetivo;
  if (!el) {
    window.print();
    return;
  }
  // Los <canvas> (QR, gráficos) no se copian con el HTML: se pasan como imagen
  const copia = el.cloneNode(true);
  const lienzos = el.querySelectorAll('canvas');
  copia.querySelectorAll('canvas').forEach((c, i) => {
    try {
      const img = document.createElement('img');
      img.src = lienzos[i].toDataURL('image/png');
      img.style.cssText = c.style.cssText;
      img.width = lienzos[i].width;
      img.className = c.className;
      c.replaceWith(img);
    } catch { /* lienzo con imagen externa: se deja como está */ }
  });
  // Botones y controles de la pantalla no van en el papel
  copia.querySelectorAll('button, .no-print, [data-no-print]').forEach(n => n.remove());
  const estilos = [...document.querySelectorAll('style, link[rel="stylesheet"]')]
    .map(n => n.outerHTML).join('\n');
  imprimirHtml(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(titulo)}</title>${estilos}
<style>
  html, body { background: #fff !important; margin: 0; padding: 0; }
  *, *::before, *::after { animation: none !important; transition: none !important; }
  .imprimible * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  .imprimible, .imprimible * { overflow: visible !important; max-height: none !important; }
  .imprimible > * { box-shadow: none !important; border: 0 !important; margin: 0 auto !important; }
  @page { size: auto; margin: ${margen}; }
</style></head><body><div class="imprimible">${copia.outerHTML}</div></body></html>`);
}

/**
 * Imprime un documento HTML completo en un iframe oculto (sin ventanas emergentes, que los
 * navegadores bloquean o muestran en blanco). Espera estilos e imágenes antes de imprimir.
 */
export function imprimirHtml(html) {
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const d = iframe.contentDocument;
  d.open();
  d.write(html);
  d.close();

  const quitar = () => setTimeout(() => iframe.remove(), 500);
  const imprimir = () => {
    iframe.contentWindow.onafterprint = quitar;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 60000);
  };
  const pendientes = [...d.querySelectorAll('link[rel="stylesheet"], img')]
    .filter(n => (n.tagName === 'IMG' ? !n.complete : !n.sheet))
    .map(n => new Promise(ok => { n.onload = ok; n.onerror = ok; }));
  Promise.race([Promise.all(pendientes), new Promise(ok => setTimeout(ok, 2500))]).then(imprimir);
}

/**
 * Imprime un PDF de jsPDF sin abrir pestañas (las pestañas con blob: salían en blanco en
 * celulares y en la app instalada). En equipos sin visor de PDF (celulares) lo descarga.
 */
export function imprimirPdf(doc, nombre = 'documento.pdf') {
  if (navigator.pdfViewerEnabled === false || /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
    doc.save(nombre);
    return;
  }
  const url = URL.createObjectURL(doc.output('blob'));
  const iframe = document.createElement('iframe');
  iframe.setAttribute('aria-hidden', 'true');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:1px;height:1px;opacity:0;border:0;pointer-events:none';
  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow.focus();
        iframe.contentWindow.print();
      } catch {
        doc.save(nombre);
      }
    }, 300);
  };
  iframe.src = url;
  document.body.appendChild(iframe);
  // Se limpia después; el diálogo de impresión ya tomó el documento
  setTimeout(() => { iframe.remove(); URL.revokeObjectURL(url); }, 60000);
}
