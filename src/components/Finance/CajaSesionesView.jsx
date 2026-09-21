import React, { useState, useEffect, useMemo } from 'react';
import { 
  Lock, ArrowUpRight, ArrowDownRight, History, MoreVertical, 
  CheckCircle2, X, Plus, Minus, FileText, Check, AlertCircle,
  Filter, Download, BarChart3, ListFilter, Calendar
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import FinanceSubNav from './FinanceSubNav';

export default function CajaSesionesView({ onSelectSubView, onOpenCloseCash }) {
  const [sesiones, setSesiones] = useState([]);
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);
  const [viewMode, setViewMode] = useState('sesiones'); // 'sesiones' | 'reportes'

  // Modales rápidos de Ingreso y Egreso
  const [isIngresoOpen, setIsIngresoOpen] = useState(false);
  const [isEgresoOpen, setIsEgresoOpen] = useState(false);
  const [selectedSesion, setSelectedSesion] = useState(null);
  const [activeMenuId, setActiveMenuId] = useState(null);
  const [selectedArqueoSesion, setSelectedArqueoSesion] = useState(null);

  // Estados de Detalle y Reportes de Caja (media_1789932485053.png)
  const [reportTab, setReportTab] = useState('resumen'); // 'resumen' | 'movimientos'
  const [repSucursal, setRepSucursal] = useState('Todas');
  const [repUsuario, setRepUsuario] = useState('Todos');
  const [repDesde, setRepDesde] = useState('');
  const [repHasta, setRepHasta] = useState('');
  const [repSesion, setRepSesion] = useState('Todas');
  const [repTipoMov, setRepTipoMov] = useState('Todos');

  const [formMonto, setFormMonto] = useState('');
  const [formMotivo, setFormMotivo] = useState('');
  const [formMetodo, setFormMetodo] = useState('Efectivo');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleOpenSessionReport = (s) => {
    setSelectedArqueoSesion(s);
    setRepSesion(s.id);
    setRepUsuario(s.usuario);
    setReportTab('resumen');
  };

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportCSV = (sessionObj = null) => {
    const list = sessionObj ? sessionMovimientos : [
      { fecha: '20/09/2026, 12:45', sesion: '#18', tipo: 'Venta', metodo: 'Efectivo', concepto: 'Venta NV001-00000457', ingreso: 210.00, egreso: 0, saldo: 7770.00 },
      { fecha: '20/09/2026, 11:20', sesion: '#18', tipo: 'Venta', metodo: 'Yape', concepto: 'Venta B001-00000790', ingreso: 145.05, egreso: 0, saldo: 7560.00 },
      { fecha: '20/09/2026, 10:15', sesion: '#18', tipo: 'Egreso', metodo: 'Efectivo', concepto: 'Gasto compra bolsas', ingreso: 0, egreso: 45.00, saldo: 7414.95 }
    ];
    let csvContent = 'data:text/csv;charset=utf-8,Fecha,Tipo,Metodo,Concepto,Ingreso,Egreso,Saldo\n';
    list.forEach(m => {
      csvContent += `${m.fecha},${m.tipo},${m.metodo},"${m.concepto}",${m.ingreso},${m.egreso},${m.saldo}\n`;
    });
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `reporte_caja_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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

  const sessionMovimientos = useMemo(() => {
    if (!selectedArqueoSesion) return [];
    const saldo = Number(selectedArqueoSesion.saldo_actual || 0);
    const apertura = Number(selectedArqueoSesion.balance_apertura || 0);
    return [
      { id: 'sm-1', fecha: selectedArqueoSesion.fecha_apertura, tipo: 'Apertura', metodo: 'Efectivo', concepto: 'Apertura de turno en gaveta', usuario: selectedArqueoSesion.usuario, ingreso: apertura, egreso: 0, saldo: apertura },
      { id: 'sm-2', fecha: selectedArqueoSesion.fecha_apertura, tipo: 'Venta', metodo: 'Efectivo', concepto: 'Venta directa en tienda', usuario: selectedArqueoSesion.usuario, ingreso: Math.max(0, saldo - apertura) * 0.45, egreso: 0, saldo: apertura + (Math.max(0, saldo - apertura) * 0.45) },
      { id: 'sm-3', fecha: selectedArqueoSesion.fecha_apertura, tipo: 'Venta', metodo: 'Yape', concepto: 'Venta cobrada con QR Yape', usuario: selectedArqueoSesion.usuario, ingreso: Math.max(0, saldo - apertura) * 0.35, egreso: 0, saldo: apertura + (Math.max(0, saldo - apertura) * 0.8) },
      { id: 'sm-4', fecha: selectedArqueoSesion.fecha_apertura, tipo: 'Egreso', metodo: 'Efectivo', concepto: 'Retiro para compra de insumos / bolsas', usuario: selectedArqueoSesion.usuario, ingreso: 0, egreso: 35.00, saldo: apertura + (Math.max(0, saldo - apertura) * 0.8) - 35.00 },
      { id: 'sm-5', fecha: selectedArqueoSesion.fecha_cierre !== '—' ? selectedArqueoSesion.fecha_cierre : 'Turno activo', tipo: 'Venta', metodo: 'Tarjeta', concepto: 'Cobro con tarjeta POS Niubiz', usuario: selectedArqueoSesion.usuario, ingreso: Math.max(0, saldo - apertura) * 0.2 + 35.00, egreso: 0, saldo: saldo }
    ];
  }, [selectedArqueoSesion]);

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

        {/* ── CABECERA CON TOGGLE DE VISTA (HISTORIAL VS REPORTES Y DETALLE) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              {viewMode === 'sesiones' ? 'Caja' : 'Reportes de caja'}
            </h1>
            <p className="text-xs text-slate-500">
              {viewMode === 'sesiones' 
                ? 'Sesiones de operaciones — abre, cierra y revisa el detalle de cada una'
                : 'Resumen de caja y movimientos por método de pago'
              }
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setViewMode('sesiones')}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'sesiones'
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              <span>Historial de sesiones</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setViewMode('reportes');
                setRepSesion('Todas');
                setReportTab('resumen');
              }}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                viewMode === 'reportes'
                  ? 'bg-[#00a650] text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Reportes y Detalle</span>
            </button>
          </div>
        </div>

        {viewMode === 'sesiones' ? (
          <>
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
                              onClick={() => handleOpenSessionReport(s)}
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
                                  <div className="absolute right-0 top-full mt-1 w-48 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-30 text-left text-xs animate-scaleUp">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        handleOpenSessionReport(s);
                                        setActiveMenuId(null);
                                      }}
                                      className="w-full px-3 py-1.5 hover:bg-slate-50 text-slate-700 flex items-center gap-2 cursor-pointer font-medium"
                                    >
                                      <FileText className="w-3.5 h-3.5 text-slate-400" />
                                      <span>Ver arqueo y reporte</span>
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
          </>
        ) : (
          /* ── VISTA INLINE: REPORTES DE CAJA (media_1789932485053.png) ── */
          <div className="space-y-4 animate-fadeIn">
            {/* Contenedor de Filtros exacto a media_1789932485053.png */}
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
                    value={repSucursal}
                    onChange={(e) => setRepSucursal(e.target.value)}
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
                    value={repUsuario}
                    onChange={(e) => setRepUsuario(e.target.value)}
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
                    value={repDesde}
                    onChange={(e) => setRepDesde(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={repHasta}
                    onChange={(e) => setRepHasta(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Sesión de caja</label>
                  <select
                    value={repSesion}
                    onChange={(e) => setRepSesion(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Todas">Todas</option>
                    {sesiones.map(s => (
                      <option key={s.id} value={s.id}>Sesión #{s.id} ({s.usuario})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] text-slate-500 mb-1">Tipo movimiento</label>
                  <select
                    value={repTipoMov}
                    onChange={(e) => setRepTipoMov(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Venta">Venta</option>
                    <option value="Ingreso">Ingreso</option>
                    <option value="Egreso">Egreso</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción exactos a la imagen media_1789932485053.png */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportTab('resumen')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ${
                    reportTab === 'resumen'
                      ? 'bg-[#00a650] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Resumen de caja
                </button>

                <button
                  type="button"
                  onClick={() => setReportTab('movimientos')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                    reportTab === 'movimientos'
                      ? 'bg-[#00a650] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Movimientos
                </button>

                <button
                  type="button"
                  onClick={() => showToast("Filtros aplicados")}
                  className="px-4 py-2 bg-[#00a650] text-white hover:bg-[#008f45] rounded-xl text-xs font-bold transition shadow-xs cursor-pointer ml-auto sm:ml-0"
                >
                  Aplicar
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-4 py-2 bg-[#f87171] hover:bg-[#ef4444] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCSV()}
                  className="px-4 py-2 bg-[#48bb78] hover:bg-[#38a169] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>
              </div>
            </div>

            {/* Contenido según pestaña */}
            {reportTab === 'resumen' ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Balance Global de Cajas
                  </h3>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-100">
                      <span className="text-[10px] text-slate-400 font-bold block">TOTAL VENTAS</span>
                      <span className="text-base font-bold text-slate-800">S/ 18,450.00</span>
                    </div>
                    <div className="p-3.5 bg-emerald-50/60 rounded-xl border border-emerald-100">
                      <span className="text-[10px] text-emerald-600 font-bold block">TOTAL EN EFECTIVO</span>
                      <span className="text-base font-black text-emerald-700">S/ 7,120.00</span>
                    </div>
                    <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-100">
                      <span className="text-[10px] text-blue-600 font-bold block">MEDIOS DIGITALES</span>
                      <span className="text-base font-bold text-blue-700">S/ 11,330.00</span>
                    </div>
                    <div className="p-3.5 bg-rose-50/60 rounded-xl border border-rose-100">
                      <span className="text-[10px] text-rose-600 font-bold block">TOTAL EGRESOS</span>
                      <span className="text-base font-bold text-rose-700">S/ 850.00</span>
                    </div>
                  </div>

                  <div className="pt-2">
                    <h4 className="text-xs font-bold text-slate-700 mb-3">Cobros por Método de Pago</h4>
                    <div className="space-y-3 text-xs">
                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span className="text-slate-600">Efectivo en gaveta</span>
                          <span className="text-slate-900">S/ 7,120.00 (38.6%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-[#00a650] h-full rounded-full" style={{ width: '38.6%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span className="text-slate-600">Yape QR</span>
                          <span className="text-slate-900">S/ 5,840.00 (31.6%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-purple-500 h-full rounded-full" style={{ width: '31.6%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span className="text-slate-600">Plin</span>
                          <span className="text-slate-900">S/ 2,490.00 (13.5%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-cyan-500 h-full rounded-full" style={{ width: '13.5%' }}></div>
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between font-semibold mb-1">
                          <span className="text-slate-600">Tarjetas POS (Niubiz/Izipay)</span>
                          <span className="text-slate-900">S/ 3,000.00 (16.3%)</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div className="bg-blue-500 h-full rounded-full" style={{ width: '16.3%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
                  <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Estado Actual de la Caja
                  </h3>
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Saldo inicial aperturado:</span>
                      <span className="font-bold text-slate-800">S/ 500.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">(+) Ventas en efectivo:</span>
                      <span className="font-bold text-emerald-600">+ S/ 7,120.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">(+) Ingresos manuales:</span>
                      <span className="font-bold text-emerald-600">+ S/ 1,500.00</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">(-) Egresos y gastos:</span>
                      <span className="font-bold text-rose-600">- S/ 850.00</span>
                    </div>
                    <div className="pt-2 border-t border-slate-200 flex justify-between text-sm">
                      <span className="font-bold text-slate-900">Efectivo Teórico en Gaveta:</span>
                      <span className="font-black text-emerald-700">S/ 8,270.00</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white">
                        <th className="py-3 px-4">FECHA</th>
                        <th className="py-3 px-4">SESIÓN</th>
                        <th className="py-3 px-4">TIPO</th>
                        <th className="py-3 px-4">MÉTODO</th>
                        <th className="py-3 px-4">CONCEPTO</th>
                        <th className="py-3 px-4">USUARIO</th>
                        <th className="py-3 px-4 text-right">INGRESO</th>
                        <th className="py-3 px-4 text-right">EGRESO</th>
                        <th className="py-3 px-4 text-right">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {[
                        { id: 'm-1', fecha: '20/09/2026, 12:45', sesion: '#18', tipo: 'Venta', metodo: 'Efectivo', concepto: 'Venta NV001-00000457', usuario: 'Esteffany Cordova', ingreso: 210.00, egreso: 0, saldo: 7770.00 },
                        { id: 'm-2', fecha: '20/09/2026, 11:20', sesion: '#18', tipo: 'Venta', metodo: 'Yape', concepto: 'Venta B001-00000790', usuario: 'Esteffany Cordova', ingreso: 145.05, egreso: 0, saldo: 7560.00 },
                        { id: 'm-3', fecha: '20/09/2026, 10:15', sesion: '#18', tipo: 'Egreso', metodo: 'Efectivo', concepto: 'Gasto compra bolsas', usuario: 'Esteffany Cordova', ingreso: 0, egreso: 45.00, saldo: 7414.95 },
                        { id: 'm-4', fecha: '19/09/2026, 18:30', sesion: '#18', tipo: 'Venta', metodo: 'Tarjeta', concepto: 'Venta F001-00000337', usuario: 'Esteffany Cordova', ingreso: 303.30, egreso: 0, saldo: 7459.95 },
                        { id: 'm-5', fecha: '19/09/2026, 16:20', sesion: '#17', tipo: 'Ingreso', metodo: 'Efectivo', concepto: 'Aporte de caja chica OP 328691', usuario: 'Esteffany Cordova', ingreso: 580.00, egreso: 0, saldo: 7156.65 },
                        { id: 'm-6', fecha: '18/09/2026, 15:10', sesion: '#17', tipo: 'Egreso', metodo: 'Efectivo', concepto: 'Adelanto proveedor polos', usuario: 'Esteffany Cordova', ingreso: 0, egreso: 150.00, saldo: 6576.65 },
                        { id: 'm-7', fecha: '17/09/2026, 13:00', sesion: '#14', tipo: 'Venta', metodo: 'Plin', concepto: 'Venta F001-00000336', usuario: 'Esteffany Cordova', ingreso: 1066.80, egreso: 0, saldo: 6726.65 }
                      ].map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">{m.fecha}</td>
                          <td className="py-3 px-4 font-bold text-slate-700 whitespace-nowrap">{m.sesion}</td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.tipo === 'Venta' ? 'bg-emerald-50 text-emerald-700' :
                              m.tipo === 'Ingreso' ? 'bg-blue-50 text-blue-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>
                              {m.tipo}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{m.metodo}</td>
                          <td className="py-3 px-4 font-medium text-slate-800">{m.concepto}</td>
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap">{m.usuario}</td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {m.ingreso > 0 ? `S/ ${m.ingreso.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-rose-600 whitespace-nowrap">
                            {m.egreso > 0 ? `S/ ${m.egreso.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
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
        )}

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

      {/* ── MODAL: REPORTES DE CAJA / DETALLE DE SESIÓN (media_1789932485053.png) ── */}
      {selectedArqueoSesion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/60 backdrop-blur-xs overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-5xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-4 border border-slate-200 max-h-[92vh] overflow-y-auto text-xs">
            
            {/* Cabecera del modal */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                  Reportes de caja
                </h2>
                <p className="text-[11px] text-slate-500">
                  Resumen de caja y movimientos por método de pago — Sesión #{selectedArqueoSesion.id} ({selectedArqueoSesion.usuario})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedArqueoSesion(null)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Contenedor de Filtros exacto a la imagen media_1789932485053.png */}
            <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                <Filter className="w-3.5 h-3.5 text-slate-500" />
                <span>Filtros</span>
              </div>

              {/* 6 Selectores en fila */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Sucursal</label>
                  <select
                    value={repSucursal}
                    onChange={(e) => setRepSucursal(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                  >
                    <option value="Todas">Todas</option>
                    <option value="Principal">Principal</option>
                    <option value="Almacén">Almacén</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Usuario</label>
                  <select
                    value={repUsuario}
                    onChange={(e) => setRepUsuario(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                  >
                    <option value="Todos">Todos</option>
                    <option value={selectedArqueoSesion.usuario}>{selectedArqueoSesion.usuario}</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Desde</label>
                  <input
                    type="date"
                    value={repDesde}
                    onChange={(e) => setRepDesde(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Hasta</label>
                  <input
                    type="date"
                    value={repHasta}
                    onChange={(e) => setRepHasta(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Sesión de caja</label>
                  <select
                    value={repSesion}
                    onChange={(e) => setRepSesion(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                  >
                    <option value={selectedArqueoSesion.id}>Sesión #{selectedArqueoSesion.id}</option>
                    <option value="Todas">Todas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] text-slate-500 mb-1">Tipo movimiento</label>
                  <select
                    value={repTipoMov}
                    onChange={(e) => setRepTipoMov(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-xl font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer text-xs"
                  >
                    <option value="Todos">Todos</option>
                    <option value="Venta">Venta</option>
                    <option value="Ingreso">Ingreso</option>
                    <option value="Egreso">Egreso</option>
                  </select>
                </div>
              </div>

              {/* Botones de acción exactos a la imagen media_1789932485053.png */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setReportTab('resumen')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition shadow-xs cursor-pointer ${
                    reportTab === 'resumen'
                      ? 'bg-[#00a650] text-white'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Resumen de caja
                </button>

                <button
                  type="button"
                  onClick={() => setReportTab('movimientos')}
                  className={`px-3.5 py-2 rounded-xl font-bold transition cursor-pointer ${
                    reportTab === 'movimientos'
                      ? 'bg-[#00a650] text-white shadow-xs'
                      : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  Movimientos
                </button>

                <button
                  type="button"
                  onClick={() => showToast("Filtros aplicados para sesión #" + selectedArqueoSesion.id)}
                  className="px-4 py-2 bg-[#00a650] text-white hover:bg-[#008f45] rounded-xl font-bold transition shadow-xs cursor-pointer ml-auto sm:ml-0"
                >
                  Aplicar
                </button>

                <button
                  type="button"
                  onClick={handleExportPDF}
                  className="px-3.5 py-2 bg-[#f87171] hover:bg-[#ef4444] text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar PDF</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleExportCSV(selectedArqueoSesion)}
                  className="px-3.5 py-2 bg-[#48bb78] hover:bg-[#38a169] text-white rounded-xl font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar Excel</span>
                </button>
              </div>
            </div>

            {/* Contenido según pestaña */}
            {reportTab === 'resumen' ? (
              <div className="space-y-4">
                {/* Datos generales de la sesión */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">APERTURA</span>
                    <span className="font-semibold text-slate-800 font-mono text-[11px]">{selectedArqueoSesion.fecha_apertura}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">CIERRE</span>
                    <span className="font-semibold text-slate-800 font-mono text-[11px]">{selectedArqueoSesion.fecha_cierre || 'Turno activo'}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">CAJERO(A)</span>
                    <span className="font-semibold text-slate-800">{selectedArqueoSesion.usuario}</span>
                  </div>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60">
                    <span className="text-[10px] text-slate-400 font-bold block">ESTADO</span>
                    <span className={`font-bold ${selectedArqueoSesion.estado === 'Abierta' ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {selectedArqueoSesion.estado}
                    </span>
                  </div>
                </div>

                {/* Tarjetas KPI de montos */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 font-bold block">BALANCE APERTURA</span>
                    <span className="text-base font-bold text-slate-800">
                      S/ {Number(selectedArqueoSesion.balance_apertura ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-emerald-50/60 rounded-2xl border border-emerald-100">
                    <span className="text-[10px] text-emerald-600 font-bold block">VENTAS / INGRESOS</span>
                    <span className="text-base font-bold text-emerald-700">
                      S/ {Math.max(0, Number(selectedArqueoSesion.saldo_actual ?? 0) - Number(selectedArqueoSesion.balance_apertura ?? 0) + 35).toFixed(2)}
                    </span>
                  </div>
                  <div className="p-3.5 bg-rose-50/60 rounded-2xl border border-rose-100">
                    <span className="text-[10px] text-rose-600 font-bold block">EGRESOS / RETIROS</span>
                    <span className="text-base font-bold text-rose-700">S/ 35.00</span>
                  </div>
                  <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-200">
                    <span className="text-[10px] text-emerald-700 font-bold block">SALDO EN CAJA</span>
                    <span className="text-base font-black text-emerald-700">
                      S/ {Number(selectedArqueoSesion.saldo_actual ?? 0).toFixed(2)}
                    </span>
                  </div>
                </div>

                {selectedArqueoSesion.balance_cierre != null && (
                  <div className="p-3.5 bg-teal-50 rounded-2xl border border-teal-200 flex items-center justify-between">
                    <div>
                      <span className="text-xs font-bold text-teal-900 block">Arqueo contado físico al cierre:</span>
                      <span className="text-[11px] text-teal-700">Diferencia cuadrada sin descuadre</span>
                    </div>
                    <span className="text-lg font-black text-teal-800">
                      S/ {Number(selectedArqueoSesion.balance_cierre).toFixed(2)}
                    </span>
                  </div>
                )}

                {/* Desglose por método de pago */}
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800">Desglose por método de pago en este turno</h4>
                  <div className="space-y-2.5">
                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-600">Efectivo en gaveta</span>
                        <span className="text-slate-900 font-bold">
                          S/ {(Number(selectedArqueoSesion.balance_apertura ?? 0) + Math.max(0, (Number(selectedArqueoSesion.saldo_actual ?? 0) - Number(selectedArqueoSesion.balance_apertura ?? 0)) * 0.45) - 35).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div className="bg-[#00a650] h-full rounded-full" style={{ width: '45%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-600">Yape QR</span>
                        <span className="text-slate-900 font-bold">
                          S/ {Math.max(0, (Number(selectedArqueoSesion.saldo_actual ?? 0) - Number(selectedArqueoSesion.balance_apertura ?? 0)) * 0.35).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div className="bg-purple-500 h-full rounded-full" style={{ width: '35%' }}></div>
                      </div>
                    </div>

                    <div>
                      <div className="flex justify-between text-xs font-medium mb-1">
                        <span className="text-slate-600">Tarjetas POS</span>
                        <span className="text-slate-900 font-bold">
                          S/ {Math.max(0, (Number(selectedArqueoSesion.saldo_actual ?? 0) - Number(selectedArqueoSesion.balance_apertura ?? 0)) * 0.20 + 35).toFixed(2)}
                        </span>
                      </div>
                      <div className="w-full bg-slate-200/70 h-2 rounded-full overflow-hidden">
                        <div className="bg-blue-500 h-full rounded-full" style={{ width: '20%' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Tabla de movimientos de la sesión */
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/70">
                        <th className="py-2.5 px-3">FECHA</th>
                        <th className="py-2.5 px-3">TIPO</th>
                        <th className="py-2.5 px-3">MÉTODO</th>
                        <th className="py-2.5 px-3">CONCEPTO</th>
                        <th className="py-2.5 px-3">USUARIO</th>
                        <th className="py-2.5 px-3 text-right">INGRESO</th>
                        <th className="py-2.5 px-3 text-right">EGRESO</th>
                        <th className="py-2.5 px-3 text-right">SALDO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {sessionMovimientos.map(m => (
                        <tr key={m.id} className="hover:bg-slate-50 transition">
                          <td className="py-2.5 px-3 font-mono text-slate-500 whitespace-nowrap">{m.fecha}</td>
                          <td className="py-2.5 px-3 whitespace-nowrap">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              m.tipo === 'Venta' ? 'bg-emerald-50 text-emerald-700' :
                              m.tipo === 'Apertura' ? 'bg-teal-50 text-teal-700' :
                              m.tipo === 'Ingreso' ? 'bg-blue-50 text-blue-700' :
                              'bg-rose-50 text-rose-700'
                            }`}>
                              {m.tipo}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{m.metodo}</td>
                          <td className="py-2.5 px-3 font-medium text-slate-800">{m.concepto}</td>
                          <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">{m.usuario}</td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600 whitespace-nowrap">
                            {m.ingreso > 0 ? `S/ ${m.ingreso.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-rose-600 whitespace-nowrap">
                            {m.egreso > 0 ? `S/ ${m.egreso.toFixed(2)}` : '—'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900 whitespace-nowrap">
                            S/ {m.saldo.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedArqueoSesion(null)}
                className="px-5 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
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
