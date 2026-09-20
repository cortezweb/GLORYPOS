import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, DollarSign, 
  Lock, Printer, RefreshCw, AlertTriangle, CheckCircle2, Clock, 
  Calendar, FileText, Filter, ChevronRight, User, ShieldCheck
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import SalesSubNav from './SalesSubNav';

export default function CajaChicaView({ onSelectSubView, onOpenCloseCash, defaultTab = 'mis_cajas' }) {
  const [activeTab, setActiveTab] = useState(defaultTab); // 'mis_cajas' | 'reporte_cajas'
  const [movimientos, setMovimientos] = useState([]);
  const [ventas, setVentas] = useState([]);
  const [dateFilter, setDateFilter] = useState('HOY');
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 15);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const [isNewMovementModalOpen, setIsNewMovementModalOpen] = useState(false);
  const [movementForm, setMovementForm] = useState({
    tipo: 'EGRESO', // INGRESO or EGRESO
    monto: '',
    motivo: '',
    comprobante: ''
  });

  const loadData = async () => {
    const movs = await db.movimientos_caja.reverse().toArray();
    setMovimientos(movs);
    const vts = await db.ventas.toArray();
    setVentas(vts);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Calculate totals
  const fondoApertura = movimientos
    .filter(m => m.tipo === 'APERTURA')
    .reduce((sum, m) => sum + (Number(m.monto) || 0), 0) || 300.00;

  const ventasEfectivo = ventas
    .filter(v => (v.metodo_pago?.toUpperCase() === 'EFECTIVO' || v.metodo_pago === 'Efectivo') && v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const ventasQr = ventas
    .filter(v => (v.metodo_pago?.toUpperCase()?.includes('QR')) && v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const ventasTarjeta = ventas
    .filter(v => (v.metodo_pago?.toUpperCase()?.includes('TARJETA') || v.metodo_pago === 'Tarjeta') && v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const totalIngresosExtra = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);

  const totalEgresos = movimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);

  const totalIngresos = fondoApertura + ventasEfectivo + totalIngresosExtra;
  const efectivoEsperadoEnGaveta = totalIngresos - totalEgresos;

  const handleAddMovement = async (e) => {
    e.preventDefault();
    if (!movementForm.monto || Number(movementForm.monto) <= 0) {
      alert('Por favor ingresa un monto válido');
      return;
    }
    if (!movementForm.motivo.trim()) {
      alert('Por favor ingresa el motivo del movimiento');
      return;
    }

    const newMov = {
      id: `mov-${Date.now()}`,
      fecha: new Date().toISOString(),
      tipo: movementForm.tipo,
      monto: Number(movementForm.monto),
      motivo: movementForm.motivo,
      comprobante: movementForm.comprobante || `REC-${Math.floor(100 + Math.random() * 900)}`,
      responsable: 'Carlos Gutiérrez'
    };

    await db.movimientos_caja.add(newMov);
    await loadData();
    setIsNewMovementModalOpen(false);
    setMovementForm({ tipo: 'EGRESO', monto: '', motivo: '', comprobante: '' });
    syncService.triggerBackgroundSync();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans">
      {/* Sales Sub-navigation Bar */}
      <SalesSubNav currentSubView="caja_chica" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* Tab Switcher: Mis Cajas (Screen 4) vs Reporte de Cajas (Screen 1) */}
        <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              type="button"
              onClick={() => setActiveTab('mis_cajas')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'mis_cajas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <Wallet className="w-3.5 h-3.5 text-blue-600" />
              <span>Mis Cajas (Turnos)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('reporte_cajas')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                activeTab === 'reporte_cajas'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-emerald-600" />
              <span>Reporte de Cajas</span>
            </button>
          </div>

          <div className="hidden sm:flex items-center gap-2">
            <button
              onClick={() => setIsNewMovementModalOpen(true)}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-200"
            >
              <Plus className="w-4 h-4 text-emerald-600" />
              Ingreso / Retiro
            </button>

            <button
              onClick={onOpenCloseCash}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-red-500/20"
            >
              <Lock className="w-4 h-4" />
              Arqueo & Cierre
            </button>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VISTA 1: MIS CAJAS (PANTALLA 4 DEL MOCKUP MÓVIL)                */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'mis_cajas' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header Screen 4 */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-blue-600" />
                  Apertura o Cierre de caja
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Control de turnos activos y registro de arqueos de caja
                </p>
              </div>

              {/* Filtro de Fecha */}
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-400">Filtrar:</span>
                <select
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                  className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                >
                  <option value="HOY">Hoy</option>
                  <option value="AYER">Ayer</option>
                  <option value="SEMANA">Últimos 7 días</option>
                  <option value="TODOS">Todos los turnos</option>
                </select>
              </div>
            </div>

            {/* Shift Cards Grid (Exact Style from Screen 4 in image) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              
              {/* Card Turno Activo (ABIERTO) */}
              <div className="bg-white rounded-3xl border-2 border-emerald-400/80 p-5 shadow-sm space-y-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-50 rounded-bl-full -z-0 pointer-events-none" />

                <div className="relative z-10 flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-900">Caja N° 01</h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-black px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        ABIERTO
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 font-medium mt-0.5">Turno Mañana • Caja Principal</p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold">
                    <Wallet className="w-5 h-5" />
                  </div>
                </div>

                {/* Shift Info List (Exact layout from Screen 4) */}
                <div className="relative z-10 bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-100">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400 font-medium">Creado por:</span>
                    <span className="font-bold text-slate-800 flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-slate-400" />
                      Carlos Gutiérrez
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400 font-medium">Apertura:</span>
                    <span className="font-mono font-bold text-slate-800">Hoy, 08:00 AM</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400 font-medium">Monto inicial:</span>
                    <span className="font-mono font-bold text-slate-800">Bs. {fondoApertura.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-emerald-800 font-black">Efectivo en Gaveta:</span>
                    <span className="font-mono text-base font-black text-emerald-600">
                      Bs. {efectivoEsperadoEnGaveta.toFixed(2)}
                    </span>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="relative z-10 flex flex-wrap gap-2 pt-1">
                  <button
                    onClick={onOpenCloseCash}
                    className="flex-1 py-2 px-3 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 shadow-sm shadow-red-500/20 active:scale-95 cursor-pointer"
                  >
                    <Lock className="w-3.5 h-3.5" />
                    <span>Cerrar Caja</span>
                  </button>

                  <button
                    onClick={() => setActiveTab('reporte_cajas')}
                    className="py-2 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Reporte</span>
                  </button>

                  <button
                    onClick={() => setIsNewMovementModalOpen(true)}
                    className="py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 active:scale-95 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Movimiento</span>
                  </button>
                </div>
              </div>

              {/* Card Turno Pasado (CERRADO) */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs space-y-4 opacity-90 hover:opacity-100 transition">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h2 className="text-base font-black text-slate-800">Caja N° 01</h2>
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        CERRADO
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">Turno Tarde • Ayer</p>
                  </div>

                  <div className="w-10 h-10 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center font-bold">
                    <Lock className="w-5 h-5" />
                  </div>
                </div>

                <div className="bg-slate-50 rounded-2xl p-3.5 space-y-2 text-xs border border-slate-100">
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400 font-medium">Creado por:</span>
                    <span className="font-bold text-slate-700">Carlos Gutiérrez</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400 font-medium">Cierre:</span>
                    <span className="font-mono font-bold text-slate-700">Ayer, 09:30 PM</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-600">
                    <span className="text-slate-400 font-medium">Monto inicial:</span>
                    <span className="font-mono font-bold text-slate-700">Bs. 300.00</span>
                  </div>
                  <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                    <span className="text-slate-700 font-bold">Total Arqueado:</span>
                    <span className="font-mono text-base font-bold text-slate-800">
                      Bs. 2,140.00
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => setActiveTab('reporte_cajas')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Ver Comprobante de Arqueo</span>
                  </button>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ════════════════════════════════════════════════════════════════ */}
        {/* VISTA 2: REPORTE DE CAJAS (PANTALLA 1 DEL MOCKUP MÓVIL)         */}
        {/* ════════════════════════════════════════════════════════════════ */}
        {activeTab === 'reporte_cajas' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header Screen 1 */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                    <FileText className="w-4 h-4" />
                  </div>
                  <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                    Reporte de Cajas
                  </h1>
                </div>

                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Imprimir</span>
                </button>
              </div>

              {/* Filtro de Rango de Fechas (Exacto Screen 1: del: ... al: ...) */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-400">del:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>
                <div className="flex items-center gap-1.5 text-xs text-slate-600">
                  <span className="font-bold text-slate-400">al:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 focus:bg-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={loadData}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1 shadow-xs"
                >
                  <Filter className="w-3 h-3" />
                  Filtrar
                </button>
              </div>
            </div>

            {/* 3 Summary Cards (Exact from Screen 1: Ingresos / Egresos / Saldo) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              
              {/* Card Ingresos */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                    Total Ingresos (+)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center">
                    <ArrowDownLeft className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-slate-900 font-mono tracking-tight">
                  Bs. {totalIngresos.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400">Apertura + ventas + ingresos extras</p>
              </div>

              {/* Card Egresos */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-rose-700">
                    Total Egresos (-)
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center">
                    <ArrowUpRight className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-rose-600 font-mono tracking-tight">
                  - Bs. {totalEgresos.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400">Gastos menores y retiros autorizados</p>
              </div>

              {/* Card Saldo / Efectivo Esperado */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-black uppercase tracking-wider text-blue-700">
                    Saldo Neto en Caja
                  </span>
                  <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Wallet className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-2xl font-black text-blue-600 font-mono tracking-tight">
                  Bs. {efectivoEsperadoEnGaveta.toFixed(2)}
                </div>
                <p className="text-[10px] text-slate-400">Efectivo físico disponible en gaveta</p>
              </div>

            </div>

            {/* Movements List with Badge (+ verde / - rojo) */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <h2 className="font-black text-sm text-slate-900 flex items-center gap-2">
                <Clock className="w-4 h-4 text-slate-500" />
                Detalle de Movimientos de Caja
              </h2>

              <div className="space-y-2">
                {movimientos.map((mov) => {
                  const isEgreso = mov.tipo === 'EGRESO';
                  const isApertura = mov.tipo === 'APERTURA';
                  const horaStr = new Date(mov.fecha).toLocaleTimeString('es-BO', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });

                  return (
                    <div
                      key={mov.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                          isApertura
                            ? 'bg-blue-100 text-blue-700'
                            : isEgreso
                              ? 'bg-rose-100 text-rose-700'
                              : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {isApertura ? <Wallet className="w-4 h-4" /> : isEgreso ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900">{mov.motivo}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${
                              isApertura ? 'bg-blue-100 text-blue-800' : isEgreso ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                            }`}>
                              {mov.tipo}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {horaStr} • Comp: {mov.comprobante || 'N/A'} • Resp: {mov.responsable}
                          </p>
                        </div>
                      </div>

                      <span className={`text-sm font-black font-mono ${
                        isEgreso ? 'text-rose-600' : 'text-emerald-600'
                      }`}>
                        {isEgreso ? '-' : '+'} Bs. {Number(mov.monto).toFixed(2)}
                      </span>
                    </div>
                  );
                })}

                {movimientos.length === 0 && (
                  <p className="text-center py-6 text-slate-400 text-xs italic">
                    No hay movimientos registrados para el rango seleccionado.
                  </p>
                )}
              </div>
            </div>

          </div>
        )}

      </main>

      {/* Modal: Registrar Movimiento de Caja */}
      {isNewMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-slate-900">Registrar Movimiento de Caja</h3>
            
            <form onSubmit={handleAddMovement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, tipo: 'EGRESO' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      movementForm.tipo === 'EGRESO'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Egreso / Retiro (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, tipo: 'INGRESO' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      movementForm.tipo === 'INGRESO'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    Ingreso Extra (+)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monto (Bs.) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  placeholder="0.00"
                  value={movementForm.monto}
                  onChange={(e) => setMovementForm({ ...movementForm, monto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo / Concepto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de rollos térmicos, pago taxi..."
                  value={movementForm.motivo}
                  onChange={(e) => setMovementForm({ ...movementForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">N° Comprobante / Recibo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. REC-091"
                  value={movementForm.comprobante}
                  onChange={(e) => setMovementForm({ ...movementForm, comprobante: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMovementModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  Guardar Movimiento
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
