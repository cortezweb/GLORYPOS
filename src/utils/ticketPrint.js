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

export function ticketHTML(venta, empresa, anchoMm = 80) {
  const angosto = anchoMm === 58;
  const fecha = new Date(venta.fecha);
  const items = (venta.items || []).map(it => {
    const cant = it.tipo_venta === 'PESO' || it.customDetails?.tipo === 'PESO' ? '' : `${it.cantidad} `;
    const extras = detalleItem(it).map(e => `<div class="sub">${esc(e)}</div>`).join('');
    return `<tr><td class="desc">${esc(cant)}${esc(it.nombre)}${extras}</td><td class="num">${(Number(it.subtotal) || 0).toFixed(2)}</td></tr>`;
  }).join('');
  const descuento = venta.descuento_porcentaje > 0
    ? `<tr><td>Descuento ${venta.descuento_porcentaje}%</td><td class="num">-${(((venta.subtotal || venta.total) * venta.descuento_porcentaje) / 100).toFixed(2)}</td></tr>` : '';
  const efectivo = venta.metodo_pago === 'EFECTIVO'
    ? `<tr><td>Pagó</td><td class="num">${(Number(venta.monto_recibido || venta.total)).toFixed(2)}</td></tr>${venta.cambio > 0 ? `<tr><td><b>Cambio</b></td><td class="num"><b>${Number(venta.cambio).toFixed(2)}</b></td></tr>` : ''}` : '';
  const factura = venta.tipo_documento === 'FACTURA' ? `
    <div class="sep"></div>
    <div class="c small">CÓDIGO DE AUTORIZACIÓN (CUF)</div>
    <div class="c small brk">${esc(venta.cuf || '')}</div>
    <div class="c small">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS. EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"</div>` : '';
  const extraInfo = [
    venta.mesa ? `Mesa: ${venta.mesa}` : '',
    venta.entrega?.tipo === 'DELIVERY' ? 'Entrega: Delivery' : venta.entrega?.tipo === 'RECOJO' ? 'Entrega: Recojo en tienda' : '',
    venta.cliente_telefono ? `Cel: ${venta.cliente_telefono}` : '',
  ].filter(Boolean).map(t => `<div>${esc(t)}</div>`).join('');

  return `<!doctype html><html><head><meta charset="utf-8"><title>${esc(venta.correlativo)}</title>
<style>
  @page { size: ${anchoMm}mm auto; margin: 0; }
  * { box-sizing: border-box; color: #000 !important; background: transparent; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body {
    width: ${anchoMm}mm;
    padding: 2mm ${angosto ? '2mm' : '3mm'} 4mm;
    font-family: Arial, Helvetica, sans-serif;
    font-size: ${angosto ? '11.5px' : '13px'};
    font-weight: 700;
    line-height: 1.3;
    -webkit-font-smoothing: none;
    text-rendering: optimizeSpeed;
  }
  .c { text-align: center; }
  .empresa { font-size: ${angosto ? '15px' : '17px'}; font-weight: 900; text-transform: uppercase; letter-spacing: .3px; }
  .doc { font-size: ${angosto ? '13px' : '15px'}; font-weight: 900; margin-top: 1mm; }
  .nro { font-size: ${angosto ? '15px' : '18px'}; font-weight: 900; letter-spacing: .5px; }
  .small { font-size: ${angosto ? '10px' : '11px'}; }
  .brk { word-break: break-all; }
  .sep { border-top: 2px dashed #000; margin: 2mm 0; }
  .sep-solid { border-top: 2px solid #000; margin: 1.5mm 0; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: .6mm 0; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; padding-left: 2mm; }
  .desc { word-break: break-word; }
  .sub { font-size: ${angosto ? '10px' : '11px'}; font-weight: 700; padding-left: 2mm; }
  .head td { border-bottom: 2px solid #000; font-weight: 900; }
  .total td { font-size: ${angosto ? '16px' : '19px'}; font-weight: 900; padding-top: 1mm; }
  .meta td:first-child { width: 38%; }
  .qr { display: block; margin: 2mm auto 0; width: ${angosto ? '26mm' : '30mm'}; height: auto; image-rendering: pixelated; }
</style></head><body>
  <div class="c empresa">${esc(empresa?.nombre || 'GLORYPOS')}</div>
  ${empresa?.direccion ? `<div class="c small">${esc(empresa.direccion)}${empresa?.ciudad ? ` - ${esc(empresa.ciudad)}` : ''}</div>` : ''}
  <div class="c small">NIT: ${esc(empresa?.nit_ci || '-')}${empresa?.telefono ? ` · Telf: ${esc(empresa.telefono)}` : ''}</div>
  <div class="sep"></div>
  <div class="c doc">${tituloDocumento(venta.tipo_documento)}</div>
  <div class="c nro">${esc(venta.correlativo)}</div>
  <div class="sep"></div>
  <table class="meta">
    <tr><td>Fecha:</td><td>${fecha.toLocaleDateString('es-BO')} ${fecha.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' })}</td></tr>
    <tr><td>Cliente:</td><td>${esc(venta.cliente_nombre || 'Clientes varios')}</td></tr>
    <tr><td>NIT/CI:</td><td>${esc(venta.cliente_ci_nit || '0')}</td></tr>
    <tr><td>Pago:</td><td>${esc(venta.metodo_pago || '')}${venta.num_operacion ? ` #${esc(venta.num_operacion)}` : ''}</td></tr>
  </table>
  ${extraInfo ? `<div class="small">${extraInfo}</div>` : ''}
  <div class="sep"></div>
  <table>
    <tr class="head"><td>DESCRIPCIÓN</td><td class="num">IMPORTE</td></tr>
    ${items}
  </table>
  <div class="sep-solid"></div>
  <table>
    <tr><td>Subtotal</td><td class="num">${(Number(venta.subtotal || venta.total)).toFixed(2)}</td></tr>
    ${descuento}
    <tr class="total"><td>TOTAL</td><td class="num">${bs(venta.total)}</td></tr>
    ${efectivo}
  </table>
  ${factura}
  <div class="sep"></div>
  <img class="qr" src="https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=0&data=${encodeURIComponent(`GLORYPOS|${venta.correlativo}|${venta.total}`)}" alt="QR">
  <div class="c" style="margin-top:2mm">¡GRACIAS POR SU COMPRA!</div>
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
