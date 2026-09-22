import React, { useState } from 'react';
import { X, CheckCircle2, AlertTriangle, RefreshCw, Send, ShieldCheck, FileCheck } from 'lucide-react';

export default function EstadoSunatModal({ isOpen, onClose, doc, onUpdateStatus }) {
  const [retrying, setRetrying] = useState(false);

  if (!isOpen || !doc) return null;

  const isError = doc.estado_sunat === 'Error envio';
  const isAceptado = doc.estado_sunat === 'Aceptado';

  const handleRetrySunat = () => {
    setRetrying(true);
    setTimeout(() => {
      setRetrying(false);
      if (onUpdateStatus) {
        onUpdateStatus(doc.id, 'Aceptado', 'El comprobante fue validado y aceptado satisfactoriamente por los servidores de SUNAT. CDR generado.');
      }
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            <h2 className="text-sm font-bold text-slate-800">Estado de Envío SUNAT</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block">Comprobante</span>
              <span className="font-mono font-bold text-slate-800 text-sm">{doc.serie_nro}</span>
            </div>
            <div>
              <span className="text-slate-400 font-bold text-[10px] uppercase block text-right">Fecha</span>
              <span className="text-slate-600 font-semibold">{doc.fecha}</span>
            </div>
          </div>

          {/* Status Alert Banner */}
          {isError ? (
            <div className="p-4 rounded-xl bg-orange-50 border border-orange-200 text-orange-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-xs">
                <AlertTriangle className="w-4 h-4 text-orange-600 shrink-0" />
                <span>Error en el envío al servidor SUNAT</span>
              </div>
              <p className="text-[11px] leading-relaxed text-orange-700">
                {doc.sunat_obs || 'Error 1033: El comprobante no pudo ser verificado por timeout o error en el canal seguro SOAP de SUNAT.'}
              </p>
            </div>
          ) : isAceptado ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Comprobante Aceptado por SUNAT</span>
              </div>
              <p className="text-[11px] text-emerald-700">
                {doc.sunat_obs || 'La constancia de recepción (CDR) fue emitida y registrada sin observaciones.'}
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 space-y-1.5">
              <div className="flex items-center gap-2 font-bold text-xs">
                <RefreshCw className="w-4 h-4 text-amber-600 shrink-0 animate-spin" />
                <span>Pendiente de Envío</span>
              </div>
              <p className="text-[11px] text-amber-700">
                El comprobante se encuentra en cola para transmisión a SUNAT.
              </p>
            </div>
          )}

          {/* Technical Info */}
          <div className="space-y-1.5 bg-slate-50 p-3 rounded-xl border border-slate-200 text-[11px]">
            <div className="flex justify-between">
              <span className="text-slate-500">Ticket SUNAT:</span>
              <span className="font-mono font-medium text-slate-700">{doc.ticket || '2026-TKT-9918231'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Constancia CDR:</span>
              <span className="font-mono font-medium text-slate-700">{isAceptado ? 'R-R001-1.XML' : 'No disponible'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Servicio Web:</span>
              <span className="font-mono text-slate-600">https://e-factura.sunat.gob.pe/ol-ti-itcpfegem/billService</span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-slate-100 bg-slate-50/60">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
          >
            Cerrar
          </button>
          {isError && (
            <button
              type="button"
              disabled={retrying}
              onClick={handleRetrySunat}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${retrying ? 'animate-spin' : ''}`} />
              <span>{retrying ? 'Reintentando...' : 'Reintentar Envío a SUNAT'}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
