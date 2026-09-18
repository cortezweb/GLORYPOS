import React, { useState, useEffect } from 'react';
import { 
  Wallet, ArrowUpRight, ArrowDownLeft, Plus, DollarSign, 
  Lock, Printer, RefreshCw, AlertTriangle, CheckCircle2, Clock, Calendar 
} from 'lucide-react';
import { db } from '../../db/dexie';
import SalesSubNav from './SalesSubNav';

export default function CajaChicaView({ onSelectSubView, onOpenCloseCash }) {
  const [movimientos, setMovimientos] = useState([]);
  const [ventas, setVentas] = useState([]);
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
    .filter(v => v.metodo_pago === 'Efectivo' && v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const ventasQr = ventas
    .filter(v => (v.metodo_pago === 'QR Simple' || v.metodo_pago === 'QR') && v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const ventasTarjeta = ventas
    .filter(v => v.metodo_pago === 'Tarjeta' && v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const totalIngresosExtra = movimientos
    .filter(m => m.tipo === 'INGRESO')
    .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);

  const totalEgresos = movimientos
    .filter(m => m.tipo === 'EGRESO')
    .reduce((sum, m) => sum + (Number(m.monto) || 0), 0);

  // Expected Physical Cash in Drawer
  const efectivoEsperadoEnGaveta = fondoApertura + ventasEfectivo + totalIngresosExtra - totalEgresos;

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
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Sales Sub-navigation Bar */}
      <SalesSubNav currentSubView="caja_chica" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#2563eb]" />
                Caja Chica & Control de Turno
              </h1>
              <span className="bg-emerald-100 text-emerald-800 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                TURNO ABIERTO
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">
              Caja N° 01 • Cajero: Carlos Gutiérrez • Inicio de turno: Hoy 08:00 AM
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsNewMovementModalOpen(true)}
              className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-gray-300/80"
            >
              <Plus className="w-4 h-4" />
              Ingreso / Retiro
            </button>

            <button
              onClick={onOpenCloseCash}
              className="px-4 py-2 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-700 hover:to-rose-800 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-red-500/20"
            >
              <Lock className="w-4 h-4" />
              Arqueo & Cierre de Turno
            </button>
          </div>
        </div>

        {/* Hero Cash Breakdown Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Main Expected Cash */}
          <div className="sm:col-span-2 lg:col-span-2 p-4 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 text-white rounded-3xl shadow-md space-y-2">
            <div className="flex items-center justify-between text-white/80">
              <span className="text-xs font-bold uppercase tracking-wider">Efectivo Esperado en Gaveta</span>
              <Wallet className="w-5 h-5 text-white/70" />
            </div>
            <div className="text-3xl sm:text-4xl font-black tracking-tight">
              Bs. {efectivoEsperadoEnGaveta.toFixed(2)}
            </div>
            <p className="text-xs text-white/80 font-medium pt-1">
              Fondo inicial (Bs. {fondoApertura.toFixed(2)}) + Ventas efectivo (Bs. {ventasEfectivo.toFixed(2)}) - Egresos (Bs. {totalEgresos.toFixed(2)})
            </p>
          </div>

          {/* QR Simple Breakdown */}
          <div className="p-4 bg-white border border-gray-200 rounded-3xl shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-purple-700 block">
              Ventas por QR Simple
            </span>
            <div className="text-2xl font-black text-gray-900">
              Bs. {ventasQr.toFixed(2)}
            </div>
            <span className="text-[11px] text-gray-500 block">
              Directo a cuenta bancaria
            </span>
          </div>

          {/* POS Card Breakdown */}
          <div className="p-4 bg-white border border-gray-200 rounded-3xl shadow-2xs space-y-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Ventas Tarjeta POS
            </span>
            <div className="text-2xl font-black text-gray-900">
              Bs. {ventasTarjeta.toFixed(2)}
            </div>
            <span className="text-[11px] text-gray-500 block">
              Débito & Crédito en terminal
            </span>
          </div>
        </div>

        {/* Shift Detail Statistics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="p-3 bg-white border border-gray-200 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">Fondo Apertura</span>
            <span className="text-base font-bold text-gray-800">Bs. {fondoApertura.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-white border border-gray-200 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Egresos / Gastos</span>
            <span className="text-base font-bold text-red-600">- Bs. {totalEgresos.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-white border border-gray-200 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">Ingresos Extra</span>
            <span className="text-base font-bold text-emerald-600">+ Bs. {totalIngresosExtra.toFixed(2)}</span>
          </div>
          <div className="p-3 bg-white border border-gray-200 rounded-2xl text-center">
            <span className="text-[10px] font-bold uppercase text-gray-400 block">Comprobantes Turno</span>
            <span className="text-base font-bold text-indigo-600">{ventas.length} transacciones</span>
          </div>
        </div>

        {/* Movements History */}
        <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-2xs space-y-3">
          <div className="flex items-center justify-between border-b border-gray-100 pb-3">
            <h2 className="font-bold text-sm text-gray-900 flex items-center gap-2">
              <Clock className="w-4 h-4 text-gray-500" />
              Movimientos de Caja del Turno
            </h2>
            <button
              onClick={() => window.print()}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1"
            >
              <Printer className="w-3.5 h-3.5" />
              Imprimir Arqueo X
            </button>
          </div>

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
                  className="flex items-center justify-between p-3 rounded-xl bg-gray-50/80 border border-gray-200/80 text-xs"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold shrink-0 ${
                      isApertura
                        ? 'bg-blue-100 text-blue-700'
                        : isEgreso
                          ? 'bg-red-100 text-red-700'
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      {isApertura ? <Wallet className="w-4 h-4" /> : isEgreso ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-gray-900">{mov.motivo}</span>
                        <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                          isApertura ? 'bg-blue-100 text-blue-800' : isEgreso ? 'bg-red-100 text-red-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {mov.tipo}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-400 mt-0.5">
                        {horaStr} • Comp: {mov.comprobante || 'N/A'} • Resp: {mov.responsable}
                      </p>
                    </div>
                  </div>

                  <span className={`text-sm font-black ${
                    isEgreso ? 'text-red-600' : 'text-emerald-700'
                  }`}>
                    {isEgreso ? '-' : '+'} Bs. {Number(mov.monto).toFixed(2)}
                  </span>
                </div>
              );
            })}

            {movimientos.length === 0 && (
              <p className="text-center py-6 text-gray-400 text-xs italic">
                No hay movimientos registrados en este turno.
              </p>
            )}
          </div>
        </div>
      </main>

      {/* Modal: Registrar Movimiento de Caja */}
      {isNewMovementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-200 space-y-4 animate-scaleUp">
            <h3 className="text-base font-bold text-gray-900">Registrar Movimiento de Caja</h3>
            
            <form onSubmit={handleAddMovement} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Tipo de Movimiento</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setMovementForm({ ...movementForm, tipo: 'EGRESO' })}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      movementForm.tipo === 'EGRESO'
                        ? 'bg-red-50 text-red-700 border-red-300'
                        : 'bg-gray-50 text-gray-600 border-gray-200'
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
                        : 'bg-gray-50 text-gray-600 border-gray-200'
                    }`}
                  >
                    Ingreso Extra (+)
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Monto (Bs.) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="0.1"
                  required
                  placeholder="0.00"
                  value={movementForm.monto}
                  onChange={(e) => setMovementForm({ ...movementForm, monto: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs font-bold text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">Motivo / Concepto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Compra de rollos térmicos, pago taxi..."
                  value={movementForm.motivo}
                  onChange={(e) => setMovementForm({ ...movementForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">N° Comprobante / Recibo (opcional)</label>
                <input
                  type="text"
                  placeholder="Ej. REC-091"
                  value={movementForm.comprobante}
                  onChange={(e) => setMovementForm({ ...movementForm, comprobante: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-900 focus:bg-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewMovementModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition"
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
