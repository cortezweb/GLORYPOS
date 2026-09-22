import React from 'react';
import { X, Printer, Download, QrCode } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DocumentoPdfPreviewModal({ isOpen, onClose, doc, type = 'retencion' }) {
  const { empresa } = useAuth();
  if (!isOpen || !doc) return null;

  const isRetencion = type === 'retencion';
  const isPercepcion = type === 'percepcion';

  const docTitle = 
    isRetencion ? 'COMPROBANTE DE RETENCIÓN ELECTRÓNICA' :
    isPercepcion ? 'COMPROBANTE DE PERCEPCIÓN ELECTRÓNICA' :
    'COMPROBANTE DE REVERSIÓN ELECTRÓNICA';

  const subjectHeader = isRetencion ? 'PROVEEDOR / SUJETO RETENIDO' : 'SUJETO PERCIBIDO (CLIENTE)';
  const subjectName = doc.proveedor_nombre || doc.sujeto_nombre || 'Clientes varios';
  const subjectDoc = doc.proveedor_doc || doc.sujeto_doc || '000000';

  const amountLabel = isRetencion ? 'TOTAL RETENIDO' : isPercepcion ? 'TOTAL PERCIBIDO' : 'TOTAL REVERTIDO';
  const amountVal = isRetencion ? (doc.retenido ?? 0) : isPercepcion ? (doc.percibido ?? 0) : (doc.monto ?? 0);
  const totalBase = doc.monto_total_comprobante || (Number(amountVal) / 0.03);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-slate-200 overflow-hidden my-6">
        {/* Modal Controls Bar */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-slate-100/80">
          <span className="text-xs font-bold text-slate-700">Vista Previa Impresión (A4 / Formato Electrónico)</span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Paper Canvas */}
        <div className="p-8 bg-white text-slate-900 font-sans space-y-6 max-h-[80vh] overflow-y-auto print:p-0 print:max-h-none">
          {/* Header row: Company logo / info on left, SUNAT RUC box on right */}
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1">
              <h1 className="text-lg font-black text-slate-900 tracking-tight">
                {empresa?.nombre_comercial || empresa?.razon_social || 'GLORYPOS NEGOCIOS S.A.C.'}
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {empresa?.direccion || 'Av. Principal #1024, Edificio Corporativo'}
              </p>
              <p className="text-xs text-slate-500">
                Tel: {empresa?.telefono || '77012345'} • Email: {empresa?.email || 'contacto@glorypos.com'}
              </p>
            </div>

            {/* SUNAT Box */}
            <div className="border-2 border-slate-800 rounded-xl p-3 text-center min-w-[210px] bg-slate-50/50">
              <p className="text-xs font-bold tracking-wider text-slate-800">R.U.C. {empresa?.nit || '20608945123'}</p>
              <p className="text-[11px] font-black my-1 text-slate-900 leading-tight">{docTitle}</p>
              <p className="text-sm font-black font-mono text-emerald-800 mt-1">{doc.serie_nro}</p>
            </div>
          </div>

          {/* Subject & Voucher metadata */}
          <div className="border border-slate-200 rounded-xl p-4 text-xs grid grid-cols-2 gap-3 bg-slate-50/40">
            <div>
              <span className="text-slate-400 text-[10px] font-bold block uppercase">{subjectHeader}</span>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{subjectName}</p>
              <p className="text-slate-600 font-mono text-xs">RUC/N° Doc: {subjectDoc}</p>
            </div>
            <div className="space-y-1 text-right sm:text-left">
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Fecha de Emisión: </span>
                <span className="font-semibold text-slate-800">{doc.fecha}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Moneda: </span>
                <span className="font-semibold text-slate-800">SOLES (S/)</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] font-bold uppercase">Estado SUNAT: </span>
                <span className="font-semibold text-emerald-700">{doc.estado_sunat}</span>
              </div>
            </div>
          </div>

          {/* Documents Table */}
          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-100 text-slate-600 uppercase text-[10px] font-bold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-3">Comprobante Origen</th>
                  <th className="py-2.5 px-3">Fecha Ref.</th>
                  <th className="py-2.5 px-3 text-right">Importe Total</th>
                  <th className="py-2.5 px-3 text-center">Tasa (%)</th>
                  <th className="py-2.5 px-3 text-right">Importe Retenido</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                <tr>
                  <td className="py-3 px-3 font-mono font-bold text-emerald-700">{doc.origen || '—'}</td>
                  <td className="py-3 px-3 text-slate-600">{doc.fecha}</td>
                  <td className="py-3 px-3 text-right font-medium text-slate-700">S/ {Number(totalBase).toFixed(2)}</td>
                  <td className="py-3 px-3 text-center font-bold text-slate-700">{doc.tasa_porcentaje || 3}%</td>
                  <td className="py-3 px-3 text-right font-bold text-slate-900">S/ {Number(amountVal).toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Totals Summary */}
          <div className="flex justify-between items-start pt-2">
            <div className="max-w-xs text-xs text-slate-500 italic">
              <p className="font-semibold text-slate-700 not-italic">Observación:</p>
              <p>{doc.observacion || 'Comprobante emitido según normativa de SUNAT para agentes autorizados.'}</p>
            </div>
            <div className="w-56 space-y-1.5 text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div className="flex justify-between text-slate-600">
                <span>Total Operación:</span>
                <span className="font-semibold">S/ {Number(totalBase).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-900 font-black text-sm pt-1.5 border-t border-slate-200">
                <span>{amountLabel}:</span>
                <span className="text-emerald-700">S/ {Number(amountVal).toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Security / QR */}
          <div className="pt-4 border-t border-dashed border-slate-200 flex items-center justify-between text-[11px] text-slate-400">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 border border-slate-300 rounded p-1 flex items-center justify-center">
                <QrCode className="w-10 h-10 text-slate-700" />
              </div>
              <div>
                <p className="font-bold text-slate-600">Representación Impresa del Comprobante Electrónico</p>
                <p className="font-mono text-[10px]">Autorizado mediante Resolución de Superintendencia SUNAT</p>
              </div>
            </div>
            <div className="text-right font-mono text-[10px]">
              GLORYPOS ERP • PWA
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
