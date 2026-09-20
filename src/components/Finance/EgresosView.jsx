import React, { useState, useEffect, useMemo } from 'react';
import { 
  Plus, Minus, Search, ArrowDownRight, FileText, ChevronLeft, ChevronRight, Check, X 
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function EgresosView({ onSelectSubView }) {
  const [egresos, setEgresos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSucursal, setSelectedSucursal] = useState('Todas');
  const [selectedCaja, setSelectedCaja] = useState('Todas');
  const [selectedCategoria, setSelectedCategoria] = useState('Todas');
  const [selectedUsuario, setSelectedUsuario] = useState('Todos');
  const [selectedMetodo, setSelectedMetodo] = useState('Todos');
  const [pageSize, setPageSize] = useState(20);
  const [currentPage, setCurrentPage] = useState(1);

  // Modal para agregar egreso
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formMonto, setFormMonto] = useState('');
  const [formCategoria, setFormCategoria] = useState('Gasto');
  const [formProveedor, setFormProveedor] = useState('');
  const [formDocumento, setFormDocumento] = useState('');
  const [formMetodo, setFormMetodo] = useState('Efectivo');
  const [formSesion, setFormSesion] = useState('#17');
  const [formUsuario, setFormUsuario] = useState('Esteffany Cordova');
  const [formNotas, setFormNotas] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  const [selectedTicket, setSelectedTicket] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadEgresos = async () => {
    try {
      if (db.egresos_caja) {
        const list = await db.egresos_caja.toArray();
        setEgresos(list || []);
      }
    } catch (err) {
      console.warn('Error al cargar egresos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEgresos();
  }, []);

  const filteredEgresos = useMemo(() => {
    return egresos.filter(item => {
      const matchSearch = !search || 
        item.documento?.toLowerCase().includes(search.toLowerCase()) ||
        item.proveedor?.toLowerCase().includes(search.toLowerCase()) ||
        item.usuario?.toLowerCase().includes(search.toLowerCase()) ||
        item.categoria?.toLowerCase().includes(search.toLowerCase()) ||
        item.sesion?.toLowerCase().includes(search.toLowerCase());

      const matchCategoria = selectedCategoria === 'Todas' || item.categoria === selectedCategoria;
      const matchMetodo = selectedMetodo === 'Todos' || item.metodo_pago === selectedMetodo;
      const matchUsuario = selectedUsuario === 'Todos' || item.usuario === selectedUsuario;
      const matchCaja = selectedCaja === 'Todas' || item.sesion?.includes(selectedCaja);

      return matchSearch && matchCategoria && matchMetodo && matchUsuario && matchCaja;
    });
  }, [egresos, search, selectedCategoria, selectedMetodo, selectedUsuario, selectedCaja]);

  const totalMontoFiltrado = useMemo(() => {
    return filteredEgresos.reduce((acc, curr) => acc + (Number(curr.monto) || 0), 0);
  }, [filteredEgresos]);

  // Paginación
  const totalPages = Math.ceil(filteredEgresos.length / pageSize) || 1;
  const paginatedEgresos = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEgresos.slice(start, start + pageSize);
  }, [filteredEgresos, currentPage, pageSize]);

  const handleResetFilters = () => {
    setSearch('');
    setSelectedSucursal('Todas');
    setSelectedCaja('Todas');
    setSelectedCategoria('Todas');
    setSelectedUsuario('Todos');
    setSelectedMetodo('Todos');
    setCurrentPage(1);
  };

  const handleCreateEgreso = async (e) => {
    e.preventDefault();
    if (!formMonto || Number(formMonto) <= 0) return;

    const now = new Date();
    const fechaStr = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;

    const newRecord = {
      id: `eg-${Date.now()}`,
      fecha: fechaStr,
      sesion: formSesion || '#17',
      categoria: formCategoria,
      badgeCategoria: formCategoria,
      proveedor: formProveedor || '—',
      documento: formDocumento || `EGR-${Date.now().toString().slice(-4)}`,
      usuario: formUsuario,
      metodo_pago: formMetodo,
      monto: Number(formMonto),
      notas: formNotas
    };

    try {
      await db.egresos_caja.add(newRecord);
      showToast(`Egreso registrado correctamente: S/ ${Number(formMonto).toFixed(2)}`);
      setIsModalOpen(false);
      setFormMonto('');
      setFormProveedor('');
      setFormDocumento('');
      setFormNotas('');
      loadEgresos();
    } catch (err) {
      console.error(err);
      showToast('Error al registrar egreso');
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="egresos" onSelectTab={onSelectSubView} />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Egresos</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Histórico de egresos — de mis cajas (abiertas y cerradas)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="px-3.5 py-2 bg-rose-50/60 rounded-xl border border-rose-200/60 text-right">
            <span className="text-[11px] font-semibold text-rose-600 block leading-tight">Total retirado</span>
            <span className="text-base font-black text-rose-700 tracking-tight">
              S/ {totalMontoFiltrado.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Agregar egreso</span>
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
              placeholder="Buscar por motivo, proveedor, doc..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
              className="w-full pl-8 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition"
            />
          </div>

          {/* Sucursal */}
          <div>
            <select
              value={selectedSucursal}
              onChange={(e) => setSelectedSucursal(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700"
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
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700"
            >
              <option value="Todas">Todas las cajas</option>
              <option value="17">Caja #17</option>
              <option value="14">Caja #14</option>
              <option value="11">Caja #11</option>
              <option value="5">Caja #5</option>
              <option value="1">Caja #1</option>
            </select>
          </div>

          {/* Categoría */}
          <div>
            <select
              value={selectedCategoria}
              onChange={(e) => setSelectedCategoria(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700"
            >
              <option value="Todas">Todas las categorías</option>
              <option value="Gasto">Gasto</option>
              <option value="Pago a proveedor">Pago a proveedor</option>
              <option value="Compra">Compra</option>
              <option value="Anulación venta">Anulación venta</option>
              <option value="Otro egreso">Otro egreso</option>
            </select>
          </div>

          {/* Método */}
          <div>
            <select
              value={selectedMetodo}
              onChange={(e) => setSelectedMetodo(e.target.value)}
              className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 text-slate-700"
            >
              <option value="Todos">Todos los métodos</option>
              <option value="Efectivo">Efectivo</option>
              <option value="Yape">Yape</option>
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

      {/* Tabla de Egresos */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Fecha</th>
                <th className="py-3 px-3">Sesión</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-4">Proveedor</th>
                <th className="py-3 px-4">Documento / Referencia</th>
                <th className="py-3 px-3">Usuario</th>
                <th className="py-3 px-3">Método de pago</th>
                <th className="py-3 px-4 text-right">Monto</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedEgresos.length === 0 ? (
                <tr>
                  <td colSpan="9" className="py-12 text-center text-slate-400">
                    No se encontraron egresos registrados con los criterios seleccionados.
                  </td>
                </tr>
              ) : (
                paginatedEgresos.map((eg) => (
                  <tr key={eg.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {eg.fecha}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-700 whitespace-nowrap">
                      {eg.sesion}
                    </td>
                    <td className="py-3 px-3 whitespace-nowrap">
                      {eg.categoria === 'Pago a proveedor' || eg.categoria === 'Compra' ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200/60">
                          {eg.categoria}
                        </span>
                      ) : eg.categoria?.includes('Anulación') ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200/60">
                          {eg.categoria}
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200/60">
                          {eg.categoria}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-slate-700 font-medium max-w-[180px] truncate" title={eg.proveedor}>
                      {eg.proveedor}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800 max-w-[200px] truncate" title={eg.documento}>
                      {eg.documento}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {eg.usuario}
                    </td>
                    <td className="py-3 px-3 text-slate-600 whitespace-nowrap">
                      {eg.metodo_pago}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-rose-600 whitespace-nowrap font-mono text-xs">
                      - S/ {Number(eg.monto).toFixed(2)}
                    </td>
                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedTicket(eg)}
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
            <span>Total: {filteredEgresos.length} registros</span>
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

      {/* Modal Registrar Egreso */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center font-bold">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">Registrar Egreso de Caja</h3>
                  <p className="text-[11px] text-rose-800">Salida de dinero / pago de servicios o proveedor</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEgreso} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Monto a retirar (S/)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0.00"
                  value={formMonto}
                  onChange={(e) => setFormMonto(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-base font-black text-rose-600 focus:outline-hidden focus:ring-2 focus:ring-rose-500/20 focus:border-rose-600"
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
                    <option value="Gasto">Gasto menor</option>
                    <option value="Pago a proveedor">Pago a proveedor</option>
                    <option value="Compra">Compra directa</option>
                    <option value="Anulación venta">Anulación de venta</option>
                    <option value="Retiro de socios">Retiro socios / dueño</option>
                    <option value="Otro egreso">Otro egreso</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Método de salida</label>
                  <select
                    value={formMetodo}
                    onChange={(e) => setFormMetodo(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                  >
                    <option value="Efectivo">Efectivo</option>
                    <option value="Yape">Yape</option>
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
                    <option value="#17">#17 - Caja Secundaria</option>
                    <option value="#14">#14 - Turno Mañana</option>
                    <option value="#18">#18 - Caja Principal</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Proveedor / Beneficiario</label>
                  <input
                    type="text"
                    placeholder="Ej. Distribuidora / Persona"
                    value={formProveedor}
                    onChange={(e) => setFormProveedor(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Comprobante / Documento</label>
                <input
                  type="text"
                  placeholder="Ej. Factura F001-450 / Recibo de luz"
                  value={formDocumento}
                  onChange={(e) => setFormDocumento(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-800"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Motivo o Justificación</label>
                <textarea
                  rows="2"
                  placeholder="Explique el motivo del egreso..."
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
                  className="px-5 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Registrar Egreso
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
                <FileText className="w-4 h-4 text-rose-600" />
                Detalle de Egreso
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
                <span>Proveedor:</span>
                <span className="font-semibold text-slate-800">{selectedTicket.proveedor}</span>
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
                <span className="font-bold text-slate-700">Monto retirado:</span>
                <span className="text-base font-black text-rose-600">- S/ {Number(selectedTicket.monto).toFixed(2)}</span>
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
