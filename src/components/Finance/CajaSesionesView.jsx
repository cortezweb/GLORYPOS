import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, ArrowUpRight, ArrowDownRight, History, MoreVertical, 
  CheckCircle2, X, Plus, Minus, FileText, Check, AlertCircle 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import FinanceSubNav from './FinanceSubNav';

export default function CajaSesionesView({ onSelectSubView, onOpenCloseCash }) {
  const [sesiones, setSesiones] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Modales rápidos de Ingreso y Egreso
  const [isIngresoOpen, setIsIngresoOpen] = useState(false);
  const [isEgresoOpen, setIsEgresoOpen] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedArqueoSesion, setSelectedArqueoSesion] = useState(null);

  const [formMonto, setFormMonto] = useState('');
  const [formMotivo, setFormMotivo] = useState('');
  const [formMetodo, setFormMetodo] = useState('Efectivo');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadSesiones = async () => {
    try {
      if (db.sesiones_caja) {
        const list = await db.sesiones_caja.toArray();
        setSesiones(list || []);
      }
    } catch (err) {
      console.warn('Error loading sesiones:', err);
    }
  };

  useEffect(() => {
    loadSesiones();
  }, []);

  const totalPages = Math.ceil(sesiones.length / pageSize) || 1;
  const paginatedSesiones = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return sesiones.slice(start, start + pageSize);
  }, [sesiones, currentPage, pageSize]);

  // Manejador de Ingreso Rápido a la caja
  const handleSaveIngreso = async (e) => {
    e.preventDefault();
    if (!formMonto || Number(formMonto) <= 0) return;
    const monto = Number(formMonto);

    const now = new Date();
    const fechaStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const targetSesionId = selectedSesion ? selectedSesion.id : 'ses-1';

    if (db.ingresos_caja) {
      await db.ingresos_caja.add({
        id: `ing-${Date.now()}`,
        fecha: fechaStr,
        sesion: '#18',
        categoria: 'Otro ingreso',
        documento: 'ING-MANUAL',
        usuario: selectedSesion?.usuario || 'Esteffany Cordova',
        metodo_pago: formMetodo,
        monto: monto
      });
    }

    // Actualizar saldo de la sesión
    if (db.sesiones_caja && selectedSesion) {
      const nuevoSaldo = (Number(selectedSesion.saldo_actual) || 0) + monto;
      await db.sesiones_caja.update(selectedSesion.id, { saldo_actual: nuevoSaldo });
    }

    setIsIngresoOpen(false);
    setFormMonto('');
    setFormMotivo('');
    await loadSesiones();
    showToast(`+ S/ ${monto.toFixed(2)} ingresados a la caja.`);
    syncService.triggerBackgroundSync();
  };

  // Manejador de Egreso Rápido de la caja
  const handleSaveEgreso = async (e) => {
    e.preventDefault();
    if (!formMonto || Number(formMonto) <= 0) return;
    const monto = Number(formMonto);

    const now = new Date();
    const fechaStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    if (db.egresos_caja) {
      await db.egresos_caja.add({
        id: `eg-${Date.now()}`,
        fecha: fechaStr,
        sesion: '#18',
        categoria: 'Gasto',
        proveedor: '—',
        documento: 'EGR-MANUAL',
        usuario: selectedSesion?.usuario || 'Esteffany Cordova',
        metodo_pago: formMetodo,
        monto: monto
      });
    }

    // Actualizar saldo de la sesión
    if (db.sesiones_caja && selectedSesion) {
      const nuevoSaldo = Math.max(0, (Number(selectedSesion.saldo_actual) || 0) - monto);
      await db.sesiones_caja.update(selectedSesion.id, { saldo_actual: nuevoSaldo });
    }

    setIsEgresoOpen(false);
    setFormMonto('');
    setFormMotivo('');
    await loadSesiones();
    showToast(`- S/ ${monto.toFixed(2)} retirados de la caja.`);
    syncService.triggerBackgroundSync();
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior de Finanzas */}
      {onSelectSubView && (
        <FinanceSubNav currentSubView="caja" onSelectSubView={onSelectSubView} />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 w-full space-y-4">

        {/* ── CABECERA EXACTA A LA IMAGEN ── */}
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Caja
          </h1>
          <p className="text-xs text-slate-500">
            Sesiones de operaciones — abre, cierra y revisa el detalle de cada una
          </p>
        </div>

        {/* ── TARJETA: HISTORIAL DE SESIONES ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          
          {/* Barra superior de la tarjeta */}
          <div className="p-4 border-b border-slate-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-800">
                Historial de sesiones
              </span>
            </div>
            <span className="text-xs text-slate-400 font-medium">
              {sesiones.length} sesiones
            </span>
          </div>

          {/* Tabla de Sesiones (Exacta a la imagen) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white">
                  <th className="py-3 px-4">USUARIO</th>
                  <th className="py-3 px-4">APERTURA</th>
                  <th className="py-3 px-4">CIERRE</th>
                  <th className="py-3 px-4">BALANCE APERT.</th>
                  <th className="py-3 px-4">BALANCE CIERRE</th>
                  <th className="py-3 px-4">SALDO ACTUAL</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4">ARQUEO</th>
                  <th className="py-3 px-4 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {paginatedSesiones.map((s) => {
                  const isAbierta = s.estado === 'Abierta';

                  return (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* USUARIO */}
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        {s.usuario}
                      </td>

                      {/* APERTURA */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                        {s.fecha_apertura}
                      </td>

                      {/* CIERRE */}
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap">
                        {s.fecha_cierre || '—'}
                      </td>

                      {/* BALANCE APERTURA */}
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        S/ {Number(s.balance_apertura ?? 0).toFixed(2)}
                      </td>

                      {/* BALANCE CIERRE */}
                      <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {s.balance_cierre != null ? `S/ ${Number(s.balance_cierre).toFixed(2)}` : '—'}
                      </td>

                      {/* SALDO ACTUAL */}
                      <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                        S/ {Number(s.saldo_actual ?? 0).toFixed(2)}
                      </td>

                      {/* ESTADO */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {isAbierta ? (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700">
                            Abierta
                          </span>
                        ) : (
                          <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-600">
                            Cerrada
                          </span>
                        )}
                      </td>

                      {/* ARQUEO */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => setSelectedArqueoSesion(s)}
                          className={`text-xs font-semibold cursor-pointer hover:underline ${
                            s.arqueo_estado === 'Arqueo' ? 'text-teal-600' :
                            s.arqueo_estado === 'Ver arqueo' ? 'text-emerald-600' :
                            'text-amber-600'
                          }`}
                        >
                          {s.arqueo_estado || (isAbierta ? 'Arqueo' : 'Ver arqueo')}
                        </button>
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5 relative">
                          
                          {isAbierta && (
                            <>
                              {/* ↗ Ingreso */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSesion(s);
                                  setIsIngresoOpen(true);
                                }}
                                className="px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <ArrowUpRight className="w-3 h-3 text-emerald-600" />
                                <span>Ingreso</span>
                              </button>

                              {/* ↘ Egreso */}
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedSesion(s);
                                  setIsEgresoOpen(true);
                                }}
                                className="px-2 py-0.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-md text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                              >
                                <ArrowDownRight className="w-3 h-3 text-rose-600" />
                                <span>Egreso</span>
                              </button>
                            </>
                          )}

                          {/* Menú de opciones (3 puntos) */}
                          <div className="relative">
                            <button
                              type="button"
                              onClick={() => setActiveMenuId(activeMenuId === s.id ? null : s.id)}
                              className="p-1 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>

                            {activeMenuId === s.id && (
                              <div className="absolute right-0 top-full mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-left text-xs animate-scaleUp">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedArqueoSesion(s);
                                    setActiveMenuId(null);
                                  }}
                                  className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                                >
                                  <FileText className="w-3.5 h-3.5 text-slate-400" />
                                  <span>Ver arqueo</span>
                                </button>
                                
                                {isAbierta && onOpenCloseCash && (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setActiveMenuId(null);
                                      onOpenCloseCash();
                                    }}
                                    className="w-full px-3 py-1.5 hover:bg-slate-50 text-rose-600 flex items-center gap-2 cursor-pointer font-bold border-t border-slate-100"
                                  >
                                    <Lock className="w-3.5 h-3.5 text-rose-500" />
                                    <span>Cerrar caja</span>
                                  </button>
                                )}
                              </div>
                            )}
                          </div>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

        </div>

        {/* ── PIE DE PÁGINA Y PAGINACIÓN ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-3">
            <span>
              Mostrando 1-{Math.min(pageSize, sesiones.length)} de {sesiones.length}
            </span>
            <div className="flex items-center gap-1.5">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium"
            >
              Anterior
            </button>
            <span className="font-semibold text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition font-medium"
            >
              Siguiente
            </button>
          </div>
        </div>

      </main>

      {/* ── MODAL: INGRESO RÁPIDO ── */}
      {isIngresoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ingreso a Caja</h3>
                  <p className="text-[11px] text-slate-500">Sesión actual abierta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIngresoOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngreso} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monto (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  autoFocus
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Método de pago</label>
                <select
                  value={formMetodo}
                  onChange={(e) => setFormMetodo(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none"
                >
                  <option value="Efectivo">Efectivo</option>
                  <option value="Yape">Yape</option>
                  <option value="Plin">Plin</option>
                  <option value="Transferencia">Transferencia</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo / Concepto</label>
                <input
                  type="text"
                  required
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  placeholder="Ej. Cambio adicional, sencillo"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIngresoOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: EGRESO RÁPIDO ── */}
      {isEgresoOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <ArrowDownRight className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Salida / Egreso de Caja</h3>
                  <p className="text-[11px] text-slate-500">Descuenta dinero de la gaveta</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEgresoOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEgreso} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Monto a retirar (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0.10"
                  required
                  autoFocus
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-base font-black text-rose-600 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo / Proveedor</label>
                <input
                  type="text"
                  required
                  value={formMotivo}
                  onChange={(e) => setFormMotivo(e.target.value)}
                  placeholder="Ej. Pago de bolsas, almuerzo personal"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEgresoOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Confirmar Egreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: VER ARQUEO ── */}
      {selectedArqueoSesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Arqueo de Turno</h3>
                  <p className="text-[11px] text-slate-500">{selectedArqueoSesion.usuario}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArqueoSesion(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de apertura:</span>
                  <span className="font-semibold text-slate-800">{selectedArqueoSesion.fecha_apertura}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de cierre:</span>
                  <span className="font-semibold text-slate-800">{selectedArqueoSesion.fecha_cierre || 'Turno activo'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado de sesión:</span>
                  <span className={`font-bold ${selectedArqueoSesion.estado === 'Abierta' ? 'text-emerald-600' : 'text-slate-600'}`}>
                    {selectedArqueoSesion.estado}
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">BALANCE APERTURA</span>
                  <span className="text-sm font-bold text-slate-800">
                    S/ {Number(selectedArqueoSesion.balance_apertura ?? 0).toFixed(2)}
                  </span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-[10px] text-slate-400 block font-bold">SALDO ACTUAL</span>
                  <span className="text-sm font-black text-emerald-700">
                    S/ {Number(selectedArqueoSesion.saldo_actual ?? 0).toFixed(2)}
                  </span>
                </div>
              </div>

              {selectedArqueoSesion.balance_cierre != null && (
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center">
                  <span className="text-emerald-800 font-bold">Total contado al cierre:</span>
                  <span className="text-sm font-black text-emerald-700">
                    S/ {Number(selectedArqueoSesion.balance_cierre).toFixed(2)}
                  </span>
                </div>
              )}
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedArqueoSesion(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
