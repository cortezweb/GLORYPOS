import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, Plus, FileText, CheckCircle2, AlertCircle, 
  DollarSign, Calendar, Check, X, CreditCard, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function CuentasPorPagarView({ onSelectSubView }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterEstado, setFilterEstado] = useState('Abiertas');
  const [search, setSearch] = useState('');

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [selectedPayItem, setSelectedPayItem] = useState(null);
  const [payMonto, setPayMonto] = useState('');
  const [payMetodo, setPayMetodo] = useState('Efectivo');
  const [paySesion, setPaySesion] = useState('#17');

  // Form nueva cuenta por pagar
  const [formProveedor, setFormProveedor] = useState('');
  const [formComprobante, setFormComprobante] = useState('');
  const [formTotal, setFormTotal] = useState('');
  const [formVencimiento, setFormVencimiento] = useState('');
  const [formNotas, setFormNotas] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadCuentas = async () => {
    try {
      if (db.cuentas_por_pagar) {
        const list = await db.cuentas_por_pagar.toArray();
        setCuentas(list || []);
      }
    } catch (err) {
      console.warn('Error al cargar cuentas por pagar:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  // Métricas de Cuentas por Pagar
  const kpiData = useMemo(() => {
    const saldoPendiente = cuentas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
    const abiertasCount = cuentas.filter(c => Number(c.saldo) > 0).length;
    const vencidosCount = cuentas.filter(c => c.isVencido && Number(c.saldo) > 0).length;

    return {
      saldoPendiente,
      abiertasCount,
      vencidosCount
    };
  }, [cuentas]);

  // Filtrado
  const filteredCuentas = useMemo(() => {
    return cuentas.filter(item => {
      const matchSearch = !search || 
        item.comprobante?.toLowerCase().includes(search.toLowerCase()) ||
        item.proveedor?.toLowerCase().includes(search.toLowerCase());

      let matchEstado = true;
      if (filterEstado === 'Abiertas') {
        matchEstado = Number(item.saldo) > 0;
      } else if (filterEstado === 'Vencidas') {
        matchEstado = item.isVencido && Number(item.saldo) > 0;
      } else if (filterEstado === 'Pagadas') {
        matchEstado = Number(item.saldo) === 0;
      }

      return matchSearch && matchEstado;
    });
  }, [cuentas, search, filterEstado]);

  // Guardar nueva cuenta por pagar
  const handleCreateCuentaPagar = async (e) => {
    e.preventDefault();
    const total = Number(formTotal);
    if (!total || total <= 0 || !formProveedor) return;

    const newRecord = {
      id: `cpp-${Date.now()}`,
      proveedor: formProveedor,
      comprobante: formComprobante || `FC-${Date.now().toString().slice(-4)}`,
      total: total,
      pagado: 0,
      saldo: total,
      fecha_emision: new Date().toLocaleDateString('es-PE'),
      fecha_vencimiento: formVencimiento || '28/09/2026',
      isVencido: false,
      notas: formNotas
    };

    await db.cuentas_por_pagar.add(newRecord);
    showToast(`Cuenta por pagar registrada: S/ ${total.toFixed(2)}`);
    setIsNewModalOpen(false);
    setFormProveedor('');
    setFormComprobante('');
    setFormTotal('');
    setFormVencimiento('');
    setFormNotas('');
    loadCuentas();
  };

  // Registrar pago de cuota
  const handleSavePago = async (e) => {
    e.preventDefault();
    const monto = Number(payMonto);
    if (!monto || monto <= 0 || !selectedPayItem) return;

    const nuevoPagado = (selectedPayItem.pagado || 0) + monto;
    const nuevoSaldo = Math.max(0, (selectedPayItem.total || 0) - nuevoPagado);

    await db.cuentas_por_pagar.update(selectedPayItem.id, {
      pagado: nuevoPagado,
      saldo: nuevoSaldo,
      isVencido: nuevoSaldo > 0 && selectedPayItem.isVencido
    });

    // Registrar egreso en caja
    if (db.egresos_caja) {
      await db.egresos_caja.add({
        id: `eg-${Date.now()}`,
        fecha: new Date().toLocaleString('es-PE'),
        sesion: paySesion,
        categoria: 'Pago a proveedor',
        badgeCategoria: 'Compra',
        proveedor: selectedPayItem.proveedor,
        documento: selectedPayItem.comprobante,
        usuario: 'Esteffany Cordova',
        metodo_pago: payMetodo,
        monto: monto,
        notas: `Abono de cuota a proveedor ${selectedPayItem.proveedor}`
      });
    }

    showToast(`Pago de S/ ${monto.toFixed(2)} registrado con éxito`);
    setSelectedPayItem(null);
    setPayMonto('');
    loadCuentas();
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="cuentas_por_pagar" onSelectTab={onSelectSubView} />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Cuentas por pagar</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Compras a crédito con proveedor: saldo pendiente y pagos registrados
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={filterEstado}
            onChange={(e) => setFilterEstado(e.target.value)}
            className="px-3.5 py-2 text-xs font-bold bg-slate-100 hover:bg-slate-200/80 border-0 rounded-xl text-slate-800 transition cursor-pointer"
          >
            <option value="Abiertas">Abiertas</option>
            <option value="Vencidas">Vencidas</option>
            <option value="Pagadas">Pagadas</option>
            <option value="Todas">Todas</option>
          </select>

          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar proveedor o comprobante"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] transition w-48 sm:w-60"
            />
          </div>

          <button
            onClick={() => setIsNewModalOpen(true)}
            className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Registrar cuenta por pagar</span>
          </button>
        </div>
      </div>

      {/* 3 Metric Cards (Diseño exacto al screenshot media_1789925791162.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Saldo Pendiente */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Saldo pendiente
          </span>
          <span className="text-xl font-black text-slate-900 block font-mono">
            S/ {kpiData.saldoPendiente.toFixed(2)}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">De compras a crédito</span>
        </div>

        {/* Documentos Abiertos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Documentos abiertos
          </span>
          <span className="text-xl font-black text-slate-900 block font-mono">
            {kpiData.abiertasCount}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Facturas por saldar</span>
        </div>

        {/* Vencidos */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
            Vencidos
          </span>
          <span className="text-xl font-black text-rose-600 block font-mono">
            {kpiData.vencidosCount}
          </span>
          <span className="text-[10px] text-slate-500 font-medium">Fuera de plazo</span>
        </div>
      </div>

      {/* Contenido / Estado Vacío o Tabla */}
      {filteredCuentas.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-16 flex flex-col items-center justify-center text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1 max-w-sm">
            <h3 className="font-bold text-slate-800 text-sm">
              No hay cuentas por pagar con los filtros actuales
            </h3>
            <p className="text-xs text-slate-400">
              Las compras a crédito registradas con saldo pendiente aparecerán aquí.
            </p>
          </div>
          <button
            onClick={() => setIsNewModalOpen(true)}
            className="mt-2 px-4 py-2 text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-xl border border-emerald-200/60 transition flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Agregar primera cuenta por pagar</span>
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                  <th className="py-3 px-4">Comprobante</th>
                  <th className="py-3 px-4">Proveedor</th>
                  <th className="py-3 px-3">Emisión</th>
                  <th className="py-3 px-3">Vencimiento</th>
                  <th className="py-3 px-3 text-right">Total Factura</th>
                  <th className="py-3 px-3 text-right">Pagado</th>
                  <th className="py-3 px-3 text-right">Saldo Pendiente</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCuentas.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                      {c.comprobante}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {c.proveedor}
                    </td>
                    <td className="py-3 px-3 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                      {c.fecha_emision}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {c.isVencido ? (
                        <span className="inline-flex items-center gap-1 text-rose-600 font-bold text-[11px]">
                          <AlertCircle className="w-3 h-3" />
                          {c.fecha_vencimiento}
                        </span>
                      ) : (
                        <span className="text-slate-600 font-mono text-[11px]">
                          {c.fecha_vencimiento}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 text-right font-mono font-semibold text-slate-800 whitespace-nowrap">
                      S/ {Number(c.total).toFixed(2)}
                    </td>
                    <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold whitespace-nowrap">
                      S/ {Number(c.pagado).toFixed(2)}
                    </td>
                    <td className={`py-3 px-3 text-right font-mono font-black whitespace-nowrap ${
                      c.saldo > 0 ? 'text-rose-600' : 'text-slate-400'
                    }`}>
                      S/ {Number(c.saldo).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {c.saldo > 0 && (
                        <button
                          onClick={() => { setSelectedPayItem(c); setPayMonto(c.saldo.toString()); }}
                          className="px-3 py-1 text-[11px] font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition shadow-xs"
                        >
                          Pagar
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Registrar Cuenta Por Pagar */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00a650] text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Cuenta por Pagar</h3>
                  <p className="text-[11px] text-slate-500">Compra a crédito con proveedor</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCuentaPagar} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proveedor</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora del Valle S.A.C."
                  value={formProveedor}
                  onChange={(e) => setFormProveedor(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650]"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nro. Comprobante</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. F001-000492"
                    value={formComprobante}
                    onChange={(e) => setFormComprobante(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Monto Total (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="0.00"
                    value={formTotal}
                    onChange={(e) => setFormTotal(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Fecha de Vencimiento</label>
                <input
                  type="date"
                  value={formVencimiento}
                  onChange={(e) => setFormVencimiento(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones</label>
                <textarea
                  rows="2"
                  placeholder="Detalles de la compra a crédito o cuotas pactadas..."
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl font-bold shadow-sm"
                >
                  Guardar Cuenta
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Pagar a Proveedor */}
      {selectedPayItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                  <DollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Pago a Proveedor</h3>
                  <p className="text-[11px] text-rose-800">{selectedPayItem.proveedor} ({selectedPayItem.comprobante})</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedPayItem(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSavePago} className="p-4 space-y-3.5 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl flex justify-between items-center text-slate-700">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Saldo Pendiente</span>
                  <span className="text-base font-black text-rose-600 font-mono">
                    S/ {Number(selectedPayItem.saldo).toFixed(2)}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Facturado</span>
                  <span className="text-xs font-bold text-slate-800 font-mono">
                    S/ {Number(selectedPayItem.total).toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto a Pagar (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  max={selectedPayItem.saldo}
                  required
                  value={payMonto}
                  onChange={(e) => setPayMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Método de Pago</label>
                  <select
                    value={payMetodo}
                    onChange={(e) => setPayMetodo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Efectivo">Efectivo (Caja)</option>
                    <option value="Transferencia BCP">Transferencia BCP</option>
                    <option value="Yape">Yape</option>
                    <option value="Tarjeta">Tarjeta Débito</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sesión de Caja</label>
                  <select
                    value={paySesion}
                    onChange={(e) => setPaySesion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="#17">#17 - Caja Secundaria</option>
                    <option value="#18">#18 - Caja Principal</option>
                    <option value="#14">#14 - Turno Mañana</option>
                  </select>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedPayItem(null)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Procesar Pago
                </button>
              </div>
            </form>
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
