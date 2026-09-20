import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Plus, Search, Building2, Phone, PackagePlus, 
  CheckCircle2, X, ArrowUpRight, DollarSign, Store,
  Calendar, FileText, Check, AlertCircle, TrendingUp,
  Clock, MapPin, Edit2, Trash2, Mail, ArrowLeft, UserPlus,
  Package
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';

export default function PurchasesView({ initialTab = 'compras', onSelectView }) {
  // 3 Pestañas: 'nueva_compra', 'compras', 'proveedores'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [products, setProducts] = useState([]);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PAID', 'CREDIT'
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // ── ESTADO FORMULARIO "NUEVA COMPRA" (IDÉNTICO A LA CAPTURA) ──
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('FACTURA');
  const [serie, setSerie] = useState('F001');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('CREDITO');
  const [incluyeIgv, setIncluyeIgv] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Modales
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    nombre: '',
    categoria: 'Abarrotes',
    unidad_medida: 'Unidad',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '10',
    codigo_barras: ''
  });

  // Modal / Form Nuevo Proveedor
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    id: '',
    razon_social: '',
    nit: '',
    contacto: '',
    telefono: '',
    ciudad: 'Lima',
    rubro: 'Distribución General'
  });
  const [editingSupplier, setEditingSupplier] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    const provs = await db.proveedores.toArray();
    setProveedores(provs || []);
    let prods = await db.productos_tienda.toArray();
    if (!prods || prods.length === 0) {
      prods = await db.productos.toArray();
    }
    setProducts(prods || []);
    const buys = await db.compras.reverse().toArray();
    setCompras(buys || []);

    if (provs && provs.length > 0 && !selectedSupplier) {
      setSelectedSupplier(provs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── CÁLCULO DE TOTALES SEGÚN CHECKBOX DE IGV ──
  const subtotalBruto = useMemo(() => {
    return purchaseItems.reduce((acc, item) => {
      const cant = Number(item.cantidad) || 0;
      const costo = Number(item.costo_unitario) || 0;
      return acc + (cant * costo);
    }, 0);
  }, [purchaseItems]);

  const { subtotal, igv, total } = useMemo(() => {
    if (incluyeIgv) {
      // El costo unitario ya incluye IGV (18%)
      const tot = subtotalBruto;
      const sub = tot / 1.18;
      const igvVal = tot - sub;
      return { subtotal: sub, igv: igvVal, total: tot };
    } else {
      // Se agrega el IGV sobre el costo
      const sub = subtotalBruto;
      const igvVal = sub * 0.18;
      const tot = sub + igvVal;
      return { subtotal: sub, igv: igvVal, total: tot };
    }
  }, [subtotalBruto, incluyeIgv]);

  // ── ACCIONES PARA ÍTEMS DE COMPRA ──
  const handleAddItemToPurchase = (prod) => {
    const existingIndex = purchaseItems.findIndex(i => i.producto_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...purchaseItems];
      updated[existingIndex].cantidad = Number(updated[existingIndex].cantidad || 1) + 1;
      setPurchaseItems(updated);
    } else {
      setPurchaseItems(prev => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          unidad_medida: prod.unidad_medida || 'Unidad',
          cantidad: 1,
          costo_unitario: Number(prod.precio_compra) || 10.00
        }
      ]);
    }
    setIsAddProductModalOpen(false);
    setProductSearchTerm('');
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    setPurchaseItems(updated);
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  // ── REGISTRAR NUEVO PRODUCTO DESDE EL MODAL ──
  const handleCreateNewProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.nombre.trim()) return;

    const newProd = {
      id: `prod-${Date.now()}`,
      nombre: newProductForm.nombre.trim(),
      categoria: newProductForm.categoria.trim() || 'General',
      unidad_medida: newProductForm.unidad_medida.trim() || 'Unidad',
      precio_compra: Number(newProductForm.precio_compra) || 10.00,
      precio_venta: Number(newProductForm.precio_venta) || (Number(newProductForm.precio_compra || 10) * 1.3),
      stock_actual: Number(newProductForm.stock_actual) || 0,
      codigo_barras: newProductForm.codigo_barras.trim() || String(Math.floor(100000000000 + Math.random() * 900000000000)),
      activo: true
    };

    await db.productos_tienda.add(newProd);
    await loadData();

    // Agregar automáticamente a la compra
    handleAddItemToPurchase(newProd);

    setIsNewProductModalOpen(false);
    setNewProductForm({
      nombre: '',
      categoria: 'Abarrotes',
      unidad_medida: 'Unidad',
      precio_compra: '',
      precio_venta: '',
      stock_actual: '10',
      codigo_barras: ''
    });
    showToast(`¡Producto "${newProd.nombre}" creado y añadido a la compra!`);
  };

  // ── GUARDAR COMPRA COMPLETA ──
  const handleSavePurchase = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSupplier) {
      alert('Por favor seleccione un proveedor.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Debe agregar al menos un producto para armar el detalle de la compra.');
      return;
    }

    const supp = proveedores.find(p => p.id === selectedSupplier) || { razon_social: 'Proveedor General', nit: '0' };
    const numComp = numeroComprobante.trim() || `000${Math.floor(1000 + Math.random() * 9000)}`;
    const fullFactura = `${serie.trim() || 'F001'}-${numComp}`;

    // 1. Guardar la compra en Dexie
    const newCompra = {
      id: `cmp-${Date.now()}`,
      fecha: fechaEmision ? new Date(fechaEmision).toISOString() : new Date().toISOString(),
      proveedor_id: supp.id,
      proveedor_nombre: supp.razon_social,
      proveedor_nit: supp.nit || '0',
      tipo_documento: tipoDocumento,
      serie: serie.trim() || 'F001',
      numero_factura: fullFactura,
      estado_pago: metodoPago === 'CREDITO' ? 'CREDITO' : 'CONTADO',
      metodo_pago: metodoPago,
      incluye_igv: incluyeIgv,
      subtotal: subtotal,
      igv: igv,
      total: total,
      items: purchaseItems,
      almacen_destino: 'Almacén Principal'
    };

    await db.compras.add(newCompra);

    // 2. Actualizar stock y registrar en Kardex por cada ítem
    for (const item of purchaseItems) {
      const prod = products.find(p => p.id === item.producto_id) || await db.productos_tienda.get(item.producto_id);
      const cantNum = Number(item.cantidad) || 0;
      const costoNum = Number(item.costo_unitario) || 0;

      if (prod) {
        const nuevoStock = (Number(prod.stock_actual) || 0) + cantNum;
        await db.productos_tienda.update(prod.id, {
          stock_actual: nuevoStock,
          precio_compra: costoNum
        });

        if (db.kardex) {
          await db.kardex.add({
            id: `kdx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fecha: new Date().toISOString(),
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            tipo: 'ENTRADA',
            cantidad: cantNum,
            motivo: `Compra ${tipoDocumento} ${fullFactura} - ${supp.razon_social}`,
            saldo_nuevo: nuevoStock,
            costo_unitario: costoNum
          });
        }
      }
    }

    // Resetear formulario
    setPurchaseItems([]);
    setNumeroComprobante('');
    showToast(`¡Compra ${fullFactura} registrada con éxito! (+${purchaseItems.length} productos recibidos)`);
    syncService.triggerBackgroundSync();
    await loadData();
    setActiveTab('compras');
  };

  // ── MANEJO DE PROVEEDORES ──
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.razon_social.trim()) return;

    if (editingSupplier) {
      await db.proveedores.update(editingSupplier.id, {
        razon_social: supplierForm.razon_social.trim(),
        nit: supplierForm.nit.trim(),
        contacto: supplierForm.contacto.trim(),
        telefono: supplierForm.telefono.trim(),
        ciudad: supplierForm.ciudad,
        rubro: supplierForm.rubro
      });
      showToast('¡Proveedor actualizado!');
    } else {
      const newProvId = `prov-${Date.now()}`;
      await db.proveedores.add({
        id: newProvId,
        razon_social: supplierForm.razon_social.trim(),
        nit: supplierForm.nit.trim() || 'S/N',
        contacto: supplierForm.contacto.trim() || 'N/A',
        telefono: supplierForm.telefono.trim() || 'N/A',
        ciudad: supplierForm.ciudad,
        rubro: supplierForm.rubro
      });
      setSelectedSupplier(newProvId);
      showToast('¡Nuevo proveedor registrado y seleccionado!');
    }

    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    setSupplierForm({ id: '', razon_social: '', nit: '', contacto: '', telefono: '', ciudad: 'Lima', rubro: 'Distribución General' });
    await loadData();
  };

  const handleEditSupplier = (prov) => {
    setEditingSupplier(prov);
    setSupplierForm(prov);
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('¿Deseas eliminar este proveedor?')) return;
    await db.proveedores.delete(id);
    await loadData();
    showToast('Proveedor eliminado.');
  };

  const totalCompras = useMemo(() => {
    return compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  }, [compras]);

  const totalCreditoPendiente = useMemo(() => {
    return compras
      .filter(c => c.estado_pago === 'CREDITO')
      .reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  }, [compras]);

  const filteredCompras = useMemo(() => {
    return compras.filter(c => {
      const text = `${c.proveedor_nombre || ''} ${c.producto_nombre || ''} ${c.numero_factura || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());

      if (filterStatus === 'PAID') return matchesSearch && c.estado_pago !== 'CREDITO';
      if (filterStatus === 'CREDIT') return matchesSearch && c.estado_pago === 'CREDITO';
      return matchesSearch;
    });
  }, [compras, search, filterStatus]);

  const filteredProveedores = useMemo(() => {
    return proveedores.filter(p => {
      const text = `${p.razon_social || ''} ${p.nit || ''} ${p.contacto || ''}`.toLowerCase();
      return text.includes(search.toLowerCase());
    });
  }, [proveedores, search]);

  const filteredModalProducts = useMemo(() => {
    return products.filter(p => 
      p.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.codigo_barras?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [products, productSearchTerm]);

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── SUB-BARRA DE NAVEGACIÓN SUPERIOR (Nueva compra, Compras, Proveedores) ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs select-none">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('nueva_compra')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'nueva_compra'
                ? 'bg-[#00a650] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Nueva compra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compras'
                ? 'bg-[#00a650] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Historial de Compras</span>
            {compras.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'compras' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {compras.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proveedores')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'proveedores'
                ? 'bg-[#00a650] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Proveedores</span>
            {proveedores.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'proveedores' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {proveedores.length}
              </span>
            )}
          </button>

        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑA 1: NUEVA COMPRA (ESTRUCTURA IDÉNTICA A LA IMAGEN)          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'nueva_compra' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-5 animate-fadeIn">
            
            {/* 1. Volver al listado */}
            <div>
              <button
                type="button"
                onClick={() => setActiveTab('compras')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al listado</span>
              </button>
            </div>

            {/* 2. Título y Subtítulo */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Nueva compra
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Registre el comprobante del proveedor y el detalle de productos recibidos
              </p>
            </div>

            {/* 3. Formulario Superior */}
            <div className="space-y-3.5 pt-1">
              
              {/* Fila 1: Proveedor */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Proveedor <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social} {p.nit ? `(NIT: ${p.nit})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </div>
                  </div>

                  {/* Botón rápido nuevo proveedor [ 👤+ ] */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(null);
                      setSupplierForm({ id: '', razon_social: '', nit: '', contacto: '', telefono: '', ciudad: 'Lima', rubro: 'Distribución General' });
                      setIsSupplierModalOpen(true);
                    }}
                    className="p-2 border border-slate-200 hover:border-emerald-500 rounded-lg text-emerald-600 bg-white hover:bg-emerald-50 transition shrink-0 shadow-2xs"
                    title="Registrar nuevo proveedor"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fila 2: Tipo documento | Serie | Nº comprobante */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Tipo documento
                  </label>
                  <div className="relative">
                    <select
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="FACTURA">FACTURA</option>
                      <option value="BOLETA">BOLETA</option>
                      <option value="NOTA DE VENTA">NOTA DE VENTA</option>
                      <option value="GUÍA">GUÍA DE REMISIÓN</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Serie <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. F001"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Nº comprobante <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 00012345"
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Fila 3: Fecha emisión | Método de pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Fecha emisión
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Método de pago
                  </label>
                  <div className="relative">
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="CREDITO">Crédito (sin pago inmediato)</option>
                      <option value="EFECTIVO">Efectivo (Contado)</option>
                      <option value="TRANSFERENCIA">Transferencia / Yape / Plin</option>
                      <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    {metodoPago === 'CREDITO'
                      ? 'Se registrará como cuenta por pagar al proveedor (CxP): no se descuenta nada ahora, se paga después desde Cuentas por pagar.'
                      : 'Se registrará como compra al contado pagada inmediatamente.'
                    }
                  </p>
                </div>
              </div>

              {/* Fila 4: Checkbox IGV */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluyeIgv}
                    onChange={(e) => setIncluyeIgv(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-0 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      El costo unitario ya incluye IGV
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Se agregará el IGV sobre el costo que ingrese (ej. 100.00 → valor 100.00 + IGV 18.00). No aplica a ítems exonerados o inafectos.
                    </p>
                  </div>
                </label>
              </div>

            </div>

            {/* 4. Barra de Acciones de Productos */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar producto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-[#00a650] border border-[#00a650] rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Nuevo producto</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 font-medium self-end sm:self-auto">
                Total de ítems: {purchaseItems.length}
              </div>
            </div>

            {/* 5. Tabla de Detalle de Productos */}
            <div className="border border-slate-200/90 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">PRODUCTO</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">UNID.</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">CANT.</th>
                      <th className="py-2.5 px-4 font-semibold text-right w-36">COSTO UNIT.</th>
                      <th className="py-2.5 px-4 font-semibold text-right w-36">SUBTOTAL</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          Sin ítems. Use <strong className="text-slate-600 font-bold">Agregar producto</strong> para armar el detalle.
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item, index) => {
                        const cant = Number(item.cantidad) || 0;
                        const cost = Number(item.costo_unitario) || 0;
                        const sub = cant * cost;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {item.producto_nombre}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">
                              {item.unidad_medida || 'Unidad'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleUpdateItem(index, 'cantidad', e.target.value)}
                                className="w-20 text-center py-1 px-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <span className="text-[11px] text-slate-400 font-medium">S/</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.costo_unitario}
                                  onChange={(e) => handleUpdateItem(index, 'costo_unitario', e.target.value)}
                                  className="w-24 text-right py-1 px-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              S/ {sub.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition hover:bg-rose-50"
                                title="Eliminar ítem"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Totales (Subtotal / IGV / Total) */}
            <div className="flex justify-end pt-1">
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700 font-mono">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>IGV</span>
                  <span className="font-medium text-slate-700 font-mono">S/ {igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 7. Barra Inferior de Acciones */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('compras')}
                className="w-full sm:w-1/2 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs text-center"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSavePurchase}
                className="w-full sm:w-1/2 py-2.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Registrar compra</span>
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑA 2: COMPRAS (HISTORIAL Y LISTADO)                           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'compras' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Truck className="w-5 h-5 text-emerald-600" />
                  Historial de Compras
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro de facturas recibidas de proveedores y abastecimiento
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('nueva_compra')}
                className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva Compra</span>
              </button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500">Total Compras Realizadas</span>
                <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                  S/ {totalCompras.toFixed(2)}
                </div>
                <span className="text-[10px] text-emerald-600 font-bold block mt-0.5">
                  {compras.length} órdenes registradas
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500">Pendiente a Proveedores (Crédito)</span>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  S/ {totalCreditoPendiente.toFixed(2)}
                </div>
                <span className="text-[10px] text-rose-500 font-bold block mt-0.5">
                  Cuentas por pagar
                </span>
              </div>
            </div>

            {/* Buscador y Filtros */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setFilterStatus('ALL')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Todas ({compras.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('PAID')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === 'PAID' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Al Contado
                </button>
                <button
                  type="button"
                  onClick={() => setFilterStatus('CREDIT')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    filterStatus === 'CREDIT' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500'
                  }`}
                >
                  Al Crédito
                </button>
              </div>

              <div className="relative max-w-xs w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar proveedor o factura..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Tabla de Compras */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-3">Fecha</th>
                      <th className="py-2 px-3">Factura</th>
                      <th className="py-2 px-3">Proveedor</th>
                      <th className="py-2 px-3">Detalle Ítems</th>
                      <th className="py-2 px-3 text-right">Subtotal</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-center">Condición</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompras.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(c.fecha).toLocaleDateString('es-PE')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {c.numero_factura}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {c.proveedor_nombre}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {Array.isArray(c.items) && c.items.length > 0 
                            ? `${c.items.length} productos (${c.items.map(i => i.producto_nombre).slice(0, 2).join(', ')}${c.items.length > 2 ? '...' : ''})`
                            : (c.producto_nombre || 'Detalle de compra')
                          }
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          S/ {Number(c.subtotal || c.total).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          S/ {Number(c.total).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                            c.estado_pago === 'CREDITO' ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                          }`}>
                            {c.estado_pago || 'CONTADO'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {filteredCompras.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-8 text-center text-slate-400 italic">
                          No se encontraron compras en este filtro.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑA 3: PROVEEDORES (DIRECTORIO & GESTIÓN)                     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'proveedores' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-emerald-600" />
                  Directorio de Proveedores
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribuidores autorizados, datos de contacto, RUC / NIT y canales de abastecimiento
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierForm({ id: '', razon_social: '', nit: '', contacto: '', telefono: '', ciudad: 'Lima', rubro: 'Distribución General' });
                  setIsSupplierModalOpen(true);
                }}
                className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>Nuevo Proveedor</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
              <div className="relative max-w-sm w-full">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar por razón social, NIT o contacto..."
                  className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            {/* Cards de Proveedores */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredProveedores.map(prov => (
                <div key={prov.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:border-emerald-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{prov.razon_social}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">RUC/NIT: {prov.nit}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-emerald-50 text-emerald-700">
                        {prov.ciudad || 'Perú'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 text-xs space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Rubro:</span>
                        <span className="font-bold text-slate-700">{prov.rubro || 'General'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Contacto:</span>
                        <span className="font-bold text-slate-800">{prov.contacto || 'N/A'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Teléfono:</span>
                        <span className="font-mono font-bold text-slate-800">{prov.telefono || 'N/A'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => handleEditSupplier(prov)}
                      className="flex-1 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Editar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteSupplier(prov.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-rose-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              {filteredProveedores.length === 0 && (
                <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
                  <Building2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-xs font-bold text-slate-600">No se encontraron proveedores</p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: AGREGAR PRODUCTO DESDE CATÁLOGO                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Seleccionar Producto</h3>
                  <p className="text-[11px] text-slate-400">Elige un producto de tu catálogo para agregar a la compra</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, categoría o código..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredModalProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleAddItemToPurchase(prod)}
                  className="p-3 hover:bg-emerald-50/60 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-slate-900 truncate">{prod.nombre}</p>
                    <span className="text-[10px] text-slate-400">{prod.categoria || 'General'} • Stock actual: {prod.stock_actual ?? 0} {prod.unidad_medida || 'Unid'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 block font-mono">
                      Costo: S/ {Number(prod.precio_compra || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">P. Venta: S/ {Number(prod.precio_venta || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {filteredModalProducts.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron productos. Puedes crear uno nuevo usando "Nuevo producto".
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: NUEVO PRODUCTO RÁPIDO                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Producto</h3>
                  <p className="text-[11px] text-slate-400">Se guardará en el catálogo y se añadirá a la compra</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Arroz Costeño 5kg"
                  value={newProductForm.nombre}
                  onChange={(e) => setNewProductForm({ ...newProductForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej. Abarrotes"
                    value={newProductForm.categoria}
                    onChange={(e) => setNewProductForm({ ...newProductForm, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad Medida</label>
                  <select
                    value={newProductForm.unidad_medida}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unidad_medida: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Kilogramo">Kilogramo (Kg)</option>
                    <option value="Litro">Litro (L)</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Caja">Caja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo de Compra (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={newProductForm.precio_compra}
                    onChange={(e) => setNewProductForm({ ...newProductForm, precio_compra: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio de Venta (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProductForm.precio_venta}
                    onChange={(e) => setNewProductForm({ ...newProductForm, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Código de Barras (Opcional)</label>
                <input
                  type="text"
                  placeholder="Escanee o ingrese código"
                  value={newProductForm.codigo_barras}
                  onChange={(e) => setNewProductForm({ ...newProductForm, codigo_barras: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-xl transition shadow-2xs"
                >
                  Crear y Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: CREAR / EDITAR PROVEEDOR                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Distribuidora Central S.A.C."
                  value={supplierForm.razon_social}
                  onChange={(e) => setSupplierForm({ ...supplierForm, razon_social: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">RUC / NIT *</label>
                  <input
                    type="text"
                    required
                    placeholder="20601234567"
                    value={supplierForm.nit}
                    onChange={(e) => setSupplierForm({ ...supplierForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="987654321"
                    value={supplierForm.telefono}
                    onChange={(e) => setSupplierForm({ ...supplierForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Persona de Contacto</label>
                <input
                  type="text"
                  placeholder="Ej. Juan Pérez"
                  value={supplierForm.contacto}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contacto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rubro / Especialidad</label>
                <input
                  type="text"
                  placeholder="Ej. Abarrotes, Bebidas, Lácteos..."
                  value={supplierForm.rubro}
                  onChange={(e) => setSupplierForm({ ...supplierForm, rubro: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-xl transition shadow-2xs"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
