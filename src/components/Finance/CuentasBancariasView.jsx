import React, { useState, useEffect, useMemo } from 'react';
import { 
  Building2, CreditCard, Smartphone, Plus, Edit2, ArrowRightLeft, 
  Search, ArrowUpRight, ArrowDownRight, Check, X, ShieldCheck, MoreVertical, Wallet
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function CuentasBancariasView({ onSelectSubView }) {
  const [cuentas, setCuentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCuentaFilter, setSelectedCuentaFilter] = useState('Todas');
  const [searchMov, setSearchMov] = useState('');
  
  // Modales
  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState(null);

  // Form states
  const [formNombre, setFormNombre] = useState('');
  const [formEntidad, setFormEntidad] = useState('');
  const [formNumero, setFormNumero] = useState('');
  const [formTipo, setFormTipo] = useState('Bancaria');
  const [formSaldo, setFormSaldo] = useState('');
  const [formMoneda, setFormMoneda] = useState('PEN');
  const [toastMsg, setToastMsg] = useState(null);

  // Transfer Form states
  const [transferOrigen, setTransferOrigen] = useState('');
  const [transferDestino, setTransferDestino] = useState('');
  const [transferMonto, setTransferMonto] = useState('');
  const [transferRef, setTransferRef] = useState('');

  // Movimientos bancarios simulados basados en las transacciones
  const [movimientos, setMovimientos] = useState([
    { id: 'mb-1', fecha: '20/09/2026, 09:30', cuenta: 'Billetera Yape', tipo: 'Abono', ref: 'Cobro Venta NV001-00000457', monto: 210.00, saldo_despues: 211415.07 },
    { id: 'mb-2', fecha: '19/09/2026, 17:15', cuenta: 'Cuenta bancaria', tipo: 'Abono', ref: 'Transferencia cliente Bashua', monto: 4451.04, saldo_despues: 24063.00 },
    { id: 'mb-3', fecha: '18/09/2026, 14:20', cuenta: 'Terminal tarjetas', tipo: 'Abono', ref: 'Liquidación Niubiz lote 048', monto: 1250.00, saldo_despues: 8471.61 },
    { id: 'mb-4', fecha: '17/09/2026, 18:00', cuenta: 'Cuenta bancaria', tipo: 'Retiro', ref: 'Pago Proveedor PSG F001-458', monto: -1500.00, saldo_despues: 19611.96 },
    { id: 'mb-5', fecha: '16/09/2026, 11:40', cuenta: 'Billetera Plin', tipo: 'Abono', ref: 'Cobro QR Pedido #124', monto: 96.50, saldo_despues: 96337.51 }
  ]);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadCuentas = async () => {
    try {
      if (db.cuentas_bancarias) {
        const list = await db.cuentas_bancarias.toArray();
        setCuentas(list || []);
      }
    } catch (err) {
      console.warn('Error al cargar cuentas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCuentas();
  }, []);

  const totalSaldoGlobal = useMemo(() => {
    return cuentas.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0);
  }, [cuentas]);

  const handleSaveAccount = async (e) => {
    e.preventDefault();
    if (!formNombre || !formEntidad) return;

    if (editingAccount) {
      // Editar
      await db.cuentas_bancarias.update(editingAccount.id, {
        nombre: formNombre,
        entidad: formEntidad,
        numero: formNumero,
        tipo: formTipo,
        saldo: Number(formSaldo) || 0,
        moneda: formMoneda
      });
      showToast('Cuenta actualizada exitosamente');
    } else {
      // Crear nueva
      const newAcc = {
        id: `cb-${Date.now()}`,
        nombre: formNombre,
        entidad: formEntidad,
        numero: formNumero,
        tipo: formTipo,
        saldo: Number(formSaldo) || 0,
        moneda: formMoneda,
        estado: 'Activa'
      };
      await db.cuentas_bancarias.add(newAcc);
      showToast('Nueva cuenta bancaria registrada');
    }

    setIsNewAccountModalOpen(false);
    setEditingAccount(null);
    setFormNombre('');
    setFormEntidad('');
    setFormNumero('');
    setFormSaldo('');
    loadCuentas();
  };

  const handleOpenEdit = (acc) => {
    setEditingAccount(acc);
    setFormNombre(acc.nombre);
    setFormEntidad(acc.entidad);
    setFormNumero(acc.numero || '');
    setFormTipo(acc.tipo || 'Bancaria');
    setFormSaldo(acc.saldo?.toString() || '0');
    setFormMoneda(acc.moneda || 'PEN');
    setIsNewAccountModalOpen(true);
  };

  const handleExecuteTransfer = async (e) => {
    e.preventDefault();
    const monto = Number(transferMonto);
    if (!monto || monto <= 0 || !transferOrigen || !transferDestino || transferOrigen === transferDestino) {
      showToast('Seleccione cuentas distintas y un monto válido');
      return;
    }

    const cOrigen = cuentas.find(c => c.id === transferOrigen);
    const cDestino = cuentas.find(c => c.id === transferDestino);

    if (cOrigen && cDestino) {
      const nuevoSaldoOrigen = cOrigen.saldo - monto;
      const nuevoSaldoDestino = cDestino.saldo + monto;

      await db.cuentas_bancarias.update(cOrigen.id, { saldo: nuevoSaldoOrigen });
      await db.cuentas_bancarias.update(cDestino.id, { saldo: nuevoSaldoDestino });

      const newMov = {
        id: `mb-${Date.now()}`,
        fecha: new Date().toLocaleString('es-PE'),
        cuenta: `${cOrigen.nombre} → ${cDestino.nombre}`,
        tipo: 'Transferencia',
        ref: transferRef || 'Traspaso interno de fondos',
        monto: monto,
        saldo_despues: nuevoSaldoDestino
      };
      setMovimientos([newMov, ...movimientos]);

      showToast(`Transferidos S/ ${monto.toFixed(2)} de ${cOrigen.nombre} a ${cDestino.nombre}`);
      setIsTransferModalOpen(false);
      setTransferMonto('');
      setTransferRef('');
      loadCuentas();
    }
  };

  const filteredMovimientos = useMemo(() => {
    return movimientos.filter(m => {
      const matchSearch = !searchMov || 
        m.ref.toLowerCase().includes(searchMov.toLowerCase()) ||
        m.cuenta.toLowerCase().includes(searchMov.toLowerCase());
      const matchCuenta = selectedCuentaFilter === 'Todas' || m.cuenta.includes(selectedCuentaFilter);
      return matchSearch && matchCuenta;
    });
  }, [movimientos, searchMov, selectedCuentaFilter]);

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="cuentas_bancarias" onSelectTab={onSelectSubView} />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Cuentas Bancarias</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión de cuentas y movimientos
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="px-3.5 py-2.5 bg-slate-100 hover:bg-slate-200/80 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transferir entre cuentas</span>
          </button>

          <button
            onClick={() => {
              setEditingAccount(null);
              setFormNombre('');
              setFormEntidad('');
              setFormNumero('');
              setFormSaldo('');
              setIsNewAccountModalOpen(true);
            }}
            className="px-4 py-2.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cuenta</span>
          </button>
        </div>
      </div>

      {/* Grid de Tarjetas de Cuentas (Diseño idéntico a media_1789926163888.png) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cuentas.map((acc) => {
          const isYape = acc.entidad?.toLowerCase().includes('yape') || acc.nombre?.toLowerCase().includes('yape');
          const isPlin = acc.entidad?.toLowerCase().includes('plin') || acc.nombre?.toLowerCase().includes('plin');
          const isBCP = acc.entidad?.toLowerCase().includes('bcp');
          const isPOS = acc.tipo === 'Tarjeta' || acc.nombre?.toLowerCase().includes('tarjetas');

          return (
            <div 
              key={acc.id}
              className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow relative overflow-hidden group"
            >
              {/* Header de la tarjeta */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-700 px-2 py-0.5 bg-slate-100 rounded-md">
                    {acc.nombre}
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                    {acc.estado || 'Activa'}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenEdit(acc)}
                  className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  title="Editar cuenta"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Información central / Entidad y número */}
              <div className="space-y-1 my-1">
                <div className="flex items-center gap-2">
                  {isBCP && <Building2 className="w-4 h-4 text-blue-600" />}
                  {isPOS && <CreditCard className="w-4 h-4 text-amber-600" />}
                  {(isYape || isPlin) && <Smartphone className="w-4 h-4 text-purple-600" />}
                  <span className="font-bold text-slate-800 text-sm">
                    {acc.entidad}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {acc.numero}
                </div>
              </div>

              {/* Saldo de la tarjeta */}
              <div className="mt-4 pt-3 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Saldo Disponible
                </span>
                <span className="text-xl font-black text-slate-900 tracking-tight font-mono">
                  {acc.moneda || 'PEN'} {Number(acc.saldo || 0).toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Historial de Movimientos de Cuentas */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Movimientos y Conciliación Bancaria</h3>
            <p className="text-xs text-slate-500">Registro en tiempo real de abonos de ventas, cobros y traslados.</p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar movimiento..."
                value={searchMov}
                onChange={(e) => setSearchMov(e.target.value)}
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650]"
              />
            </div>

            <select
              value={selectedCuentaFilter}
              onChange={(e) => setSelectedCuentaFilter(e.target.value)}
              className="px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-700"
            >
              <option value="Todas">Todas las cuentas</option>
              {cuentas.map(c => (
                <option key={c.id} value={c.nombre}>{c.nombre} ({c.entidad})</option>
              ))}
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-3">Cuenta Destino / Origen</th>
                <th className="py-3 px-3">Tipo Movimiento</th>
                <th className="py-3 px-4">Referencia / Motivo</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-right">Saldo Resultante</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredMovimientos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                    {m.fecha}
                  </td>
                  <td className="py-3 px-3 font-semibold text-slate-800 whitespace-nowrap">
                    {m.cuenta}
                  </td>
                  <td className="py-3 px-3 whitespace-nowrap">
                    {m.tipo === 'Abono' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        Abono
                      </span>
                    ) : m.tipo === 'Retiro' ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                        Retiro
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                        Transferencia
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 font-medium">
                    {m.ref}
                  </td>
                  <td className={`py-3 px-4 text-right font-black whitespace-nowrap font-mono text-xs ${
                    m.monto >= 0 ? 'text-emerald-600' : 'text-rose-600'
                  }`}>
                    {m.monto >= 0 ? `+ S/ ${Number(m.monto).toFixed(2)}` : `- S/ ${Math.abs(Number(m.monto)).toFixed(2)}`}
                  </td>
                  <td className="py-3 px-4 text-right font-mono font-semibold text-slate-700 whitespace-nowrap">
                    S/ {Number(m.saldo_despues).toLocaleString('es-PE', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva / Editar Cuenta */}
      {isNewAccountModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00a650] text-white flex items-center justify-center font-bold">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingAccount ? 'Editar Cuenta Financiera' : 'Registrar Nueva Cuenta'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Bancos, tarjetas POS o billeteras electrónicas</p>
                </div>
              </div>
              <button 
                onClick={() => setIsNewAccountModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAccount} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Descriptivo</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. BCP Empresa / Billetera Yape"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Cuenta</label>
                  <select
                    value={formTipo}
                    onChange={(e) => setFormTipo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="Bancaria">Cuenta Bancaria</option>
                    <option value="Billetera">Billetera Digital (Yape/Plin)</option>
                    <option value="Tarjeta">Terminal Tarjetas POS</option>
                    <option value="Efectivo">Caja Chica</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Entidad Financiera</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. BCP, BBVA, Yape, Niubiz"
                    value={formEntidad}
                    onChange={(e) => setFormEntidad(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Nro Cuenta / Celular</label>
                  <input
                    type="text"
                    placeholder="546746... o 987654321"
                    value={formNumero}
                    onChange={(e) => setFormNumero(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Moneda</label>
                  <select
                    value={formMoneda}
                    onChange={(e) => setFormMoneda(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="PEN">PEN - Soles (S/)</option>
                    <option value="BOB">BOB - Bolivianos (Bs.)</option>
                    <option value="USD">USD - Dólares ($)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Saldo {editingAccount ? 'Actual' : 'Inicial'}</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formSaldo}
                  onChange={(e) => setFormSaldo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-base font-black text-slate-900"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewAccountModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl font-bold shadow-sm"
                >
                  {editingAccount ? 'Actualizar Cuenta' : 'Guardar Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transferencia entre Cuentas */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-blue-50 border-b border-blue-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Transferir Fondos entre Cuentas</h3>
                  <p className="text-[11px] text-blue-800">Traspaso interno de saldos y conciliación</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExecuteTransfer} className="p-4 space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuenta Origen</label>
                  <select
                    value={transferOrigen}
                    onChange={(e) => setTransferOrigen(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">Seleccionar...</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (S/ {c.saldo})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cuenta Destino</label>
                  <select
                    value={transferDestino}
                    onChange={(e) => setTransferDestino(e.target.value)}
                    required
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                  >
                    <option value="">Seleccionar...</option>
                    {cuentas.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre} (S/ {c.saldo})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto a Transferir (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={transferMonto}
                  onChange={(e) => setTransferMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-slate-900"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Referencia u Operación</label>
                <input
                  type="text"
                  placeholder="Ej. OP-482910 Traslado de caja fuerte"
                  value={transferRef}
                  onChange={(e) => setTransferRef(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Ejecutar Transferencia
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
