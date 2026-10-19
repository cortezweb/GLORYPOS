import React, { useEffect, useRef, useState } from 'react';
import { X, Download, Printer, Loader2 } from 'lucide-react';
import { crearCotizacionPdf, descargarVentaPdf, tituloVenta } from '../../utils/cotizacionPdf';
import { crearTicketPdf, descargarTicketPdf } from '../../utils/ticketPdf';

// Visor del PDF real de un comprobante (A4 o ticket 80 mm) con descarga e impresión
export default function ComprobantePdfModal({ venta, empresa, formato = 'A4', onClose }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const frameRef = useRef(null);
  const titulo = tituloVenta(venta?.tipo_documento);

  useEffect(() => {
    let objectUrl = null;
    try {
      const doc = formato === 'TICKET'
        ? crearTicketPdf(venta, empresa, 80, titulo)
        : crearCotizacionPdf(venta, empresa, venta?.cajero || venta?.registrado_por || '', { titulo, esVenta: true });
      objectUrl = URL.createObjectURL(doc.output('blob'));
      setUrl(objectUrl);
    } catch (err) {
      console.error('[ComprobantePdfModal] No se pudo generar el PDF:', err);
      setError('No se pudo generar el PDF de este comprobante.');
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [venta, empresa, formato, titulo]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const descargar = () => (formato === 'TICKET'
    ? descargarTicketPdf(venta, empresa, 80, titulo)
    : descargarVentaPdf(venta, empresa, venta?.cajero || venta?.registrado_por));

  const imprimir = () => {
    try {
      frameRef.current?.contentWindow?.focus();
      frameRef.current?.contentWindow?.print();
    } catch {
      if (url) window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className={`bg-white w-full ${formato === 'TICKET' ? 'max-w-md' : 'max-w-4xl'} h-[92dvh] rounded-2xl shadow-2xl overflow-hidden flex flex-col`} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900">{titulo} {venta?.correlativo}</h3>
            <p className="text-xs text-slate-500">{formato === 'TICKET' ? 'Ticket 80 mm' : 'Formato A4'}</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" onClick={descargar} className="px-3 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50 flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" /> Descargar
            </button>
            <button type="button" onClick={imprimir} disabled={!url} className="px-3 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-60">
              <Printer className="w-3.5 h-3.5" /> Imprimir
            </button>
            <button type="button" onClick={onClose} className="p-1.5 text-slate-500 hover:text-slate-900" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <div className="flex-1 min-h-0 bg-neutral-800">
          {error ? (
            <div className="h-full flex items-center justify-center text-sm text-white">{error}</div>
          ) : !url ? (
            <div className="h-full flex items-center justify-center gap-2 text-sm text-white"><Loader2 className="w-4 h-4 animate-spin" /> Generando PDF...</div>
          ) : (
            <iframe ref={frameRef} title={`${titulo} ${venta?.correlativo}`} src={`${url}#view=FitH`} className="w-full h-full border-0" />
          )}
        </div>
      </div>
    </div>
  );
}
