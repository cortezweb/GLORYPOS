import React from 'react';
import { Send, Truck, Building2, UserCheck, Car } from 'lucide-react';

export default function DispatchSubNav({ activeTab, onSelectTab }) {
  const current = activeTab || 'guias_remitente';

  const tabs = [
    {
      id: 'guias_remitente',
      aliases: ['guias_remitente', 'remitente', 'gre_09', 'guias_remision'],
      label: 'Remitente (09)',
      icon: Send
    },
    {
      id: 'guias_transportista',
      aliases: ['guias_transportista', 'transportista', 'gre_31'],
      label: 'Transportista (31)',
      icon: Truck
    },
    {
      id: 'transportistas',
      aliases: ['transportistas', 'transportistas_gre'],
      label: 'Transportistas GRE',
      icon: Building2
    },
    {
      id: 'conductores',
      aliases: ['conductores', 'conductores_gre'],
      label: 'Conductores GRE',
      icon: UserCheck
    },
    {
      id: 'vehiculos',
      aliases: ['vehiculos', 'vehiculos_gre'],
      label: 'Vehículos GRE',
      icon: Car
    }
  ];

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-1.5 shadow-2xs overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-1 min-w-max">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === current || tab.aliases.includes(current);

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer select-none ${
                isActive
                  ? 'bg-[#00a650] text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
