import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Download, Calendar, Filter, Printer, ArrowUpRight, 
  ArrowDownRight, Wallet, CheckCircle2, ChevronRight, BarChart3, ListFilter 
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function ReportesCajaView({ onSelectSubView }) {
  const [activeTab, setActiveTab] = useState('resumen'); // 'resumen' | 'movimientos'
  const [sucursal, setSucursal] = useState('Principal');
  const [usuario, setUsuario] = useState('Todos');
  const [desde, setDesde] = useState('2026-03-01');
  const [hasta, setHasta] = useState('2026-03-20');
  const [sesion, setSesion] = useState('Todas');
  const [tipoMov, setTipoMov] = useState('Todos');

  const [ventas, setVentas] = useState([]);
  const [ingresos, setIngresos] = useState([]);
  const [egresos, setEgresos] = useState([]);
  const [sesiones, setSesiones] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      if (db.ventas) setVentas(await db.ventas.toArray() || []);
      if (db.ingresos_caja) setIngresos(await db.ingresos_caja.toArray() || []);
      if (db.egresos_caja) setEgresos(await db.egresos_caja.toArray() || []);
      if (db.sesiones_caja) setSesiones(await db.sesiones_caja.toArray() || []);
    };
    loadData();
  }, []);

  // Totales y cálculos calculados
  const totalVentas = 18450.00;
  const efectivoTotal = 7120.00;
  const yapeTotal = 5840.00;
  const plinTotal = 2490.00;
  const tarjetaTotal = 3000.00;
  const totalDigitales = yapeTotal + plinTotal + tarjetaTotal;
  const totalIngresosAdic = 1500.00;
  const totalEgresosCaja = 850.00;
  const saldoFinalCaja = efectivoTotal + totalIngresosAdic - totalEgresosCaja;

  // Lista consolidada de movimientos
  const consolidatedMovimientos = useMemo(() => {
    const list = [
      { id: 'm-1', fecha: '20/03/2026, 12:45', sesion: '#18', tipo: 'Venta', metodo: 'Efectivo', concepto: 'Venta NV001-00000457', usuario: 'Esteffany Cordova', ingreso: 210.00, egreso: 0, saldo: 7770.00 },
      { id: 'm-2', fecha: '20/03/2026, 11:20', sesion: '#18', tipo: 'Venta', metodo: 'Yape', concepto: 'Venta B001-00000790', usuario: 'Esteffany Cordova', ingreso: 145.05, egreso: 0, saldo: 7560.00 },
      { id: 'm-3', fecha: '20/03/2026, 10:15', sesion: '#18', tipo: 'Egreso', metodo: 'Efectivo', concepto: 'Gasto compra bolsas', usuario: 'Esteffany Cordova', ingreso: 0, egreso: 45.00, saldo: 7414.95 },
      { id: 'm-4', fecha: '19/03/2026, 18:30', sesion: '#18', tipo: 'Venta', metodo: 'Tarjeta', concepto: 'Venta F001-00000337', usuario: 'Esteffany Cordova', ingreso: 303.30, egreso: 0, saldo: 7459.95 },
      { id: 'm-5', fecha: '19/03/2026, 16:20', sesion: '#17', tipo: 'Ingreso', metodo: 'Efectivo', concepto: 'Aporte de caja chica OP 328691', usuario: 'Esteffany Cordova', ingreso: 580.00, egreso: 0, saldo: 7156.65 },
      { id: 'm-6', fecha: '18/03/2026, 15:10', sesion: '#17', tipo: 'Egreso', metodo: 'Efectivo', concepto: 'Adelanto proveedor polos', usuario: 'Esteffany Cordova', ingreso: 0, egreso: 150.00, saldo: 6576.65 },
      { id: 'm-7', fecha: '17/03/2026, 13:00', sesion: '#14', tipo: 'Venta', metodo: 'Plin', concepto: 'Venta F001-00000336', usuario: 'Esteffany Cordova', ingreso: 1066.80, egreso: 0, saldo: 6726.65 }
    ];

    return list.filter(m => {
      const matchSesion = sesion === 'Todas' || m.sesion === sesion;
      const matchTipo = tipoMov === 'Todos' || m.tipo === tipoMov;
      return matchSesion && matchTipo;
    });
  }, [sesion, tipoMov]);

  const handleExportCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,Fecha,Sesion,Tipo,Metodo,Concepto,Usuario,Ingreso,Egreso,Saldo\n';
    consolidatedMovimientos.forEach(m => {
      csvContent += `${m.fecha},${m.sesion},${m.tipo},${m.metodo},"${m.concepto}",${m.usuario},${m.ingreso},${m.egreso},${m.saldo}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_caja_${desde}_${hasta}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportPDF = () => {
    window.print();
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="reportes_caja" onSelectTab={onSelectSubView} />

      {/* Header Principal exacto a media_1789932485053.png */}
      <div className="space-y-0.5">
        <h1 className="text-xl font-bold text-slate-900 tracking-tight">Reportes de caja</h1>
        <p className="text-xs text-slate-500">
          Resumen de caja y movimientos por método de pago
        </p>
      </div>

      {/* Contenedor de Filtros exacto a la imagen media_1789932485053.png */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
          <Filter className="w-3.5 h-3.5 text-slate-500" />
          <span>Filtros</span>
        </div>

        {/* 6 Selectores en fila */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Sucursal</label>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todas">Todas</option>
              <option value="Principal">Principal</option>
              <option value="Almacén">Almacén</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Usuario</label>
            <select
              value={usuario}
              onChange={(e) => setUsuario(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Esteffany Cordova">Esteffany Cordova</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Desde</label>
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Hasta</label>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Sesión de caja</label>
            <select
              value={sesion}
              onChange={(e) => setSesion(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todas">Todas</option>
              <option value="#18">#18 - Principal</option>
              <option value="#17">#17 - Secundaria</option>
              <option value="#14">#14 - Mañana</option>
            </select>
          </div>

          <div>
            <label className="block text-[11px] text-slate-500 mb-1">Tipo movimiento</label>
            <select
              value={tipoMov}
              onChange={(e) => setTipoMov(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
            >
              <option value="Todos">Todos</option>
              <option value="Venta">Ventas</option>
              <option value="Ingreso">Ingresos manuales</option>
              <option value="Egreso">Egresos / Gastos</option>
            </select>
          </div>
        </div>

        {/* Fila de Botones idéntica a media_1789932485053.png */}
        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          {/* Toggle: Resumen de caja vs Movimientos */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab('resumen')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'resumen'
                  ? 'bg-[#00a650] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Resumen de caja
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('movimientos')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                activeTab === 'movimientos'
                  ? 'bg-[#00a650] text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Movimientos
            </button>
          </div>

          {/* Aplicar */}
          <button
            type="button"
            className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer"
          >
            Aplicar
          </button>

          {/* Exportar PDF */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 bg-[#f87171] hover:bg-[#ef4444] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>

          {/* Exportar Excel */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#48bb78] hover:bg-[#38a169] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Vista 1: Resumen de Caja */}
      {activeTab === 'resumen' && (
        <div className="space-y-4">
          {/* Tarjetas de Resumen General */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Total Ventas Facturadas</span>
              <span className="text-xl font-black text-slate-900 block font-mono">
                S/ {totalVentas.toFixed(2)}
              </span>
              <span className="text-[11px] text-emerald-600 font-semibold">14 operaciones en el periodo</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Efectivo Total Recibido</span>
              <span className="text-xl font-black text-emerald-600 block font-mono">
                S/ {efectivoTotal.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500">Cobrado directamente en gaveta</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">Pagos Digitales (Yape/POS)</span>
              <span className="text-xl font-black text-blue-600 block font-mono">
                S/ {totalDigitales.toFixed(2)}
              </span>
              <span className="text-[11px] text-slate-500">Acreditados a cuentas bancarias</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-blue-200 bg-blue-50/20 shadow-xs">
              <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block mb-1">Saldo en Gaveta (Caja)</span>
              <span className="text-xl font-black text-blue-900 block font-mono">
                S/ {saldoFinalCaja.toFixed(2)}
              </span>
              <span className="text-[11px] text-blue-700 font-medium">Efectivo + Ingresos - Egresos</span>
            </div>
          </div>

          {/* Desglose por Método de Pago */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
            <h3 className="font-bold text-slate-900 text-sm">Distribución de Ingresos por Método de Pago</h3>

            <div className="space-y-3 text-xs">
              {/* Efectivo */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Efectivo</span>
                  <span className="text-slate-900 font-mono">S/ {efectivoTotal.toFixed(2)} (38.6%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: '38.6%' }}></div>
                </div>
              </div>

              {/* Yape */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Billetera Yape</span>
                  <span className="text-slate-900 font-mono">S/ {yapeTotal.toFixed(2)} (31.6%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-purple-500 rounded-full" style={{ width: '31.6%' }}></div>
                </div>
              </div>

              {/* Plin */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Billetera Plin</span>
                  <span className="text-slate-900 font-mono">S/ {plinTotal.toFixed(2)} (13.5%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '13.5%' }}></div>
                </div>
              </div>

              {/* Tarjetas */}
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-slate-700">Tarjetas POS (Niubiz / Izipay)</span>
                  <span className="text-slate-900 font-mono">S/ {tarjetaTotal.toFixed(2)} (16.3%)</span>
                </div>
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-500 rounded-full" style={{ width: '16.3%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Vista 2: Movimientos Detallados */}
      {activeTab === 'movimientos' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Fecha / Hora</th>
                  <th className="py-3 px-3">Sesión</th>
                  <th className="py-3 px-3">Tipo</th>
                  <th className="py-3 px-3">Método</th>
                  <th className="py-3 px-4">Concepto / Doc</th>
                  <th className="py-3 px-3">Usuario</th>
                  <th className="py-3 px-3 text-right">Ingreso</th>
                  <th className="py-3 px-3 text-right">Egreso</th>
                  <th className="py-3 px-4 text-right">Saldo en Caja</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {consolidatedMovimientos.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {m.fecha}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {m.sesion}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {m.tipo === 'Venta' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Venta
                        </span>
                      ) : m.tipo === 'Ingreso' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          Ingreso
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                          Egreso
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {m.metodo}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {m.concepto}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {m.usuario}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold whitespace-nowrap">
                      {m.ingreso > 0 ? `+ S/ ${m.ingreso.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-rose-600 font-semibold whitespace-nowrap">
                      {m.egreso > 0 ? `- S/ ${m.egreso.toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-right font-mono font-bold text-slate-800 whitespace-nowrap">
                      S/ {m.saldo.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
