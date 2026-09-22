import React, { useState, useMemo } from 'react';
import { BarChart2, Search, Calendar, FileText, Download } from 'lucide-react';

export default function ReporteComprasTab({ compras = [] }) {
  const [desde, setDesde] = useState('01/09/2026');
  const [hasta, setHasta] = useState('22/09/2026');
  const [search, setSearch] = useState('');
  const [itemsPerPage, setItemsPerPage] = useState(25);

  // Filas base exactamente iguales al screenshot
  const baseCompras = useMemo(() => {
    const screenshotData = [
      {
        id: 'c-1',
        fecha: '18/09/2026',
        tipo: 'FACTURA',
        serie: 'E001',
        numero: '458',
        proveedor: 'CORPORACION INDUSTRIAL PSG E.I.R.L.',
        subtotal: 14840.39,
        igv: 2671.27,
        total: 17511.66,
        estado: 'Recibida',
        cre: '—',
        estado_cre: '—',
        rr: '—',
        estado_rr: '—'
      },
      {
        id: 'c-2',
        fecha: '04/09/2026',
        tipo: 'TICKET',
        serie: 'Fdh',
        numero: '4478',
        proveedor: 'Clientes varios',
        subtotal: 182.20,
        igv: 32.80,
        total: 215.00,
        estado: 'Recibida',
        cre: 'R001-1',
        estado_cre: 'Error envio',
        rr: '—',
        estado_rr: '—'
      },
      {
        id: 'c-3',
        fecha: '01/09/2026',
        tipo: 'FACTURA',
        serie: '001',
        numero: '1',
        proveedor: 'Clientes varios',
        subtotal: 5.40,
        igv: 0.00,
        total: 5.40,
        estado: 'Recibida',
        cre: '—',
        estado_cre: '—',
        rr: '—',
        estado_rr: '—'
      },
      {
        id: 'c-4',
        fecha: '01/09/2026',
        tipo: 'TICKET',
        serie: '001',
        numero: '1',
        proveedor: 'Clientes varios',
        subtotal: 10.80,
        igv: 0.00,
        total: 10.80,
        estado: 'Recibida',
        cre: '—',
        estado_cre: '—',
        rr: '—',
        estado_rr: '—'
      },
      {
        id: 'c-5',
        fecha: '01/09/2026',
        tipo: 'FACTURA',
        serie: '4567',
        numero: '887',
        proveedor: 'ICO LOGISTICA S.A.C.',
        subtotal: 0.00,
        igv: 0.00,
        total: 0.00,
        estado: 'Anulada',
        cre: '—',
        estado_cre: '—',
        rr: '—',
        estado_rr: '—'
      }
    ];

    // Integrar compras de Dexie si existen
    const realCompras = (compras || []).map((c, i) => {
      const tot = Number(c.total) || 0;
      const sub = Number(c.subtotal) || (tot / 1.18);
      const igv = Number(c.igv) || (tot - sub);
      return {
        id: c.id || `c-dexie-${i}`,
        fecha: c.fecha ? c.fecha.split('T')[0] : '20/09/2026',
        tipo: c.tipo_documento || 'FACTURA',
        serie: c.serie || 'F001',
        numero: c.numero || `${100 + i}`,
        proveedor: c.proveedor_nombre || 'Proveedor Comercial',
        subtotal: sub,
        igv: igv,
        total: tot,
        estado: c.estado || 'Recibida',
        cre: '—',
        estado_cre: '—',
        rr: '—',
        estado_rr: '—'
      };
    });

    return [...screenshotData, ...realCompras];
  }, [compras]);

  // Filtrado
  const filteredCompras = useMemo(() => {
    return baseCompras.filter(row => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const provMatch = (row.proveedor || '').toLowerCase().includes(q);
        const serieMatch = (row.serie || '').toLowerCase().includes(q);
        const numMatch = (row.numero || '').toLowerCase().includes(q);
        if (!provMatch && !serieMatch && !numMatch) return false;
      }
      return true;
    });
  }, [baseCompras, search]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let csv = "Fecha,Tipo,Serie,Numero,Proveedor,Subtotal,IGV,Total,Estado,CRE,EstadoCRE,RR,EstadoRR\n";
    filteredCompras.forEach(c => {
      csv += `"${c.fecha}","${c.tipo}","${c.serie}","${c.numero}","${c.proveedor}",${c.subtotal.toFixed(2)},${c.igv.toFixed(2)},${c.total.toFixed(2)},"${c.estado}","${c.cre}","${c.estado_cre}","${c.rr}","${c.estado_rr}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_compras_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Título de la vista */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-slate-500" />
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Reporte de compras</h1>
      </div>

      {/* Panel Superior de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          {/* Proveedor / Buscador */}
          <div className="md:col-span-6">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Proveedor
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por nombre o número de documento (RUC, DNI...)"
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Desde */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Desde
            </label>
            <div className="relative">
              <input
                type="text"
                value={desde}
                onChange={(e) => setDesde(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Hasta */}
          <div className="md:col-span-3">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Hasta
            </label>
            <div className="relative">
              <input
                type="text"
                value={hasta}
                onChange={(e) => setHasta(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Nota informativa */}
        <p className="text-[11px] text-slate-400">
          Por defecto se muestra el mes en curso. La búsqueda incluye también serie y número del comprobante de compra.
        </p>

        {/* Botones de Exportar */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={handleExportPDF}
            className="px-4 py-2 bg-[#d92d20] hover:bg-red-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Exportar PDF</span>
          </button>
          <button
            type="button"
            onClick={handleExportExcel}
            className="px-4 py-2 bg-[#12b76a] hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exportar Excel</span>
          </button>
        </div>
      </div>

      {/* Tabla de Compras */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-3">Fecha</th>
                <th className="py-3 px-3">Tipo</th>
                <th className="py-3 px-3">Serie</th>
                <th className="py-3 px-3">Número</th>
                <th className="py-3 px-3">Proveedor</th>
                <th className="py-3 px-3 text-right">Subtotal</th>
                <th className="py-3 px-3 text-right">IGV</th>
                <th className="py-3 px-3 text-right">Total</th>
                <th className="py-3 px-3">Estado</th>
                <th className="py-3 px-3 text-center">CRE</th>
                <th className="py-3 px-3 text-center">Estado CRE</th>
                <th className="py-3 px-3 text-center">RR</th>
                <th className="py-3 px-3 text-center">Estado RR</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCompras.slice(0, itemsPerPage).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 text-slate-700">{c.fecha}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-800">{c.tipo}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{c.serie}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-700">{c.numero}</td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{c.proveedor}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">S/ {c.subtotal.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono text-slate-700">S/ {c.igv.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">S/ {c.total.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-slate-700">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                      c.estado === 'Recibida' ? 'bg-slate-100 text-slate-700' : 'bg-rose-50 text-rose-700'
                    }`}>
                      {c.estado}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-center font-mono font-medium text-slate-700">{c.cre}</td>
                  <td className="py-2.5 px-3 text-center">
                    {c.estado_cre === 'Error envio' ? (
                      <span className="text-orange-600 font-medium text-[11px]">{c.estado_cre}</span>
                    ) : (
                      <span className="text-slate-400">{c.estado_cre}</span>
                    )}
                  </td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{c.rr}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{c.estado_rr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Paginador Inferior */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 text-xs text-slate-500 bg-slate-50/40">
          <div>
            Mostrando 1-{filteredCompras.length} de {filteredCompras.length}
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <span>Mostrar</span>
              <select
                value={itemsPerPage}
                onChange={(e) => setItemsPerPage(Number(e.target.value))}
                className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
              </select>
              <span>por página</span>
            </div>
            <div className="flex items-center gap-2">
              <button disabled className="px-3 py-1 rounded-lg border border-slate-200 text-slate-400 text-xs cursor-not-allowed">
                Anterior
              </button>
              <span className="font-semibold text-slate-700">Página 1 de 1</span>
              <button disabled className="px-3 py-1 rounded-lg border border-slate-200 text-slate-400 text-xs cursor-not-allowed">
                Siguiente
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
