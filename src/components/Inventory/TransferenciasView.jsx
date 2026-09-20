import React, { useState, useEffect } from 'react';
import { 
  ArrowRightLeft, History, Plus, Trash2, Search, X, CheckCircle2,
  Package, AlertTriangle, AlertCircle, Check
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import InventorySubNav from './InventorySubNav';

export default function TransferenciasView({ onSelectSubView, initialProductToTransfer }) {
  const [desdeSucursal, setDesdeSucursal] = useState('Principal');
  const [haciaSucursal, setHaciaSucursal] = useState('');
  const [transferItems, setTransferItems] = useState([]);
  const [notas, setNotas] = useState('');

  // Catálogo de productos para el modal selector
  const [products, setProducts] = useState([]);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [modalSearch, setModalSearch] = useState('');
  const [selectedProductToAdd, setSelectedProductToAdd] = useState(null);
  const [addQuantity, setAddQuantity] = useState(1);
  const [addPresentation, setAddPresentation] = useState('Unidad');

  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  useEffect(() => {
    db.productos_tienda.toArray().then((list) => {
      setProducts(list || []);
      if (initialProductToTransfer) {
        setTransferItems([
          {
            productoId: initialProductToTransfer.id,
            nombre: initialProductToTransfer.nombre,
            presentacion: initialProductToTransfer.unidad_medida || 'Unidad',
            cantidad: 1,
            stockMax: initialProductToTransfer.stock_actual ?? 10
          }
        ]);
      }
    }).catch(err => console.warn(err));
  }, [initialProductToTransfer]);

  // Filtrado de productos dentro del modal
  const filteredModalProducts = products.filter(p => {
    const term = modalSearch.toLowerCase().trim();
    if (!term) return true;
    return (p.nombre || '').toLowerCase().includes(term) || (p.codigo_barras || '').toLowerCase().includes(term);
  });

  const handleAddItem = () => {
    if (!selectedProductToAdd || addQuantity <= 0) return;

    // Verificar si ya existe en la lista
    const existingIndex = transferItems.findIndex(i => i.productoId === selectedProductToAdd.id);
    if (existingIndex >= 0) {
      const updated = [...transferItems];
      updated[existingIndex].cantidad += Number(addQuantity);
      setTransferItems(updated);
    } else {
      setTransferItems(prev => [
        ...prev,
        {
          productoId: selectedProductToAdd.id,
          nombre: selectedProductToAdd.nombre,
          presentacion: addPresentation,
          cantidad: Number(addQuantity),
          stockMax: selectedProductToAdd.stock_actual ?? 0
        }
      ]);
    }

    setIsAddModalOpen(false);
    setSelectedProductToAdd(null);
    setAddQuantity(1);
    setModalSearch('');
    showToast(`"${selectedProductToAdd.nombre}" agregado a la lista.`);
  };

  const handleRemoveItem = (index) => {
    setTransferItems(prev => prev.filter((_, idx) => idx !== index));
  };

  const handleUpdateItemQty = (index, val) => {
    const qty = Math.max(1, Number(val) || 1);
    setTransferItems(prev => prev.map((item, idx) => idx === index ? { ...item, cantidad: qty } : item));
  };

  const handleUpdateItemPres = (index, val) => {
    setTransferItems(prev => prev.map((item, idx) => idx === index ? { ...item, presentacion: val } : item));
  };

  const handleSubmitTransfer = async (e) => {
    e.preventDefault();
    if (!haciaSucursal) {
      alert('Por favor selecciona la sucursal de destino.');
      return;
    }

    if (transferItems.length === 0) {
      alert('Debes agregar al menos un producto para transferir.');
      return;
    }

    if (desdeSucursal === haciaSucursal) {
      alert('La sucursal de origen y destino deben ser distintas.');
      return;
    }

    const now = new Date();
    const displayDate = `${now.getDate()}/${now.getMonth() + 1}/${now.getFullYear()}, ${now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}`;
    const itemsSummary = transferItems.map(i => `× ${i.cantidad}`).join('  ');

    const newTransfer = {
      id: `trf-${Date.now()}`,
      fecha: now.toISOString(),
      fechaDisplay: displayDate,
      origen: desdeSucursal,
      destino: haciaSucursal,
      productos: transferItems,
      productosDisplay: itemsSummary,
      estado: 'Confirmado',
      notas: notas.trim() || 'Traslado entre sucursales'
    };

    // Guardar en Dexie transferencias
    if (db.transferencias_inventario) {
      await db.transferencias_inventario.add(newTransfer);
    }

    // Descontar stock en origen y registrar en Kardex
    for (const item of transferItems) {
      const prod = products.find(p => p.id === item.productoId);
      if (prod) {
        const nuevoStock = Math.max(0, (Number(prod.stock_actual) || 0) - item.cantidad);
        await db.productos_tienda.update(prod.id, { stock_actual: nuevoStock });

        if (db.kardex) {
          await db.kardex.add({
            id: `kdx-${Date.now()}-${Math.random()}`,
            fecha: now.toISOString(),
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            tipo: 'SALIDA',
            cantidad: item.cantidad,
            motivo: `Transferencia a ${haciaSucursal}: ${notas || 'Traslado de mercadería'}`,
            documento_ref: `TRF-${newTransfer.id.slice(-6).toUpperCase()}`,
            sucursal: desdeSucursal,
            saldo_nuevo: nuevoStock
          });
        }
      }
    }

    syncService.triggerBackgroundSync();
    showToast(`Transferencia a "${haciaSucursal}" enviada exitosamente.`);

    // Limpiar formulario y navegar al historial
    setTimeout(() => {
      if (onSelectSubView) {
        onSelectSubView('historial_transferencias');
      }
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior de Inventario */}
      {onSelectSubView && (
        <InventorySubNav currentSubView="transferencias" onSelectSubView={onSelectSubView} />
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Transferencias de inventario
            </h1>
            <p className="text-xs text-slate-500">
              Mueve stock entre sucursales. Agrega varios productos desde el modal de búsqueda.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectSubView && onSelectSubView('historial_transferencias')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <History className="w-3.5 h-3.5 text-slate-500" />
            <span>Ver historial</span>
          </button>
        </div>

        {/* ── TARJETA DEL FORMULARIO PRINCIPAL ── */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-5">
          
          {/* Fila: Desde sucursal / Hacia sucursal */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Desde sucursal
              </label>
              <select
                value={desdeSucursal}
                onChange={(e) => setDesdeSucursal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Principal">Principal</option>
                <option value="ALMACEN">ALMACEN</option>
                <option value="Sucursal 2">Sucursal 2</option>
              </select>
            </div>

            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Hacia sucursal
              </label>
              <select
                value={haciaSucursal}
                onChange={(e) => setHaciaSucursal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">Selecciona destino</option>
                <option value="ALMACEN">ALMACEN</option>
                <option value="Sucursal 2">Sucursal 2</option>
                <option value="Sucursal Norte">Sucursal Norte</option>
                <option value="Principal">Principal</option>
              </select>
            </div>
          </div>

          {/* Sección: Productos a transferir */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-slate-500" />
                <h3 className="text-xs font-bold text-slate-800">
                  Productos a transferir
                </h3>
              </div>

              <button
                type="button"
                onClick={() => {
                  setSelectedProductToAdd(products[0] || null);
                  setIsAddModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Agregar productos</span>
              </button>
            </div>

            {/* Tabla de Productos a transferir */}
            <div className="rounded-xl border border-slate-200 overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 bg-slate-50/50">
                    <th className="py-2.5 px-4">Producto</th>
                    <th className="py-2.5 px-4">Presentación</th>
                    <th className="py-2.5 px-4 text-center">Cantidad</th>
                    <th className="py-2.5 px-4 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  {transferItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition">
                      
                      <td className="py-2.5 px-4 font-bold text-slate-800">
                        {item.nombre}
                      </td>

                      <td className="py-2.5 px-4">
                        <select
                          value={item.presentacion}
                          onChange={(e) => handleUpdateItemPres(idx, e.target.value)}
                          className="px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
                        >
                          <option value="Unidad">Unidad</option>
                          <option value="Caja">Caja</option>
                          <option value="Paquete">Paquete</option>
                          <option value="Ciento">Ciento</option>
                          <option value="Bolsa">Bolsa</option>
                          <option value="Kilo">Kilo</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-4 text-center">
                        <input
                          type="number"
                          min="1"
                          max={item.stockMax || 9999}
                          value={item.cantidad}
                          onChange={(e) => handleUpdateItemQty(idx, e.target.value)}
                          className="w-20 px-2 py-1 text-center font-bold bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-900 focus:bg-white focus:outline-none"
                        />
                      </td>

                      <td className="py-2.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded hover:bg-rose-50 transition cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>

                    </tr>
                  ))}

                  {transferItems.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-slate-400 text-xs italic">
                        No hay productos. Haz clic en "Agregar productos" para buscar y añadir.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Campo: Notas (opcional) */}
          <div>
            <label className="text-[11px] font-bold text-slate-600 block mb-1">
              Notas (opcional)
            </label>
            <input
              type="text"
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej: Traslado para sucursal 2"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none transition"
            />
          </div>

          {/* Botón de Enviar transferencia (Inferior derecho, verde) */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleSubmitTransfer}
              className="px-5 py-2.5 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-2 shadow-2xs active:scale-95 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4" />
              <span>Enviar transferencia</span>
            </button>
          </div>

        </div>

      </main>

      {/* ── MODAL: AGREGAR PRODUCTOS ── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Agregar Producto a Transferir</h3>
                  <p className="text-[11px] text-slate-500">Busca en tu inventario y define cantidad</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Buscador de producto */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={modalSearch}
                onChange={(e) => setModalSearch(e.target.value)}
                placeholder="Buscar por nombre o código..."
                className="w-full pl-8 pr-7 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none transition"
              />
              {modalSearch && (
                <button
                  type="button"
                  onClick={() => setModalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Lista seleccionable de productos */}
            <div className="max-h-48 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredModalProducts.map((p) => {
                const isSelected = selectedProductToAdd?.id === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      setSelectedProductToAdd(p);
                      setAddPresentation(p.unidad_medida || 'Unidad');
                    }}
                    className={`w-full p-2.5 text-left flex items-center justify-between text-xs transition cursor-pointer ${
                      isSelected ? 'bg-emerald-50/80 font-bold' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div>
                      <p className="font-semibold text-slate-800">{p.nombre}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{p.codigo_barras || 'Sin código'}</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                        Stock: {p.stock_actual ?? 0}
                      </span>
                    </div>
                  </button>
                );
              })}
              {filteredModalProducts.length === 0 && (
                <p className="py-6 text-center text-xs text-slate-400 italic">
                  No se encontraron productos coincidentes.
                </p>
              )}
            </div>

            {/* Cantidad y Presentación */}
            {selectedProductToAdd && (
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <p className="text-xs font-bold text-slate-800">
                  Seleccionado: <span className="text-emerald-700">{selectedProductToAdd.nombre}</span>
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={addQuantity}
                      onChange={(e) => setAddQuantity(e.target.value)}
                      className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-bold text-slate-600 block mb-1">Presentación</label>
                    <select
                      value={addPresentation}
                      onChange={(e) => setAddPresentation(e.target.value)}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-900 focus:outline-none cursor-pointer"
                    >
                      <option value="Unidad">Unidad</option>
                      <option value="Caja">Caja</option>
                      <option value="Paquete">Paquete</option>
                      <option value="Ciento">Ciento</option>
                      <option value="Bolsa">Bolsa</option>
                      <option value="Kilo">Kilo</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                disabled={!selectedProductToAdd}
                onClick={handleAddItem}
                className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl transition shadow-2xs cursor-pointer"
              >
                Añadir a la Lista
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
