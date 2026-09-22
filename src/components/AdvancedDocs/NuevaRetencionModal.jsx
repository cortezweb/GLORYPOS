import React, { useState } from 'react';
import { X, CheckCircle2, Percent, FileText, AlertCircle, Building2 } from 'lucide-react';

export default function NuevaRetencionModal({ isOpen, onClose, onSave, nextNumber = 2 }) {
  const today = new Date();
  const formattedToday = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

  const [form, setForm] = useState({
    serie: 'R001',
    correlativo: String(nextNumber),
    fecha: formattedToday,
    origen: '',
    proveedor_nombre: '',
    proveedor_doc: '',
    monto_total: '',
    tasa: '3',
    observacion: ''
  });

  const [error, setError] = useState('');

  if (!isOpen) return null;

  const montoTotalNum = parseFloat(form.monto_total) || 0;
  const tasaNum = parseFloat(form.tasa) || 3;
  const montoRetenido = (montoTotalNum * (tasaNum / 100)).toFixed(2);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.proveedor_nombre.trim()) {
      setError('Ingrese la razón social o nombre del proveedor');
      return;
    }
    if (!form.origen.trim()) {
      setError('Ingrese el comprobante de origen (ej. F001-0001234)');
      return;
    }
    if (montoTotalNum <= 0) {
      setError('Ingrese un monto total válido');
      return;
    }

    const newRetencion = {
      id: `ret-${Date.now()}`,
      fecha: form.fecha,
      serie_nro: `${form.serie}-${form.correlativo}`,
      serie: form.serie,
      correlativo: form.correlativo,
      origen: form.origen.trim(),
      proveedor_nombre: form.proveedor_nombre.trim(),
      proveedor_doc: form.proveedor_doc.trim() || '000000',
      retenido: parseFloat(montoRetenido),
      moneda: 'S/',
      tasa_porcentaje: tasaNum,
      monto_total_comprobante: montoTotalNum,
      estado_sunat: 'Aceptado',
      rr: '—',
      observacion: form.observacion || `Retención ${tasaNum}% sobre ${form.origen}`
    };

    onSave(newRetencion);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4 overflow-y-auto animate-fadeIn">
      <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-200 overflow-hidden my-8">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
              %
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Nueva Retención Electrónica</h2>
              <p className="text-xs text-slate-500">Régimen de Retenciones del IGV (SUNAT)</p>
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
                Serie
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
                Doc. Origen Afectado
              </label>
              <input
                type="text"
                value={form.origen}
                onChange={(e) => setForm({ ...form, origen: e.target.value })}
                placeholder="Ej: F001-00004478"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-emerald-700"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Proveedor / Sujeto Retenido
            </label>
            <input
              type="text"
              value={form.proveedor_nombre}
              onChange={(e) => setForm({ ...form, proveedor_nombre: e.target.value })}
              placeholder="Razón Social o Apellidos y Nombres"
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                RUC / N° Doc Proveedor
              </label>
              <input
                type="text"
                value={form.proveedor_doc}
                onChange={(e) => setForm({ ...form, proveedor_doc: e.target.value })}
                placeholder="Ej: 20601234567 o 000000"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Tasa Retención (%)
              </label>
              <select
                value={form.tasa}
                onChange={(e) => setForm({ ...form, tasa: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="3">3% (Tasa General)</option>
                <option value="6">6% (Casos excepcionales)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                Monto Total Factura (S/)
              </label>
              <input
                type="number"
                step="0.01"
                value={form.monto_total}
                onChange={(e) => setForm({ ...form, monto_total: e.target.value })}
                placeholder="0.00"
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-emerald-700 uppercase tracking-wider mb-1">
                Total Retenido Calculado
              </label>
              <div className="w-full px-3 py-2 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800">
                S/ {montoRetenido}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1">
              Observaciones (Opcional)
            </label>
            <input
              type="text"
              value={form.observacion}
              onChange={(e) => setForm({ ...form, observacion: e.target.value })}
              placeholder="Detalle de la retención..."
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
              <span>Emitir Retención</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
