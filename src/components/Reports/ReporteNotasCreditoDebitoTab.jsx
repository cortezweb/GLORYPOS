import React, { useState, useMemo } from 'react';
import { BarChart2, Calendar, FileText, RotateCw } from 'lucide-react';

export default function ReporteNotasCreditoDebitoTab() {
  const [desde, setDesde] = useState('01/09/2026');
  const [hasta, setHasta] = useState('22/09/2026');
  const [tipo, setTipo] = useState('Todas');
  const [sucursal, setSucursal] = useState('Principal');

  // Datos base exactos al screenshot
  const detalleNotas = useMemo(() => {
    return [
      { id: 'nc-1', fecha: '22/09/2026', numero: 'BC01-00000005', tipo: 'Crédito', motivo: '01 - devolucion', comprobante_afectado: 'B001-821', cliente: 'Clientes Varios', estado: 'Aceptado', monto: 80.00 },
      { id: 'nc-2', fecha: '22/09/2026', numero: 'BC01-00000004', tipo: 'Crédito', motivo: '01 - devolucion', comprobante_afectado: 'B001-824', cliente: 'Clientes Varios', estado: 'Aceptado', monto: 42.00 },
      { id: 'nc-3', fecha: '16/09/2026', numero: 'FC01-00000004', tipo: 'Crédito', motivo: '01 - gaa', comprobante_afectado: 'F001-328', cliente: 'CASAS MEJIA RAFAEL FERNANDO', estado: 'Aceptado', monto: 103.60 },
      { id: 'nc-4', fecha: '16/09/2026', numero: 'FC01-00000003', tipo: 'Crédito', motivo: '01 - gss', comprobante_afectado: 'F001-329', cliente: 'BASHUA S.A.C.', estado: 'Aceptado', monto: 880.25 },
      { id: 'nc-5', fecha: '16/09/2026', numero: 'FC01-00000002', tipo: 'Crédito', motivo: '01 - gaaaa', comprobante_afectado: 'F001-321', cliente: 'CARRASCO HANCCO, BERLY ADEMIR', estado: 'Aceptado', monto: 33.50 },
      { id: 'nc-6', fecha: '14/09/2026', numero: 'BC01-00000003', tipo: 'Crédito', motivo: '07 - Devolución por ítem', comprobante_afectado: 'B001-718', cliente: 'Clientes Varios', estado: 'Aceptado', monto: 30.00 },
      { id: 'nc-7', fecha: '02/09/2026', numero: 'FC01-00000001', tipo: 'Crédito', motivo: '07 - Devolución por ítem', comprobante_afectado: 'F001-264', cliente: 'GRUPO GAMTEK E.I.R.L.', estado: 'Aceptado', monto: 89.80 }
    ];
  }, []);

  // Agrupación Por motivo
  const porMotivo = useMemo(() => {
    return [
      { tipo: 'Crédito', motivo: '01 - devolucion', cant: 5, monto: 1139.35 },
      { tipo: 'Crédito', motivo: '07 - Devolución por ítem', cant: 2, monto: 119.80 }
    ];
  }, []);

  const totalNC = 1259.15;
  const totalND = 0.00;
  const totalPeriodo = 1259.15;

  const handleExport = () => {
    let csv = "Fecha,Numero,Tipo,Motivo,ComprobanteAfectado,Cliente,Estado,Monto\n";
    detalleNotas.forEach(n => {
      csv += `"${n.fecha}","${n.numero}","${n.tipo}","${n.motivo}","${n.comprobante_afectado}","${n.cliente}","${n.estado}",${n.monto.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_notas_credito_debito_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Encabezado con Título y Botones de Acción */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5 text-xs text-slate-400 font-bold uppercase tracking-wider">
            <BarChart2 className="w-3.5 h-3.5" />
            <span>Reportes</span>
          </div>
          <h1 className="text-lg font-bold text-slate-800 tracking-tight mt-0.5">
            Reporte de notas de crédito y débito
          </h1>
          <p className="text-xs text-slate-500">Por período y motivo declarado a SUNAT.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExport}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            <span>Exportar</span>
          </button>
          <button
            type="button"
            onClick={() => {}}
            className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <RotateCw className="w-3.5 h-3.5 text-slate-400" />
            <span>Actualizar</span>
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* Desde */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Desde
            </label>
            <div className="relative">
              <input
                type="text"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Hasta */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hasta
            </label>
            <div className="relative">
              <input
                type="text"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tipo */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todas">Todas</option>
              <option value="Nota de Crédito">Nota de Crédito</option>
              <option value="Nota de Débito">Nota de Débito</option>
            </select>
          </div>

          {/* Sucursal */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Sucursal
            </label>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Principal">Principal</option>
              <option value="Todas">Todas</option>
            </select>
          </div>

          {/* Botón Buscar */}
          <div>
            <button
              type="button"
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition h-[34px] flex items-center justify-center"
            >
              Buscar
            </button>
          </div>
        </div>
      </div>

      {/* 3 Tarjetas Resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {/* Notas de crédito */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Notas de crédito
          </span>
          <div className="text-xl font-bold text-[#ea580c] font-mono">
            S/ {totalNC.toFixed(2)}
          </div>
        </div>

        {/* Notas de débito */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Notas de débito
          </span>
          <div className="text-xl font-bold text-blue-600 font-mono">
            S/ {totalND.toFixed(2)}
          </div>
        </div>

        {/* Total del período */}
        <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
          <span className="text-[11px] font-semibold text-slate-500 block">
            Total del período (7 notas)
          </span>
          <div className="text-xl font-bold text-slate-900 font-mono">
            S/ {totalPeriodo.toFixed(2)}
          </div>
        </div>
      </div>

      {/* Sección: Por motivo */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Por motivo
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">TIPO</th>
                <th className="py-2.5 px-3">MOTIVO</th>
                <th className="py-2.5 px-3 text-right">CANT.</th>
                <th className="py-2.5 px-3 text-right">MONTO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {porMotivo.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-[#fff3eb] text-[#f97316] border border-[#fed7aa]">
                      {row.tipo}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{row.motivo}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">{row.cant}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    S/ {row.monto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Sección: Detalle */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <h2 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Detalle
        </h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-2.5 px-3">FECHA</th>
                <th className="py-2.5 px-3">NÚMERO</th>
                <th className="py-2.5 px-3">MOTIVO</th>
                <th className="py-2.5 px-3">COMPROBANTE AFECTADO</th>
                <th className="py-2.5 px-3">CLIENTE</th>
                <th className="py-2.5 px-3">ESTADO</th>
                <th className="py-2.5 px-3 text-right">MONTO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {detalleNotas.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-slate-700">{row.fecha}</td>
                  <td className="py-2.5 px-3 font-mono font-bold text-slate-800">{row.numero}</td>
                  <td className="py-2.5 px-3 text-slate-600">{row.motivo}</td>
                  <td className="py-2.5 px-3 font-mono text-emerald-700 font-medium">{row.comprobante_afectado}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-800">{row.cliente}</td>
                  <td className="py-2.5 px-3">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {row.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                    S/ {row.monto.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
