import React, { useState, useEffect } from 'react';
import { 
  FileText, Search, Printer, Share2, Copy, Check, Ban, 
  ArrowUpDown, Filter, Download, ExternalLink, Calendar, CheckCircle2 
} from 'lucide-react';
import { db } from '../../db/dexie';
import SalesSubNav from './SalesSubNav';
import { exportLibroVentasRCV } from '../../utils/rcvExport';

export default function ComprobantesView({ onSelectSubView, onOpenReceipt }) {
  const [ventas, setVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDoc, setFilterDoc] = useState('ALL'); // ALL, FACTURA_SIAT, BOLETA
  const [copiedId, setCopiedId] = useState(null);

  const loadVentas = async () => {
    const list = await db.ventas.reverse().toArray();
    setVentas(list);
  };

  useEffect(() => {
    loadVentas();
  }, []);

  // Filter only formal receipts & invoices (excluding pure internal draft notes if requested, but showing all issued docs)
  const comprobantes = ventas.filter(v => 
    v.tipo_documento === 'FACTURA_SIAT' || 
    v.tipo_documento === 'FACTURA' || 
    v.tipo_documento === 'BOLETA'
  );

  const totalFacturado = comprobantes
    .filter(v => v.estado !== 'ANULADO')
    .reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const totalFacturasSiat = comprobantes.filter(v => 
    v.tipo_documento === 'FACTURA_SIAT' || v.tipo_documento === 'FACTURA'
  ).length;
  const totalBoletas = comprobantes.filter(v => v.tipo_documento === 'BOLETA').length;

  const filtered = comprobantes.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      v.correlativo?.toLowerCase().includes(term) ||
      v.cliente_nombre?.toLowerCase().includes(term) ||
      v.cliente_ci_nit?.includes(term) ||
      v.cuf?.toLowerCase().includes(term);

    const matchesDoc = 
      filterDoc === 'ALL' || 
      v.tipo_documento === filterDoc ||
      (filterDoc === 'FACTURA_SIAT' && v.tipo_documento === 'FACTURA');

    return matchesSearch && matchesDoc;
  });

  const handleCopyCuf = (cuf, id) => {
    if (!cuf) return;
    navigator.clipboard.writeText(cuf);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAnular = async (id, correlativo) => {
    if (window.confirm(`¿Estás seguro de anular el comprobante N° ${correlativo}? Se informará al registro tributario SIAT.`)) {
      await db.ventas.update(id, { estado: 'ANULADO' });
      await loadVentas();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Sales Sub-navigation Bar */}
      <SalesSubNav currentSubView="comprobantes" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header & KPI Metrics */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <FileText className="w-5 h-5 text-[#2563eb]" />
              Comprobantes Emitidos
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control tributario de Facturas Electrónicas SIAT y Boletas oficiales de venta
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={exportLibroVentasRCV}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
              title="Descargar archivo oficial RCV / SIAT para Impuestos Nacionales"
              type="button"
            >
              <Download className="w-4 h-4 text-emerald-600" />
              <span>Libro RCV (SIAT)</span>
            </button>

            <button
              onClick={() => onSelectSubView('pos')}
              className="px-3.5 py-2 bg-[#2563eb] hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-blue-500/20"
              type="button"
            >
              + Nueva Emisión
            </button>
          </div>
        </div>

        {/* 3 KPI Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-gradient-to-br from-blue-50 to-indigo-50/70 border border-blue-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-blue-700 block">
              Total Emitido
            </span>
            <span className="text-xl font-black text-gray-900 mt-1 block">
              Bs. {totalFacturado.toFixed(2)}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              En {comprobantes.length} comprobantes válidos
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-purple-50 to-indigo-50/60 border border-purple-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#712ae2] block">
              Facturas SIAT en Línea
            </span>
            <span className="text-xl font-black text-gray-900 mt-1 block">
              {totalFacturasSiat} facturas
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Sincronizadas con Impuestos
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Boletas de Venta
            </span>
            <span className="text-xl font-black text-gray-900 mt-1 block">
              {totalBoletas} boletas
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              Comprobantes simplificados
            </span>
          </div>
        </div>

        {/* Search & Filters */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por N° comprobante, cliente, NIT o CUF..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Document Type Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0">
              <button
                onClick={() => setFilterDoc('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterDoc === 'ALL'
                    ? 'bg-white text-[#2563eb] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todos ({comprobantes.length})
              </button>
              <button
                onClick={() => setFilterDoc('FACTURA_SIAT')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterDoc === 'FACTURA_SIAT'
                    ? 'bg-white text-[#2563eb] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Facturas SIAT ({totalFacturasSiat})
              </button>
              <button
                onClick={() => setFilterDoc('BOLETA')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterDoc === 'BOLETA'
                    ? 'bg-white text-[#2563eb] shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Boletas ({totalBoletas})
              </button>
            </div>
          </div>
        </div>

        {/* Comprobantes Table & Card List */}
        <div className="space-y-2.5">
          {filtered.map((v) => {
            const isFactura = v.tipo_documento === 'FACTURA_SIAT' || v.tipo_documento === 'FACTURA';
            const isAnulado = v.estado === 'ANULADO';
            const fechaFormateada = new Date(v.fecha).toLocaleString('es-BO', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={v.id}
                className={`bg-white rounded-2xl border transition-all p-4 shadow-2xs ${
                  isAnulado 
                    ? 'border-red-200 bg-red-50/20 opacity-70' 
                    : 'border-gray-200 hover:border-blue-300 hover:shadow-xs'
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left info: Icon & Document info */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                      isAnulado
                        ? 'bg-red-100 text-red-600'
                        : isFactura 
                          ? 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xs' 
                          : 'bg-emerald-100 text-emerald-700'
                    }`}>
                      <FileText className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-gray-900">
                          {v.correlativo || 'COMP-000'}
                        </span>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          isAnulado
                            ? 'bg-red-100 text-red-700'
                            : isFactura
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {isAnulado ? 'ANULADO' : isFactura ? 'FACTURA ELECTRÓNICA SIAT' : 'BOLETA OFICIAL'}
                        </span>
                        <span className="text-xs text-gray-400 font-medium">
                          {fechaFormateada}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-gray-800 mt-1 truncate">
                        {v.cliente_nombre || 'Cliente General'} 
                        <span className="text-gray-400 font-normal ml-1">
                          (NIT/CI: {v.cliente_ci_nit || '0'})
                        </span>
                      </p>

                      {/* Items details snippet */}
                      <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>
                          {v.items?.length || 1} producto(s)
                        </span>
                        <span>•</span>
                        <span className="font-medium text-gray-700">
                          Pago: {v.metodo_pago || 'Efectivo'}
                        </span>
                        {v.cuf && (
                          <>
                            <span>•</span>
                            <span className="font-mono text-[10px] text-gray-400 truncate max-w-[150px]">
                              CUF: {v.cuf.substring(0, 16)}...
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Total amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-4 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Total</span>
                      <span className={`text-lg font-black tracking-tight ${
                        isAnulado ? 'line-through text-red-500' : 'text-gray-900'
                      }`}>
                        Bs. {Number(v.total || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {/* Thermal Ticket / Print Button */}
                      <button
                        onClick={() => onOpenReceipt(v)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition border border-gray-200"
                        title="Ver Ticket Térmico / Reimprimir"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* Copy CUF button if SIAT */}
                      {v.cuf && (
                        <button
                          onClick={() => handleCopyCuf(v.cuf, v.id)}
                          className="p-2 text-gray-600 hover:text-purple-600 hover:bg-purple-50 rounded-xl transition border border-gray-200"
                          title="Copiar Código Único de Facturación (CUF)"
                        >
                          {copiedId === v.id ? (
                            <Check className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      )}

                      {/* WhatsApp Share */}
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(`Hola ${v.cliente_nombre}, le enviamos su comprobante de compra GLORYPOS N° ${v.correlativo} por un monto de Bs. ${Number(v.total).toFixed(2)}. ¡Gracias por su preferencia!`);
                          window.open(`https://wa.me/?text=${msg}`, '_blank');
                        }}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition border border-gray-200"
                        title="Enviar por WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>

                      {/* Anular */}
                      {!isAnulado && (
                        <button
                          onClick={() => handleAnular(v.id, v.correlativo)}
                          className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition border border-gray-200"
                          title="Anular Comprobante"
                        >
                          <Ban className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
              <FileText className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="font-bold text-gray-800 text-sm">No se encontraron comprobantes</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No hay facturas o boletas emitidas que coincidan con la búsqueda o el filtro seleccionado.
              </p>
              <button
                onClick={() => onSelectSubView('pos')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#2563eb] text-white rounded-xl text-xs font-bold shadow-xs hover:bg-blue-700 transition"
              >
                Ir a Nueva Venta POS
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
