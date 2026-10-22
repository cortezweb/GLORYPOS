import React, { useState } from 'react';
import EstadoVacio from '../Common/EstadoVacio';
import { Plus, ShoppingBag, Bike, Globe, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { restaurantService, TIPOS_PEDIDO, totalComanda } from '../../services/restaurantService';
import { money, minutosDesde, formatMinutos } from './useGlorychefData';

export default function PedidosTab({ data, onOpenComanda }) {
  const { currentUser } = useAuth();
  const [form, setForm] = useState({ tipo: 'LLEVAR', cliente_nombre: '', telefono: '', direccion: '' });
  const pedidos = data.comandas.filter(c => c.tipo !== 'MESA');

  const crear = async (e) => {
    e.preventDefault();
    const comanda = await restaurantService.crearComanda({ ...form, mozo: currentUser?.nombre || '' });
    setForm({ tipo: 'LLEVAR', cliente_nombre: '', telefono: '', direccion: '' });
    onOpenComanda(comanda.id);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <form onSubmit={crear} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 h-fit">
        <h3 className="text-sm font-black text-slate-900">Nuevo pedido</h3>
        <div className="flex gap-2">
          {['LLEVAR', 'DELIVERY'].map(t => (
            <button
              key={t}
              type="button"
              onClick={() => setForm(f => ({ ...f, tipo: t }))}
              className={`flex-1 py-2 rounded-xl text-xs font-bold border ${
                form.tipo === t ? 'bg-orange-600 text-white border-orange-600' : 'border-slate-200 text-slate-600'
              }`}
            >
              {TIPOS_PEDIDO[t]}
            </button>
          ))}
        </div>
        <input
          required
          value={form.cliente_nombre}
          onChange={e => setForm(f => ({ ...f, cliente_nombre: e.target.value }))}
          placeholder="Nombre del cliente"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
        />
        <input
          value={form.telefono}
          onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))}
          placeholder="Celular / WhatsApp"
          className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
        />
        {form.tipo === 'DELIVERY' && (
          <input
            required
            value={form.direccion}
            onChange={e => setForm(f => ({ ...f, direccion: e.target.value }))}
            placeholder="Dirección de entrega"
            className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm"
          />
        )}
        <button type="submit" className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5">
          <Plus className="w-4 h-4" /> Crear y tomar pedido
        </button>
      </form>

      <div className="lg:col-span-2 space-y-2">
        {pedidos.length === 0 && (
            <EstadoVacio className="bg-white rounded-3xl border border-dashed border-slate-300" titulo="Sin pedidos abiertos" descripcion="No hay pedidos para llevar o delivery en este momento." />
        )}
        {pedidos.map(c => {
          const Icon = c.origen === 'TIENDA' ? Globe : c.tipo === 'DELIVERY' ? Bike : ShoppingBag;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onOpenComanda(c.id)}
              className="w-full text-left bg-white rounded-2xl border border-slate-200 hover:border-orange-300 p-3 flex items-center gap-3"
            >
              <div className="w-10 h-10 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-slate-800">
                  #{c.numero} · {c.cliente_nombre || 'Cliente'} <span className="text-[10px] font-semibold text-slate-400">{TIPOS_PEDIDO[c.tipo]}{c.origen === 'TIENDA' ? ' · Tienda en línea' : ''}</span>
                </p>
                <p className="text-[11px] text-slate-500 truncate">{c.direccion || c.telefono || '—'}</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-black text-emerald-700">{money(totalComanda(c))}</p>
                <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{formatMinutos(minutosDesde(c.fecha_apertura))}</p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
