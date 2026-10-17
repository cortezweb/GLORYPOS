import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Search, Clock, CheckCircle2, X, FileText, Truck, Store, Phone, MapPin, Printer, Ban,
  ChefHat, PackageCheck, RefreshCw, MessageCircle, Receipt, Wallet
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { tiendaService, ESTADOS_PEDIDO, METODOS_PAGO_WEB } from '../../services/tiendaService';
import { playCashChime } from '../../utils/audio';
import SalesSubNav from './SalesSubNav';
import { simbolo } from '../../utils/currency';

const money = (n) => `${simbolo()} ${(Number(n) || 0).toFixed(2)}`;
const FILTROS = [
  { id: 'ACTIVOS', label: 'Por atender', test: p => ['NUEVO', 'PREPARANDO', 'LISTO'].includes(p.estado) },
  { id: 'NUEVO', label: 'Nuevos', test: p => p.estado === 'NUEVO' },
  { id: 'PREPARANDO', label: 'En preparación', test: p => p.estado === 'PREPARANDO' },
  { id: 'LISTO', label: 'Listos / en camino', test: p => p.estado === 'LISTO' },
  { id: 'CERRADO', label: 'Cerrados', test: p => p.estado === 'CERRADO' },
  { id: 'ANULADO', label: 'Anulados', test: p => p.estado === 'ANULADO' },
  { id: 'TODOS', label: 'Todos', test: () => true },
];
const metodoLabel = (id) => METODOS_PAGO_WEB.find(m => m.id === id)?.label || id || '—';

// Ventana del sistema donde llegan los pedidos de la tienda en línea.
// Cada pedido trae su comprobante generado; el administrador confirma el cierre e imprime.
export default function PedidosWebView({ onSelectSubView, hideSubNav = false, onOpenReceipt }) {
  const { empresa, currentUser } = useAuth();
  const [pedidos, setPedidos] = useState([]);
  const [filtro, setFiltro] = useState('ACTIVOS');
  const [q, setQ] = useState('');
  const [selId, setSelId] = useState(null);
  const [cerrando, setCerrando] = useState(null); // pedido en el diálogo de cierre
  const [metodoCierre, setMetodoCierre] = useState('EFECTIVO');
  const [aviso, setAviso] = useState(null);
  const [cargando, setCargando] = useState(false);
  const conocidos = useRef(null);
  const empresaId = empresa?.id || 'empresa_activa';

  const cargar = useCallback(async (conNube = false) => {
    setCargando(true);
    try {
      await tiendaService.migrarLegacy();
      if (conNube) await tiendaService.traerDeLaNube(empresaId).catch(() => 0);
      const lista = await tiendaService.listar(empresaId);
      const nuevos = lista.filter(p => p.estado === 'NUEVO').map(p => p.id);
      if (conocidos.current && nuevos.some(id => !conocidos.current.has(id))) {
        playCashChime();
        setAviso('¡Llegó un pedido nuevo de la tienda en línea!');
        setTimeout(() => setAviso(null), 4000);
      }
      conocidos.current = new Set(nuevos);
      setPedidos(lista);
    } finally {
      setCargando(false);
    }
  }, [empresaId]);

  useEffect(() => {
    cargar(true);
    const onNuevo = () => cargar(false);
    window.addEventListener('glorypos_order_created', onNuevo);
    const timer = setInterval(() => cargar(true), 20000);
    return () => {
      window.removeEventListener('glorypos_order_created', onNuevo);
      clearInterval(timer);
    };
  }, [cargar]);

  const lista = useMemo(() => {
    const f = FILTROS.find(x => x.id === filtro);
    const t = q.trim().toLowerCase();
    return pedidos.filter(f.test).filter(p => !t
      || p.cliente_nombre?.toLowerCase().includes(t)
      || String(p.telefono || '').includes(t)
      || p.numero_orden?.toLowerCase().includes(t)
      || p.comprobante?.correlativo?.toLowerCase().includes(t));
  }, [pedidos, filtro, q]);

  const sel = pedidos.find(p => p.id === selId) || null;
  const hoy = new Date().toISOString().slice(0, 10);
  const kpis = [
    { label: 'Nuevos', value: pedidos.filter(p => p.estado === 'NUEVO').length, tone: 'text-[#E85B28]' },
    { label: 'En preparación', value: pedidos.filter(p => p.estado === 'PREPARANDO').length, tone: 'text-amber-700' },
    { label: 'Listos / en camino', value: pedidos.filter(p => p.estado === 'LISTO').length, tone: 'text-sky-700' },
    { label: 'Por cobrar', value: money(pedidos.filter(p => ['NUEVO', 'PREPARANDO', 'LISTO'].includes(p.estado)).reduce((a, p) => a + (Number(p.total) || 0), 0)), tone: 'text-slate-900' },
    { label: 'Cerrado hoy', value: money(pedidos.filter(p => p.estado === 'CERRADO' && (p.cerrado_at || '').startsWith(hoy)).reduce((a, p) => a + (Number(p.total) || 0), 0)), tone: 'text-emerald-700' },
  ];

  const actualizar = async (fn) => {
    try {
      await fn();
      await cargar(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const abrirCierre = (p) => {
    setMetodoCierre(p.pago?.metodo || 'EFECTIVO');
    setCerrando(p);
  };

  const confirmarCierre = () => actualizar(async () => {
    const venta = await tiendaService.confirmarCierre(cerrando, { metodoPago: metodoCierre, empresaId, usuario: currentUser?.nombre });
    setCerrando(null);
    onOpenReceipt?.(venta);
  });

  const reimprimir = async (p) => {
    const venta = p.venta_id ? await db.ventas.get(p.venta_id) : null;
    if (venta) onOpenReceipt?.(venta);
    else alert('No se encontró la venta de este pedido en este equipo.');
  };

  const whatsapp = (p) => {
    const tel = String(p.telefono || '').replace(/\D/g, '');
    const num = tel.startsWith('591') ? tel : `591${tel}`;
    const txt = `Hola ${p.cliente_nombre}, te escribimos de ${empresa?.nombre || 'la tienda'} por tu pedido ${p.numero_orden || ''} (${money(p.total)}).`;
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(txt)}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      {!hideSubNav && onSelectSubView && <SalesSubNav currentSubView="pedidos_web" onSelectSubView={onSelectSubView} />}

      <main className="w-full p-4 sm:p-6 space-y-4">
        {aviso && (
          <div className="fixed top-5 left-1/2 -translate-x-1/2 z-[400] bg-[#1E2022] text-white px-4 py-3 rounded-2xl shadow-2xl text-xs font-bold flex items-center gap-2">
            <PackageCheck className="w-4 h-4 text-[#FFB627]" /> {aviso}
          </div>
        )}

        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-black text-slate-900">Pedidos de la tienda en línea</h1>
            <p className="text-xs text-slate-500">Cada pedido llega con su comprobante generado. Prepáralo, confirma el cierre e imprime.</p>
          </div>
          <button type="button" onClick={() => cargar(true)} className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold flex items-center gap-1.5">
            <RefreshCw className={`w-4 h-4 ${cargando ? 'animate-spin' : ''}`} /> Actualizar
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {kpis.map(k => (
            <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p>
              <p className={`text-lg font-black ${k.tone}`}>{k.value}</p>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {FILTROS.map(f => (
            <button key={f.id} type="button" onClick={() => setFiltro(f.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${filtro === f.id ? 'bg-[#FF6B35] text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
              {f.label} ({pedidos.filter(f.test).length})
            </button>
          ))}
          <div className="relative ml-auto w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input value={q} onChange={e => setQ(e.target.value)} placeholder="Cliente, celular, N.º pedido o comprobante" className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs bg-white" />
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-5 gap-4">
          <div className="xl:col-span-3 space-y-2">
            {lista.length === 0 && (
              <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-xs text-slate-500">
                No hay pedidos con este filtro.
              </div>
            )}
            {lista.map(p => {
              const st = ESTADOS_PEDIDO[p.estado] || ESTADOS_PEDIDO.NUEVO;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelId(p.id)}
                  className={`w-full text-left bg-white rounded-2xl border p-3 flex items-center gap-3 transition hover:shadow-sm ${selId === p.id ? 'border-[#FF6B35] ring-2 ring-[#FF6B35]/15' : 'border-slate-200'}`}
                >
                  <div className="w-10 h-10 rounded-xl bg-[#FF6B35]/10 text-[#E85B28] flex items-center justify-center shrink-0">
                    {p.entrega?.tipo === 'DELIVERY' ? <Truck className="w-5 h-5" /> : <Store className="w-5 h-5" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-black text-slate-900 truncate">{p.cliente_nombre}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${st.badge}`}>{st.label}</span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate">
                      {p.numero_orden || p.id} · {p.comprobante?.correlativo || 'Comprobante pendiente'} · {(p.items || []).length} producto(s) · {metodoLabel(p.pago?.metodo)}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-black text-slate-900">{money(p.total)}</p>
                    <p className="text-[10px] text-slate-400 flex items-center gap-1 justify-end"><Clock className="w-3 h-3" />{new Date(p.fecha_iso).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="xl:col-span-2">
            {!sel ? (
              <div className="bg-white rounded-3xl border border-slate-200 p-8 text-center text-xs text-slate-400 xl:sticky xl:top-4">
                <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                Elige un pedido para ver el detalle y su comprobante.
              </div>
            ) : (
              <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3 xl:sticky xl:top-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">Pedido {sel.numero_orden || sel.id}</p>
                    <h2 className="text-lg font-black text-slate-900">{sel.cliente_nombre}</h2>
                  </div>
                  <button type="button" onClick={() => setSelId(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Phone className="w-3 h-3" /> Contacto</p>
                    <p className="font-bold text-slate-800">{sel.telefono || '—'}</p>
                    {sel.documento && <p className="text-[10px] text-slate-500">CI/NIT {sel.documento}</p>}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Wallet className="w-3 h-3" /> Pago</p>
                    <p className="font-bold text-slate-800">{metodoLabel(sel.pago?.metodo)}</p>
                    {sel.pago?.cambio_de > 0 && <p className="text-[10px] text-slate-500">Paga con {money(sel.pago.cambio_de)} · cambio {money(sel.pago.cambio_de - sel.total)}</p>}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5 col-span-2">
                    <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><MapPin className="w-3 h-3" /> {sel.entrega?.tipo === 'DELIVERY' ? 'Delivery' : 'Recojo en tienda'}</p>
                    <p className="font-bold text-slate-800">{sel.direccion || '—'}</p>
                    {sel.entrega?.referencia && <p className="text-[10px] text-slate-500">Ref: {sel.entrega.referencia}</p>}
                  </div>
                </div>
                {sel.notas && <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">{sel.notas}</p>}

                {/* Comprobante generado */}
                <div className="border border-dashed border-slate-300 rounded-2xl p-3 font-mono text-[11px] space-y-1">
                  <div className="flex items-center justify-between font-sans">
                    <p className="text-xs font-black text-slate-800 flex items-center gap-1"><Receipt className="w-4 h-4 text-[#FF6B35]" /> {sel.comprobante?.tipo === 'FACTURA' ? 'Factura' : 'Nota de venta'} {sel.comprobante?.correlativo || ''}</p>
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${sel.comprobante?.estado === 'EMITIDO' ? 'bg-emerald-50 text-emerald-700' : sel.comprobante?.estado === 'ANULADO' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}>
                      {sel.comprobante?.estado === 'EMITIDO' ? 'EMITIDO' : sel.comprobante?.estado === 'ANULADO' ? 'ANULADO' : 'PENDIENTE DE CIERRE'}
                    </span>
                  </div>
                  {(sel.items || []).map((it, i) => (
                    <div key={i} className="flex justify-between gap-2"><span className="truncate">{it.cantidad} x {it.nombre}</span><span>{Number(it.subtotal ?? it.precio * it.cantidad).toFixed(2)}</span></div>
                  ))}
                  {sel.envio > 0 && <div className="flex justify-between"><span>Envío</span><span>{Number(sel.envio).toFixed(2)}</span></div>}
                  <div className="flex justify-between border-t border-slate-200 pt-1 font-black text-sm"><span>TOTAL</span><span>{money(sel.total)}</span></div>
                </div>

                {['NUEVO', 'PREPARANDO', 'LISTO'].includes(sel.estado) && (
                  <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
                    {sel.estado === 'NUEVO' && (
                      <button type="button" onClick={() => actualizar(() => tiendaService.cambiarEstado(sel, 'PREPARANDO', empresaId))} className="py-2 rounded-xl bg-amber-50 text-amber-800 border border-amber-200 flex items-center justify-center gap-1">
                        <ChefHat className="w-3.5 h-3.5" /> En preparación
                      </button>
                    )}
                    {sel.estado !== 'LISTO' && (
                      <button type="button" onClick={() => actualizar(() => tiendaService.cambiarEstado(sel, 'LISTO', empresaId))} className="py-2 rounded-xl bg-sky-50 text-sky-800 border border-sky-200 flex items-center justify-center gap-1">
                        <Truck className="w-3.5 h-3.5" /> {sel.entrega?.tipo === 'DELIVERY' ? 'En camino' : 'Listo para recoger'}
                      </button>
                    )}
                    <button type="button" onClick={() => whatsapp(sel)} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
                      <MessageCircle className="w-3.5 h-3.5" /> WhatsApp cliente
                    </button>
                    <button type="button" onClick={() => { const m = window.prompt('Motivo de la anulación:'); if (m !== null) actualizar(() => tiendaService.anular(sel, m, empresaId)); }} className="py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
                      <Ban className="w-3.5 h-3.5" /> Anular
                    </button>
                    <button type="button" onClick={() => abrirCierre(sel)} className="col-span-2 py-3 rounded-xl bg-[#00B574] hover:bg-[#00965e] text-white text-xs font-black flex items-center justify-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Confirmar cierre e imprimir
                    </button>
                  </div>
                )}
                {sel.estado === 'CERRADO' && (
                  <button type="button" onClick={() => reimprimir(sel)} className="w-full py-2.5 rounded-xl border border-slate-200 text-xs font-bold flex items-center justify-center gap-1.5">
                    <Printer className="w-4 h-4" /> Reimprimir comprobante
                  </button>
                )}
                {sel.motivo_anulacion && <p className="text-xs text-rose-600">Anulado: {sel.motivo_anulacion}</p>}
              </div>
            )}
          </div>
        </div>
      </main>

      {cerrando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto [&>*]:my-auto">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setCerrando(null)} />
          <div className="relative z-10 w-full max-w-sm bg-white rounded-3xl p-5 space-y-4 shadow-2xl">
            <div>
              <h3 className="text-base font-black text-slate-900">Confirmar cierre del pedido</h3>
              <p className="text-xs text-slate-500">Se emite {cerrando.comprobante?.correlativo || 'el comprobante'} por {money(cerrando.total)}, se registra la venta en caja y se descuenta el stock.</p>
            </div>
            <label className="block text-[11px] font-bold text-slate-600">Método con el que se cobró
              <select value={metodoCierre} onChange={e => setMetodoCierre(e.target.value)} className="mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm">
                {METODOS_PAGO_WEB.map(m => <option key={m.id} value={m.id}>{m.label}</option>)}
              </select>
            </label>
            <div className="flex gap-2">
              <button type="button" onClick={() => setCerrando(null)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-bold">Cancelar</button>
              <button type="button" onClick={confirmarCierre} className="flex-1 py-2.5 rounded-xl bg-[#00B574] text-white text-xs font-black flex items-center justify-center gap-1">
                <Printer className="w-4 h-4" /> Cerrar e imprimir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
