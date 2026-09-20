import React, { useState, useEffect } from 'react';
import { 
  DollarSign, Search, Plus, User, Phone, CheckCircle2, 
  Calendar, AlertCircle, Clock, ArrowRight, Printer, X
} from 'lucide-react';
import { db } from '../../db/dexie';
import SalesSubNav from './SalesSubNav';

const DEFAULT_CUENTAS = [
  {
    id: 'cpc-1',
    cliente_id: 'cli-2',
    cliente_nombre: 'Doña Rosita Mercado',
    nit_ci: '4892019',
    telefono: '78054321',
    total_deuda: 450.00,
    saldo_pendiente: 250.00,
    fecha_emision: '2026-08-10',
    fecha_vencimiento: '2026-09-10',
    dias_credito: 30,
    estado: 'VIGENTE'
  },
  {
    id: 'cpc-2',
    cliente_id: 'cli-1',
    cliente_nombre: 'Empresa Constructora Illimani S.R.L.',
    nit_ci: '1028394012',
    telefono: '77212345',
    total_deuda: 3200.00,
    saldo_pendiente: 1800.00,
    fecha_emision: '2026-07-25',
    fecha_vencimiento: '2026-08-25',
    dias_credito: 30,
    estado: 'VENCIDO'
  },
  {
    id: 'cpc-3',
    cliente_id: 'cli-3',
    cliente_nombre: 'Juan Carlos Mamani',
    nit_ci: '6120394',
    telefono: '69011223',
    total_deuda: 180.00,
    saldo_pendiente: 60.00,
    fecha_emision: '2026-08-14',
    fecha_vencimiento: '2026-09-14',
    dias_credito: 30,
    estado: 'VIGENTE'
  }
];

export default function CuentasPorCobrarView({ onSelectSubView }) {
  const [cuentas, setCuentas] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCuenta, setSelectedCuenta] = useState(null);
  const [abonoMonto, setAbonoMonto] = useState('');
  const [abonoMetodo, setAbonoMetodo] = useState('Efectivo');
  const [isAbonoModalOpen, setIsAbonoModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('glorypos_cuentas_cobrar');
    if (saved) {
      try {
        setCuentas(JSON.parse(saved));
      } catch (e) {
        setCuentas(DEFAULT_CUENTAS);
      }
    } else {
      setCuentas(DEFAULT_CUENTAS);
      localStorage.setItem('glorypos_cuentas_cobrar', JSON.stringify(DEFAULT_CUENTAS));
    }
  }, []);

  const totalPorCobrar = cuentas.reduce((acc, c) => acc + (Number(c.saldo_pendiente) || 0), 0);
  const totalVencido = cuentas.filter(c => c.estado === 'VENCIDO').reduce((acc, c) => acc + (Number(c.saldo_pendiente) || 0), 0);

  const handleOpenAbono = (cuenta) => {
    setSelectedCuenta(cuenta);
    setAbonoMonto('');
    setIsAbonoModalOpen(true);
  };

  const handleRegistrarAbono = (e) => {
    e.preventDefault();
    const monto = Number(abonoMonto);
    if (!monto || monto <= 0) return;

    const updated = cuentas.map(c => {
      if (c.id === selectedCuenta.id) {
        const nuevoSaldo = Math.max(0, c.saldo_pendiente - monto);
        return {
          ...c,
          saldo_pendiente: nuevoSaldo,
          estado: nuevoSaldo === 0 ? 'PAGADO' : c.estado
        };
      }
      return c;
    });

    setCuentas(updated);
    localStorage.setItem('glorypos_cuentas_cobrar', JSON.stringify(updated));
    setIsAbonoModalOpen(false);
    setToastMsg(`¡Cobro de Bs. ${monto.toFixed(2)} registrado exitosamente!`);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const filtered = cuentas.filter(c => 
    `${c.cliente_nombre} ${c.nit_ci}`.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans">
      <SalesSubNav currentSubView="cuentas_por_cobrar" onSelectSubView={onSelectSubView} />

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Toast */}
        {toastMsg && (
          <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                <Clock className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Cuentas por Cobrar & Créditos
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de saldos pendientes de clientes, ventas al crédito y registro de abonos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5 text-slate-500" />
              <span>Imprimir Estado</span>
            </button>
          </div>
        </div>

        {/* 3 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-600">Total por Cobrar</span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              Bs. {totalPorCobrar.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400">Saldos activos de clientes</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-rose-600">Créditos Vencidos</span>
            <div className="text-2xl font-black text-rose-600 font-mono">
              Bs. {totalVencido.toFixed(2)}
            </div>
            <p className="text-[10px] text-slate-400">Plazo de pago superado</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-600">Clientes con Crédito</span>
            <div className="text-2xl font-black text-slate-900 font-mono">
              {cuentas.filter(c => c.saldo_pendiente > 0).length}
            </div>
            <p className="text-[10px] text-slate-400">Cuentas con saldo pendiente</p>
          </div>
        </div>

        {/* Buscador */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
          <div className="relative max-w-sm w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por cliente o NIT/CI..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Tabla de Cuentas por Cobrar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                <tr>
                  <th className="py-2 px-3">Cliente</th>
                  <th className="py-2 px-3">NIT / CI</th>
                  <th className="py-2 px-3">Emisión / Venc.</th>
                  <th className="py-2 px-3 text-right">Deuda Inicial</th>
                  <th className="py-2 px-3 text-right">Saldo Pendiente</th>
                  <th className="py-2 px-3 text-center">Estado</th>
                  <th className="py-2 px-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.map(c => {
                  const isVencido = c.estado === 'VENCIDO';
                  const isPagado = c.saldo_pendiente === 0;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-2.5 px-3">
                        <span className="font-bold text-slate-900 block">{c.cliente_nombre}</span>
                        <span className="text-[10px] text-slate-400">Tel: {c.telefono}</span>
                      </td>
                      <td className="py-2.5 px-3 font-mono text-slate-700">
                        {c.nit_ci}
                      </td>
                      <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                        <span>{c.fecha_emision}</span>
                        <span className="text-slate-400 block">Vence: {c.fecha_vencimiento}</span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-slate-500">
                        Bs. {Number(c.total_deuda).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-black text-rose-600">
                        Bs. {Number(c.saldo_pendiente).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-center whitespace-nowrap">
                        {isPagado ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-100 text-emerald-800">
                            PAGADO
                          </span>
                        ) : isVencido ? (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-rose-100 text-rose-800">
                            VENCIDO
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-100 text-amber-800">
                            VIGENTE
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        {!isPagado && (
                          <button
                            type="button"
                            onClick={() => handleOpenAbono(c)}
                            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-[11px] rounded-lg transition active:scale-95 cursor-pointer shadow-xs"
                          >
                            Registrar Cobro
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modal Registrar Abono */}
      {isAbonoModalOpen && selectedCuenta && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-black text-slate-900">Registrar Cobro / Abono</h3>
                <p className="text-[10px] text-slate-500">{selectedCuenta.cliente_nombre}</p>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAbonoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl flex justify-between items-center text-xs">
              <span className="text-amber-800 font-bold">Saldo Actual Deudor:</span>
              <span className="font-mono text-base font-black text-rose-600">
                Bs. {Number(selectedCuenta.saldo_pendiente).toFixed(2)}
              </span>
            </div>

            <form onSubmit={handleRegistrarAbono} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monto a Cobrar (Bs.) *</label>
                <input
                  type="number"
                  step="0.5"
                  min="1"
                  max={selectedCuenta.saldo_pendiente}
                  required
                  autoFocus
                  placeholder="0.00"
                  value={abonoMonto}
                  onChange={(e) => setAbonoMonto(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Método de Cobro</label>
                <select
                  value={abonoMetodo}
                  onChange={(e) => setAbonoMetodo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Efectivo">Efectivo en Caja</option>
                  <option value="QR Simple">Transferencia QR Simple</option>
                  <option value="Tarjeta">Tarjeta POS Débito/Crédito</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAbonoModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  Confirmar Cobro
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
