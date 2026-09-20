import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Printer, Share2, Copy, Check, Ban, 
  RefreshCw, Download, Calendar, ChevronDown, MoreVertical, 
  Eye, FileCode, CheckCircle2, X, MessageCircle, File, 
  ChevronLeft, ChevronRight, Send, AlertTriangle
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import SalesSubNav from './SalesSubNav';

export default function ComprobantesView({ onSelectSubView, onOpenReceipt }) {
  const { currentUser, empresa } = useAuth();

  // Pestañas superiores
  const [activeTab, setActiveTab] = useState('facturas_boletas'); // 'facturas_boletas', 'notas_credito', 'resumenes_bajas'
  
  // Filtros
  const [filterEstado, setFilterEstado] = useState('ALL'); // 'ALL', 'Aceptado', 'Pendiente', 'Anulado'
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState('2026-07-01');
  const [fechaHasta, setFechaHasta] = useState('2026-07-24');
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);

  // Estados de datos
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(false);

  // Estados de popovers y modales
  const [activePdfMenuId, setActivePdfMenuId] = useState(null);
  const [activeActionsMenuId, setActiveActionsMenuId] = useState(null);
  const [previewA4Sale, setPreviewA4Sale] = useState(null);
  const [detailSale, setDetailSale] = useState(null);

  // Cargar ventas desde Dexie
  const loadVentas = async () => {
    setLoading(true);
    try {
      let list = await db.ventas.reverse().toArray();

      // Si no hay suficientes ventas o está vacío, sembrar registros representativos
      if (!list || list.length < 5) {
        const sampleSeed = [
          {
            id: 'vta-seed-1',
            fecha: '2026-07-24T10:15:00',
            tipo_documento: 'FACTURA',
            tipo_label: 'FACTURA',
            correlativo: 'F001-00000051',
            cliente_nombre: 'NEGOCIOS DIGITALES GLORYPOS S.A.C.',
            cliente_ci_nit: '20608945123',
            registrado_por: 'JOSE LUIS',
            total: 154.52,
            subtotal: 130.95,
            igv: 23.57,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Disco Duro SSD 480GB Kingston', cantidad: 1, precio: 120.00, subtotal: 120.00 },
              { nombre: 'Cable HDMI 2.0 4K 1.8M', cantidad: 1, precio: 34.52, subtotal: 34.52 }
            ]
          },
          {
            id: 'vta-seed-2',
            fecha: '2026-07-24T11:00:00',
            tipo_documento: 'BOLETA',
            tipo_label: 'BOLETA',
            correlativo: 'B001-00000085',
            cliente_nombre: 'ZAPANA CHOQUEMAQUE, EDWIN RAFAEL',
            cliente_ci_nit: '71234568',
            registrado_por: 'JOSE LUIS',
            total: 120.75,
            subtotal: 102.33,
            igv: 18.42,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Teclado Mecánico RGB Redragon', cantidad: 1, precio: 120.75, subtotal: 120.75 }
            ]
          },
          {
            id: 'vta-seed-3',
            fecha: '2026-07-24T11:32:00',
            tipo_documento: 'BOLETA',
            tipo_label: 'BOLETA',
            correlativo: 'B001-00000084',
            cliente_nombre: 'Clientes Varios',
            cliente_ci_nit: '99999999',
            registrado_por: 'JOSE LUIS',
            total: 88.25,
            subtotal: 74.79,
            igv: 13.46,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Mouse Óptico Inalámbrico Logitech', cantidad: 1, precio: 88.25, subtotal: 88.25 }
            ]
          },
          {
            id: 'vta-seed-4',
            fecha: '2026-07-24T12:05:00',
            tipo_documento: 'FACTURA',
            tipo_label: 'FACTURA',
            correlativo: 'F001-00000050',
            cliente_nombre: 'CONSORCIO MINERO DEL SUR S.A.C.',
            cliente_ci_nit: '20556677889',
            registrado_por: 'JOSE LUIS',
            total: 245.30,
            subtotal: 207.88,
            igv: 37.42,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Cartucho Tóner HP LaserJet Original', cantidad: 1, precio: 245.30, subtotal: 245.30 }
            ]
          },
          {
            id: 'vta-seed-5',
            fecha: '2026-07-24T13:40:00',
            tipo_documento: 'FACTURA',
            tipo_label: 'FACTURA',
            correlativo: 'F001-00000049',
            cliente_nombre: 'DISTRIBUIDORA INDUSTRIAL AREQUIPA S.R.L.',
            cliente_ci_nit: '20448899112',
            registrado_por: 'JOSE LUIS',
            total: 340.95,
            subtotal: 288.94,
            igv: 52.01,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Pack Papel Bond A4 75g (Caja x 5 millares)', cantidad: 2, precio: 170.47, subtotal: 340.95 }
            ]
          },
          {
            id: 'vta-seed-6',
            fecha: '2026-07-24T14:15:00',
            tipo_documento: 'BOLETA',
            tipo_label: 'BOLETA',
            correlativo: 'B001-00000083',
            cliente_nombre: 'QUISPE SUCASAIRE, LEANDRA VANESSA',
            cliente_ci_nit: '45892147',
            registrado_por: 'JOSE LUIS',
            total: 746.75,
            subtotal: 632.84,
            igv: 113.91,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Monitor Gaming LED 24" 144Hz', cantidad: 1, precio: 746.75, subtotal: 746.75 }
            ]
          },
          {
            id: 'vta-seed-7',
            fecha: '2026-07-24T15:20:00',
            tipo_documento: 'BOLETA',
            tipo_label: 'BOLETA',
            correlativo: 'B001-00000082',
            cliente_nombre: 'Clientes Varios',
            cliente_ci_nit: '99999999',
            registrado_por: 'JOSE LUIS',
            total: 599.97,
            subtotal: 508.45,
            igv: 91.52,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Impresora Multifuncional WiFi', cantidad: 1, precio: 599.97, subtotal: 599.97 }
            ]
          },
          {
            id: 'vta-seed-8',
            fecha: '2026-07-24T16:00:00',
            tipo_documento: 'FACTURA',
            tipo_label: 'FACTURA',
            correlativo: 'F001-00000048',
            cliente_nombre: 'INGENIERÍA Y CONSTRUCCIÓN S.A.C.',
            cliente_ci_nit: '20601122334',
            registrado_por: 'JOSE LUIS',
            total: 86.90,
            subtotal: 73.64,
            igv: 13.26,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Resma Papel Continuo 3 Partes', cantidad: 1, precio: 86.90, subtotal: 86.90 }
            ]
          },
          {
            id: 'vta-seed-9',
            fecha: '2026-07-24T16:45:00',
            tipo_documento: 'BOLETA',
            tipo_label: 'BOLETA',
            correlativo: 'B001-00000081',
            cliente_nombre: 'Clientes Varios',
            cliente_ci_nit: '99999999',
            registrado_por: 'JOSE LUIS',
            total: 76.50,
            subtotal: 64.83,
            igv: 11.67,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Memoria USB 64GB Kingston 3.2', cantidad: 1, precio: 76.50, subtotal: 76.50 }
            ]
          },
          {
            id: 'vta-seed-10',
            fecha: '2026-07-24T17:10:00',
            tipo_documento: 'FACTURA',
            tipo_label: 'FACTURA',
            correlativo: 'F001-00000047',
            cliente_nombre: 'SERVICIOS INDUSTRIALES DEL PERU S.A.C.',
            cliente_ci_nit: '20509988776',
            registrado_por: 'JOSE LUIS',
            total: 155.05,
            subtotal: 131.40,
            igv: 23.65,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [
              { nombre: 'Soporte Metálico para Monitor Dual', cantidad: 1, precio: 155.05, subtotal: 155.05 }
            ]
          },
          {
            id: 'vta-seed-11',
            fecha: '2026-07-23T11:20:00',
            tipo_documento: 'FACTURA',
            tipo_label: 'FACTURA',
            correlativo: 'F001-00000046',
            cliente_nombre: 'COMERCIALIZADORA EL SOL S.A.',
            cliente_ci_nit: '20102030405',
            registrado_por: 'JOSE LUIS',
            total: 412.00,
            subtotal: 349.15,
            igv: 62.85,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [{ nombre: 'Router Inalámbrico Gigabit Dual Band', cantidad: 2, precio: 206.00, subtotal: 412.00 }]
          },
          {
            id: 'vta-seed-12',
            fecha: '2026-07-22T09:40:00',
            tipo_documento: 'BOLETA',
            tipo_label: 'BOLETA',
            correlativo: 'B001-00000080',
            cliente_nombre: 'MENDOZA VARGAS, CARLOS ALBERTO',
            cliente_ci_nit: '43990011',
            registrado_por: 'JOSE LUIS',
            total: 95.00,
            subtotal: 80.51,
            igv: 14.49,
            estado_sunat: 'Aceptado',
            estado: 'EMITIDO',
            items: [{ nombre: 'Auriculares con Micrófono USB', cantidad: 1, precio: 95.00, subtotal: 95.00 }]
          }
        ];

        for (const s of sampleSeed) {
          const exists = await db.ventas.get(s.id);
          if (!exists) {
            await db.ventas.add(s);
          }
        }
        list = await db.ventas.reverse().toArray();
      }

      setVentas(list);
    } catch (err) {
      console.error('Error al cargar ventas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVentas();
  }, []);

  // Cerrar popovers al hacer click fuera
  useEffect(() => {
    const handleClickOutside = () => {
      setActivePdfMenuId(null);
      setActiveActionsMenuId(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  // Filtrado de comprobantes
  const filteredVentas = useMemo(() => {
    return ventas.filter((v) => {
      // Filtro por pestaña
      const tipo = (v.tipo_documento || '').toUpperCase();
      if (activeTab === 'facturas_boletas') {
        if (tipo === 'NOTA_CREDITO' || tipo === 'NOTA DE CRÉDITO') return false;
      } else if (activeTab === 'notas_credito') {
        if (tipo !== 'NOTA_CREDITO' && tipo !== 'NOTA DE CRÉDITO') return false;
      }

      // Filtro por estado
      const est = v.estado_sunat || (v.estado === 'ANULADO' ? 'Anulado' : 'Aceptado');
      if (filterEstado !== 'ALL' && est.toLowerCase() !== filterEstado.toLowerCase()) {
        return false;
      }

      // Filtro por término de búsqueda (cliente, serie, número)
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchesCorrelativo = v.correlativo?.toLowerCase().includes(q);
        const matchesCliente = v.cliente_nombre?.toLowerCase().includes(q);
        const matchesNit = v.cliente_ci_nit?.includes(q);
        if (!matchesCorrelativo && !matchesCliente && !matchesNit) {
          return false;
        }
      }

      return true;
    });
  }, [ventas, activeTab, filterEstado, searchTerm]);

  // Paginación
  const totalItems = filteredVentas.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedVentas = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return filteredVentas.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredVentas, currentPage, itemsPerPage]);

  // Anular comprobante
  const handleAnularComprobante = async (venta) => {
    if (window.confirm(`¿Estás seguro de anular el comprobante ${venta.correlativo}? Se registrará como anulado ante SUNAT / SIAT.`)) {
      await db.ventas.update(venta.id, { 
        estado: 'ANULADO',
        estado_sunat: 'Anulado'
      });
      await loadVentas();
    }
  };

  // Enviar por WhatsApp
  const handleSendWhatsApp = (venta) => {
    const texto = `Hola ${venta.cliente_nombre || 'Cliente'}, le enviamos su comprobante de pago electrónico ${venta.correlativo} emitido por ${empresa?.nombre || 'GLORYPOS'} por un total de S/ ${(Number(venta.total) || 0).toFixed(2)}. ¡Gracias por su preferencia!`;
    const url = `https://wa.me/?text=${encodeURIComponent(texto)}`;
    window.open(url, '_blank');
  };

  // Descargar XML simulado
  const handleDownloadXML = (venta) => {
    const xmlContent = `<?xml version="1.0" encoding="ISO-8859-1"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2">
  <ID>${venta.correlativo}</ID>
  <IssueDate>${(venta.fecha || '').slice(0, 10)}</IssueDate>
  <InvoiceTypeCode>${venta.tipo_documento === 'FACTURA' ? '01' : '03'}</InvoiceTypeCode>
  <DocumentCurrencyCode>PEN</DocumentCurrencyCode>
  <AccountingSupplierParty>
    <CustomerAssignedAccountID>${empresa?.nit || '20601234567'}</CustomerAssignedAccountID>
    <PartyName><Name>${empresa?.nombre || 'GLORYPOS S.A.C.'}</Name></PartyName>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <CustomerAssignedAccountID>${venta.cliente_ci_nit || '99999999'}</CustomerAssignedAccountID>
    <PartyName><Name>${venta.cliente_nombre || 'Clientes Varios'}</Name></PartyName>
  </AccountingCustomerParty>
  <LegalMonetaryTotal>
    <PayableAmount currencyID="PEN">${Number(venta.total || 0).toFixed(2)}</PayableAmount>
  </LegalMonetaryTotal>
</Invoice>`;
    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${empresa?.nit || '20601234567'}-${venta.tipo_documento === 'FACTURA' ? '01' : '03'}-${venta.correlativo}.xml`;
    link.click();
  };

  // Descargar CDR simulado
  const handleDownloadCDR = (venta) => {
    const cdrContent = `<?xml version="1.0" encoding="ISO-8859-1"?>
<ApplicationResponse xmlns="urn:oasis:names:specification:ubl:schema:xsd:ApplicationResponse-2">
  <ID>R-${venta.correlativo}</ID>
  <ResponseDate>${new Date().toISOString().slice(0, 10)}</ResponseDate>
  <DocumentResponse>
    <Response>
      <ResponseCode>0</ResponseCode>
      <Description>El comprobante ${venta.correlativo} ha sido ACEPTADO</Description>
    </Response>
  </DocumentResponse>
</ApplicationResponse>`;
    const blob = new Blob([cdrContent], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `R-${empresa?.nit || '20601234567'}-${venta.correlativo}.xml`;
    link.click();
  };

  // Formato de fecha DD/MM/YYYY
  const formatDateDisplay = (dateString) => {
    if (!dateString) return '24/07/2026';
    try {
      const d = new Date(dateString);
      if (isNaN(d.getTime())) return dateString;
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return dateString;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen font-sans relative pb-16">
      {/* Subnavegación de Ventas */}
      <SalesSubNav currentSubView="ventas_comprobantes" onSelectSubView={onSelectSubView} />

      <main className="max-w-[1360px] mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ========================================================= */}
        {/* CABECERA: TÍTULO, SUBTÍTULO Y PESTAÑAS DERECHAS */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Comprobantes electrónicos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Facturas y boletas de venta.
            </p>
          </div>

          {/* Pestañas superiores / Toolbar estilo imagen */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Pestaña: Facturas y boletas (Activa) */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('facturas_boletas');
                setCurrentPage(1);
              }}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                activeTab === 'facturas_boletas'
                  ? 'bg-[#00a650] text-white shadow-xs'
                  : 'bg-white border border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              Facturas y boletas
            </button>

            {/* Pestaña: Notas de crédito */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('notas_credito');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition ${
                activeTab === 'notas_credito'
                  ? 'bg-[#00a650] text-white border-[#00a650] shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Notas de crédito
            </button>

            {/* Pestaña: Resúmenes y bajas */}
            <button
              type="button"
              onClick={() => {
                setActiveTab('resumenes_bajas');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-semibold border flex items-center gap-1.5 transition ${
                activeTab === 'resumenes_bajas'
                  ? 'bg-[#00a650] text-white border-[#00a650] shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Resúmenes y bajas
            </button>

            {/* Botón: Actualizar */}
            <button
              type="button"
              onClick={loadVentas}
              disabled={loading}
              className="px-3 py-1.5 rounded-full text-xs font-semibold border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 flex items-center gap-1.5 transition shadow-2xs active:scale-95"
              title="Actualizar listado"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
              Actualizar
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRA DE FILTROS: ESTADO, BÚSQUEDA, FECHAS, PAGINACIÓN */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-3 sm:p-4 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          
          {/* Lado Izquierdo: Selector de Estados y Buscador */}
          <div className="flex flex-col sm:flex-row items-center gap-2.5 flex-1 max-w-2xl">
            {/* Selector de Estado */}
            <div className="relative w-full sm:w-44 shrink-0">
              <select
                value={filterEstado}
                onChange={(e) => {
                  setFilterEstado(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer pr-8"
              >
                <option value="ALL">Todos los estados</option>
                <option value="Aceptado">Aceptado</option>
                <option value="Pendiente">Pendiente</option>
                <option value="Anulado">Anulado</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Buscador */}
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por cliente, serie o número..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {/* Lado Derecho: Rango de Fechas y Mostrar Por Página */}
          <div className="flex flex-wrap items-center justify-end gap-2.5">
            {/* Fechas */}
            <div className="flex items-center gap-1.5">
              <div className="relative">
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-emerald-500 outline-none pr-7 bg-white"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-emerald-500 outline-none pr-7 bg-white"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            {/* Paginación selector */}
            <div className="flex items-center gap-1.5 text-xs text-slate-500">
              <span className="font-medium">Mostrar</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-white focus:border-emerald-500 outline-none cursor-pointer"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
              <span className="font-medium">por página</span>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TABLA PRINCIPAL DE COMPROBANTES ELECTRÓNICOS */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto min-h-[380px]">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-3 min-w-[95px]">FECHA</th>
                  <th className="py-3 px-3 min-w-[130px]">COMPROBANTE</th>
                  <th className="py-3 px-3 min-w-[220px]">CLIENTE</th>
                  <th className="py-3 px-3 min-w-[120px]">REGISTRADO POR</th>
                  <th className="py-3 px-3 min-w-[95px]">TOTAL</th>
                  <th className="py-3 px-3 text-center min-w-[110px]">ESTADO SUNAT</th>
                  <th className="py-3 px-2 text-center min-w-[50px]">CPE</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">PDF</th>
                  <th className="py-3 px-2 text-center min-w-[55px]">XML</th>
                  <th className="py-3 px-2 text-center min-w-[55px]">CDR</th>
                  <th className="py-3 px-3 text-center min-w-[80px]">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedVentas.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="py-16 text-center text-slate-400">
                      No se encontraron comprobantes electrónicos con los filtros seleccionados.
                    </td>
                  </tr>
                ) : (
                  paginatedVentas.map((v) => {
                    const tipoDoc = (v.tipo_documento || 'BOLETA').toUpperCase();
                    const estadoSunat = v.estado_sunat || (v.estado === 'ANULADO' ? 'Anulado' : 'Aceptado');
                    const usuarioReg = v.registrado_por || currentUser?.nombre || 'JOSE LUIS';

                    return (
                      <tr key={v.id} className="hover:bg-slate-50/70 transition">
                        
                        {/* Fecha */}
                        <td className="py-3 px-3 text-slate-600 text-xs font-medium whitespace-nowrap">
                          {formatDateDisplay(v.fecha)}
                        </td>

                        {/* Comprobante: Tipo + Correlativo */}
                        <td className="py-3 px-3 whitespace-nowrap">
                          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                            {tipoDoc.includes('FACTURA') ? 'FACTURA' : tipoDoc.includes('BOLETA') ? 'BOLETA' : tipoDoc}
                          </div>
                          <div className="font-mono font-bold text-slate-800 text-xs">
                            {v.correlativo || `B001-${String(v.id).slice(-6)}`}
                          </div>
                        </td>

                        {/* Cliente */}
                        <td className="py-3 px-3">
                          <div className="font-semibold text-slate-800 text-xs max-w-[260px] truncate" title={v.cliente_nombre}>
                            {v.cliente_nombre || 'Clientes Varios'}
                          </div>
                          {v.cliente_ci_nit && v.cliente_ci_nit !== '99999999' && (
                            <div className="text-[10px] text-slate-400">
                              {v.cliente_ci_nit}
                            </div>
                          )}
                        </td>

                        {/* Registrado Por */}
                        <td className="py-3 px-3 text-slate-600 font-semibold text-xs whitespace-nowrap uppercase">
                          {usuarioReg}
                        </td>

                        {/* Total */}
                        <td className="py-3 px-3 font-black text-slate-900 text-xs whitespace-nowrap">
                          S/ {(Number(v.total) || 0).toFixed(2)}
                        </td>

                        {/* Estado SUNAT */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            estadoSunat === 'Aceptado'
                              ? 'bg-[#e8f8f0] text-[#00a650] border-emerald-200'
                              : estadoSunat === 'Anulado'
                              ? 'bg-red-50 text-red-600 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                          }`}>
                            {estadoSunat}
                          </span>
                        </td>

                        {/* CPE */}
                        <td className="py-3 px-2 text-center text-slate-400 text-xs">
                          —
                        </td>

                        {/* PDF: Icono PDF Rojo + Botón Impresión Azul */}
                        <td className="py-3 px-3 text-center whitespace-nowrap relative">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botón Menú PDF Rojo */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActivePdfMenuId(activePdfMenuId === v.id ? null : v.id);
                                setActiveActionsMenuId(null);
                              }}
                              className="p-1 border border-slate-200 rounded-md hover:bg-slate-100 transition text-red-500 shadow-2xs"
                              title="Opciones PDF"
                            >
                              <FileText className="w-3.5 h-3.5 text-red-500" />
                            </button>

                            {/* Botón Imprimir Azul */}
                            <button
                              type="button"
                              onClick={() => {
                                if (onOpenReceipt) onOpenReceipt(v);
                              }}
                              className="p-1 bg-[#0066cc] hover:bg-blue-700 text-white rounded-md transition shadow-2xs"
                              title="Imprimir Ticket"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Popover Menú PDF desplegable (como en la imagen) */}
                          {activePdfMenuId === v.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute left-1/2 -translate-x-1/2 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewA4Sale(v);
                                  setActivePdfMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-red-500" />
                                Ver PDF A4
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setPreviewA4Sale(v);
                                  setActivePdfMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                              >
                                <Download className="w-3.5 h-3.5 text-red-500" />
                                Descargar PDF A4
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenReceipt) onOpenReceipt(v);
                                  setActivePdfMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium border-t border-slate-100"
                              >
                                <File className="w-3.5 h-3.5 text-slate-500" />
                                Ver PDF ticket
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  if (onOpenReceipt) onOpenReceipt(v);
                                  setActivePdfMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                              >
                                <Download className="w-3.5 h-3.5 text-slate-500" />
                                Descargar PDF ticket
                              </button>
                            </div>
                          )}
                        </td>

                        {/* XML */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDownloadXML(v)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-1 border border-amber-300 rounded-md bg-amber-50/70 hover:bg-amber-100 text-amber-800 transition text-[10px] font-bold"
                            title="Descargar XML firmado"
                          >
                            <FileCode className="w-3 h-3 text-amber-600" />
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </td>

                        {/* CDR */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDownloadCDR(v)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-1 border border-blue-200 rounded-md bg-blue-50/70 hover:bg-blue-100 text-blue-800 transition text-[10px] font-bold"
                            title="Descargar CDR (Constancia de Recepción SUNAT)"
                          >
                            <FileText className="w-3 h-3 text-blue-600" />
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </td>

                        {/* ACCIONES: WhatsApp + Menú de tres puntos */}
                        <td className="py-3 px-3 text-center whitespace-nowrap relative">
                          <div className="inline-flex items-center gap-1.5">
                            {/* Botón WhatsApp */}
                            <button
                              type="button"
                              onClick={() => handleSendWhatsApp(v)}
                              className="w-7 h-7 rounded-full border border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center transition shadow-2xs"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5 text-[#00a650]" />
                            </button>

                            {/* Botón Menú Tres Puntos */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionsMenuId(activeActionsMenuId === v.id ? null : v.id);
                                setActivePdfMenuId(null);
                              }}
                              className="p-1 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-100 transition shadow-2xs"
                              title="Más acciones"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          {/* Popover Más Acciones */}
                          {activeActionsMenuId === v.id && (
                            <div 
                              onClick={(e) => e.stopPropagation()}
                              className="absolute right-3 top-full mt-1 w-44 bg-white border border-slate-200 rounded-xl shadow-xl z-30 py-1.5 text-left text-xs animate-in fade-in zoom-in-95 duration-100"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setDetailSale(v);
                                  setActiveActionsMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-500" />
                                Ver detalle
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  handleSendWhatsApp(v);
                                  setActiveActionsMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-emerald-700 font-medium"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                                Enviar WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const email = prompt('Ingresa el correo del cliente:');
                                  if (email) alert(`Comprobante ${v.correlativo} enviado a: ${email}`);
                                  setActiveActionsMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                              >
                                <Send className="w-3.5 h-3.5 text-slate-500" />
                                Enviar por Correo
                              </button>
                              {v.estado !== 'ANULADO' && (
                                <button
                                  type="button"
                                  onClick={() => {
                                    handleAnularComprobante(v);
                                    setActiveActionsMenuId(null);
                                  }}
                                  className="w-full px-3 py-2 hover:bg-red-50 flex items-center gap-2 text-red-600 font-medium border-t border-slate-100"
                                >
                                  <Ban className="w-3.5 h-3.5 text-red-500" />
                                  Anular Comprobante
                                </button>
                              )}
                            </div>
                          )}
                        </td>

                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ========================================================= */}
        {/* PIE DE PÁGINA: PAGINACIÓN Y CONTADOR */}
        {/* ========================================================= */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-600 pt-1">
          <div>
            Mostrando <span className="font-bold text-slate-800">{totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span>-
            <span className="font-bold text-slate-800">{Math.min(currentPage * itemsPerPage, totalItems)}</span> de{' '}
            <span className="font-bold text-slate-800">{totalItems}</span> comprobantes
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
            >
              Anterior
            </button>

            <span className="px-2 font-medium text-slate-700">
              Página <strong className="text-slate-900">{currentPage}</strong> de <strong className="text-slate-900">{totalPages}</strong>
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white font-medium hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition shadow-2xs"
            >
              Siguiente
            </button>
          </div>
        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: VISTA PREVIA PDF FORMATO A4 */}
      {/* ========================================================= */}
      {previewA4Sale && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-3xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-red-500" />
                <h3 className="font-bold text-sm text-slate-800">
                  Vista Previa PDF A4 — {previewA4Sale.correlativo}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimir
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewA4Sale(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex justify-center">
              {/* Hoja A4 simulada */}
              <div className="bg-white w-full max-w-2xl p-8 rounded-lg shadow-md border border-slate-200 text-slate-800 text-xs space-y-6">
                
                {/* Cabecera A4 */}
                <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                  <div>
                    <h2 className="text-base font-black text-slate-900 uppercase">
                      {empresa?.nombre || 'GLORYPOS SISTEMAS S.A.C.'}
                    </h2>
                    <p className="text-[11px] text-slate-500 uppercase mt-0.5">
                      {empresa?.direccion || 'CAL. PALACIO VIEJO NRO. 210 URB. CERCADO - AREQUIPA'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      RUC: {empresa?.nit || '20601234567'} • Tel: {empresa?.telefono || '935006519'}
                    </p>
                  </div>

                  <div className="border-2 border-slate-800 rounded-lg p-3 text-center min-w-[200px] bg-slate-50">
                    <div className="font-bold text-xs">R.U.C. N° {empresa?.nit || '20601234567'}</div>
                    <div className="font-black text-sm my-1 text-slate-900 uppercase tracking-wide">
                      {previewA4Sale.tipo_documento === 'FACTURA' ? 'FACTURA ELECTRÓNICA' : 'BOLETA DE VENTA ELECTRÓNICA'}
                    </div>
                    <div className="font-mono font-bold text-xs text-slate-800">
                      N° {previewA4Sale.correlativo}
                    </div>
                  </div>
                </div>

                {/* Datos del Cliente y Emisión */}
                <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px]">
                  <div>
                    <span className="font-bold text-slate-500 block">SEÑOR(ES):</span>
                    <span className="font-bold text-slate-800 text-xs">{previewA4Sale.cliente_nombre}</span>
                    <span className="text-slate-500 block mt-1">DOC / RUC: {previewA4Sale.cliente_ci_nit}</span>
                  </div>
                  <div>
                    <span className="font-bold text-slate-500 block">FECHA DE EMISIÓN:</span>
                    <span className="font-bold text-slate-800">{formatDateDisplay(previewA4Sale.fecha)}</span>
                    <span className="text-slate-500 block mt-1">MONEDA: SOLES (PEN)</span>
                  </div>
                </div>

                {/* Tabla de Productos */}
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-[10px] text-slate-600 uppercase">
                      <th className="py-2 px-2">CANT.</th>
                      <th className="py-2 px-2">DESCRIPCIÓN</th>
                      <th className="py-2 px-2 text-right">P. UNIT.</th>
                      <th className="py-2 px-2 text-right">TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-xs">
                    {(previewA4Sale.items || []).map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-2 font-bold">{it.cantidad}</td>
                        <td className="py-2 px-2 font-medium">{it.nombre || it.descripcion}</td>
                        <td className="py-2 px-2 text-right">S/ {Number(it.precio || it.precio_unitario || 0).toFixed(2)}</td>
                        <td className="py-2 px-2 text-right font-bold">S/ {Number(it.subtotal || ((it.cantidad || 1) * (it.precio || 0))).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Totales */}
                <div className="flex justify-end pt-3 border-t border-slate-200">
                  <div className="w-56 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Op. Gravada:</span>
                      <span className="font-semibold text-slate-700">
                        S/ {((Number(previewA4Sale.total) || 0) / 1.18).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>I.G.V. (18%):</span>
                      <span className="font-semibold text-slate-700">
                        S/ {((Number(previewA4Sale.total) || 0) - ((Number(previewA4Sale.total) || 0) / 1.18)).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm font-black text-slate-900 pt-1 border-t border-slate-300">
                      <span>IMPORTE TOTAL:</span>
                      <span>S/ {(Number(previewA4Sale.total) || 0).toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                {/* Pie Fiscal */}
                <div className="pt-4 border-t border-slate-200 text-center text-[10px] text-slate-400">
                  Representación impresa de la Factura / Boleta Electrónica generada por GLORYPOS.
                  Consulte su validez en el portal oficial de SUNAT.
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: VER DETALLE DEL COMPROBANTE */}
      {/* ========================================================= */}
      {detailSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  Detalle del Comprobante {detailSale.correlativo}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setDetailSale(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-500">Cliente:</span>
                  <span className="font-bold text-slate-800">{detailSale.cliente_nombre}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Documento / NIT:</span>
                  <span className="font-mono text-slate-700">{detailSale.cliente_ci_nit}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha:</span>
                  <span className="text-slate-700">{formatDateDisplay(detailSale.fecha)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Estado:</span>
                  <span className="font-bold text-emerald-600">{detailSale.estado_sunat || 'Aceptado'}</span>
                </div>
              </div>

              <div>
                <h4 className="font-bold text-slate-700 mb-1.5 uppercase text-[11px]">Ítems Comprobante</h4>
                <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100">
                  {(detailSale.items || []).map((it, idx) => (
                    <div key={idx} className="p-2.5 flex justify-between items-center text-xs">
                      <div>
                        <span className="font-bold text-slate-800">{it.cantidad}x </span>
                        <span className="text-slate-700">{it.nombre || it.descripcion}</span>
                      </div>
                      <span className="font-bold text-slate-900">
                        S/ {Number(it.subtotal || ((it.cantidad || 1) * (it.precio || 0))).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm font-black border-t border-slate-100">
                <span>TOTAL:</span>
                <span className="text-emerald-700">S/ {(Number(detailSale.total) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
