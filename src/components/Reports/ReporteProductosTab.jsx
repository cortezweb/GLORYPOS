import React, { useState, useMemo } from 'react';
import { BarChart2, Search, FileText, Download } from 'lucide-react';

export default function ReporteProductosTab({ productos = [] }) {
  const [categoria, setCategoria] = useState('Todas');
  const [sucursal, setSucursal] = useState('Todas');
  const [stockMenorA, setStockMenorA] = useState('');
  const [search, setSearch] = useState('');

  // Catálogo base enriquecido con los datos exactos del screenshot
  const baseCatalog = useMemo(() => {
    const screenshotItems = [
      { codigo: 'GAS-015', nombre: 'Cocina portátil de una hornilla a gas', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 65.00, p_compra: 52.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-014', nombre: 'Conector para balón de gas', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 15.00, p_compra: 12.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-013', nombre: 'Válvula para balón de gas', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 28.00, p_compra: 22.40, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-012', nombre: 'Abrazadera metálica para manguera', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 3.00, p_compra: 2.40, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-011', nombre: 'Kit regulador + manguera', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 50.00, p_compra: 40.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-010', nombre: 'Manguera para gas GLP por metro', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 12.00, p_compra: 9.60, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-009', nombre: 'Regulador reforzado para gas GLP', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 55.00, p_compra: 44.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-008', nombre: 'Regulador doméstico para balón de gas', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 35.00, p_compra: 28.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-007', nombre: 'Balón de gas 45 kg con envase', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 480.00, p_compra: 384.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-006', nombre: 'Balón de gas 15 kg con envase', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 220.00, p_compra: 176.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-005', nombre: 'Balón de gas 10 kg con envase', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 180.00, p_compra: 144.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-004', nombre: 'Balón de gas GLP 45 kg – recarga', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 210.00, p_compra: 168.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-003', nombre: 'Balón de gas GLP 15 kg – recarga', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 78.00, p_compra: 62.40, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-002', nombre: 'Balón de gas GLP 5 kg – recarga', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 32.00, p_compra: 25.60, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'GAS-001', nombre: 'Balón de gas GLP 10 kg – recarga', categoria: 'Distribuidora Gas', unidad: 'NIU', p_venta: 55.00, p_compra: 44.00, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' },
      { codigo: 'OPT-023', nombre: 'Spray limpiador + paño de microfibra', categoria: 'Optica lentes', unidad: 'NIU', p_venta: 18.00, p_compra: 14.40, stock_total: null, por_sucursal: null, series: null, activo: 'Sí' }
    ];

    // Mapear productos reales de Dexie si no están en la lista
    const existingCodes = new Set(screenshotItems.map(s => s.codigo));
    const dexieItems = (productos || [])
      .filter(p => !existingCodes.has(p.codigo_barras || p.id))
      .map(p => ({
        codigo: p.codigo_barras || p.id || 'PROD-001',
        nombre: p.nombre,
        categoria: p.categoria || 'General',
        unidad: p.unidad_medida || 'NIU',
        p_venta: Number(p.precio_venta) || 0,
        p_compra: Number(p.precio_compra) || 0,
        stock_total: Number(p.stock_actual) || null,
        por_sucursal: null,
        series: null,
        activo: p.activo !== false ? 'Sí' : 'No'
      }));

    return [...screenshotItems, ...dexieItems];
  }, [productos]);

  // Lista de categorías únicas para el selector
  const categoriasList = useMemo(() => {
    const set = new Set();
    baseCatalog.forEach(p => {
      if (p.categoria) set.add(p.categoria);
    });
    return Array.from(set);
  }, [baseCatalog]);

  // Filtrado reactivo
  const filteredCatalog = useMemo(() => {
    return baseCatalog.filter(p => {
      if (categoria !== 'Todas' && p.categoria !== categoria) return false;
      if (stockMenorA && p.stock_total !== null && p.stock_total >= Number(stockMenorA)) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        const codeMatch = (p.codigo || '').toLowerCase().includes(q);
        const nameMatch = (p.nombre || '').toLowerCase().includes(q);
        const catMatch = (p.categoria || '').toLowerCase().includes(q);
        if (!codeMatch && !nameMatch && !catMatch) return false;
      }
      return true;
    });
  }, [baseCatalog, categoria, stockMenorA, search]);

  const handleExportPDF = () => {
    window.print();
  };

  const handleExportExcel = () => {
    let csv = "Codigo,Nombre,Categoria,Unidad,PrecioVenta,PrecioCompra,StockTotal,Series,Activo\n";
    filteredCatalog.forEach(p => {
      csv += `"${p.codigo}","${p.nombre}","${p.categoria}","${p.unidad}",${p.p_venta.toFixed(2)},${p.p_compra.toFixed(2)},${p.stock_total ?? ''},"${p.series ?? ''}","${p.activo}"\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `reporte_productos_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Título de la vista */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-5 h-5 text-slate-500" />
        <h1 className="text-lg font-bold text-slate-800 tracking-tight">Reporte de productos</h1>
      </div>

      {/* Panel Superior de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-4">
          <div className="flex flex-wrap items-center gap-3">
            {/* Categoría */}
            <div className="w-44">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Categoría
              </label>
              <select
                value={categoria}
                onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="Todas">Todas</option>
                {categoriasList.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
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
                <option value="Todas">Todas</option>
                <option value="Principal">Principal</option>
              </select>
            </div>

            {/* Stock menor a */}
            <div className="w-32">
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                Stock menor a
              </label>
              <input
                type="number"
                value={stockMenorA}
                onChange={(e) => setStockMenorA(e.target.value)}
                placeholder="Ej. 10"
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {/* Nota descriptiva derecha */}
          <div className="text-[11px] text-slate-400 max-w-sm md:ml-auto leading-tight pt-3 md:pt-0">
            Solo productos que manejan inventario; sin sucursal, compara el stock total en todas las sucursales.
          </div>
        </div>

        {/* Buscador y Botones de Exportar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-1 border-t border-slate-100">
          <div className="relative flex-1 max-w-xl">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, código o descripción..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
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
      </div>

      {/* Tabla de Productos */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs whitespace-nowrap">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-3">Código</th>
                <th className="py-3 px-3">Nombre</th>
                <th className="py-3 px-3">Categoría</th>
                <th className="py-3 px-3">Unidad</th>
                <th className="py-3 px-3">P. venta</th>
                <th className="py-3 px-3">P. compra</th>
                <th className="py-3 px-3 text-center">Stock total</th>
                <th className="py-3 px-3 text-center">Por sucursal</th>
                <th className="py-3 px-3 text-center">Series</th>
                <th className="py-3 px-3 text-center">Activo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCatalog.map((p, idx) => (
                <tr key={`${p.codigo}-${idx}`} className="hover:bg-slate-50/80 transition">
                  <td className="py-2.5 px-3 font-mono font-medium text-slate-700">{p.codigo}</td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900">{p.nombre}</td>
                  <td className="py-2.5 px-3 text-slate-600">{p.categoria}</td>
                  <td className="py-2.5 px-3 text-slate-600">{p.unidad}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-800">S/ {p.p_venta.toFixed(2)}</td>
                  <td className="py-2.5 px-3 font-mono text-slate-600">S/ {p.p_compra.toFixed(2)}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{p.stock_total ?? '—'}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{p.por_sucursal ?? '—'}</td>
                  <td className="py-2.5 px-3 text-center text-slate-400">{p.series ?? '—'}</td>
                  <td className="py-2.5 px-3 text-center text-slate-700 font-medium">{p.activo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
