import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Plus, Search, Building2, Phone, PackagePlus, 
  CheckCircle2, X, ArrowUpRight, DollarSign, Store,
  Calendar, FileText, Check, AlertCircle, TrendingUp,
  Clock, MapPin, Edit2, Trash2, Mail
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';

export default function PurchasesView({ initialTab = 'compras' }) {
  // 3 Pestañas solicitadas: 'nueva_compra', 'compras', 'proveedores'
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

  // Formulario Nueva Compra
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cantidad, setCantidad] = useState('12');
  const [costoUnitario, setCostoUnitario] = useState('8.50');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [metodoPago, setMetodoPago] = useState('CONTADO'); // 'CONTADO', 'CREDITO'

  // Modal / Form Nuevo Proveedor
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    id: '',
    razon_social: '',
    nit: '',
    contacto: '',
    telefono: '',
    ciudad: 'Santa Cruz',
    rubro: 'Distribución General'
  });
  const [editingSupplier, setEditingSupplier] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    const provs = await db.proveedores.toArray();
    setProveedores(provs);
    const prods = await db.productos_tienda.toArray();
    setProducts(prods);
    const buys = await db.compras.reverse().toArray();
    setCompras(buys);

    if (prods.length > 0 && !selectedProduct) {
      setSelectedProduct(prods[0].id);
      setCostoUnitario(String(prods[0].precio_compra || 8.00));
    }
    if (provs.length > 0 && !selectedSupplier) {
      setSelectedSupplier(provs[0].id);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const totalCompras = useMemo(() => {
    return compras.reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  }, [compras]);

  const totalCreditoPendiente = useMemo(() => {
    return compras
      .filter(c => c.estado_pago === 'CREDITO')
      .reduce((acc, c) => acc + (Number(c.total) || 0), 0);
  }, [compras]);

  // Manejar Registro de Compra
  const handleRegisterPurchase = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !cantidad || !costoUnitario) return;

    const prod = await db.productos_tienda.get(selectedProduct);
    const supp = await db.proveedores.get(selectedSupplier);
    const cantNum = Number(cantidad);
    const costoNum = Number(costoUnitario);
    const totalCompra = cantNum * costoNum;
    const facturaCorr = numeroFactura || `FC-00${Math.floor(1000 + Math.random() * 9000)}`;

    // Guardar compra en Dexie
    await db.compras.add({
      id: `cmp-${Date.now()}`,
      fecha: new Date().toISOString(),
      proveedor_id: supp?.id || 'prov-gen',
      proveedor_nombre: supp ? supp.razon_social : 'Proveedor General',
      proveedor_nit: supp ? supp.nit : '1029384756',
      numero_factura: facturaCorr,
      producto_id: prod?.id,
      producto_nombre: prod ? prod.nombre : 'Producto',
      cantidad: cantNum,
      costo_unitario: costoNum,
      total: totalCompra,
      estado_pago: metodoPago,
      almacen_destino: 'Almacén Central P1'
    });

    // Actualizar stock de tienda
    if (prod) {
      const nuevoStock = prod.stock_actual + cantNum;
      await db.productos_tienda.update(prod.id, {
        stock_actual: nuevoStock,
        precio_compra: costoNum
      });

      // Registrar en Kardex
      if (db.kardex) {
        await db.kardex.add({
          id: `kdx-${Date.now()}`,
          fecha: new Date().toISOString(),
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          tipo: 'ENTRADA',
          cantidad: cantNum,
          motivo: `Ingreso Compra Factura ${facturaCorr} - ${supp ? supp.razon_social : 'Proveedor'}`,
          saldo_nuevo: nuevoStock,
          costo_unitario: costoNum
        });
      }
    }

    setNumeroFactura('');
    await loadData();
    showToast(`¡Compra registrada! +${cantNum} unidades ingresadas.`);
    syncService.triggerBackgroundSync();
    setActiveTab('compras');
  };

  // Manejar Proveedores
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
      await db.proveedores.add({
        id: `prov-${Date.now()}`,
        razon_social: supplierForm.razon_social.trim(),
        nit: supplierForm.nit.trim() || 'S/N',
        contacto: supplierForm.contacto.trim() || 'N/A',
        telefono: supplierForm.telefono.trim() || 'N/A',
        ciudad: supplierForm.ciudad,
        rubro: supplierForm.rubro
      });
      showToast('¡Nuevo proveedor registrado con éxito!');
    }

    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    setSupplierForm({ id: '', razon_social: '', nit: '', contacto: '', telefono: '', ciudad: 'Santa Cruz', rubro: 'Distribución General' });
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
    return proveedores.filter(p => 
      `${p.razon_social} ${p.nit} ${p.contacto}`.toLowerCase().includes(search.toLowerCase())
    );
  }, [proveedores, search]);

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── SUB-BARRA DE NAVEGACIÓN CON LAS 3 PESTAÑAS (Nueva compra, Compras, Proveedores) ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-xs select-none">
        <div className="max-w-7xl mx-auto px-3 py-2 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('nueva_compra')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'nueva_compra'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Nueva compra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compras'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Compras</span>
            {compras.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'compras' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {compras.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proveedores')}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'proveedores'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25 ring-1 ring-blue-600/30'
                : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200/80'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Proveedores</span>
            {proveedores.length > 0 && (
              <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-bold ${
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
        {/* PESTAÑA 1: NUEVA COMPRA (FORMULARIO DIRECTO)                       */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'nueva_compra' && (
          <div className="space-y-4 animate-fadeIn">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  Registrar Nueva Compra
                </h1>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Ingreso de mercadería a almacén, actualización automática de stock y cálculo de costos
              </p>
            </div>

            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-2xs max-w-2xl">
              <form onSubmit={handleRegisterPurchase} className="space-y-4">
                
                {/* Producto */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Producto a Ingresar *
                  </label>
                  <select
                    value={selectedProduct}
                    onChange={(e) => {
                      setSelectedProduct(e.target.value);
                      const p = products.find(x => x.id === e.target.value);
                      if (p) setCostoUnitario(String(p.precio_compra || 8.00));
                    }}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} (Stock actual: {p.stock_actual} | Costo habitual: Bs. {p.precio_compra})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Proveedor */}
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Proveedor *
                  </label>
                  <select
                    value={selectedSupplier}
                    onChange={(e) => setSelectedSupplier(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  >
                    {proveedores.map(prov => (
                      <option key={prov.id} value={prov.id}>
                        {prov.razon_social} (NIT: {prov.nit})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Cantidad y Costo */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Cantidad a Ingresar *
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      value={cantidad}
                      onChange={(e) => setCantidad(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Costo Unitario de Compra (Bs.) *
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      required
                      value={costoUnitario}
                      onChange={(e) => setCostoUnitario(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>
                </div>

                {/* Nro Factura y Forma de Pago */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Nro. Factura / Nota Proveedor
                    </label>
                    <input
                      type="text"
                      placeholder="Ej. FC-89102"
                      value={numeroFactura}
                      onChange={(e) => setNumeroFactura(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-slate-700 block mb-1">
                      Condición de Pago
                    </label>
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                    >
                      <option value="CONTADO">Al Contado (Pagado)</option>
                      <option value="CREDITO">Al Crédito (Cuenta por Pagar)</option>
                    </select>
                  </div>
                </div>

                {/* Total Preview */}
                <div className="p-3.5 bg-blue-50 border border-blue-200 rounded-2xl flex justify-between items-center text-xs">
                  <span className="font-bold text-blue-900">Total Importe de Compra:</span>
                  <span className="text-xl font-black text-blue-700 font-mono">
                    Bs. {((Number(cantidad) || 0) * (Number(costoUnitario) || 0)).toFixed(2)}
                  </span>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs rounded-xl transition shadow-md shadow-blue-500/20 active:scale-98 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Compra & Actualizar Stock</span>
                </button>
              </form>
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
                  <Truck className="w-5 h-5 text-indigo-600" />
                  Historial de Compras
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Registro de facturas recibidas de proveedores y abastecimiento
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('nueva_compra')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
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
                  Bs. {totalCompras.toFixed(2)}
                </div>
                <span className="text-[10px] text-blue-600 font-bold block mt-0.5">
                  {compras.length} órdenes registradas
                </span>
              </div>

              <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
                <span className="text-xs font-bold text-slate-500">Pendiente a Proveedores (Crédito)</span>
                <div className="text-2xl font-black text-rose-600 font-mono mt-1">
                  Bs. {totalCreditoPendiente.toFixed(2)}
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
                      <th className="py-2 px-3">Producto / Ítem</th>
                      <th className="py-2 px-3 text-center">Cant.</th>
                      <th className="py-2 px-3 text-right">Costo U.</th>
                      <th className="py-2 px-3 text-right">Total</th>
                      <th className="py-2 px-3 text-center">Condición</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompras.map(c => (
                      <tr key={c.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-2.5 px-3 text-slate-500 whitespace-nowrap">
                          {new Date(c.fecha).toLocaleDateString('es-BO')}
                        </td>
                        <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                          {c.numero_factura}
                        </td>
                        <td className="py-2.5 px-3 font-bold text-slate-800">
                          {c.proveedor_nombre}
                        </td>
                        <td className="py-2.5 px-3 text-slate-700">
                          {c.producto_nombre}
                        </td>
                        <td className="py-2.5 px-3 text-center font-mono font-bold">
                          {c.cantidad}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-600">
                          Bs. {Number(c.costo_unitario).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono font-black text-slate-900">
                          Bs. {Number(c.total).toFixed(2)}
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
                        <td colSpan={8} className="py-8 text-center text-slate-400 italic">
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
                  <Building2 className="w-5 h-5 text-indigo-600" />
                  Directorio de Proveedores
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Distribuidores autorizados, datos de contacto, NIT y canales de abastecimiento
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setEditingSupplier(null);
                  setSupplierForm({ id: '', razon_social: '', nit: '', contacto: '', telefono: '', ciudad: 'Santa Cruz', rubro: 'Distribución General' });
                  setIsSupplierModalOpen(true);
                }}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
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
                <div key={prov.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:border-blue-300 transition">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm">{prov.razon_social}</h3>
                        <span className="text-[10px] text-slate-400 font-mono">NIT: {prov.nit}</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-blue-50 text-blue-700">
                        {prov.ciudad || 'Bolivia'}
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

      {/* Modal Crear / Editar Proveedor */}
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
                  placeholder="Ej. Cervecería Boliviana Nacional S.A."
                  value={supplierForm.razon_social}
                  onChange={(e) => setSupplierForm({ ...supplierForm, razon_social: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">NIT</label>
                  <input
                    type="text"
                    placeholder="1002345012"
                    value={supplierForm.nit}
                    onChange={(e) => setSupplierForm({ ...supplierForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="800102030"
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
                  placeholder="Ej. Ramiro Choque"
                  value={supplierForm.contacto}
                  onChange={(e) => setSupplierForm({ ...supplierForm, contacto: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Rubro / Especialidad</label>
                <input
                  type="text"
                  placeholder="Ej. Bebidas, Lácteos, Abarrotes..."
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
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20"
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
