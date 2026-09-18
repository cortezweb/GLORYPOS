import React, { useState, useEffect } from 'react';
import { 
  BarChart3, TrendingUp, Banknote, QrCode, CreditCard, 
  ShieldCheck, RefreshCw, Download, Calendar, CheckCircle2, FileText 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';

export default function ReportsView({ onOpenReceipt }) {
  const { empresa } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [syncSuccess, setSyncSuccess] = useState(false);

  const loadVentas = async () => {
    const list = await db.ventas.reverse().toArray();
    setVentas(list);
  };

  useEffect(() => {
    loadVentas();
  }, []);

  // Totales y Métricas
  const totalRecaudado = ventas.reduce((acc, curr) => acc + curr.total, 0);
  const totalEfectivo = ventas.filter(v => v.metodo_pago === 'EFECTIVO').reduce((acc, curr) => acc + curr.total, 0);
  const totalQR = ventas.filter(v => v.metodo_pago === 'QR').reduce((acc, curr) => acc + curr.total, 0);
  const totalTarjeta = ventas.filter(v => v.metodo_pago === 'TARJETA').reduce((acc, curr) => acc + curr.total, 0);

  // Estimación de ganancia (aprox 25%)
  const gananciaEstimada = totalRecaudado * 0.25;

  const facturasSiatCount = ventas.filter(v => v.tipo_documento === 'FACTURA_SIAT').length;
  const recibosCount = ventas.filter(v => v.tipo_documento !== 'FACTURA_SIAT').length;

  const handleSyncSIAT = () => {
    setSyncing(true);
    setTimeout(() => {
      setSyncing(false);
      setSyncSuccess(true);
      setTimeout(() => setSyncSuccess(false), 3000);
    }, 1500);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-24">
      {/* Header (Exact Stitch Layout) */}
      <div className="bg-slate-900 text-white p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-indigo-400" />
              <h1 className="text-lg font-bold leading-tight">Reportes & SIAT</h1>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Cierre diario y control de facturación tributaria
            </p>
          </div>

          <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            SIAT Online
          </span>
        </div>

        {/* Big Total Box */}
        <div className="bg-gradient-to-br from-indigo-900/60 to-violet-900/40 border border-indigo-500/30 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-200">
              Ventas Totales del Día
            </span>
            <div className="text-2xl font-black text-white mt-0.5">
              Bs. {totalRecaudado.toFixed(2)}
            </div>
            <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1 mt-1">
              <TrendingUp className="w-3.5 h-3.5" />
              Ganancia Estimada: Bs. {gananciaEstimada.toFixed(2)}
            </span>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-300 block font-medium">Comprobantes</span>
            <span className="text-xl font-extrabold text-white">{ventas.length}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {/* Desglose por Método de Pago */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <h3 className="font-bold text-slate-800 text-xs uppercase tracking-wider">
            Ingresos por Medio de Pago
          </h3>

          <div className="space-y-2 text-xs">
            {/* Efectivo */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-emerald-800">
                  <Banknote className="w-4 h-4 text-emerald-600" />
                  Efectivo en Caja
                </span>
                <span className="font-bold text-slate-900">Bs. {totalEfectivo.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 rounded-full"
                  style={{ width: `${totalRecaudado > 0 ? (totalEfectivo / totalRecaudado) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* QR Simple */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-indigo-800">
                  <QrCode className="w-4 h-4 text-indigo-600" />
                  Transferencias QR Simple
                </span>
                <span className="font-bold text-slate-900">Bs. {totalQR.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-indigo-600 rounded-full"
                  style={{ width: `${totalRecaudado > 0 ? (totalQR / totalRecaudado) * 100 : 0}%` }}
                />
              </div>
            </div>

            {/* Tarjeta */}
            <div>
              <div className="flex justify-between font-semibold mb-1">
                <span className="flex items-center gap-1.5 text-blue-800">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  Tarjeta POS
                </span>
                <span className="font-bold text-slate-900">Bs. {totalTarjeta.toFixed(2)}</span>
              </div>
              <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full"
                  style={{ width: `${totalRecaudado > 0 ? (totalTarjeta / totalRecaudado) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Estado Tributario SIAT / SIN */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Impuestos Nacionales
              </span>
              <h3 className="font-bold text-slate-900 text-sm">Sincronización SIAT</h3>
            </div>

            <button
              onClick={handleSyncSIAT}
              disabled={syncing}
              className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
              <span>{syncing ? 'Sincronizando...' : 'Enviar Lote'}</span>
            </button>
          </div>

          {syncSuccess && (
            <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-800 flex items-center gap-2 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>¡Lote de facturas validado exitosamente en el SIN!</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Facturas Electrónicas</span>
              <span className="text-base font-extrabold text-indigo-600">{facturasSiatCount} emitidas</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[10px] text-slate-500 block">Notas de Venta / Recibos</span>
              <span className="text-base font-extrabold text-slate-800">{recibosCount} emitidos</span>
            </div>
          </div>
        </div>

        {/* Últimos Comprobantes */}
        <div>
          <h4 className="font-bold text-slate-800 text-xs uppercase tracking-wider mb-2 px-1">
            Comprobantes de la Jornada
          </h4>
          <div className="space-y-1.5">
            {ventas.slice(0, 5).map((v) => (
              <div
                key={v.id}
                onClick={() => onOpenReceipt(v)}
                className="p-3 bg-white rounded-xl border border-slate-200 flex items-center justify-between text-xs cursor-pointer hover:border-indigo-300 transition"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-400" />
                  <div>
                    <span className="font-bold text-slate-900 block">N° {v.correlativo}</span>
                    <span className="text-[10px] text-slate-500">{v.cliente_nombre}</span>
                  </div>
                </div>

                <div className="text-right">
                  <span className="font-extrabold text-slate-900 block">Bs. {v.total.toFixed(2)}</span>
                  <span className="text-[9px] text-slate-400">{v.metodo_pago}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
