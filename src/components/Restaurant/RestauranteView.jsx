import React, { useState } from 'react';
import { 
  UtensilsCrossed, Users, Clock, Plus, CheckCircle2, AlertCircle, 
  Coffee, ShoppingBag, DollarSign, ChefHat, Eye, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function RestauranteView({ onSelectSubView }) {
  const { empresa } = useAuth();
  const [selectedSalon, setSelectedSalon] = useState('PRINCIPAL');

  const mesas = [
    { id: 'M-01', salon: 'PRINCIPAL', comensales: 4, estado: 'OCUPADA', orden: 'Comanda #104', total: 'Bs. 145.00', tiempo: '32 min' },
    { id: 'M-02', salon: 'PRINCIPAL', comensales: 2, estado: 'DISPONIBLE', orden: null, total: null, tiempo: null },
    { id: 'M-03', salon: 'PRINCIPAL', comensales: 6, estado: 'OCUPADA', orden: 'Comanda #108', total: 'Bs. 320.00', tiempo: '15 min' },
    { id: 'M-04', salon: 'PRINCIPAL', comensales: 4, estado: 'CUENTA_PEDIDA', orden: 'Comanda #102', total: 'Bs. 88.00', tiempo: '50 min' },
    { id: 'M-05', salon: 'PRINCIPAL', comensales: 2, estado: 'DISPONIBLE', orden: null, total: null, tiempo: null },
    { id: 'M-06', salon: 'TERRAZA', comensales: 4, estado: 'OCUPADA', orden: 'Comanda #109', total: 'Bs. 210.00', tiempo: '10 min' },
    { id: 'M-07', salon: 'TERRAZA', comensales: 4, estado: 'DISPONIBLE', orden: null, total: null, tiempo: null },
    { id: 'M-08', salon: 'VIP', comensales: 8, estado: 'RESERVADA', orden: null, total: null, tiempo: null },
  ];

  const filteredMesas = mesas.filter(m => selectedSalon === 'TODOS' || m.salon === selectedSalon);

  const getEstadoBadge = (estado) => {
    switch (estado) {
      case 'DISPONIBLE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Libre</span>;
      case 'OCUPADA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Ocupada</span>;
      case 'CUENTA_PEDIDA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200 animate-pulse">Pidiendo Cuenta</span>;
      case 'RESERVADA':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">Reservada</span>;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <UtensilsCrossed className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Control de Mesas & Comandas</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Módulo Gastronómico
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión visual de salones, pedidos a cocina, división de cuentas y delivery.
            </p>
          </div>
        </div>

        {/* Salones filter */}
        <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
          {['PRINCIPAL', 'TERRAZA', 'VIP', 'TODOS'].map((salon) => (
            <button
              key={salon}
              type="button"
              onClick={() => setSelectedSalon(salon)}
              className={`px-3 py-1.5 rounded-xl transition ${
                selectedSalon === salon
                  ? 'bg-white text-amber-800 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {salon}
            </button>
          ))}
        </div>
      </div>

      {/* Mesas Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {filteredMesas.map((mesa) => (
          <div
            key={mesa.id}
            onClick={() => alert(`Mesa ${mesa.id}: Estado actual ${mesa.estado}`)}
            className={`rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[160px] ${
              mesa.estado === 'DISPONIBLE'
                ? 'bg-white border-slate-200 hover:border-emerald-300'
                : mesa.estado === 'CUENTA_PEDIDA'
                ? 'bg-rose-50/40 border-rose-200 hover:border-rose-400'
                : 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-lg font-black text-slate-900">{mesa.id}</span>
              {getEstadoBadge(mesa.estado)}
            </div>

            <div className="my-3 space-y-1">
              {mesa.orden ? (
                <>
                  <p className="text-xs font-bold text-slate-800">{mesa.orden}</p>
                  <p className="text-base font-black text-emerald-700">{mesa.total}</p>
                  <p className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    <span>Tiempo: {mesa.tiempo}</span>
                  </p>
                </>
              ) : (
                <div className="py-2 text-center">
                  <span className="text-xs text-slate-400 font-medium">Mesa disponible para abrir comanda</span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1 font-medium">
                <Users className="w-3.5 h-3.5 text-slate-400" />
                {mesa.comensales} personas
              </span>
              <span className="font-bold text-amber-700 hover:underline flex items-center gap-0.5">
                Ver detalle <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
