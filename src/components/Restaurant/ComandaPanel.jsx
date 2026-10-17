import React, { useMemo, useState } from 'react';
import {
  ArrowLeft, Search, Send, Receipt, Printer, Scissors, Trash2, Minus, Plus,
  ArrowRightLeft, StickyNote, CheckCheck, CreditCard, Ban, BedDouble
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useModules } from '../../hooks/useModules';
import { useAuth } from '../../context/AuthContext';
import {
  restaurantService, ITEM_ESTADOS, TIPOS_PEDIDO, totalComanda, totalPendienteCobro, itemActivo
} from '../../services/restaurantService';
import { money, minutosDesde, formatMinutos } from './useGlorychefData';
import { simbolo } from '../../utils/currency';

const ESTADO_COLOR = {
  PENDIENTE: 'bg-slate-100 text-slate-700 border-slate-200',
  ENVIADO: 'bg-blue-50 text-blue-700 border-blue-200',
  PREPARANDO: 'bg-amber-50 text-amber-700 border-amber-200',
  LISTO: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  ENTREGADO: 'bg-slate-50 text-slate-500 border-slate-200',
  ANULADO: 'bg-rose-50 text-rose-600 border-rose-200 line-through',
};

export default function ComandaPanel({ comanda, data, onBack, onCobrar }) {
  const { empresa } = useAuth();
  const { productos, productosById, mesas } = data;
  const [busqueda, setBusqueda] = useState('');
  const [categoria, setCategoria] = useState('Todas');
  const [nota, setNota] = useState('');
  const [dividiendo, setDividiendo] = useState(false);
  const [seleccion, setSeleccion] = useState([]);
  const [cambiandoMesa, setCambiandoMesa] = useState(false);
  const { hotelActivo } = useModules();
  const [huespedes, setHuespedes] = useState(null); // lista de huéspedes en casa para "cargar a habitación"

  const abrirCargoHabitacion = async () => {
    if (huespedes) { setHuespedes(null); return; }
    const [reservas, habs] = await Promise.all([db.reservas.where('estado').equals('EN_CASA').toArray(), db.habitaciones.toArray()]);
    const hab = Object.fromEntries(habs.map(h => [h.id, h.numero]));
    setHuespedes(reservas.map(r => ({ id: r.id, nombre: r.huesped?.nombre, numero: hab[r.habitacion_id] })));
  };

  const cargarA = async (h) => {
    if (!window.confirm(`¿Cargar ${money(totalPendienteCobro(comanda))} a la habitación ${h.numero} (${h.nombre})?`)) return;
    try {
      await restaurantService.cargarAHabitacion(comanda.id, h.id, dividiendo && seleccion.length ? seleccion : null);
      setHuespedes(null);
    } catch (err) {
      alert(err.message);
    }
  };

  // La carta: todo lo vendible que no sea insumo de cocina
  const carta = useMemo(() => productos.filter(p => !p.es_insumo && p.activo !== false), [productos]);
  const categorias = useMemo(() => ['Todas', ...new Set(carta.map(p => p.categoria).filter(Boolean))], [carta]);
  const filtrados = carta.filter(p =>
    (categoria === 'Todas' || p.categoria === categoria) &&
    p.nombre.toLowerCase().includes(busqueda.toLowerCase())
  );

  const items = comanda.items || [];
  const pendientesEnvio = items.filter(it => it.estado === 'PENDIENTE').length;
  const cobrables = items.filter(it => itemActivo(it) && !it.pagado);
  const cerrada = comanda.estado === 'PAGADA' || comanda.estado === 'ANULADA';

  const agregar = async (prod) => {
    const disp = restaurantService.porcionesDisponibles(prod, productosById);
    if (disp === 0) {
      alert(`"${prod.nombre}" está agotado: faltan insumos de su receta.`);
      return;
    }
    await restaurantService.agregarItem(comanda.id, prod, 1, nota.trim());
    setNota('');
  };

  const cambiarCantidad = (it, delta) =>
    restaurantService.actualizarItem(comanda.id, it.id, { cantidad: Math.max(0, it.cantidad + delta) });

  const editarNota = (it) => {
    const nueva = window.prompt('Nota para cocina (ej. sin cebolla, término medio):', it.nota || '');
    if (nueva !== null) restaurantService.actualizarItem(comanda.id, it.id, { nota: nueva.trim() });
  };

  const anular = (it) => {
    if (it.estado === 'PENDIENTE') {
      restaurantService.anularItem(comanda.id, it.id);
      return;
    }
    const motivo = window.prompt(`Motivo para anular "${it.nombre}" (ya fue enviado a cocina):`);
    if (motivo) restaurantService.anularItem(comanda.id, it.id, motivo);
  };

  const anularComanda = () => {
    const motivo = window.prompt('Motivo para anular toda la comanda:');
    if (motivo) {
      restaurantService.anularComanda(comanda.id, motivo).then(onBack);
    }
  };

  const imprimirPrecuenta = () => {
    const filas = cobrables
      .map(it => `<tr><td>${it.cantidad} x ${it.nombre}</td><td style="text-align:right">${(it.precio * it.cantidad).toFixed(2)}</td></tr>`)
      .join('');
    const w = window.open('', '_blank', 'width=360,height=640');
    if (!w) return;
    w.document.write(`<html><head><title>Pre-cuenta #${comanda.numero}</title>
      <style>body{font-family:monospace;font-size:12px;padding:8px}table{width:100%}h3,p{text-align:center;margin:4px 0}</style></head>
      <body><h3>${empresa?.nombre || 'GLORYCHEF'}</h3><p>PRE-CUENTA (no válida como factura)</p>
      <p>Comanda #${comanda.numero} ${comanda.mesa_numero ? '· Mesa ' + comanda.mesa_numero : '· ' + TIPOS_PEDIDO[comanda.tipo]}</p>
      <p>Mozo: ${comanda.mozo || '-'} · Comensales: ${comanda.comensales || 1}</p><hr/>
      <table>${filas}</table><hr/>
      <table><tr><td><b>TOTAL</b></td><td style="text-align:right"><b>${simbolo()} ${totalPendienteCobro(comanda).toFixed(2)}</b></td></tr>
      <tr><td>Por persona (${comanda.comensales || 1})</td><td style="text-align:right">${simbolo()} ${(totalPendienteCobro(comanda) / (comanda.comensales || 1)).toFixed(2)}</td></tr></table>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const toggleSeleccion = (id) =>
    setSeleccion(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));

  const cobrarSeleccion = () => {
    if (seleccion.length === 0) return;
    onCobrar(comanda, seleccion);
    setDividiendo(false);
    setSeleccion([]);
  };

  const mesasLibres = mesas.filter(m => !m.comanda_id && m.id !== comanda.mesa_id);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      {/* Carta */}
      <section className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center gap-2">
          <button type="button" onClick={onBack} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700">
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={busqueda}
              onChange={e => setBusqueda(e.target.value)}
              placeholder="Buscar plato o bebida..."
              className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm"
            />
          </div>
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
          {categorias.map(c => (
            <button
              key={c}
              type="button"
              onClick={() => setCategoria(c)}
              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold whitespace-nowrap ${
                categoria === c ? 'bg-orange-600 text-white' : 'bg-slate-100 text-slate-600'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <StickyNote className="w-4 h-4 text-slate-400" />
          <input
            value={nota}
            onChange={e => setNota(e.target.value)}
            placeholder="Nota para el próximo plato (opcional): sin ají, bien cocido..."
            className="flex-1 px-3 py-1.5 rounded-xl border border-slate-200 text-xs"
          />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[60dvh] overflow-y-auto pr-1">
          {filtrados.map(p => {
            const disp = restaurantService.porcionesDisponibles(p, productosById);
            const agotado = disp === 0;
            return (
              <button
                key={p.id}
                type="button"
                disabled={cerrada}
                onClick={() => agregar(p)}
                className={`text-left rounded-2xl border p-2.5 transition ${
                  agotado ? 'border-rose-200 bg-rose-50/50 opacity-70' : 'border-slate-200 hover:border-orange-300 hover:shadow-sm'
                }`}
              >
                {p.foto_url && <img src={p.foto_url} alt="" className="w-full h-20 object-cover rounded-xl mb-1.5" />}
                <p className="text-xs font-bold text-slate-800 leading-tight line-clamp-2">{p.nombre}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-black text-emerald-700">{money(p.precio_venta)}</span>
                  {disp !== null && (
                    <span className={`text-[9px] font-bold px-1.5 rounded ${agotado ? 'bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-500'}`}>
                      {agotado ? 'Agotado' : `${disp} porc.`}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
          {filtrados.length === 0 && (
            <p className="col-span-full text-center text-xs text-slate-400 py-6">No hay productos en la carta con ese filtro.</p>
          )}
        </div>
      </section>

      {/* Comanda */}
      <section className="lg:col-span-2 bg-white rounded-3xl border border-slate-200 p-4 flex flex-col gap-3">
        <div>
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black text-slate-900">
              Comanda #{comanda.numero} · {comanda.mesa_numero ? `Mesa ${comanda.mesa_numero}` : TIPOS_PEDIDO[comanda.tipo]}
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">{comanda.estado}</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {comanda.mozo ? `Mozo: ${comanda.mozo} · ` : ''}
            {comanda.cliente_nombre ? `${comanda.cliente_nombre} · ` : ''}
            {comanda.comensales} pers. · {formatMinutos(minutosDesde(comanda.fecha_apertura))}
          </p>
          {comanda.direccion && <p className="text-[11px] text-slate-500">Entrega: {comanda.direccion} {comanda.telefono ? `· ${comanda.telefono}` : ''}</p>}
        </div>

        <div className="flex-1 space-y-1.5 max-h-[45dvh] overflow-y-auto pr-1">
          {items.length === 0 && <p className="text-xs text-slate-400 text-center py-8">Agrega platos desde la carta.</p>}
          {items.map(it => (
            <div key={it.id} className={`rounded-2xl border p-2.5 ${it.pagado ? 'opacity-50' : ''}`}>
              <div className="flex items-start gap-2">
                {dividiendo && itemActivo(it) && !it.pagado && (
                  <input type="checkbox" checked={seleccion.includes(it.id)} onChange={() => toggleSeleccion(it.id)} className="mt-1" />
                )}
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold text-slate-800 ${it.estado === 'ANULADO' ? 'line-through' : ''}`}>
                    {it.cantidad} x {it.nombre}
                  </p>
                  {it.nota && <p className="text-[10px] text-orange-700 italic">“{it.nota}”</p>}
                  {it.anulado_motivo && <p className="text-[10px] text-rose-600">Anulado: {it.anulado_motivo}</p>}
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border ${ESTADO_COLOR[it.estado]}`}>
                      {ITEM_ESTADOS[it.estado]}
                    </span>
                    {it.pagado && <span className="text-[9px] font-bold text-emerald-700">Pagado</span>}
                  </div>
                </div>
                <span className="text-xs font-black text-slate-800">{money(it.precio * it.cantidad)}</span>
              </div>
              {!cerrada && !it.pagado && it.estado !== 'ANULADO' && (
                <div className="flex items-center gap-1 mt-1.5">
                  {it.estado === 'PENDIENTE' && (
                    <>
                      <button type="button" onClick={() => cambiarCantidad(it, -1)} className="p-1 rounded-lg bg-slate-100"><Minus className="w-3 h-3" /></button>
                      <button type="button" onClick={() => cambiarCantidad(it, 1)} className="p-1 rounded-lg bg-slate-100"><Plus className="w-3 h-3" /></button>
                      <button type="button" onClick={() => editarNota(it)} className="p-1 rounded-lg bg-slate-100" title="Nota"><StickyNote className="w-3 h-3" /></button>
                    </>
                  )}
                  {it.estado === 'LISTO' && (
                    <button
                      type="button"
                      onClick={() => restaurantService.setEstadoItemCocina(comanda.id, it.id, 'ENTREGADO')}
                      className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold flex items-center gap-1"
                    >
                      <CheckCheck className="w-3 h-3" /> Servido
                    </button>
                  )}
                  <button type="button" onClick={() => anular(it)} className="ml-auto p-1 rounded-lg text-rose-500 hover:bg-rose-50" title="Quitar / anular">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="border-t border-slate-100 pt-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500"><span>Total consumo</span><span>{money(totalComanda(comanda))}</span></div>
          <div className="flex justify-between font-black text-base text-slate-900"><span>Por cobrar</span><span>{money(totalPendienteCobro(comanda))}</span></div>
        </div>

        {!cerrada && (
          <div className="grid grid-cols-2 gap-2 text-[11px] font-bold">
            <button
              type="button"
              disabled={pendientesEnvio === 0}
              onClick={() => restaurantService.enviarACocina(comanda.id)}
              className="col-span-2 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-40 text-white flex items-center justify-center gap-1.5"
            >
              <Send className="w-4 h-4" /> Enviar a cocina {pendientesEnvio > 0 ? `(${pendientesEnvio})` : ''}
            </button>
            <button type="button" onClick={imprimirPrecuenta} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
              <Printer className="w-3.5 h-3.5" /> Pre-cuenta
            </button>
            {comanda.tipo === 'MESA' && comanda.estado !== 'CUENTA' ? (
              <button type="button" onClick={() => restaurantService.pedirCuenta(comanda.id)} className="py-2 rounded-xl border border-rose-200 text-rose-700 flex items-center justify-center gap-1">
                <Receipt className="w-3.5 h-3.5" /> Pidió la cuenta
              </button>
            ) : (
              <button type="button" onClick={() => setCambiandoMesa(v => !v)} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5" /> {comanda.mesa_id ? 'Cambiar mesa' : 'Asignar mesa'}
              </button>
            )}
            {comanda.tipo === 'MESA' && comanda.estado !== 'CUENTA' && (
              <button type="button" onClick={() => setCambiandoMesa(v => !v)} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
                <ArrowRightLeft className="w-3.5 h-3.5" /> Cambiar mesa
              </button>
            )}
            <button
              type="button"
              onClick={() => { setDividiendo(v => !v); setSeleccion([]); }}
              className={`py-2 rounded-xl border flex items-center justify-center gap-1 ${dividiendo ? 'border-orange-400 bg-orange-50 text-orange-800' : 'border-slate-200'}`}
            >
              <Scissors className="w-3.5 h-3.5" /> Dividir cuenta
            </button>
            {dividiendo ? (
              <button
                type="button"
                disabled={seleccion.length === 0}
                onClick={cobrarSeleccion}
                className="col-span-2 py-2.5 rounded-xl bg-emerald-600 disabled:opacity-40 text-white flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Cobrar platos seleccionados ({seleccion.length})
              </button>
            ) : (
              <button
                type="button"
                disabled={cobrables.length === 0}
                onClick={() => onCobrar(comanda)}
                className="col-span-2 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white flex items-center justify-center gap-1.5"
              >
                <CreditCard className="w-4 h-4" /> Cobrar {money(totalPendienteCobro(comanda))}
              </button>
            )}
            {hotelActivo && (
              <button
                type="button"
                disabled={cobrables.length === 0}
                onClick={abrirCargoHabitacion}
                className="col-span-2 py-2 rounded-xl border border-sky-200 text-sky-800 bg-sky-50 hover:bg-sky-100 disabled:opacity-40 flex items-center justify-center gap-1.5"
              >
                <BedDouble className="w-4 h-4" /> Cargar a habitación
              </button>
            )}
            {huespedes && (
              <div className="col-span-2 border border-sky-200 rounded-2xl p-2 space-y-1">
                {huespedes.length === 0 && <p className="text-[11px] text-slate-400 font-normal">No hay huéspedes en casa.</p>}
                {huespedes.map(h => (
                  <button key={h.id} type="button" onClick={() => cargarA(h)} className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-sky-50 text-[11px]">
                    Hab. {h.numero} · {h.nombre}
                  </button>
                ))}
              </div>
            )}
            <button type="button" onClick={anularComanda} className="col-span-2 py-1.5 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
              <Ban className="w-3.5 h-3.5" /> Anular comanda
            </button>
          </div>
        )}

        {cambiandoMesa && (
          <div className="border border-slate-200 rounded-2xl p-2.5">
            <p className="text-[11px] font-bold text-slate-600 mb-1.5">Mover a una mesa libre:</p>
            <div className="flex flex-wrap gap-1.5">
              {mesasLibres.length === 0 && <span className="text-[11px] text-slate-400">No hay mesas libres.</span>}
              {mesasLibres.map(m => (
                <button
                  key={m.id}
                  type="button"
                  onClick={async () => {
                    try {
                      await restaurantService.cambiarMesa(comanda.id, m.id);
                      setCambiandoMesa(false);
                    } catch (err) {
                      alert(err.message);
                    }
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-orange-100 text-[11px] font-bold"
                >
                  Mesa {m.numero}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
