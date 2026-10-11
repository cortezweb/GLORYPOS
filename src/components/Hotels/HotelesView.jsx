import React, { useState } from 'react';
import {
  BedDouble, LayoutGrid, CalendarRange, ClipboardList, Sparkles, Users, BarChart3, Settings, Plus
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { hotelService } from '../../services/hotelService';
import { useHotelData } from './useHotelData';
import RecepcionTab from './RecepcionTab';
import CalendarioTab from './CalendarioTab';
import ReservasTab from './ReservasTab';
import LimpiezaTab from './LimpiezaTab';
import HuespedesTab from './HuespedesTab';
import ReportesHotelTab from './ReportesHotelTab';
import ConfigHotelTab from './ConfigHotelTab';
import ReservaModal from './ReservaModal';
import EstadiaPanel from './EstadiaPanel';

export const HOTEL_TABS = [
  { id: 'hotel_recepcion', aliases: ['hoteles', 'hotel_recepcion'], label: 'Recepción', icon: LayoutGrid },
  { id: 'hotel_calendario', aliases: ['hotel_calendario'], label: 'Calendario', icon: CalendarRange },
  { id: 'hotel_reservas', aliases: ['hotel_reservas'], label: 'Reservas', icon: ClipboardList },
  { id: 'hotel_limpieza', aliases: ['hotel_limpieza'], label: 'Limpieza', icon: Sparkles },
  { id: 'hotel_huespedes', aliases: ['hotel_huespedes'], label: 'Huéspedes', icon: Users },
  { id: 'hotel_reportes', aliases: ['hotel_reportes'], label: 'Reportes', icon: BarChart3 },
  { id: 'hotel_config', aliases: ['hotel_config'], label: 'Configuración', icon: Settings },
];

// Módulo Hoteles & Hospedajes de GLORYPOS
export default function HotelesView({ currentView = 'hotel_recepcion', onSelectSubView, onOpenCheckout }) {
  const tab = HOTEL_TABS.find(t => t.aliases.includes(currentView))?.id || 'hotel_recepcion';
  const data = useHotelData();
  const { loadItems } = useCart();
  const [reservaForm, setReservaForm] = useState(null); // {} nueva | {habitacion_id, llegada} | reserva existente
  const [estadiaId, setEstadiaId] = useState(null);

  const estadia = estadiaId ? data.reservasById[estadiaId] : null;

  // Lleva el folio (o un adelanto) al checkout existente del POS
  const handleCobrar = (reserva, opciones) => {
    const hab = data.habById[reserva.habitacion_id];
    const items = hotelService.itemsParaCobro(reserva, hab?.numero, opciones);
    if (items.length === 0) {
      alert('No hay saldo pendiente para cobrar.');
      return;
    }
    loadItems(items, {
      origen: 'HOTEL',
      reservaId: reserva.id,
      checkout: opciones?.tipo === 'CUENTA' && opciones?.checkout === true,
      mesa: null,
    });
    onOpenCheckout?.();
  };

  return (
    <div className="space-y-4 font-sans pb-12">
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-sky-50 text-sky-600 border border-sky-200 flex items-center justify-center">
            <BedDouble className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Hotel & Hospedaje</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-sky-50 text-sky-800 border border-sky-200">PMS</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">Reservas, check-in/out, folio del huésped, limpieza y ocupación conectados a tu caja e inventario.</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => setReservaForm({ walkin: true })}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700"
          >
            Walk-in
          </button>
          <button
            type="button"
            onClick={() => setReservaForm({})}
            className="px-4 py-2.5 bg-primary-500 hover:bg-primary-600 text-white text-xs font-black rounded-xl flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="w-4 h-4" /> Nueva reserva
          </button>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-2xs">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {HOTEL_TABS.map(t => {
            const Icon = t.icon;
            const active = t.id === tab;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => { setEstadiaId(null); onSelectSubView?.(t.id); }}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 whitespace-nowrap transition ${
                  active ? 'bg-sky-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
                }`}
              >
                <Icon className={`w-4 h-4 ${active ? 'text-white' : 'text-slate-500'}`} />
                {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {estadia ? (
        <EstadiaPanel
          reserva={estadia}
          data={data}
          onBack={() => setEstadiaId(null)}
          onEditar={(r) => setReservaForm(r)}
          onCobrar={handleCobrar}
        />
      ) : (
        <>
          {tab === 'hotel_recepcion' && <RecepcionTab data={data} onOpenReserva={setEstadiaId} onNuevaReserva={setReservaForm} />}
          {tab === 'hotel_calendario' && <CalendarioTab data={data} onOpenReserva={setEstadiaId} onNuevaReserva={setReservaForm} />}
          {tab === 'hotel_reservas' && <ReservasTab data={data} onOpenReserva={setEstadiaId} />}
          {tab === 'hotel_limpieza' && <LimpiezaTab data={data} />}
          {tab === 'hotel_huespedes' && <HuespedesTab data={data} onOpenReserva={setEstadiaId} />}
          {tab === 'hotel_reportes' && <ReportesHotelTab data={data} />}
          {tab === 'hotel_config' && <ConfigHotelTab data={data} />}
        </>
      )}

      {reservaForm && (
        <ReservaModal
          inicial={reservaForm}
          data={data}
          onClose={() => setReservaForm(null)}
          onSaved={(r) => { setReservaForm(null); setEstadiaId(r.id); }}
        />
      )}
    </div>
  );
}
