import React, { useEffect, useMemo, useState } from 'react';
import { db } from '../../db/dexie';
import { TIPOS_PEDIDO, itemActivo, onGlorychefChange } from '../../services/restaurantService';
import { money } from './useGlorychefData';

const RANGOS = [
  { id: 1, label: 'Hoy' },
  { id: 7, label: '7 días' },
  { id: 30, label: '30 días' },
];

function Tabla({ titulo, columnas, filas, vacio }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4">
      <h3 className="text-xs font-black text-slate-500 uppercase mb-2">{titulo}</h3>
      {filas.length === 0 ? (
        <p className="text-xs text-slate-400 py-3">{vacio}</p>
      ) : (
        <table className="w-full text-xs">
          <thead>
            <tr className="text-[10px] text-slate-400 uppercase">
              {columnas.map((c, i) => <th key={c} className={`py-1 ${i === 0 ? 'text-left' : 'text-right'}`}>{c}</th>)}
            </tr>
          </thead>
          <tbody>
            {filas.map((f, idx) => (
              <tr key={idx} className="border-t border-slate-100">
                {f.map((v, i) => <td key={i} className={`py-1.5 ${i === 0 ? 'font-bold text-slate-800' : 'text-right'}`}>{v}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default function ReportesChefTab() {
  const [dias, setDias] = useState(1);
  const [comandas, setComandas] = useState([]);
  const [productos, setProductos] = useState([]);

  useEffect(() => {
    const load = async () => {
      setComandas(await db.comandas.toArray());
      setProductos(await db.productos_tienda.toArray());
    };
    load();
    return onGlorychefChange(load);
  }, []);

  const r = useMemo(() => {
    const desde = new Date();
    desde.setHours(0, 0, 0, 0);
    desde.setDate(desde.getDate() - (dias - 1));
    const enRango = comandas.filter(c => new Date(c.fecha_apertura) >= desde);
    const pagadas = enRango.filter(c => c.estado === 'PAGADA');
    const byId = Object.fromEntries(productos.map(p => [p.id, p]));

    const total = pagadas.reduce((acc, c) => acc + c.items.filter(itemActivo).reduce((s, it) => s + it.precio * it.cantidad, 0), 0);

    const platos = {};
    const mozos = {};
    const tipos = {};
    const insumos = {};
    const tiempos = [];
    let anulados = 0;
    let montoAnulado = 0;

    for (const c of enRango) {
      for (const it of c.items || []) {
        if (it.estado === 'ANULADO') {
          anulados += it.cantidad;
          montoAnulado += it.precio * it.cantidad;
          continue;
        }
        if (it.enviado_at && it.listo_at) {
          tiempos.push((new Date(it.listo_at) - new Date(it.enviado_at)) / 60000);
        }
        if (c.estado !== 'PAGADA') continue;
        const sub = it.precio * it.cantidad;
        platos[it.nombre] = platos[it.nombre] || { cant: 0, total: 0 };
        platos[it.nombre].cant += it.cantidad;
        platos[it.nombre].total += sub;
        const mozo = c.mozo || 'Sin asignar';
        mozos[mozo] = mozos[mozo] || { comandas: new Set(), total: 0 };
        mozos[mozo].comandas.add(c.id);
        mozos[mozo].total += sub;
        tipos[c.tipo] = (tipos[c.tipo] || 0) + sub;
        const prod = byId[it.producto_id];
        const merma = 1 + (Number(prod?.merma_pct) || 0) / 100;
        for (const rec of prod?.receta || []) {
          const ins = byId[rec.insumo_id];
          if (!ins) continue;
          insumos[ins.nombre] = insumos[ins.nombre] || { cant: 0, costo: 0, unidad: ins.unidad_medida || '' };
          const q = rec.cantidad * it.cantidad * merma;
          insumos[ins.nombre].cant += q;
          insumos[ins.nombre].costo += q * (Number(ins.precio_compra) || 0);
        }
      }
    }

    return {
      total,
      nComandas: pagadas.length,
      ticket: pagadas.length ? total / pagadas.length : 0,
      tiempoCocina: tiempos.length ? tiempos.reduce((a, b) => a + b, 0) / tiempos.length : null,
      anulados,
      montoAnulado,
      platos: Object.entries(platos).sort((a, b) => b[1].cant - a[1].cant).slice(0, 15),
      mozos: Object.entries(mozos).sort((a, b) => b[1].total - a[1].total),
      tipos: Object.entries(tipos),
      insumos: Object.entries(insumos).sort((a, b) => b[1].costo - a[1].costo),
    };
  }, [comandas, productos, dias]);

  const kpis = [
    { label: 'Ventas GLORYCHEF', value: money(r.total) },
    { label: 'Comandas cobradas', value: r.nComandas },
    { label: 'Ticket promedio', value: money(r.ticket) },
    { label: 'Tiempo prom. cocina', value: r.tiempoCocina === null ? '—' : `${r.tiempoCocina.toFixed(1)} min` },
    { label: 'Platos anulados', value: `${r.anulados} (${money(r.montoAnulado)})` },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {RANGOS.map(x => (
          <button key={x.id} type="button" onClick={() => setDias(x.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${dias === x.id ? 'bg-orange-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            {x.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{k.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tabla
          titulo="Platos más vendidos"
          columnas={['Plato', 'Cant.', 'Total']}
          filas={r.platos.map(([n, v]) => [n, v.cant, money(v.total)])}
          vacio="Sin ventas en el periodo."
        />
        <Tabla
          titulo="Ventas por mozo"
          columnas={['Mozo', 'Comandas', 'Total']}
          filas={r.mozos.map(([n, v]) => [n, v.comandas.size, money(v.total)])}
          vacio="Sin ventas en el periodo."
        />
        <Tabla
          titulo="Ventas por tipo de pedido"
          columnas={['Tipo', 'Total']}
          filas={r.tipos.map(([t, v]) => [TIPOS_PEDIDO[t] || t, money(v)])}
          vacio="Sin ventas en el periodo."
        />
        <Tabla
          titulo="Consumo teórico de insumos (según recetas)"
          columnas={['Insumo', 'Cantidad', 'Costo']}
          filas={r.insumos.map(([n, v]) => [n, `${v.cant.toFixed(2)} ${v.unidad}`, money(v.costo)])}
          vacio="Sin platos con receta vendidos en el periodo."
        />
      </div>
    </div>
  );
}
