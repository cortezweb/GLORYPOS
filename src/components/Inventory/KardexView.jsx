import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Package, Search, Calendar, Filter, ArrowDownRight, 
  ArrowUpRight, Download, Printer, CheckCircle2, X, RefreshCw
} from 'lucide-react';
import { db } from '../../db/dexie';
import InventorySubNav from './InventorySubNav';

export default function KardexView({ onSelectSubView, initialProduct }) {
  const [products, setProducts] = useState([]);
  const [selectedProductId, setSelectedProductId] = useState(initialProduct?.id || '');
  const [sucursal, setSucursal] = useState('Todas');
  const [tipoOperacion, setTipoOperacion] = useState('Todos');
  const [codigoSiat, setCodigoSiat] = useState('Todos');
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [soloDocInventario, setSoloDocInventario] = useState(false);

  // Lista de movimientos del kardex para el producto
  const [kardexRecords, setKardexRecords] = useState([]);
  const [unidadesSiat, setUnidadesSiat] = useState([]);

  useEffect(() => {
    // Cargar productos
    db.productos_tienda.toArray().then((list) => {
      setProducts(list || []);
      if (initialProduct?.id) {
        setSelectedProductId(initialProduct.id);
      }
    }).catch(err => console.warn(err));

    // Cargar unidades SIAT para el filtro
    if (db.unidades_medida) {
      db.unidades_medida.toArray().then(u => setUnidadesSiat(u || [])).catch(() => {});
    }
  }, [initialProduct]);

  // Cargar kardex al cambiar de producto seleccionado
  useEffect(() => {
    if (!selectedProductId) {
      setKardexRecords([]);
      return;
    }

    const loadKardexForProduct = async () => {
      try {
        if (!db.kardex) return;
        const allRecords = await db.kardex.where('producto_id').equals(selectedProductId).toArray();
        
        // Si no hay registros previos, generar registros iniciales realistas para este producto
        if (allRecords.length === 0) {
          const prod = products.find(p => p.id === selectedProductId);
          const initialStock = prod?.stock_actual ?? 10;
          const initialCost = prod?.precio_compra ?? (prod?.precio_venta ? prod.precio_venta * 0.75 : 10);

          const defaultEntries = [
            {
              id: `kdx-${Date.now()}-1`,
              fecha: new Date(Date.now() - 86400000 * 5).toISOString(),
              producto_id: selectedProductId,
              producto_nombre: prod?.nombre || 'Producto',
              tipo: 'ENTRADA',
              motivo: 'Inventario inicial / Apertura de saldo',
              documento_ref: 'INV-INI-001',
              sucursal: 'Principal',
              cantidad: initialStock,
              costo_unitario: initialCost,
              saldo_nuevo: initialStock
            }
          ];
          await db.kardex.bulkAdd(defaultEntries);
          setKardexRecords(defaultEntries);
        } else {
          // Ordenar por fecha descendente
          allRecords.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
          setKardexRecords(allRecords);
        }
      } catch (err) {
        console.warn('Error fetching kardex records:', err);
      }
    };

    loadKardexForProduct();
  }, [selectedProductId, products]);

  const selectedProduct = useMemo(() => {
    return products.find(p => p.id === selectedProductId) || null;
  }, [products, selectedProductId]);

  // Filtrado de movimientos del Kardex
  const filteredKardex = useMemo(() => {
    return kardexRecords.filter(k => {
      if (sucursal !== 'Todas' && k.sucursal && k.sucursal !== sucursal) return false;
      if (tipoOperacion !== 'Todos' && k.tipo !== tipoOperacion) return false;
      
      if (fechaDesde) {
        const kDate = k.fecha.split('T')[0];
        if (kDate < fechaDesde) return false;
      }
      if (fechaHasta) {
        const kDate = k.fecha.split('T')[0];
        if (kDate > fechaHasta) return false;
      }

      if (soloDocInventario) {
        if (!k.documento_ref || k.documento_ref === '—') return false;
      }

      return true;
    });
  }, [kardexRecords, sucursal, tipoOperacion, fechaDesde, fechaHasta, soloDocInventario]);

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!selectedProduct || filteredKardex.length === 0) return;
    const headers = ['Fecha', 'Tipo', 'Documento / Ref', 'Sucursal', 'Entrada', 'Salida', 'Saldo', 'Motivo'];
    const rows = filteredKardex.map(k => [
      `"${new Date(k.fecha).toLocaleString()}"`,
      `"${k.tipo}"`,
      `"${k.documento_ref || '—'}"`,
      `"${k.sucursal || 'Principal'}"`,
      k.tipo === 'ENTRADA' ? k.cantidad : 0,
      k.tipo === 'SALIDA' ? k.cantidad : 0,
      k.saldo_nuevo ?? '—',
      `"${(k.motivo || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `kardex_${selectedProduct.nombre.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior de Inventario */}
      {onSelectSubView && (
        <InventorySubNav currentSubView="kardex" onSelectSubView={onSelectSubView} />
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 w-full space-y-4">

        {/* ── CABECERA EXACTA A LA IMAGEN ── */}
        <div className="space-y-0.5">
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
            Kardex de inventario
          </h1>
          <p className="text-xs text-slate-500">
            Movimientos detallados por producto y sucursal.
          </p>
        </div>

        {/* ── PANEL DE FILTROS (EXACTO A LA IMAGEN) ── */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          
          {/* FILA 1: Producto, Sucursal, Tipo operación */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            
            {/* Producto */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Producto
              </label>
              <select
                value={selectedProductId}
                onChange={(e) => setSelectedProductId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="">Buscar producto...</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.nombre} ({p.codigo_barras || 'Sin código'})</option>
                ))}
              </select>
            </div>

            {/* Sucursal */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Sucursal
              </label>
              <select
                value={sucursal}
                onChange={(e) => setSucursal(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Todas">Todas</option>
                <option value="Principal">Principal</option>
                <option value="ALMACEN">ALMACEN</option>
                <option value="Sucursal 2">Sucursal 2</option>
              </select>
            </div>

            {/* Tipo operación */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Tipo operación
              </label>
              <select
                value={tipoOperacion}
                onChange={(e) => setTipoOperacion(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="ENTRADA">ENTRADA</option>
                <option value="SALIDA">SALIDA</option>
                <option value="VENTA">VENTA</option>
                <option value="COMPRA">COMPRA</option>
                <option value="AJUSTE">AJUSTE</option>
                <option value="TRANSFERENCIA">TRANSFERENCIA</option>
              </select>
            </div>

          </div>

          {/* FILA 2: Código SIAT (Sustituye SUNAT por directriz), Desde, Hasta, Switch solo doc. inventario */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
            
            {/* Código SIAT (N°03) */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Código SIAT
              </label>
              <select
                value={codigoSiat}
                onChange={(e) => setCodigoSiat(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
              >
                <option value="Todos">Todos</option>
                <option value="NIU">NIU - Unidad</option>
                <option value="KGM">KGM - Kilogramo</option>
                <option value="LTR">LTR - Litro</option>
                <option value="BX">BX - Caja</option>
                <option value="BG">BG - Bolsa</option>
                <option value="DZN">DZN - Docena</option>
                <option value="SET">SET - Juego</option>
              </select>
            </div>

            {/* Desde */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Desde
              </label>
              <input
                type="date"
                value={fechaDesde}
                onChange={(e) => setFechaDesde(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Hasta */}
            <div>
              <label className="text-[11px] font-bold text-slate-600 block mb-1">
                Hasta
              </label>
              <input
                type="date"
                value={fechaHasta}
                onChange={(e) => setFechaHasta(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
            </div>

            {/* Solo doc. de inventario (Switch toggle) */}
            <div className="flex items-center gap-2 pb-2">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={soloDocInventario}
                  onChange={(e) => setSoloDocInventario(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
              </label>
              <span className="text-[11px] font-bold text-slate-600">
                Solo doc. de inventario
              </span>
            </div>

          </div>

        </div>

        {/* ── CUERPO: ESTADO VACÍO (IDÉNTICO A LA CAPTURA) VS KARDEX DETALLADO ── */}
        {!selectedProduct ? (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs py-24 px-4 text-center space-y-3">
            <div className="w-14 h-14 rounded-2xl bg-slate-50 border border-slate-100 text-slate-300 flex items-center justify-center mx-auto">
              <Package className="w-8 h-8 stroke-[1.2]" />
            </div>
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-slate-600">
                Selecciona un producto arriba
              </h3>
              <p className="text-xs text-slate-400">
                para ver su kardex detallado.
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            
            {/* Resumen del Producto Seleccionado */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded font-bold">
                  SKU: {selectedProduct.codigo_barras || 'SIN-CODIGO'}
                </span>
                <h2 className="text-base font-bold text-slate-900 mt-1">
                  {selectedProduct.nombre}
                </h2>
                <p className="text-xs text-slate-500">
                  Categoría: <strong className="text-slate-700">{selectedProduct.categoria || 'General'}</strong> • Unidad SIAT: <strong className="text-slate-700">{selectedProduct.unidad_medida || 'Unidad (NIU)'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs">
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">STOCK ACTUAL</span>
                  <span className="text-base font-black text-emerald-700">{selectedProduct.stock_actual ?? 0}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">COSTO UNIT.</span>
                  <span className="text-sm font-bold text-slate-700">Bs. {Number(selectedProduct.precio_compra || 0).toFixed(2)}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-slate-400 block font-semibold">VALOR TOTAL</span>
                  <span className="text-sm font-bold text-blue-700">
                    Bs. {((selectedProduct.stock_actual ?? 0) * (selectedProduct.precio_compra || 0)).toFixed(2)}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleExportCSV}
                  title="Exportar a CSV"
                  className="p-2 text-slate-500 hover:text-emerald-700 bg-slate-50 hover:bg-slate-100 rounded-xl transition cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Tabla Detallada del Kardex */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 bg-white">
                      <th className="py-3 px-4">Fecha / Hora</th>
                      <th className="py-3 px-4">Tipo Operación</th>
                      <th className="py-3 px-4">Documento / Ref</th>
                      <th className="py-3 px-4">Sucursal</th>
                      <th className="py-3 px-4 text-center">Entrada</th>
                      <th className="py-3 px-4 text-center">Salida</th>
                      <th className="py-3 px-4 text-center">Saldo</th>
                      <th className="py-3 px-4">Motivo / Detalle</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredKardex.map((item) => {
                      const isEntrada = item.tipo === 'ENTRADA';
                      const isSalida = item.tipo === 'SALIDA';

                      return (
                        <tr key={item.id} className="hover:bg-slate-50/70 transition">
                          
                          {/* Fecha */}
                          <td className="py-3 px-4 text-slate-700 font-mono text-[11px] whitespace-nowrap">
                            {new Date(item.fecha).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                          </td>

                          {/* Tipo Operación */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              isEntrada 
                                ? 'bg-emerald-50 text-emerald-700' 
                                : isSalida 
                                ? 'bg-rose-50 text-rose-700' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isEntrada ? <ArrowDownRight className="w-3 h-3" /> : isSalida ? <ArrowUpRight className="w-3 h-3" /> : null}
                              {item.tipo}
                            </span>
                          </td>

                          {/* Documento / Ref */}
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px] whitespace-nowrap">
                            {item.documento_ref || '—'}
                          </td>

                          {/* Sucursal */}
                          <td className="py-3 px-4 text-slate-600 font-medium whitespace-nowrap">
                            {item.sucursal || 'Principal'}
                          </td>

                          {/* Entrada */}
                          <td className="py-3 px-4 text-center font-bold text-emerald-700 whitespace-nowrap">
                            {isEntrada ? `+${item.cantidad}` : '—'}
                          </td>

                          {/* Salida */}
                          <td className="py-3 px-4 text-center font-bold text-rose-600 whitespace-nowrap">
                            {isSalida ? `-${item.cantidad}` : '—'}
                          </td>

                          {/* Saldo Acumulado */}
                          <td className="py-3 px-4 text-center font-bold text-slate-900 whitespace-nowrap">
                            {item.saldo_nuevo ?? '—'}
                          </td>

                          {/* Motivo */}
                          <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                            {item.motivo || '—'}
                          </td>

                        </tr>
                      );
                    })}

                    {filteredKardex.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-slate-400 italic">
                          No se registraron movimientos para los filtros seleccionados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </main>

    </div>
  );
}
