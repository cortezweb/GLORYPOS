import React, { useMemo, useState } from 'react';
import EstadoVacio from '../Common/EstadoVacio';
import { Search } from 'lucide-react';
import { RESERVA_ESTADOS, formatFecha, folio, hoyISO } from '../../services/hotelService';
import { money } from './useHotelData';

const FILTROS = [
  { id: 'PROXIMAS', label: 'Próximas', test: (r, hoy) => r.estado === 'RESERVADA' && r.salida > hoy },
  { id: 'EN_CASA', label: 'En casa', test: r => r.estado === 'EN_CASA' },
  { id: 'FINALIZADA', label: 'Finalizadas', test: r => r.estado === 'FINALIZADA' },
  { id: 'CANCELADAS', label: 'Canceladas / no show', test: r => r.estado === 'CANCELADA' || r.estado === 'NO_SHOW' },
  { id: 'TODAS', label: 'Todas', test: () => true },
];

export default function ReservasTab({ data, onOpenReserva }) {
  const { reservas, habById, tiposById } = data;
  const [filtro, setFiltro] = useState('PROXIMAS');
  const [q, setQ] = useState('');
  const hoy = hoyISO();

  const lista = useMemo(() => {
    const f = FILTROS.find(x => x.id === filtro);
    const t = q.trim().toLowerCase();
    return reservas
      .filter(r => f.test(r, hoy))
      .filter(r => !t || r.huesped?.nombre?.toLowerCase().includes(t) || r.codigo?.toLowerCase().includes(t) || String(r.huesped?.documento || '').includes(t))
      .sort((a, b) => (filtro === 'FINALIZADA' ? b.llegada.localeCompare(a.llegada) : a.llegada.localeCompare(b.llegada)));
  }, [reservas, filtro, q, hoy]);

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {FILTROS.map(f => (
          <button key={f.id} type="button" onClick={() => setFiltro(f.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filtro === f.id ? 'bg-sky-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {f.label} ({reservas.filter(r => f.test(r, hoy)).length})
          </button>
        ))}
        <div className="relative ml-auto w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Huésped, código o documento" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
            <tr>
              <th className="text-left px-3 py-2">Código</th>
              <th className="text-left px-3 py-2">Huésped</th>
              <th className="text-left px-3 py-2">Habitación</th>
              <th className="text-left px-3 py-2">Llegada → salida</th>
              <th className="text-left px-3 py-2">Canal</th>
              <th className="text-left px-3 py-2">Estado</th>
              <th className="text-right px-3 py-2">Total</th>
              <th className="text-right px-3 py-2">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(r => {
              const f = folio(r);
              const hab = habById[r.habitacion_id];
              return (
                <tr key={r.id} onClick={() => onOpenReserva(r.id)} className="border-t border-slate-100 hover:bg-sky-50/40 cursor-pointer">
                  <td className="px-3 py-2 font-mono font-bold text-slate-700">{r.codigo}</td>
                  <td className="px-3 py-2">
                    <p className="font-bold text-slate-800">{r.huesped?.nombre}</p>
                    <p className="text-[10px] text-slate-400">{r.huesped?.tipo_doc} {r.huesped?.documento}</p>
                  </td>
                  <td className="px-3 py-2">{hab?.numero} <span className="text-slate-400">· {tiposById[hab?.tipo_id]?.nombre}</span></td>
                  <td className="px-3 py-2">{formatFecha(r.llegada)} → {formatFecha(r.salida)} <span className="text-slate-400">({f.noches}n)</span></td>
                  <td className="px-3 py-2">{r.canal}</td>
                  <td className="px-3 py-2 font-bold">{RESERVA_ESTADOS[r.estado]}</td>
                  <td className="px-3 py-2 text-right">{money(f.total)}</td>
                  <td className={`px-3 py-2 text-right font-bold ${f.saldo > 0 && r.estado !== 'CANCELADA' && r.estado !== 'NO_SHOW' ? 'text-rose-600' : 'text-slate-400'}`}>{money(f.saldo)}</td>
                </tr>
              );
            })}
            {lista.length === 0 && (
              <tr><td colSpan="8"><EstadoVacio titulo="No hay reservas" descripcion="No hay reservas con este filtro." /></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
