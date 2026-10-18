import React, { useState } from 'react';
import { Plus, Trash2, Save } from 'lucide-react';
import { restaurantService } from '../../services/restaurantService';
import { toast } from 'sonner';

// Configuración de salones y mesas del restaurante
export default function ConfigSalonesTab({ data }) {
  const { salones, mesas } = data;
  const [nuevoSalon, setNuevoSalon] = useState('');
  const [nuevaMesa, setNuevaMesa] = useState({});

  const run = async (fn) => {
    try {
      await fn();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const crearSalon = (e) => {
    e.preventDefault();
    if (!nuevoSalon.trim()) return;
    run(async () => {
      await restaurantService.saveSalon({ nombre: nuevoSalon.trim() });
      setNuevoSalon('');
    });
  };

  const crearMesa = (salonId) => {
    const form = nuevaMesa[salonId] || {};
    const existentes = mesas.filter(m => m.salon_id === salonId).length;
    run(async () => {
      await restaurantService.saveMesa({
        salon_id: salonId,
        numero: (form.numero || '').trim() || String(mesas.length + 1).padStart(2, '0'),
        capacidad: Number(form.capacidad) || 4,
      });
      setNuevaMesa(prev => ({ ...prev, [salonId]: { numero: '', capacidad: 4 } }));
      return existentes;
    });
  };

  return (
    <div className="space-y-4">
      <form onSubmit={crearSalon} className="bg-white rounded-3xl border border-slate-200 p-4 flex gap-2">
        <input
          value={nuevoSalon}
          onChange={e => setNuevoSalon(e.target.value)}
          placeholder="Nuevo salón (ej. Terraza, VIP, Segundo piso)"
          className="flex-1 border border-slate-200 rounded-xl px-3 py-2 text-sm"
        />
        <button type="submit" className="px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1">
          <Plus className="w-4 h-4" /> Agregar salón
        </button>
      </form>

      {salones.map(s => {
        const mesasSalon = mesas.filter(m => m.salon_id === s.id);
        const form = nuevaMesa[s.id] || { numero: '', capacidad: 4 };
        return (
          <div key={s.id} className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <input
                defaultValue={s.nombre}
                onBlur={e => e.target.value.trim() && e.target.value !== s.nombre && run(() => restaurantService.saveSalon({ ...s, nombre: e.target.value.trim() }))}
                className="text-sm font-black text-slate-900 border border-transparent hover:border-slate-200 rounded-lg px-2 py-1"
              />
              <button type="button" onClick={() => window.confirm(`¿Eliminar el salón ${s.nombre} y sus mesas?`) && run(() => restaurantService.deleteSalon(s.id))} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="flex flex-wrap gap-2">
              {mesasSalon.map(m => (
                <div key={m.id} className="flex items-center gap-1.5 border border-slate-200 rounded-xl px-2 py-1 text-xs">
                  <span className="font-bold">Mesa {m.numero}</span>
                  <input
                    type="number"
                    min="1"
                    defaultValue={m.capacidad}
                    onBlur={e => Number(e.target.value) !== m.capacidad && run(() => restaurantService.saveMesa({ ...m, capacidad: Number(e.target.value) || 1 }))}
                    className="w-12 border border-slate-200 rounded-lg px-1 text-right"
                    title="Capacidad"
                  />
                  <span className="text-[10px] text-slate-400">pers.</span>
                  <button type="button" onClick={() => run(() => restaurantService.deleteMesa(m.id))} className="text-rose-500">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 items-center text-xs">
              <input
                value={form.numero}
                onChange={e => setNuevaMesa(prev => ({ ...prev, [s.id]: { ...form, numero: e.target.value } }))}
                placeholder="N.º / nombre de mesa"
                className="border border-slate-200 rounded-xl px-2 py-1.5 w-40"
              />
              <input
                type="number"
                min="1"
                value={form.capacidad}
                onChange={e => setNuevaMesa(prev => ({ ...prev, [s.id]: { ...form, capacidad: e.target.value } }))}
                className="border border-slate-200 rounded-xl px-2 py-1.5 w-20"
                title="Capacidad"
              />
              <button type="button" onClick={() => crearMesa(s.id)} className="px-3 py-1.5 rounded-xl bg-slate-900 text-white font-bold flex items-center gap-1">
                <Save className="w-3.5 h-3.5" /> Agregar mesa
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
