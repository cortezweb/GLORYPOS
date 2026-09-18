import React, { useState, useEffect } from 'react';
import { 
  DollarSign, TrendingUp, TrendingDown, Wallet, 
  ArrowUpRight, ArrowDownRight, Lock, Plus, Calendar, FileText 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';

export default function FinanzasView({ onOpenCloseCash }) {
  const { empresa } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [compras, setCompras] = useState([]);

  useEffect(() => {
    const load = async () => {
      const v = await db.ventas.toArray();
      const c = await db.compras.toArray();
      setVentas(v);
      setCompras(c);
    };
    load();
  }, []);

  const totalIngresos = ventas.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const totalEgresos = compras.reduce((acc, curr) => acc + (curr.total || 0), 0);
  const balanceNeto = totalIngresos - totalEgresos;

  const totalEfectivo = ventas
    .filter(v => v.metodo_pago === 'EFECTIVO')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalQR = ventas
    .filter(v => v.metodo_pago === 'QR')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  const totalTarjeta = ventas
    .filter(v => v.metodo_pago === 'TARJETA')
    .reduce((acc, curr) => acc + (curr.total || 0), 0);

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Módulo de Finanzas & Caja</h1>
          <p className="text-xs text-slate-500">Control de flujo de caja, ingresos, egresos y arqueos de turno.</p>
        </div>

        <button
          onClick={onOpenCloseCash}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#7c3aed] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Lock className="w-3.5 h-3.5" />
          <span>Realizar Arqueo de Caja</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Total Ingresos */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Ingresos (Ventas)</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">Bs. {totalIngresos.toFixed(2)}</span>
          <span className="text-[11px] text-emerald-600 font-semibold">{ventas.length} operaciones registradas</span>
        </div>

        {/* Total Egresos */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Total Egresos (Compras)</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <span className="text-2xl font-black text-slate-900 block">Bs. {totalEgresos.toFixed(2)}</span>
          <span className="text-[11px] text-rose-600 font-semibold">{compras.length} compras a proveedores</span>
        </div>

        {/* Balance Neto */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Balance Neto Disponible</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <span className={`text-2xl font-black block ${balanceNeto >= 0 ? 'text-[#2563eb]' : 'text-rose-600'}`}>
            Bs. {balanceNeto.toFixed(2)}
          </span>
          <span className="text-[11px] text-slate-500 font-medium">Margen operativo positivo</span>
        </div>
      </div>

      {/* Payment methods breakdown */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-blue-50/60 rounded-2xl border border-blue-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-blue-700">En Gaveta (Efectivo)</span>
            <span className="text-lg font-black text-slate-900 block">Bs. {totalEfectivo.toFixed(2)}</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-blue-200/60 text-blue-900 rounded-lg">Caja 01</span>
        </div>

        <div className="p-3.5 bg-purple-50/60 rounded-2xl border border-purple-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-purple-700">Banco (QR Simple)</span>
            <span className="text-lg font-black text-slate-900 block">Bs. {totalQR.toFixed(2)}</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-purple-200/60 text-purple-900 rounded-lg">Cta. Corriente</span>
        </div>

        <div className="p-3.5 bg-indigo-50/60 rounded-2xl border border-indigo-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase text-indigo-700">Tarjeta (POS Físico)</span>
            <span className="text-lg font-black text-slate-900 block">Bs. {totalTarjeta.toFixed(2)}</span>
          </div>
          <span className="text-xs font-bold px-2 py-0.5 bg-indigo-200/60 text-indigo-900 rounded-lg">Abono 24h</span>
        </div>
      </div>

      {/* Recent Movements Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <h3 className="text-sm font-bold text-slate-800">Últimos Movimientos de Dinero</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                <th className="pb-2">Fecha</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Descripción</th>
                <th className="pb-2">Método</th>
                <th className="pb-2 text-right">Monto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {ventas.slice(0, 5).map(v => (
                <tr key={v.id} className="hover:bg-slate-50">
                  <td className="py-2.5 text-slate-500 font-mono text-[11px]">
                    {new Date(v.fecha).toLocaleDateString('es-BO')}
                  </td>
                  <td className="py-2.5">
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px]">
                      Ingreso
                    </span>
                  </td>
                  <td className="py-2.5 font-medium text-slate-800">
                    Venta {v.correlativo} - {v.cliente_nombre}
                  </td>
                  <td className="py-2.5 text-slate-500">{v.metodo_pago}</td>
                  <td className="py-2.5 text-right font-bold text-emerald-600">
                    + Bs. {Number(v.total).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
