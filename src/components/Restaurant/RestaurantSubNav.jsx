import React from 'react';
import { LayoutGrid, ShoppingBag, Flame, BookOpen, BarChart3, Settings } from 'lucide-react';

export const GLORYCHEF_TABS = [
  { id: 'chef_mesas', aliases: ['restaurante', 'chef_mesas'], label: 'Mesas & Salones', icon: LayoutGrid },
  { id: 'chef_pedidos', aliases: ['chef_pedidos'], label: 'Para llevar & Delivery', icon: ShoppingBag },
  { id: 'chef_cocina', aliases: ['chef_cocina'], label: 'Cocina (KDS)', icon: Flame },
  { id: 'chef_carta', aliases: ['chef_carta'], label: 'Carta & Recetas', icon: BookOpen },
  { id: 'chef_reportes', aliases: ['chef_reportes'], label: 'Reportes', icon: BarChart3 },
  { id: 'chef_config', aliases: ['chef_config'], label: 'Configuración', icon: Settings },
];

export default function RestaurantSubNav({ currentSubView, onSelectSubView }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl px-3 py-2.5 shadow-2xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {GLORYCHEF_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.aliases.includes(currentSubView);
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSubView(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-orange-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              type="button"
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
