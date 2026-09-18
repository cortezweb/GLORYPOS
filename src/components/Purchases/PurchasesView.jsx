import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Plus, Search, Building2, Phone, PackagePlus, 
  CheckCircle2, X, ArrowUpRight, DollarSign, Store,
  Calendar, FileText, Check, AlertCircle, TrendingUp
} from 'lucide-react';
import { db } from '../../db/dexie';

export default function PurchasesView() {
  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [products, setProducts] = useState([]);
  const [isBuyModalOpen, setIsBuyModalOpen] = useState(false);
  const [filterStatus, setFilterStatus] = useState('ALL'); // 'ALL', 'PAID', 'CREDIT'
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Formulario de compra
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [cantidad, setCantidad] = useState('12');
  const [costoUnitario, setCostoUnitario] = useState('8.50');
  const [numeroFactura, setNumeroFactura] = useState('');
  const [metodoPago, setMetodoPago] = useState('CONTADO'); // 'CONTADO', 'CREDITO'

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

  const handleRegisterPurchase = async (e) => {
    e.preventDefault();
    if (!selectedProduct || !cantidad || !costoUnitario) return;

    const prod = await db.productos_tienda.get(selectedProduct);
    const supp = await db.proveedores.get(selectedSupplier);
    const cantNum = Number(cantidad);
    const costoNum = Number(costoUnitario);
    const totalCompra = cantNum * costoNum;
    const facturaCorr = numeroFactura || `FC-00${Math.floor(1000 + Math.random() * 9000)}`;

    // Guardar compra
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

      // Registrar movimiento en Kardex
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

    setIsBuyModalOpen(false);
    setNumeroFactura('');
    await loadData();
    showToast(`¡Stock actualizado! +${cantNum} uds ingresadas a ${prod?.nombre}.`);
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

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header (Stitch 1:1) */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Truck className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600">
                Abastecimiento & Proveedores
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              Compras & Facturas
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Control de ingresos de mercadería, órdenes de compra y pagos a distribuidores
            </p>
          </div>

          <button
            onClick={() => setIsBuyModalOpen(true)}
            className="h-10 px-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            type="button"
          >
            <PackagePlus className="w-4 h-4" />
            <span>+ Ingresar Stock</span>
          </button>
        </div>

        {/* Micro-Bento Estadísticas de Compras (Stitch 1:1) */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Compras Registradas</span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-black text-slate-900">
                Bs. {totalCompras.toFixed(2)}
              </span>
              <span className="text-[10px] text-blue-700 font-bold block mt-0.5">
                {compras.length} ingresos realizados
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Pendiente Proveedores</span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-black text-violet-700">
                Bs. {totalCreditoPendiente.toFixed(2)}
              </span>
              <span className="text-[10px] text-violet-600 font-bold block mt-0.5">
                Créditos por liquidar
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Proveedor, NIT o Nro Factura..."
            className="w-full h-11 pl-10 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-2xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'ALL', label: `Todas (${compras.length})` },
            { id: 'PAID', label: 'Pagadas al Contado' },
            { id: 'CREDIT', label: 'Crédito / Pendiente' }
          ].map((ft) => (
            <button
              key={ft.id}
              onClick={() => setFilterStatus(ft.id)}
              className={`min-h-[34px] px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterStatus === ft.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* Proveedores Habituales de Bolivia */}
        <div>
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2.5 px-1">
            Proveedores Habituales de Bolivia
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {proveedores.map((prov) => (
              <div
                key={prov.id}
                className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between gap-3 hover:border-blue-300 transition"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700 font-bold text-sm shrink-0 border border-blue-100">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <h4 className="font-bold text-xs text-slate-900 truncate">
                      {prov.razon_social}
                    </h4>
                    <p className="text-[11px] text-slate-500 truncate">
                      NIT: {prov.nit} • {prov.rubro}
                    </p>
                  </div>
                </div>

                <a
                  href={`tel:${prov.telefono}`}
                  className="p-2 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 rounded-xl transition shrink-0"
                  title="Llamar"
                >
                  <Phone className="w-4 h-4" />
                </a>
              </div>
            ))}
          </div>
        </div>

        {/* Historial de Documentos de Compra Recientes (Stitch 1:1) */}
        <div>
          <h3 className="font-extrabold text-slate-800 text-xs uppercase tracking-wider mb-2.5 px-1">
            Documentos de Compra Recientes
          </h3>

          <div className="space-y-3">
            {filteredCompras.map((cmp) => {
              const isCredit = cmp.estado_pago === 'CREDITO';
              return (
                <article
                  key={cmp.id}
                  className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs hover:shadow-md transition-shadow flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 text-blue-600 border border-blue-100">
                        <Store className="w-5 h-5" />
                      </div>
                      <div className="flex flex-col min-w-0">
                        <h4 className="font-extrabold text-xs sm:text-sm text-slate-900 truncate">
                          {cmp.proveedor_nombre}
                        </h4>
                        <div className="flex items-center gap-1.5 text-slate-500 font-mono text-[11px] mt-0.5">
                          <span>NIT {cmp.proveedor_nit || '1029384756'}</span>
                          <span>•</span>
                          <span className="font-bold text-slate-800">{cmp.numero_factura || 'Factura F001'}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full font-bold text-[10px] shrink-0 border ${
                      isCredit
                        ? 'bg-purple-50 text-purple-700 border-purple-200'
                        : 'bg-blue-50 text-blue-700 border-blue-200'
                    }`}>
                      {isCredit ? 'Crédito' : 'Pagado'}
                    </span>
                  </div>

                  {/* Detalle Ítems & Recepción */}
                  <div className="bg-slate-50 rounded-xl p-2.5 flex flex-col gap-1 border border-slate-200/60">
                    <div className="flex items-center justify-between text-slate-800">
                      <div className="flex items-center gap-1.5 text-slate-600 text-xs min-w-0">
                        <PackagePlus className="w-4 h-4 text-blue-600 shrink-0" />
                        <span className="truncate font-semibold">
                          +{cmp.cantidad} uds • {cmp.producto_nombre}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-500 shrink-0">
                        Costo: Bs. {Number(cmp.costo_unitario).toFixed(2)} c/u
                      </span>
                    </div>

                    <div className="flex items-center justify-between pt-1 font-mono text-[10px] text-slate-400">
                      <span>{new Date(cmp.fecha).toLocaleDateString()} {new Date(cmp.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      <span className="text-blue-600 font-bold">{cmp.almacen_destino || 'Almacén Central P1'}</span>
                    </div>
                  </div>

                  {/* Footer Importe Total */}
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <span className="text-xs text-slate-500 font-medium">Total Factura:</span>
                    <span className="text-base font-black text-slate-900">
                      Bs. {Number(cmp.total).toFixed(2)}
                    </span>
                  </div>
                </article>
              );
            })}

            {filteredCompras.length === 0 && (
              <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-400 text-xs">
                No se encontraron compras con los filtros seleccionados.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modal: Registrar Compra / Ingreso de Stock */}
      {isBuyModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsBuyModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <form 
            onSubmit={handleRegisterPurchase}
            className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Registrar Compra / Ingreso Stock</h3>
              <button
                type="button"
                onClick={() => setIsBuyModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Producto a Abastecer *
              </label>
              <select
                value={selectedProduct}
                onChange={(e) => {
                  setSelectedProduct(e.target.value);
                  const p = products.find(x => x.id === e.target.value);
                  if (p) setCostoUnitario(String(p.precio_compra || 8.00));
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
              >
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} (Stock actual: {p.stock_actual})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Proveedor *
                </label>
                <select
                  value={selectedSupplier}
                  onChange={(e) => setSelectedSupplier(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  {proveedores.map(pr => (
                    <option key={pr.id} value={pr.id}>{pr.razon_social}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  N° Factura / Guía
                </label>
                <input
                  type="text"
                  value={numeroFactura}
                  onChange={(e) => setNumeroFactura(e.target.value)}
                  placeholder="Ej: F002-8812"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Cantidad a Ingresar
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-slate-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Costo Unitario (Bs.)
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={costoUnitario}
                  onChange={(e) => setCostoUnitario(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-black text-blue-600"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Condición de Pago
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('CONTADO')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    metodoPago === 'CONTADO' ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Contado (Pagado)
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('CREDITO')}
                  className={`py-2 rounded-xl text-xs font-bold transition ${
                    metodoPago === 'CREDITO' ? 'bg-violet-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  Crédito (Por Pagar)
                </button>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-xs flex justify-between items-center font-bold">
              <span className="text-slate-500">Total Compra:</span>
              <span className="text-slate-900 font-black text-base">
                Bs. {(Number(cantidad) * Number(costoUnitario || 0)).toFixed(2)}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all mt-2 active:scale-95"
            >
              Registrar Compra, Sumar Stock & Kardex
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
