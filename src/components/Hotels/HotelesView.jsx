import React, { useState } from 'react';
import { 
  Building, BedDouble, Calendar, Clock, Users, Plus, 
  CheckCircle2, DollarSign, ArrowRight, Sparkles, Key
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function HotelesView() {
  const { empresa } = useAuth();
  const [selectedPiso, setSelectedPiso] = useState('PISO_1');

  const rooms = [
    { id: '101', tipo: 'Simple Individual', precio: 'Bs. 120/noche', estado: 'OCUPADA', huesped: 'Fernando Siles', salida: 'Hoy 12:00' },
    { id: '102', tipo: 'Doble Matrimonial', precio: 'Bs. 180/noche', estado: 'DISPONIBLE', huesped: null, salida: null },
    { id: '103', tipo: 'Doble Matrimonial', precio: 'Bs. 180/noche', estado: 'LIMPIEZA', huesped: null, salida: null },
    { id: '104', tipo: 'Suite Ejecutiva', precio: 'Bs. 280/noche', estado: 'OCUPADA', huesped: 'Mariana Gomez', salida: 'Mañana 11:00' },
    { id: '201', tipo: 'Doble Twin', precio: 'Bs. 180/noche', estado: 'DISPONIBLE', huesped: null, salida: null },
    { id: '202', tipo: 'Familiar Triple', precio: 'Bs. 250/noche', estado: 'RESERVADA', huesped: 'Carlos Mendez', salida: '24 Sep' }
  ];

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center font-bold">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Recepción & Habitaciones</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">
                Hoteles & Hospedajes
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de check-in, check-out, estado de limpieza y consumos en habitación.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('Abrir formulario de Check-in de Huésped')}
          className="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Check-in</span>
        </button>
      </div>

      {/* Habitaciones Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {rooms.map((room) => (
          <div
            key={room.id}
            onClick={() => alert(`Habitación ${room.id}: ${room.estado}`)}
            className={`rounded-3xl p-5 border transition-all duration-200 cursor-pointer shadow-xs hover:shadow-md flex flex-col justify-between min-h-[160px] ${
              room.estado === 'DISPONIBLE'
                ? 'bg-white border-slate-200 hover:border-emerald-300'
                : room.estado === 'LIMPIEZA'
                ? 'bg-amber-50/40 border-amber-200 hover:border-amber-400'
                : 'bg-sky-50/40 border-sky-200 hover:border-sky-400'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Key className="w-4 h-4 text-slate-400" />
                <span className="text-lg font-black text-slate-900">Hab. {room.id}</span>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                room.estado === 'DISPONIBLE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                room.estado === 'LIMPIEZA' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                'bg-sky-100 text-sky-800 border border-sky-200'
              }`}>
                {room.estado}
              </span>
            </div>

            <div className="my-3 space-y-1">
              <p className="text-xs font-bold text-slate-700">{room.tipo}</p>
              <p className="text-xs text-slate-400">{room.precio}</p>
              {room.huesped && (
                <p className="text-xs font-black text-sky-900 mt-2">
                  👤 {room.huesped} <span className="text-[10px] font-normal text-slate-500 block">Salida: {room.salida}</span>
                </p>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
              <span>{room.huesped ? 'Ocupada' : 'Lista para huésped'}</span>
              <span className="font-bold text-sky-700 hover:underline flex items-center gap-0.5">
                Acciones <ArrowRight className="w-3 h-3" />
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
