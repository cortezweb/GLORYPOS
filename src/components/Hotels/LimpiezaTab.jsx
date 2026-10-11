import React from 'react';
import { Sparkles, CheckCircle2, Wrench, User } from 'lucide-react';
import { hotelService, hoyISO } from '../../services/hotelService';

const COLUMNAS = [
  { id: 'SUCIA', label: 'Por limpiar', tone: 'border-orange-200 bg-orange-50/40', icon: Sparkles },
  { id: 'MANTENIMIENTO', label: 'Mantenimiento', tone: 'border-slate-300 bg-slate-50', icon: Wrench },
  { id: 'LIMPIA', label: 'Limpias / listas', tone: 'border-emerald-200 bg-emerald-50/30', icon: CheckCircle2 },
];

// Tablero de ama de llaves (housekeeping)
export default function LimpiezaTab({ data }) {
  const { habitaciones, reservas, tiposById } = data;
  const hoy = hoyISO();
  const ocupante = (habId) => reservas.find(r => r.habitacion_id === habId && r.estado === 'EN_CASA');
  const llegaHoy = (habId) => reservas.find(r => r.habitacion_id === habId && r.estado === 'RESERVADA' && r.llegada <= hoy && hoy < r.salida);

  const mantenimiento = (h) => {
    const nota = window.prompt(`Motivo de mantenimiento de la habitación ${h.numero}:`, h.nota || '');
    if (nota !== null) hotelService.setLimpieza(h.id, 'MANTENIMIENTO', nota);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {COLUMNAS.map(col => {
        const Icon = col.icon;
        const habs = habitaciones.filter(h => (h.limpieza || 'LIMPIA') === col.id);
        return (
          <div key={col.id} className={`rounded-3xl border p-3 space-y-2 ${col.tone}`}>
            <h3 className="text-xs font-black text-slate-600 uppercase flex items-center gap-1.5"><Icon className="w-4 h-4" /> {col.label} ({habs.length})</h3>
            {habs.length === 0 && <p className="text-xs text-slate-400 py-2">Ninguna.</p>}
            {habs.map(h => {
              const occ = ocupante(h.id);
              const llega = llegaHoy(h.id);
              return (
                <div key={h.id} className="bg-white rounded-2xl border border-slate-200 p-2.5 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-black text-slate-900">Hab. {h.numero} <span className="text-[10px] font-semibold text-slate-400">· Piso {h.piso} · {tiposById[h.tipo_id]?.nombre}</span></p>
                  </div>
                  {occ && <p className="text-[10px] text-sky-700 flex items-center gap-1"><User className="w-3 h-3" /> Ocupada por {occ.huesped?.nombre}</p>}
                  {!occ && llega && <p className="text-[10px] font-bold text-indigo-700">Prioridad: llega {llega.huesped?.nombre} hoy</p>}
                  {h.nota && col.id !== 'LIMPIA' && <p className="text-[10px] text-slate-500 italic">{h.nota}</p>}
                  <div className="flex gap-1.5 text-[10px] font-bold">
                    {col.id !== 'LIMPIA' && (
                      <button type="button" onClick={() => hotelService.setLimpieza(h.id, 'LIMPIA')} className="px-2 py-1 rounded-lg bg-emerald-600 text-white">Marcar limpia</button>
                    )}
                    {col.id !== 'SUCIA' && (
                      <button type="button" onClick={() => hotelService.setLimpieza(h.id, 'SUCIA')} className="px-2 py-1 rounded-lg bg-orange-100 text-orange-800">Por limpiar</button>
                    )}
                    {col.id !== 'MANTENIMIENTO' && (
                      <button type="button" onClick={() => mantenimiento(h)} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700">Mantenimiento</button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
