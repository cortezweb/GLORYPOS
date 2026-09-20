import React from 'react';
import { Package, Sparkles, Wrench, Layers, Bookmark, Ruler, Boxes } from 'lucide-react';

export default function ProductsSubNav({ currentSubView, onSelectSubView }) {
  const tabs = [
    { 
      id: 'productos', 
      aliases: ['productos', 'products'],
      label: 'Productos', 
      icon: Package 
    },
    { 
      id: 'combos_promociones', 
      aliases: ['combos_promociones', 'combos', 'promociones'],
      label: 'Combos y Promociones', 
      icon: Sparkles 
    },
    { 
      id: 'servicios', 
      aliases: ['servicios', 'services'],
      label: 'Servicios', 
      icon: Wrench 
    },
    { 
      id: 'categorias', 
      aliases: ['categorias', 'categorias_marcas'],
      label: 'Categorías', 
      icon: Layers 
    },
    { 
      id: 'marcas', 
      aliases: ['marcas'],
      label: 'Marcas', 
      icon: Bookmark 
    },
    { 
      id: 'unidades_medida', 
      aliases: ['unidades_medida', 'unidades'],
      label: 'Unidades de Medida', 
      icon: Ruler 
    },
    { 
      id: 'inventory', 
      aliases: ['inventory', 'inventario', 'kardex'],
      label: 'Stock & Kardex', 
      icon: Boxes 
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
