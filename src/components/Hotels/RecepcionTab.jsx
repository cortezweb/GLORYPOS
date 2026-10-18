import React, { useMemo, useState } from 'react';
import { LogIn, LogOut, User, Moon, BedDouble, Percent, Sparkles, Wrench } from 'lucide-react';
import { hotelService, HAB_ESTADOS, hoyISO, addDias, formatFecha, folio } from '../../services/hotelService';
import { money } from './useHotelData';
import { toast } from 'sonner';

export default function RecepcionTab({ data, onOpenReserva, onNuevaReserva }) {
  const { habitaciones, reservas, tiposById, habById } = data;
  const [piso, setPiso] = useState('TODOS');
  const hoy = hoyISO();

  const estados = useMemo(
    () => Object.fromEntries(habitaciones.map(h => [h.id, hotelService.estadoHabitacion(h, reservas, hoy)])),
    [habitaciones, reservas, hoy]
  );

  const pisos = [...new Set(habitaciones.map(h => h.piso))].sort((a, b) => a - b);
  const enCasa = reservas.filter(r => r.estado === 'EN_CASA');
  const llegadas = reservas.filter(r => r.estado === 'RESERVADA' && r.llegada <= hoy && hoy < r.salida);
  const salidas = enCasa.filter(r => r.salida <= hoy);
  const porLimpiar = habitaciones.filter(h => h.limpieza === 'SUCIA').length;
  const vendibles = habitaciones.filter(h => h.limpieza !== 'MANTENIMIENTO').length || 1;
  const ocupacion = Math.round((enCasa.length / vendibles) * 100);

  const kpis = [
    { label: 'Ocupación hoy', value: `${ocupacion}%`, icon: Percent, tone: 'text-sky-700' },
    { label: 'Huéspedes en casa', value: enCasa.length, icon: User, tone: 'text-slate-900' },
    { label: 'Llegadas pendientes', value: llegadas.length, icon: LogIn, tone: 'text-indigo-700' },
    { label: 'Salidas de hoy', value: salidas.length, icon: LogOut, tone: 'text-amber-700' },
    { label: 'Por limpiar', value: porLimpiar, icon: Sparkles, tone: 'text-orange-700' },
  ];

  const checkIn = async (r) => {
    try {
      await hotelService.checkIn(r.id);
      onOpenReserva(r.id);
    } catch (err) {
      toast.error(err.message);
    }
  };

  const clickHab = (hab) => {
    const { reserva } = estados[hab.id];
    if (reserva) return onOpenReserva(reserva.id);
    if (hab.limpieza === 'MANTENIMIENTO') return toast.error(`Habitación ${hab.numero} en mantenimiento: ${hab.nota || 'sin nota'}`);
    onNuevaReserva({ walkin: true, habitacion_id: hab.id, llegada: hoy, salida: addDias(hoy, 1) });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map(k => {
          const Icon = k.icon;
          return (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-3 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-slate-50 flex items-center justify-center"><Icon className={`w-4 h-4 ${k.tone}`} /></div>
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p>
                <p className={`text-lg font-black ${k.tone}`}>{k.value}</p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {['TODOS', ...pisos].map(p => (
              <button
                key={p}
                type="button"
                onClick={() => setPiso(p)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${piso === p ? 'bg-sky-600 text-white border-sky-600' : 'bg-white text-slate-600 border-slate-200'}`}
              >
                {p === 'TODOS' ? 'Todos los pisos' : `Piso ${p}`}
              </button>
            ))}
            <div className="ml-auto hidden md:flex flex-wrap gap-1.5">
              {Object.entries(HAB_ESTADOS).map(([k, v]) => (
                <span key={k} className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${v.badge}`}>{v.label}</span>
              ))}
            </div>
          </div>

          {(piso === 'TODOS' ? pisos : [piso]).map(p => (
            <div key={p}>
              <p className="text-[11px] font-black text-slate-400 uppercase mb-1.5">Piso {p}</p>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {habitaciones.filter(h => h.piso === p).map(h => {
                  const { estado, reserva } = estados[h.id];
                  const ui = HAB_ESTADOS[estado];
                  const tipo = tiposById[h.tipo_id];
                  const f = reserva ? folio(reserva) : null;
                  return (
                    <button
                      key={h.id}
                      type="button"
                      onClick={() => clickHab(h)}
                      className={`text-left rounded-2xl border p-3.5 min-h-[140px] flex flex-col justify-between transition hover:shadow-md ${ui.card}`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-lg font-black text-slate-900 leading-none">{h.numero}</p>
                          <p className="text-[10px] text-slate-500 mt-0.5">{tipo?.nombre || 'Sin tipo'}</p>
                        </div>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full border whitespace-nowrap ${ui.badge}`}>{ui.label}</span>
                      </div>
                      {reserva ? (
                        <div className="mt-2 space-y-0.5">
                          <p className="text-xs font-bold text-slate-800 truncate flex items-center gap-1"><User className="w-3 h-3" />{reserva.huesped?.nombre}</p>
                          <p className="text-[10px] text-slate-500 flex items-center gap-1"><Moon className="w-3 h-3" />{formatFecha(reserva.llegada)} → {formatFecha(reserva.salida)}</p>
                          {estado !== 'RESERVADA' && f.saldo > 0 && <p className="text-[10px] font-bold text-rose-600">Saldo {money(f.saldo)}</p>}
                        </div>
                      ) : estado === 'MANTENIMIENTO' ? (
                        <p className="text-[10px] text-slate-500 mt-2 flex items-center gap-1"><Wrench className="w-3 h-3" />{h.nota || 'En mantenimiento'}</p>
                      ) : (
                        <p className="text-[10px] text-slate-400 mt-2 flex items-center gap-1"><BedDouble className="w-3 h-3" />{money(tipo?.tarifa)} / noche · {tipo?.capacidad || 1} pers.</p>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
          {habitaciones.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
              Aún no hay habitaciones. Créalas en la pestaña Configuración.
            </div>
          )}
        </div>

        <div className="space-y-3">
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5"><LogIn className="w-4 h-4 text-indigo-500" /> Llegadas ({llegadas.length})</h3>
            {llegadas.length === 0 && <p className="text-xs text-slate-400">Sin llegadas pendientes.</p>}
            <div className="space-y-1.5">
              {llegadas.map(r => (
                <div key={r.id} className="border border-slate-100 rounded-xl p-2 flex items-center gap-2">
                  <button type="button" onClick={() => onOpenReserva(r.id)} className="flex-1 text-left min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{r.huesped?.nombre}</p>
                    <p className="text-[10px] text-slate-500">Hab. {habById[r.habitacion_id]?.numero} · {r.adultos + (r.ninos || 0)} pers. · {r.canal}</p>
                  </button>
                  <button type="button" onClick={() => checkIn(r)} className="px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-bold">Check-in</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white rounded-2xl border border-slate-200 p-3">
            <h3 className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5"><LogOut className="w-4 h-4 text-amber-500" /> Salidas de hoy ({salidas.length})</h3>
            {salidas.length === 0 && <p className="text-xs text-slate-400">Sin salidas pendientes.</p>}
            <div className="space-y-1.5">
              {salidas.map(r => (
                <button key={r.id} type="button" onClick={() => onOpenReserva(r.id)} className="w-full text-left border border-slate-100 rounded-xl p-2">
                  <p className="text-xs font-bold text-slate-800 truncate">{r.huesped?.nombre}</p>
                  <p className="text-[10px] text-slate-500">Hab. {habById[r.habitacion_id]?.numero} · Saldo {money(folio(r).saldo)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
