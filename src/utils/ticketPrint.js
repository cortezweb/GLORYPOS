// Ticket para impresoras térmicas (58 / 80 mm).
// Se imprime un documento propio del ancho exacto del rollo: así el driver no achica la página
// (lo que dejaba el texto borroso) y todo sale en negro puro, negrita y tamaño legible.

const ANCHO_KEY = 'glorypos_ticket_ancho';

export function getAnchoTicket() {
  try { return localStorage.getItem(ANCHO_KEY) === '58' ? 58 : 80; } catch { return 80; }
}

export function setAnchoTicket(mm) {
  try { localStorage.setItem(ANCHO_KEY, String(mm)); } catch {}
}

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const bs = (n) => `Bs. ${(Number(n) || 0).toFixed(2)}`;

function tituloDocumento(tipo) {
  if (tipo === 'FACTURA') return 'FACTURA';
  if (tipo === 'BOLETA') return 'BOLETA DE VENTA';
  return 'NOTA DE VENTA';
}

function detalleItem(it) {
  const extras = [];
  const d = it.customDetails;
  if (it.tipo_venta === 'PESO' || d?.tipo === 'PESO') extras.push(`${Number(it.cantidad).toFixed(3)} Kg @ ${bs(it.precio)}/Kg`);
  else if (Number(it.cantidad) !== 1) extras.push(`${it.cantidad} x ${bs(it.precio)}`);
  if (it.presNombre && it.presNombre !== 'Unidad') extras.push(it.presNombre);
  if (d?.tipo === 'ROPA') extras.push(`Talla ${d.talla || '-'} / ${d.color || '-'}`);
  if (d?.tipo === 'HELADERIA' && d.sabores?.length) extras.push(d.sabores.join(', '));
  if (d?.nota) extras.push(d.nota);
  if (it.lote) extras.push(`Lote ${it.lote}${it.fecha_vencimiento ? ` Vence ${it.fecha_vencimiento}` : ''}`);
  return extras;
}

// Monto en letras para el pie del comprobante: "OCHENTA Y UNO 00/100 BOLIVIANOS"
const UNI = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISEIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDOS', 'VEINTITRES', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISEIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const DEC = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const CEN = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
function menorMil(n) {
  if (n === 0) return '';
  if (n === 100) return 'CIEN';
  const c = Math.floor(n / 100);
  const r = n % 100;
  const resto = r < 30 ? UNI[r] : `${DEC[Math.floor(r / 10)]}${r % 10 ? ` Y ${UNI[r % 10]}` : ''}`;
  return [CEN[c], resto].filter(Boolean).join(' ');
}
export function montoEnLetras(monto) {
  const total = Math.round((Number(monto) || 0) * 100);
  const entero = Math.floor(total / 100);
  const cent = String(total % 100).padStart(2, '0');
  let texto;
  if (entero === 0) {
    texto = 'CERO';
  } else {
    const millones = Math.floor(entero / 1000000);
    const miles = Math.floor((entero % 1000000) / 1000);
    const resto = entero % 1000;
    texto = [
      millones ? (millones === 1 ? 'UN MILLON' : `${menorMil(millones)} MILLONES`) : '',
      miles ? (miles === 1 ? 'MIL' : `${menorMil(miles)} MIL`) : '',
      menorMil(resto),
    ].filter(Boolean).join(' ');
  }
  return `${texto} ${cent}/100 BOLIVIANOS`;
}

export function ticketHTML(venta, empresa, anchoMm = 80) {
  const angosto = anchoMm === 58;
  const fecha = new Date(venta.fecha);
  const origen = typeof window !== 'undefined' ? window.location.origin : '';
  const logo = empresa?.logo_url || `${origen}/logo.png`;
  const items = (venta.items || []).map(it => {
    const esPeso = it.tipo_venta === 'PESO' || it.customDetails?.tipo === 'PESO';
    const cant = esPeso ? Number(it.cantidad).toFixed(3) : it.cantidad;
    const extras = detalleItem(it).filter(e => !/ x Bs\. /.test(e)).map(e => `<div class="sub">${esc(e)}</div>`).join('');
    const pu = (Number(it.precio) || 0).toFixed(2);
    const imp = (Number(it.subtotal) || 0).toFixed(2);
    return angosto
      ? `<tr class="it"><td colspan="2"><div class="nom">${esc(it.nombre)}</div>${extras}<div class="linea"><span>${esc(cant)} x ${pu}</span><b>${imp}</b></div></td></tr>`
      : `<tr class="it"><td class="q">${esc(cant)}</td><td><div class="nom">${esc(it.nombre)}</div>${extras}</td><td class="num">${pu}</td><td class="num"><b>${imp}</b></td></tr>`;
  }).join('');
  const nItems = (venta.items || []).reduce((a, it) => a + (Number(it.cantidad) || 0), 0);
  const descuentoMonto = venta.descuento_porcentaje > 0 ? ((venta.subtotal || venta.total) * venta.descuento_porcentaje) / 100 : 0;
  const filas = (pares) => pares.filter(Boolean).map(([k, v, cls]) => `<tr class="${cls || ''}"><td>${k}</td><td class="num">${v}</td></tr>`).join('');
  const extraInfo = [
    venta.mesa ? ['Mesa', esc(venta.mesa)] : null,
    venta.entrega?.tipo ? ['Entrega', venta.entrega.tipo === 'DELIVERY' ? 'Delivery' : 'Recojo en tienda'] : null,
    venta.cliente_telefono ? ['Celular', esc(venta.cliente_telefono)] : null,
    venta.usuario || venta.cajero ? ['Cajero', esc(venta.usuario || venta.cajero)] : null,
  ];
  const cabeceraItems = angosto
    ? '<tr class="head"><td>DETALLE</td><td class="num">IMPORTE</td></tr>'
    : '<tr class="head"><td class="q">CANT</td><td>DESCRIPCIÓN</td><td class="num pu">P.U.</td><td class="num imp">IMPORTE</td></tr>';
  const qrData = encodeURIComponent(`${empresa?.nit_ci || ''}|${venta.correlativo}|${(Number(venta.total) || 0).toFixed(2)}|${fecha.toISOString().slice(0, 10)}`);
  const factura = venta.tipo_documento === 'FACTURA'
    ? `<div class="sep"></div>
    <div class="c pie">CÓDIGO DE AUTORIZACIÓN (CUF)</div>
    <div class="c pie brk">${esc(venta.cuf || '')}</div>
    <div class="c pie">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"</div>`
    : '';

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(venta.correlativo)}</title>
<style>
  @page { size: ${anchoMm}mm auto; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; color: #000; }
  body {
    width: ${anchoMm}mm;
    padding: 3mm ${angosto ? '2mm' : '3.5mm'} 5mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${angosto ? '11px' : '12.5px'};
    font-weight: 700;
    line-height: 1.3;
  }
  .c { text-align: center; }
  .logo { display: block; margin: 0 auto 1.5mm; max-width: ${angosto ? '36mm' : '46mm'}; max-height: 18mm; object-fit: contain;
          filter: grayscale(100%) brightness(80%) contrast(400%); }
  .empresa { font-size: ${angosto ? '15px' : '18px'}; font-weight: 900; text-transform: uppercase; letter-spacing: .4px; line-height: 1.15; }
  .info { font-size: ${angosto ? '10px' : '11px'}; font-weight: 700; margin-top: .8mm; }
  .band { background: #000; color: #fff; text-align: center; padding: 1.6mm 1mm; margin: 2.5mm 0 1.5mm; border-radius: 1.2mm; }
  .band .doc { font-size: ${angosto ? '12px' : '14px'}; font-weight: 900; letter-spacing: 1px; }
  .band .nro { font-size: ${angosto ? '16px' : '19px'}; font-weight: 900; letter-spacing: 1px; }
  .sep { border-top: 1.5px dashed #000; margin: 2mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: .7mm 0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; padding-left: 2.5mm; }
  .meta td:first-child { width: 34%; }
  .meta td:last-child { font-weight: 900; text-align: left; padding-left: 0; white-space: normal; }
  .head td { font-size: ${angosto ? '10px' : '11px'}; font-weight: 900; border-top: 2px solid #000; border-bottom: 2px solid #000; padding: 1mm 0; }
  .it td { border-bottom: 1px dotted #000; padding: 1.2mm 0; }
  .pu { width: 14mm; }
  .imp { width: 17mm; }
  .q { width: 10mm; font-weight: 900; padding-right: 1.5mm; }
  .nom { font-weight: 900; word-break: break-word; }
  .sub { font-size: ${angosto ? '9.5px' : '10.5px'}; font-weight: 700; }
  .linea { display: flex; justify-content: space-between; margin-top: .5mm; }
  .tot td { font-size: ${angosto ? '11.5px' : '13px'}; }
  .grand td { font-size: ${angosto ? '17px' : '21px'}; font-weight: 900; border-top: 2.5px solid #000; border-bottom: 2.5px solid #000; padding: 1.5mm 0; }
  .letras { font-size: ${angosto ? '9.5px' : '10.5px'}; font-weight: 900; margin-top: 1.5mm; }
  .qr { display: block; margin: 2.5mm auto 1mm; width: ${angosto ? '24mm' : '28mm'}; height: auto; image-rendering: pixelated; }
  .gracias { font-size: ${angosto ? '13px' : '15px'}; font-weight: 900; letter-spacing: .5px; margin-top: 1.5mm; }
  .pie { font-size: ${angosto ? '9px' : '10px'}; font-weight: 700; margin-top: 1mm; }
  .brk { word-break: break-all; }
</style></head><body>
  <img class="logo" src="${esc(logo)}" alt="" onerror="this.remove()">
  <div class="c empresa">${esc(empresa?.nombre || 'GLORYPOS')}</div>
  <div class="c info">
    ${empresa?.direccion ? `${esc(empresa.direccion)}<br>` : ''}
    ${empresa?.ciudad ? `${esc(empresa.ciudad)} - Bolivia<br>` : ''}
    NIT: ${esc(empresa?.nit_ci || '-')}${empresa?.telefono ? ` &nbsp;|&nbsp; Telf: ${esc(empresa.telefono)}` : ''}
  </div>

  <div class="band">
    <div class="doc">${tituloDocumento(venta.tipo_documento)}</div>
    <div class="nro">N° ${esc(venta.correlativo)}</div>
  </div>

  <table class="meta">
    <tr><td>Fecha</td><td>${fecha.toLocaleDateString('es-BO')} &nbsp; ${fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td></tr>
    <tr><td>Cliente</td><td>${esc(venta.cliente_nombre || 'Clientes varios')}</td></tr>
    <tr><td>NIT / CI</td><td>${esc(venta.cliente_ci_nit || '0')}</td></tr>
    ${filas(extraInfo)}
  </table>

  <table style="margin-top:2mm">
    ${cabeceraItems}
    ${items}
  </table>

  <table class="tot" style="margin-top:1.5mm">
    ${filas([
      [`Subtotal (${nItems} ${nItems === 1 ? 'artículo' : 'artículos'})`, (Number(venta.subtotal || venta.total)).toFixed(2)],
      descuentoMonto > 0 ? [`Descuento ${venta.descuento_porcentaje}%`, `-${descuentoMonto.toFixed(2)}`] : null,
    ])}
    <tr class="grand"><td>TOTAL Bs.</td><td class="num">${(Number(venta.total) || 0).toFixed(2)}</td></tr>
    ${filas([
      ['Forma de pago', esc(venta.metodo_pago || '-')],
      venta.num_operacion ? ['N° operación', esc(venta.num_operacion)] : null,
      venta.metodo_pago === 'EFECTIVO' ? ['Recibido', (Number(venta.monto_recibido || venta.total)).toFixed(2)] : null,
      venta.metodo_pago === 'EFECTIVO' && venta.cambio > 0 ? ['<b>Cambio</b>', `<b>${Number(venta.cambio).toFixed(2)}</b>`] : null,
    ])}
  </table>
  <div class="letras">SON: ${montoEnLetras(venta.total)}</div>
  ${factura}

  <div class="sep"></div>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${qrData}" alt="">
  <div class="c gracias">¡GRACIAS POR SU COMPRA!</div>
  <div class="c pie">Conserve este comprobante.<br>Sistema GLORYPOS</div>
</body></html>`;
}

// Imprime el ticket en un iframe oculto del ancho del rollo (sin diálogos extra ni la página detrás)
export function imprimirTicket(venta, empresa, anchoMm = getAnchoTicket()) {
  setAnchoTicket(anchoMm);
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden';
  document.body.appendChild(iframe);
  const doc = iframe.contentWindow.document;
  doc.open();
  doc.write(ticketHTML(venta, empresa, anchoMm));
  doc.close();
  let impreso = false;
  const lanzar = () => {
    if (impreso) return;
    impreso = true;
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => iframe.remove(), 1500);
  };
  // Espera a que cargue el QR (máx. 1.5 s) para que salga en el papel
  const img = doc.querySelector('img');
  if (img && !img.complete) {
    const t = setTimeout(lanzar, 1500);
    img.onload = img.onerror = () => { clearTimeout(t); lanzar(); };
  } else {
    setTimeout(lanzar, 50);
  }
}
