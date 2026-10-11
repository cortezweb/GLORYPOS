import React, { useMemo, useState } from 'react';
import { Search, Download } from 'lucide-react';
import { formatFecha, folio } from '../../services/hotelService';
import { money } from './useHotelData';

// Libro de huéspedes / registro de pasajeros (exportable a CSV)
export default function HuespedesTab({ data, onOpenReserva }) {
  const { reservas, habById } = data;
  const [q, setQ] = useState('');
  const [mes, setMes] = useState(new Date().toISOString().slice(0, 7));

  const registro = useMemo(() => {
    const t = q.trim().toLowerCase();
    return reservas
      .filter(r => r.checkin_at && (r.estado === 'EN_CASA' || r.estado === 'FINALIZADA'))
      .filter(r => !mes || r.llegada.startsWith(mes) || (r.salida_real || r.salida).startsWith(mes))
      .filter(r => !t || r.huesped?.nombre?.toLowerCase().includes(t) || String(r.huesped?.documento || '').includes(t))
      .sort((a, b) => b.checkin_at.localeCompare(a.checkin_at));
  }, [reservas, q, mes]);

  const exportar = () => {
    const cab = ['Codigo', 'Huesped', 'Tipo doc', 'Documento', 'Nacionalidad', 'Telefono', 'Habitacion', 'Check-in', 'Check-out', 'Noches', 'Personas', 'Total Bs'];
    const filas = registro.map(r => [
      r.codigo, r.huesped?.nombre, r.huesped?.tipo_doc, r.huesped?.documento, r.huesped?.nacionalidad, r.huesped?.telefono,
      habById[r.habitacion_id]?.numero, r.checkin_at?.slice(0, 16).replace('T', ' '), r.checkout_at?.slice(0, 16).replace('T', ' ') || '',
      folio(r).noches, (Number(r.adultos) || 0) + (Number(r.ninos) || 0), folio(r).total.toFixed(2),
    ]);
    const csv = [cab, ...filas].map(f => f.map(v => `"${String(v ?? '').replace(/"/g, '""')}"`).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `libro-huespedes-${mes || 'todo'}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-black text-slate-900">Libro de huéspedes</h3>
        <input type="month" value={mes} onChange={e => setMes(e.target.value)} className="border border-slate-200 rounded-xl px-2 py-1.5 text-xs" />
        <div className="relative w-full sm:w-60">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input value={q} onChange={e => setQ(e.target.value)} placeholder="Nombre o documento" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs" />
        </div>
        <button type="button" onClick={exportar} disabled={registro.length === 0} className="ml-auto px-3 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-40">
          <Download className="w-4 h-4" /> Exportar CSV
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-xs min-w-[720px]">
          <thead className="bg-slate-50 text-[10px] text-slate-500 uppercase">
            <tr>
              <th className="text-left px-3 py-2">Huésped</th>
              <th className="text-left px-3 py-2">Documento</th>
              <th className="text-left px-3 py-2">Nacionalidad</th>
              <th className="text-left px-3 py-2">Hab.</th>
              <th className="text-left px-3 py-2">Ingreso</th>
              <th className="text-left px-3 py-2">Salida</th>
              <th className="text-right px-3 py-2">Total</th>
            </tr>
          </thead>
          <tbody>
            {registro.map(r => (
              <tr key={r.id} onClick={() => onOpenReserva(r.id)} className="border-t border-slate-100 hover:bg-sky-50/40 cursor-pointer">
                <td className="px-3 py-2 font-bold text-slate-800">{r.huesped?.nombre}</td>
                <td className="px-3 py-2">{r.huesped?.tipo_doc} {r.huesped?.documento}</td>
                <td className="px-3 py-2">{r.huesped?.nacionalidad}</td>
                <td className="px-3 py-2">{habById[r.habitacion_id]?.numero}</td>
                <td className="px-3 py-2">{formatFecha(r.llegada)}</td>
                <td className="px-3 py-2">{r.estado === 'EN_CASA' ? <span className="font-bold text-sky-700">En casa</span> : formatFecha(r.salida_real || r.salida)}</td>
                <td className="px-3 py-2 text-right">{money(folio(r).total)}</td>
              </tr>
            ))}
            {registro.length === 0 && (
              <tr><td colSpan="7" className="px-3 py-8 text-center text-slate-400">Sin huéspedes registrados en este periodo.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
