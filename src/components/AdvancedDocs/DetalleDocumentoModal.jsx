import React from 'react';
import { X, Printer, CheckCircle2, AlertCircle, FileText, QrCode } from 'lucide-react';

export default function DetalleDocumentoModal({ isOpen, onClose, doc, type = 'retencion', onPrint }) {
  if (!isOpen || !doc) return null;

  const title = 
    type === 'retencion' ? 'Comprobante de Retención Electrónica' :
    type === 'percepcion' ? 'Comprobante de Percepción Electrónica' :
    'Comprobante de Reversión Electrónica';

  const amountLabel = 
    type === 'retencion' ? 'Total Retenido' :
    type === 'percepcion' ? 'Total Percibido' :
    'Total Revertido';

  const amountValue = 
    type === 'retencion' ? (doc.retenido ?? 0) :
    type === 'percepcion' ? (doc.percibido ?? 0) :
    (doc.monto ?? 0);

  const subjectName = doc.proveedor_nombre || doc.sujeto_nombre || 'Clientes varios';
  const subjectDoc = doc.proveedor_doc || doc.sujeto_doc || '000000';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              SUNAT Electrónico
            </span>
            <h2 className="text-base font-bold text-slate-800 mt-1">{title}</h2>
            <p className="text-xs text-slate-500 font-mono font-bold">{doc.serie_nro || `${doc.serie}-${doc.correlativo}`}</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {/* Status Bar */}
          <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200">
            <div className="text-xs">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Estado SUNAT</span>
              <span className={`inline-flex items-center gap-1 font-bold text-xs mt-0.5 ${
                doc.estado_sunat === 'Aceptado' ? 'text-emerald-700' :
                doc.estado_sunat === 'Error envio' ? 'text-orange-600' :
                'text-amber-600'
              }`}>
                {doc.estado_sunat === 'Aceptado' ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                {doc.estado_sunat}
              </span>
            </div>
            <div className="text-xs text-right">
              <span className="text-slate-400 block text-[10px] font-bold uppercase">Fecha de Emisión</span>
              <span className="font-semibold text-slate-700">{doc.fecha}</span>
            </div>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Sujeto / Proveedor</span>
              <p className="font-bold text-slate-900">{subjectName}</p>
              <p className="text-slate-500 font-mono text-[11px]">RUC/Doc: {subjectDoc}</p>
            </div>
            <div className="space-y-1">
              <span className="text-slate-400 text-[10px] font-bold uppercase">Comprobante Origen / Modificado</span>
              <p className="font-mono font-bold text-emerald-700">{doc.origen || '—'}</p>
              <p className="text-slate-500 text-[11px]">{doc.motivo || 'Operación comercial sujeta a régimen fiscal'}</p>
            </div>
          </div>

          {/* Financial Breakdown */}
          <div className="p-4 rounded-xl border border-slate-200 space-y-2 bg-slate-50/40 text-xs">
            {doc.monto_total_comprobante && (
              <div className="flex justify-between text-slate-600">
                <span>Importe Total Comprobante:</span>
                <span className="font-medium">S/ {Number(doc.monto_total_comprobante).toFixed(2)}</span>
              </div>
            )}
            {doc.tasa_porcentaje && (
              <div className="flex justify-between text-slate-600">
                <span>Porcentaje / Tasa Aplicada:</span>
                <span className="font-medium">{doc.tasa_porcentaje}%</span>
              </div>
            )}
            <div className="flex justify-between font-bold text-sm text-slate-900 pt-2 border-t border-slate-200">
              <span>{amountLabel}:</span>
              <span className="text-emerald-700">S/ {Number(amountValue).toFixed(2)}</span>
            </div>
          </div>

          {/* Electronic Security / Mock QR */}
          <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div className="w-14 h-14 bg-white border border-slate-200 rounded-lg flex items-center justify-center shrink-0">
              <QrCode className="w-10 h-10 text-slate-700" />
            </div>
            <div className="text-[11px] text-slate-500 space-y-0.5">
              <p className="font-bold text-slate-700">Resumen y Firma Digital Electrónica</p>
              <p className="font-mono text-[10px] text-slate-400 truncate max-w-xs">
                Hash: 4Xv9K2m0Lqp9108a73zBnc091=
              </p>
              <p className="text-[10px] text-slate-400">
                Representación impresa del Comprobante Electrónico (SUNAT)
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            onClick={() => onPrint ? onPrint(doc) : window.print()}
            className="px-4 py-2 border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl transition flex items-center gap-1.5 shadow-xs"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Documento</span>
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold rounded-xl transition"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
