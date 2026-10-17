import React, { useEffect, useRef, useState } from 'react';
import { Download, X, Printer, Loader2 } from 'lucide-react';
import { cotizacionPdfBlob, descargarCotizacionPdf } from '../../utils/cotizacionPdf';

// Vista previa del PDF A4 de una cotización (se genera en el navegador)
export default function CotizacionPdfModal({ cot, empresa, vendedor, autoPrint = false, onClose }) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  const frameRef = useRef(null);

  useEffect(() => {
    let objectUrl = null;
    try {
      objectUrl = URL.createObjectURL(cotizacionPdfBlob(cot, empresa, vendedor));
      setUrl(objectUrl);
    } catch (err) {
      console.error('[CotizacionPdfModal] No se pudo generar el PDF:', err);
      setError('No se pudo generar el PDF de esta cotización.');
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [cot, empresa, vendedor]);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const imprimir = () => {
    try {
      frameRef.current?.contentWindow?.focus();
      frameRef.current?.contentWindow?.print();
    } catch {
      window.open(url, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl h-[92dvh] rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3 border-b border-slate-200 flex items-center justify-between gap-3">
          <h3 className="font-bold text-sm sm:text-base text-slate-900 truncate">Comprobante {cot.correlativo}</h3>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={imprimir}
              disabled={!url}
              className="px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              <Printer className="w-4 h-4" /> Imprimir
            </button>
            <button
              type="button"
              onClick={() => descargarCotizacionPdf(cot, empresa, vendedor)}
              className="px-3 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#E85B28] text-white text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4" /> Descargar
            </button>
            <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-slate-700 min-h-0">
          {error ? (
            <div className="h-full flex items-center justify-center text-sm text-white">{error}</div>
          ) : !url ? (
            <div className="h-full flex items-center justify-center text-white gap-2 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Generando PDF...
            </div>
          ) : (
            <iframe
              ref={frameRef}
              title={`Cotización ${cot.correlativo}`}
              src={url}
              className="w-full h-full border-0"
              onLoad={() => { if (autoPrint) setTimeout(imprimir, 300); }}
            />
          )}
        </div>
      </div>
    </div>
  );
}
