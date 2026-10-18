import React, { useState } from 'react';
import { 
  X, Printer, Share2, Mail, FileText, Check, 
  ArrowLeft, Sparkles, Receipt, Zap, ShoppingBag 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ticketHTML, imprimirTicket, getAnchoTicket } from '../../utils/ticketPrint';
import { simbolo } from '../../utils/currency';
import { toast } from 'sonner';

export default function ThermalTicketModal({ venta, isOpen, onClose, onNewSale }) {
  const { empresa } = useAuth();
  const [ancho, setAncho] = useState(getAnchoTicket);

  if (!isOpen || !venta) return null;

  const fechaObj = new Date(venta.fecha);
  const fechaStr = fechaObj.toLocaleDateString('es-BO');
  const horaStr = fechaObj.toLocaleTimeString('es-BO');

  // Imprime un ticket propio del ancho del rollo (nítido, negro y en negrita)
  const handlePrint = (mm = ancho) => {
    setAncho(mm);
    imprimirTicket(venta, empresa, mm);
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
        text += `${Number(it.cantidad).toFixed(3)} Kg x ${it.nombre} (@ ${simbolo()} ${Number(it.precio).toFixed(2)}/Kg) = ${simbolo()} ${it.subtotal.toFixed(2)}\n`;
      } else if (it.customDetails?.tipo === 'ROPA') {
        text += `${it.cantidad}x ${it.nombre} [T: ${it.customDetails.talla || '-'} • ${it.customDetails.color || '-'}] = ${simbolo()} ${it.subtotal.toFixed(2)}\n`;
      } else if (it.customDetails?.tipo === 'HELADERIA') {
        text += `${it.cantidad}x ${it.nombre} [${(it.customDetails.sabores || []).join(', ')}] = ${simbolo()} ${it.subtotal.toFixed(2)}\n`;
      } else if (it.lote) {
        text += `${it.cantidad}x ${it.nombre} (Lote: ${it.lote}) = ${simbolo()} ${it.subtotal.toFixed(2)}\n`;
      } else {
        const pres = it.presNombre && it.presNombre !== 'Unidad' ? ` (${it.presNombre})` : '';
        text += `${it.cantidad}x ${it.nombre}${pres} = ${simbolo()} ${it.subtotal.toFixed(2)}\n`;
      }
    });
    text += `--------------------------\n`;
    text += `*TOTAL: ${simbolo()} ${Number(venta.total).toFixed(2)}*\n`;
    text += `Método de Pago: ${venta.metodo_pago}\n`;
    if (venta.cambio > 0) text += `Cambio: ${simbolo()} ${Number(venta.cambio).toFixed(2)}\n`;
    text += `\n¡Gracias por su compra con GLORYPOS Bolivia!`;

    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  const isFactura = venta.tipo_documento === 'FACTURA';
  const isBoleta = venta.tipo_documento === 'BOLETA';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fadeIn overflow-y-auto [&>*]:my-auto">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs transition-opacity"
      />

      {/* Main Device Container mimicking Stitch Ticket preview */}
      <main className="w-full max-w-[420px] bg-[#eaedff] rounded-[28px] overflow-hidden shadow-2xl border-4 border-neutral-800 flex flex-col h-[94dvh] max-h-[890px] z-10 animate-scaleUp">
        {/* Inner Modal Card */}
        <section className="bg-white rounded-2xl m-2.5 flex-1 flex flex-col shadow-xs border border-[#dbe1ff] overflow-hidden">
          
          {/* BEGIN: ModalHeader (Exact Stitch Layout) */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#eaedff] bg-white">
            <div className="flex items-center space-x-2.5">
              {/* GLORYPOS Brand Badge */}
              <div className="flex items-center gap-1.5 bg-orange-50 px-2 py-1 rounded-lg border border-orange-200">
                <div className="w-5 h-5 rounded bg-[#FF6B35] flex items-center justify-center text-white shadow-xs">
                  <Zap className="w-3 h-3 fill-white" />
                </div>
                <span className="text-xs font-extrabold tracking-tight text-[#FF6B35]">
                  GLORYPOS
                </span>
              </div>
              <div className="h-3.5 w-px bg-slate-200"></div>
              <div className="flex items-center space-x-1.5">
                <span className="bg-orange-100 text-[#FF6B35] rounded p-1 text-xs font-bold flex items-center justify-center w-5 h-5">
                  <Receipt className="w-3 h-3" />
                </span>
                <h1 className="text-xs font-bold text-[#1E2022] tracking-tight">Recibo de venta</h1>
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
                className="bg-[#1E2022] hover:bg-slate-900 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver</span>
              </button>

              <button 
                onClick={() => handlePrint()}
                className="bg-[#FF6B35] hover:bg-[#ea580c] active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs shadow-orange-500/20"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Reimprimir</span>
              </button>

              {/* Row 2: WhatsApp & Email Share */}
              <button 
                onClick={handleShareWhatsApp}
                className="bg-[#00B574] hover:bg-[#009c63] active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs shadow-[#FF6B35]/20"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>

              <button 
                onClick={() => toast.info(`Enlace enviado al cliente ${venta.cliente_nombre}`)}
                className="bg-[#1E2022] hover:bg-slate-800 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Correo</span>
              </button>

              {/* Row 3: Ticket Format & PDF Export */}
              <button 
                onClick={() => handlePrint(80)}
                className="bg-slate-700 hover:bg-slate-800 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Ticket 80mm</span>
              </button>

              <button 
                onClick={() => handlePrint()}
                title="En el diálogo de impresión elige 'Guardar como PDF'"
                className="bg-[#FFB627] hover:bg-[#e6a21e] active:scale-[0.98] text-[#1E2022] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>PDF</span>
              </button>

              {/* Row 4: Mini Ticket & Nueva Venta */}
              <button 
                onClick={() => handlePrint(58)}
                className="bg-slate-600 hover:bg-slate-700 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Ticket 58mm</span>
              </button>

              <button 
                onClick={() => { onClose(); if (onNewSale) onNewSale(); }}
                className="bg-gradient-to-r from-[#FF6B35] to-[#ea580c] hover:opacity-95 active:scale-[0.98] transition flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-lg shadow-xs shadow-orange-500/25"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>Nueva Venta</span>
              </button>
            </div>
            {/* END: ActionButtonsGrid */}

            {/* Vista previa: es exactamente el mismo ticket que se imprime */}
            <div className="flex items-center justify-center gap-1 text-[11px] font-bold">
              {[80, 58].map(mm => (
                <button
                  key={mm}
                  type="button"
                  onClick={() => setAncho(mm)}
                  className={`px-3 py-1 rounded-lg border ${ancho === mm ? 'bg-[#1E2022] text-white border-[#1E2022]' : 'bg-white text-slate-600 border-slate-200'}`}
                >
                  Rollo {mm} mm
                </button>
              ))}
            </div>
            <div className="bg-slate-100 rounded-xl p-3 flex justify-center">
              <iframe
                title="Vista previa del ticket"
                srcDoc={ticketHTML(venta, empresa, ancho)}
                className="bg-white shadow-md border border-slate-300"
                style={{ width: `${ancho}mm`, height: '640px' }}
              />
            </div>
            {/* END: ThermalReceiptPaper */}
          </div>
        </section>
      </main>
    </div>
  );
}

