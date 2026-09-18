import React from 'react';
import { 
  X, LayoutDashboard, TrendingUp, DollarSign, Package, 
  Users, FileText, ArrowUpRight, AlertTriangle, ShieldCheck 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DesktopDashboardModal({ isOpen, onClose }) {
  const { empresa } = useAuth();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl bg-slate-50 rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-700">
        
        {/* Desktop Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-[#7c3aed] flex items-center justify-center font-black text-lg">
              GP
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">GLORYPOS Bolivia — Dashboard Web</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  Modo Desktop
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {empresa?.nombre} • Santa Cruz, Bolivia
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dashboard Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Top 4 Metric KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Ventas Totales (Mes)
              </span>
              <span className="text-2xl font-black text-slate-900 block">
                Bs. 18,450.00
              </span>
              <span className="text-[11px] font-semibold text-emerald-600 flex items-center gap-0.5">
                <ArrowUpRight className="w-3.5 h-3.5" /> +14.2% vs mes anterior
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Comprobantes Emitidos
              </span>
              <span className="text-2xl font-black text-slate-900 block">
                412
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                85% Recibos • 15% SIAT
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Clientes Registrados
              </span>
              <span className="text-2xl font-black text-slate-900 block">
                148
              </span>
              <span className="text-[11px] font-semibold text-indigo-600">
                Directorio actualizado
              </span>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                Ticket Promedio
              </span>
              <span className="text-2xl font-black text-slate-900 block">
                Bs. 44.78
              </span>
              <span className="text-[11px] font-medium text-slate-500">
                Por transacción
              </span>
            </div>
          </div>

          {/* Simulated Sales Trend Chart */}
          <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Evolución de Ventas Semanal</h3>
                <p className="text-xs text-slate-500">Comportamiento en Bolivianos (Bs.)</p>
              </div>
              <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-lg">
                Esta Semana
              </span>
            </div>

            {/* Simulated CSS Bar Chart */}
            <div className="h-44 flex items-end justify-between gap-3 pt-4 px-2 border-b border-slate-100">
              {[
                { day: 'Lun', val: 65, monto: '1,200' },
                { day: 'Mar', val: 78, monto: '1,450' },
                { day: 'Mié', val: 45, monto: '890' },
                { day: 'Jue', val: 90, monto: '1,680' },
                { day: 'Vie', val: 100, monto: '2,100' },
                { day: 'Sáb', val: 120, monto: '2,650' },
                { day: 'Dom', val: 85, monto: '1,590' },
              ].map((b) => (
                <div key={b.day} className="flex-1 flex flex-col items-center gap-2 group">
                  <span className="text-[10px] font-bold text-slate-500 opacity-0 group-hover:opacity-100 transition">
                    Bs. {b.monto}
                  </span>
                  <div 
                    className="w-full bg-gradient-to-t from-blue-600 to-indigo-600 rounded-t-xl group-hover:from-blue-700 group-hover:to-indigo-700 transition-all shadow-xs"
                    style={{ height: `${(b.val / 120) * 120}px` }}
                  />
                  <span className="text-xs font-semibold text-slate-600">{b.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom Grid: Low Stock Alert & Top Products */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Low Stock Alert */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-500" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Alertas de Stock Bajo
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50/70 border border-rose-100">
                  <span className="font-semibold text-slate-800">Aceite Vegetal Fino 900ml</span>
                  <span className="font-bold text-rose-600">Quedan 3 botellas</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-amber-50/70 border border-amber-100">
                  <span className="font-semibold text-slate-800">Galletas Mabel Moraditas</span>
                  <span className="font-bold text-amber-700">Quedan 4 paquetes</span>
                </div>
              </div>
            </div>

            {/* Top Products */}
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-emerald-500" />
                <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider">
                  Más Vendidos en Bolivia
                </h4>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">1. Coca-Cola Original 2L</span>
                  <span className="font-extrabold text-indigo-600">142 vendidos</span>
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="font-semibold text-slate-800">2. Cerveza Paceña 710ml</span>
                  <span className="font-extrabold text-indigo-600">98 vendidos</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-white border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <span>GLORYPOS Cloudflare + Supabase Multi-Tenant</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl transition"
          >
            Volver a la App Móvil
          </button>
        </div>
      </div>
    </div>
  );
}
