import React, { useState, useEffect } from 'react';
import { 
  X, Receipt, Check, CreditCard, Banknote, QrCode, 
  ArrowRight, ShieldCheck, Sparkles, Building2, UserPlus 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';

export default function CheckoutModal({ isOpen, onClose, onSaleCompleted }) {
  const { items, total, count, clearCart } = useCart();
  const { empresa } = useAuth();

  const isPlanPro = empresa?.plan_tipo === 'PRO';

  // Form State matching Stitch
  const [docTipo, setDocTipo] = useState('NOTA_VENTA'); // 'NOTA_VENTA' | 'BOLETA' | 'FACTURA'
  const [serie, setSerie] = useState('NV001');
  const [descuentoPorcentaje, setDescuentoPorcentaje] = useState(0);
  const [clienteSelect, setClienteSelect] = useState('CLIENTES_VARIOS');
  const [clientesList, setClientesList] = useState([]);
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [nuevoCliente, setNuevoCliente] = useState({ razon_social: '', nit_ci: '', telefono: '' });

  const [metodoPago, setMetodoPago] = useState('EFECTIVO'); // 'EFECTIVO' | 'QR' | 'TARJETA' | 'TRANSFERENCIA'
  const [montoRecibido, setMontoRecibido] = useState(total);
  const [numOperacion, setNumOperacion] = useState('');
  const [pagoExacto, setPagoExacto] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Load clients from Dexie
  useEffect(() => {
    if (isOpen) {
      db.clientes.toArray().then(setClientesList);
      setMontoRecibido(total);
      setPagoExacto(true);
      setDescuentoPorcentaje(0);
      setNumOperacion('');
      setShowNewClientForm(false);
    }
  }, [isOpen, total]);

  // Adjust serie based on comprobante type
  useEffect(() => {
    if (docTipo === 'NOTA_VENTA') setSerie('NV001');
    else if (docTipo === 'BOLETA') setSerie('B001');
    else if (docTipo === 'FACTURA') setSerie('F001');
  }, [docTipo]);

  if (!isOpen) return null;

  const descuentoMonto = (total * Number(descuentoPorcentaje || 0)) / 100;
  const totalConDescuento = Math.max(0, total - descuentoMonto);
  const totalFinal = Number(totalConDescuento.toFixed(2));

  // Op Gravadas & IVA calculations (Bolivia 13% IVA for Factura)
  const opGravadas = Number((totalFinal / 1.13).toFixed(2));
  const ivaCalculado = Number((totalFinal - opGravadas).toFixed(2));

  const montoEntregado = pagoExacto ? totalFinal : Number(montoRecibido || totalFinal);
  const cambio = Math.max(0, montoEntregado - totalFinal);

  const handleCreateClient = async (e) => {
    e.preventDefault();
    if (!nuevoCliente.razon_social) return;
    const created = {
      id: `cli-${Date.now()}`,
      razon_social: nuevoCliente.razon_social,
      nit_ci: nuevoCliente.nit_ci || '0',
      telefono: nuevoCliente.telefono || '',
      saldo_credito: 0,
      total_compras: 0
    };
    await db.clientes.add(created);
    const updated = await db.clientes.toArray();
    setClientesList(updated);
    setClienteSelect(created.id);
    setShowNewClientForm(false);
    setNuevoCliente({ razon_social: '', nit_ci: '', telefono: '' });
  };

  const playCashChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.50];
      notes.forEach((freq, idx) => {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.15, audioCtx.currentTime + idx * 0.08);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + idx * 0.08 + 0.25);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start(audioCtx.currentTime + idx * 0.08);
        osc.stop(audioCtx.currentTime + idx * 0.08 + 0.25);
      });
    } catch (e) {}
  };

  const handleProcessPayment = async () => {
    setIsProcessing(true);
    try {
      const correlativoNum = (await db.ventas.count()) + 1;
      const correlativoStr = String(correlativoNum).padStart(6, '0');

      let clientName = 'Clientes Varios';
      let clientNit = '0';

      if (clienteSelect !== 'CLIENTES_VARIOS') {
        const found = clientesList.find(c => c.id === clienteSelect);
        if (found) {
          clientName = found.razon_social;
          clientNit = found.nit_ci;
        }
      }

      const venta = {
        id: `vta-${Date.now()}`,
        fecha: new Date().toISOString(),
        correlativo: `${serie}-${correlativoStr}`,
        tipo_documento: docTipo,
        serie,
        cliente_nombre: clientName,
        cliente_ci_nit: clientNit,
        metodo_pago: metodoPago,
        num_operacion: numOperacion || null,
        descuento_porcentaje: Number(descuentoPorcentaje) || 0,
        subtotal: total,
        total: totalFinal,
        monto_recibido: montoEntregado,
        cambio: metodoPago === 'EFECTIVO' ? cambio : 0,
        estado_siat: docTipo === 'FACTURA' ? (isPlanPro ? 'EMITIDA_ONLINE_SIAT' : 'EMITIDA_OFFLINE_PROCESANDO') : 'NO_APLICA',
        cuf: docTipo === 'FACTURA' ? `CUF-GLORY-${Date.now()}-BOL` : null,
        items: [...items]
      };

      await db.ventas.add(venta);

      // Descontar inventario local con redondeo seguro de 3 decimales (balanza/kilos/unidades)
      for (const item of items) {
        const prod = await db.productos_tienda.get(item.productId);
        if (prod) {
          const nuevoStock = Math.max(0, Math.round(((prod.stock_actual || 0) - item.cantidad) * 1000) / 1000);
          await db.productos_tienda.update(item.productId, { stock_actual: nuevoStock });

          if (db.kardex) {
            await db.kardex.add({
              id: `kdx-${Date.now()}-${item.productId}`,
              fecha: new Date().toISOString(),
              producto_id: item.productId,
              producto_nombre: item.nombre,
              tipo: 'SALIDA',
              cantidad: item.cantidad,
              motivo: `Venta POS (${venta.correlativo})`,
              saldo_nuevo: nuevoStock,
              costo_unitario: prod.precio_compra || (prod.precio_venta * 0.8)
            });
          }
        }
      }

      // Update client stats
      if (clienteSelect !== 'CLIENTES_VARIOS') {
        const found = clientesList.find(c => c.id === clienteSelect);
        if (found) {
          await db.clientes.update(found.id, {
            total_compras: (found.total_compras || 0) + totalFinal
          });
        }
      }

      playCashChime();
      clearCart();
      setIsProcessing(false);
      onSaleCompleted(venta);

      // Sincronizar en segundo plano con Supabase Cloud
      syncService.syncLocalToCloud().catch(err => console.warn('Background cloud sync:', err));
    } catch (err) {
      console.error('Error al procesar la venta:', err);
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
      />

      {/* Main Container mimicking Stitch mobile/modal */}
      <main className="w-full max-w-[430px] bg-white rounded-t-[32px] sm:rounded-2xl shadow-2xl flex flex-col justify-between relative overflow-hidden max-h-[94vh] z-10 animate-slideUp">
        {/* BEGIN: ModalHeader (Exact Stitch Layout) */}
        <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between bg-white sticky top-0 z-20">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-[#2563eb]">
              {/* Receipt Icon */}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path d="M9 14l6-6m-5.5.5h.01m4.99 5h.01M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16l3.5-2 3.5 2 3.5-2 3.5 2z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
              </svg>
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-800 leading-none">Procesar pago</h1>
              <span className="text-[10px] text-slate-400 font-medium">GLORYPOS Bolivia</span>
            </div>
          </div>
          <button 
            onClick={onClose}
            aria-label="Cerrar modal" 
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" 
            type="button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        {/* END: ModalHeader */}

        {/* BEGIN: FormScrollArea */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4 text-xs">
          {/* BEGIN: ClienteSelector */}
          <section className="space-y-1" data-purpose="cliente-section">
            <div className="flex justify-between items-center">
              <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Cliente</label>
              {clienteSelect !== 'CLIENTES_VARIOS' && (
                <span className="text-[10px] text-blue-600 font-semibold">Cliente Registrado</span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              <div className="relative flex-1">
                <select 
                  value={clienteSelect}
                  onChange={(e) => setClienteSelect(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-2 pl-3 pr-8 text-xs font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 focus:border-blue-600 appearance-none"
                >
                  <option value="CLIENTES_VARIOS">Clientes Varios (CI/NIT: 0)</option>
                  {clientesList.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.nit_ci} - {c.razon_social}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>

              <button 
                onClick={() => setShowNewClientForm(!showNewClientForm)}
                className="border border-blue-600 text-blue-600 hover:bg-blue-50 active:scale-95 px-3 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-1 shadow-xs whitespace-nowrap" 
                type="button"
              >
                <span>{showNewClientForm ? 'Cerrar' : '+ Nuevo'}</span>
              </button>
            </div>

            {/* Quick New Client Subform */}
            {showNewClientForm && (
              <form onSubmit={handleCreateClient} className="mt-2 p-2.5 bg-blue-50/50 border border-blue-200 rounded-xl space-y-2 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-900">Registrar Nuevo Cliente</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Razón Social / Nombre"
                    value={nuevoCliente.razon_social}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, razon_social: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-600"
                    required
                  />
                  <input
                    type="text"
                    placeholder="NIT / CI"
                    value={nuevoCliente.nit_ci}
                    onChange={(e) => setNuevoCliente({ ...nuevoCliente, nit_ci: e.target.value })}
                    className="bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-1 focus:ring-blue-600"
                    required
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowNewClientForm(false)}
                    className="px-2.5 py-1 text-slate-500 hover:bg-slate-200 rounded-lg text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-blue-600 text-white font-bold rounded-lg text-xs hover:bg-blue-700 shadow-xs"
                  >
                    Guardar Cliente
                  </button>
                </div>
              </form>
            )}
          </section>
          {/* END: ClienteSelector */}

          {/* BEGIN: ComprobanteSelector (Exact Stitch 3-column pill tabs) */}
          <section className="space-y-1" data-purpose="comprobante-type-section">
            <label className="block text-[11px] font-medium text-slate-500 uppercase tracking-wider">Comprobante</label>
            <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100/90 rounded-xl border border-slate-200">
              {/* Tab 1: Nota de venta */}
              <button 
                onClick={() => setDocTipo('NOTA_VENTA')}
                className={`py-2 text-center rounded-lg font-semibold transition shadow-xs text-xs ${
                  docTipo === 'NOTA_VENTA' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                }`} 
                type="button"
              >
                Nota de venta
              </button>

              {/* Tab 2: Boleta */}
              <button 
                onClick={() => setDocTipo('BOLETA')}
                className={`py-2 text-center rounded-lg font-semibold transition shadow-xs text-xs ${
                  docTipo === 'BOLETA' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                }`} 
                type="button"
              >
                Boleta
              </button>

              {/* Tab 3: Factura SIAT */}
              <button 
                onClick={() => setDocTipo('FACTURA')}
                className={`py-2 text-center rounded-lg font-semibold transition shadow-xs text-xs flex items-center justify-center gap-1 ${
                  docTipo === 'FACTURA' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-slate-600 hover:text-slate-800 hover:bg-white/60'
                }`} 
                type="button"
              >
                <span>Factura</span>
                <span className={`text-[9px] px-1 rounded font-black ${
                  docTipo === 'FACTURA' ? 'bg-amber-400 text-slate-900' : 'bg-blue-100 text-blue-700'
                }`}>
                  SIAT
                </span>
              </button>
            </div>
          </section>
          {/* END: ComprobanteSelector */}

          {/* BEGIN: SerieYDescuento (Exact Stitch Grid) */}
          <section className="grid grid-cols-12 gap-2" data-purpose="serie-descuento-grid">
            {/* Serie Field */}
            <div className="col-span-7 space-y-1">
              <label className="block text-[11px] font-medium text-slate-500">Serie</label>
              <div className="relative">
                <select 
                  value={serie}
                  onChange={(e) => setSerie(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-3 pr-7 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-600 appearance-none"
                >
                  <option value="NV001">NV001</option>
                  <option value="B001">B001</option>
                  <option value="F001">F001</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-400">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Descuento Field */}
            <div className="col-span-5 space-y-1">
              <label className="block text-[11px] font-medium text-slate-500">Descuento</label>
              <div className="flex items-stretch rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <span className="inline-flex items-center px-2 bg-blue-600 text-white font-bold text-[11px]">%</span>
                <input 
                  type="number" 
                  min="0" 
                  max="100" 
                  value={descuentoPorcentaje}
                  onChange={(e) => setDescuentoPorcentaje(Math.max(0, Math.min(100, Number(e.target.value))))}
                  className="w-full border-0 bg-transparent py-1.5 px-2 text-xs font-semibold text-slate-700 text-center focus:ring-0 focus:outline-none" 
                />
              </div>
            </div>
          </section>
          {/* END: SerieYDescuento */}

          {/* BEGIN: MetodosDePago (Exact Stitch 4 Cards Grid) */}
          <section className="space-y-2 pt-1" data-purpose="metodos-pago-section">
            <div className="flex justify-between items-center">
              <div className="flex items-center space-x-1">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider">Métodos de pago</span>
                <span className="w-4 h-4 rounded-full bg-blue-600 text-white text-[10px] flex items-center justify-center font-bold">1</span>
              </div>
              <span className="text-[11px] text-slate-400">Bolivia QR / Efectivo / POS</span>
            </div>

            {/* Payment Method Grid */}
            <div className="grid grid-cols-2 gap-2">
              {/* Option 1: Efectivo */}
              <div 
                onClick={() => setMetodoPago('EFECTIVO')}
                className={`rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1 relative shadow-xs cursor-pointer transition ${
                  metodoPago === 'EFECTIVO' 
                    ? 'border-2 border-blue-600 bg-blue-50/50' 
                    : 'border border-slate-200 hover:border-slate-300 bg-white'
                }`}
                role="button" 
                tabIndex="0"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect height="12" rx="2" strokeWidth="2" width="20" x="2" y="6" />
                    <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    <path d="M6 12h.01M18 12h.01" strokeLinecap="round" strokeWidth="2" />
                  </svg>
                </div>
                <span className={`text-xs font-bold ${metodoPago === 'EFECTIVO' ? 'text-blue-900' : 'text-slate-700'}`}>
                  Efectivo
                </span>
                {metodoPago === 'EFECTIVO' && (
                  <span className="absolute top-1 right-1.5 text-blue-600">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Option 2: QR Simple (Bolivia Interoperable) */}
              <div 
                onClick={() => setMetodoPago('QR')}
                className={`rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1 relative shadow-xs cursor-pointer transition ${
                  metodoPago === 'QR' 
                    ? 'border-2 border-blue-600 bg-blue-50/50' 
                    : 'border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 bg-white'
                }`}
                role="button" 
                tabIndex="0"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-[#7c3aed] to-[#2563eb] flex items-center justify-center text-white shadow-xs font-black text-xs tracking-tight">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${metodoPago === 'QR' ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                  QR Simple
                </span>
                {metodoPago === 'QR' && (
                  <span className="absolute top-1 right-1.5 text-blue-600">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Option 3: Tarjeta Débito / Crédito */}
              <div 
                onClick={() => setMetodoPago('TARJETA')}
                className={`rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1 relative shadow-xs cursor-pointer transition ${
                  metodoPago === 'TARJETA' 
                    ? 'border-2 border-blue-600 bg-blue-50/50' 
                    : 'border border-slate-200 hover:border-violet-300 hover:bg-violet-50/40 bg-white'
                }`}
                role="button" 
                tabIndex="0"
              >
                <div className="w-8 h-8 rounded-lg bg-[#7c3aed] flex items-center justify-center text-white shadow-xs">
                  <CreditCard className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${metodoPago === 'TARJETA' ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                  Tarjeta
                </span>
                {metodoPago === 'TARJETA' && (
                  <span className="absolute top-1 right-1.5 text-blue-600">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>

              {/* Option 4: Transferencia Bancaria */}
              <div 
                onClick={() => setMetodoPago('TRANSFERENCIA')}
                className={`rounded-xl p-2.5 flex flex-col items-center justify-center space-y-1 relative shadow-xs cursor-pointer transition ${
                  metodoPago === 'TRANSFERENCIA' 
                    ? 'border-2 border-blue-600 bg-blue-50/50' 
                    : 'border border-slate-200 hover:border-sky-300 hover:bg-sky-50/40 bg-white'
                }`}
                role="button" 
                tabIndex="0"
              >
                <div className="w-8 h-8 rounded-full bg-[#00a3e0] flex items-center justify-center text-white shadow-xs font-black text-[10px] uppercase">
                  <Building2 className="w-4 h-4" />
                </div>
                <span className={`text-xs font-semibold ${metodoPago === 'TRANSFERENCIA' ? 'text-blue-900 font-bold' : 'text-slate-700'}`}>
                  Transferencia
                </span>
                {metodoPago === 'TRANSFERENCIA' && (
                  <span className="absolute top-1 right-1.5 text-blue-600">
                    <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 20 20">
                      <path clipRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" fillRule="evenodd" />
                    </svg>
                  </span>
                )}
              </div>
            </div>

            {/* If QR selected, show dynamic Bolivian QR Simple generator with simulation */}
            {metodoPago === 'QR' && (
              <div className="p-3.5 bg-gradient-to-br from-indigo-50/90 to-purple-50/90 border border-indigo-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-xs font-black text-indigo-950">QR Simple Interoperable (Bolivia)</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white px-2 py-0.5 rounded-full border border-indigo-200 text-indigo-700">
                    Vence en 02:45 min
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative group shrink-0">
                    <img
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&margin=2&data=${encodeURIComponent(
                        `BCB_ASOBAN|NIT8472910014|GLORYPOS|BS|${totalFinal.toFixed(2)}|OP-${Date.now().toString().slice(-6)}`
                      )}`}
                      alt="Código QR Simple Bolivia"
                      className="w-24 h-24 rounded-xl bg-white p-1.5 shadow-sm border border-indigo-300"
                    />
                  </div>

                  <div className="flex-1 space-y-1">
                    <div className="text-[11px] text-slate-500">Monto exacto a transferir:</div>
                    <div className="text-xl font-black text-indigo-900">
                      Bs. {totalFinal.toFixed(2)}
                    </div>
                    <p className="text-[10px] text-slate-500 leading-tight">
                      El cliente debe escanear desde su app bancaria (BCP, Banco Unión, BNB, Soli, Fie).
                    </p>

                    {/* Simulation Button */}
                    <button
                      type="button"
                      onClick={() => {
                        const randomOp = `QR-BCB-${Math.floor(100000 + Math.random() * 900000)}`;
                        setNumOperacion(randomOp);
                        playCashChime();
                      }}
                      className="mt-1 px-2.5 py-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-lg text-[10px] font-bold shadow-xs transition flex items-center gap-1 active:scale-95"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>{numOperacion ? `✓ Aprobado: ${numOperacion}` : '⚡ Simular Aprobación Bancaria'}</span>
                    </button>
                  </div>
                </div>

                {/* Bank Pills */}
                <div className="flex flex-wrap items-center gap-1 pt-1 text-[9px] text-slate-500 border-t border-indigo-100">
                  <span className="font-semibold text-slate-600 mr-1">Bancos:</span>
                  <span className="px-1.5 py-0.2 bg-white rounded border border-indigo-100 font-medium">Banco Unión</span>
                  <span className="px-1.5 py-0.2 bg-white rounded border border-indigo-100 font-medium">BCP Móvil</span>
                  <span className="px-1.5 py-0.2 bg-white rounded border border-indigo-100 font-medium">BNB</span>
                  <span className="px-1.5 py-0.2 bg-white rounded border border-indigo-100 font-medium">BancoSol</span>
                  <span className="px-1.5 py-0.2 bg-white rounded border border-indigo-100 font-medium">Banco Fie</span>
                  <span className="px-1.5 py-0.2 bg-white rounded border border-indigo-100 font-medium">Soli Pagos</span>
                </div>
              </div>
            )}

            {/* Dynamic Inputs for Amount and Reference */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">Monto recibido</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-2.5 flex items-center text-slate-500 font-semibold text-xs">Bs.</span>
                  <input 
                    type="number"
                    step="0.1"
                    value={pagoExacto ? totalFinal : montoRecibido}
                    disabled={pagoExacto}
                    onChange={(e) => setMontoRecibido(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-2 py-1.5 text-xs font-bold text-slate-800 focus:ring-1 focus:ring-blue-600 text-right disabled:opacity-80" 
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] text-slate-400 mb-0.5">N° Op / Ref.</label>
                <input 
                  type="text" 
                  value={numOperacion}
                  onChange={(e) => setNumOperacion(e.target.value)}
                  placeholder="Opcional" 
                  className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 focus:ring-1 focus:ring-blue-600" 
                />
              </div>
            </div>

            {/* Fast Cash Shortcut Buttons (Billetes de Bolivia) */}
            {metodoPago === 'EFECTIVO' && (
              <div className="space-y-1 pt-1 animate-fadeIn">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Billetes Rápidos:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => { setPagoExacto(true); setMontoRecibido(totalFinal); }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition border ${
                      pagoExacto ? 'bg-blue-600 text-white border-blue-600 shadow-xs' : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                    }`}
                  >
                    Exacto
                  </button>
                  {[20, 50, 100, 200].map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => { setPagoExacto(false); setMontoRecibido(val); }}
                      className={`px-2 py-1 rounded-lg text-xs font-bold transition border ${
                        !pagoExacto && montoRecibido === val 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                      }`}
                    >
                      Bs. {val}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Pago Exacto Checkbox & Prominent Change Card */}
            <div className="flex items-center justify-between pt-0.5">
              <label className="inline-flex items-center text-xs font-semibold text-blue-700 cursor-pointer select-none">
                <input 
                  type="checkbox" 
                  checked={pagoExacto}
                  onChange={(e) => {
                    setPagoExacto(e.target.checked);
                    if (e.target.checked) setMontoRecibido(totalFinal);
                  }}
                  className="rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-4 h-4 mr-1.5" 
                />
                Pago exacto
              </label>
            </div>

            {!pagoExacto && cambio > 0 && (
              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs animate-fadeIn shadow-xs">
                <span className="font-bold text-emerald-800">Cambio a Entregar (Vuelto):</span>
                <span className="text-base font-black text-emerald-600">Bs. {cambio.toFixed(2)}</span>
              </div>
            )}
          </section>
          {/* END: MetodosDePago */}

          {/* BEGIN: ResumenVenta (Exact Stitch summary card) */}
          <section className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 space-y-1.5" data-purpose="totales-resumen">
            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span>Op. Gravadas</span>
              <span className="font-medium text-slate-700">Bs. {opGravadas.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-500 text-xs">
              <span>I.V.A. (13%) / Impuestos</span>
              <span className="font-medium text-slate-700">Bs. {ivaCalculado.toFixed(2)}</span>
            </div>

            {descuentoMonto > 0 && (
              <div className="flex justify-between items-center text-rose-600 text-xs">
                <span>Descuento ({descuentoPorcentaje}%)</span>
                <span className="font-bold">- Bs. {descuentoMonto.toFixed(2)}</span>
              </div>
            )}

            <div className="h-px bg-slate-200 my-1"></div>

            <div className="flex justify-between items-baseline pt-0.5">
              <span className="font-bold text-slate-700 text-sm">Total a pagar</span>
              <span className="font-black text-slate-900 text-lg tracking-tight">Bs. {totalFinal.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center text-slate-500 text-xs pt-0.5">
              <span className="font-medium">Suma de pagos</span>
              <span className="font-bold text-blue-600">Bs. {montoEntregado.toFixed(2)}</span>
            </div>
          </section>
          {/* END: ResumenVenta */}
        </div>
        {/* END: FormScrollArea */}

        {/* BEGIN: FixedFooterActions (Exact Stitch layout & gradient) */}
        <footer className="p-3 bg-white border-t border-slate-200 grid grid-cols-12 gap-2 items-center">
          <button 
            onClick={onClose}
            className="col-span-4 py-2.5 px-3 rounded-xl border border-slate-300 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition active:scale-95 text-center" 
            type="button"
          >
            Cancelar
          </button>

          <button 
            onClick={handleProcessPayment}
            disabled={isProcessing}
            className="col-span-8 py-2.5 px-4 bg-gradient-to-r from-blue-600 to-[#7c3aed] hover:from-blue-700 hover:to-[#6d28d9] active:opacity-95 text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition active:scale-95 flex items-center justify-center space-x-1.5 disabled:opacity-60" 
            type="button"
          >
            {isProcessing ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <>
                {/* Checkmark icon */}
                <svg className="w-4 h-4 stroke-[2.5]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span>Finalizar venta</span>
              </>
            )}
          </button>
        </footer>
        {/* END: FixedFooterActions */}

        {/* Navigation bar pill indicator (Stitch mobile finish) */}
        <div className="h-2.5 bg-white flex items-center justify-center pb-1">
          <div className="w-24 h-1 bg-slate-300 rounded-full"></div>
        </div>
      </main>
    </div>
  );
}
