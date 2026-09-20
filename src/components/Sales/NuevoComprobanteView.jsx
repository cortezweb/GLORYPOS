import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, Search, Plus, Trash2, CheckCircle2, 
  Printer, DollarSign, User, ShieldCheck, ArrowRight, 
  QrCode, CreditCard, Banknote, Clock, Sparkles,
  Calendar, Edit3, X, ChevronRight, ChevronDown, 
  Package, Barcode, Truck, Info, AlertCircle, RefreshCw
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import SalesSubNav from './SalesSubNav';

export default function NuevoComprobanteView({ onSelectSubView, onOpenReceipt }) {
  const { empresa } = useAuth();

  // Fecha actual formateada para inputs YYYY-MM-DD
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // 1. Cabecera y Empresa
  const [empresaDatos, setEmpresaDatos] = useState({
    nombre: empresa?.nombre || 'MULTISERVICIOS RAFAZ',
    direccion: empresa?.direccion || 'CAL. PALACIO VIEJO NRO. 210 URB. CERCADO DE AREQUIPA - PERU',
    email: empresa?.email || 'cindustriarafaz@gmail.com',
    telefono: empresa?.telefono || '935006519 - 982504251'
  });
  const [showEditEmpresaModal, setShowEditEmpresaModal] = useState(false);

  // Fechas
  const [fechaEmision, setFechaEmision] = useState(todayStr);
  const [fechaVencimiento, setFechaVencimiento] = useState(todayStr);

  // 2. Parámetros del Comprobante
  const [tipoComprobante, setTipoComprobante] = useState('Boleta'); // Boleta, Factura, Nota de Venta, Nota de Crédito, Cotización
  const [serie, setSerie] = useState('B001');
  const [tipoOperacion, setTipoOperacion] = useState('Venta interna');

  // Actualizar serie según tipo de comprobante
  useEffect(() => {
    if (tipoComprobante === 'Boleta') setSerie('B001');
    else if (tipoComprobante === 'Factura') setSerie('F001');
    else if (tipoComprobante === 'Nota de Venta') setSerie('NV01');
    else if (tipoComprobante === 'Nota de Crédito') setSerie('NC01');
    else if (tipoComprobante === 'Cotización') setSerie('COT1');
  }, [tipoComprobante]);

  // 3. Cliente y Moneda
  const [cliente, setCliente] = useState({
    razon_social: 'Clientes Varios (por defecto)',
    nit_ci: '99999999',
    direccion: ''
  });
  const [searchClientQuery, setSearchClientQuery] = useState('');
  const [showClientDropdown, setShowClientDropdown] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);

  const [moneda, setMoneda] = useState('Soles (PEN)');
  const [tipoCambio, setTipoCambio] = useState('3.411');

  // Símbolo de moneda dinámico
  const currencySymbol = useMemo(() => {
    if (moneda.includes('PEN') || moneda.includes('Soles')) return 'S/';
    if (moneda.includes('BOB') || moneda.includes('Bolivianos')) return 'Bs.';
    return '$';
  }, [moneda]);

  // 4. Ítems de la tabla
  const [items, setItems] = useState([]);
  const [productsCatalog, setProductsCatalog] = useState([]);
  const [clientesCatalog, setClientesCatalog] = useState([]);

  // Modales
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [searchProductQuery, setSearchProductQuery] = useState('');
  const [showManualProductModal, setShowManualProductModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanBarcodeQuery, setScanBarcodeQuery] = useState('');
  const [showAdditionalInfoDrawer, setShowAdditionalInfoDrawer] = useState(false);

  // Información Adicional
  const [additionalInfo, setAdditionalInfo] = useState({
    guiaRemision: '',
    ordenCompra: '',
    placaVehiculo: '',
    observaciones: ''
  });

  // 5. Métodos de Pago y Totales
  const [metodosPago, setMetodosPago] = useState([
    { id: 1, metodo: 'Efectivo', referencia: '', monto: 0 }
  ]);
  const [condicionPago, setCondicionPago] = useState('Contado'); // Contado, Crédito
  const [descuentoGlobalPorcentaje, setDescuentoGlobalPorcentaje] = useState(0);

  const [isSuccess, setIsSuccess] = useState(false);

  // Cargar catálogo de productos y clientes desde Dexie
  useEffect(() => {
    const loadData = async () => {
      try {
        const prods = await db.productos_tienda.toArray();
        setProductsCatalog(prods || []);
        const cls = await db.clientes.toArray();
        setClientesCatalog(cls || []);
      } catch (err) {
        console.error('Error cargando datos de Dexie:', err);
      }
    };
    loadData();
  }, []);

  // Clientes filtrados por término de búsqueda
  const filteredClients = useMemo(() => {
    if (!searchClientQuery.trim()) return clientesCatalog.slice(0, 5);
    const q = searchClientQuery.toLowerCase();
    return clientesCatalog.filter(c => 
      c.razon_social?.toLowerCase().includes(q) || 
      c.nit_ci?.includes(q)
    );
  }, [clientesCatalog, searchClientQuery]);

  // Productos filtrados para el modal de agregar producto
  const filteredProducts = useMemo(() => {
    if (!searchProductQuery.trim()) return productsCatalog.slice(0, 15);
    const q = searchProductQuery.toLowerCase();
    return productsCatalog.filter(p => 
      p.nombre?.toLowerCase().includes(q) || 
      p.codigo_barras?.toLowerCase().includes(q) ||
      p.categoria?.toLowerCase().includes(q)
    );
  }, [productsCatalog, searchProductQuery]);

  // Cálculos de totales
  const subtotalBruto = useMemo(() => {
    return items.reduce((acc, item) => acc + (Number(item.cantidad || 1) * Number(item.precio_unitario || 0)), 0);
  }, [items]);

  const totalDescuentosItems = useMemo(() => {
    return items.reduce((acc, item) => acc + Number(item.descuento || 0), 0);
  }, [items]);

  const subtotalConDescuentosItems = Math.max(0, subtotalBruto - totalDescuentosItems);

  const descuentoGlobalMonto = useMemo(() => {
    const pct = Number(descuentoGlobalPorcentaje) || 0;
    return (subtotalConDescuentosItems * pct) / 100;
  }, [subtotalConDescuentosItems, descuentoGlobalPorcentaje]);

  const totalComprobante = Math.max(0, subtotalConDescuentosItems - descuentoGlobalMonto);

  const sumaPagos = useMemo(() => {
    return metodosPago.reduce((acc, p) => acc + Number(p.monto || 0), 0);
  }, [metodosPago]);

  // Sincronizar automáticamente el monto del primer pago con el total si hay solo 1 pago
  useEffect(() => {
    if (metodosPago.length === 1) {
      setMetodosPago([{ ...metodosPago[0], monto: totalComprobante }]);
    }
  }, [totalComprobante]);

  // Manejadores de Ítems
  const handleAddProductFromCatalog = (product) => {
    const existsIndex = items.findIndex(i => i.producto_id === product.id);
    if (existsIndex >= 0) {
      const updated = [...items];
      updated[existsIndex].cantidad = Number(updated[existsIndex].cantidad || 1) + 1;
      setItems(updated);
    } else {
      setItems([
        ...items,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
          producto_id: product.id,
          descripcion: product.nombre,
          codigo: product.codigo_barras || `PROD-${product.id}`,
          unidad: product.unidad_medida || 'NIU',
          cantidad: 1,
          precio_unitario: Number(product.precio_venta) || 0,
          afectacion: 'Gravado - Operación Onerosa',
          igv_incluido: true,
          descuento: 0
        }
      ]);
    }
    setShowAddProductModal(false);
  };

  const [manualForm, setManualForm] = useState({
    descripcion: '',
    codigo: '',
    unidad: 'NIU',
    cantidad: 1,
    precio_unitario: '',
    afectacion: 'Gravado - Operación Onerosa',
    igv_incluido: true,
    descuento: 0
  });

  const handleAddManualProduct = (e) => {
    e.preventDefault();
    if (!manualForm.descripcion.trim()) {
      alert('Ingresa la descripción del producto.');
      return;
    }
    setItems([
      ...items,
      {
        id: `item-${Date.now()}`,
        producto_id: `manual-${Date.now()}`,
        descripcion: manualForm.descripcion.trim(),
        codigo: manualForm.codigo.trim() || 'SERV-01',
        unidad: manualForm.unidad || 'NIU',
        cantidad: Number(manualForm.cantidad) || 1,
        precio_unitario: Number(manualForm.precio_unitario) || 0,
        afectacion: manualForm.afectacion,
        igv_incluido: manualForm.igv_incluido,
        descuento: Number(manualForm.descuento) || 0
      }
    ]);
    setManualForm({
      descripcion: '',
      codigo: '',
      unidad: 'NIU',
      cantidad: 1,
      precio_unitario: '',
      afectacion: 'Gravado - Operación Onerosa',
      igv_incluido: true,
      descuento: 0
    });
    setShowManualProductModal(false);
  };

  const handleScanBarcode = (e) => {
    e.preventDefault();
    if (!scanBarcodeQuery.trim()) return;
    const found = productsCatalog.find(p => p.codigo_barras === scanBarcodeQuery.trim());
    if (found) {
      handleAddProductFromCatalog(found);
      setScanBarcodeQuery('');
      setShowScanModal(false);
    } else {
      alert(`No se encontró ningún producto con el código: ${scanBarcodeQuery}`);
    }
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...items];
    updated[index][field] = value;
    setItems(updated);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  // Manejadores de Pagos
  const handleAddPago = () => {
    const faltante = Math.max(0, totalComprobante - sumaPagos);
    setMetodosPago([
      ...metodosPago,
      { id: Date.now(), metodo: 'Efectivo', referencia: '', monto: faltante }
    ]);
  };

  const handleUpdatePago = (index, field, value) => {
    const updated = [...metodosPago];
    updated[index][field] = value;
    setMetodosPago(updated);
  };

  const handleRemovePago = (index) => {
    if (metodosPago.length === 1) return;
    setMetodosPago(metodosPago.filter((_, i) => i !== index));
  };

  // Guardar nuevo cliente rápido
  const [newClientForm, setNewClientForm] = useState({
    razon_social: '',
    nit_ci: '',
    direccion: '',
    telefono: '',
    email: ''
  });

  const handleSaveNewClient = async (e) => {
    e.preventDefault();
    if (!newClientForm.razon_social.trim() || !newClientForm.nit_ci.trim()) {
      alert('Razón Social y Documento (NIT/CI/DNI) son requeridos.');
      return;
    }
    const newC = {
      id: `cli-${Date.now()}`,
      razon_social: newClientForm.razon_social.trim(),
      nit_ci: newClientForm.nit_ci.trim(),
      direccion: newClientForm.direccion.trim(),
      telefono: newClientForm.telefono.trim(),
      email: newClientForm.email.trim()
    };
    await db.clientes.add(newC);
    setClientesCatalog([...clientesCatalog, newC]);
    setCliente({
      razon_social: newC.razon_social,
      nit_ci: newC.nit_ci,
      direccion: newC.direccion
    });
    setNewClientForm({ razon_social: '', nit_ci: '', direccion: '', telefono: '', email: '' });
    setShowNewClientModal(false);
  };

  // Emitir comprobante final
  const handleEmitirComprobante = async () => {
    if (items.length === 0) {
      alert('Debes agregar al menos un ítem al comprobante.');
      return;
    }

    const correlativoFinal = `${serie}-${String(Date.now()).slice(-4)}`;

    const nuevaVenta = {
      id: `vta-${Date.now()}`,
      fecha: `${fechaEmision}T${new Date().toTimeString().slice(0, 8)}`,
      fecha_vencimiento: fechaVencimiento,
      correlativo: correlativoFinal,
      tipo_documento: tipoComprobante.toUpperCase(),
      tipo_label: tipoComprobante,
      serie: serie,
      tipo_operacion: tipoOperacion,
      cliente_nombre: cliente.razon_social,
      cliente_ci_nit: cliente.nit_ci,
      cliente_direccion: cliente.direccion || '',
      moneda: moneda,
      tipo_cambio: Number(tipoCambio) || 1,
      condicion_pago: condicionPago,
      pagos: metodosPago,
      metodo_pago: metodosPago[0]?.metodo || 'EFECTIVO',
      items: items.map(it => ({
        producto_id: it.producto_id,
        nombre: it.descripcion,
        codigo: it.codigo,
        unidad: it.unidad,
        cantidad: Number(it.cantidad) || 1,
        precio: Number(it.precio_unitario) || 0,
        afectacion: it.afectacion,
        igv_incluido: it.igv_incluido,
        descuento: Number(it.descuento) || 0,
        subtotal: (Number(it.cantidad) || 1) * (Number(it.precio_unitario) || 0) - (Number(it.descuento) || 0)
      })),
      subtotal: subtotalBruto,
      descuento: totalDescuentosItems + descuentoGlobalMonto,
      total: totalComprobante,
      monto_recibido: sumaPagos,
      cambio: Math.max(0, sumaPagos - totalComprobante),
      estado: 'EMITIDO',
      informacion_adicional: additionalInfo
    };

    // Guardar en Dexie
    await db.ventas.add(nuevaVenta);

    // Descontar stock y registrar en Kardex si es producto físico
    for (const item of items) {
      if (item.producto_id && !String(item.producto_id).startsWith('manual-')) {
        const prod = await db.productos_tienda.get(item.producto_id);
        if (prod) {
          const nuevoStock = Math.max(0, (prod.stock_actual || 0) - Number(item.cantidad));
          await db.productos_tienda.update(prod.id, { stock_actual: nuevoStock });
          
          await db.kardex.add({
            id: `kdx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
            fecha: new Date().toISOString(),
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            tipo: 'VENTA',
            cantidad: Number(item.cantidad),
            motivo: `Emisión comprobante ${correlativoFinal}`,
            saldo_nuevo: nuevoStock
          });
        }
      }
    }

    setIsSuccess(true);
    setTimeout(() => {
      setIsSuccess(false);
      if (onOpenReceipt) {
        onOpenReceipt(nuevaVenta);
      }
      // Limpiar para nueva venta
      setItems([]);
      setMetodosPago([{ id: 1, metodo: 'Efectivo', referencia: '', monto: 0 }]);
      setDescuentoGlobalPorcentaje(0);
    }, 1000);
  };

  const handleResetForm = () => {
    if (window.confirm('¿Deseas reiniciar el formulario de comprobante?')) {
      setItems([]);
      setMetodosPago([{ id: 1, metodo: 'Efectivo', referencia: '', monto: 0 }]);
      setDescuentoGlobalPorcentaje(0);
      setCliente({
        razon_social: 'Clientes Varios (por defecto)',
        nit_ci: '99999999',
        direccion: ''
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen font-sans relative pb-16">
      {/* Subnavegación Superior para Ventas */}
      <SalesSubNav currentSubView="nuevo_comprobante" onSelectSubView={onSelectSubView} />

      {/* Botón Flotante Lateral Derecho: "Abrir información adicional >" */}
      <button
        type="button"
        onClick={() => setShowAdditionalInfoDrawer(true)}
        className="fixed right-0 top-1/2 -translate-y-1/2 z-30 bg-[#00a650] hover:bg-[#008f45] text-white px-2 py-4 rounded-l-xl shadow-lg flex items-center font-bold text-[11px] tracking-wider transition select-none cursor-pointer"
        style={{ writingMode: 'vertical-rl', transform: 'translateY(-50%) rotate(180deg)' }}
        title="Abrir información adicional"
      >
        Abrir información adicional &gt;
      </button>

      <main className="max-w-[1320px] mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ========================================================= */}
        {/* CABECERA: DATOS DE LA EMPRESA & FECHAS */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          
          {/* Lado Izquierdo: Logotipo y Datos de la Empresa */}
          <div className="flex items-center gap-3.5">
            <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-200 flex flex-col items-center justify-center p-1 shadow-2xs shrink-0">
              <Truck className="w-7 h-7 text-slate-700" />
              <span className="text-[8px] font-black text-slate-400 tracking-tighter uppercase leading-none mt-0.5">COMPANY</span>
            </div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight uppercase">
                  {empresaDatos.nombre}
                </h2>
                <button 
                  type="button"
                  onClick={() => setShowEditEmpresaModal(true)}
                  className="text-amber-600 hover:text-amber-700 p-0.5 rounded hover:bg-amber-50 transition"
                  title="Editar datos de empresa"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-slate-500 uppercase tracking-tight">
                {empresaDatos.direccion}
              </p>
              <p className="text-[11px] text-slate-500">
                {empresaDatos.email} - {empresaDatos.telefono}
              </p>
            </div>
          </div>

          {/* Lado Derecho: Fechas de Emisión y Vencimiento */}
          <div className="flex items-center gap-3 self-end md:self-center">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Fec. Emisión
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaEmision}
                  onChange={(e) => setFechaEmision(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-7 bg-white"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                Fec. Vencimiento
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={fechaVencimiento}
                  onChange={(e) => setFechaVencimiento(e.target.value)}
                  className="border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 font-semibold focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-7 bg-white"
                />
                <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 1 DE PARÁMETROS: TIPO COMPROBANTE, SERIE, TIPO OPERACIÓN */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo comprobante
            </label>
            <div className="relative">
              <select
                value={tipoComprobante}
                onChange={(e) => setTipoComprobante(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer pr-8"
              >
                <option value="Boleta">Boleta</option>
                <option value="Factura">Factura</option>
                <option value="Nota de Venta">Nota de Venta</option>
                <option value="Nota de Crédito">Nota de Crédito</option>
                <option value="Cotización">Cotización / Proforma</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Serie
            </label>
            <div className="relative">
              <input
                type="text"
                value={serie}
                onChange={(e) => setSerie(e.target.value)}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
              />
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo operación
            </label>
            <div className="relative">
              <select
                value={tipoOperacion}
                onChange={(e) => setTipoOperacion(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer pr-8"
              >
                <option value="Venta interna">Venta interna</option>
                <option value="Exportación">Exportación</option>
                <option value="Venta interna - Anticipos">Venta interna - Anticipos</option>
                <option value="Venta itinerante">Venta itinerante</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* FILA 2: CLIENTE *, MONEDA, TIPO DE CAMBIO */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* Selector de Cliente */}
          <div className="lg:col-span-6 relative">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Cliente <span className="text-red-500">*</span>
            </label>
            <div className="flex items-center gap-1.5">
              <div className="relative flex-1">
                <input
                  type="text"
                  value={searchClientQuery !== '' ? searchClientQuery : `${cliente.razon_social} — ${cliente.nit_ci}`}
                  onChange={(e) => {
                    setSearchClientQuery(e.target.value);
                    setShowClientDropdown(true);
                  }}
                  onFocus={() => setShowClientDropdown(true)}
                  placeholder="Buscar cliente por nombre o documento..."
                  className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 font-medium focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none pr-14"
                />
                
                {/* Botón limpiar cliente */}
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => {
                      setCliente({ razon_social: 'Clientes Varios (por defecto)', nit_ci: '99999999', direccion: '' });
                      setSearchClientQuery('');
                      setShowClientDropdown(false);
                    }}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded transition"
                    title="Limpiar"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                </div>

                {/* Dropdown autocompletado de clientes */}
                {showClientDropdown && (
                  <div className="absolute left-0 right-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl z-20 max-h-48 overflow-y-auto">
                    <div 
                      onClick={() => {
                        setCliente({ razon_social: 'Clientes Varios (por defecto)', nit_ci: '99999999', direccion: '' });
                        setSearchClientQuery('');
                        setShowClientDropdown(false);
                      }}
                      className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-xs border-b border-slate-100 flex justify-between"
                    >
                      <span className="font-bold text-slate-800">Clientes Varios (por defecto)</span>
                      <span className="text-slate-500">99999999</span>
                    </div>
                    {filteredClients.map((c) => (
                      <div
                        key={c.id}
                        onClick={() => {
                          setCliente({ razon_social: c.razon_social, nit_ci: c.nit_ci, direccion: c.direccion || '' });
                          setSearchClientQuery('');
                          setShowClientDropdown(false);
                        }}
                        className="px-3 py-2 hover:bg-emerald-50 cursor-pointer text-xs border-b border-slate-100 flex justify-between"
                      >
                        <span className="font-semibold text-slate-800">{c.razon_social}</span>
                        <span className="text-slate-500">{c.nit_ci}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Botón rápido + para nuevo cliente */}
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="w-8 h-8 rounded-lg border border-emerald-300 text-emerald-600 hover:bg-emerald-50 flex items-center justify-center shrink-0 transition"
                title="Crear nuevo cliente"
              >
                <User className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Moneda */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Moneda
            </label>
            <div className="relative">
              <select
                value={moneda}
                onChange={(e) => setMoneda(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none cursor-pointer pr-8"
              >
                <option value="Soles (PEN)">Soles (PEN)</option>
                <option value="Bolivianos (BOB)">Bolivianos (BOB)</option>
                <option value="Dólares (USD)">Dólares (USD)</option>
              </select>
              <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Tipo de Cambio */}
          <div className="lg:col-span-3">
            <label className="block text-xs font-semibold text-slate-700 mb-1.5">
              Tipo de cambio
            </label>
            <input
              type="text"
              value={tipoCambio}
              onChange={(e) => setTipoCambio(e.target.value)}
              className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none"
            />
            <p className="text-[10px] text-slate-400 mt-1 leading-tight">
              Se utiliza el tipo de cambio oficial publicado por la entidad tributaria correspondiente a la fecha.
            </p>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRA DE ACCIONES: AGREGAR PRODUCTO, MANUAL, ESCANEAR */}
        {/* ========================================================= */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* Botón 1: + Agregar producto (Píldora verde) */}
            <button
              type="button"
              onClick={() => setShowAddProductModal(true)}
              className="bg-[#00a650] hover:bg-[#008f45] text-white font-medium px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-sm transition active:scale-95"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              Agregar producto
            </button>

            {/* Botón 2: Producto manual (Píldora ámbar) */}
            <button
              type="button"
              onClick={() => setShowManualProductModal(true)}
              className="bg-white border border-amber-400 text-amber-900 hover:bg-amber-50 font-medium px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95"
            >
              <Package className="w-3.5 h-3.5 text-amber-700" />
              Producto manual
            </button>

            {/* Botón 3: Escanear (Píldora verde claro) */}
            <button
              type="button"
              onClick={() => setShowScanModal(true)}
              className="bg-white border border-emerald-400 text-emerald-800 hover:bg-emerald-50 font-medium px-4 py-2 rounded-full text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95"
            >
              <Barcode className="w-3.5 h-3.5 text-emerald-600" />
              Escanear
            </button>
          </div>

          <div className="text-xs font-semibold text-slate-500">
            Total de ítems: <span className="text-slate-800 font-bold">{items.length}</span>
          </div>
        </div>

        {/* ========================================================= */}
        {/* TABLA DE ÍTEMS DEL COMPROBANTE */}
        {/* ========================================================= */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase tracking-wider">
                  <th className="py-3 px-3 min-w-[200px]">DESCRIPCIÓN</th>
                  <th className="py-3 px-3 min-w-[90px]">CÓDIGO</th>
                  <th className="py-3 px-2 min-w-[70px]">UNID.</th>
                  <th className="py-3 px-2 min-w-[80px]">CANT.</th>
                  <th className="py-3 px-2 min-w-[90px]">P. UNIT.</th>
                  <th className="py-3 px-3 min-w-[150px]">AFECTACIÓN</th>
                  <th className="py-3 px-2 text-center min-w-[75px]">IGV INCL.</th>
                  <th className="py-3 px-2 min-w-[75px]">DESC.</th>
                  <th className="py-3 px-3 text-right min-w-[100px]">TOTAL</th>
                  <th className="py-3 px-2 text-center w-10"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="py-12 text-center text-slate-400">
                      Sin ítems. Use <strong className="text-emerald-700">Agregar producto</strong> o <strong className="text-amber-700">Producto manual</strong>.
                    </td>
                  </tr>
                ) : (
                  items.map((item, idx) => {
                    const cant = Number(item.cantidad) || 0;
                    const pu = Number(item.precio_unitario) || 0;
                    const desc = Number(item.descuento) || 0;
                    const rowTotal = Math.max(0, (cant * pu) - desc);

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition">
                        {/* Descripción */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={item.descripcion}
                            onChange={(e) => handleUpdateItem(idx, 'descripcion', e.target.value)}
                            className="w-full bg-transparent border-b border-transparent hover:border-slate-300 focus:border-emerald-500 outline-none text-xs font-semibold text-slate-800 py-0.5"
                          />
                        </td>

                        {/* Código */}
                        <td className="py-2 px-3 text-slate-600 text-[11px] font-mono">
                          {item.codigo}
                        </td>

                        {/* Unidad */}
                        <td className="py-2 px-2">
                          <span className="inline-block bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded text-[10px] font-bold">
                            {item.unidad}
                          </span>
                        </td>

                        {/* Cantidad */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0.01"
                            step="any"
                            value={item.cantidad}
                            onChange={(e) => handleUpdateItem(idx, 'cantidad', e.target.value)}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs text-center font-bold text-slate-800 focus:border-emerald-500 outline-none"
                          />
                        </td>

                        {/* Precio Unitario */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.precio_unitario}
                            onChange={(e) => handleUpdateItem(idx, 'precio_unitario', e.target.value)}
                            className="w-20 border border-slate-200 rounded px-2 py-1 text-xs text-right font-bold text-slate-800 focus:border-emerald-500 outline-none"
                          />
                        </td>

                        {/* Afectación */}
                        <td className="py-2 px-3">
                          <select
                            value={item.afectacion}
                            onChange={(e) => handleUpdateItem(idx, 'afectacion', e.target.value)}
                            className="w-full text-[11px] border border-slate-200 rounded px-2 py-1 bg-white text-slate-700 outline-none focus:border-emerald-500"
                          >
                            <option value="Gravado - Operación Onerosa">Gravado - Operación Onerosa</option>
                            <option value="Exonerado">Exonerado</option>
                            <option value="Inafecto">Inafecto</option>
                            <option value="Gratuito">Gratuito</option>
                          </select>
                        </td>

                        {/* IGV Incluido */}
                        <td className="py-2 px-2 text-center">
                          <input
                            type="checkbox"
                            checked={item.igv_incluido}
                            onChange={(e) => handleUpdateItem(idx, 'igv_incluido', e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded border-slate-300 focus:ring-emerald-500 cursor-pointer"
                          />
                        </td>

                        {/* Descuento */}
                        <td className="py-2 px-2">
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={item.descuento}
                            onChange={(e) => handleUpdateItem(idx, 'descuento', e.target.value)}
                            className="w-16 border border-slate-200 rounded px-2 py-1 text-xs text-right text-slate-700 focus:border-emerald-500 outline-none"
                          />
                        </td>

                        {/* Total */}
                        <td className="py-2 px-3 text-right font-black text-slate-900">
                          {currencySymbol} {rowTotal.toFixed(2)}
                        </td>

                        {/* Eliminar fila */}
                        <td className="py-2 px-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="text-slate-400 hover:text-red-500 p-1 transition"
                            title="Eliminar ítem"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
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
        {/* SECCIÓN INFERIOR: MÉTODOS DE PAGO Y TOTALES */}
        {/* ========================================================= */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
          
          {/* Tarjeta Izquierda: Métodos de Pago & Condición */}
          <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-4">
            <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block">
              MÉTODOS DE PAGO
            </span>

            {/* Filas de pagos */}
            <div className="space-y-2.5">
              {metodosPago.map((pago, idx) => (
                <div key={pago.id} className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                  {/* Selector Método */}
                  <div className="w-full sm:w-48 relative">
                    <select
                      value={pago.metodo}
                      onChange={(e) => handleUpdatePago(idx, 'metodo', e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-semibold text-slate-800 focus:border-emerald-500 outline-none cursor-pointer pr-8"
                    >
                      <option value="Efectivo">💵 Efectivo</option>
                      <option value="Tarjeta">💳 Tarjeta Débito / Crédito</option>
                      <option value="QR">📱 QR (Yape / Plin / Transferencia)</option>
                      <option value="Depósito">🏦 Depósito en Cuenta</option>
                    </select>
                    <ChevronDown className="w-4 h-4 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>

                  {/* Referencia opcional */}
                  <input
                    type="text"
                    placeholder="Referencia (opc.)"
                    value={pago.referencia}
                    onChange={(e) => handleUpdatePago(idx, 'referencia', e.target.value)}
                    className="flex-1 min-w-[140px] bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-800 focus:border-emerald-500 outline-none"
                  />

                  {/* Monto */}
                  <div className="w-28 relative">
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={pago.monto}
                      onChange={(e) => handleUpdatePago(idx, 'monto', e.target.value)}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-bold text-slate-900 text-right focus:border-emerald-500 outline-none"
                    />
                  </div>

                  {/* Eliminar fila de pago si hay más de una */}
                  {metodosPago.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemovePago(idx)}
                      className="text-slate-400 hover:text-red-500 p-1.5 transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            {/* Enlace para agregar otro método de pago */}
            <button
              type="button"
              onClick={handleAddPago}
              className="text-[#00a650] hover:text-[#008f45] font-semibold text-xs flex items-center gap-1 transition"
            >
              + Agregar pago
            </button>

            {/* Caja de resumen de pagos */}
            <div className="pt-2 border-t border-slate-100 space-y-1 text-xs">
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Monto a pagar</span>
                <span className="font-semibold text-slate-700">{currencySymbol} {totalComprobante.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-slate-500 font-medium">
                <span>Suma de pagos</span>
                <span className="font-semibold text-slate-700">{currencySymbol} {sumaPagos.toFixed(2)}</span>
              </div>
            </div>

            {/* Condición de Pago: Contado / Crédito */}
            <div className="pt-2">
              <span className="text-[11px] font-black text-slate-600 uppercase tracking-wider block mb-2">
                CONDICIÓN DE PAGO
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setCondicionPago('Contado')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                    condicionPago === 'Contado'
                      ? 'border-[#00a650] bg-emerald-50/70 text-[#00a650] shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Contado
                </button>
                <button
                  type="button"
                  onClick={() => setCondicionPago('Crédito')}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${
                    condicionPago === 'Crédito'
                      ? 'border-[#00a650] bg-emerald-50/70 text-[#00a650] shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  Crédito
                </button>
              </div>
            </div>
          </div>

          {/* Tarjeta Derecha: Descuento y Total Comprobante */}
          <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 shadow-xs p-4 sm:p-5 space-y-5">
            
            {/* Input Descuento (%) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Descuento
              </label>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden focus-within:border-emerald-500">
                <span className="bg-[#00a650] text-white font-bold text-xs px-3 py-2">
                  %
                </span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  step="any"
                  value={descuentoGlobalPorcentaje}
                  onChange={(e) => setDescuentoGlobalPorcentaje(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 outline-none"
                  placeholder="0"
                />
              </div>
            </div>

            {/* Total Comprobante */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black text-slate-700 uppercase tracking-wide">
                TOTAL COMPROBANTE
              </span>
              <span className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {currencySymbol} {totalComprobante.toFixed(2)}
              </span>
            </div>

            {/* Botones de acción principales */}
            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleEmitirComprobante}
                disabled={isSuccess}
                className="w-full bg-[#00a650] hover:bg-[#008f45] text-white py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition active:scale-[0.99]"
              >
                {isSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 animate-bounce" />
                    ¡Comprobante Emitido!
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5" />
                    Generar Comprobante
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetForm}
                className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 py-2 rounded-xl font-semibold text-xs transition"
              >
                Limpiar Formulario
              </button>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* BARRA INFORMATIVA INFERIOR (ESTILO CAPTURA) */}
        {/* ========================================================= */}
        <div className="space-y-1">
          <div className="h-0.5 bg-red-500 w-full rounded-full"></div>
          <div className="bg-emerald-50 border border-emerald-200/80 px-4 py-2 rounded-lg text-xs text-emerald-800 font-medium flex items-center justify-between">
            <span>
              Total a pagar {currencySymbol} {totalComprobante.toFixed(2)}. {sumaPagos >= totalComprobante ? 'El anticipo cubre la venta; no se requiere cobro adicional.' : `Falta cancelar ${currencySymbol} ${(totalComprobante - sumaPagos).toFixed(2)}.`}
            </span>
            <span className="text-[10px] text-emerald-600 font-bold hidden sm:inline">
              GLORYPOS Facturación
            </span>
          </div>
        </div>

      </main>

      {/* ========================================================= */}
      {/* MODAL: AGREGAR PRODUCTO DESDE CATÁLOGO */}
      {/* ========================================================= */}
      {showAddProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Seleccionar Producto del Catálogo</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowAddProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 border-b border-slate-100 bg-white">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, código de barras o categoría..."
                  value={searchProductQuery}
                  onChange={(e) => setSearchProductQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 border border-slate-300 rounded-xl text-xs outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
              {filteredProducts.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  No se encontraron productos en el inventario.
                </div>
              ) : (
                filteredProducts.map((p) => (
                  <div key={p.id} className="py-2.5 flex items-center justify-between hover:bg-slate-50 px-2 rounded-lg transition">
                    <div>
                      <div className="font-semibold text-xs text-slate-800">{p.nombre}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-2 mt-0.5">
                        <span>Cód: {p.codigo_barras || 'S/C'}</span>
                        <span>•</span>
                        <span>Stock: <strong className={p.stock_actual > 0 ? 'text-emerald-700' : 'text-red-500'}>{p.stock_actual || 0}</strong></span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-xs text-slate-900">
                        {currencySymbol} {Number(p.precio_venta || 0).toFixed(2)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleAddProductFromCatalog(p)}
                        className="bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold px-3 py-1 rounded-lg text-xs transition border border-emerald-200"
                      >
                        + Agregar
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: PRODUCTO MANUAL */}
      {/* ========================================================= */}
      {showManualProductModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-amber-50">
              <div className="flex items-center gap-2">
                <Package className="w-4 h-4 text-amber-700" />
                <h3 className="font-bold text-sm text-slate-800">Agregar Ítem / Servicio Manual</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowManualProductModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddManualProduct} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del producto o servicio *</label>
                <input
                  type="text"
                  required
                  value={manualForm.descripcion}
                  onChange={(e) => setManualForm({ ...manualForm, descripcion: e.target.value })}
                  placeholder="Ej: Mantenimiento correctivo de compresor"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código (opcional)</label>
                  <input
                    type="text"
                    value={manualForm.codigo}
                    onChange={(e) => setManualForm({ ...manualForm, codigo: e.target.value })}
                    placeholder="SERV-001"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidad de Medida</label>
                  <select
                    value={manualForm.unidad}
                    onChange={(e) => setManualForm({ ...manualForm, unidad: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500 bg-white"
                  >
                    <option value="NIU">NIU (Unidad)</option>
                    <option value="ZZ">ZZ (Servicio)</option>
                    <option value="KGM">KGM (Kilogramos)</option>
                    <option value="GLN">GLN (Galones)</option>
                    <option value="MTR">MTR (Metros)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Cantidad *</label>
                  <input
                    type="number"
                    step="any"
                    min="0.01"
                    required
                    value={manualForm.cantidad}
                    onChange={(e) => setManualForm({ ...manualForm, cantidad: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Precio Unitario *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={manualForm.precio_unitario}
                    onChange={(e) => setManualForm({ ...manualForm, precio_unitario: e.target.value })}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Afectación al IGV</label>
                <select
                  value={manualForm.afectacion}
                  onChange={(e) => setManualForm({ ...manualForm, afectacion: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-amber-500 bg-white"
                >
                  <option value="Gravado - Operación Onerosa">Gravado - Operación Onerosa</option>
                  <option value="Exonerado">Exonerado</option>
                  <option value="Inafecto">Inafecto</option>
                  <option value="Gratuito">Gratuito</option>
                </select>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowManualProductModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Agregar a la tabla
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ESCANEAR CÓDIGO DE BARRAS */}
      {/* ========================================================= */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-emerald-50">
              <div className="flex items-center gap-2">
                <Barcode className="w-4 h-4 text-emerald-700" />
                <h3 className="font-bold text-sm text-slate-800">Escanear Código de Barras</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowScanModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleScanBarcode} className="p-4 space-y-4 text-xs">
              <p className="text-slate-500 leading-relaxed">
                Pase el lector láser por el código de barras del producto o ingréselo manualmente aquí:
              </p>
              <input
                type="text"
                placeholder="Código de barras..."
                value={scanBarcodeQuery}
                onChange={(e) => setScanBarcodeQuery(e.target.value)}
                className="w-full border-2 border-emerald-500 rounded-xl px-4 py-2.5 text-sm font-mono font-bold text-slate-800 outline-none"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Buscar y Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: NUEVO CLIENTE RÁPIDO */}
      {/* ========================================================= */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <User className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">Crear Nuevo Cliente</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowNewClientModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClient} className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Razón Social / Nombres *</label>
                <input
                  type="text"
                  required
                  value={newClientForm.razon_social}
                  onChange={(e) => setNewClientForm({ ...newClientForm, razon_social: e.target.value })}
                  placeholder="Ej: Minera Las Bambas S.A."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Documento (RUC / DNI / NIT) *</label>
                <input
                  type="text"
                  required
                  value={newClientForm.nit_ci}
                  onChange={(e) => setNewClientForm({ ...newClientForm, nit_ci: e.target.value })}
                  placeholder="20601234567"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección Fiscal</label>
                <input
                  type="text"
                  value={newClientForm.direccion}
                  onChange={(e) => setNewClientForm({ ...newClientForm, direccion: e.target.value })}
                  placeholder="Av. Principal 123"
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={newClientForm.telefono}
                    onChange={(e) => setNewClientForm({ ...newClientForm, telefono: e.target.value })}
                    placeholder="999888777"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    value={newClientForm.email}
                    onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                    placeholder="cliente@empresa.com"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Guardar y Seleccionar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* DRAWER: INFORMACIÓN ADICIONAL */}
      {/* ========================================================= */}
      {showAdditionalInfoDrawer && (
        <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-2xs flex justify-end">
          <div className="bg-white w-full max-w-sm h-full shadow-2xl p-5 flex flex-col space-y-4 animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-[#00a650]" />
                <h3 className="font-bold text-sm text-slate-900">Información Adicional</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowAdditionalInfoDrawer(false)}
                className="text-slate-400 hover:text-slate-700 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 space-y-3.5 text-xs overflow-y-auto">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Guía de Remisión</label>
                <input
                  type="text"
                  placeholder="T001-0000123"
                  value={additionalInfo.guiaRemision}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, guiaRemision: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Orden de Compra / Pedido</label>
                <input
                  type="text"
                  placeholder="OC-2026-99"
                  value={additionalInfo.ordenCompra}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, ordenCompra: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Placa de Vehículo</label>
                <input
                  type="text"
                  placeholder="ABC-123"
                  value={additionalInfo.placaVehiculo}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, placaVehiculo: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Observaciones / Glosa</label>
                <textarea
                  rows={3}
                  placeholder="Notas adicionales impresas en el comprobante..."
                  value={additionalInfo.observaciones}
                  onChange={(e) => setAdditionalInfo({ ...additionalInfo, observaciones: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowAdditionalInfoDrawer(false)}
                className="w-full bg-[#00a650] hover:bg-[#008f45] text-white py-2 rounded-xl font-bold text-xs"
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDITAR DATOS DE EMPRESA */}
      {/* ========================================================= */}
      {showEditEmpresaModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-200 overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Edit3 className="w-4 h-4 text-amber-600" />
                <h3 className="font-bold text-sm text-slate-800">Modificar Datos de la Empresa</h3>
              </div>
              <button 
                type="button"
                onClick={() => setShowEditEmpresaModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre Comercial / Razón Social</label>
                <input
                  type="text"
                  value={empresaDatos.nombre}
                  onChange={(e) => setEmpresaDatos({ ...empresaDatos, nombre: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Dirección Completa</label>
                <input
                  type="text"
                  value={empresaDatos.direccion}
                  onChange={(e) => setEmpresaDatos({ ...empresaDatos, direccion: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  value={empresaDatos.email}
                  onChange={(e) => setEmpresaDatos({ ...empresaDatos, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Teléfonos / Celulares</label>
                <input
                  type="text"
                  value={empresaDatos.telefono}
                  onChange={(e) => setEmpresaDatos({ ...empresaDatos, telefono: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                />
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowEditEmpresaModal(false)}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm"
                >
                  Listo
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
