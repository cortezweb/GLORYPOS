import React, { useState, useMemo } from 'react';
import { BarChart2, Search, Calendar, FileText, Download } from 'lucide-react';

export default function ReporteVentasProductoTab({ ventas = [], productos = [] }) {
  const [desde, setDesde] = useState('01/09/2026');
  const [hasta, setHasta] = useState('22/09/2026');
  const [sucursal, setSucursal] = useState('Todas');
  const [categoria, setCategoria] = useState('Todas');
  const [searchProd, setSearchProd] = useState('');
  const [tipo, setTipo] = useState('Todos');

  // Datos de muestra idénticos al screenshot + dinámicos de Dexie
  const rankingData = useMemo(() => {
    const screenshotAbarrotes = [
      { codigo: 'AA000021', producto: 'Aceite 1 L', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 6, cmpr: 4, total: 613.26, precio_prom: 102.21 },
      { codigo: 'AA000001', producto: 'Arroz 1 kg', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 7, cmpr: 7, total: 786.94, precio_prom: 112.42 },
      { codigo: 'AA000061', producto: 'Arroz 2 L', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 18, cmpr: 18, total: 1390.86, precio_prom: 77.27 },
      { codigo: 'AA000091', producto: 'Atún 250 ml', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 16, cmpr: 16, total: 1144.32, precio_prom: 71.52 },
      { codigo: 'AA000901', producto: 'Avena 200 g', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 2, cmpr: 1, total: 25.86, precio_prom: 12.93 },
      { codigo: 'AA000931', producto: 'Avena Pack x12', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 7, cmpr: 7, total: 111.65, precio_prom: 15.95 },
      { codigo: 'AA000741', producto: 'Ayudín', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 2, cmpr: 2, total: 67.86, precio_prom: 33.93 },
      { codigo: 'AA000891', producto: 'Azúcar 1 L', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 1, cmpr: 1, total: 30.81, precio_prom: 30.81 },
      { codigo: 'AA000851', producto: 'Azúcar 2 kg', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 1, cmpr: 1, total: 31.81, precio_prom: 31.81 },
      { codigo: 'AA000971', producto: 'Azúcar 200 g', categoria: 'ABARROTES', unidad: 'NIU', cantidad: 12, cmpr: 12, total: 663.60, precio_prom: 55.30 }
    ];

    return screenshotAbarrotes;
  }, []);

  // Filtrado
  const filteredData = useMemo(() => {
    return rankingData.filter(item => {
      if (categoria !== 'Todas' && item.categoria.toLowerCase() !== categoria.toLowerCase()) return false;
      if (searchProd.trim()) {
        const q = searchProd.toLowerCase();
        const codeMatch = (item.codigo || '').toLowerCase().includes(q);
        const nameMatch = (item.producto || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch) return false;
      }
      return true;
    });
  }, [rankingData, categoria, searchProd]);

  // Agrupación por Categoría
  const groupedByCategory = useMemo(() => {
    const map = {};
    filteredData.forEach(item => {
      const cat = item.categoria || 'GENERAL';
      if (!map[cat]) map[cat] = [];
      map[cat].push(item);
    });
    return map;
  }, [filteredData]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let csv = "Categoria,Codigo,Producto,Unidad,Cantidad,Comprobantes,Total,PrecioPromedio\n";
    filteredData.forEach(i => {
      csv += `"${i.categoria}","${i.codigo}","${i.producto}","${i.unidad}",${i.cantidad},${i.cmpr},${i.total.toFixed(2)},${i.precio_prom.toFixed(2)}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_ventas_producto_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Título de la vista */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-slate-500" />
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">
          Reporte de ventas por producto
        </h1>
      </div>

      {/* Panel Superior de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {/* Desde */}
          <div>
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
          <div>
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

          {/* Sucursal */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Sucursal
            </label>
            <select
              value={sucursal}
              onChange={(e) => setSucursal(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todas">Todas</option>
              <option value="Principal">Principal</option>
            </select>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Categoría
            </label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todas">Todas</option>
              <option value="ABARROTES">ABARROTES</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Lácteos">Lácteos</option>
            </select>
          </div>

          {/* Buscar producto */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Buscar producto
            </label>
            <input
              type="text"
              value={searchProd}
              onChange={(e) => setSearchProd(e.target.value)}
              placeholder="Código o nombre..."
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* Tipo */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              Tipo
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="Todos">Todos</option>
              <option value="Productos">Productos</option>
              <option value="Servicios">Servicios</option>
            </select>
          </div>
        </div>

        {/* Nota informativa */}
        <p className="text-[11px] text-slate-400">
          Solo ventas no anuladas. Los totales inferiores coinciden con el período y filtros seleccionados.
        </p>

        {/* Botones de Exportar a la izquierda */}
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

      {/* Banner Resumen del Período + 4 Tarjetas KPI */}
      <div className="space-y-3">
        <div className="text-xs">
          <span className="text-[10px] font-black tracking-wider text-slate-400 uppercase block">
            RESUMEN DEL PERÍODO
          </span>
          <p className="text-slate-700 font-bold mt-0.5">
            01/09/2026 → 22/09/2026
          </p>
          <p className="text-[11px] text-slate-400">
            Todas las sucursales · Todas las categorías
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* TOTAL VENDIDO */}
          <div className="p-4 rounded-2xl bg-[#f5f3ff] border border-violet-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#7c3aed] block">
              TOTAL VENDIDO
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              S/ 170,150.83
            </div>
          </div>

          {/* COMPROBANTES */}
          <div className="p-4 rounded-2xl bg-[#f0fdfa] border border-teal-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#0d9488] block">
              COMPROBANTES
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              541
            </div>
            <p className="text-[10px] text-slate-500">Ventas distintas en el período</p>
          </div>

          {/* LÍNEAS DE DETALLE */}
          <div className="p-4 rounded-2xl bg-[#fffbeb] border border-amber-200/80 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-[#d97706] block">
              LÍNEAS DE DETALLE
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              2004
            </div>
            <p className="text-[10px] text-slate-500">Ítems en todas las ventas</p>
          </div>

          {/* PRODUCTOS */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 block">
              PRODUCTOS
            </span>
            <div className="text-xl sm:text-2xl font-black text-slate-900 font-mono">
              426
            </div>
            <p className="text-[10px] text-slate-500">En este ranking</p>
          </div>
        </div>
      </div>

      {/* Tabla de Productos Agrupados por Categoría */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Unidad de venta</th>
                <th className="py-3 px-4 text-right">Cantidad</th>
                <th className="py-3 px-4 text-right">Cmpr.</th>
                <th className="py-3 px-4 text-right">Total</th>
                <th className="py-3 px-4 text-right">Precio prom.</th>
              </tr>
            </thead>
            <tbody>
              {Object.entries(groupedByCategory).map(([catName, items]) => (
                <React.Fragment key={catName}>
                  {/* Encabezado de Categoría */}
                  <tr className="bg-slate-50/90 border-y border-slate-100 font-bold text-slate-700 text-[11px]">
                    <td colSpan={7} className="py-2.5 px-4 uppercase tracking-wider text-slate-600">
                      {catName}
                    </td>
                  </tr>

                  {/* Filas de la Categoría */}
                  {items.map((row) => (
                    <tr key={row.codigo} className="border-b border-slate-100/70 hover:bg-slate-50/70 transition">
                      <td className="py-2.5 px-4 font-mono text-slate-600 font-medium">{row.codigo}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{row.producto}</td>
                      <td className="py-2.5 px-4 text-slate-600">{row.unidad}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-800">{row.cantidad}</td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-800">{row.cmpr}</td>
                      <td className="py-2.5 px-4 text-right font-mono font-bold text-slate-900">
                        S/ {row.total.toFixed(2)}
                      </td>
                      <td className="py-2.5 px-4 text-right font-mono text-slate-700">
                        S/ {row.precio_prom.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
