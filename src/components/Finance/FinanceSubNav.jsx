import React from 'react';
import { 
  Lock, TrendingUp, TrendingDown, Landmark, 
  Wallet, Receipt, FileText, CreditCard 
} from 'lucide-react';

export default function FinanceSubNav({ currentSubView, activeTab, onSelectSubView, onSelectTab }) {
  const current = activeTab || currentSubView || 'caja';
  const handleSelect = onSelectTab || onSelectSubView || (() => {});

  const tabs = [
    { 
      id: 'caja', 
      aliases: ['caja', 'sesiones_caja', 'cajas', 'turnos'],
      label: 'Sesiones de Caja', 
      icon: Lock 
    },
    { 
      id: 'ingresos', 
      aliases: ['ingresos', 'ingresos_caja'],
      label: 'Ingresos', 
      icon: TrendingUp 
    },
    { 
      id: 'egresos', 
      aliases: ['egresos', 'egresos_caja'],
      label: 'Egresos', 
      icon: TrendingDown 
    },
    { 
      id: 'cuentas_bancarias', 
      aliases: ['cuentas_bancarias', 'bancos', 'cuentas'],
      label: 'Cuentas Bancarias', 
      icon: Landmark 
    },
    { 
      id: 'cuentas_por_cobrar', 
      aliases: ['cuentas_por_cobrar', 'por_cobrar', 'cobranzas'],
      label: 'Cuentas por Cobrar', 
      icon: Wallet 
    },
    { 
      id: 'cuentas_por_pagar', 
      aliases: ['cuentas_por_pagar', 'por_pagar'],
      label: 'Cuentas por Pagar', 
      icon: Receipt 
    },
    { 
      id: 'reportes_caja', 
      aliases: ['reportes_caja', 'reporte_cajas'],
      label: 'Reportes de Caja', 
      icon: FileText 
    },
    { 
      id: 'metodos_pago', 
      aliases: ['metodos_pago', 'metodos'],
      label: 'Métodos de Pago', 
      icon: CreditCard 
    },
  ];

  return (
    <div className="bg-white border-b border-slate-200 px-3 sm:px-5 py-2.5 shadow-2xs">
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === current || (tab.aliases && tab.aliases.includes(current));
          return (
            <button
              key={tab.id}
              onClick={() => handleSelect(tab.id)}
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
