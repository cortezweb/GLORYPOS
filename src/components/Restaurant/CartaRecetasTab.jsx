import React, { useMemo, useState } from 'react';
import { BookOpen, Package, AlertTriangle, Plus, Trash2, Save, X } from 'lucide-react';
import { db } from '../../db/dexie';
import { restaurantService, ESTACIONES } from '../../services/restaurantService';
import { money } from './useGlorychefData';

// Carta (platos) y recetas: cada plato consume insumos del inventario al cobrarse
export default function CartaRecetasTab({ data }) {
  const { productos, productosById, reload } = data;
  const [vista, setVista] = useState('platos');
  const [editando, setEditando] = useState(null);

  const platos = useMemo(() => productos.filter(p => !p.es_insumo), [productos]);
  const insumos = useMemo(() => productos.filter(p => p.es_insumo), [productos]);
  const insumosBajos = insumos.filter(i => (Number(i.stock_actual) || 0) <= (Number(i.stock_minimo) || 0));

  const guardarProducto = async (id, changes) => {
    await db.productos_tienda.update(id, changes);
    await reload();
  };

  const abrirEditor = (p) => setEditando({
    id: p.id,
    nombre: p.nombre,
    estacion: p.estacion || 'COCINA',
    merma_pct: p.merma_pct || 0,
    receta: (p.receta || []).map(r => ({ ...r })),
  });

  const guardarReceta = async () => {
    const receta = editando.receta
      .filter(r => r.insumo_id && Number(r.cantidad) > 0)
      .map(r => ({ insumo_id: r.insumo_id, cantidad: Number(r.cantidad) }));
    await guardarProducto(editando.id, {
      es_plato: true,
      estacion: editando.estacion,
      merma_pct: Number(editando.merma_pct) || 0,
      receta,
    });
    setEditando(null);
  };

  const previewCosto = editando
    ? restaurantService.costoPlato({ receta: editando.receta, merma_pct: editando.merma_pct }, productosById)
    : 0;

  return (
    <div className="space-y-4">
      {insumosBajos.length > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 text-xs text-rose-800 flex gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>
            <b>Insumos bajo mínimo:</b> {insumosBajos.map(i => `${i.nombre} (${i.stock_actual} ${i.unidad_medida || ''})`).join(', ')}
          </span>
        </div>
      )}

      <div className="flex gap-2 text-xs font-bold">
        <button type="button" onClick={() => setVista('platos')} className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${vista === 'platos' ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <BookOpen className="w-4 h-4" /> Carta ({platos.length})
        </button>
        <button type="button" onClick={() => setVista('insumos')} className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 ${vista === 'insumos' ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
          <Package className="w-4 h-4" /> Insumos ({insumos.length})
        </button>
      </div>

      {vista === 'platos' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
              <tr>
                <th className="text-left px-3 py-2">Plato / producto</th>
                <th className="text-left px-3 py-2">Estación</th>
                <th className="text-right px-3 py-2">Precio</th>
                <th className="text-right px-3 py-2">Costo</th>
                <th className="text-right px-3 py-2">Margen</th>
                <th className="text-right px-3 py-2">Porciones</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {platos.map(p => {
                const costo = restaurantService.costoPlato(p, productosById);
                const precio = Number(p.precio_venta) || 0;
                const margen = precio > 0 ? ((precio - costo) / precio) * 100 : 0;
                const porciones = restaurantService.porcionesDisponibles(p, productosById);
                const tieneReceta = Array.isArray(p.receta) && p.receta.length > 0;
                return (
                  <tr key={p.id} className="border-t border-slate-100">
                    <td className="px-3 py-2">
                      <p className="font-bold text-slate-800">{p.nombre}</p>
                      <p className="text-[10px] text-slate-400">
                        {p.categoria} · {tieneReceta ? `${p.receta.length} insumos` : 'Sin receta (descuenta su propio stock)'}
                      </p>
                    </td>
                    <td className="px-3 py-2">{ESTACIONES.find(e => e.id === (p.estacion || 'COCINA'))?.label}</td>
                    <td className="px-3 py-2 text-right font-bold">{money(precio)}</td>
                    <td className="px-3 py-2 text-right">{money(costo)}</td>
                    <td className={`px-3 py-2 text-right font-bold ${margen < 30 ? 'text-rose-600' : 'text-emerald-700'}`}>{margen.toFixed(0)}%</td>
                    <td className="px-3 py-2 text-right">
                      {porciones === null ? (p.stock_actual ?? '—') : (
                        <span className={porciones === 0 ? 'text-rose-600 font-bold' : ''}>{porciones === 0 ? 'Agotado' : porciones}</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right whitespace-nowrap">
                      <button type="button" onClick={() => abrirEditor(p)} className="px-2 py-1 rounded-lg bg-orange-50 text-orange-700 font-bold mr-1">
                        Receta
                      </button>
                      <button type="button" onClick={() => guardarProducto(p.id, { es_insumo: true, es_plato: false })} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold" title="Mover a insumos (no se vende en la carta)">
                        Es insumo
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {vista === 'insumos' && (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase">
              <tr>
                <th className="text-left px-3 py-2">Insumo</th>
                <th className="text-right px-3 py-2">Stock</th>
                <th className="text-right px-3 py-2">Mínimo</th>
                <th className="text-right px-3 py-2">Costo unit.</th>
                <th className="text-right px-3 py-2">Usado en</th>
                <th className="px-3 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {insumos.map(i => {
                const usadoEn = platos.filter(p => (p.receta || []).some(r => r.insumo_id === i.id)).length;
                const bajo = (Number(i.stock_actual) || 0) <= (Number(i.stock_minimo) || 0);
                return (
                  <tr key={i.id} className="border-t border-slate-100">
                    <td className="px-3 py-2 font-bold text-slate-800">{i.nombre}</td>
                    <td className={`px-3 py-2 text-right font-bold ${bajo ? 'text-rose-600' : ''}`}>{i.stock_actual} {i.unidad_medida}</td>
                    <td className="px-3 py-2 text-right">{i.stock_minimo ?? 0}</td>
                    <td className="px-3 py-2 text-right">{money(i.precio_compra)}</td>
                    <td className="px-3 py-2 text-right">{usadoEn} plato(s)</td>
                    <td className="px-3 py-2 text-right">
                      <button type="button" onClick={() => guardarProducto(i.id, { es_insumo: false })} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-600 font-bold">
                        Vender en carta
                      </button>
                    </td>
                  </tr>
                );
              })}
              {insumos.length === 0 && (
                <tr><td colSpan="6" className="px-3 py-6 text-center text-slate-400">
                  Aún no hay insumos. Crea productos en Productos y márcalos aquí como insumo (botón “Es insumo” en la carta).
                </td></tr>
              )}
            </tbody>
          </table>
          <p className="px-3 py-2 text-[10px] text-slate-400 border-t border-slate-100">
            El stock de insumos se repone con Compras o ajustes de Inventario; cada venta de un plato descuenta su receta y queda en el Kardex.
          </p>
        </div>
      )}

      {editando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 overflow-y-auto [&>*]:my-auto">
          <div className="fixed inset-0 bg-slate-900/60" onClick={() => setEditando(null)} />
          <div className="relative z-10 w-full max-w-lg bg-white rounded-3xl p-5 space-y-3 shadow-2xl max-h-[90dvh] overflow-y-auto">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-slate-900">Receta · {editando.nombre}</h3>
              <button type="button" onClick={() => setEditando(null)} className="p-1 text-slate-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-[11px] font-bold text-slate-600">
                Estación de cocina
                <select value={editando.estacion} onChange={e => setEditando(s => ({ ...s, estacion: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs">
                  {ESTACIONES.map(e => <option key={e.id} value={e.id}>{e.label}</option>)}
                </select>
              </label>
              <label className="text-[11px] font-bold text-slate-600">
                Merma (%)
                <input type="number" min="0" step="0.5" value={editando.merma_pct} onChange={e => setEditando(s => ({ ...s, merma_pct: e.target.value }))} className="mt-1 w-full border border-slate-200 rounded-xl px-2 py-1.5 text-xs" />
              </label>
            </div>

            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-slate-600">Insumos por porción</p>
              {editando.receta.map((r, idx) => {
                const ins = productosById[r.insumo_id];
                return (
                  <div key={idx} className="flex items-center gap-1.5">
                    <select
                      value={r.insumo_id}
                      onChange={e => setEditando(s => ({ ...s, receta: s.receta.map((x, i) => (i === idx ? { ...x, insumo_id: e.target.value } : x)) }))}
                      className="flex-1 border border-slate-200 rounded-xl px-2 py-1.5 text-xs"
                    >
                      <option value="">Elegir insumo...</option>
                      {insumos.map(i => <option key={i.id} value={i.id}>{i.nombre}</option>)}
                    </select>
                    <input
                      type="number"
                      min="0"
                      step="0.001"
                      value={r.cantidad}
                      onChange={e => setEditando(s => ({ ...s, receta: s.receta.map((x, i) => (i === idx ? { ...x, cantidad: e.target.value } : x)) }))}
                      className="w-20 border border-slate-200 rounded-xl px-2 py-1.5 text-xs text-right"
                    />
                    <span className="text-[10px] text-slate-400 w-14 truncate">{ins?.unidad_medida || ''}</span>
                    <button type="button" onClick={() => setEditando(s => ({ ...s, receta: s.receta.filter((_, i) => i !== idx) }))} className="p-1 text-rose-500">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}
              <button
                type="button"
                onClick={() => setEditando(s => ({ ...s, receta: [...s.receta, { insumo_id: '', cantidad: 0 }] }))}
                className="text-[11px] font-bold text-orange-700 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" /> Agregar insumo
              </button>
              {insumos.length === 0 && (
                <p className="text-[10px] text-slate-400">Primero marca productos como insumo en la carta.</p>
              )}
            </div>

            <div className="flex items-center justify-between bg-slate-50 rounded-xl px-3 py-2 text-xs">
              <span className="text-slate-500">Costo por porción (con merma)</span>
              <span className="font-black text-slate-900">{money(previewCosto)}</span>
            </div>

            <button type="button" onClick={guardarReceta} className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center justify-center gap-1.5">
              <Save className="w-4 h-4" /> Guardar receta
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
