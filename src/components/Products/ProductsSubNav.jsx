import React from 'react';
import { Tag, Boxes, ArrowLeftRight } from 'lucide-react';

export default function ProductsSubNav({ currentSubView, onSelectSubView }) {
  const tabs = [
    { id: 'productos', label: 'Catálogo de Productos', icon: Tag },
    { id: 'inventory', label: 'Control de Stock & Kardex', icon: Boxes },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-3 py-2">
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentSubView === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectSubView(tab.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap ${
                isActive
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
              }`}
              type="button"
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
