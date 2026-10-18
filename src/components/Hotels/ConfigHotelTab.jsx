import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { hotelService } from '../../services/hotelService';
import { money } from './useHotelData';
import { toast } from 'sonner';

const input = 'border border-slate-200 rounded-xl px-2 py-1.5 text-xs';

// Tipos de habitación (tarifas) y habitaciones del hotel
export default function ConfigHotelTab({ data }) {
  const { tipos, habitaciones, tiposById } = data;
  const [nuevoTipo, setNuevoTipo] = useState({ nombre: '', capacidad: 2, tarifa: '' });
  const [nuevaHab, setNuevaHab] = useState({ numero: '', piso: 1, tipo_id: '' });

  const run = async (fn) => {
    try { await fn(); } catch (err) { toast.error(err.message); }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-black text-slate-900">Tipos de habitación y tarifas</h3>
        <table className="w-full text-xs">
          <thead className="text-[10px] text-slate-400 uppercase"><tr><th className="text-left py-1">Tipo</th><th className="text-right py-1">Capacidad</th><th className="text-right py-1">Tarifa / noche</th><th className="text-right py-1">Hab.</th><th /></tr></thead>
          <tbody>
            {tipos.map(t => (
              <tr key={t.id} className="border-t border-slate-100">
                <td className="py-1.5">
                  <input defaultValue={t.nombre} onBlur={e => e.target.value.trim() !== t.nombre && run(() => hotelService.saveTipo({ ...t, nombre: e.target.value.trim() }))} className={`${input} w-full font-bold`} />
                </td>
                <td className="py-1.5 text-right">
                  <input type="number" min="1" defaultValue={t.capacidad} onBlur={e => Number(e.target.value) !== t.capacidad && run(() => hotelService.saveTipo({ ...t, capacidad: Number(e.target.value) || 1 }))} className={`${input} w-16 text-right`} />
                </td>
                <td className="py-1.5 text-right">
                  <input type="number" min="0" step="0.01" defaultValue={t.tarifa} onBlur={e => Number(e.target.value) !== t.tarifa && run(() => hotelService.saveTipo({ ...t, tarifa: Number(e.target.value) || 0 }))} className={`${input} w-24 text-right`} />
                </td>
                <td className="py-1.5 text-right text-slate-500">{habitaciones.filter(h => h.tipo_id === t.id).length}</td>
                <td className="py-1.5 text-right">
                  <button type="button" onClick={() => window.confirm(`¿Eliminar el tipo ${t.nombre}?`) && run(() => hotelService.deleteTipo(t.id))} className="p-1 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <form
          onSubmit={e => { e.preventDefault(); run(async () => { await hotelService.saveTipo({ ...nuevoTipo, capacidad: Number(nuevoTipo.capacidad), tarifa: Number(nuevoTipo.tarifa) }); setNuevoTipo({ nombre: '', capacidad: 2, tarifa: '' }); }); }}
          className="flex flex-wrap gap-2 items-center"
        >
          <input required value={nuevoTipo.nombre} onChange={e => setNuevoTipo(s => ({ ...s, nombre: e.target.value }))} placeholder="Nuevo tipo (ej. Suite Presidencial)" className={`${input} flex-1 min-w-[160px]`} />
          <input type="number" min="1" value={nuevoTipo.capacidad} onChange={e => setNuevoTipo(s => ({ ...s, capacidad: e.target.value }))} className={`${input} w-16`} title="Capacidad" />
          <input type="number" min="0" step="0.01" required value={nuevoTipo.tarifa} onChange={e => setNuevoTipo(s => ({ ...s, tarifa: e.target.value }))} placeholder="Tarifa" className={`${input} w-24`} />
          <button type="submit" className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1"><Plus className="w-3.5 h-3.5" /> Agregar</button>
        </form>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
        <h3 className="text-sm font-black text-slate-900">Habitaciones ({habitaciones.length})</h3>
        <div className="max-h-[420px] overflow-y-auto">
          <table className="w-full text-xs">
            <thead className="text-[10px] text-slate-400 uppercase"><tr><th className="text-left py-1">N.º</th><th className="text-left py-1">Piso</th><th className="text-left py-1">Tipo</th><th className="text-right py-1">Tarifa</th><th /></tr></thead>
            <tbody>
              {habitaciones.map(h => (
                <tr key={h.id} className="border-t border-slate-100">
                  <td className="py-1.5 font-black">{h.numero}</td>
                  <td className="py-1.5">
                    <input type="number" min="0" defaultValue={h.piso} onBlur={e => Number(e.target.value) !== h.piso && run(() => hotelService.saveHabitacion({ ...h, piso: Number(e.target.value) || 0 }))} className={`${input} w-14`} />
                  </td>
                  <td className="py-1.5">
                    <select value={h.tipo_id} onChange={e => run(() => hotelService.saveHabitacion({ ...h, tipo_id: e.target.value }))} className={input}>
                      {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                    </select>
                  </td>
                  <td className="py-1.5 text-right text-slate-500">{money(tiposById[h.tipo_id]?.tarifa)}</td>
                  <td className="py-1.5 text-right">
                    <button type="button" onClick={() => window.confirm(`¿Eliminar la habitación ${h.numero}?`) && run(() => hotelService.deleteHabitacion(h.id))} className="p-1 text-rose-500"><Trash2 className="w-3.5 h-3.5" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <form
          onSubmit={e => { e.preventDefault(); run(async () => { await hotelService.saveHabitacion({ ...nuevaHab, piso: Number(nuevaHab.piso), tipo_id: nuevaHab.tipo_id || tipos[0]?.id }); setNuevaHab(s => ({ ...s, numero: '' })); }); }}
          className="flex flex-wrap gap-2 items-center"
        >
          <input required value={nuevaHab.numero} onChange={e => setNuevaHab(s => ({ ...s, numero: e.target.value }))} placeholder="N.º (ej. 305)" className={`${input} w-24`} />
          <input type="number" min="0" value={nuevaHab.piso} onChange={e => setNuevaHab(s => ({ ...s, piso: e.target.value }))} className={`${input} w-16`} title="Piso" />
          <select value={nuevaHab.tipo_id} onChange={e => setNuevaHab(s => ({ ...s, tipo_id: e.target.value }))} className={`${input} flex-1`}>
            <option value="">Tipo...</option>
            {tipos.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
          </select>
          <button type="submit" disabled={tipos.length === 0} className="px-3 py-1.5 rounded-xl bg-sky-600 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-40"><Save className="w-3.5 h-3.5" /> Agregar</button>
        </form>
      </div>
    </div>
  );
}
