import React, { useEffect, useRef, useState } from 'react';
import { Flame, CheckCircle2, Clock, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { restaurantService, ESTACIONES, TIPOS_PEDIDO } from '../../services/restaurantService';
import { playCashChime } from '../../utils/audio';
import { minutosDesde } from './useGlorychefData';

const EN_COCINA = ['ENVIADO', 'PREPARANDO'];

function colorPorTiempo(min) {
  if (min >= 20) return 'border-rose-400 bg-rose-50';
  if (min >= 10) return 'border-amber-400 bg-amber-50';
  return 'border-emerald-300 bg-white';
}

// Pantalla de cocina (KDS): cada estación ve solo sus platos
export default function CocinaKDS({ data }) {
  const [estacion, setEstacion] = useState('TODAS');
  const [sonido, setSonido] = useState(true);
  const conocidos = useRef(null);
  const contenedor = useRef(null);

  const deEstacion = (it) => estacion === 'TODAS' || (it.estacion || 'COCINA') === estacion;

  const tickets = data.comandas
    .map(c => ({ comanda: c, items: (c.items || []).filter(it => EN_COCINA.includes(it.estado) && deEstacion(it)) }))
    .filter(t => t.items.length > 0)
    .sort((a, b) => new Date(a.comanda.ultima_ronda_at || a.comanda.fecha_apertura) - new Date(b.comanda.ultima_ronda_at || b.comanda.fecha_apertura));

  const listos = data.comandas
    .flatMap(c => (c.items || []).filter(it => it.estado === 'LISTO' && deEstacion(it)).map(it => ({ c, it })));

  // Aviso sonoro cuando llega un plato nuevo a la cocina
  useEffect(() => {
    const ids = new Set(data.comandas.flatMap(c => (c.items || []).filter(it => it.estado === 'ENVIADO').map(it => it.id)));
    if (conocidos.current && sonido) {
      const hayNuevos = [...ids].some(id => !conocidos.current.has(id));
      if (hayNuevos) playCashChime();
    }
    conocidos.current = ids;
  }, [data.comandas, sonido]);

  const avanzar = (comandaId, it) => {
    const siguiente = it.estado === 'ENVIADO' ? 'PREPARANDO' : 'LISTO';
    restaurantService.setEstadoItemCocina(comandaId, it.id, siguiente);
  };

  const todoListo = async (t) => {
    for (const it of t.items) {
      await restaurantService.setEstadoItemCocina(t.comanda.id, it.id, 'LISTO');
    }
  };

  const pantallaCompleta = () => contenedor.current?.requestFullscreen?.();

  return (
    <div ref={contenedor} className="space-y-4 bg-slate-50 p-1 rounded-3xl overflow-y-auto">
      <div className="flex flex-wrap items-center gap-2">
        {[{ id: 'TODAS', label: 'Todas' }, ...ESTACIONES].map(e => (
          <button
            key={e.id}
            type="button"
            onClick={() => setEstacion(e.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold border ${
              estacion === e.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200'
            }`}
          >
            {e.label}
          </button>
        ))}
        <div className="ml-auto flex gap-2">
          <button type="button" onClick={() => setSonido(s => !s)} className="p-2 rounded-xl bg-white border border-slate-200" title="Sonido">
            {sonido ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
          </button>
          <button type="button" onClick={pantallaCompleta} className="p-2 rounded-xl bg-white border border-slate-200" title="Pantalla completa">
            <Maximize2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-4 gap-4">
        <div className="xl:col-span-3">
          <h3 className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <Flame className="w-4 h-4 text-orange-500" /> En preparación ({tickets.length})
          </h3>
          {tickets.length === 0 && (
            <div className="bg-white rounded-3xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-400">
              Sin pedidos pendientes en cocina.
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tickets.map(t => {
              const min = minutosDesde(t.items[0]?.enviado_at || t.comanda.fecha_apertura);
              return (
                <div key={t.comanda.id} className={`rounded-2xl border-2 p-3 space-y-2 ${colorPorTiempo(min)}`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-black text-slate-900">
                        {t.comanda.mesa_numero ? `Mesa ${t.comanda.mesa_numero}` : TIPOS_PEDIDO[t.comanda.tipo]}
                      </p>
                      <p className="text-[10px] text-slate-500">#{t.comanda.numero} · {t.comanda.mozo || t.comanda.cliente_nombre || ''}</p>
                    </div>
                    <span className="text-[11px] font-black flex items-center gap-1 text-slate-700">
                      <Clock className="w-3.5 h-3.5" /> {min} min
                    </span>
                  </div>
                  <ul className="space-y-1">
                    {t.items.map(it => (
                      <li key={it.id}>
                        <button
                          type="button"
                          onClick={() => avanzar(t.comanda.id, it)}
                          className={`w-full text-left rounded-xl px-2 py-1.5 border text-xs ${
                            it.estado === 'PREPARANDO' ? 'bg-amber-100 border-amber-300' : 'bg-white border-slate-200'
                          }`}
                        >
                          <span className="font-black">{it.cantidad}x</span> {it.nombre}
                          {it.nota && <span className="block text-[10px] text-orange-700 italic">“{it.nota}”</span>}
                          <span className="block text-[9px] font-bold text-slate-500 mt-0.5">
                            {it.estado === 'ENVIADO' ? 'Toca para empezar' : 'Preparando · toca cuando esté listo'}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                  <button
                    type="button"
                    onClick={() => todoListo(t)}
                    className="w-full py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" /> Todo listo
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <h3 className="text-xs font-black text-slate-500 uppercase mb-2 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Listos para servir ({listos.length})
          </h3>
          <div className="space-y-1.5">
            {listos.length === 0 && <p className="text-xs text-slate-400">Nada pendiente de recoger.</p>}
            {listos.map(({ c, it }) => (
              <div key={it.id} className="bg-white border border-emerald-200 rounded-xl p-2 flex items-center gap-2">
                <div className="flex-1 text-xs">
                  <p className="font-bold text-slate-800">{it.cantidad}x {it.nombre}</p>
                  <p className="text-[10px] text-slate-500">{c.mesa_numero ? `Mesa ${c.mesa_numero}` : TIPOS_PEDIDO[c.tipo]} · #{c.numero}</p>
                </div>
                <button
                  type="button"
                  onClick={() => restaurantService.setEstadoItemCocina(c.id, it.id, 'ENTREGADO')}
                  className="px-2 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold"
                >
                  Entregado
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
