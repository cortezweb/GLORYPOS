import React from 'react';
import { Calculator, Package, Users, FileText } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function BottomNav({ currentView, onSelectView }) {
  const { count } = useCart();

  return (
    <nav className="bg-white border-t border-gray-200 z-30 safe-bottom">
      <div className="grid grid-cols-4 h-14 max-w-md mx-auto">
        {/* Tab 1: POS / Ventas */}
        <button 
          onClick={() => onSelectView('pos')}
          className={`flex flex-col items-center justify-center transition-colors ${
            ['pos', 'ventas_caja', 'ventas_notas', 'ventas_cotizaciones'].includes(currentView) 
              ? 'text-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
          type="button"
        >
          <div className="relative">
            <Calculator className="w-5 h-5 mb-0.5" />
            {count > 0 && (
              <span className="absolute -top-1 -right-2 bg-amber-400 text-gray-950 text-[9px] font-black rounded-full h-3.5 w-3.5 flex items-center justify-center shadow-xs animate-bounce">
                {count}
              </span>
            )}
          </div>
          <span className="text-[10px]">Ventas</span>
        </button>

        {/* Tab 2: Productos */}
        <button 
          onClick={() => onSelectView('productos')}
          className={`flex flex-col items-center justify-center transition-colors ${
            ['productos', 'inventory'].includes(currentView) ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-800'
          }`}
          type="button"
        >
          <Package className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Productos</span>
        </button>

        {/* Tab 3: Clientes */}
        <button 
          onClick={() => onSelectView('clients')}
          className={`flex flex-col items-center justify-center transition-colors ${
            currentView === 'clients' ? 'text-blue-600 font-semibold' : 'text-gray-500 hover:text-gray-800'
          }`}
          type="button"
        >
          <Users className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Clientes</span>
        </button>

        {/* Tab 4: Comprobantes / Historial */}
        <button 
          onClick={() => onSelectView('ventas_comprobantes')}
          className={`flex flex-col items-center justify-center transition-colors ${
            ['ventas_comprobantes', 'sales', 'reports'].includes(currentView) 
              ? 'text-blue-600 font-semibold' 
              : 'text-gray-500 hover:text-gray-800'
          }`}
          type="button"
        >
          <FileText className="w-5 h-5 mb-0.5" />
          <span className="text-[10px]">Comprobantes</span>
        </button>
      </div>
    </nav>
  );
}
