import React, { useState, useEffect, useMemo } from 'react';
import EstadoVacio from '../Common/EstadoVacio';
import { 
  Plus, Search, Calendar, ChevronDown, Eye, Download, 
  Ticket, FileText, Mail, Printer, ShoppingCart, 
  Trash2, Edit, X, Check, CheckCircle2, Share2, Sparkles,
  FileSpreadsheet, ChevronLeft, ChevronRight, Pencil, Zap, Receipt
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useCart } from '../../context/CartContext';
import { simbolo } from '../../utils/currency';
import { isDemoMode } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';
import { descargarCotizacionPdf } from '../../utils/cotizacionPdf';
import { descargarTicketPdf } from '../../utils/ticketPdf';
import { convertirCotizacionEnVenta, TIPOS_CONVERSION, METODOS_CONVERSION } from '../../services/cotizacionService';
import CotizacionPdfModal from './CotizacionPdfModal';
import CotizacionEmailModal from './CotizacionEmailModal';
import { toast } from 'sonner';

const SEED_COTIZACIONES = [
  {
    id: 'cot-1',
    fecha: '2026-09-17',
    fechaDisplay: '17/09/2026',
    correlativo: 'CT01-00000012',
    cliente_nombre: 'CARRASCO HANCCO, BERLY ADEMIR',
    cliente_ci_nit: '71829304',
    cliente_telefono: '984123456',
    total: 61.80,
    estado: 'Borrador',
    validez_dias: 15,
    items: [
      { id: '1', nombre: 'Guantes shawa X10', cantidad: 2, precio: 30.90, subtotal: 61.80 }
    ]
  },
  {
    id: 'cot-2',
    fecha: '2026-09-16',
    fechaDisplay: '16/09/2026',
    correlativo: 'CT01-00000011',
    cliente_nombre: 'MUNICIPALIDAD DEL CENTRO POBLADO DE SAN LORENZO DE COQUIN',
    cliente_ci_nit: '20584910291',
    cliente_telefono: '992345678',
    total: 400.00,
    estado: 'Borrador',
    validez_dias: 30,
    items: [
      { id: '2', nombre: 'Ladrillo King Kong (Millar)', cantidad: 1, precio: 400.00, subtotal: 400.00 }
    ]
  },
  {
    id: 'cot-3',
    fecha: '2026-09-03',
    fechaDisplay: '03/09/2026',
    correlativo: 'CT01-00000010',
    cliente_nombre: 'Público en general',
    cliente_ci_nit: '0',
    cliente_telefono: '',
    total: 765.00,
    estado: 'Borrador',
    validez_dias: 15,
    items: [
      { id: '3', nombre: 'Zapatilla cuero importada', cantidad: 3, precio: 255.00, subtotal: 765.00 }
    ]
  }
];

const toISODate = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// 2026-10-15 -> 15/10/2026
const formatFecha = (iso) => {
  const [y, m, d] = String(iso || '').slice(0, 10).split('-');
  return y && m && d ? `${d}/${m}/${y}` : (iso || '');
};

// Estado que se muestra: una cotización sin convertir pasa a "Vencida" cuando termina su validez
function estadoVisible(cot) {
  const crudo = String(cot.estado || 'Borrador').toLowerCase();
  const estadoBase = crudo.charAt(0).toUpperCase() + crudo.slice(1);
  if (estadoBase === 'Convertida') return 'Convertida';
  const base = new Date(`${String(cot.fecha || '').slice(0, 10)}T00:00:00`);
  if (!Number.isNaN(base.getTime())) {
    const vence = new Date(base);
    vence.setDate(vence.getDate() + (Number(cot.validez_dias) || 15));
    if (vence < new Date(new Date().toDateString())) return 'Vencida';
  }
  return estadoBase;
}

const ESTADO_CLASES = {
  Convertida: 'bg-[#FDFBF7] text-[#FF6B35] border border-[#FFB627]/20',
  Vencida: 'bg-amber-50 text-amber-700 border border-amber-200',
};

export default function CotizacionesView({ onSelectSubView, onOpenPosWithCart, onAbrirFormulario }) {
  const { addItem, clearCart } = useCart();
  const { empresa, currentUser } = useAuth();
  const vendedor = currentUser?.nombre || '';

  // PDF A4: ver/imprimir y enviar por correo
  const [pdfCot, setPdfCot] = useState(null);
  const [pdfAutoPrint, setPdfAutoPrint] = useState(false);
  const [pdfFormato, setPdfFormato] = useState('A4'); // 'A4' o 80 (ticket)
  const abrirPdf = (cot, formato, autoPrint = false) => { setPdfFormato(formato); setPdfAutoPrint(autoPrint); setPdfCot(cot); };

  // Conversión directa de la cotización en venta
  const [convirtiendo, setConvirtiendo] = useState(null); // cotización
  const [convTipo, setConvTipo] = useState('Nota de Venta');
  const [convMetodo, setConvMetodo] = useState('Efectivo');
  const [convGuardando, setConvGuardando] = useState(false);
  const [emailCot, setEmailCot] = useState(null);
  
  const [cotizaciones, setCotizaciones] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [fechaDesde, setFechaDesde] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
  });
  const [fechaHasta, setFechaHasta] = useState(() => toISODate(new Date()));
  const [pageSize, setPageSize] = useState('10');
  const [page, setPage] = useState(1);
  
  // Dropdown de acciones abierto
  const [openActionId, setOpenActionId] = useState(null);
  // El menú se dibuja con posición fija para que la tabla (con scroll) no lo recorte
  const [menuPos, setMenuPos] = useState(null);
  useEffect(() => {
    if (!openActionId) return;
    const cerrar = () => setOpenActionId(null);
    window.addEventListener('scroll', cerrar, true);
    window.addEventListener('resize', cerrar);
    return () => { window.removeEventListener('scroll', cerrar, true); window.removeEventListener('resize', cerrar); };
  }, [openActionId]);

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [previewCotizacion, setPreviewCotizacion] = useState(null);

  // Datos para creación
  const [clientList, setClientList] = useState([]);
  const [productList, setProductList] = useState([]);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_ci_nit: '',
    cliente_telefono: '',
    validez_dias: 15,
    condiciones: 'Precios válidos por 15 días. Pago al contado contra entrega.',
    items: [],
    descuento: 0
  });

  const loadData = async () => {
    try {
      const list = await db.cotizaciones.reverse().toArray();
      if (list && list.length > 0) {
        setCotizaciones(list);
      } else if (isDemoMode) {
        // Solo en modo demo (sin Supabase) se siembran cotizaciones de ejemplo
        await db.cotizaciones.bulkAdd(SEED_COTIZACIONES);
        setCotizaciones(SEED_COTIZACIONES);
      } else {
        setCotizaciones([]);
      }
      const clients = await db.clientes.toArray();
      setClientList(clients);
      const prods = await db.productos_tienda.toArray();
      setProductList(prods);
    } catch (err) {
      console.warn('Error loading cotizaciones:', err);
      setCotizaciones(isDemoMode ? SEED_COTIZACIONES : []);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Cerrar menú de acciones al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!e.target.closest('.dropdown-action-menu')) {
        setOpenActionId(null);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  // Formatear moneda en Soles
  const formatSoles = (amount) => {
    const val = Number(amount) || 0;
    return `${simbolo()} ${val.toFixed(2)}`;
  };

  // Filtrar por texto y rango de fechas, de la más reciente a la más antigua
  const filtered = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return cotizaciones
      .filter(c => {
        const matchesSearch = !term ||
          c.correlativo?.toLowerCase().includes(term) ||
          c.cliente_nombre?.toLowerCase().includes(term) ||
          c.cliente_ci_nit?.includes(term);
        const f = String(c.fecha || '').slice(0, 10);
        const enRango = (!fechaDesde || f >= fechaDesde) && (!fechaHasta || f <= fechaHasta);
        return matchesSearch && enRango;
      })
      .sort((x, y) => String(y.fecha).localeCompare(String(x.fecha)) || String(y.correlativo).localeCompare(String(x.correlativo)));
  }, [cotizaciones, searchTerm, fechaDesde, fechaHasta]);

  const perPage = Number(pageSize) || 10;
  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice((currentPage - 1) * perPage, currentPage * perPage);

  // Al cambiar los filtros se vuelve a la primera página
  useEffect(() => { setPage(1); }, [searchTerm, fechaDesde, fechaHasta, pageSize]);

  // Convertir cotización a venta POS
  const handleLoadToPos = async (cot) => {
    if (window.confirm(`¿Cargar los productos de la cotización ${cot.correlativo} al Punto de Venta (POS)?`)) {
      clearCart();
      if (Array.isArray(cot.items)) {
        for (const item of cot.items) {
          const prod = productList.find(p => p.id === item.id || p.nombre === item.nombre) || {
            id: item.id || `item-${Date.now()}`,
            nombre: item.nombre,
            precio_venta: item.precio,
            unidad_medida: 'Unidad'
          };
          addItem(prod, null, item.cantidad || 1);
        }
      }
      await db.cotizaciones.update(cot.id, { estado: 'Convertida' });
      await loadData();
      if (onOpenPosWithCart) {
        onOpenPosWithCart();
      } else if (onSelectSubView) {
        onSelectSubView('pos');
      }
    }
  };

  // Duplicar cotización
  // Eliminar cotización
  // Abre el formulario completo con los datos de la cotización ('editar' o el tipo de comprobante)
  const abrirFormulario = (cot, accion) => {
    if (onAbrirFormulario) onAbrirFormulario(cot, accion);
    else if (accion === 'editar') setPreviewCotizacion(cot);
  };

  const handleConvertir = async () => {
    if (!convirtiendo) return;
    setConvGuardando(true);
    try {
      const venta = await convertirCotizacionEnVenta(convirtiendo, { tipo: convTipo, metodo: convMetodo, cajero: vendedor });
      toast.success(`Cotización ${convirtiendo.correlativo} convertida en ${convTipo} ${venta.correlativo}.`);
      setConvirtiendo(null);
      await loadData();
    } catch (err) {
      toast.error(err.message || 'No se pudo convertir la cotización.');
    } finally {
      setConvGuardando(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('¿Deseas eliminar esta cotización?')) {
      await db.cotizaciones.delete(id);
      await loadData();
      setOpenActionId(null);
    }
  };

  // Agregar producto al borrador
  const handleAddItemToDraft = (productId) => {
    const prod = productList.find(p => p.id === productId);
    if (!prod) return;

    const existingIdx = formData.items.findIndex(i => i.id === prod.id);
    if (existingIdx >= 0) {
      const updated = [...formData.items];
      updated[existingIdx].cantidad += 1;
      updated[existingIdx].subtotal = updated[existingIdx].cantidad * updated[existingIdx].precio;
      setFormData({ ...formData, items: updated });
    } else {
      const newItem = {
        id: prod.id,
        nombre: prod.nombre,
        cantidad: 1,
        precio: prod.precio_venta || 0,
        subtotal: prod.precio_venta || 0
      };
      setFormData({ ...formData, items: [...formData.items, newItem] });
    }
  };

  const subtotalDraft = formData.items.reduce((acc, i) => acc + (Number(i.subtotal) || 0), 0);
  const totalDraft = Math.max(0, subtotalDraft - Number(formData.descuento || 0));

  // Crear nueva cotización
  const handleCreateQuote = async (e) => {
    e.preventDefault();
    if (!formData.cliente_nombre.trim()) {
      toast.error('Por favor ingresa el nombre del cliente');
      return;
    }
    if (formData.items.length === 0) {
      toast.error('Por favor agrega al menos un producto a la cotización');
      return;
    }

    const today = new Date();
    const correlativo = `CT01-${String(Math.floor(10000000 + Math.random() * 90000000))}`;
    const newQuote = {
      id: `cot-${Date.now()}`,
      fecha: today.toISOString().split('T')[0],
      fechaDisplay: today.toLocaleDateString('es-BO'),
      correlativo,
      cliente_nombre: formData.cliente_nombre.trim(),
      cliente_ci_nit: formData.cliente_ci_nit.trim() || '0',
      cliente_telefono: formData.cliente_telefono.trim() || '',
      total: totalDraft,
      estado: 'Borrador',
      validez_dias: Number(formData.validez_dias) || 15,
      items: formData.items
    };

    await db.cotizaciones.add(newQuote);
    await loadData();
    setIsNewModalOpen(false);
    setFormData({
      cliente_nombre: '',
      cliente_ci_nit: '',
      cliente_telefono: '',
      validez_dias: 15,
      condiciones: 'Precios válidos por 15 días. Pago al contado contra entrega.',
      items: [],
      descuento: 0
    });
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      

      <main className="w-full p-4 sm:p-6 lg:p-7 space-y-4">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1. CABECERA: TÍTULO, SUBTÍTULO & BOTÓN NUEVA COTIZACIÓN              */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Cotizaciones
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pre venta — no afectan inventario hasta convertir a venta.
            </p>
          </div>

          <button
            type="button"
            onClick={() => (onSelectSubView ? onSelectSubView('nueva_cotizacion') : setIsNewModalOpen(true))}
            className="px-4 py-2 bg-[#FF6B35] hover:bg-[#E85B28] text-white font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition flex items-center justify-center gap-1.5 cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva cotización</span>
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
              placeholder="Buscar número o notas..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-[#FF6B35] font-medium shadow-2xs"
            />
          </div>

          {/* Rango de Fechas & Paginación */}
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

            {/* Selector de Paginación (10 / pág.) */}
            <div className="relative">
              <select
                value={pageSize}
                onChange={e => setPageSize(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-xl pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="10">10 / pág.</option>
                <option value="25">25 / pág.</option>
                <option value="50">50 / pág.</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 3. TABLA DE COTIZACIONES (ESTRUCTURA IDÉNTICA A LA IMAGEN)           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-visible">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              {/* Encabezados */}
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">FECHA</th>
                  <th className="py-3 px-4">NÚMERO</th>
                  <th className="py-3 px-4">CLIENTE</th>
                  <th className="py-3 px-4 text-right">TOTAL</th>
                  <th className="py-3 px-4 text-center">ESTADO</th>
                  <th className="py-3 px-4 text-center">PDF</th>
                  <th className="py-3 px-4 text-center">ACCIONES</th>
                </tr>
              </thead>

              {/* Cuerpo de la tabla */}
              <tbody className="divide-y divide-slate-100">
                {pageRows.map((cot) => {
                  const fechaFormatted = formatFecha(cot.fecha);
                  const estado = estadoVisible(cot);

                  return (
                    <tr key={cot.id} className="hover:bg-slate-50/60 transition">
                      
                      {/* 1. FECHA */}
                      <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                        {fechaFormatted}
                      </td>

                      {/* 2. NÚMERO */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-700 tracking-tight whitespace-nowrap">
                        {cot.correlativo}
                      </td>

                      {/* 3. CLIENTE */}
                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="truncate max-w-xs sm:max-w-md" title={cot.cliente_nombre}>
                          {cot.cliente_nombre}
                        </div>
                      </td>

                      {/* 4. TOTAL */}
                      <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                        {formatSoles(cot.total)}
                      </td>

                      {/* 5. ESTADO */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-medium ${ESTADO_CLASES[estado] || 'bg-slate-100 text-slate-700'}`}>
                          {estado}
                        </span>
                      </td>

                      {/* 6. COLUMNA PDF (6 MICRO-ICONOS) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center gap-2">
                          
                          {/* 1. Ver / Vista previa (Ojo en rojo) */}
                          <button
                            type="button"
                            onClick={() => abrirPdf(cot, 'A4')}
                            title="Ver comprobante A4"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          {/* 2. Descargar A4 (Descarga en rojo) */}
                          <button
                            type="button"
                            onClick={() => descargarCotizacionPdf(cot, empresa, vendedor)}
                            title="Descargar PDF A4"
                            className="p-1 text-rose-500 hover:text-rose-700 hover:bg-rose-50 rounded transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Ticket 80mm (Ticket en naranja) */}
                          <button
                            type="button"
                            onClick={() => abrirPdf(cot, 80)}
                            title="Ver ticket 80mm"
                            className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          >
                            <Ticket className="w-3.5 h-3.5" />
                          </button>

                          {/* 4. Ticket 58mm / A5 (Documento en naranja) */}
                          <button
                            type="button"
                            onClick={() => descargarTicketPdf(cot, empresa, 80, 'COTIZACIÓN')}
                            title="Descargar ticket 80mm"
                            className="p-1 text-amber-500 hover:text-amber-700 hover:bg-amber-50 rounded transition"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* 5. Enviar el PDF por correo (Sobre) */}
                          <button
                            type="button"
                            onClick={() => setEmailCot(cot)}
                            title="Enviar PDF por correo"
                            className="p-1 text-[#FF6B35] hover:text-[#FF6B35] hover:bg-[#FF6B35]/10 rounded transition"
                          >
                            <Mail className="w-3.5 h-3.5" />
                          </button>

                          {/* 6. Imprimir directo (Impresora en verde) */}
                          <button
                            type="button"
                            onClick={() => abrirPdf(cot, 80, true)}
                            title="Imprimir ticket 80mm"
                            className="p-1 text-[#FF6B35] hover:text-[#E85B28] hover:bg-[#FF6B35]/10 rounded transition"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>

                        </div>
                      </td>

                      {/* 7. ACCIONES (DROPDOWN ACCIONES ⌄) */}
                      <td className="py-3.5 px-4 text-center whitespace-nowrap relative dropdown-action-menu">
                        <div className="relative inline-block text-left">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              const r = e.currentTarget.getBoundingClientRect();
                              const altoMenu = 270;
                              const haciaArriba = r.bottom + altoMenu + 8 > window.innerHeight && r.top > altoMenu;
                              setMenuPos({
                                top: haciaArriba ? r.top - altoMenu - 4 : r.bottom + 4,
                                right: Math.max(8, window.innerWidth - r.right),
                              });
                              setOpenActionId(openActionId === cot.id ? null : cot.id);
                            }}
                            className="px-3 py-1 bg-white border border-slate-300 hover:border-slate-400 text-slate-700 font-medium text-xs rounded-xl shadow-2xs transition inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>Acciones</span>
                            <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                          </button>

                          {/* Menú flotante de acciones */}
                          {openActionId === cot.id && (
                            <div style={menuPos ? { top: menuPos.top, right: menuPos.right } : undefined} className="fixed w-56 bg-white rounded-xl shadow-xl border border-slate-200 py-1.5 z-40 animate-fadeIn text-left text-sm">
                              <button
                                type="button"
                                onClick={() => { setOpenActionId(null); abrirFormulario(cot, 'editar'); }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                              >
                                <Pencil className="w-4 h-4 text-slate-600" />
                                <span>Editar</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDelete(cot.id)}
                                className="w-full px-3.5 py-2 text-rose-600 hover:bg-rose-50 flex items-center gap-2.5 transition"
                              >
                                <Trash2 className="w-4 h-4 text-rose-500" />
                                <span>Eliminar</span>
                              </button>

                              <div className="border-t border-slate-100 my-1.5"></div>
                              <p className="px-3.5 pt-0.5 pb-1 text-[10px] font-semibold tracking-wide uppercase text-slate-400">Convertir directo</p>
                              <button
                                type="button"
                                onClick={() => { setOpenActionId(null); setConvirtiendo(cot); }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                              >
                                <Zap className="w-4 h-4 text-slate-600" />
                                <span>Conversión directa...</span>
                              </button>

                              <div className="border-t border-slate-100 my-1.5"></div>
                              <p className="px-3.5 pt-0.5 pb-1 text-[10px] font-semibold tracking-wide uppercase text-slate-400">Abrir formulario</p>
                              <button
                                type="button"
                                onClick={() => { setOpenActionId(null); abrirFormulario(cot, 'Nota de Venta'); }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                              >
                                <Receipt className="w-4 h-4 text-slate-600" />
                                <span>Nota de venta</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => { setOpenActionId(null); abrirFormulario(cot, 'Boleta'); }}
                                className="w-full px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2.5 transition"
                              >
                                <FileText className="w-4 h-4 text-slate-600" />
                                <span>Comprobante</span>
                              </button>
                            </div>
                          )}
                        </div>
                      </td>

                    </tr>
                  );
                })}
                {pageRows.length === 0 && (
                  <tr>
                    <td colSpan={7}>
                      <EstadoVacio titulo="No hay cotizaciones" descripcion="Prueba con otro rango de fechas." />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pie: resumen y paginación */}
          {filtered.length > 0 && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-4 py-3 border-t border-slate-100 text-xs text-slate-500">
              <span>
                Mostrando {(currentPage - 1) * perPage + 1}–{Math.min(currentPage * perPage, filtered.length)} de {filtered.length}
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Página anterior"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 font-semibold text-slate-700">{currentPage} / {totalPages}</span>
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed"
                  aria-label="Página siguiente"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          )}
        </div>

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: CREAR NUEVA COTIZACIÓN                                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs animate-fadeIn overflow-y-auto [&>*]:my-auto">
          <div className="bg-white rounded-3xl w-full max-w-2xl max-h-[90dvh] flex flex-col shadow-2xl overflow-hidden border border-slate-200">
            
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#FF6B35] text-white">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-5 h-5" />
                <h2 className="font-bold text-base">Nueva Cotización</h2>
              </div>
              <button 
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleCreateQuote} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
              
              {/* Cliente */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-700 block">Datos del Cliente</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <input
                      type="text"
                      placeholder="Nombre o Razón Social *"
                      value={formData.cliente_nombre}
                      onChange={e => setFormData({ ...formData, cliente_nombre: e.target.value })}
                      list="clients-list"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
                      required
                    />
                    <datalist id="clients-list">
                      {clientList.map(c => (
                        <option key={c.id} value={c.razon_social}>
                          {c.nit_ci ? `NIT: ${c.nit_ci}` : ''}
                        </option>
                      ))}
                    </datalist>
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="RUC / DNI"
                      value={formData.cliente_ci_nit}
                      onChange={e => setFormData({ ...formData, cliente_ci_nit: e.target.value })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
                    />
                  </div>
                </div>
                <div>
                  <input
                    type="tel"
                    placeholder="Teléfono / WhatsApp"
                    value={formData.cliente_telefono}
                    onChange={e => setFormData({ ...formData, cliente_telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35]"
                  />
                </div>
              </div>

              {/* Agregar Productos */}
              <div className="space-y-2 border-t border-slate-100 pt-3">
                <label className="text-xs font-bold text-slate-700 block">Agregar Productos del Catálogo</label>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      handleAddItemToDraft(e.target.value);
                      e.target.value = '';
                    }
                  }}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#FF6B35] cursor-pointer"
                >
                  <option value="">Selecciona un producto para agregar...</option>
                  {productList.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — {formatSoles(p.precio_venta)} (Stock: {p.stock_actual})
                    </option>
                  ))}
                </select>

                {/* Lista de productos agregados */}
                <div className="space-y-1.5 mt-2 max-h-44 overflow-y-auto">
                  {formData.items.map((it, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-slate-50 rounded-xl border border-slate-200">
                      <div className="flex-1 min-w-0 mr-2">
                        <p className="font-semibold text-slate-800 truncate">{it.nombre}</p>
                        <p className="text-[10px] text-slate-400">{formatSoles(it.precio)} c/u</p>
                      </div>

                      <div className="flex items-center gap-2">
                        <div className="flex items-center border border-slate-200 rounded-lg bg-white overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.items];
                              if (updated[idx].cantidad > 1) {
                                updated[idx].cantidad -= 1;
                                updated[idx].subtotal = updated[idx].cantidad * updated[idx].precio;
                                setFormData({ ...formData, items: updated });
                              }
                            }}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            -
                          </button>
                          <span className="px-2 py-0.5 text-xs font-bold text-slate-800">{it.cantidad}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...formData.items];
                              updated[idx].cantidad += 1;
                              updated[idx].subtotal = updated[idx].cantidad * updated[idx].precio;
                              setFormData({ ...formData, items: updated });
                            }}
                            className="px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-bold"
                          >
                            +
                          </button>
                        </div>

                        <span className="font-bold text-slate-900 w-20 text-right">
                          {formatSoles(it.subtotal)}
                        </span>

                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...formData.items];
                            updated.splice(idx, 1);
                            setFormData({ ...formData, items: updated });
                          }}
                          className="text-slate-400 hover:text-rose-500 p-1"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {formData.items.length === 0 && (
                    <p className="text-center py-4 text-slate-400 italic">
                      No hay productos agregados en esta cotización.
                    </p>
                  )}
                </div>
              </div>

              {/* Total y botón crear */}
              <div className="border-t border-slate-100 pt-3 flex items-center justify-between">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Total Cotizado</span>
                  <span className="text-xl font-black text-slate-900 block">{formatSoles(totalDraft)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsNewModalOpen(false)}
                    className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#FF6B35] hover:bg-[#E85B28] text-white font-bold rounded-xl shadow-xs transition"
                  >
                    Guardar Cotización
                  </button>
                </div>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 5. MODAL: VISTA PREVIA DE COTIZACIÓN                                */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {pdfCot && (
        <CotizacionPdfModal
          cot={pdfCot}
          empresa={empresa}
          vendedor={vendedor}
          autoPrint={pdfAutoPrint}
          formato={pdfFormato}
          onClose={() => setPdfCot(null)}
        />
      )}

      {emailCot && (
        <CotizacionEmailModal
          cot={emailCot}
          empresa={empresa}
          vendedor={vendedor}
          correoInicial={clientList.find(c => (c.nit_ci && c.nit_ci === emailCot.cliente_ci_nit) || c.razon_social === emailCot.cliente_nombre)?.email || ''}
          onClose={() => setEmailCot(null)}
        />
      )}

      {convirtiendo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs" onClick={() => !convGuardando && setConvirtiendo(null)}>
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-[#FF6B35]" />
                <h3 className="font-bold text-sm text-slate-900">Convertir {convirtiendo.correlativo}</h3>
              </div>
              <button type="button" onClick={() => setConvirtiendo(null)} disabled={convGuardando} className="p-1 text-slate-400 hover:text-slate-700" aria-label="Cerrar">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-4 text-xs">
              <p className="text-slate-500">
                Se emite la venta por {formatSoles(convirtiendo.total)} a {convirtiendo.cliente_nombre || 'Clientes varios'}, se descuenta el stock y la cotización queda como Convertida.
              </p>
              <div>
                <span className="block font-bold text-slate-600 mb-1.5">Tipo de documento</span>
                <div className="grid grid-cols-3 gap-1.5">
                  {TIPOS_CONVERSION.map(({ tipo }) => (
                    <button
                      key={tipo}
                      type="button"
                      onClick={() => setConvTipo(tipo)}
                      className={`py-2 rounded-lg border font-semibold transition ${convTipo === tipo ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#E85B28]' : 'border-slate-200 text-slate-600 hover:bg-slate-50'}`}
                    >
                      {tipo}
                    </button>
                  ))}
                </div>
              </div>
              <label className="block">
                <span className="block font-bold text-slate-600 mb-1.5">Método de pago</span>
                <select value={convMetodo} onChange={(e) => setConvMetodo(e.target.value)} className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-white text-slate-800">
                  {METODOS_CONVERSION.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </label>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setConvirtiendo(null)} disabled={convGuardando} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-slate-50">
                  Cancelar
                </button>
                <button type="button" onClick={handleConvertir} disabled={convGuardando} className="flex-1 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#E85B28] text-white font-bold disabled:opacity-60">
                  {convGuardando ? 'Convirtiendo...' : 'Convertir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {previewCotizacion && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs animate-fadeIn overflow-y-auto [&>*]:my-auto">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#FFB627]" />
                <h3 className="font-bold text-sm">Cotización {previewCotizacion.correlativo}</h3>
              </div>
              <button
                type="button"
                onClick={() => setPreviewCotizacion(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex justify-between border-b border-slate-100 pb-3">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                  <span className="font-bold text-slate-800 text-sm">{previewCotizacion.cliente_nombre}</span>
                  <span className="text-slate-400 block">Documento: {previewCotizacion.cliente_ci_nit || 'S/N'}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha</span>
                  <span className="font-medium text-slate-700">{previewCotizacion.fechaDisplay || previewCotizacion.fecha}</span>
                </div>
              </div>

              {/* Items */}
              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Detalle de Productos</span>
                {previewCotizacion.items?.map((it, idx) => (
                  <div key={idx} className="flex justify-between py-1 border-b border-slate-50 text-slate-700">
                    <span>{it.cantidad}x {it.nombre}</span>
                    <span className="font-semibold text-slate-900">{formatSoles(it.subtotal || it.precio * it.cantidad)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-600">Total</span>
                <span className="text-lg font-black text-slate-900">{formatSoles(previewCotizacion.total)}</span>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleLoadToPos(previewCotizacion)}
                  className="flex-1 py-2 bg-[#FF6B35] hover:bg-[#E85B28] text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Convertir a Venta POS</span>
                </button>
                <button
                  type="button"
                  onClick={() => { const cot = previewCotizacion; setPreviewCotizacion(null); abrirPdf(cot, 'A4', true); }}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition"
                >
                  Imprimir
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}




