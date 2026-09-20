import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Search, Download, Printer, Filter, X, Check, Calendar, ArrowUpRight, FileText, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function IngresosView({ onSelectSubView }) {
  const [ingresos, setIngresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('Todas');
  const [selectedCaja, setSelectedCaja] = useState('Todas');
  const [selectedUsuario, setSelectedUsuario] = useState('Todos');
  const [selectedMetodo, setSelectedMetodo] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal para agregar ingreso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMonto, setFormMonto] = useState('');
  const [formCategoria, setFormCategoria] = useState('Otro ingreso');
  const [formMetodo, setFormMetodo] = useState('Efectivo');
  const [formSesion, setFormSesion] = useState('#18');
  const [formDocumento, setFormDocumento] = useState('');
  const [formUsuario, setFormUsuario] = useState('Esteffany Cordova');
  const [formNotas, setFormNotas] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Ticket modal
  const [selectedTicket, setSelectedTicket] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadIngresos = async () => {
    try {
      if (db.ingresos_caja) {
        const list = await db.ingresos_caja.toArray();
        setIngresos(list || []);
      }
    } catch (err) {
      console.warn('Error al cargar ingresos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadIngresos();
  }, []);

  // Filtrado
  const filteredIngresos = useMemo(() => {
    return ingresos.filter(item => {
      const matchSearch = !search || 
        item.documento?.toLowerCase().includes(search.toLowerCase()) ||
        item.usuario?.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(search.toLowerCase()) ||
        item.sesion?.toLowerCase().includes(search.toLowerCase());

      const matchMetodo = selectedMetodo === 'Todos' || item.metodo_pago === selectedMetodo;
      const matchUsuario = selectedUsuario === 'Todos' || item.usuario === selectedUsuario;
      const matchCaja = selectedCaja === 'Todas' || item.sesion?.includes(selectedCaja);

      return matchSearch && matchMetodo && matchUsuario && matchCaja;
    });
  }, [ingresos, search, selectedMetodo, selectedUsuario, selectedCaja]);

  const totalMontoFiltrado = useMemo(() => {
    return filteredIngresos.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  }, [filteredIngresos]);

  // Paginación
  const totalPages = Math.ceil(filteredIngresos.length / pageSize) || 1;
  const paginatedIngresos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredIngresos.slice(start, start + pageSize);
  }, [filteredIngresos, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSucursal('Todas');
    setSelectedCaja('Todas');
    setSelectedUsuario('Todos');
    setSelectedMetodo('Todos');
    setFechaDesde('');
    setFechaHasta('');
    setCurrentPage(1);
  };

  const handleCreateIngreso = async (e) => {
    e.preventDefault();
    if (!formMonto || Number(formMonto) <= 0) return;

    const now = new Date();
    const fechaStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newRecord = {
      id: `ing-${Date.now()}`,
      fecha: fechaStr,
      sesion: formSesion || '#18',
      categoria: formCategoria,
      badgeCategoria: formCategoria,
      documento: formDocumento || `ING-${Date.now().toString().slice(-4)}`,
      usuario: formUsuario,
      metodo_pago: formMetodo,
      monto: Number(formMonto),
      notas: formNotas
    };

    try {
      await db.ingresos_caja.add(newRecord);
      showToast(`Ingreso registrado correctamente: S/ ${Number(formMonto).toFixed(2)}`);
      setIsModalOpen(false);
      setFormMonto('');
      setFormDocumento('');
      setFormNotas('');
      loadIngresos();
    } catch (err) {
      console.error(err);
      showToast('Error al guardar ingreso');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="ingresos" onSelectTab={onSelectSubView} />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Ingresos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico de ingresos manuales y ventas cobradas — de mis cajas (abiertas y cerradas)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-slate-50 rounded-xl border border-slate-200/70 text-right">
            <span className="text-[11px] font-semibold text-slate-500 block leading-tight">Total ingresado</span>
            <span className="text-base font-black text-slate-900 tracking-tight">
              S/ {totalMontoFiltrado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar ingreso</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* Búsqueda */}
          <div className="relative sm:col-span-2">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por referencia, cliente..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] transition"
            />
          </div>

          {/* Sucursal */}
          <div>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] text-slate-700"
            >
              <option value="Todas">Todas las sucursales</option>
              <option value="Principal">Principal</option>
              <option value="Almacén">Almacén Central</option>
            </select>
          </div>

          {/* Caja */}
          <div>
            <select
              value={selectedCaja}
              onChange={(e) => setSelectedCaja(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] text-slate-700"
            >
              <option value="Todas">Todas las cajas</option>
              <option value="18">Caja #18</option>
              <option value="17">Caja #17</option>
              <option value="14">Caja #14</option>
            </select>
          </div>

          {/* Usuario */}
          <div>
            <select
              value={selectedUsuario}
              onChange={(e) => setSelectedUsuario(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] text-slate-700"
            >
              <option value="Todos">Todos los usuarios</option>
              <option value="Esteffany Cordova">Esteffany Cordova</option>
              <option value="Administrador">Administrador</option>
            </select>
          </div>

          {/* Método */}
          <div>
            <select
              value={selectedMetodo}
              onChange={(e) => setSelectedMetodo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650] text-slate-700"
            >
              <option value="Todos">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Yape">Yape</option>
              <option value="Plin">Plin</option>
              <option value="Transferencia">Transferencia</option>
              <option value="Tarjeta">Tarjeta</option>
            </select>
          </div>

          {/* Limpiar */}
          <div>
            <button
              onClick={handleResetFilters}
              className="w-full py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-xl transition"
            >
              Limpiar filtros
            </button>
          </div>
        </div>
      </div>

      {/* Tabla de Ingresos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-3">Sesión</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-4">Documento / Referencia</th>
                <th className="py-3 px-3">Usuario</th>
                <th className="py-3 px-3">Método de pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedIngresos.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    No se encontraron ingresos registrados con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedIngresos.map((ing) => (
                  <tr key={ing.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {ing.fecha}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {ing.sesion}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {ing.categoria === 'Venta' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/60">
                          Venta
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          {ing.categoria}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {ing.documento}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {ing.usuario}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {ing.metodo_pago}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-emerald-600 whitespace-nowrap font-mono text-xs">
                      + S/ {Number(ing.monto).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTicket(ing)}
                        className="px-2.5 py-1 text-[11px] font-semibold text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200/80 rounded-lg transition"
                      >
                        Ver detalle
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Paginación */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 border-t border-slate-200/70 bg-slate-50/50 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>Registros por página:</span>
            <select
              value={pageSize}
              onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
              className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-medium text-slate-700"
            >
              <option value="10">10</option>
              <option value="20">20</option>
              <option value="50">50</option>
            </select>
            <span>Total: {filteredIngresos.length} registros</span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 font-semibold text-slate-700">
              Página {currentPage} de {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modal Agregar Ingreso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-emerald-50 border-b border-emerald-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Ingreso de Caja</h3>
                  <p className="text-[11px] text-emerald-800">Entrada manual de efectivo o cobro</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateIngreso} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-600"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría</label>
                  <select
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Otro ingreso">Otro ingreso</option>
                    <option value="Aporte de capital">Aporte de capital</option>
                    <option value="Cobro de crédito">Cobro de crédito</option>
                    <option value="Venta manual">Venta manual</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Método de pago</label>
                  <select
                    value={formMetodo}
                    onChange={(e) => setFormMetodo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Transferencia">Transferencia</option>
                    <option value="Tarjeta">Tarjeta</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Sesión / Caja</label>
                  <select
                    value={formSesion}
                    onChange={(e) => setFormSesion(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="#18">#18 - Caja Principal</option>
                    <option value="#17">#17 - Caja Secundaria</option>
                    <option value="#14">#14 - Turno Mañana</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Documento / Ref.</label>
                  <input
                    type="text"
                    placeholder="Ej. OP-12345 / CT-01"
                    value={formDocumento}
                    onChange={(e) => setFormDocumento(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones / Motivo</label>
                <textarea
                  rows="2"
                  placeholder="Detalle o justificación del ingreso..."
                  value={formNotas}
                  onChange={(e) => setFormNotas(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800 resize-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Registrar Ingreso
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detalle Ticket */}
      {selectedTicket && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-2xl border border-slate-100 space-y-4">
            <div className="flex items-center justify-between border-b pb-3 border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                Detalle de Ingreso
              </h3>
              <button 
                onClick={() => setSelectedTicket(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl space-y-2 text-xs">
              <div className="flex justify-between text-slate-500">
                <span>Fecha:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.fecha}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Sesión:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.sesion}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Categoría:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.categoria}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Documento:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.documento}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Método:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.metodo_pago}</span>
              </div>
              <div className="flex justify-between text-slate-500">
                <span>Usuario:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.usuario}</span>
              </div>
              <div className="border-t border-slate-200 pt-2 flex justify-between items-center">
                <span className="font-bold text-slate-700">Monto total:</span>
                <span className="text-base font-black text-emerald-600">S/ {Number(selectedTicket.monto).toFixed(2)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedTicket(null)}
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
