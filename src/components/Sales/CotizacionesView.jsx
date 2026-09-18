import React, { useState, useEffect } from 'react';
import { 
  FileSpreadsheet, Plus, Search, Calendar, User, Phone, 
  ShoppingCart, Share2, Printer, Trash2, CheckCircle2, Clock, 
  ArrowRight, X, Sparkles, Tag, ShieldCheck 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useCart } from '../../context/CartContext';
import SalesSubNav from './SalesSubNav';

export default function CotizacionesView({ onSelectSubView, onOpenPosWithCart }) {
  const { addItem, clearCart } = useCart();
  const [cotizaciones, setCotizaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [previewCotizacion, setPreviewCotizacion] = useState(null);

  // Form State for new quote
  const [clientList, setClientList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_ci_nit: '',
    cliente_telefono: '',
    validez_dias: 15,
    condiciones: 'Precios válidos por 15 días. Pago al contado contra entrega.',
    items: [],
    descuento: 0
  });

  const loadData = async () => {
    const list = await db.cotizaciones.reverse().toArray();
    setCotizaciones(list);
    const clients = await db.clientes.toArray();
    setClientList(clients);
    const prods = await db.productos_tienda.toArray();
    setProductList(prods);
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCotizado = cotizaciones.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  const totalVigentes = cotizaciones.filter(c => c.estado === 'VIGENTE').length;
  const totalConvertidas = cotizaciones.filter(c => c.estado === 'CONVERTIDA').length;

  const filtered = cotizaciones.filter(c => 
    c.correlativo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cliente_nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.cliente_ci_nit?.includes(searchTerm)
  );

  // Add Item to current quote draft
  const handleAddItemToDraft = (productId) => {
    const prod = productList.find(p => p.id === productId);
    if (!prod) return;

    const existingIndex = formData.items.findIndex(i => i.producto_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...formData.items];
      updated[existingIndex].cantidad += 1;
      updated[existingIndex].subtotal = updated[existingIndex].cantidad * updated[existingIndex].precio;
      setFormData({ ...formData, items: updated });
    } else {
      const newItem = {
        producto_id: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precio: prod.precio_venta,
        subtotal: prod.precio_venta
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }
  };

  const handleUpdateItemQty = (index, delta) => {
    const updated = [...formData.items];
    const newQty = updated[index].cantidad + delta;
    if (newQty <= 0) {
      updated.splice(index, 1);
    } else {
      updated[index].cantidad = newQty;
      updated[index].subtotal = newQty * updated[index].precio;
    }
    setFormData({ ...formData, items: updated });
  };

  const subtotalDraft = formData.items.reduce((acc, i) => acc + i.subtotal, 0);
  const totalDraft = Math.max(0, subtotalDraft - Number(formData.descuento || 0));

  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!formData.cliente_nombre.trim()) {
      alert('Por favor ingresa o selecciona un cliente');
      return;
    }
    if (formData.items.length === 0) {
      alert('Agrega al menos un producto a la cotización');
      return;
    }

    const correlativo = `COT-${Math.floor(10000 + Math.random() * 90000)}`;
    const fecha = new Date();
    const vencimiento = new Date();
    vencimiento.setDate(fecha.getDate() + Number(formData.validez_dias));

    const newQuote = {
      id: `cot-${Date.now()}`,
      correlativo,
      fecha: fecha.toISOString(),
      vencimiento: vencimiento.toISOString(),
      cliente_nombre: formData.cliente_nombre,
      cliente_ci_nit: formData.cliente_ci_nit || '0',
      cliente_telefono: formData.cliente_telefono || '',
      estado: 'VIGENTE',
      items: formData.items,
      subtotal: subtotalDraft,
      descuento: Number(formData.descuento || 0),
      total: totalDraft,
      validez_dias: formData.validez_dias,
      condiciones: formData.condiciones
    };

    await db.cotizaciones.add(newQuote);
    await loadData();
    setIsNewModalOpen(false);
    // Reset form
    setFormData({
      cliente_nombre: '',
      cliente_ci_nit: '',
      cliente_telefono: '',
      validez_dias: 15,
      condiciones: 'Precios válidos por 15 días. Pago al contado contra entrega.',
      items: [],
      descuento: 0
    });
  };

  // Convert Quote into POS Cart
  const handleLoadToPos = async (cot) => {
    if (window.confirm(`¿Deseas cargar los ${cot.items.length} productos de la cotización ${cot.correlativo} al Punto de Venta (POS)?`)) {
      clearCart();
      // Add each item to cart
      for (const item of cot.items) {
        const prod = productList.find(p => p.id === item.producto_id) || {
          id: item.producto_id,
          nombre: item.nombre,
          precio_venta: item.precio,
          unidad_medida: 'Unidad'
        };
        // Add with corresponding quantity
        addItem(prod, null, item.cantidad);
      }
      
      // Update quote status
      await db.cotizaciones.update(cot.id, { estado: 'CONVERTIDA' });
      await loadData();

      // Redirect to POS
      if (onOpenPosWithCart) {
        onOpenPosWithCart();
      } else {
        onSelectSubView('pos');
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Eliminar esta cotización?')) {
      await db.cotizaciones.delete(id);
      await loadData();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Sales Sub-navigation Bar */}
      <SalesSubNav currentSubView="cotizaciones" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Cotizaciones & Proformas
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Elabora presupuestos comerciales y conviértelos a venta con 1 solo clic
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsNewModalOpen(true)}
              className="px-3.5 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-emerald-500/20"
            >
              <Plus className="w-4 h-4" />
              Nueva Cotización
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Monto Total Cotizado
            </span>
            <span className="text-xl font-black text-gray-900 mt-1 block">
              Bs. {totalCotizado.toFixed(2)}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              {cotizaciones.length} propuestas emitidas
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/60 border border-blue-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Cotizaciones Vigentes
            </span>
            <span className="text-xl font-black text-blue-800 mt-1 block">
              {totalVigentes} activas
            </span>
            <span className="text-[11px] text-blue-600 font-semibold mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Listas para ser cerradas
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50/60 border border-purple-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#712ae2] block">
              Convertidas a Ventas
            </span>
            <span className="text-xl font-black text-purple-800 mt-1 block">
              {totalConvertidas} ventas
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Éxito comercial
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por N° cotización, cliente o NIT..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Quotes List */}
        <div className="space-y-3">
          {filtered.map((cot) => {
            const isConvertida = cot.estado === 'CONVERTIDA';
            const fechaStr = new Date(cot.fecha).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });
            const vencimientoStr = new Date(cot.vencimiento).toLocaleDateString('es-BO', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            });

            return (
              <div
                key={cot.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-emerald-300 transition-all p-4 shadow-2xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Detail */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs shrink-0 border border-emerald-100">
                      <FileSpreadsheet className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-gray-900">
                          {cot.correlativo}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isConvertida
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isConvertida ? (
                            <><CheckCircle2 className="w-3 h-3" /> CONVERTIDA EN VENTA</>
                          ) : (
                            <><Clock className="w-3 h-3" /> VIGENTE</>
                          )}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          Emitida: {fechaStr} • Vence: {vencimientoStr}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-gray-800 mt-1 truncate">
                        {cot.cliente_nombre}
                        <span className="text-gray-400 font-normal ml-1">
                          (NIT/CI: {cot.cliente_ci_nit})
                        </span>
                        {cot.cliente_telefono && (
                          <span className="text-gray-500 font-normal ml-2">
                            📱 {cot.cliente_telefono}
                          </span>
                        )}
                      </p>

                      {/* Items preview */}
                      <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-1.5">
                        <span className="font-medium text-gray-700">Ítems:</span>
                        {cot.items?.map((it, idx) => (
                          <span key={idx} className="bg-gray-100 px-2 py-0.5 rounded-md text-gray-700 text-[10px]">
                            {it.cantidad}x {it.nombre}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Cotizado</span>
                      <span className="text-lg font-black text-emerald-700 tracking-tight block">
                        Bs. {Number(cot.total || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Cargar al Carrito POS */}
                      <button
                        onClick={() => handleLoadToPos(cot)}
                        className="px-3 py-1.5 bg-gradient-to-r from-[#2563eb] to-[#712ae2] text-white hover:opacity-95 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
                        title="Cargar productos de esta cotización al carrito POS para facturar"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Cargar al POS</span>
                      </button>

                      {/* Ver Proforma */}
                      <button
                        onClick={() => setPreviewCotizacion(cot)}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition border border-gray-200"
                        title="Ver Proforma / Imprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* WhatsApp Share */}
                      <button
                        onClick={() => {
                          const itemsText = cot.items?.map(i => `• ${i.cantidad}x ${i.nombre} - Bs. ${i.subtotal.toFixed(2)}`).join('\n') || '';
                          const msg = encodeURIComponent(
                            `*COTIZACIÓN GLORYPOS* - ${cot.correlativo}\n` +
                            `Cliente: ${cot.cliente_nombre}\n` +
                            `Válido hasta: ${vencimientoStr}\n\n` +
                            `*Detalle de Productos:*\n${itemsText}\n\n` +
                            `*TOTAL: Bs. ${Number(cot.total).toFixed(2)}*\n\n` +
                            `Condiciones: ${cot.condiciones || 'Pago al contado.'}\n` +
                            `¡Quedamos atentos a su confirmación!`
                          );
                          window.open(`https://wa.me/${cot.cliente_telefono ? cot.cliente_telefono.replace(/\D/g, '') : ''}?text=${msg}`, '_blank');
                        }}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition border border-gray-200"
                        title="Enviar Cotización por WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(cot.id)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-gray-200"
                        title="Eliminar Cotización"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
              <FileSpreadsheet className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="font-bold text-gray-800 text-sm">No se encontraron cotizaciones</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                Crea propuestas de venta profesionales y envíalas al instante a tus clientes por WhatsApp o PDF.
              </p>
              <button
                onClick={() => setIsNewModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-emerald-700 transition"
              >
                <Plus className="w-4 h-4" />
                Crear Primera Cotización
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Modal: Crear Nueva Cotización */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden border border-gray-200 animate-scaleUp">
            {/* Modal Header */}
            <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gradient-to-r from-emerald-500 to-teal-600 text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h2 className="font-bold text-base">Nueva Cotización / Presupuesto</h2>
              </div>
              <button 
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleCreateQuote} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
              {/* Client Selection */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-gray-700 block">Datos del Cliente</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nombre o Razón Social *"
                      value={formData.cliente_nombre}
                      onChange={(e) => setFormData({ ...formData, cliente_nombre: e.target.value })}
                      list="clients-datalist"
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                      required
                    />
                    <datalist id="clients-datalist">
                      {clientList.map(c => (
                        <option key={c.id} value={c.razon_social}>
                          {c.nit_ci ? `NIT: ${c.nit_ci}` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="NIT / CI"
                      value={formData.cliente_ci_nit}
                      onChange={(e) => setFormData({ ...formData, cliente_ci_nit: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Teléfono / WhatsApp (ej. 77012345)"
                    value={formData.cliente_telefono}
                    onChange={(e) => setFormData({ ...formData, cliente_telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Product Selector */}
              <div className="space-y-2 border-t border-gray-100 pt-3">
                <label className="text-xs font-bold text-gray-700 block">Agregar Productos del Inventario</label>
                <div className="flex gap-2">
                  <select
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddItemToDraft(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="flex-1 px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 focus:bg-white focus:ring-2 focus:ring-emerald-500"
                  >
                    <option value="">Selecciona un producto para agregar...</option>
                    {productList.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — Bs. {p.precio_venta?.toFixed(2)} (Stock: {p.stock_actual})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Items in Draft */}
                <div className="space-y-1.5 mt-2 max-h-40 overflow-y-auto">
                  {formData.items.map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-gray-50 rounded-xl text-xs border border-gray-200">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-semibold text-gray-800 truncate">{item.nombre}</p>
                        <p className="text-[10px] text-gray-500">Bs. {item.precio?.toFixed(2)} c/u</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-gray-300 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, -1)}
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-bold text-gray-800">{item.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => handleUpdateItemQty(idx, 1)}
                            className="px-2 py-0.5 text-gray-600 hover:bg-gray-100 font-bold"
                          >
                            +
                          </button>
                        </div>
                        <span className="font-bold text-gray-900 w-16 text-right">
                          Bs. {item.subtotal?.toFixed(2)}
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.items];
                            updated.splice(idx, 1);
                            setFormData({ ...formData, items: updated });
                          }}
                          className="text-gray-400 hover:text-red-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <p className="text-[11px] text-gray-400 italic text-center py-3">
                      No hay productos agregados a la cotización todavía.
                    </p>
                  )}
                </div>
              </div>

              {/* Conditions & Validity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-gray-100 pt-3">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Validez de la Oferta</label>
                  <select
                    value={formData.validez_dias}
                    onChange={(e) => setFormData({ ...formData, validez_dias: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  >
                    <option value={7}>7 días calendario</option>
                    <option value={15}>15 días calendario</option>
                    <option value={30}>30 días calendario</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">Descuento Global (Bs.)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="0.00"
                    value={formData.descuento}
                    onChange={(e) => setFormData({ ...formData, descuento: Number(e.target.value) })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-gray-700 block mb-1">Términos y Observaciones</label>
                  <input
                    type="text"
                    value={formData.condiciones}
                    onChange={(e) => setFormData({ ...formData, condiciones: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              {/* Total Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Cotización</span>
                  <span className="text-xs text-gray-500">
                    Subtotal: Bs. {subtotalDraft.toFixed(2)} - Desc: Bs. {Number(formData.descuento || 0).toFixed(2)}
                  </span>
                </div>
                <span className="text-2xl font-black text-emerald-800">
                  Bs. {totalDraft.toFixed(2)}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="px-4 py-2 border border-gray-200 text-gray-600 rounded-xl text-xs font-semibold hover:bg-gray-50 transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition"
                >
                  Guardar Cotización
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Vista Previa de Proforma */}
      {previewCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 shadow-2xl border border-gray-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b pb-3">
              <div>
                <span className="text-xs font-black text-[#2563eb]">GLORYPOS BOLIVIA</span>
                <h3 className="font-bold text-gray-900 text-sm">PROFORMA DE COTIZACIÓN</h3>
              </div>
              <button 
                onClick={() => setPreviewCotizacion(null)}
                className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1 bg-gray-50 p-3 rounded-xl">
              <p><span className="font-bold text-gray-700">N° Proforma:</span> {previewCotizacion.correlativo}</p>
              <p><span className="font-bold text-gray-700">Cliente:</span> {previewCotizacion.cliente_nombre}</p>
              <p><span className="font-bold text-gray-700">NIT/CI:</span> {previewCotizacion.cliente_ci_nit}</p>
              <p><span className="font-bold text-gray-700">Fecha:</span> {new Date(previewCotizacion.fecha).toLocaleDateString('es-BO')}</p>
            </div>

            <div className="space-y-1 max-h-48 overflow-y-auto text-xs">
              <div className="grid grid-cols-12 font-bold text-gray-400 text-[10px] pb-1 border-b">
                <span className="col-span-6">DETALLE</span>
                <span className="col-span-2 text-center">CANT</span>
                <span className="col-span-2 text-right">P.U.</span>
                <span className="col-span-2 text-right">TOTAL</span>
              </div>
              {previewCotizacion.items?.map((it, idx) => (
                <div key={idx} className="grid grid-cols-12 py-1 text-gray-800 border-b border-gray-100">
                  <span className="col-span-6 truncate font-medium">{it.nombre}</span>
                  <span className="col-span-2 text-center">{it.cantidad}</span>
                  <span className="col-span-2 text-right">Bs. {it.precio?.toFixed(2)}</span>
                  <span className="col-span-2 text-right font-bold">Bs. {it.subtotal?.toFixed(2)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t flex items-center justify-between">
              <span className="font-bold text-xs text-gray-600">TOTAL COTIZADO:</span>
              <span className="text-xl font-black text-emerald-700">
                Bs. {Number(previewCotizacion.total || 0).toFixed(2)}
              </span>
            </div>

            <p className="text-[10px] text-gray-400 italic">
              {previewCotizacion.condiciones}
            </p>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
              >
                <Printer className="w-3.5 h-3.5" />
                Imprimir
              </button>
              <button
                onClick={() => handleLoadToPos(previewCotizacion)}
                className="flex-1 py-2 bg-[#2563eb] hover:bg-blue-700 text-white font-bold rounded-xl text-xs transition flex items-center justify-center gap-1"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                Cargar al POS
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
