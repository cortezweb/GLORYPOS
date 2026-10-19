import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Printer, Share2, Copy, Check, Ban, 
  RefreshCw, Download, Calendar, ChevronDown, MoreVertical, 
  Eye, FileCode, CheckCircle2, X, MessageCircle, File, 
  ChevronLeft, ChevronRight, Send, AlertTriangle, Ticket, FileDown
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { simbolo, nombreMoneda, getCurrencyCode } from '../../utils/currency';
import { toast } from 'sonner';
import { descargarVentaPdf, tituloVenta } from '../../utils/cotizacionPdf';
import { descargarTicketPdf, imprimirTicketPdf } from '../../utils/ticketPdf';
import ComprobantePdfModal from './ComprobantePdfModal';
import ResumenesBajasPanel from './ResumenesBajasPanel';

export default function ComprobantesView({ onSelectSubView, onOpenReceipt }) {
  const { currentUser, empresa, can } = useAuth();

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
  const [pdfMenu, setPdfMenu] = useState(null); // { venta, x, y } — menú fijo para que la tabla no lo recorte
  const [pdfVisor, setPdfVisor] = useState(null); // { venta, formato }
  const [activeActionsMenuId, setActiveActionsMenuId] = useState(null);
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
      setPdfMenu(null);
      setActiveActionsMenuId(null);
    };
    const cerrarMenuPdf = () => setPdfMenu(null);
    window.addEventListener('click', handleClickOutside);
    window.addEventListener('scroll', cerrarMenuPdf, true);
    window.addEventListener('resize', cerrarMenuPdf);
    return () => {
      window.removeEventListener('click', handleClickOutside);
      window.removeEventListener('scroll', cerrarMenuPdf, true);
      window.removeEventListener('resize', cerrarMenuPdf);
    };
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
    const texto = `Hola ${venta.cliente_nombre || 'Cliente'}, le enviamos su comprobante de pago electrónico ${venta.correlativo} emitido por ${empresa?.nombre || 'GLORYPOS'} por un total de ${simbolo()} ${(Number(venta.total) || 0).toFixed(2)}. ¡Gracias por su preferencia!`;
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
  <DocumentCurrencyCode>${getCurrencyCode()}</DocumentCurrencyCode>
  <AccountingSupplierParty>
    <CustomerAssignedAccountID>${empresa?.nit || '20601234567'}</CustomerAssignedAccountID>
    <PartyName><Name>${empresa?.nombre || 'GLORYPOS S.A.C.'}</Name></PartyName>
  </AccountingSupplierParty>
  <AccountingCustomerParty>
    <CustomerAssignedAccountID>${venta.cliente_ci_nit || '99999999'}</CustomerAssignedAccountID>
    <PartyName><Name>${venta.cliente_nombre || 'Clientes Varios'}</Name></PartyName>
  </AccountingCustomerParty>
  <LegalMonetaryTotal>
    <PayableAmount currencyID="${getCurrencyCode()}">${Number(venta.total || 0).toFixed(2)}</PayableAmount>
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
    <div className="flex-1 flex flex-col font-sans relative">

      <main className="w-full p-4 sm:p-6 lg:p-7 space-y-4">
        
        {/* ========================================================= */}
        {/* CABECERA: TÍTULO, SUBTÍTULO Y PESTAÑAS DERECHAS */}
        {/* ========================================================= */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              {activeTab === 'resumenes_bajas' ? 'Resúmenes y comunicaciones de baja' : 'Comprobantes electrónicos'}
            </h1>
            {activeTab !== 'resumenes_bajas' && (
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'notas_credito' ? 'Notas de crédito y débito emitidas.' : 'Facturas y boletas de venta.'}
              </p>
            )}
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
                  ? 'bg-[#FF6B35] text-white shadow-xs'
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
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Notas de crédito/débito
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
                  ? 'bg-[#FF6B35] text-white border-[#FF6B35] shadow-xs'
                  : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Resúmenes y bajas
            </button>

            {/* Botón: Actualizar */}
            {activeTab !== 'resumenes_bajas' && (
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
            )}
          </div>
        </div>

        {activeTab === 'resumenes_bajas' ? (
          <ResumenesBajasPanel
            ventas={ventas}
            empresaId={empresa?.id}
            puedeAnular={can('anular_ventas')}
            onActualizar={loadVentas}
            onVolver={() => { setActiveTab('facturas_boletas'); setCurrentPage(1); }}
          />
        ) : (
        <>
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
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none cursor-pointer pr-8"
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
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
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
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-[#FF6B35] outline-none pr-7 bg-white"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>

              <div className="relative">
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-[#FF6B35] outline-none pr-7 bg-white"
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
                className="border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-800 bg-white focus:border-[#FF6B35] outline-none cursor-pointer"
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
                          {simbolo()} {(Number(v.total) || 0).toFixed(2)}
                        </td>

                        {/* Estado SUNAT */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                            estadoSunat === 'Aceptado'
                              ? 'bg-[#e8f8f0] text-[#FF6B35] border-[#FF6B35]/20'
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

                        {/* PDF: menú (A4 / ticket) + impresión del ticket */}
                        <td className="py-3 px-3 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                const r = e.currentTarget.getBoundingClientRect();
                                setPdfMenu(pdfMenu?.venta.id === v.id ? null : { venta: v, x: Math.min(r.left, window.innerWidth - 220), y: r.bottom + 6 });
                                setActiveActionsMenuId(null);
                              }}
                              className="inline-flex items-center gap-0.5 px-1.5 py-1 border border-red-200 rounded-md bg-red-50 hover:bg-red-100 text-red-600 transition"
                              title="Opciones PDF"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              <ChevronDown className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={() => imprimirTicketPdf(v, empresa, 80, tituloVenta(v.tipo_documento))}
                              className="p-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition"
                              title="Imprimir ticket"
                            >
                              <Printer className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>

                        {/* XML */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDownloadXML(v)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-1 border border-amber-200 rounded-md bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
                            title="Descargar XML firmado"
                          >
                            <FileCode className="w-3.5 h-3.5 text-amber-600" />
                            <ChevronDown className="w-2.5 h-2.5" />
                          </button>
                        </td>

                        {/* CDR */}
                        <td className="py-3 px-2 text-center whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => handleDownloadCDR(v)}
                            className="inline-flex items-center gap-0.5 px-1.5 py-1 border border-blue-200 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-700 transition"
                            title="Descargar CDR (Constancia de Recepción SUNAT)"
                          >
                            <FileText className="w-3.5 h-3.5 text-blue-600" />
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
                              className="inline-flex items-center gap-0.5 px-1.5 py-1 rounded-md border border-green-200 bg-green-50 hover:bg-green-100 text-green-600 transition"
                              title="Enviar por WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 text-green-600" />
                            </button>

                            {/* Botón Menú Tres Puntos */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveActionsMenuId(activeActionsMenuId === v.id ? null : v.id);
                                setPdfMenu(null);
                              }}
                              className="inline-flex items-center gap-0.5 px-1.5 py-1 border border-slate-200 rounded-md text-slate-500 hover:bg-slate-100 transition"
                              title="Más acciones"
                            >
                              <MoreVertical className="w-3.5 h-3.5" />
                              <ChevronDown className="w-3 h-3" />
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
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-[#E85B28] font-medium"
                              >
                                <MessageCircle className="w-3.5 h-3.5 text-[#FF6B35]" />
                                Enviar WhatsApp
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  const email = prompt('Ingresa el correo del cliente:');
                                  if (email) toast.success(`Comprobante ${v.correlativo} enviado a: ${email}`);
                                  setActiveActionsMenuId(null);
                                }}
                                className="w-full px-3 py-2 hover:bg-slate-50 flex items-center gap-2 text-slate-700 font-medium"
                              >
                                <Send className="w-3.5 h-3.5 text-slate-500" />
                                Enviar por Correo
                              </button>
                              {v.estado !== 'ANULADO' && can('anular_ventas') && (
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
        </>
        )}

      </main>

      {/* Menú PDF (posición fija para que la tabla no lo recorte) */}
      {pdfMenu && (
        <div
          onClick={(e) => e.stopPropagation()}
          style={{ left: pdfMenu.x, top: pdfMenu.y }}
          className="fixed w-52 bg-white border border-slate-200 rounded-xl shadow-xl z-40 py-1.5 text-left text-sm"
        >
          {[
            { icono: Eye, texto: 'Ver PDF A4', accion: () => setPdfVisor({ venta: pdfMenu.venta, formato: 'A4' }) },
            { icono: Download, texto: 'Descargar PDF A4', accion: () => descargarVentaPdf(pdfMenu.venta, empresa, pdfMenu.venta.cajero || pdfMenu.venta.registrado_por) },
            { icono: Ticket, texto: 'Ver PDF ticket', accion: () => setPdfVisor({ venta: pdfMenu.venta, formato: 'TICKET' }) },
            { icono: FileDown, texto: 'Descargar PDF ticket', accion: () => descargarTicketPdf(pdfMenu.venta, empresa, 80, tituloVenta(pdfMenu.venta.tipo_documento)) },
          ].map(({ icono: Icono, texto, accion }) => (
            <button
              key={texto}
              type="button"
              onClick={() => { accion(); setPdfMenu(null); }}
              className="w-full px-4 py-2 hover:bg-slate-50 flex items-center gap-2.5 text-slate-700"
            >
              <Icono className="w-4 h-4 text-red-500" />
              {texto}
            </button>
          ))}
        </div>
      )}

      {pdfVisor && (
        <ComprobantePdfModal
          venta={pdfVisor.venta}
          empresa={empresa}
          formato={pdfVisor.formato}
          onClose={() => setPdfVisor(null)}
        />
      )}

      {/* ========================================================= */}
      {/* MODAL: VER DETALLE DEL COMPROBANTE */}
      {/* ========================================================= */}
      {detailSale && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto [&>*]:my-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#FF6B35]" />
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
                  <span className="font-bold text-[#FF6B35]">{detailSale.estado_sunat || 'Aceptado'}</span>
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
                        {simbolo()} {Number(it.subtotal || ((it.cantidad || 1) * (it.precio || 0))).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center text-sm font-black border-t border-slate-100">
                <span>TOTAL:</span>
                <span className="text-[#E85B28]">{simbolo()} {(Number(detailSale.total) || 0).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




