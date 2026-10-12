import React, { useState } from 'react';
import { Users, Clock, X, CalendarClock, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { restaurantService, totalComanda } from '../../services/restaurantService';
import { minutosDesde, formatMinutos, money } from './useGlorychefData';

const ESTADO_UI = {
  LIBRE: { label: 'Libre', card: 'bg-white border-slate-200 hover:border-emerald-300', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  OCUPADA: { label: 'Ocupada', card: 'bg-amber-50/40 border-amber-200 hover:border-amber-400', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  CUENTA: { label: 'Pidiendo cuenta', card: 'bg-rose-50/40 border-rose-200 hover:border-rose-400', badge: 'bg-rose-50 text-rose-700 border-rose-200 animate-pulse' },
  RESERVADA: { label: 'Reservada', card: 'bg-indigo-50/40 border-indigo-200 hover:border-indigo-400', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
};

export default function MesasTab({ data, onOpenComanda }) {
  const { currentUser, usuarios } = useAuth();
  const { salones, mesas, comandasById } = data;
  const [salonId, setSalonId] = useState('TODOS');
  const [mesaParaAbrir, setMesaParaAbrir] = useState(null);
  const [form, setForm] = useState({ mozo: '', comensales: 2 });

  const visibles = mesas.filter(m => salonId === 'TODOS' || m.salon_id === salonId);

  const handleClickMesa = (mesa) => {
    if (mesa.comanda_id) {
      onOpenComanda(mesa.comanda_id);
      return;
    }
    setForm({ mozo: currentUser?.nombre || '', comensales: Math.min(2, mesa.capacidad || 2) });
    setMesaParaAbrir(mesa);
  };

  const handleAbrir = async (e) => {
    e.preventDefault();
    const comanda = await restaurantService.abrirMesa(mesaParaAbrir, form);
    setMesaParaAbrir(null);
    onOpenComanda(comanda.id);
  };

  const toggleReserva = async () => {
    await restaurantService.setReserva(mesaParaAbrir.id, mesaParaAbrir.estado !== 'RESERVADA');
    setMesaParaAbrir(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2 text-xs font-bold">
        {[{ id: 'TODOS', nombre: 'Todos' }, ...salones].map(s => (
          <button
            key={s.id}
            type="button"
            onClick={() => setSalonId(s.id)}
            className={`px-3 py-1.5 rounded-xl border transition ${
              salonId === s.id ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-200 hover:text-slate-900'
            }`}
          >
            {s.nombre}
          </button>
        ))}
      </div>

      {visibles.length === 0 && (
        <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-8 text-center text-xs text-slate-500">
          No hay mesas en este salón. Créalas en la pestaña Configuración.
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-3">
        {visibles.map(mesa => {
          const comanda = mesa.comanda_id ? comandasById[mesa.comanda_id] : null;
          const ui = ESTADO_UI[mesa.estado] || ESTADO_UI.LIBRE;
          const min = minutosDesde(comanda?.fecha_apertura);
          const listos = comanda?.items?.filter(it => it.estado === 'LISTO').length || 0;
          const salon = salones.find(s => s.id === mesa.salon_id);
          return (
            <button
              key={mesa.id}
              type="button"
              onClick={() => handleClickMesa(mesa)}
              className={`text-left rounded-3xl p-4 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between min-h-[150px] ${ui.card}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-lg font-black text-slate-900">Mesa {mesa.numero}</span>
                  <p className="text-[10px] text-slate-400 font-semibold">{salon?.nombre}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${ui.badge}`}>{ui.label}</span>
              </div>

              {comanda ? (
                <div className="my-2 space-y-0.5">
                  <p className="text-xs font-bold text-slate-800">Comanda #{comanda.numero} · {comanda.mozo || 'Sin mozo'}</p>
                  <p className="text-base font-black text-emerald-700">{money(totalComanda(comanda))}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatMinutos(min)}
                  </p>
                  {listos > 0 && (
                    <p className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-0.5 inline-block">
                      {listos} plato(s) listos para servir
                    </p>
                  )}
                </div>
              ) : (
                <p className="my-3 text-xs text-slate-400 font-medium">
                  {mesa.estado === 'RESERVADA' ? 'Reservada' : 'Toca para abrir comanda'}
                </p>
              )}

              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1">
                  <Users className="w-3.5 h-3.5" /> {comanda ? comanda.comensales : mesa.capacidad} pers.
                </span>
                <span className="font-bold text-orange-700 flex items-center gap-0.5">
                  {comanda ? 'Ver comanda' : 'Abrir'} <ArrowRight className="w-3 h-3" />
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {mesaParaAbrir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setMesaParaAbrir(null)} />
          <form onSubmit={handleAbrir} className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Abrir Mesa {mesaParaAbrir.numero}</h3>
              <button type="button" onClick={() => setMesaParaAbrir(null)} className="p-1 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>
            <label className="block text-xs font-bold text-slate-600">
              Mozo / Mesero
              <input
                list="glorychef-mozos"
                value={form.mozo}
                onChange={e => setForm(f => ({ ...f, mozo: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
                placeholder="Nombre del mozo"
              />
              <datalist id="glorychef-mozos">
                {(usuarios || []).map(u => <option key={u.id} value={u.nombre} />)}
              </datalist>
            </label>
            <label className="block text-xs font-bold text-slate-600">
              Comensales
              <input
                type="number"
                min="1"
                value={form.comensales}
                onChange={e => setForm(f => ({ ...f, comensales: e.target.value }))}
                className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={toggleReserva} className="flex-1 py-2.5 rounded-xl border border-indigo-200 text-indigo-700 text-xs font-bold flex items-center justify-center gap-1">
                <CalendarClock className="w-4 h-4" />
                {mesaParaAbrir.estado === 'RESERVADA' ? 'Quitar reserva' : 'Reservar'}
              </button>
              <button type="submit" className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold">
                Abrir comanda
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
