import React from 'react';
import { 
  ShoppingCart, FileText, Receipt, FileSpreadsheet, Wallet, 
  ChevronRight, PlusCircle, Globe, Award, Clock
} from 'lucide-react';

export default function SalesSubNav({ currentSubView, onSelectSubView }) {
  const tabs = [
    {
      id: 'pos',
      viewId: 'pos',
      aliases: ['pos'],
      label: 'Punto de Venta',
      icon: ShoppingCart,
      badge: 'POS'
    },
    {
      id: 'nuevo_comprobante',
      viewId: 'nuevo_comprobante',
      aliases: ['nuevo_comprobante', 'ventas_nuevo'],
      label: 'Nuevo Comprobante',
      icon: PlusCircle,
      badge: 'Nuevo'
    },
    {
      id: 'comprobantes',
      viewId: 'ventas_comprobantes',
      aliases: ['comprobantes', 'ventas_comprobantes', 'consulta_comprobantes', 'sales'],
      label: 'Consulta de Comprobantes',
      icon: FileText,
      badge: null
    },
    {
      id: 'notas_venta',
      viewId: 'ventas_notas',
      aliases: ['notas_venta', 'ventas_notas', 'notas'],
      label: 'Notas de Venta',
      icon: Receipt,
      badge: null
    },
    {
      id: 'cuentas_por_cobrar',
      viewId: 'cuentas_por_cobrar',
      aliases: ['cuentas_por_cobrar', 'cuentas_cobrar', 'creditos'],
      label: 'Cuentas por Cobrar',
      icon: Clock,
      badge: null
    },
    {
      id: 'pedidos_web',
      viewId: 'pedidos_web',
      aliases: ['pedidos_web', 'pedidosweb'],
      label: 'Pedidos Web',
      icon: Globe,
      badge: 'Online'
    },
    {
      id: 'membresias',
      viewId: 'membresias',
      aliases: ['membresias', 'suscripciones'],
      label: 'Membresías',
      icon: Award,
      badge: null
    },
    {
      id: 'caja_chica',
      viewId: 'ventas_caja',
      aliases: ['caja_chica', 'ventas_caja', 'caja'],
      label: 'Caja Chica / Turno',
      icon: Wallet,
      badge: null
    }
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-0 z-20 shadow-2xs select-none" data-purpose="sales-subnav">
      {/* Top Breadcrumb Bar */}
      <div className="px-3 sm:px-4 pt-2 pb-1 flex items-center justify-between text-xs text-gray-500 border-b border-gray-100">
        <div className="flex items-center space-x-1.5 font-medium">
          <span className="text-gray-400">Módulo</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-[#2563eb] font-bold">Ventas</span>
          <ChevronRight className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-800 font-semibold">
            {tabs.find(t => t.aliases.includes(currentSubView))?.label || 'Punto de Venta'}
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-1.5 text-[11px] text-gray-400">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span>Facturación Electrónica & Caja Activa</span>
        </div>
      </div>

      {/* Horizontal Scrollable Submenu Pills */}
      <nav className="flex items-center gap-1.5 px-3 sm:px-4 py-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.aliases.includes(currentSubView);

          return (
            <button
              key={tab.id}
              onClick={() => onSelectSubView(tab.viewId)}
              className={`flex items-center space-x-2 px-3 py-1.5 rounded-xl text-xs whitespace-nowrap transition-all duration-150 shrink-0 ${
                isActive
                  ? 'bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-semibold shadow-sm shadow-blue-500/25 ring-1 ring-blue-600/30'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-900 border border-gray-200/80 font-medium'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-white' : 'text-gray-500'}`} />
              <span>{tab.label}</span>
              {tab.badge && (
                <span
                  className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold uppercase tracking-wider ${
                    isActive ? 'bg-white/20 text-white' : 'bg-blue-50 text-[#2563eb]'
                  }`}
                >
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
