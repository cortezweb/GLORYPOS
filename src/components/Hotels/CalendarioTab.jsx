import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays } from 'lucide-react';
import { hoyISO, addDias, noches } from '../../services/hotelService';

const DIAS = 14;
const COLOR = {
  RESERVADA: 'bg-indigo-500 hover:bg-indigo-600',
  EN_CASA: 'bg-sky-600 hover:bg-sky-700',
  FINALIZADA: 'bg-slate-400 hover:bg-slate-500',
};

// Calendario de ocupación (vista tipo "rack" de 14 días)
export default function CalendarioTab({ data, onOpenReserva, onNuevaReserva }) {
  const { habitaciones, reservas, tiposById } = data;
  const [inicio, setInicio] = useState(addDias(hoyISO(), -1));
  const hoy = hoyISO();
  const dias = Array.from({ length: DIAS }, (_, i) => addDias(inicio, i));
  const fin = addDias(inicio, DIAS);
  const visibles = reservas.filter(r => ['RESERVADA', 'EN_CASA', 'FINALIZADA'].includes(r.estado) && r.llegada < fin && inicio < r.salida);
  const cols = `110px repeat(${DIAS}, minmax(42px, 1fr))`;

  const ocupadasPorDia = dias.map(d => visibles.filter(r => r.estado !== 'FINALIZADA' && r.llegada <= d && d < r.salida).length);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => setInicio(addDias(inicio, -7))} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ChevronLeft className="w-4 h-4" /></button>
        <button type="button" onClick={() => setInicio(addDias(hoy, -1))} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-xs font-bold flex items-center gap-1"><CalendarDays className="w-4 h-4" /> Hoy</button>
        <button type="button" onClick={() => setInicio(addDias(inicio, 7))} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ChevronRight className="w-4 h-4" /></button>
        <p className="text-xs text-slate-500 ml-2">Toca un día libre para reservar; toca una barra para abrir la reserva.</p>
        <div className="ml-auto flex gap-2 text-[10px] font-bold">
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-indigo-500 inline-block" /> Reservada</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-sky-600 inline-block" /> En casa</span>
          <span className="flex items-center gap-1"><i className="w-3 h-3 rounded bg-slate-400 inline-block" /> Finalizada</span>
        </div>
      </div>

      <div className="overflow-x-auto">
        <div className="min-w-[760px]">
          <div className="grid border-b border-slate-200" style={{ gridTemplateColumns: cols }}>
            <div className="text-[10px] font-black text-slate-400 uppercase p-1.5">Habitación</div>
            {dias.map((d, i) => {
              const fecha = new Date(`${d}T12:00:00`);
              const finde = fecha.getDay() === 0 || fecha.getDay() === 6;
              return (
                <div key={d} className={`text-center p-1 ${d === hoy ? 'bg-primary-50 text-primary-700' : finde ? 'bg-slate-50' : ''}`}>
                  <p className="text-[9px] uppercase font-bold text-slate-400">{fecha.toLocaleDateString('es-BO', { weekday: 'short' })}</p>
                  <p className="text-xs font-black">{fecha.getDate()}</p>
                  <p className="text-[9px] text-slate-400">{ocupadasPorDia[i]}/{habitaciones.length}</p>
                </div>
              );
            })}
          </div>

          {habitaciones.map(h => (
            <div key={h.id} className="grid border-b border-slate-100 h-11" style={{ gridTemplateColumns: cols }}>
              <div className="p-1.5 flex flex-col justify-center" style={{ gridRow: 1, gridColumn: 1 }}>
                <p className="text-xs font-black text-slate-800 leading-none">{h.numero}</p>
                <p className="text-[9px] text-slate-400 truncate">{tiposById[h.tipo_id]?.nombre}</p>
              </div>
              {dias.map((d, i) => (
                <button
                  key={d}
                  type="button"
                  title={`Reservar ${h.numero} desde ${d}`}
                  onClick={() => onNuevaReserva({ habitacion_id: h.id, llegada: d, salida: addDias(d, 1) })}
                  className={`border-l border-slate-100 hover:bg-primary-50 ${d === hoy ? 'bg-primary-50/40' : ''} ${h.limpieza === 'MANTENIMIENTO' ? 'bg-slate-100' : ''}`}
                  style={{ gridRow: 1, gridColumn: i + 2 }}
                />
              ))}
              {visibles.filter(r => r.habitacion_id === h.id).map(r => {
                const desde = r.llegada < inicio ? inicio : r.llegada;
                const hasta = r.salida > fin ? fin : r.salida;
                const start = dias.indexOf(desde);
                const span = noches(desde, hasta);
                if (start < 0) return null;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => onOpenReserva(r.id)}
                    title={`${r.huesped?.nombre} · ${r.llegada} → ${r.salida}`}
                    className={`relative z-10 my-1.5 mx-0.5 rounded-lg text-white text-[10px] font-bold px-1.5 truncate text-left shadow-sm ${COLOR[r.estado]}`}
                    style={{ gridRow: 1, gridColumn: `${start + 2} / span ${span}` }}
                  >
                    {r.huesped?.nombre}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
