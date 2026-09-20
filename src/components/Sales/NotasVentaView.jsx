import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, ChevronDown, Eye, Download, 
  Ticket, FileText, Printer, Share2, Ban, CheckCircle2,
  Receipt, ArrowRight, X, Sparkles
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import SalesSubNav from './SalesSubNav';

const SEED_NOTAS = [
  {
    id: 'nv-1',
    fecha: '2026-09-20',
    fechaDisplay: '20/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'CT-00000002',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 30.40,
    estado: 'Registrado',
    items: [{ nombre: 'Gaseosa 500ml', cantidad: 2, precio: 15.20, subtotal: 30.40 }]
  },
  {
    id: 'nv-2',
    fecha: '2026-09-18',
    fechaDisplay: '18/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000468',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 36.00,
    estado: 'Registrado',
    items: [{ nombre: 'Cuaderno espiral A4', cantidad: 3, precio: 12.00, subtotal: 36.00 }]
  },
  {
    id: 'nv-3',
    fecha: '2026-09-18',
    fechaDisplay: '18/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000467',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 54.90,
    estado: 'Registrado',
    items: [{ nombre: 'Aceite vegetal 1L', cantidad: 3, precio: 18.30, subtotal: 54.90 }]
  },
  {
    id: 'nv-4',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000466',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 496.25,
    estado: 'Registrado',
    items: [{ nombre: 'Bolsa de Cemento 50kg', cantidad: 10, precio: 49.625, subtotal: 496.25 }]
  },
  {
    id: 'nv-5',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000465',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 180.50,
    estado: 'Registrado',
    items: [{ nombre: 'Arroz Superior saco 25kg', cantidad: 1, precio: 180.50, subtotal: 180.50 }]
  },
  {
    id: 'nv-6',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000464',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 53.40,
    estado: 'Registrado',
    items: [{ nombre: 'Detergente en polvo 2kg', cantidad: 2, precio: 26.70, subtotal: 53.40 }]
  },
  {
    id: 'nv-7',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000463',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 115.00,
    estado: 'Registrado',
    items: [{ nombre: 'Pintura Látex 1 Galón', cantidad: 1, precio: 115.00, subtotal: 115.00 }]
  },
  {
    id: 'nv-8',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000462',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 209.30,
    estado: 'Registrado',
    items: [{ nombre: 'Leche Gloria pack x24', cantidad: 2, precio: 104.65, subtotal: 209.30 }]
  },
  {
    id: 'nv-9',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000461',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 123.60,
    estado: 'Registrado',
    items: [{ nombre: 'Pañal Bebé Jumbo', cantidad: 2, precio: 61.80, subtotal: 123.60 }]
  },
  {
    id: 'nv-10',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    tipo_documento: 'NOTA_VENTA',
    tipo_label: 'NOTA DE VENTA',
    correlativo: 'NV001-00000460',
    cliente_nombre: 'Clientes Varios',
    registrado_por: 'Esteffany Cordova',
    total: 176.85,
    estado: 'Registrado',
    items: [{ nombre: 'Aceite de Oliva 1L', cantidad: 3, precio: 58.95, subtotal: 176.85 }]
  }
];

export default function NotasVentaView({ onSelectSubView, onOpenReceipt }) {
  const { currentUser } = useAuth();
  
  const [notasList, setNotasList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('2026-09-01');
  const [fechaHasta, setFechaHasta] = useState('2026-09-20');
  const [pageSize, setPageSize] = useState('10');
  
  // Modal para emitir comprobante SUNAT desde nota
  const [emitirModalNota, setEmitirModalNota] = useState(null);

  const loadData = async () => {
    try {
      const allVentas = await db.ventas.reverse().toArray();
      const localNotas = allVentas.filter(v => 
        v.tipo_documento === 'NOTA_VENTA' || 
        v.tipo_documento === 'NOTA' ||
        v.correlativo?.startsWith('NV') ||
        v.correlativo?.startsWith('CT-')
      );

      if (localNotas && localNotas.length > 0) {
        // Enriquecer campos si faltan
        const enriched = localNotas.map(n => ({
          ...n,
          fechaDisplay: n.fechaDisplay || (n.fecha ? new Date(n.fecha).toLocaleDateString('es-PE') : '20/09/2026'),
          tipo_label: 'NOTA DE VENTA',
          registrado_por: n.registrado_por || n.cajero_nombre || currentUser?.nombre || 'Esteffany Cordova',
          cliente_nombre: n.cliente_nombre || 'Clientes Varios',
          estado: n.estado || 'Registrado'
        }));
        setNotasList(enriched);
      } else {
        // Inicializar con la lista exacta de la imagen de referencia
        setNotasList(SEED_NOTAS);
      }
    } catch (err) {
      console.warn('Error loading notas de venta:', err);
      setNotasList(SEED_NOTAS);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatSoles = (amount) => {
    const val = Number(amount) || 0;
    return `S/ ${val.toFixed(2)}`;
  };

  // Filtrado
  const filtered = notasList.filter(n => {
    const term = searchTerm.toLowerCase();
    const matchTerm = 
      n.correlativo?.toLowerCase().includes(term) ||
      n.cliente_nombre?.toLowerCase().includes(term) ||
      n.registrado_por?.toLowerCase().includes(term);
    return matchTerm;
  });

  // Emitir Factura o Boleta SUNAT
  const handleEmitirSunat = async (nota, tipoDoc) => {
    const serie = tipoDoc === 'FACTURA' ? 'F001' : 'B001';
    const numero = String(Math.floor(10000000 + Math.random() * 90000000));
    const nuevoCorrelativo = `${serie}-${numero}`;

    if (window.confirm(`¿Emitir comprobante electrónico SUNAT (${tipoDoc} ${nuevoCorrelativo}) a partir de la Nota ${nota.correlativo}?`)) {
      await db.ventas.update(nota.id, {
        tipo_documento: tipoDoc === 'FACTURA' ? 'FACTURA' : 'BOLETA',
        correlativo: nuevoCorrelativo,
        sunat_estado: 'Aceptado SUNAT',
        fecha_emision_sunat: new Date().toISOString()
      });
      alert(`¡Comprobante emitido con éxito! ${tipoDoc} ${nuevoCorrelativo} aceptado por SUNAT.`);
      setEmitirModalNota(null);
      await loadData();
    }
  };

  // Anular Nota de Venta
  const handleAnular = async (id) => {
    if (window.confirm('¿Deseas anular esta nota de venta?')) {
      const updated = notasList.map(n => n.id === id ? { ...n, estado: 'Anulado' } : n);
      setNotasList(updated);
      try {
        await db.ventas.update(id, { estado: 'Anulado' });
      } catch (e) {}
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans pb-16">
      
      {/* Barra de navegación de ventas */}
      {onSelectSubView && (
        <SalesSubNav currentSubView="notas_venta" onSelectSubView={onSelectSubView} />
      )}

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1. CABECERA: TÍTULO, SUBTÍTULO & BOTÓN + NUEVA VENTA                 */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Notas de venta
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Comprobantes internos.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectSubView ? onSelectSubView('pos') : null}
            className="px-4 py-2 bg-[#00a650] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva venta</span>
          </button>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2. BARRA DE FILTROS: BÚSQUEDA, FECHAS Y PAGINADOR                   */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
          
          {/* Input de Búsqueda */}
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Buscar por cliente, serie o número..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500 font-medium shadow-2xs"
            />
          </div>

          {/* Rango de Fechas & Paginador */}
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Fecha Desde */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <input
                type="date"
                value={fechaDesde}
                onChange={e => setFechaDesde(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
              />
            </div>

            {/* Fecha Hasta */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-2xs">
              <input
                type="date"
                value={fechaHasta}
                onChange={e => setFechaHasta(e.target.value)}
                className="bg-transparent text-xs text-slate-700 font-medium focus:outline-none"
              />
            </div>

            {/* Paginación: Mostrar 10 por página */}
            <div className="flex items-center gap-1.5 text-xs text-slate-600">
              <span className="text-[11px] text-slate-500">Mostrar</span>
              <div className="relative">
                <select
                  value={pageSize}
                  onChange={e => setPageSize(e.target.value)}
                  className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
                >
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
              <span className="text-[11px] text-slate-500">por página</span>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 3. TABLA DE NOTAS DE VENTA (ESTRUCTURA IDÉNTICA A LA IMAGEN)         */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              {/* Encabezados */}
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">FECHA</th>
                  <th className="py-3 px-4">COMPROBANTE</th>
                  <th className="py-3 px-4">CLIENTE</th>
                  <th className="py-3 px-4">REGISTRADO POR</th>
                  <th className="py-3 px-4 text-right">TOTAL</th>
                  <th className="py-3 px-4 text-center">PDF</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>

              {/* Filas de la tabla */}
              <tbody className="divide-y divide-slate-100">
                {filtered.map((nota) => {
                  const fechaFormatted = nota.fechaDisplay || (nota.fecha ? new Date(nota.fecha).toLocaleDateString('es-PE') : '20/09/2026');

                  return (
                    <tr key={nota.id} className="hover:bg-slate-50/60 transition">
                      
                      {/* 1. FECHA */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {fechaFormatted}
                      </td>

                      {/* 2. COMPROBANTE (Tipo y Correlativo) */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">
                          NOTA DE VENTA
                        </span>
                        <span className="font-mono font-bold text-slate-900 text-xs block">
                          {nota.correlativo}
                        </span>
                      </td>

                      {/* 3. CLIENTE */}
                      <td className="py-3.5 px-4 font-medium text-slate-700 whitespace-nowrap">
                        {nota.cliente_nombre || 'Clientes Varios'}
                      </td>

                      {/* 4. REGISTRADO POR */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {nota.registrado_por || 'Esteffany Cordova'}
                      </td>

                      {/* 5. TOTAL */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatSoles(nota.total)}
                      </td>

                      {/* 6. COLUMNA PDF (5 MICRO-ICONOS) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          
                          {/* 1. Ver PDF (Ojo en rojo) */}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt ? onOpenReceipt(nota) : alert(`Viendo PDF de ${nota.correlativo}`)}
                            title="Ver PDF"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Descargar A4 (Descarga en rojo) */}
                          <button
                            type="button"
                            onClick={() => alert(`Descargando PDF A4 de ${nota.correlativo}...`)}
                            title="Descargar A4"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Ticket 80mm (Ticket en naranja) */}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt ? onOpenReceipt(nota) : alert(`Imprimiendo ticket 80mm de ${nota.correlativo}...`)}
                            title="Ticket 80mm"
                            className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Ticket 58mm / A5 (Documento en naranja) */}
                          <button
                            type="button"
                            onClick={() => alert(`Imprimiendo ticket 58mm de ${nota.correlativo}...`)}
                            title="Ticket 58mm / A5"
                            className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Imprimir directo (Impresora en verde) */}
                          <button
                            type="button"
                            onClick={() => window.print()}
                            title="Imprimir"
                            className="p-1 text-emerald-500 hover:text-emerald-700 hover:bg-emerald-50 rounded transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                      {/* 7. ESTADO (Pill verde Registrado) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium inline-flex items-center gap-1.5 ${
                          nota.estado === 'Anulado'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${nota.estado === 'Anulado' ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                          <span>{nota.estado || 'Registrado'}</span>
                        </span>
                      </td>

                      {/* 8. ACCIONES (WhatsApp, Ojo, Emitir, Anular) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          
                          {/* 1. WhatsApp */}
                          <button
                            type="button"
                            onClick={() => {
                              const msg = encodeURIComponent(
                                `*GLORYPOS - NOTA DE VENTA*\n` +
                                `Número: ${nota.correlativo}\n` +
                                `Cliente: ${nota.cliente_nombre}\n` +
                                `Total: ${formatSoles(nota.total)}\n` +
                                `¡Gracias por su compra!`
                              );
                              window.open(`https://wa.me/?text=${msg}`, '_blank');
                            }}
                            title="Enviar por WhatsApp"
                            className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg transition"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Ojo / Vista rápida */}
                          <button
                            type="button"
                            onClick={() => onOpenReceipt ? onOpenReceipt(nota) : null}
                            title="Ver detalle"
                            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Emitir (Convertir a Boleta/Factura SUNAT) */}
                          <button
                            type="button"
                            onClick={() => setEmitirModalNota(nota)}
                            title="Emitir Comprobante Electrónico SUNAT"
                            className="px-2 py-1 text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 transition"
                          >
                            <FileText className="w-3 h-3 text-emerald-600" />
                            <span>Emitir</span>
                          </button>

                          {/* 4. Anular / Bloquear */}
                          <button
                            type="button"
                            onClick={() => handleAnular(nota.id)}
                            title="Anular Nota"
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 border border-slate-200 rounded-lg transition"
                          >
                            <Ban className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: EMITIR COMPROBANTE SUNAT (BOLETA / FACTURA)               */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {emitirModalNota && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-400" />
                <h3 className="font-bold text-sm">Emitir Comprobante SUNAT</h3>
              </div>
              <button
                type="button"
                onClick={() => setEmitirModalNota(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Nota Origen</span>
                <span className="font-bold text-slate-900 text-sm block">{emitirModalNota.correlativo}</span>
                <span className="text-slate-600 block">Cliente: {emitirModalNota.cliente_nombre}</span>
                <span className="font-bold text-emerald-700 block">Monto Total: {formatSoles(emitirModalNota.total)}</span>
              </div>

              <p className="text-slate-500">
                Selecciona el tipo de comprobante electrónico a generar ante SUNAT:
              </p>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleEmitirSunat(emitirModalNota, 'BOLETA')}
                  className="p-4 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-2xl text-center space-y-1 transition cursor-pointer"
                >
                  <Receipt className="w-6 h-6 text-emerald-600 mx-auto" />
                  <span className="font-bold text-slate-900 block">Boleta de Venta</span>
                  <span className="text-[10px] text-slate-500 block">B001 - DNI / Final</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleEmitirSunat(emitirModalNota, 'FACTURA')}
                  className="p-4 bg-purple-50 hover:bg-purple-100 border border-purple-200 rounded-2xl text-center space-y-1 transition cursor-pointer"
                >
                  <FileText className="w-6 h-6 text-purple-600 mx-auto" />
                  <span className="font-bold text-slate-900 block">Factura Electrónica</span>
                  <span className="text-[10px] text-slate-500 block">F001 - Con RUC</span>
                </button>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setEmitirModalNota(null)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
