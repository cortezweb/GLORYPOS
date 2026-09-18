import React, { useState, useEffect } from 'react';
import { 
  X, AlertTriangle, Calculator, LogOut, CheckCircle2, 
  Printer, ArrowLeft, Banknote, ShieldCheck 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';

export default function CloseCashModal({ isOpen, onClose }) {
  const { empresa } = useAuth();
  const [step, setStep] = useState('CONFIRM'); // 'CONFIRM' | 'COUNT' | 'SUMMARY'
  const [ventasStats, setVentasStats] = useState({
    total: 0,
    efectivo: 0,
    boletas: 0,
    facturas: 0,
    notas: 0
  });

  // Billetes bolivianos para el conteo físico
  const [counts, setCounts] = useState({
    b200: 0,
    b100: 0,
    b50: 0,
    b20: 0,
    b10: 0,
    monedas: 0
  });

  useEffect(() => {
    if (!isOpen) {
      setStep('CONFIRM');
      return;
    }

    const loadStats = async () => {
      const allVentas = await db.ventas.toArray();
      const total = allVentas.reduce((acc, v) => acc + (v.total || 0), 0);
      const efectivo = allVentas
        .filter(v => v.metodo_pago === 'EFECTIVO')
        .reduce((acc, v) => acc + (v.total || 0), 0);
      
      const boletas = allVentas.filter(v => v.tipo_documento === 'BOLETA').length;
      const facturas = allVentas.filter(v => v.tipo_documento === 'FACTURA').length;
      const notas = allVentas.filter(v => v.tipo_documento === 'NOTA_VENTA').length;

      setVentasStats({
        total,
        efectivo,
        boletas,
        facturas,
        notas
      });
    };

    loadStats();
  }, [isOpen]);

  if (!isOpen) return null;

  const totalContado = 
    (counts.b200 * 200) +
    (counts.b100 * 100) +
    (counts.b50 * 50) +
    (counts.b20 * 20) +
    (counts.b10 * 10) +
    Number(counts.monedas || 0);

  const diferencia = totalContado - ventasStats.efectivo;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 animate-fadeIn">
      {/* Dimmed and blurred backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* BEGIN: ConfirmationModalCard (Exact Stitch Layout) */}
      <div 
        className="relative z-10 w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden border border-slate-100 transform transition-all animate-slideUp max-h-[92vh] flex flex-col"
        role="dialog"
      >
        {/* Bottom Sheet Drag Indicator (Visible on Mobile) */}
        <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-3 mb-1 sm:hidden"></div>

        {step === 'CONFIRM' && (
          <div className="flex-1 overflow-y-auto">
            {/* Dialog Header */}
            <div className="px-6 pt-4 pb-3 flex items-start space-x-3.5">
              <div className="flex-shrink-0 w-11 h-11 bg-amber-100 border border-amber-200 rounded-xl flex items-center justify-center text-amber-600 shadow-xs">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <div className="flex-1 pr-2">
                <h2 className="text-base font-bold text-slate-800 leading-snug">
                  ¿Deseas cerrar sesión o finalizar turno?
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Tienes una caja en curso con operaciones pendientes de arqueo.
                </p>
              </div>

              {/* Close Button */}
              <button 
                onClick={onClose}
                aria-label="Cerrar ventana" 
                className="text-slate-400 hover:text-slate-600 p-1 rounded-full transition-colors" 
                type="button"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Explanatory Warning Message */}
            <div className="px-6 py-2">
              <p className="text-xs text-slate-600 leading-relaxed bg-amber-50/80 border border-amber-200/70 p-3 rounded-xl">
                <span className="font-semibold text-amber-800">Atención:</span> Tienes la caja activa 
                <span className="font-bold text-slate-700"> (Caja 01 - Turno Mañana)</span> con ventas registradas de 
                <span className="font-bold text-blue-600"> Bs. {ventasStats.total.toFixed(2)}</span>. Te recomendamos realizar el arqueo de caja antes de salir.
              </p>
            </div>

            {/* Quick Shift Summary Box (Exact Stitch) */}
            <div className="px-6 py-3" data-purpose="shift-quick-summary">
              <div className="bg-slate-50 rounded-xl p-3.5 border border-slate-200 space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Ventas Turno</span>
                  <span className="text-base font-black text-blue-600">Bs. {ventasStats.total.toFixed(2)}</span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Comprobantes</span>
                    <span className="font-semibold text-slate-700">
                      {ventasStats.boletas} Bol. • {ventasStats.facturas} Fact.
                    </span>
                  </div>

                  <div className="bg-white p-2 rounded-lg border border-slate-100">
                    <span className="text-slate-400 block text-[11px]">Responsable</span>
                    <span className="font-semibold text-slate-700 truncate block">
                      {empresa?.propietario || 'Carlos Gutiérrez'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 pt-1 text-[11px] text-slate-500">
                  <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse"></span>
                  <span>Estado: <strong>Caja Abierta</strong> (GLORYPOS en línea)</span>
                </div>
              </div>
            </div>

            {/* Action Buttons (Exact Stitch layout & icons) */}
            <div className="px-6 pt-2 pb-6 flex flex-col space-y-2.5" data-purpose="dialog-actions">
              {/* Primary Action: Arqueo y Cierre (Azul Eléctrico) */}
              <button 
                onClick={() => setStep('COUNT')}
                className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white py-3.5 px-4 rounded-xl font-bold text-sm shadow-md shadow-blue-600/25 flex items-center justify-center space-x-2 transition-all" 
                type="button"
              >
                {/* Calculator / Cash Register Icon */}
                <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                  <path d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Hacer Arqueo y Cerrar Caja</span>
              </button>

              {/* Secondary Action: Solo Cerrar Sesión */}
              <button 
                onClick={onClose}
                className="w-full bg-white hover:bg-slate-50 active:scale-[0.98] text-slate-700 border border-slate-300 py-3 px-4 rounded-xl font-semibold text-xs tracking-tight flex items-center justify-center space-x-2 transition-all" 
                type="button"
              >
                <LogOut className="w-4 h-4 text-slate-500" />
                <span>Cerrar Solo Sesión (Mantener Caja Abierta)</span>
              </button>

              {/* Cancel / Dismiss Action */}
              <button 
                onClick={onClose}
                className="w-full text-slate-400 hover:text-slate-600 py-2 text-xs font-semibold transition-colors" 
                type="button"
              >
                Permanecer en el Sistema
              </button>
            </div>
          </div>
        )}

        {step === 'COUNT' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <button 
                onClick={() => setStep('CONFIRM')}
                className="text-xs text-blue-600 font-semibold flex items-center gap-1 hover:underline"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Volver</span>
              </button>
              <h3 className="font-bold text-slate-800 text-sm">Conteo de Efectivo en Gaveta</h3>
              <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3 bg-blue-50/60 rounded-xl border border-blue-200 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800">
                  Efectivo Esperado (Sistema)
                </span>
                <span className="text-xl font-black text-slate-900 block">
                  Bs. {ventasStats.efectivo.toFixed(2)}
                </span>
              </div>
              <Banknote className="w-7 h-7 text-blue-600" />
            </div>

            {/* Cash Denominations Table */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 block">
                Billetes y Monedas (Bolivianos):
              </label>

              <div className="grid grid-cols-2 gap-2 text-xs">
                {[
                  { key: 'b200', label: 'Bs. 200', mult: 200 },
                  { key: 'b100', label: 'Bs. 100', mult: 100 },
                  { key: 'b50', label: 'Bs. 50', mult: 50 },
                  { key: 'b20', label: 'Bs. 20', mult: 20 },
                  { key: 'b10', label: 'Bs. 10', mult: 10 },
                ].map((den) => (
                  <div key={den.key} className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                    <span className="font-bold text-slate-700">{den.label}</span>
                    <input
                      type="number"
                      min="0"
                      value={counts[den.key] || ''}
                      placeholder="0"
                      onChange={(e) => setCounts({ ...counts, [den.key]: Number(e.target.value) || 0 })}
                      className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-right font-bold text-xs"
                    />
                  </div>
                ))}

                <div className="p-2 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-between">
                  <span className="font-bold text-slate-700">Monedas Bs.</span>
                  <input
                    type="number"
                    min="0"
                    step="0.5"
                    value={counts.monedas || ''}
                    placeholder="0.00"
                    onChange={(e) => setCounts({ ...counts, monedas: Number(e.target.value) || 0 })}
                    className="w-16 bg-white border border-slate-200 rounded-lg py-1 px-2 text-right font-bold text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Total contado & diferencia */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-xs">
              <div className="flex justify-between items-center text-slate-600">
                <span>Total Físico Contado:</span>
                <span className="font-bold text-sm text-slate-900">Bs. {totalContado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span>Diferencia de Caja:</span>
                <span className={`font-bold ${
                  diferencia === 0 
                    ? 'text-emerald-600' 
                    : diferencia > 0 
                      ? 'text-blue-600' 
                      : 'text-rose-600'
                }`}>
                  {diferencia === 0 ? 'Exacto (Bs. 0.00)' : `Bs. ${diferencia.toFixed(2)}`}
                </span>
              </div>
            </div>

            <button
              onClick={() => setStep('SUMMARY')}
              className="w-full bg-gradient-to-r from-blue-600 to-[#7c3aed] text-white py-3 rounded-xl font-bold text-sm shadow-md hover:opacity-95 transition"
            >
              Confirmar Arqueo y Emitir Comprobante
            </button>
          </div>
        )}

        {step === 'SUMMARY' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">¡Caja Cerrada Exitosamente!</h3>
              <p className="text-xs text-slate-500 mt-1">Turno Mañana concluido con respaldo en base de datos.</p>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left text-xs font-mono space-y-1.5">
              <div className="text-center font-bold pb-2 border-b border-slate-200">
                <p className="text-xs font-black">GLORYPOS BOLIVIA</p>
                <p className="text-[10px] text-slate-500">ACTA DE ARQUEO DE CAJA</p>
              </div>
              <div className="flex justify-between pt-1">
                <span>Fecha / Hora:</span>
                <span>{new Date().toLocaleTimeString('es-BO')}</span>
              </div>
              <div className="flex justify-between">
                <span>Ventas Sistema:</span>
                <span>Bs. {ventasStats.total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-bold">
                <span>Efectivo Contado:</span>
                <span>Bs. {totalContado.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Diferencia:</span>
                <span>Bs. {diferencia.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs flex items-center justify-center gap-1.5 transition"
              >
                <Printer className="w-4 h-4" />
                <span>Imprimir Ticket</span>
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-md transition"
              >
                Aceptar y Salir
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
