import React, { useEffect, useRef, useState } from 'react';
import { X, FileText, Receipt, Printer, MessageCircle, Mail, Download, Loader2, CheckCircle2 } from 'lucide-react';
import { crearCotizacionPdf, descargarCotizacionPdf } from '../../utils/cotizacionPdf';
import { crearTicketPdf, descargarTicketPdf } from '../../utils/ticketPdf';
import { simbolo } from '../../utils/currency';
import CotizacionEmailModal from './CotizacionEmailModal';

const MARCA_PREVIA = 'Previsualización';

// Genera el PDF (A4 o ticket 80 mm) en el navegador y devuelve su URL para el visor
function usePdfUrl(cot, empresa, vendedor, formato, marcaAgua) {
  const [url, setUrl] = useState(null);
  const [error, setError] = useState(null);
  useEffect(() => {
    let objectUrl = null;
    setUrl(null);
    setError(null);
    try {
      const doc = formato === 'TICKET'
        ? crearTicketPdf(cot, empresa, 80, 'COTIZACIÓN', { marcaAgua })
        : crearCotizacionPdf(cot, empresa, vendedor, { marcaAgua });
      objectUrl = URL.createObjectURL(doc.output('blob'));
      setUrl(objectUrl);
    } catch (err) {
      console.error('[CotizacionDocsModal] No se pudo generar el PDF:', err);
      setError('No se pudo generar el PDF de esta cotización.');
    }
    return () => { if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [cot, empresa, vendedor, formato, marcaAgua]);
  return { url, error };
}

function useEscape(onClose) {
  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);
}

function VisorPdf({ url, error, frameRef, titulo }) {
  if (error) return <div className="h-full flex items-center justify-center text-sm text-white">{error}</div>;
  if (!url) {
    return (
      <div className="h-full flex items-center justify-center text-white gap-2 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Generando PDF...
      </div>
    );
  }
  return <iframe ref={frameRef} title={titulo} src={`${url}#view=FitH`} className="w-full h-full border-0" />;
}

// ── 1. Previsualización antes de guardar (con marca de agua) ──────────────
export function CotizacionPreviewModal({ cot, empresa, vendedor, onClose }) {
  const [formato, setFormato] = useState('A4');
  const { url, error } = usePdfUrl(cot, empresa, vendedor, formato, MARCA_PREVIA);
  useEscape(onClose);

  const boton = (valor, Icono, etiqueta, activo, inactivo) => (
    <button
      type="button"
      onClick={() => setFormato(valor)}
      className={`w-40 py-3 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition ${formato === valor ? activo : inactivo}`}
    >
      <Icono className="w-4 h-4" /> {etiqueta}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-4xl h-[94dvh] rounded-2xl shadow-2xl overflow-hidden flex flex-col p-5 sm:p-7" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-slate-200">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Previsualización de la cotización</h3>
            <p className="text-sm text-slate-500">Vista previa antes de guardar la cotización</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-600 hover:text-slate-900" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-4 flex-1 min-h-0 rounded-2xl border border-slate-200 overflow-hidden flex flex-col">
          <div className="flex items-center justify-center gap-2 py-3 bg-slate-50">
            {boton('TICKET', Receipt, 'TICKET', 'bg-amber-500 text-white ring-2 ring-amber-300', 'bg-amber-400/90 text-white hover:bg-amber-500')}
            {boton('A4', FileText, 'A4', 'bg-rose-600 text-white ring-2 ring-rose-300', 'bg-rose-500/90 text-white hover:bg-rose-600')}
          </div>
          <div className="flex-1 min-h-0 bg-neutral-800">
            <VisorPdf url={url} error={error} titulo={`Previsualización ${formato}`} />
          </div>
        </div>

        <p className="pt-4 text-center text-xs text-rose-600">
          Documento de previsualización con marca de agua — no válido como comprobante emitido.
        </p>
      </div>
    </div>
  );
}

// ── 2. Cotización registrada (después de guardar) ─────────────────────────
export function CotizacionRegistradaModal({ cot, empresa, vendedor, onIrLista, onNueva, onClose }) {
  const [formato, setFormato] = useState('A4');
  const [correoAbierto, setCorreoAbierto] = useState(false);
  const { url, error } = usePdfUrl(cot, empresa, vendedor, formato, null);
  const frameRef = useRef(null);
  useEscape(correoAbierto ? () => {} : onClose);

  const imprimir = () => {
    try {
      frameRef.current?.contentWindow?.focus();
      frameRef.current?.contentWindow?.print();
    } catch {
      if (url) window.open(url, '_blank');
    }
  };

  const whatsapp = () => {
    const tel = String(cot.cliente_telefono || '').replace(/\D/g, '');
    const texto = `Hola ${cot.cliente_nombre || ''}, te enviamos la cotización ${cot.correlativo} de ${empresa?.nombre || 'nuestra empresa'} por ${simbolo()} ${(Number(cot.total) || 0).toFixed(2)}.`;
    window.open(`https://wa.me/${tel}?text=${encodeURIComponent(texto)}`, '_blank', 'noopener');
  };

  const accion = (onClick, Icono, etiqueta, clases, extra = '') => (
    <button
      type="button"
      onClick={onClick}
      disabled={onClick === imprimir && !url}
      className={`py-3 rounded-xl text-white text-sm font-bold flex items-center justify-center gap-2 transition disabled:opacity-60 ${clases} ${extra}`}
    >
      <Icono className="w-4 h-4" /> {etiqueta}
    </button>
  );

  const pestaña = (valor, Icono, etiqueta) => (
    <button
      type="button"
      onClick={() => setFormato(valor)}
      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${formato === valor
        ? (valor === 'A4' ? 'bg-rose-600 text-white' : 'bg-amber-500 text-white')
        : 'text-slate-600 hover:bg-slate-100'}`}
    >
      <Icono className="w-3.5 h-3.5" /> {etiqueta}
    </button>
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4" onClick={onClose}>
      <div className="bg-white w-full max-w-5xl h-[94dvh] rounded-2xl shadow-2xl overflow-hidden flex flex-col" onClick={(e) => e.stopPropagation()}>
        <div className="flex-1 min-h-0 overflow-y-auto p-5 sm:p-6">
          <div className="flex items-start justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Cotización registrada</h3>
                <p className="text-sm text-slate-500">Documento generado correctamente</p>
              </div>
            </div>
            <button type="button" onClick={onClose} className="w-10 h-10 rounded-full border border-slate-200 flex items-center justify-center text-slate-600 hover:bg-slate-50" aria-label="Cerrar">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[minmax(0,22rem)_1fr] gap-5 md:h-[calc(100%-4.5rem)]">
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/60 p-4">
                <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Resumen
                </p>
                <div className="mt-3 pb-3 border-b border-emerald-200 flex items-center justify-between">
                  <span className="text-slate-800 font-medium">Total</span>
                  <span className="text-xl font-black text-emerald-700">{simbolo()} {(Number(cot.total) || 0).toFixed(2)}</span>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-700 mb-3">Acciones</p>
                <div className="grid grid-cols-2 gap-2.5">
                  {accion(imprimir, Printer, 'IMPRIMIR', 'bg-slate-700 hover:bg-slate-800', 'col-span-2')}
                  {accion(whatsapp, MessageCircle, 'WHATSAPP', 'bg-green-500 hover:bg-green-600')}
                  {accion(() => setCorreoAbierto(true), Mail, 'CORREO', 'bg-orange-500 hover:bg-orange-600')}
                  {accion(() => descargarTicketPdf(cot, empresa, 80, 'COTIZACIÓN'), Download, 'TICKET', 'bg-amber-600 hover:bg-amber-700')}
                  {accion(() => descargarCotizacionPdf(cot, empresa, vendedor), Download, 'PDF', 'bg-rose-600 hover:bg-rose-700')}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 overflow-hidden flex flex-col min-h-[60dvh] md:min-h-0">
              <div className="flex justify-center py-2.5 bg-slate-50">
                <div className="inline-flex items-center gap-1 p-1 rounded-xl border border-slate-200 bg-white">
                  {pestaña('TICKET', Receipt, 'TICKET')}
                  {pestaña('A4', FileText, 'A4')}
                </div>
              </div>
              <div className="flex-1 min-h-0 bg-neutral-800">
                <VisorPdf url={url} error={error} frameRef={frameRef} titulo={`Cotización ${cot.correlativo}`} />
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 sm:px-6 py-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <span className="text-sm text-emerald-700 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Cotización registrada · {cot.correlativo}
          </span>
          <div className="flex items-center gap-2.5">
            <button type="button" onClick={onIrLista} className="px-5 py-2.5 rounded-xl border border-slate-300 bg-white text-slate-800 font-semibold text-sm hover:bg-slate-50">
              Ir a la lista
            </button>
            <button type="button" onClick={onNueva} className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm">
              Nueva cotización
            </button>
          </div>
        </div>
      </div>

      {correoAbierto && (
        <div onClick={(e) => e.stopPropagation()}>
          <CotizacionEmailModal cot={cot} empresa={empresa} vendedor={vendedor} onClose={() => setCorreoAbierto(false)} />
        </div>
      )}
    </div>
  );
}
