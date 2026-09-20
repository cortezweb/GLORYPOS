import React, { useState, useEffect, useMemo } from 'react';
import { 
  Activity, Plus, Minus, FileText, Search, X, SlidersHorizontal,
  ArrowRightLeft, History, CheckCircle2, AlertTriangle, AlertCircle
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import InventorySubNav from './InventorySubNav';

export default function MovimientosView({ onSelectSubView, onSelectProductForKardex, onSelectProductForTransfer }) {
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  const [selectedSucursal, setSelectedSucursal] = useState('Todas');
  const [stockMenorA, setStockMenorA] = useState('');
  const [soloBajoMinimo, setSoloBajoMinimo] = useState(false);
  const [porVencer, setPorVencer] = useState(false);
  
  // Paginación
  const [pageSize, setPageSize] = useState(25);
  const [currentPage, setCurrentPage] = useState(1);

  // Modales
  const [isIngresoModalOpen, setIsIngresoModalOpen] = useState(false);
  const [isEgresoModalOpen, setIsEgresoModalOpen] = useState(false);
  const [isConteoModalOpen, setIsConteoModalOpen] = useState(false);
  const [isAjustarModalOpen, setIsAjustarModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Formularios
  const [movForm, setMovForm] = useState({
    productoId: '',
    cantidad: 1,
    sucursal: 'Principal',
    motivo: '',
    documento: ''
  });

  const [ajusteForm, setAjusteForm] = useState({
    nuevoStock: 0,
    motivo: 'Ajuste de inventario físico'
  });

  const [conteoForm, setConteoForm] = useState({
    productoId: '',
    stockFisico: 0,
    observacion: 'Conteo físico periódico'
  });

  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadProducts = async () => {
    try {
      const list = await db.productos_tienda.toArray();
      setProducts(list || []);
    } catch (err) {
      console.warn('Error loading products for movimientos:', err);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Lista de categorías únicas
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.categoria && p.categoria !== '-') set.add(p.categoria);
    });
    return ['Todas', ...Array.from(set)];
  }, [products]);

  // Filtrado en tiempo real
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const code = (p.codigo_barras || '').toLowerCase();
      const name = (p.nombre || '').toLowerCase();
      const term = search.toLowerCase().trim();

      if (term && !code.includes(term) && !name.includes(term)) {
        return false;
      }

      if (selectedCategory !== 'Todas') {
        if (p.categoria !== selectedCategory) return false;
      }

      const stock = Number(p.stock_actual) || 0;
      const minStock = Number(p.stock_minimo) || 5;

      if (stockMenorA !== '') {
        const num = Number(stockMenorA);
        if (!isNaN(num) && stock >= num) return false;
      }

      if (soloBajoMinimo) {
        if (stock > minStock) return false;
      }

      if (porVencer) {
        if (!p.fecha_vencimiento) return false;
      }

      return true;
    });
  }, [products, search, selectedCategory, stockMenorA, soloBajoMinimo, porVencer]);

  // Paginación
  const totalPages = Math.ceil(filteredProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // Acción: Guardar Ingreso (+ Ingreso)
  const handleSaveIngreso = async (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === movForm.productoId);
    if (!prod) return;

    const cant = Number(movForm.cantidad) || 1;
    const nuevoStock = (Number(prod.stock_actual) || 0) + cant;

    await db.productos_tienda.update(prod.id, {
      stock_actual: nuevoStock,
      controla_stock: true
    });

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        tipo: 'ENTRADA',
        cantidad: cant,
        motivo: movForm.motivo || 'Ingreso manual de stock',
        documento_ref: movForm.documento || 'ING-MANUAL',
        sucursal: movForm.sucursal || 'Principal',
        saldo_nuevo: nuevoStock
      });
    }

    setIsIngresoModalOpen(false);
    setMovForm({ productoId: '', cantidad: 1, sucursal: 'Principal', motivo: '', documento: '' });
    await loadProducts();
    showToast(`+${cant} unidades ingresadas a "${prod.nombre}".`);
    syncService.triggerBackgroundSync();
  };

  // Acción: Guardar Egreso (- Egreso)
  const handleSaveEgreso = async (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === movForm.productoId);
    if (!prod) return;

    const cant = Number(movForm.cantidad) || 1;
    const nuevoStock = Math.max(0, (Number(prod.stock_actual) || 0) - cant);

    await db.productos_tienda.update(prod.id, {
      stock_actual: nuevoStock,
      controla_stock: true
    });

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        tipo: 'SALIDA',
        cantidad: cant,
        motivo: movForm.motivo || 'Egreso / Merma manual',
        documento_ref: movForm.documento || 'EGR-MANUAL',
        sucursal: movForm.sucursal || 'Principal',
        saldo_nuevo: nuevoStock
      });
    }

    setIsEgresoModalOpen(false);
    setMovForm({ productoId: '', cantidad: 1, sucursal: 'Principal', motivo: '', documento: '' });
    await loadProducts();
    showToast(`-${cant} unidades egresadas de "${prod.nombre}".`);
    syncService.triggerBackgroundSync();
  };

  // Acción: Guardar Ajuste Rápido de Fila
  const handleOpenAjustar = (prod) => {
    setSelectedProduct(prod);
    setAjusteForm({
      nuevoStock: prod.stock_actual ?? 0,
      motivo: 'Ajuste de inventario físico'
    });
    setIsAjustarModalOpen(true);
  };

  const handleSaveAjuste = async (e) => {
    e.preventDefault();
    if (!selectedProduct) return;

    const nuevo = Number(ajusteForm.nuevoStock) || 0;
    const anterior = Number(selectedProduct.stock_actual) || 0;
    const diff = nuevo - anterior;

    await db.productos_tienda.update(selectedProduct.id, {
      stock_actual: nuevo,
      controla_stock: true
    });

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: selectedProduct.id,
        producto_nombre: selectedProduct.nombre,
        tipo: diff >= 0 ? 'ENTRADA' : 'SALIDA',
        cantidad: Math.abs(diff),
        motivo: ajusteForm.motivo || 'Ajuste de inventario físico',
        documento_ref: 'AJUSTE-STOCK',
        sucursal: 'Principal',
        saldo_nuevo: nuevo
      });
    }

    setIsAjustarModalOpen(false);
    setSelectedProduct(null);
    await loadProducts();
    showToast(`Stock de "${selectedProduct.nombre}" ajustado a ${nuevo}.`);
    syncService.triggerBackgroundSync();
  };

  // Acción: Conteo Físico
  const handleSaveConteo = async (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === conteoForm.productoId);
    if (!prod) return;

    const nuevo = Number(conteoForm.stockFisico) || 0;
    const anterior = Number(prod.stock_actual) || 0;
    const diff = nuevo - anterior;

    await db.productos_tienda.update(prod.id, {
      stock_actual: nuevo,
      controla_stock: true
    });

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        tipo: diff >= 0 ? 'ENTRADA' : 'SALIDA',
        cantidad: Math.abs(diff),
        motivo: conteoForm.observacion || 'Auditoría conteo físico',
        documento_ref: 'CONTEO-AUDIT',
        sucursal: 'Principal',
        saldo_nuevo: nuevo
      });
    }

    setIsConteoModalOpen(false);
    setConteoForm({ productoId: '', stockFisico: 0, observacion: 'Conteo físico periódico' });
    await loadProducts();
    showToast(`Conteo físico registrado para "${prod.nombre}".`);
    syncService.triggerBackgroundSync();
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior de Inventario */}
      {onSelectSubView && (
        <InventorySubNav currentSubView="movimientos" onSelectSubView={onSelectSubView} />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 w-full space-y-4">

        {/* ── CABECERA Y BOTONES DE ACCIÓN ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Movimientos
            </h1>
            <p className="text-xs text-slate-500">
              Stock actual por producto, con acciones rápidas de ajuste, kardex y transferencia.
            </p>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setMovForm({ productoId: products[0]?.id || '', cantidad: 1, sucursal: 'Principal', motivo: 'Ingreso de mercadería', documento: '' });
                setIsIngresoModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <Plus className="w-3.5 h-3.5 text-emerald-600" />
              <span>Ingreso</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setMovForm({ productoId: products[0]?.id || '', cantidad: 1, sucursal: 'Principal', motivo: 'Egreso / Merma de stock', documento: '' });
                setIsEgresoModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <Minus className="w-3.5 h-3.5 text-rose-600" />
              <span>Egreso</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setConteoForm({ productoId: products[0]?.id || '', stockFisico: products[0]?.stock_actual ?? 0, observacion: 'Conteo físico general' });
                setIsConteoModalOpen(true);
              }}
              className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              <span>Conteo físico</span>
            </button>
          </div>
        </div>

        {/* ── PANEL DE FILTROS (EXACTO A LA CAPTURA) ── */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            
            {/* Buscar */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Buscar</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
                  placeholder="Nombre o código..."
                  className="w-full pl-8 pr-7 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none focus:border-emerald-500 transition"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>

            {/* Categoría */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Categoría</label>
              <select
                value={selectedCategory}
                onChange={(e) => { setSelectedCategory(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Sucursal */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Sucursal</label>
              <select
                value={selectedSucursal}
                onChange={(e) => { setSelectedSucursal(e.target.value); setCurrentPage(1); }}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Todas">Todas</option>
                <option value="Principal">Principal</option>
                <option value="ALMACEN">ALMACEN</option>
                <option value="Sucursal 2">Sucursal 2</option>
              </select>
            </div>

            {/* Stock menor a */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">Stock menor a</label>
              <input
                type="number"
                value={stockMenorA}
                onChange={(e) => { setStockMenorA(e.target.value); setCurrentPage(1); }}
                placeholder="Ej. 10"
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none transition"
              />
            </div>

          </div>

          {/* Toggles inferiores */}
          <div className="flex items-center gap-6 pt-1 text-xs text-slate-600">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={soloBajoMinimo}
                onChange={(e) => { setSoloBajoMinimo(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="font-medium text-slate-700">Solo bajo mínimo</span>
            </label>

            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={porVencer}
                onChange={(e) => { setPorVencer(e.target.checked); setCurrentPage(1); }}
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
              />
              <span className="font-medium text-slate-700">Por vencer</span>
            </label>
          </div>
        </div>

        {/* ── TABLA DE PRODUCTOS Y MOVIMIENTOS ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 bg-white">
                  <th className="py-3 px-4">Código</th>
                  <th className="py-3 px-4">Producto</th>
                  <th className="py-3 px-4">Categoría</th>
                  <th className="py-3 px-4 text-center">Stock</th>
                  <th className="py-3 px-4 text-center">Mínimo</th>
                  <th className="py-3 px-4 text-center">Vencimiento</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProducts.map((p) => {
                  const stock = Number(p.stock_actual) || 0;
                  const minimo = Number(p.stock_minimo) || 5;
                  const isLow = stock <= minimo && stock > 0;
                  const isOut = stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Código */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-600 whitespace-nowrap">
                        {p.codigo_barras || '—'}
                      </td>

                      {/* Producto */}
                      <td className="py-3 px-4 font-bold text-slate-900">
                        {p.nombre}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-4 text-slate-500">
                        {p.categoria || '—'}
                      </td>

                      {/* Stock (Pastilla verde suave idéntica al mockup) */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-xs ${
                          isOut 
                            ? 'bg-rose-50 text-rose-700' 
                            : isLow 
                            ? 'bg-amber-50 text-amber-700' 
                            : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {stock}
                        </span>
                      </td>

                      {/* Mínimo */}
                      <td className="py-3 px-4 text-center font-medium text-slate-600">
                        {minimo}
                      </td>

                      {/* Vencimiento */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        {p.fecha_vencimiento || '—'}
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {isOut ? (
                          <span className="text-rose-600 font-bold text-[11px]">Agotado</span>
                        ) : isLow ? (
                          <span className="text-amber-600 font-bold text-[11px]">Bajo</span>
                        ) : (
                          <span className="text-emerald-600 font-bold text-[11px]">OK</span>
                        )}
                      </td>

                      {/* Botones de acción */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          
                          {/* Ajustar */}
                          <button
                            type="button"
                            onClick={() => handleOpenAjustar(p)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <SlidersHorizontal className="w-3 h-3" />
                            <span>Ajustar</span>
                          </button>

                          {/* Kardex */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectProductForKardex) {
                                onSelectProductForKardex(p);
                              } else if (onSelectSubView) {
                                onSelectSubView('kardex');
                              }
                            }}
                            className="px-2 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <History className="w-3 h-3" />
                            <span>Kardex</span>
                          </button>

                          {/* Transferir */}
                          <button
                            type="button"
                            onClick={() => {
                              if (onSelectProductForTransfer) {
                                onSelectProductForTransfer(p);
                              } else if (onSelectSubView) {
                                onSelectSubView('transferencias');
                              }
                            }}
                            className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-lg text-[11px] font-bold flex items-center gap-1 transition cursor-pointer"
                          >
                            <ArrowRightLeft className="w-3 h-3" />
                            <span>Transferir</span>
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}

                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                      No se encontraron productos que coincidan con los filtros.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PIE DE PÁGINA Y PAGINACIÓN ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div className="flex items-center gap-3">
            <span>
              Mostrando {filteredProducts.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}-
              {Math.min(currentPage * pageSize, filteredProducts.length)} de {filteredProducts.length}
            </span>

            <div className="flex items-center gap-1.5">
              <span>Mostrar</span>
              <select
                value={pageSize}
                onChange={(e) => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
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

      {/* ── MODAL: INGRESO (+ Ingreso) ── */}
      {isIngresoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Plus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registrar Ingreso de Stock</h3>
                  <p className="text-[11px] text-slate-500">Aumenta las existencias en inventario</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsIngresoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveIngreso} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Producto</label>
                <select
                  required
                  value={movForm.productoId}
                  onChange={(e) => setMovForm({ ...movForm, productoId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual ?? 0})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cantidad a ingresar</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movForm.cantidad}
                    onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sucursal destino</label>
                  <select
                    value={movForm.sucursal}
                    onChange={(e) => setMovForm({ ...movForm, sucursal: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Principal">Principal</option>
                    <option value="ALMACEN">ALMACEN</option>
                    <option value="Sucursal 2">Sucursal 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo / Detalle</label>
                <input
                  type="text"
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                  placeholder="Ej. Compra directa, producción interna"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Documento / Ref (Opcional)</label>
                <input
                  type="text"
                  value={movForm.documento}
                  onChange={(e) => setMovForm({ ...movForm, documento: e.target.value })}
                  placeholder="Ej. Factura 001-4982"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsIngresoModalOpen(false)}
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

      {/* ── MODAL: EGRESO (- Egreso) ── */}
      {isEgresoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Minus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Registrar Egreso / Salida</h3>
                  <p className="text-[11px] text-slate-500">Descuenta unidades por merma, daño o autoconsumo</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEgresoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEgreso} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Producto</label>
                <select
                  required
                  value={movForm.productoId}
                  onChange={(e) => setMovForm({ ...movForm, productoId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Stock: {p.stock_actual ?? 0})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Cantidad a descontar</label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={movForm.cantidad}
                    onChange={(e) => setMovForm({ ...movForm, cantidad: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Sucursal origen</label>
                  <select
                    value={movForm.sucursal}
                    onChange={(e) => setMovForm({ ...movForm, sucursal: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Principal">Principal</option>
                    <option value="ALMACEN">ALMACEN</option>
                    <option value="Sucursal 2">Sucursal 2</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo</label>
                <select
                  value={movForm.motivo}
                  onChange={(e) => setMovForm({ ...movForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Merma o deterioro">Merma o deterioro</option>
                  <option value="Producto vencido">Producto vencido</option>
                  <option value="Uso interno / degustación">Uso interno / degustación</option>
                  <option value="Pérdida no identificada">Pérdida no identificada</option>
                  <option value="Ajuste negativo">Ajuste negativo</option>
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Documento / Ref (Opcional)</label>
                <input
                  type="text"
                  value={movForm.documento}
                  onChange={(e) => setMovForm({ ...movForm, documento: e.target.value })}
                  placeholder="Ej. ACTA-MERMA-01"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEgresoModalOpen(false)}
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

      {/* ── MODAL: CONTEO FÍSICO ── */}
      {isConteoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Auditoría / Conteo Físico</h3>
                  <p className="text-[11px] text-slate-500">Concilia el inventario real en anaqueles</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsConteoModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConteo} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Producto</label>
                <select
                  required
                  value={conteoForm.productoId}
                  onChange={(e) => {
                    const sel = products.find(p => p.id === e.target.value);
                    setConteoForm({
                      ...conteoForm,
                      productoId: e.target.value,
                      stockFisico: sel?.stock_actual ?? 0
                    });
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="">Selecciona un producto...</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nombre} (Sistema: {p.stock_actual ?? 0})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Cantidad contada físicamente</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={conteoForm.stockFisico}
                  onChange={(e) => setConteoForm({ ...conteoForm, stockFisico: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Observación</label>
                <input
                  type="text"
                  value={conteoForm.observacion}
                  onChange={(e) => setConteoForm({ ...conteoForm, observacion: e.target.value })}
                  placeholder="Ej. Cuadre de fin de mes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsConteoModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Aplicar Cuadre
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: AJUSTAR (Desde fila) ── */}
      {isAjustarModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <SlidersHorizontal className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Ajuste Rápido de Stock</h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[200px]">{selectedProduct.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAjustarModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAjuste} className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center text-xs">
                <span className="text-slate-500 font-medium">Stock en sistema actual:</span>
                <span className="font-bold text-slate-800">{selectedProduct.stock_actual ?? 0}</span>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nuevo Stock</label>
                <input
                  type="number"
                  min="0"
                  required
                  value={ajusteForm.nuevoStock}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, nuevoStock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo del ajuste</label>
                <input
                  type="text"
                  required
                  value={ajusteForm.motivo}
                  onChange={(e) => setAjusteForm({ ...ajusteForm, motivo: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAjustarModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
