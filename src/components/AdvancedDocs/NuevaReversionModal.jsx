import React, { useState } from 'react';
import { X, CheckCircle2, RotateCcw, AlertCircle } from 'lucide-react';

export default function NuevaReversionModal({ isOpen, onClose, onSave, nextNumber = 1 }) {
  const today = new Date();
  const formattedToday = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [form, setForm] = useState({
    serie: 'RR01',
    correlativo: String(nextNumber),
    fecha: formattedToday,
    origen: '',
    sujeto_nombre: '',
    sujeto_doc: '',
    motivo: 'Anulación de la operación',
    monto: '',
    observacion: ''
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const montoNum = parseFloat(form.monto) || 0;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.sujeto_nombre.trim()) {
      setError('Ingrese la razón social o nombre del sujeto / proveedor');
      return;
    }
    if (!form.origen.trim()) {
      setError('Ingrese el comprobante que se revierte (ej. R001-1)');
      return;
    }
    if (montoNum <= 0) {
      setError('Ingrese un monto revertido válido');
      return;
    }

    const newReversion = {
      id: `rev-${Date.now()}`,
      fecha: form.fecha,
      serie_nro: `${form.serie}-${form.correlativo}`,
      serie: form.serie,
      correlativo: form.correlativo,
      origen: form.origen.trim(),
      sujeto_nombre: form.sujeto_nombre.trim(),
      sujeto_doc: form.sujeto_doc.trim() || '000000',
      monto: montoNum,
      motivo: form.motivo,
      moneda: 'S/',
      estado_sunat: 'Aceptado',
      rr: '—',
      observacion: form.observacion || `Reversión por ${form.motivo}`
    };

    onSave(newReversion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Nueva Reversión Electrónica</h2>
              <p className="text-xs text-slate-500">Comprobante de Reversión de Retención / Percepción</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Serie Reversión
              </label>
              <input
                type="text"
                value={form.serie}
                onChange={(e) => setForm({ ...form, serie: e.target.value.toUpperCase() })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Correlativo
              </label>
              <input
                type="text"
                value={form.correlativo}
                onChange={(e) => setForm({ ...form, correlativo: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Fecha Emisión
              </label>
              <input
                type="text"
                value={form.fecha}
                onChange={(e) => setForm({ ...form, fecha: e.target.value })}
                placeholder="dd/mm/aaaa"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Doc. Afectado / Revertido
              </label>
              <input
                type="text"
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
                placeholder="Ej: R001-1 o P001-1"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Proveedor / Cliente Afectado
            </label>
            <input
              type="text"
              value={form.sujeto_nombre}
              onChange={(e) => setForm({ ...form, sujeto_nombre: e.target.value })}
              placeholder="Razón Social o Nombre"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                RUC / N° Documento
              </label>
              <input
                type="text"
                value={form.sujeto_doc}
                onChange={(e) => setForm({ ...form, sujeto_doc: e.target.value })}
                placeholder="Ej: 20100012345"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Monto Revertido (S/)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Motivo de la Reversión
            </label>
            <select
              value={form.motivo}
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Anulación de la operación">Anulación de la operación</option>
              <option value="Error en el monto retenido/percibido">Error en el monto retenido/percibido</option>
              <option value="Devolución o rescisión contractual">Devolución o rescisión contractual</option>
              <option value="Corrección de datos del sujeto">Corrección de datos del sujeto</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              placeholder="Detalle de justificación..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Emitir Reversión</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
