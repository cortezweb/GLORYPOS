import React, { useMemo, useState } from 'react';
import {
  X, ShoppingBag, ShoppingCart, Package, Minus, Plus, Trash2, ArrowLeft, ArrowRight, User, Truck,
  Store, CreditCard, Banknote, QrCode, Landmark, CheckCircle2, MessageCircle, Loader2
} from 'lucide-react';
import { tiendaService, getCheckoutSettings, costoEnvio, METODOS_PAGO_WEB } from '../../services/tiendaService';

const PASOS = [
  { id: 'carrito', label: 'Carrito', icon: ShoppingCart },
  { id: 'datos', label: 'Tus datos', icon: User },
  { id: 'entrega', label: 'Entrega', icon: Truck },
  { id: 'pago', label: 'Pago', icon: CreditCard },
];
const ICONO_PAGO = { EFECTIVO: Banknote, QR: QrCode, TRANSFERENCIA: Landmark, TARJETA: CreditCard };
const CLIENTE_KEY = 'glorypos_tienda_cliente';

const input = 'w-full bg-white border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-slate-800 outline-hidden focus:border-[#FF6B35] focus:ring-2 focus:ring-[#FF6B35]/15 transition';
const labelCls = 'text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1';
const money = (n) => `Bs. ${(Number(n) || 0).toFixed(2)}`;

// Checkout de la tienda en línea en 4 pasos: carrito → datos → entrega → pago → confirmación
export default function CheckoutDrawer({ empresa, cart, onClose, onUpdateQuantity, onRemove, onClearCart }) {
  const settings = useMemo(() => getCheckoutSettings(), []);
  const [paso, setPaso] = useState(0);
  const [cliente, setCliente] = useState(() => {
    try { return { nombre: '', documento: '', telefono: '', email: '', ...JSON.parse(localStorage.getItem(CLIENTE_KEY) || '{}') }; }
    catch { return { nombre: '', documento: '', telefono: '', email: '' }; }
  });
  const [entrega, setEntrega] = useState({ tipo: settings.delivery_activo ? 'DELIVERY' : 'RECOJO', direccion: '', referencia: '' });
  const [pago, setPago] = useState({ metodo: 'EFECTIVO', cambio_de: '' });
  const [notas, setNotas] = useState('');
  const [error, setError] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [pedidoOk, setPedidoOk] = useState(null);

  const subtotal = cart.reduce((a, it) => a + it.precio * it.cantidad, 0);
  const envio = costoEnvio(entrega.tipo, subtotal, settings);
  const total = subtotal + envio;
  const items = cart.reduce((a, it) => a + it.cantidad, 0);

  const validar = () => {
    if (paso === 0 && cart.length === 0) return 'Tu carrito está vacío.';
    if (paso === 1) {
      if (!cliente.nombre.trim()) return 'Ingresa tu nombre completo.';
      if (!/^\+?[\d\s-]{7,}$/.test(cliente.telefono.trim())) return 'Ingresa un celular válido (mínimo 7 dígitos).';
    }
    if (paso === 2 && entrega.tipo === 'DELIVERY' && entrega.direccion.trim().length < 5) return 'Ingresa la dirección de entrega.';
    if (paso === 3 && pago.metodo === 'EFECTIVO' && pago.cambio_de && Number(pago.cambio_de) < total) return 'El monto para el cambio debe ser mayor al total.';
    return '';
  };

  const siguiente = () => {
    const e = validar();
    setError(e);
    if (!e) setPaso(p => p + 1);
  };

  const confirmar = async () => {
    const e = validar();
    setError(e);
    if (e) return;
    setEnviando(true);
    try {
      try { localStorage.setItem(CLIENTE_KEY, JSON.stringify(cliente)); } catch {}
      const pedido = await tiendaService.crearPedido({ empresa, cart, cliente, entrega, pago, notas });
      setPedidoOk(pedido);
      onClearCart();
    } catch (err) {
      setError('No se pudo registrar el pedido. Revisa tu conexión e inténtalo de nuevo.');
      console.error(err);
    } finally {
      setEnviando(false);
    }
  };

  const avisarWhatsApp = () => {
    const p = pedidoOk;
    const lineas = p.items.map(it => `• ${it.nombre} x${it.cantidad} — ${money(it.subtotal)}`).join('\n');
    const texto = `Hola *${empresa?.nombre || 'tienda'}*, acabo de hacer el pedido *${p.numero_orden}*:\n\n${lineas}\n${p.envio ? `Envío: ${money(p.envio)}\n` : ''}*Total: ${money(p.total)}*\n\nEntrega: ${p.entrega.tipo === 'DELIVERY' ? p.direccion : 'Recojo en tienda'}\nPago: ${METODOS_PAGO_WEB.find(m => m.id === p.pago.metodo)?.label}\nNombre: ${p.cliente_nombre} · ${p.telefono}`;
    const tel = String(empresa?.telefono || '').replace(/\D/g, '');
    const num = tel ? (tel.startsWith('591') ? tel : `591${tel}`) : '';
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(texto)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-[300] flex justify-end animate-fadeIn">
      <div onClick={onClose} className="absolute inset-0 bg-black/50 backdrop-blur-xs" />
      <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slideLeft">
        {/* Encabezado */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            {paso > 0 && !pedidoOk ? (
              <button type="button" onClick={() => { setError(''); setPaso(p => p - 1); }} className="p-1.5 rounded-xl hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
            ) : (
              <ShoppingBag className="w-5 h-5 text-[#FF6B35]" />
            )}
            <h3 className="font-black text-slate-800 text-base">{pedidoOk ? '¡Pedido recibido!' : PASOS[paso].id === 'carrito' ? `Tu carrito (${items})` : 'Finalizar compra'}</h3>
          </div>
          <button type="button" onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100"><X className="w-5 h-5" /></button>
        </div>

        {/* Pasos */}
        {!pedidoOk && cart.length > 0 && (
          <div className="px-4 pt-3 flex items-center gap-1">
            {PASOS.map((p, i) => {
              const Icon = p.icon;
              const hecho = i < paso;
              const activo = i === paso;
              return (
                <React.Fragment key={p.id}>
                  <div className={`flex items-center gap-1 text-[10px] font-bold ${activo ? 'text-[#E85B28]' : hecho ? 'text-[#00B574]' : 'text-slate-400'}`}>
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center border ${activo ? 'border-[#FF6B35] bg-[#FF6B35]/10' : hecho ? 'border-[#00B574] bg-[#00B574]/10' : 'border-slate-200'}`}>
                      {hecho ? <CheckCircle2 className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </span>
                    <span className="hidden sm:inline">{p.label}</span>
                  </div>
                  {i < PASOS.length - 1 && <div className={`flex-1 h-0.5 rounded ${i < paso ? 'bg-[#00B574]' : 'bg-slate-200'}`} />}
                </React.Fragment>
              );
            })}
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4">
          {pedidoOk ? (
            <div className="text-center space-y-4 py-6">
              <div className="w-16 h-16 rounded-full bg-[#00B574]/10 text-[#00B574] flex items-center justify-center mx-auto"><CheckCircle2 className="w-9 h-9" /></div>
              <div>
                <p className="text-sm text-slate-500">Tu número de pedido es</p>
                <p className="text-2xl font-black text-slate-900 font-mono">{pedidoOk.numero_orden}</p>
              </div>
              <div className="bg-slate-50 rounded-2xl p-4 text-left text-xs space-y-1.5">
                <div className="flex justify-between"><span className="text-slate-500">Total</span><b>{money(pedidoOk.total)}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Entrega</span><b>{pedidoOk.entrega.tipo === 'DELIVERY' ? 'Delivery' : 'Recojo en tienda'}</b></div>
                <div className="flex justify-between"><span className="text-slate-500">Pago</span><b>{METODOS_PAGO_WEB.find(m => m.id === pedidoOk.pago.metodo)?.label}</b></div>
              </div>
              <p className="text-xs text-slate-500">Ya lo recibimos en nuestro sistema. Te contactaremos al {pedidoOk.telefono} para confirmar la entrega.</p>
              <button type="button" onClick={avisarWhatsApp} className="w-full py-3 rounded-2xl bg-[#00B574] hover:bg-[#00965e] text-white font-black text-xs flex items-center justify-center gap-2">
                <MessageCircle className="w-4 h-4" /> Avisar también por WhatsApp (opcional)
              </button>
              <button type="button" onClick={onClose} className="w-full py-3 rounded-2xl border border-slate-200 font-bold text-xs">Seguir comprando</button>
            </div>
          ) : cart.length === 0 ? (
            <div className="text-center text-slate-400 py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300"><ShoppingCart className="w-8 h-8" /></div>
              <p className="font-bold text-slate-600 text-sm">Tu carrito está vacío</p>
              <p className="text-xs">Agrega productos del catálogo para armar tu pedido.</p>
            </div>
          ) : paso === 0 ? (
            <div className="divide-y divide-slate-100">
              {cart.map(item => (
                <div key={item.id} className="py-3 flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80">
                    {item.imagen_url ? <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" /> : <Package className="w-6 h-6 text-slate-300" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-xs font-bold text-slate-800 line-clamp-2">{item.nombre}</h4>
                    <p className="text-[11px] text-slate-400">{money(item.precio)} c/u</p>
                    <p className="text-xs font-black text-slate-900">{money(item.precio * item.cantidad)}</p>
                  </div>
                  <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 rounded-xl px-1 py-0.5">
                    <button type="button" onClick={() => onUpdateQuantity(item.id, -1)} className="p-1.5 text-slate-500 hover:text-slate-800"><Minus className="w-3 h-3" /></button>
                    <span className="w-6 text-center text-xs font-bold">{item.cantidad}</span>
                    <button type="button" onClick={() => onUpdateQuantity(item.id, 1)} className="p-1.5 text-slate-500 hover:text-slate-800"><Plus className="w-3 h-3" /></button>
                  </div>
                  <button type="button" onClick={() => onRemove(item.id)} className="p-1.5 text-slate-400 hover:text-rose-600" title="Quitar"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          ) : paso === 1 ? (
            <div className="space-y-3">
              <label className="block"><span className={labelCls}>Nombre completo *</span>
                <input autoFocus value={cliente.nombre} onChange={e => setCliente(c => ({ ...c, nombre: e.target.value }))} placeholder="Ej. Juan Pérez" className={input} />
              </label>
              <label className="block"><span className={labelCls}>Celular / WhatsApp *</span>
                <input type="tel" inputMode="tel" value={cliente.telefono} onChange={e => setCliente(c => ({ ...c, telefono: e.target.value }))} placeholder="Ej. 77012345" className={input} />
              </label>
              <label className="block"><span className={labelCls}>CI / NIT para tu comprobante (opcional)</span>
                <input value={cliente.documento} onChange={e => setCliente(c => ({ ...c, documento: e.target.value }))} placeholder="Ej. 1234567" className={input} />
              </label>
              <label className="block"><span className={labelCls}>Correo (opcional)</span>
                <input type="email" value={cliente.email} onChange={e => setCliente(c => ({ ...c, email: e.target.value }))} placeholder="tu@correo.com" className={input} />
              </label>
            </div>
          ) : paso === 2 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                {settings.delivery_activo && (
                  <button type="button" onClick={() => setEntrega(e => ({ ...e, tipo: 'DELIVERY' }))} className={`p-3 rounded-2xl border-2 text-left ${entrega.tipo === 'DELIVERY' ? 'border-[#FF6B35] bg-[#FF6B35]/5' : 'border-slate-200'}`}>
                    <Truck className="w-5 h-5 text-[#FF6B35] mb-1" />
                    <p className="text-xs font-black">Delivery</p>
                    <p className="text-[10px] text-slate-500">{costoEnvio('DELIVERY', subtotal, settings) > 0 ? money(settings.costo_delivery) : 'Envío gratis'}</p>
                  </button>
                )}
                {settings.recojo_activo && (
                  <button type="button" onClick={() => setEntrega(e => ({ ...e, tipo: 'RECOJO' }))} className={`p-3 rounded-2xl border-2 text-left ${entrega.tipo === 'RECOJO' ? 'border-[#FF6B35] bg-[#FF6B35]/5' : 'border-slate-200'}`}>
                    <Store className="w-5 h-5 text-[#FF6B35] mb-1" />
                    <p className="text-xs font-black">Recojo en tienda</p>
                    <p className="text-[10px] text-slate-500">Sin costo</p>
                  </button>
                )}
              </div>
              {settings.envio_gratis_desde > 0 && entrega.tipo === 'DELIVERY' && subtotal < settings.envio_gratis_desde && (
                <p className="text-[11px] text-[#E85B28] font-bold">Te faltan {money(settings.envio_gratis_desde - subtotal)} para envío gratis.</p>
              )}
              {entrega.tipo === 'DELIVERY' ? (
                <>
                  <label className="block"><span className={labelCls}>Dirección de entrega *</span>
                    <input autoFocus value={entrega.direccion} onChange={e => setEntrega(x => ({ ...x, direccion: e.target.value }))} placeholder="Calle, número, zona" className={input} />
                  </label>
                  <label className="block"><span className={labelCls}>Referencia (opcional)</span>
                    <input value={entrega.referencia} onChange={e => setEntrega(x => ({ ...x, referencia: e.target.value }))} placeholder="Ej. Portón negro, frente a la plaza" className={input} />
                  </label>
                </>
              ) : (
                <div className="bg-slate-50 rounded-2xl p-3 text-xs text-slate-600">
                  <p className="font-bold text-slate-800">Recoges en:</p>
                  <p>{settings.direccion_recojo || empresa?.direccion || 'Nuestra tienda'}</p>
                </div>
              )}
              <label className="block"><span className={labelCls}>Notas del pedido (opcional)</span>
                <textarea rows={2} value={notas} onChange={e => setNotas(e.target.value)} placeholder="Horario preferido, indicaciones..." className={input} />
              </label>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                {METODOS_PAGO_WEB.map(m => {
                  const Icon = ICONO_PAGO[m.id];
                  return (
                    <button key={m.id} type="button" onClick={() => setPago(p => ({ ...p, metodo: m.id }))} className={`w-full p-3 rounded-2xl border-2 text-left flex items-center gap-3 ${pago.metodo === m.id ? 'border-[#FF6B35] bg-[#FF6B35]/5' : 'border-slate-200'}`}>
                      <Icon className="w-5 h-5 text-[#FF6B35] shrink-0" />
                      <div>
                        <p className="text-xs font-black text-slate-800">{m.label}</p>
                        <p className="text-[10px] text-slate-500">{m.desc}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
              {pago.metodo === 'EFECTIVO' && (
                <label className="block"><span className={labelCls}>¿Con cuánto pagarás? (para llevar cambio)</span>
                  <input type="number" min="0" value={pago.cambio_de} onChange={e => setPago(p => ({ ...p, cambio_de: e.target.value }))} placeholder={`Ej. ${Math.ceil(total / 50) * 50}`} className={input} />
                </label>
              )}
              <div className="bg-slate-50 rounded-2xl p-3 text-xs space-y-1">
                <p className="font-black text-slate-800 mb-1">Resumen</p>
                <p className="text-slate-600">{cliente.nombre} · {cliente.telefono}</p>
                <p className="text-slate-600">{entrega.tipo === 'DELIVERY' ? `Delivery a ${entrega.direccion}` : 'Recojo en tienda'}</p>
              </div>
            </div>
          )}
        </div>

        {/* Pie: totales y acción */}
        {!pedidoOk && cart.length > 0 && (
          <div className="border-t border-slate-100 p-4 space-y-2 bg-slate-50/70">
            <div className="text-xs space-y-1">
              <div className="flex justify-between text-slate-500"><span>Subtotal ({items} productos)</span><span>{money(subtotal)}</span></div>
              {paso >= 2 && <div className="flex justify-between text-slate-500"><span>Envío</span><span>{envio > 0 ? money(envio) : 'Gratis'}</span></div>}
              <div className="flex justify-between items-center pt-1 border-t border-slate-200 text-sm font-black text-slate-900">
                <span>Total</span><span className="text-lg text-[#FF6B35]">{money(paso >= 2 ? total : subtotal)}</span>
              </div>
            </div>
            {error && <p className="text-[11px] font-bold text-rose-600">{error}</p>}
            {paso < PASOS.length - 1 ? (
              <button type="button" onClick={siguiente} className="w-full py-3.5 rounded-2xl bg-[#FF6B35] hover:bg-[#ea580c] text-white font-black text-xs shadow-lg shadow-[#FF6B35]/30 flex items-center justify-center gap-2">
                {paso === 0 ? 'Continuar con la compra' : 'Continuar'} <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button type="button" disabled={enviando} onClick={confirmar} className="w-full py-3.5 rounded-2xl bg-[#00B574] hover:bg-[#00965e] text-white font-black text-xs shadow-lg shadow-[#00B574]/30 flex items-center justify-center gap-2 disabled:opacity-60">
                {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {enviando ? 'Enviando pedido...' : `Confirmar pedido · ${money(total)}`}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
