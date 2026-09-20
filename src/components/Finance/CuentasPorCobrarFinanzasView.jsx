import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, AlertCircle, CheckCircle2, DollarSign, Calendar, 
  FileText, ArrowUpRight, Check, X, ShieldAlert, CreditCard 
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function CuentasPorCobrarFinanzasView({ onSelectSubView }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('Abiertas');
  const [search, setSearch] = useState('');

  // Modales
  const [selectedCobrarItem, setSelectedCobrarItem] = useState(null);
  const [cobroMonto, setCobroMonto] = useState('');
  const [cobroMetodo, setCobroMetodo] = useState('Efectivo');
  const [cobroDestino, setCobroDestino] = useState('Caja Principal');
  
  const [selectedConfirmBN, setSelectedConfirmBN] = useState(null);
  const [bnNroOperacion, setBnNroOperacion] = useState('');

  const [selectedEstadoCuenta, setSelectedEstadoCuenta] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadCuentas = async () => {
    try {
      if (db.cuentas_por_cobrar) {
        const list = await db.cuentas_por_cobrar.toArray();
        setCuentas(list || []);
      }
    } catch (err) {
      console.warn('Error al cargar cuentas por cobrar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  // Métricas calculadas exactamente
  const kpiData = useMemo(() => {
    const saldoDirecto = cuentas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
    const spotPendiente = cuentas
      .filter(c => c.spot_status === 'pending')
      .reduce((acc, c) => acc + (Number(c.spot_bn) || 0), 0);
    const abiertasCount = cuentas.filter(c => c.estado === 'Abiertas' || c.estado === 'Abierta').length;
    const vencidosCount = cuentas.filter(c => c.isVencido).length;
    const bnPorConfirmarCount = cuentas.filter(c => c.spot_status === 'pending').length;

    return {
      saldoDirecto,
      spotPendiente,
      abiertasCount,
      vencidosCount,
      bnPorConfirmarCount
    };
  }, [cuentas]);

  // Filtrado de tabla
  const filteredCuentas = useMemo(() => {
    return cuentas.filter(item => {
      const matchSearch = !search || 
        item.comprobante?.toLowerCase().includes(search.toLowerCase()) ||
        item.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
        item.ruc_nit?.includes(search);

      let matchEstado = true;
      if (filterEstado === 'Abiertas') {
        matchEstado = item.estado === 'Abierta' || item.estado === 'Abiertas';
      } else if (filterEstado === 'Vencidas') {
        matchEstado = item.isVencido;
      } else if (filterEstado === 'Cobradas') {
        matchEstado = item.saldo === 0 && item.spot_status !== 'pending';
      }

      return matchSearch && matchEstado;
    });
  }, [cuentas, search, filterEstado]);

  // Manejar Cobro
  const handleSaveCobro = async (e) => {
    e.preventDefault();
    const monto = Number(cobroMonto);
    if (!monto || monto <= 0 || !selectedCobrarItem) return;

    const nuevoCobrado = (selectedCobrarItem.cobrado || 0) + monto;
    const nuevoSaldo = Math.max(0, (selectedCobrarItem.total || 0) - nuevoCobrado);

    await db.cuentas_por_cobrar.update(selectedCobrarItem.id, {
      cobrado: nuevoCobrado,
      saldo: nuevoSaldo,
      estado: nuevoSaldo === 0 && selectedCobrarItem.spot_status !== 'pending' ? 'Cobrada' : 'Abierta',
      isVencido: nuevoSaldo > 0 && selectedCobrarItem.isVencido
    });

    // Registrar en Ingresos de Caja si es a caja
    if (db.ingresos_caja) {
      await db.ingresos_caja.add({
        id: `ing-${Date.now()}`,
        fecha: new Date().toLocaleString('es-PE'),
        sesion: '#18',
        categoria: 'Cobro de crédito',
        badgeCategoria: 'Venta',
        documento: selectedCobrarItem.comprobante,
        usuario: 'Esteffany Cordova',
        metodo_pago: cobroMetodo,
        monto: monto,
        notas: `Cobro cuota cliente ${selectedCobrarItem.cliente_nombre}`
      });
    }

    showToast(`Cobro registrado: S/ ${monto.toFixed(2)} (${cobroMetodo})`);
    setSelectedCobrarItem(null);
    setCobroMonto('');
    loadCuentas();
  };

  // Manejar Confirmación SPOT Banco de la Nación
  const handleConfirmSPOT = async (e) => {
    e.preventDefault();
    if (!selectedConfirmBN) return;

    await db.cuentas_por_cobrar.update(selectedConfirmBN.id, {
      spot_status: 'confirmed',
      canConfirmBN: false
    });

    showToast(`Detracción SPOT BN para ${selectedConfirmBN.comprobante} confirmada con éxito`);
    setSelectedConfirmBN(null);
    setBnNroOperacion('');
    loadCuentas();
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="cuentas_por_cobrar" onSelectTab={onSelectSubView} />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Cuentas por cobrar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Cobros de ventas a crédito (cuotas), saldo pendiente y detracción SPOT
          </p>
        </div>

        {/* Filtro y Búsqueda Header */}
        <div className="flex items-center gap-3">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border-0 rounded-xl text-slate-800 transition cursor-pointer"
          >
            <option value="Abiertas">Abiertas</option>
            <option value="Vencidas">Vencidas</option>
            <option value="Cobradas">Cobradas</option>
            <option value="Todas">Todas</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar cliente o compr"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] transition w-48 sm:w-64"
            />
          </div>
        </div>
      </div>

      {/* 5 KPI Metric Cards (Diseño exacto al screenshot media_1789925791170.png) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {/* Saldo Directo */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Saldo directo
          </span>
          <span className="text-xl font-black text-slate-900 block font-mono">
            S/ {kpiData.saldoDirecto.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">De cuotas pendientes</span>
        </div>

        {/* SPOT Pendiente BN */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            SPOT pendiente BN
          </span>
          <span className="text-xl font-black text-blue-700 block font-mono">
            S/ {kpiData.spotPendiente.toFixed(2)}
          </span>
          <span className="text-[10px] text-blue-600 font-medium">Detracciones en trámite</span>
        </div>

        {/* Documentos Abiertos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Documentos abiertos
          </span>
          <span className="text-xl font-black text-slate-900 block font-mono">
            {kpiData.abiertasCount}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">En gestión de cobro</span>
        </div>

        {/* Vencidos */}
        <div className="bg-white p-4 rounded-2xl border border-rose-200/80 bg-rose-50/20 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-500 block mb-1">
            Vencidos
          </span>
          <span className="text-xl font-black text-rose-600 block font-mono">
            {kpiData.vencidosCount}
          </span>
          <span className="text-[10px] text-rose-500 font-medium">Requieren seguimiento</span>
        </div>

        {/* BN por confirmar */}
        <div className="bg-white p-4 rounded-2xl border border-amber-200/80 bg-amber-50/20 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block mb-1">
            BN por confirmar
          </span>
          <span className="text-xl font-black text-amber-700 block font-mono">
            {kpiData.bnPorConfirmarCount}
          </span>
          <span className="text-[10px] text-amber-600 font-medium">Comprobante depósito BN</span>
        </div>
      </div>

      {/* Tabla de Cuentas por Cobrar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Comprobante</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-3">Vencimiento</th>
                <th className="py-3 px-3">Cuotas</th>
                <th className="py-3 px-3 text-right">Neto / Total</th>
                <th className="py-3 px-3 text-right">Cobrado</th>
                <th className="py-3 px-3 text-right">Saldo</th>
                <th className="py-3 px-3 text-right">SPOT BN</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCuentas.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No hay comprobantes de cuentas por cobrar para mostrar.
                  </td>
                </tr>
              ) : (
                filteredCuentas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {c.comprobante}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{c.cliente_nombre}</div>
                      <div className="text-[10px] text-slate-400 font-mono">RUC: {c.ruc_nit}</div>
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.isVencido ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <AlertCircle className="w-3 h-3" />
                          {c.fecha_vencimiento}
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[11px] font-mono">
                          {c.fecha_vencimiento}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {c.cuotas}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                      S/ {Number(c.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold whitespace-nowrap">
                      S/ {Number(c.cobrado).toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-black whitespace-nowrap ${
                      c.saldo > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      S/ {Number(c.saldo).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold whitespace-nowrap text-blue-700">
                      {c.spot_bn > 0 ? `S/ ${Number(c.spot_bn).toFixed(2)}` : '—'}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <div className="flex items-center justify-center gap-1.5">
                        {c.spot_status === 'pending' && (
                          <button
                            onClick={() => { setSelectedConfirmBN(c); setBnNroOperacion(''); }}
                            className="px-2.5 py-1 text-[11px] font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition border border-blue-200/60"
                          >
                            Confirmar BN
                          </button>
                        )}

                        {c.saldo > 0 && (
                          <button
                            onClick={() => { setSelectedCobrarItem(c); setCobroMonto(c.saldo.toString()); }}
                            className="px-2.5 py-1 text-[11px] font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-lg transition shadow-xs"
                          >
                            Cobrar
                          </button>
                        )}

                        <button
                          onClick={() => setSelectedEstadoCuenta(c)}
                          className="px-2 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition"
                          title="Ver estado de cuenta"
                        >
                          Estado cuenta
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Registrar Cobro */}
      {selectedCobrarItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00a650] text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Cobro de Venta</h3>
                  <p className="text-[11px] text-emerald-800">{selectedCobrarItem.comprobante} - {selectedCobrarItem.cliente_nombre}</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCobrarItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCobro} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Pendiente</span>
                  <span className="text-base font-black text-rose-600 font-mono">
                    S/ {Number(selectedCobrarItem.saldo).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Facturado</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    S/ {Number(selectedCobrarItem.total).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto a Cobrar (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedCobrarItem.saldo}
                  required
                  value={cobroMonto}
                  onChange={(e) => setCobroMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
                  <select
                    value={cobroMetodo}
                    onChange={(e) => setCobroMetodo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Transferencia BCP">Transferencia BCP</option>
                    <option value="Tarjeta">Tarjeta POS</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Destino del Fondo</label>
                  <select
                    value={cobroDestino}
                    onChange={(e) => setCobroDestino(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Caja Principal">Caja Principal</option>
                    <option value="Cuenta BCP">Cuenta BCP</option>
                    <option value="Billetera Digital">Billetera Digital</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedCobrarItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl font-bold shadow-sm"
                >
                  Procesar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Confirmar SPOT Banco de la Nación */}
      {selectedConfirmBN && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Confirmar Detracción SPOT BN</h3>
                  <p className="text-[11px] text-blue-800">Depósito en cuenta Banco de la Nación</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedConfirmBN(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSPOT} className="p-4 space-y-3.5 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Comprobante:</span>
                  <span className="font-bold text-slate-800">{selectedConfirmBN.comprobante}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-800">{selectedConfirmBN.cliente_nombre}</span>
                </div>
                <div className="flex justify-between border-t border-blue-100 pt-1">
                  <span className="text-slate-500">Monto SPOT BN:</span>
                  <span className="font-black text-blue-700 font-mono text-sm">S/ {Number(selectedConfirmBN.spot_bn).toFixed(2)}</span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nro. de Operación Banco de la Nación</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. OP-BN-9823410"
                  value={bnNroOperacion}
                  onChange={(e) => setBnNroOperacion(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  autoFocus
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedConfirmBN(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Confirmar Depósito BN
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Estado de Cuenta */}
      {selectedEstadoCuenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Estado de Cuenta de Cliente
              </h3>
              <button 
                onClick={() => setSelectedEstadoCuenta(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="font-bold text-slate-900">{selectedEstadoCuenta.cliente_nombre}</div>
              <div className="text-[11px] text-slate-500">RUC: {selectedEstadoCuenta.ruc_nit}</div>
              <div className="border-t border-slate-200 my-2 pt-2 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Comprobante:</span>
                  <span className="font-semibold text-slate-800">{selectedEstadoCuenta.comprobante}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Venta:</span>
                  <span className="font-semibold text-slate-800">S/ {Number(selectedEstadoCuenta.total).toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Total Cobrado:</span>
                  <span className="font-semibold text-emerald-600">S/ {Number(selectedEstadoCuenta.cobrado).toFixed(2)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1.5 font-bold">
                  <span className="text-slate-700">Saldo Por Cobrar:</span>
                  <span className="text-rose-600 font-mono text-sm">S/ {Number(selectedEstadoCuenta.saldo).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedEstadoCuenta(null)}
              className="w-full py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
            >
              Cerrar
            </button>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
