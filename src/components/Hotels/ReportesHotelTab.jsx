import React, { useMemo, useState } from 'react';
import { hoyISO, addDias, noches } from '../../services/hotelService';
import { money } from './useHotelData';

const RANGOS = [
  { id: 7, label: '7 días' },
  { id: 30, label: '30 días' },
  { id: 90, label: '90 días' },
];

function Tabla({ titulo, columnas, filas }) {
  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-4">
      <h3 className="text-xs font-black text-slate-500 uppercase mb-2">{titulo}</h3>
      {filas.length === 0 ? <p className="text-xs text-slate-400 py-3">Sin datos en el periodo.</p> : (
        <table className="w-full text-xs">
          <thead><tr className="text-[10px] text-slate-400 uppercase">{columnas.map((c, i) => <th key={c} className={`py-1 ${i ? 'text-right' : 'text-left'}`}>{c}</th>)}</tr></thead>
          <tbody>{filas.map((f, i) => <tr key={i} className="border-t border-slate-100">{f.map((v, j) => <td key={j} className={`py-1.5 ${j ? 'text-right' : 'font-bold text-slate-800'}`}>{v}</td>)}</tr>)}</tbody>
        </table>
      )}
    </div>
  );
}

// Indicadores hoteleros: ocupación, ADR, RevPAR, canales y tipos de habitación
export default function ReportesHotelTab({ data }) {
  const { reservas, habitaciones, tiposById, habById } = data;
  const [dias, setDias] = useState(30);

  const r = useMemo(() => {
    const hasta = addDias(hoyISO(), 1);
    const desde = addDias(hasta, -dias);
    const vendibles = habitaciones.filter(h => h.limpieza !== 'MANTENIMIENTO').length || 1;
    const disponibles = vendibles * dias;

    let nochesVendidas = 0;
    let ingresosAloj = 0;
    let consumos = 0;
    const canales = {};
    const tipos = {};
    for (const x of reservas) {
      if (!['EN_CASA', 'FINALIZADA'].includes(x.estado)) continue;
      const ini = x.llegada > desde ? x.llegada : desde;
      const fin = (x.salida_real || x.salida) < hasta ? (x.salida_real || x.salida) : hasta;
      if (!(ini < fin)) continue;
      const n = noches(ini, fin);
      const ing = n * (Number(x.tarifa) || 0);
      nochesVendidas += n;
      ingresosAloj += ing;
      consumos += (x.consumos || []).filter(c => !c.anulado && c.fecha.slice(0, 10) >= desde).reduce((a, c) => a + c.precio * c.cantidad, 0);
      canales[x.canal || 'Directo'] = canales[x.canal || 'Directo'] || { n: 0, ing: 0, reservas: 0 };
      canales[x.canal || 'Directo'].n += n;
      canales[x.canal || 'Directo'].ing += ing;
      canales[x.canal || 'Directo'].reservas += 1;
      const tipo = tiposById[habById[x.habitacion_id]?.tipo_id]?.nombre || 'Sin tipo';
      tipos[tipo] = tipos[tipo] || { n: 0, ing: 0 };
      tipos[tipo].n += n;
      tipos[tipo].ing += ing;
    }
    const enPeriodo = reservas.filter(x => x.created_at?.slice(0, 10) >= desde);
    const canceladas = enPeriodo.filter(x => x.estado === 'CANCELADA' || x.estado === 'NO_SHOW').length;

    return {
      ocupacion: (nochesVendidas / disponibles) * 100,
      adr: nochesVendidas ? ingresosAloj / nochesVendidas : 0,
      revpar: ingresosAloj / disponibles,
      ingresosAloj,
      consumos,
      nochesVendidas,
      canceladas,
      tasaCancel: enPeriodo.length ? (canceladas / enPeriodo.length) * 100 : 0,
      canales: Object.entries(canales).sort((a, b) => b[1].ing - a[1].ing),
      tipos: Object.entries(tipos).sort((a, b) => b[1].ing - a[1].ing),
      disponibles,
      vendibles,
    };
  }, [reservas, habitaciones, tiposById, habById, dias]);

  const kpis = [
    { label: 'Ocupación', value: `${r.ocupacion.toFixed(1)}%`, hint: `${r.nochesVendidas} de ${r.disponibles} noches` },
    { label: 'ADR (tarifa media)', value: money(r.adr), hint: 'Ingreso por noche vendida' },
    { label: 'RevPAR', value: money(r.revpar), hint: 'Ingreso por habitación disponible' },
    { label: 'Ingresos hospedaje', value: money(r.ingresosAloj), hint: 'Noches del periodo' },
    { label: 'Consumos', value: money(r.consumos), hint: 'Minibar, restaurante, servicios' },
    { label: 'Cancelaciones', value: `${r.canceladas} (${r.tasaCancel.toFixed(0)}%)`, hint: 'Incluye no show' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        {RANGOS.map(x => (
          <button key={x.id} type="button" onClick={() => setDias(x.id)} className={`px-3 py-1.5 rounded-xl text-xs font-bold ${dias === x.id ? 'bg-sky-600 text-white' : 'bg-white border border-slate-200 text-slate-600'}`}>
            Últimos {x.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {kpis.map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-slate-200 p-3">
            <p className="text-[10px] font-bold text-slate-400 uppercase">{k.label}</p>
            <p className="text-lg font-black text-slate-900 mt-0.5">{k.value}</p>
            <p className="text-[10px] text-slate-400">{k.hint}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Tabla titulo="Por canal de venta" columnas={['Canal', 'Reservas', 'Noches', 'Ingresos']} filas={r.canales.map(([k, v]) => [k, v.reservas, v.n, money(v.ing)])} />
        <Tabla titulo="Por tipo de habitación" columnas={['Tipo', 'Noches', 'ADR', 'Ingresos']} filas={r.tipos.map(([k, v]) => [k, v.n, money(v.n ? v.ing / v.n : 0), money(v.ing)])} />
      </div>
    </div>
  );
}
