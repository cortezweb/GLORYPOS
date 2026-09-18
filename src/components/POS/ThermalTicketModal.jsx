import React from 'react';
import { 
  X, Printer, Share2, Mail, FileText, Check, 
  ArrowLeft, Sparkles, Receipt, Zap, ShoppingBag 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ThermalTicketModal({ venta, isOpen, onClose, onNewSale }) {
  const { empresa } = useAuth();

  if (!isOpen || !venta) return null;

  const fechaObj = new Date(venta.fecha);
  const fechaStr = fechaObj.toLocaleDateString('es-BO');
  const horaStr = fechaObj.toLocaleTimeString('es-BO');

  const handlePrint = () => {
    window.print();
  };

  const handleShareWhatsApp = () => {
    let text = `*${empresa?.nombre || 'GLORYPOS'}*\n`;
    text += `NIT/CI: ${empresa?.nit_ci || ''}\n`;
    text += `${venta.tipo_documento === 'FACTURA' ? 'FACTURA ELECTRÓNICA SIAT' : (venta.tipo_documento === 'BOLETA' ? 'BOLETA DE VENTA' : 'NOTA DE VENTA')} N° ${venta.correlativo}\n`;
    text += `Fecha: ${fechaStr} ${horaStr}\n`;
    text += `Cliente: ${venta.cliente_nombre} (${venta.cliente_ci_nit})\n`;
    text += `--------------------------\n`;
    venta.items.forEach(it => {
      const isPeso = it.tipo_venta === 'PESO' || it.customDetails?.tipo === 'PESO';
      if (isPeso) {
        text += `${Number(it.cantidad).toFixed(3)} Kg x ${it.nombre} (@ Bs. ${Number(it.precio).toFixed(2)}/Kg) = Bs. ${it.subtotal.toFixed(2)}\n`;
      } else if (it.customDetails?.tipo === 'ROPA') {
        text += `${it.cantidad}x ${it.nombre} [T: ${it.customDetails.talla || '-'} • ${it.customDetails.color || '-'}] = Bs. ${it.subtotal.toFixed(2)}\n`;
      } else if (it.customDetails?.tipo === 'HELADERIA') {
        text += `${it.cantidad}x ${it.nombre} [${(it.customDetails.sabores || []).join(', ')}] = Bs. ${it.subtotal.toFixed(2)}\n`;
      } else if (it.lote) {
        text += `${it.cantidad}x ${it.nombre} (Lote: ${it.lote}) = Bs. ${it.subtotal.toFixed(2)}\n`;
      } else {
        const pres = it.presNombre && it.presNombre !== 'Unidad' ? ` (${it.presNombre})` : '';
        text += `${it.cantidad}x ${it.nombre}${pres} = Bs. ${it.subtotal.toFixed(2)}\n`;
      }
    });
    text += `--------------------------\n`;
    text += `*TOTAL: Bs. ${Number(venta.total).toFixed(2)}*\n`;
    text += `Método de Pago: ${venta.metodo_pago}\n`;
    if (venta.cambio > 0) text += `Cambio: Bs. ${Number(venta.cambio).toFixed(2)}\n`;
    text += `\n¡Gracias por su compra con GLORYPOS Bolivia!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const isFactura = venta.tipo_documento === 'FACTURA';
  const isBoleta = venta.tipo_documento === 'BOLETA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Main Device Container mimicking Stitch Ticket preview */}
      <main className="w-full max-w-[420px] bg-[#eaedff] rounded-[28px] overflow-hidden shadow-2xl border-4 border-neutral-800 flex flex-col h-[94vh] max-h-[890px] z-10 animate-scaleUp">
        {/* Inner Modal Card */}
        <section className="bg-white rounded-2xl m-2.5 flex-1 flex flex-col shadow-xs border border-[#dbe1ff] overflow-hidden">
          
          {/* BEGIN: ModalHeader (Exact Stitch Layout) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaedff] bg-white">
            <div className="flex items-center space-x-2.5">
              {/* GLORYPOS Brand Badge */}
              <div className="flex items-center gap-1.5 bg-gradient-to-r from-blue-50 to-violet-50 px-2 py-1 rounded-lg border border-[#dbe1ff]">
                <div className="w-5 h-5 rounded bg-gradient-to-tr from-[#2563eb] to-[#7c3aed] flex items-center justify-center text-white shadow-xs">
                  <Zap className="w-3 h-3 fill-white" />
                </div>
                <span className="text-xs font-extrabold tracking-tight bg-gradient-to-r from-[#2563eb] to-[#7c3aed] bg-clip-text text-transparent">
                  GLORYPOS
                </span>
              </div>
              <div className="h-3.5 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-1.5">
                <span className="bg-[#dbe1ff] text-[#2563eb] rounded p-1 text-xs font-bold flex items-center justify-center w-5 h-5">
                  <Receipt className="w-3 h-3" />
                </span>
                <h1 className="text-xs font-bold text-[#131b2e] tracking-tight">Recibo de venta</h1>
              </div>
            </div>

            <button 
              onClick={onClose}
              aria-label="Cerrar modal" 
              className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors" 
              type="button"
            >
              <X className="w-4 h-4 stroke-[2.5]" />
            </button>
          </div>
          {/* END: ModalHeader */}

          {/* Scrollable Action & Preview Container */}
          <div className="flex-1 overflow-y-auto px-3 pt-3 pb-3 space-y-3 receipt-scroll">
            {/* BEGIN: ActionButtonsGrid (Exact Stitch 8-button grid) */}
            <div className="grid grid-cols-2 gap-2 text-white font-bold text-[11px] tracking-wide uppercase" data-purpose="pos-action-grid">
              {/* Row 1: Return & Thermal Reprint */}
              <button 
                onClick={onClose}
                className="bg-[#1e293b] hover:bg-[#0f172a] active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <button 
                onClick={handlePrint}
                className="bg-[#2563eb] hover:bg-blue-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs shadow-blue-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reimprimir</span>
              </button>

              {/* Row 2: WhatsApp & Email Share */}
              <button 
                onClick={handleShareWhatsApp}
                className="bg-[#7c3aed] hover:bg-violet-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs shadow-violet-500/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button 
                onClick={() => alert(`Enlace enviado al cliente ${venta.cliente_nombre}`)}
                className="bg-[#4f46e5] hover:bg-indigo-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Correo</span>
              </button>

              {/* Row 3: Ticket Format & PDF Export */}
              <button 
                onClick={handlePrint}
                className="bg-[#3b82f6] hover:bg-blue-600 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ticket 80mm</span>
              </button>

              <button 
                onClick={handlePrint}
                className="bg-[#9333ea] hover:bg-purple-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              {/* Row 4: Mini Ticket & Nueva Venta */}
              <button 
                onClick={handlePrint}
                className="bg-[#6366f1] hover:bg-indigo-600 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket 58mm</span>
              </button>

              <button 
                onClick={() => { onClose(); if (onNewSale) onNewSale(); }}
                className="bg-gradient-to-r from-[#2563eb] to-[#7c3aed] hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Nueva Venta</span>
              </button>
            </div>
            {/* END: ActionButtonsGrid */}

            {/* BEGIN: ThermalReceiptPaper (Exact Stitch thermal simulation) */}
            <article 
              id="ticket-termico"
              className="bg-[#fbfbfb] p-4 border border-slate-300 font-mono text-slate-800 text-[11px] leading-[1.3] select-none mx-auto max-w-[340px] shadow-sm rounded-sm"
              data-purpose="thermal-receipt-preview"
            >
              {/* Company Logo & Branding */}
              <header className="text-center mb-2">
                <div className="flex items-center justify-center gap-1 font-sans font-black text-base text-slate-900 tracking-tighter">
                  <span className="text-[#2563eb] text-lg leading-none">
                    ★
                  </span>
                  <span className="tracking-wide uppercase">{empresa?.nombre || 'GLORYPOS BOLIVIA'}</span>
                </div>
                <p className="text-[9px] font-sans font-semibold tracking-widest text-[#2563eb] -mt-0.5 uppercase">
                  PUNTO DE VENTA & FACTURACIÓN
                </p>
              </header>

              {/* Company Tax & Business Details */}
              <div className="text-center text-[10px] space-y-0.5 font-bold">
                <p className="font-black text-[11px]">Casa Matriz: {empresa?.ciudad || 'Santa Cruz, Bolivia'}</p>
                <p>{empresa?.direccion || 'Av. Monseñor Rivero #240'}</p>
                <p className="font-bold">NIT: {empresa?.nit_ci || '8472910014'}</p>
                <p className="text-[9.5px]">Telf: {empresa?.telefono || '77012345'}</p>
              </div>

              {/* Thermal Dashed Line */}
              <div className="border-t-[1.5px] border-dashed border-slate-500 my-2"></div>

              {/* Electronic Invoice Series & Number */}
              <div className="text-center font-bold">
                <p className="text-[11px] font-black uppercase">
                  {isFactura ? 'FACTURA ELECTRÓNICA SIAT' : (isBoleta ? 'BOLETA DE VENTA ELECTRÓNICA' : 'NOTA DE VENTA')}
                </p>
                <p className="text-[12px] font-black tracking-wider text-[#2563eb]">
                  {venta.correlativo}
                </p>
              </div>

              <div className="border-t-[1.5px] border-dashed border-slate-500 my-2"></div>

              {/* Document Metadata */}
              <div className="text-[10px] space-y-0.5">
                <div className="flex justify-between">
                  <span>Fecha Emisión:</span>
                  <span className="font-semibold">{fechaStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Hora Emisión:</span>
                  <span className="font-semibold">{horaStr}</span>
                </div>
                <div className="flex justify-between">
                  <span>Cliente:</span>
                  <span className="font-bold truncate max-w-[160px]">{venta.cliente_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span>NIT / CI:</span>
                  <span>{venta.cliente_ci_nit}</span>
                </div>
                <div className="flex justify-between">
                  <span>Método Pago:</span>
                  <span className="font-bold">{venta.metodo_pago}</span>
                </div>
                {venta.num_operacion && (
                  <div className="flex justify-between">
                    <span>N° Referencia:</span>
                    <span>{venta.num_operacion}</span>
                  </div>
                )}
              </div>

              <div className="border-t-[1.5px] border-dashed border-slate-500 my-2"></div>

              {/* Items Table */}
              <div className="space-y-1 text-[10px]">
                <div className="flex justify-between font-bold border-b border-dashed border-slate-400 pb-1">
                  <span>DESCRIPCIÓN</span>
                  <span>TOTAL</span>
                </div>

                {venta.items.map((item, idx) => {
                  const isPeso = item.tipo_venta === 'PESO' || item.customDetails?.tipo === 'PESO';
                  const details = item.customDetails;

                  return (
                    <div key={idx} className="flex justify-between items-baseline py-0.5 border-b border-dotted border-slate-200">
                      <div className="flex-1 pr-2">
                        {isPeso ? (
                          <span className="font-bold">{Number(item.cantidad).toFixed(3)} Kg x </span>
                        ) : (
                          <span className="font-bold">{item.cantidad}x </span>
                        )}
                        <span>{item.nombre}</span>

                        {isPeso && (
                          <span className="text-[9px] text-slate-500 block">
                            @ Bs. {Number(item.precio).toFixed(2)} / Kg
                          </span>
                        )}

                        {item.presNombre && item.presNombre !== 'Unidad' && (
                          <span className="text-[9px] text-slate-500 block">[{item.presNombre}]</span>
                        )}

                        {details?.tipo === 'ROPA' && (
                          <span className="text-[9px] text-slate-600 font-semibold block">
                            [Talla: {details.talla || '-'} • Color: {details.color || '-'}]
                          </span>
                        )}

                        {details?.tipo === 'HELADERIA' && details.sabores?.length > 0 && (
                          <span className="text-[9px] text-slate-600 block">
                            [{details.sabores.join(', ')}]
                          </span>
                        )}

                        {item.lote && (
                          <span className="text-[8.5px] text-slate-500 block">
                            Lote: {item.lote} {item.fecha_vencimiento ? `(Vence: ${item.fecha_vencimiento})` : ''}
                          </span>
                        )}
                      </div>
                      <span className="font-bold whitespace-nowrap">Bs. {Number(item.subtotal).toFixed(2)}</span>
                    </div>
                  );
                })}
              </div>

              <div className="border-t-[1.5px] border-dashed border-slate-500 my-2"></div>

              {/* Totales */}
              <div className="space-y-0.5 text-[10px]">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Bs. {Number(venta.subtotal || venta.total).toFixed(2)}</span>
                </div>

                {venta.descuento_porcentaje > 0 && (
                  <div className="flex justify-between text-rose-600 font-bold">
                    <span>Descuento ({venta.descuento_porcentaje}%):</span>
                    <span>- Bs. {(((venta.subtotal || venta.total) * venta.descuento_porcentaje) / 100).toFixed(2)}</span>
                  </div>
                )}

                <div className="flex justify-between text-xs font-black pt-1 border-t border-slate-300">
                  <span>TOTAL A PAGAR:</span>
                  <span>Bs. {Number(venta.total).toFixed(2)}</span>
                </div>

                {venta.metodo_pago === 'EFECTIVO' && (
                  <>
                    <div className="flex justify-between pt-0.5">
                      <span>Monto Pagado:</span>
                      <span>Bs. {Number(venta.monto_recibido || venta.total).toFixed(2)}</span>
                    </div>
                    {venta.cambio > 0 && (
                      <div className="flex justify-between font-bold text-emerald-700">
                        <span>Cambio / Vuelto:</span>
                        <span>Bs. {Number(venta.cambio).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* CUF & SIAT QR if Factura */}
              {isFactura && (
                <div className="mt-3 pt-2 border-t-[1.5px] border-dashed border-slate-500 text-center text-[9px] space-y-1">
                  <p className="font-bold">CÓDIGO ÚNICO DE FACTURA (CUF):</p>
                  <p className="font-mono break-all text-[8px] text-slate-600">
                    {venta.cuf || '48291048201948201482019482019482019482019482014820'}
                  </p>
                  <p className="font-bold text-[8.5px]">"ESTA FACTURA CONTRIBUYE AL DESARROLLO DEL PAÍS, EL USO ILÍCITO SERÁ SANCIONADO PENALMENTE DE ACUERDO A LEY"</p>
                </div>
              )}

              {/* QR Code Graphic */}
              <div className="mt-3 flex flex-col items-center justify-center">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=GLORYPOS_VENTA_${venta.id}`}
                  alt="QR Comprobante"
                  className="w-20 h-20 bg-white p-1 border border-slate-300"
                />
                <span className="text-[9px] text-slate-500 mt-1">GLORYPOS Bolivia • Impresión Térmica</span>
              </div>
            </article>
            {/* END: ThermalReceiptPaper */}
          </div>
        </section>
      </main>
    </div>
  );
}
