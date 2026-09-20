import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Plus, Trash2, CheckCircle2, 
  Printer, DollarSign, User, ShieldCheck, ArrowRight, 
  QrCode, CreditCard, Banknote, Clock, Sparkles
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import SalesSubNav from './SalesSubNav';

export default function NuevoComprobanteView({ onSelectSubView, onOpenReceipt }) {
  const { empresa } = useAuth();

  const [tipoDocumento, setTipoDocumento] = useState('FACTURA_SIAT'); // 'FACTURA_SIAT', 'BOLETA', 'NOTA_CREDITO'
  const [clienteNombre, setClienteNombre] = useState('');
  const [clienteNit, setClienteNit] = useState('');
  const [metodoPago, setMetodoPago] = useState('EFECTIVO');
  const [observaciones, setObservaciones] = useState('');

  const [products, setProducts] = useState([]);
  const [clientes, setClientes] = useState([]);
  const [cartItems, setCartItems] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [cantidad, setCantidad] = useState('1');

  const [searchClientTerm, setSearchClientTerm] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const load = async () => {
      const prods = await db.productos_tienda.toArray();
      setProducts(prods);
      const cls = await db.clientes.toArray();
      setClientes(cls);

      if (prods.length > 0) {
        setSelectedProduct(prods[0].id);
      }
    };
    load();
  }, []);

  const handleSelectClient = (c) => {
    setClienteNombre(c.razon_social);
    setClienteNit(c.nit_ci);
    setSearchClientTerm('');
  };

  const handleAddItem = () => {
    if (!selectedProduct) return;
    const prod = products.find(p => p.id === selectedProduct);
    if (!prod) return;

    const cantNum = Number(cantidad) || 1;
    const existingIndex = cartItems.findIndex(item => item.producto_id === prod.id);

    if (existingIndex >= 0) {
      const updated = [...cartItems];
      updated[existingIndex].cantidad += cantNum;
      updated[existingIndex].subtotal = updated[existingIndex].cantidad * updated[existingIndex].precio;
      setCartItems(updated);
    } else {
      setCartItems([
        ...cartItems,
        {
          producto_id: prod.id,
          nombre: prod.nombre,
          precio: Number(prod.precio_venta) || 0,
          precio_compra: Number(prod.precio_compra) || 0,
          cantidad: cantNum,
          subtotal: cantNum * (Number(prod.precio_venta) || 0)
        }
      ]);
    }
    setCantidad('1');
  };

  const handleRemoveItem = (index) => {
    setCartItems(cartItems.filter((_, i) => i !== index));
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.subtotal, 0);
  const total = subtotal;

  const handleEmitir = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) {
      alert('Agrega al menos un producto al comprobante.');
      return;
    }
    if (!clienteNombre.trim()) {
      alert('Ingresa el nombre o razón social del cliente.');
      return;
    }

    const correlativoNum = Math.floor(1000 + Math.random() * 9000);
    const prefix = tipoDocumento === 'FACTURA_SIAT' ? 'F' : tipoDocumento === 'BOLETA' ? 'B' : 'NC';
    const corrStr = `${prefix}-00${correlativoNum}`;

    const newVenta = {
      id: `vta-${Date.now()}`,
      fecha: new Date().toISOString(),
      correlativo: corrStr,
      tipo_documento: tipoDocumento,
      tipo_label: tipoDocumento === 'FACTURA_SIAT' ? 'Factura Electrónica SIAT' : tipoDocumento === 'BOLETA' ? 'Boleta de Venta' : 'Nota de Crédito',
      cuf: tipoDocumento === 'FACTURA_SIAT' ? `CUF-${Date.now()}-GLORYPOS-SIAT` : undefined,
      cliente_nombre: clienteNombre.trim(),
      cliente_ci_nit: clienteNit.trim() || '0',
      metodo_pago: metodoPago,
      items: cartItems,
      subtotal,
      descuento: 0,
      total,
      monto_recibido: total,
      cambio: 0,
      estado: 'EMITIDO',
      observaciones
    };

    await db.ventas.add(newVenta);

    // Descontar stock
    for (const item of cartItems) {
      const prod = await db.productos_tienda.get(item.producto_id);
      if (prod) {
        const nuevoStock = Math.max(0, (prod.stock_actual || 0) - item.cantidad);
        await db.productos_tienda.update(prod.id, { stock_actual: nuevoStock });
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onOpenReceipt) {
        onOpenReceipt(newVenta);
      }
      setCartItems([]);
      setClienteNombre('');
      setClienteNit('');
    }, 1200);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans">
      <SalesSubNav currentSubView="nuevo_comprobante" onSelectSubView={onSelectSubView} />

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <FileText className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Nuevo Comprobante
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Emisión directa de facturas SIAT, boletas de venta y notas de crédito
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-300 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Conexión Tributaria Activa
            </span>
          </div>
        </div>

        <form onSubmit={handleEmitir} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          
          {/* Columna Izquierda: Datos del Comprobante & Cliente */}
          <div className="lg:col-span-2 space-y-4">
            
            {/* Tipo de Documento */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Tipo de Comprobante</span>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoDocumento('FACTURA_SIAT')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    tipoDocumento === 'FACTURA_SIAT'
                      ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Factura SIAT
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDocumento('BOLETA')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    tipoDocumento === 'BOLETA'
                      ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Boleta de Venta
                </button>
                <button
                  type="button"
                  onClick={() => setTipoDocumento('NOTA_CREDITO')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition text-center ${
                    tipoDocumento === 'NOTA_CREDITO'
                      ? 'bg-blue-50 text-blue-700 border-blue-400 shadow-xs'
                      : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  Nota de Crédito
                </button>
              </div>
            </div>

            {/* Datos del Cliente */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-700">Datos del Cliente</span>
                {clientes.length > 0 && (
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Autocompletar de directorio..."
                      value={searchClientTerm}
                      onChange={(e) => setSearchClientTerm(e.target.value)}
                      className="text-[11px] px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:bg-white"
                    />
                    {searchClientTerm && (
                      <div className="absolute right-0 top-full mt-1 w-60 bg-white border border-slate-200 rounded-xl shadow-lg z-20 max-h-40 overflow-y-auto">
                        {clientes.filter(c => c.razon_social?.toLowerCase().includes(searchClientTerm.toLowerCase()) || c.nit_ci?.includes(searchClientTerm)).map(c => (
                          <div 
                            key={c.id} 
                            onClick={() => handleSelectClient(c)}
                            className="p-2 text-xs hover:bg-blue-50 cursor-pointer border-b border-slate-100 last:border-0"
                          >
                            <span className="font-bold block truncate">{c.razon_social}</span>
                            <span className="text-[10px] text-slate-400">NIT/CI: {c.nit_ci}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">Nombre / Razón Social *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Distribuidora Santa Cruz S.R.L."
                    value={clienteNombre}
                    onChange={(e) => setClienteNombre(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-slate-500 block mb-1">NIT / CI *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1029384756"
                    value={clienteNit}
                    onChange={(e) => setClienteNit(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Agregar Ítems */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Agregar Productos al Comprobante</span>
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center">
                <div className="sm:col-span-7">
                  <select
                    value={selectedProduct}
                    onChange={(e) => setSelectedProduct(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — Bs. {Number(p.precio_venta).toFixed(2)} (Stock: {p.stock_actual})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-3">
                  <input
                    type="number"
                    min="1"
                    value={cantidad}
                    onChange={(e) => setCantidad(e.target.value)}
                    placeholder="Cant."
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:bg-white focus:outline-none text-center"
                  />
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddItem}
                    className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1 shadow-xs"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Añadir</span>
                  </button>
                </div>
              </div>

              {/* Tabla de Ítems */}
              <div className="overflow-x-auto pt-2">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2 px-2">Descripción</th>
                      <th className="py-2 px-2 text-center">Cant.</th>
                      <th className="py-2 px-2 text-right">Precio</th>
                      <th className="py-2 px-2 text-right">Subtotal</th>
                      <th className="py-2 px-2 text-center">Quitar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {cartItems.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/80">
                        <td className="py-2 px-2 font-bold text-slate-800">{item.nombre}</td>
                        <td className="py-2 px-2 text-center font-mono font-bold">{item.cantidad}</td>
                        <td className="py-2 px-2 text-right font-mono text-slate-600">Bs. {item.precio.toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-mono font-bold text-slate-900">Bs. {item.subtotal.toFixed(2)}</td>
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                    {cartItems.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 italic">
                          No hay productos añadidos aún.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>

          {/* Columna Derecha: Método de Pago, Resumen y Emisión */}
          <div className="space-y-4">
            
            {/* Método de Pago */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-bold text-slate-700 block">Método de Pago</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('EFECTIVO')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    metodoPago === 'EFECTIVO' ? 'bg-emerald-50 text-emerald-800 border-emerald-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Banknote className="w-3.5 h-3.5" />
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('QR Simple')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    metodoPago === 'QR Simple' ? 'bg-indigo-50 text-indigo-800 border-indigo-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  QR Simple
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('Tarjeta POS')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    metodoPago === 'Tarjeta POS' ? 'bg-blue-50 text-blue-800 border-blue-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  Tarjeta POS
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('A Crédito')}
                  className={`py-2 px-2 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-1.5 ${
                    metodoPago === 'A Crédito' ? 'bg-amber-50 text-amber-800 border-amber-400' : 'bg-slate-50 text-slate-600 border-slate-200'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  A Crédito
                </button>
              </div>
            </div>

            {/* Resumen de Importes */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-2xs space-y-3">
              <span className="text-xs font-black uppercase text-slate-400 tracking-wider block">
                Resumen de Totales
              </span>

              <div className="space-y-1.5 text-xs text-slate-600 border-b border-slate-100 pb-3">
                <div className="flex justify-between">
                  <span>Subtotal Ítems:</span>
                  <span className="font-mono font-bold">Bs. {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Descuentos:</span>
                  <span className="font-mono font-bold text-slate-400">Bs. 0.00</span>
                </div>
                <div className="flex justify-between">
                  <span>Impuesto IVA (13% inc.):</span>
                  <span className="font-mono font-bold text-emerald-600">Bs. {(total * 0.13).toFixed(2)}</span>
                </div>
              </div>

              <div className="flex justify-between items-baseline pt-1">
                <span className="text-sm font-black text-slate-900">Total a Cobrar:</span>
                <span className="text-2xl font-black text-blue-600 font-mono">
                  Bs. {total.toFixed(2)}
                </span>
              </div>

              {isSuccess ? (
                <div className="w-full py-3 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 animate-fadeIn shadow-md">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>¡Comprobante Emitido con Éxito!</span>
                </div>
              ) : (
                <button
                  type="submit"
                  disabled={cartItems.length === 0}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white font-black text-xs rounded-xl transition flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 cursor-pointer active:scale-98"
                >
                  <FileText className="w-4 h-4" />
                  <span>Emitir Comprobante</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>

        </form>
      </main>
    </div>
  );
}
