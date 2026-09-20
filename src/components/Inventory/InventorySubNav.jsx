import React from 'react';
import { Activity, ArrowRightLeft, History, FileText } from 'lucide-react';

export default function InventorySubNav({ currentSubView, onSelectSubView }) {
  const tabs = [
    { 
      id: 'movimientos', 
      aliases: ['movimientos', 'inventory', 'inventario', 'stock'],
      label: 'Movimientos', 
      icon: Activity 
    },
    { 
      id: 'transferencias', 
      aliases: ['transferencias', 'transferencia', 'nueva_transferencia'],
      label: 'Transferencias', 
      icon: ArrowRightLeft 
    },
    { 
      id: 'historial_transferencias', 
      aliases: ['historial_transferencias', 'historial_transferencia', 'historial_trf'],
      label: 'Historial de Transferencias', 
      icon: History 
    },
    { 
      id: 'kardex', 
      aliases: ['kardex', 'inventario_kardex'],
      label: 'Kardex de Inventario', 
      icon: FileText 
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 shadow-2xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === currentSubView || (tab.aliases && tab.aliases.includes(currentSubView));
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSubView(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs'
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
