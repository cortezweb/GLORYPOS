import React, { useState, useEffect, useMemo } from 'react';
import { 
  Truck, Plus, Search, Building2, Phone, PackagePlus, 
  CheckCircle2, X, ArrowUpRight, DollarSign, Store,
  Calendar, FileText, Check, AlertCircle, TrendingUp,
  Clock, MapPin, Edit2, Trash2, Mail, ArrowLeft, UserPlus,
  Package, Eye, Ban, Receipt, UploadCloud, FileSpreadsheet
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';

// ── REGISTROS INICIALES EXACTOS AL SCREENSHOT ──
const SEED_COMPRAS = [
  {
    id: 'cmp-1',
    fecha: '2026-09-16T10:30:00Z',
    fechaDisplay: '16/09/2026',
    tipo_documento: 'FACTURA',
    numero_factura: 'E001-00000458',
    proveedor_nombre: 'CORPORACION INDUSTRIAL PSG E.I.R.L.',
    total: 17511.66,
    subtotal: 14840.39,
    igv: 2671.27,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Fierro corrugado 1/2 Aceros Arequipa', cantidad: 350, costo_unitario: 45.00, subtotal: 15750.00 },
      { producto_nombre: 'Alambre negro recocido #16 (kg)', cantidad: 250, costo_unitario: 7.04, subtotal: 1761.66 }
    ]
  },
  {
    id: 'cmp-2',
    fecha: '2026-09-04T15:20:00Z',
    fechaDisplay: '04/09/2026',
    tipo_documento: 'TICKET',
    numero_factura: 'Fdh-00004478',
    proveedor_nombre: 'Clientes varios',
    total: 215.00,
    subtotal: 182.20,
    igv: 32.80,
    cre: 'CRE R001-1 · Error envío',
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Caja de cinta de embalaje 2" x 100yd', cantidad: 5, costo_unitario: 43.00, subtotal: 215.00 }
    ]
  },
  {
    id: 'cmp-3',
    fecha: '2026-09-01T09:12:00Z',
    fechaDisplay: '01/09/2026',
    tipo_documento: 'FACTURA',
    numero_factura: '001-00000001',
    proveedor_nombre: 'Clientes varios',
    total: 5.40,
    subtotal: 4.58,
    igv: 0.82,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Pilas alcalinas AA pack x2', cantidad: 1, costo_unitario: 5.40, subtotal: 5.40 }
    ]
  },
  {
    id: 'cmp-4',
    fecha: '2026-09-01T09:15:00Z',
    fechaDisplay: '01/09/2026',
    tipo_documento: 'TICKET',
    numero_factura: '001-00000001',
    proveedor_nombre: 'Clientes varios',
    total: 10.80,
    subtotal: 9.15,
    igv: 1.65,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Pilas alcalinas AAA pack x4', cantidad: 1, costo_unitario: 10.80, subtotal: 10.80 }
    ]
  },
  {
    id: 'cmp-5',
    fecha: '2026-09-01T11:40:00Z',
    fechaDisplay: '01/09/2026',
    tipo_documento: 'FACTURA',
    numero_factura: '4567-00000687',
    proveedor_nombre: 'ICO LOGISTICA S.A.C.',
    total: 0.00,
    subtotal: 0.00,
    igv: 0.00,
    cre: null,
    estado: 'Anulada',
    items: [
      { producto_nombre: 'Servicio de flete y traslado logístico', cantidad: 1, costo_unitario: 0.00, subtotal: 0.00 }
    ]
  },
  {
    id: 'cmp-6',
    fecha: '2026-08-25T14:05:00Z',
    fechaDisplay: '25/08/2026',
    tipo_documento: 'FACTURA',
    numero_factura: '020202-0301-0092929w',
    proveedor_nombre: 'Grupo',
    total: 12.70,
    subtotal: 10.76,
    igv: 1.94,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Pegamento PVC Oatey 1/4 galón', cantidad: 1, costo_unitario: 12.70, subtotal: 12.70 }
    ]
  },
  {
    id: 'cmp-7',
    fecha: '2026-08-21T16:22:00Z',
    fechaDisplay: '21/08/2026',
    tipo_documento: 'TICKET',
    numero_factura: 'N-00000752',
    proveedor_nombre: 'Clientes varios',
    total: 247.00,
    subtotal: 209.32,
    igv: 37.68,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Tubo PVC 1/2" pesado clase 10 x 5m', cantidad: 19, costo_unitario: 13.00, subtotal: 247.00 }
    ]
  },
  {
    id: 'cmp-8',
    fecha: '2026-08-21T16:25:00Z',
    fechaDisplay: '21/08/2026',
    tipo_documento: 'TICKET',
    numero_factura: 'N-00001145',
    proveedor_nombre: 'Clientes varios',
    total: 209.00,
    subtotal: 177.12,
    igv: 31.88,
    cre: null,
    estado: 'Anulada',
    items: [
      { producto_nombre: 'Codo PVC 90° 1/2" rosca hembra (caja x100)', cantidad: 1, costo_unitario: 209.00, subtotal: 209.00 }
    ]
  },
  {
    id: 'cmp-9',
    fecha: '2026-08-21T18:10:00Z',
    fechaDisplay: '21/08/2026',
    tipo_documento: 'TICKET',
    numero_factura: 'N-00025467',
    proveedor_nombre: 'Clientes varios',
    total: 137.16,
    subtotal: 116.24,
    igv: 20.92,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Tee sanitaria PVC 2" x 2"', cantidad: 12, costo_unitario: 11.43, subtotal: 137.16 }
    ]
  },
  {
    id: 'cmp-10',
    fecha: '2026-08-19T11:00:00Z',
    fechaDisplay: '19/08/2026',
    tipo_documento: 'FACTURA',
    numero_factura: 'e001-00002528',
    proveedor_nombre: 'VALENCIA BAZAN, CRISTHIAN IRVING',
    total: 1564.49,
    subtotal: 1325.84,
    igv: 238.65,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Cemento Sol tipo I (Bolsa 42.5kg)', cantidad: 50, costo_unitario: 31.29, subtotal: 1564.49 }
    ]
  },
  {
    id: 'cmp-11',
    fecha: '2026-08-11T13:45:00Z',
    fechaDisplay: '11/08/2026',
    tipo_documento: 'FACTURA',
    numero_factura: 'gdfg-dfgdfgdfg',
    proveedor_nombre: 'VALENCIA BAZAN, CRISTHIAN IRVING',
    total: 16500.00,
    subtotal: 13983.05,
    igv: 2516.95,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Ladrillo King Kong 18 huecos (Millares)', cantidad: 30, costo_unitario: 550.00, subtotal: 16500.00 }
    ]
  },
  {
    id: 'cmp-12',
    fecha: '2026-08-11T14:15:00Z',
    fechaDisplay: '11/08/2026',
    tipo_documento: 'TICKET',
    numero_factura: 'fds-00000fsd',
    proveedor_nombre: 'VALENCIA BAZAN, CRISTHIAN IRVING',
    total: 11000.00,
    subtotal: 9322.03,
    igv: 1677.97,
    cre: null,
    estado: 'Recibida',
    items: [
      { producto_nombre: 'Ladrillo Pandereta 6 huecos (Millares)', cantidad: 25, costo_unitario: 440.00, subtotal: 11000.00 }
    ]
  }
];

// ── REGISTROS INICIALES EXACTOS AL SCREENSHOT DE PROVEEDORES ──
const SEED_PROVEEDORES = [
  {
    id: 'prov-seed-1',
    nit: '000000',
    doc_tipo: 'DOC',
    doc_display: '000000',
    razon_social: 'Clientes varios',
    telefono: '-',
    email: '-',
    contacto: '—',
    estado: 'Activo',
    direccion: 'Av. Principal s/n',
    ciudad: 'Lima',
    rubro: 'Varios'
  },
  {
    id: 'prov-seed-2',
    nit: '00000',
    doc_tipo: 'DOC',
    doc_display: '00000',
    razon_social: 'Clientes varios',
    telefono: '-',
    email: '-',
    contacto: '—',
    estado: 'Activo',
    direccion: 'Lima, Perú',
    ciudad: 'Lima',
    rubro: 'Varios'
  },
  {
    id: 'prov-seed-3',
    nit: '20603890061',
    doc_tipo: 'RUC',
    doc_display: 'RUC: 20603890061',
    razon_social: 'CORPORACION INDUSTRIAL PSG E.I.R.L.',
    telefono: '-',
    email: '-',
    contacto: '—',
    estado: 'Activo',
    direccion: 'Zona Industrial Mz. B Lt. 4, Ate',
    ciudad: 'Lima',
    rubro: 'Metalmecánica y Construcción'
  },
  {
    id: 'prov-seed-4',
    nit: '20614717697',
    doc_tipo: 'RUC',
    doc_display: 'RUC: 20614717697',
    razon_social: 'Grupo',
    telefono: '949494949',
    email: 'grupo@gmail.com',
    contacto: '—',
    estado: 'Activo',
    direccion: 'Calle Los Negocios 182, Surquillo',
    ciudad: 'Lima',
    rubro: 'Ferretería y Plomería'
  },
  {
    id: 'prov-seed-5',
    nit: '20509422444',
    doc_tipo: 'RUC',
    doc_display: 'RUC: 20509422444',
    razon_social: 'ICO LOGISTICA S.A.C.',
    telefono: '-',
    email: '-',
    contacto: '—',
    estado: 'Activo',
    direccion: 'Av. Elmer Faucett 345, Callao',
    ciudad: 'Lima',
    rubro: 'Logística y Transporte'
  },
  {
    id: 'prov-seed-6',
    nit: '45454545',
    doc_tipo: 'DNI',
    doc_display: 'DNI: 45454545',
    razon_social: 'VALENCIA BAZAN, CRISTHIAN IRVING',
    telefono: '-',
    email: '-',
    contacto: '—',
    estado: 'Activo',
    direccion: 'Av. Pachacútec 1024, Villa El Salvador',
    ciudad: 'Lima',
    rubro: 'Materiales de Construcción'
  }
];

export const getSupplierDocDisplay = (p) => {
  if (p.doc_display) return p.doc_display;
  const num = (p.nit || '').trim();
  if (!num) return '-';
  if (num.length === 11 && num.startsWith('20')) return `RUC: ${num}`;
  if (num.length === 8) return `DNI: ${num}`;
  return num;
};

export default function PurchasesView({ initialTab = 'compras', onSelectView }) {
  // 3 Pestañas: 'nueva_compra', 'compras', 'proveedores'
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const [proveedores, setProveedores] = useState([]);
  const [compras, setCompras] = useState([]);
  const [products, setProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);
  const [selectedCompraDetail, setSelectedCompraDetail] = useState(null);

  // ── ESTADO ESPECÍFICO DE PROVEEDORES (EXACTO A LA CAPTURA) ──
  const [soloInactivos, setSoloInactivos] = useState(false);
  const [selectedSupplierDetail, setSelectedSupplierDetail] = useState(null);
  const [selectedSupplierPurchases, setSelectedSupplierPurchases] = useState(null);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ── ESTADO FORMULARIO "NUEVA COMPRA" (IDÉNTICO A LA CAPTURA) ──
  const [selectedSupplier, setSelectedSupplier] = useState('');
  const [tipoDocumento, setTipoDocumento] = useState('FACTURA');
  const [serie, setSerie] = useState('F001');
  const [numeroComprobante, setNumeroComprobante] = useState('');
  const [fechaEmision, setFechaEmision] = useState(new Date().toISOString().split('T')[0]);
  const [metodoPago, setMetodoPago] = useState('CREDITO');
  const [incluyeIgv, setIncluyeIgv] = useState(false);
  const [purchaseItems, setPurchaseItems] = useState([]);

  // Modales
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [productSearchTerm, setProductSearchTerm] = useState('');
  const [isNewProductModalOpen, setIsNewProductModalOpen] = useState(false);
  const [newProductForm, setNewProductForm] = useState({
    nombre: '',
    categoria: 'Abarrotes',
    unidad_medida: 'Unidad',
    precio_compra: '',
    precio_venta: '',
    stock_actual: '10',
    codigo_barras: ''
  });

  // Modal / Form Nuevo Proveedor
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    id: '',
    doc_tipo: 'RUC',
    nit: '',
    razon_social: '',
    contacto: '',
    telefono: '',
    email: '',
    direccion: '',
    ciudad: 'Lima',
    rubro: 'Distribución General',
    estado: 'Activo'
  });
  const [editingSupplier, setEditingSupplier] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadData = async () => {
    try {
      let provs = await db.proveedores.toArray();
      const requiredNits = ['000000', '00000', '20603890061', '20614717697', '20509422444', '45454545'];
      const hasAllSeeds = provs && requiredNits.every(nit => provs.some(p => (p.nit || '').replace(/\s+/g, '') === nit));
      
      if (!hasAllSeeds) {
        if (!provs || provs.length === 0) {
          await db.proveedores.bulkAdd(SEED_PROVEEDORES);
          provs = SEED_PROVEEDORES;
        } else {
          for (const sp of SEED_PROVEEDORES) {
            const exists = provs.some(p => (p.nit || '').replace(/\s+/g, '') === sp.nit && p.razon_social === sp.razon_social);
            if (!exists) {
              await db.proveedores.add(sp);
            }
          }
          provs = await db.proveedores.toArray();
        }
      }
      setProveedores(provs || []);

      let prods = await db.productos_tienda.toArray();
      if (!prods || prods.length === 0) {
        prods = await db.productos.toArray();
      }
      setProducts(prods || []);

      let buys = await db.compras.reverse().toArray();
      if (!buys || buys.length === 0) {
        await db.compras.bulkAdd(SEED_COMPRAS);
        buys = SEED_COMPRAS;
      }
      setCompras(buys);

      if (provs && provs.length > 0 && !selectedSupplier) {
        setSelectedSupplier(provs[0].id);
      }
    } catch (err) {
      console.warn('Error loading compras data:', err);
      setProveedores(SEED_PROVEEDORES);
      setCompras(SEED_COMPRAS);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── CÁLCULO DE TOTALES SEGÚN CHECKBOX DE IGV ──
  const subtotalBruto = useMemo(() => {
    return purchaseItems.reduce((acc, item) => {
      const cant = Number(item.cantidad) || 0;
      const costo = Number(item.costo_unitario) || 0;
      return acc + (cant * costo);
    }, 0);
  }, [purchaseItems]);

  const { subtotal, igv, total } = useMemo(() => {
    if (incluyeIgv) {
      const tot = subtotalBruto;
      const sub = tot / 1.18;
      const igvVal = tot - sub;
      return { subtotal: sub, igv: igvVal, total: tot };
    } else {
      const sub = subtotalBruto;
      const igvVal = sub * 0.18;
      const tot = sub + igvVal;
      return { subtotal: sub, igv: igvVal, total: tot };
    }
  }, [subtotalBruto, incluyeIgv]);

  // ── ACCIONES PARA ÍTEMS DE COMPRA ──
  const handleAddItemToPurchase = (prod) => {
    const existingIndex = purchaseItems.findIndex(i => i.producto_id === prod.id);
    if (existingIndex >= 0) {
      const updated = [...purchaseItems];
      updated[existingIndex].cantidad = Number(updated[existingIndex].cantidad || 1) + 1;
      setPurchaseItems(updated);
    } else {
      setPurchaseItems(prev => [
        ...prev,
        {
          id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          producto_id: prod.id,
          producto_nombre: prod.nombre,
          unidad_medida: prod.unidad_medida || 'Unidad',
          cantidad: 1,
          costo_unitario: Number(prod.precio_compra) || 10.00
        }
      ]);
    }
    setIsAddProductModalOpen(false);
    setProductSearchTerm('');
  };

  const handleUpdateItem = (index, field, value) => {
    const updated = [...purchaseItems];
    updated[index][field] = value;
    setPurchaseItems(updated);
  };

  const handleRemoveItem = (index) => {
    setPurchaseItems(purchaseItems.filter((_, idx) => idx !== index));
  };

  // ── REGISTRAR NUEVO PRODUCTO DESDE EL MODAL ──
  const handleCreateNewProduct = async (e) => {
    e.preventDefault();
    if (!newProductForm.nombre.trim()) return;

    const newProd = {
      id: `prod-${Date.now()}`,
      nombre: newProductForm.nombre.trim(),
      categoria: newProductForm.categoria.trim() || 'General',
      unidad_medida: newProductForm.unidad_medida.trim() || 'Unidad',
      precio_compra: Number(newProductForm.precio_compra) || 10.00,
      precio_venta: Number(newProductForm.precio_venta) || (Number(newProductForm.precio_compra || 10) * 1.3),
      stock_actual: Number(newProductForm.stock_actual) || 0,
      codigo_barras: newProductForm.codigo_barras.trim() || String(Math.floor(100000000000 + Math.random() * 900000000000)),
      activo: true
    };

    await db.productos_tienda.add(newProd);
    await loadData();

    // Agregar automáticamente a la compra
    handleAddItemToPurchase(newProd);

    setIsNewProductModalOpen(false);
    setNewProductForm({
      nombre: '',
      categoria: 'Abarrotes',
      unidad_medida: 'Unidad',
      precio_compra: '',
      precio_venta: '',
      stock_actual: '10',
      codigo_barras: ''
    });
    showToast(`¡Producto "${newProd.nombre}" creado y añadido a la compra!`);
  };

  // ── GUARDAR COMPRA COMPLETA ──
  const handleSavePurchase = async (e) => {
    if (e) e.preventDefault();
    if (!selectedSupplier) {
      alert('Por favor seleccione un proveedor.');
      return;
    }
    if (purchaseItems.length === 0) {
      alert('Debe agregar al menos un producto para armar el detalle de la compra.');
      return;
    }

    const supp = proveedores.find(p => p.id === selectedSupplier) || { razon_social: 'Proveedor General', nit: '0' };
    const numComp = numeroComprobante.trim() || `000${Math.floor(1000 + Math.random() * 9000)}`;
    const fullFactura = `${serie.trim() || 'F001'}-${numComp}`;

    // 1. Guardar la compra en Dexie
    const newCompra = {
      id: `cmp-${Date.now()}`,
      fecha: fechaEmision ? new Date(fechaEmision).toISOString() : new Date().toISOString(),
      fechaDisplay: fechaEmision ? `${fechaEmision.split('-')[2]}/${fechaEmision.split('-')[1]}/${fechaEmision.split('-')[0]}` : '20/09/2026',
      proveedor_id: supp.id,
      proveedor_nombre: supp.razon_social,
      proveedor_nit: supp.nit || '0',
      tipo_documento: tipoDocumento,
      serie: serie.trim() || 'F001',
      numero_factura: fullFactura,
      estado_pago: metodoPago === 'CREDITO' ? 'CREDITO' : 'CONTADO',
      metodo_pago: metodoPago,
      incluye_igv: incluyeIgv,
      subtotal: subtotal,
      igv: igv,
      total: total,
      estado: 'Recibida',
      items: purchaseItems,
      almacen_destino: 'Almacén Principal'
    };

    await db.compras.add(newCompra);

    // 2. Actualizar stock y registrar en Kardex por cada ítem
    for (const item of purchaseItems) {
      const prod = products.find(p => p.id === item.producto_id) || await db.productos_tienda.get(item.producto_id);
      const cantNum = Number(item.cantidad) || 0;
      const costoNum = Number(item.costo_unitario) || 0;

      if (prod) {
        const nuevoStock = (Number(prod.stock_actual) || 0) + cantNum;
        await db.productos_tienda.update(prod.id, {
          stock_actual: nuevoStock,
          precio_compra: costoNum
        });

        if (db.kardex) {
          await db.kardex.add({
            id: `kdx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            fecha: new Date().toISOString(),
            producto_id: prod.id,
            producto_nombre: prod.nombre,
            tipo: 'ENTRADA',
            cantidad: cantNum,
            motivo: `Compra ${tipoDocumento} ${fullFactura} - ${supp.razon_social}`,
            saldo_nuevo: nuevoStock,
            costo_unitario: costoNum
          });
        }
      }
    }

    setPurchaseItems([]);
    setNumeroComprobante('');
    showToast(`¡Compra ${fullFactura} registrada con éxito! (+${purchaseItems.length} productos recibidos)`);
    syncService.triggerBackgroundSync();
    await loadData();
    setActiveTab('compras');
  };

  // ── TOGGLE ANULADA / RECIBIDA ──
  const handleToggleAnulada = async (id, currentEstado) => {
    const isCurrentlyAnulada = currentEstado === 'Anulada';
    const nuevoEstado = isCurrentlyAnulada ? 'Recibida' : 'Anulada';
    if (!window.confirm(`¿Desea marcar esta compra como "${nuevoEstado}"?`)) return;

    const updated = compras.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c);
    setCompras(updated);
    try {
      await db.compras.update(id, { estado: nuevoEstado });
    } catch (e) {
      // ignore
    }
    showToast(`Compra actualizada a estado: ${nuevoEstado}`);
    syncService.triggerBackgroundSync();
  };

  // ── MANEJO DE PROVEEDORES ──
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    if (!supplierForm.razon_social.trim()) return;

    let docDisplay = supplierForm.nit.trim();
    if (supplierForm.doc_tipo === 'RUC' && !docDisplay.startsWith('RUC:')) {
      docDisplay = `RUC: ${docDisplay}`;
    } else if (supplierForm.doc_tipo === 'DNI' && !docDisplay.startsWith('DNI:')) {
      docDisplay = `DNI: ${docDisplay}`;
    }

    if (editingSupplier) {
      await db.proveedores.update(editingSupplier.id, {
        razon_social: supplierForm.razon_social.trim(),
        nit: supplierForm.nit.trim(),
        doc_tipo: supplierForm.doc_tipo,
        doc_display: docDisplay,
        contacto: supplierForm.contacto.trim() || '—',
        telefono: supplierForm.telefono.trim() || '-',
        email: supplierForm.email.trim() || '-',
        direccion: supplierForm.direccion.trim() || '',
        ciudad: supplierForm.ciudad || 'Lima',
        rubro: supplierForm.rubro || 'General',
        estado: supplierForm.estado || 'Activo'
      });
      showToast('¡Proveedor actualizado correctamente!');
    } else {
      const newProvId = `prov-${Date.now()}`;
      await db.proveedores.add({
        id: newProvId,
        razon_social: supplierForm.razon_social.trim(),
        nit: supplierForm.nit.trim() || '000000',
        doc_tipo: supplierForm.doc_tipo,
        doc_display: docDisplay,
        contacto: supplierForm.contacto.trim() || '—',
        telefono: supplierForm.telefono.trim() || '-',
        email: supplierForm.email.trim() || '-',
        direccion: supplierForm.direccion.trim() || '',
        ciudad: supplierForm.ciudad || 'Lima',
        rubro: supplierForm.rubro || 'General',
        estado: supplierForm.estado || 'Activo'
      });
      setSelectedSupplier(newProvId);
      showToast('¡Nuevo proveedor registrado exitosamente!');
    }

    setIsSupplierModalOpen(false);
    setEditingSupplier(null);
    setSupplierForm({
      id: '',
      doc_tipo: 'RUC',
      nit: '',
      razon_social: '',
      contacto: '',
      telefono: '',
      email: '',
      direccion: '',
      ciudad: 'Lima',
      rubro: 'Distribución General',
      estado: 'Activo'
    });
    syncService.triggerBackgroundSync();
    await loadData();
  };

  const handleEditSupplier = (prov) => {
    setEditingSupplier(prov);
    setSupplierForm({
      id: prov.id,
      doc_tipo: prov.doc_tipo || (prov.nit?.length === 8 ? 'DNI' : 'RUC'),
      nit: (prov.nit || '').replace(/^RUC:\s*|^DNI:\s*/, ''),
      razon_social: prov.razon_social || '',
      contacto: prov.contacto === '—' ? '' : (prov.contacto || ''),
      telefono: prov.telefono === '-' ? '' : (prov.telefono || ''),
      email: prov.email === '-' ? '' : (prov.email || ''),
      direccion: prov.direccion || '',
      ciudad: prov.ciudad || 'Lima',
      rubro: prov.rubro || 'General',
      estado: prov.estado || 'Activo'
    });
    setIsSupplierModalOpen(true);
  };

  const handleDeleteSupplier = async (id) => {
    if (!window.confirm('¿Deseas eliminar este proveedor?')) return;
    await db.proveedores.delete(id);
    await loadData();
    showToast('Proveedor eliminado.');
    syncService.triggerBackgroundSync();
  };

  const handleToggleSupplierStatus = async (prov) => {
    const nuevoEstado = prov.estado === 'Inactivo' ? 'Activo' : 'Inactivo';
    await db.proveedores.update(prov.id, { estado: nuevoEstado });
    await loadData();
    showToast(`Proveedor marcado como ${nuevoEstado}`);
    syncService.triggerBackgroundSync();
  };

  // ── FILTRADO DE COMPRAS (BUSCADOR EXACTO AL SCREENSHOT) ──
  const filteredCompras = useMemo(() => {
    return compras.filter(c => {
      const term = search.toLowerCase();
      const text = `${c.proveedor_nombre || ''} ${c.producto_nombre || ''} ${c.numero_factura || ''} ${c.tipo_documento || ''} ${c.estado || ''} ${c.fechaDisplay || ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [compras, search]);

  // ── FILTRADO DE PROVEEDORES (BUSCADOR Y SOLO INACTIVOS) ──
  const filteredProveedores = useMemo(() => {
    return proveedores.filter(p => {
      const isActivo = p.estado !== 'Inactivo';
      if (soloInactivos && isActivo) return false;
      if (!soloInactivos && !isActivo) return false;

      if (!search.trim()) return true;
      const term = search.toLowerCase();
      const doc = (p.doc_display || p.nit || '').toLowerCase();
      const text = `${p.razon_social || ''} ${doc} ${p.telefono || ''} ${p.email || ''} ${p.contacto || ''}`.toLowerCase();
      return text.includes(term);
    });
  }, [proveedores, search, soloInactivos]);

  const filteredModalProducts = useMemo(() => {
    return products.filter(p => 
      p.nombre?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(productSearchTerm.toLowerCase()) ||
      p.codigo_barras?.toLowerCase().includes(productSearchTerm.toLowerCase())
    );
  }, [products, productSearchTerm]);

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── SUB-BARRA DE NAVEGACIÓN SUPERIOR (Nueva compra, Compras, Proveedores) ── */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs select-none">
        <div className="max-w-7xl mx-auto px-4 py-2.5 flex items-center gap-2 overflow-x-auto no-scrollbar">
          
          <button
            type="button"
            onClick={() => setActiveTab('nueva_compra')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'nueva_compra'
                ? 'bg-[#00a650] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <PackagePlus className="w-3.5 h-3.5" />
            <span>Nueva compra</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('compras')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'compras'
                ? 'bg-[#00a650] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Listado de Compras</span>
            {compras.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'compras' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {compras.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('proveedores')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all whitespace-nowrap cursor-pointer ${
              activeTab === 'proveedores'
                ? 'bg-[#00a650] text-white shadow-xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Proveedores</span>
            {proveedores.length > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                activeTab === 'proveedores' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {proveedores.length}
              </span>
            )}
          </button>

        </div>
      </div>

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑA 1: NUEVA COMPRA (ESTRUCTURA IDÉNTICA A LA IMAGEN)          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'nueva_compra' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-5 animate-fadeIn">
            
            {/* 1. Volver al listado */}
            <div>
              <button
                type="button"
                onClick={() => setActiveTab('compras')}
                className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800 transition font-medium"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver al listado</span>
              </button>
            </div>

            {/* 2. Título y Subtítulo */}
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                Nueva compra
              </h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Registre el comprobante del proveedor y el detalle de productos recibidos
              </p>
            </div>

            {/* 3. Formulario Superior */}
            <div className="space-y-3.5 pt-1">
              
              {/* Fila 1: Proveedor */}
              <div>
                <label className="text-xs font-medium text-slate-700 block mb-1">
                  Proveedor <span className="text-rose-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <select
                      value={selectedSupplier}
                      onChange={(e) => setSelectedSupplier(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition cursor-pointer"
                    >
                      <option value="">Seleccionar proveedor...</option>
                      {proveedores.map(p => (
                        <option key={p.id} value={p.id}>
                          {p.razon_social} {p.nit ? `(NIT: ${p.nit})` : ''}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
                      ▼
                    </div>
                  </div>

                  {/* Botón rápido nuevo proveedor [ 👤+ ] */}
                  <button
                    type="button"
                    onClick={() => {
                      setEditingSupplier(null);
                      setSupplierForm({ id: '', razon_social: '', nit: '', contacto: '', telefono: '', ciudad: 'Lima', rubro: 'Distribución General' });
                      setIsSupplierModalOpen(true);
                    }}
                    className="p-2 border border-slate-200 hover:border-emerald-500 rounded-lg text-emerald-600 bg-white hover:bg-emerald-50 transition shrink-0 shadow-2xs"
                    title="Registrar nuevo proveedor"
                  >
                    <UserPlus className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Fila 2: Tipo documento | Serie | Nº comprobante */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Tipo documento
                  </label>
                  <div className="relative">
                    <select
                      value={tipoDocumento}
                      onChange={(e) => setTipoDocumento(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="FACTURA">FACTURA</option>
                      <option value="BOLETA">BOLETA</option>
                      <option value="NOTA DE VENTA">NOTA DE VENTA</option>
                      <option value="GUÍA">GUÍA DE REMISIÓN</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Serie <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. F001"
                    value={serie}
                    onChange={(e) => setSerie(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Nº comprobante <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Ej. 00012345"
                    value={numeroComprobante}
                    onChange={(e) => setNumeroComprobante(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                  />
                </div>
              </div>

              {/* Fila 3: Fecha emisión | Método de pago */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Fecha emisión
                  </label>
                  <div className="relative">
                    <input
                      type="date"
                      value={fechaEmision}
                      onChange={(e) => setFechaEmision(e.target.value)}
                      className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition"
                    />
                    <Calendar className="w-4 h-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700 block mb-1">
                    Método de pago
                  </label>
                  <div className="relative">
                    <select
                      value={metodoPago}
                      onChange={(e) => setMetodoPago(e.target.value)}
                      className="w-full appearance-none bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition cursor-pointer"
                    >
                      <option value="CREDITO">Crédito (sin pago inmediato)</option>
                      <option value="EFECTIVO">Efectivo (Contado)</option>
                      <option value="TRANSFERENCIA">Transferencia / Yape / Plin</option>
                      <option value="TARJETA">Tarjeta de Débito / Crédito</option>
                    </select>
                    <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
                      ▼
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                    {metodoPago === 'CREDITO'
                      ? 'Se registrará como cuenta por pagar al proveedor (CxP): no se descuenta nada ahora, se paga después desde Cuentas por pagar.'
                      : 'Se registrará como compra al contado pagada inmediatamente.'
                    }
                  </p>
                </div>
              </div>

              {/* Fila 4: Checkbox IGV */}
              <div className="pt-1">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={incluyeIgv}
                    onChange={(e) => setIncluyeIgv(e.target.checked)}
                    className="mt-0.5 rounded text-emerald-600 focus:ring-0 border-slate-300"
                  />
                  <div>
                    <span className="text-xs font-semibold text-slate-800">
                      El costo unitario ya incluye IGV
                    </span>
                    <p className="text-[11px] text-slate-400 leading-normal">
                      Se agregará el IGV sobre el costo que ingrese (ej. 100.00 → valor 100.00 + IGV 18.00). No aplica a ítems exonerados o inafectos.
                    </p>
                  </div>
                </label>
              </div>

            </div>

            {/* 4. Barra de Acciones de Productos */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(true)}
                  className="px-3.5 py-1.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-lg text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Agregar producto</span>
                </button>

                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(true)}
                  className="px-3.5 py-1.5 bg-white hover:bg-emerald-50 text-[#00a650] border border-[#00a650] rounded-lg text-xs font-bold transition flex items-center gap-1.5"
                >
                  <PackagePlus className="w-3.5 h-3.5" />
                  <span>Nuevo producto</span>
                </button>
              </div>

              <div className="text-xs text-slate-400 font-medium self-end sm:self-auto">
                Total de ítems: {purchaseItems.length}
              </div>
            </div>

            {/* 5. Tabla de Detalle de Productos */}
            <div className="border border-slate-200/90 rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold">PRODUCTO</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">UNID.</th>
                      <th className="py-2.5 px-3 font-semibold text-center w-28">CANT.</th>
                      <th className="py-2.5 px-4 font-semibold text-right w-36">COSTO UNIT.</th>
                      <th className="py-2.5 px-4 font-semibold text-right w-36">SUBTOTAL</th>
                      <th className="py-2.5 px-2 text-center w-10"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {purchaseItems.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 text-xs">
                          Sin ítems. Use <strong className="text-slate-600 font-bold">Agregar producto</strong> para armar el detalle.
                        </td>
                      </tr>
                    ) : (
                      purchaseItems.map((item, index) => {
                        const cant = Number(item.cantidad) || 0;
                        const cost = Number(item.costo_unitario) || 0;
                        const sub = cant * cost;

                        return (
                          <tr key={item.id} className="hover:bg-slate-50/60 transition">
                            <td className="py-2.5 px-4 font-medium text-slate-800">
                              {item.producto_nombre}
                            </td>
                            <td className="py-2.5 px-3 text-center text-slate-500">
                              {item.unidad_medida || 'Unidad'}
                            </td>
                            <td className="py-2.5 px-3 text-center">
                              <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => handleUpdateItem(index, 'cantidad', e.target.value)}
                                className="w-20 text-center py-1 px-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                              />
                            </td>
                            <td className="py-2.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1 justify-end">
                                <span className="text-[11px] text-slate-400 font-medium">S/</span>
                                <input
                                  type="number"
                                  step="0.01"
                                  min="0.01"
                                  value={item.costo_unitario}
                                  onChange={(e) => handleUpdateItem(index, 'costo_unitario', e.target.value)}
                                  className="w-24 text-right py-1 px-1.5 border border-slate-200 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500"
                                />
                              </div>
                            </td>
                            <td className="py-2.5 px-4 text-right font-bold text-slate-800">
                              S/ {sub.toFixed(2)}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => handleRemoveItem(index)}
                                className="p-1 text-slate-400 hover:text-rose-600 rounded-md transition hover:bg-rose-50"
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

            {/* 6. Totales (Subtotal / IGV / Total) */}
            <div className="flex justify-end pt-1">
              <div className="w-64 space-y-1.5 text-xs text-right">
                <div className="flex justify-between items-center text-slate-500">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-700 font-mono">S/ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-500">
                  <span>IGV</span>
                  <span className="font-medium text-slate-700 font-mono">S/ {igv.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-slate-100 text-sm font-bold text-slate-900">
                  <span>Total</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">S/ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* 7. Barra Inferior de Acciones */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setActiveTab('compras')}
                className="w-full sm:w-1/2 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-2xs text-center"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSavePurchase}
                className="w-full sm:w-1/2 py-2.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold transition shadow-sm flex items-center justify-center gap-1.5"
              >
                <span>Registrar compra</span>
              </button>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑA 2: COMPRAS (LISTADO IDÉNTICO A LA CAPTURA)                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'compras' && (
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 space-y-4 animate-fadeIn">
            
            {/* Header: Título, Subtítulo y Botón + Nueva compra */}
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                  Compras
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Listado de compras registradas
                </p>
              </div>

              <button
                type="button"
                onClick={() => setActiveTab('nueva_compra')}
                className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs self-start cursor-pointer active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Nueva compra</span>
              </button>
            </div>

            {/* Buscador */}
            <div className="pt-1">
              <div className="relative w-full max-w-xs">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8.5 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-emerald-500 transition shadow-2xs placeholder:text-slate-400"
                />
                {search && (
                  <button
                    onClick={() => setSearch('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                  >
                    ×
                  </button>
                )}
              </div>
            </div>

            {/* Tabla de Compras */}
            <div className="border border-slate-200/80 rounded-xl overflow-hidden mt-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4 font-semibold">FECHA</th>
                      <th className="py-3 px-4 font-semibold">COMPROBANTE</th>
                      <th className="py-3 px-4 font-semibold">PROVEEDOR</th>
                      <th className="py-3 px-4 font-semibold text-right">TOTAL</th>
                      <th className="py-3 px-4 font-semibold text-center">CRE</th>
                      <th className="py-3 px-4 font-semibold text-center">ESTADO</th>
                      <th className="py-3 px-4 font-semibold text-center">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredCompras.map((c) => {
                      const isAnulada = c.estado === 'Anulada' || c.estado_pago === 'ANULADA';
                      return (
                        <tr key={c.id} className="hover:bg-slate-50/60 transition">
                          {/* FECHA */}
                          <td className="py-3 px-4 text-slate-600 whitespace-nowrap font-medium">
                            {c.fechaDisplay || (c.fecha ? new Date(c.fecha).toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' }) : '—')}
                          </td>

                          {/* COMPROBANTE (Tipo arriba, Serie-Correlativo abajo) */}
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="text-[10px] uppercase font-bold text-slate-400 block tracking-wider leading-tight">
                              {c.tipo_documento || 'FACTURA'}
                            </span>
                            <span className="font-bold text-slate-900 font-mono text-xs">
                              {c.numero_factura}
                            </span>
                          </td>

                          {/* PROVEEDOR */}
                          <td className="py-3 px-4 text-slate-800 font-medium">
                            {c.proveedor_nombre}
                          </td>

                          {/* TOTAL */}
                          <td className="py-3 px-4 text-right font-extrabold text-slate-900 whitespace-nowrap">
                            S/ {Number(c.total || 0).toFixed(2)}
                          </td>

                          {/* CRE */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            {c.cre ? (
                              <span className="inline-block px-2 py-0.5 rounded text-[10px] font-mono font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                {c.cre}
                              </span>
                            ) : (
                              <span className="text-slate-300">—</span>
                            )}
                          </td>

                          {/* ESTADO */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <span className={`inline-block px-2.5 py-0.5 rounded text-[11px] font-medium ${
                              isAnulada
                                ? 'bg-rose-50 text-rose-600'
                                : 'bg-emerald-50 text-emerald-700'
                            }`}>
                              {isAnulada ? 'Anulada' : 'Recibida'}
                            </span>
                          </td>

                          {/* ACCIONES */}
                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="inline-flex items-center gap-2 justify-center">
                              {/* Botón Ver (Ojo verde) */}
                              <button
                                type="button"
                                onClick={() => setSelectedCompraDetail(c)}
                                className="p-1 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 transition"
                                title="Ver detalle de compra"
                              >
                                <Eye className="w-4 h-4" />
                              </button>

                              {/* Botón Anular (Ban rojo) */}
                              <button
                                type="button"
                                onClick={() => handleToggleAnulada(c.id, c.estado)}
                                className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition"
                                title={isAnulada ? 'Restablecer compra' : 'Anular compra'}
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredCompras.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                          No se encontraron compras registradas con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* PESTAÑA 3: PROVEEDORES (ESTRUCTURA IDÉNTICA A LA IMAGEN)          */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        {activeTab === 'proveedores' && (
          <div className="space-y-4 animate-fadeIn">
            {/* Header: Título, subtítulo y botones Importar / Nuevo proveedor */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  Proveedores
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gestión de contactos tipo proveedor
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportModalOpen(true)}
                  className="px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Importar</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setEditingSupplier(null);
                    setSupplierForm({
                      id: '',
                      doc_tipo: 'RUC',
                      nit: '',
                      razon_social: '',
                      contacto: '',
                      telefono: '',
                      email: '',
                      direccion: '',
                      ciudad: 'Lima',
                      rubro: 'Distribución General',
                      estado: 'Activo'
                    });
                    setIsSupplierModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>+ Nuevo proveedor</span>
                </button>
              </div>
            </div>

            {/* Barra de Filtros: Buscador + Switch "Solo inactivos" */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative w-72">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar..."
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs transition"
                />
              </div>

              <label className="flex items-center gap-2.5 cursor-pointer select-none text-xs text-slate-600 font-medium">
                <span>Solo inactivos</span>
                <button
                  type="button"
                  onClick={() => setSoloInactivos(!soloInactivos)}
                  className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                    soloInactivos ? 'bg-[#00a650]' : 'bg-slate-300'
                  }`}
                  aria-pressed={soloInactivos}
                >
                  <span
                    className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                      soloInactivos ? 'translate-x-4' : 'translate-x-0'
                    }`}
                  />
                </button>
              </label>
            </div>

            {/* Tabla de Proveedores (Idéntica al Screenshot) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-white">
                      <th className="py-3 px-4">DOC.</th>
                      <th className="py-3 px-4">NOMBRE / RAZÓN SOCIAL</th>
                      <th className="py-3 px-4">TELÉFONO</th>
                      <th className="py-3 px-4">EMAIL</th>
                      <th className="py-3 px-4">CONTACTO</th>
                      <th className="py-3 px-4">ESTADO</th>
                      <th className="py-3 px-4 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {filteredProveedores.map((prov) => {
                      const isActivo = prov.estado !== 'Inactivo';
                      return (
                        <tr key={prov.id} className="hover:bg-slate-50/70 transition">
                          {/* DOC. */}
                          <td className="py-3.5 px-4 font-mono text-slate-600 whitespace-nowrap">
                            {getSupplierDocDisplay(prov)}
                          </td>

                          {/* NOMBRE / RAZÓN SOCIAL */}
                          <td className="py-3.5 px-4 font-semibold text-slate-800">
                            {prov.razon_social}
                          </td>

                          {/* TELÉFONO */}
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap font-mono">
                            {prov.telefono && prov.telefono !== '-' ? prov.telefono : '-'}
                          </td>

                          {/* EMAIL */}
                          <td className="py-3.5 px-4 text-slate-600 whitespace-nowrap">
                            {prov.email && prov.email !== '-' ? prov.email : '-'}
                          </td>

                          {/* CONTACTO */}
                          <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                            {prov.contacto && prov.contacto !== '-' ? prov.contacto : '—'}
                          </td>

                          {/* ESTADO */}
                          <td className="py-3.5 px-4 whitespace-nowrap">
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                                isActivo
                                  ? 'bg-emerald-50 text-emerald-700'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {isActivo ? 'Activo' : 'Inactivo'}
                            </span>
                          </td>

                          {/* ACCIONES (4 BOTONES: OJO AZUL, COMPRAS VERDE, EDITAR ÁMBAR, ELIMINAR ROJO) */}
                          <td className="py-3.5 px-4 text-right whitespace-nowrap">
                            <div className="inline-flex items-center gap-1.5 justify-end">
                              {/* Botón 1: Ojo azul (Ver ficha) */}
                              <button
                                type="button"
                                onClick={() => setSelectedSupplierDetail(prov)}
                                title="Ver detalles del proveedor"
                                className="w-7 h-7 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 flex items-center justify-center transition cursor-pointer"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>

                              {/* Botón 2: Compras verde (Ver compras asociadas) */}
                              <button
                                type="button"
                                onClick={() => setSelectedSupplierPurchases(prov)}
                                title="Ver historial de compras"
                                className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-600 hover:bg-emerald-100 flex items-center justify-center transition cursor-pointer"
                              >
                                <Receipt className="w-3.5 h-3.5" />
                              </button>

                              {/* Botón 3: Editar ámbar */}
                              <button
                                type="button"
                                onClick={() => handleEditSupplier(prov)}
                                title="Editar proveedor"
                                className="w-7 h-7 rounded-lg bg-amber-50 text-amber-600 hover:bg-amber-100 flex items-center justify-center transition cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>

                              {/* Botón 4: Eliminar rojo */}
                              <button
                                type="button"
                                onClick={() => handleDeleteSupplier(prov.id)}
                                title="Eliminar proveedor"
                                className="w-7 h-7 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100 flex items-center justify-center transition cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}

                    {filteredProveedores.length === 0 && (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 italic">
                          No se encontraron proveedores registrados con los filtros aplicados.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Texto inferior exacto */}
            <p className="text-xs text-slate-500 px-0.5">
              {filteredProveedores.length} proveedores - use el buscador para filtrar
            </p>
          </div>
        )}

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: VER DETALLE DE COMPRA (OJO VERDE)                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedCompraDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Detalle de Compra</h3>
                  <p className="text-[11px] text-slate-400 font-mono">
                    {selectedCompraDetail.tipo_documento} • {selectedCompraDetail.numero_factura}
                  </p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setSelectedCompraDetail(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1.5">
              <div className="flex justify-between">
                <span className="text-slate-400">Proveedor:</span>
                <span className="font-bold text-slate-800">{selectedCompraDetail.proveedor_nombre}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Fecha:</span>
                <span className="font-semibold text-slate-700">{selectedCompraDetail.fechaDisplay || new Date(selectedCompraDetail.fecha).toLocaleDateString('es-PE')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Estado:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                  selectedCompraDetail.estado === 'Anulada' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  {selectedCompraDetail.estado || 'Recibida'}
                </span>
              </div>
            </div>

            {/* Ítems */}
            <div className="border border-slate-200 rounded-xl overflow-hidden max-h-56 overflow-y-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-2 px-3">Producto</th>
                    <th className="py-2 px-2 text-center">Cant.</th>
                    <th className="py-2 px-3 text-right">Costo</th>
                    <th className="py-2 px-3 text-right">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {Array.isArray(selectedCompraDetail.items) && selectedCompraDetail.items.length > 0 ? (
                    selectedCompraDetail.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="py-2 px-3 text-slate-800 font-medium">{it.producto_nombre}</td>
                        <td className="py-2 px-2 text-center font-bold text-slate-700">{it.cantidad}</td>
                        <td className="py-2 px-3 text-right text-slate-600 font-mono">S/ {Number(it.costo_unitario || 0).toFixed(2)}</td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900 font-mono">S/ {Number(it.subtotal || (it.cantidad * it.costo_unitario) || 0).toFixed(2)}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-4 text-center text-slate-400">
                        {selectedCompraDetail.producto_nombre || 'Detalle general'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Totales */}
            <div className="flex justify-end pt-1">
              <div className="w-48 space-y-1 text-xs text-right">
                <div className="flex justify-between text-slate-500">
                  <span>Subtotal:</span>
                  <span className="font-mono">S/ {Number(selectedCompraDetail.subtotal || selectedCompraDetail.total * 0.82).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>IGV (18%):</span>
                  <span className="font-mono">S/ {Number(selectedCompraDetail.igv || selectedCompraDetail.total * 0.18).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm font-extrabold text-slate-900 pt-1 border-t border-slate-100">
                  <span>Total:</span>
                  <span className="font-mono text-emerald-700">S/ {Number(selectedCompraDetail.total || 0).toFixed(2)}</span>
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCompraDetail(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: AGREGAR PRODUCTO DESDE CATÁLOGO                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Seleccionar Producto</h3>
                  <p className="text-[11px] text-slate-400">Elige un producto de tu catálogo para agregar a la compra</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsAddProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={productSearchTerm}
                onChange={(e) => setProductSearchTerm(e.target.value)}
                placeholder="Buscar por nombre, categoría o código..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
                autoFocus
              />
            </div>

            <div className="max-h-64 overflow-y-auto divide-y divide-slate-100 border border-slate-100 rounded-xl">
              {filteredModalProducts.map(prod => (
                <div
                  key={prod.id}
                  onClick={() => handleAddItemToPurchase(prod)}
                  className="p-3 hover:bg-emerald-50/60 cursor-pointer transition flex items-center justify-between"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-bold text-slate-900 truncate">{prod.nombre}</p>
                    <span className="text-[10px] text-slate-400">{prod.categoria || 'General'} • Stock actual: {prod.stock_actual ?? 0} {prod.unidad_medida || 'Unid'}</span>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold text-emerald-700 block font-mono">
                      Costo: S/ {Number(prod.precio_compra || 0).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-slate-400">P. Venta: S/ {Number(prod.precio_venta || 0).toFixed(2)}</span>
                  </div>
                </div>
              ))}
              {filteredModalProducts.length === 0 && (
                <div className="p-8 text-center text-slate-400 text-xs">
                  No se encontraron productos. Puedes crear uno nuevo usando "Nuevo producto".
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsAddProductModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: NUEVO PRODUCTO RÁPIDO                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isNewProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <PackagePlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Registrar Nuevo Producto</h3>
                  <p className="text-[11px] text-slate-400">Se guardará en el catálogo y se añadirá a la compra</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsNewProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Arroz Costeño 5kg"
                  value={newProductForm.nombre}
                  onChange={(e) => setNewProductForm({ ...newProductForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    placeholder="Ej. Abarrotes"
                    value={newProductForm.categoria}
                    onChange={(e) => setNewProductForm({ ...newProductForm, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad Medida</label>
                  <select
                    value={newProductForm.unidad_medida}
                    onChange={(e) => setNewProductForm({ ...newProductForm, unidad_medida: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Kilogramo">Kilogramo (Kg)</option>
                    <option value="Litro">Litro (L)</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Caja">Caja</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo de Compra (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder="0.00"
                    value={newProductForm.precio_compra}
                    onChange={(e) => setNewProductForm({ ...newProductForm, precio_compra: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio de Venta (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    value={newProductForm.precio_venta}
                    onChange={(e) => setNewProductForm({ ...newProductForm, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Código de Barras (Opcional)</label>
                <input
                  type="text"
                  placeholder="Escanee o ingrese código"
                  value={newProductForm.codigo_barras}
                  onChange={(e) => setNewProductForm({ ...newProductForm, codigo_barras: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewProductModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-xl transition shadow-2xs"
                >
                  Crear y Agregar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: CREAR / EDITAR PROVEEDOR                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <Building2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">
                    {editingSupplier ? 'Editar Proveedor' : 'Nuevo Proveedor'}
                  </h3>
                  <p className="text-[11px] text-slate-400">Complete los datos de contacto y facturación del proveedor</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplier} className="space-y-3">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Tipo Doc.</label>
                  <select
                    value={supplierForm.doc_tipo}
                    onChange={(e) => setSupplierForm({ ...supplierForm, doc_tipo: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="RUC">RUC</option>
                    <option value="DNI">DNI</option>
                    <option value="DOC">DOC / OTRO</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs font-bold text-slate-700 block mb-1">Número de Documento *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 20603890061 o 000000"
                    value={supplierForm.nit}
                    onChange={(e) => setSupplierForm({ ...supplierForm, nit: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                    autoFocus
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. CORPORACION INDUSTRIAL PSG E.I.R.L."
                  value={supplierForm.razon_social}
                  onChange={(e) => setSupplierForm({ ...supplierForm, razon_social: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej. 949494949"
                    value={supplierForm.telefono}
                    onChange={(e) => setSupplierForm({ ...supplierForm, telefono: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Email</label>
                  <input
                    type="email"
                    placeholder="proveedor@empresa.com"
                    value={supplierForm.email}
                    onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Persona de Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. Juan Pérez"
                    value={supplierForm.contacto}
                    onChange={(e) => setSupplierForm({ ...supplierForm, contacto: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Rubro / Especialidad</label>
                  <input
                    type="text"
                    placeholder="Ej. Ferretería, Plásticos"
                    value={supplierForm.rubro}
                    onChange={(e) => setSupplierForm({ ...supplierForm, rubro: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Dirección (Opcional)</label>
                  <input
                    type="text"
                    placeholder="Ej. Av. Los Laureles 123"
                    value={supplierForm.direccion}
                    onChange={(e) => setSupplierForm({ ...supplierForm, direccion: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={supplierForm.estado}
                    onChange={(e) => setSupplierForm({ ...supplierForm, estado: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: VER DETALLE DEL PROVEEDOR (OJO AZUL)                       */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedSupplierDetail && (() => {
        const provPurchases = compras.filter(
          c => c.proveedor_id === selectedSupplierDetail.id ||
               (c.proveedor_nombre && c.proveedor_nombre.trim().toLowerCase() === selectedSupplierDetail.razon_social?.trim().toLowerCase())
        );
        const totalComprado = provPurchases.reduce((acc, c) => acc + (c.estado !== 'Anulada' ? Number(c.total || 0) : 0), 0);
        const isActivo = selectedSupplierDetail.estado !== 'Inactivo';

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      {selectedSupplierDetail.razon_social}
                    </h3>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {getSupplierDocDisplay(selectedSupplierDetail)}
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Badges de Estado y Rubro */}
              <div className="flex items-center gap-2">
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                  isActivo ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
                }`}>
                  {isActivo ? 'Activo' : 'Inactivo'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                  {selectedSupplierDetail.rubro || 'General'}
                </span>
              </div>

              {/* Datos de contacto */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Documento:</span>
                  <span className="font-mono font-bold text-slate-800">{getSupplierDocDisplay(selectedSupplierDetail)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Teléfono:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedSupplierDetail.telefono || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Email:</span>
                  <span className="text-slate-800 font-medium">{selectedSupplierDetail.email || '-'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Contacto:</span>
                  <span className="text-slate-800 font-medium">{selectedSupplierDetail.contacto || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Dirección:</span>
                  <span className="text-slate-800 text-right font-medium">{selectedSupplierDetail.direccion || 'Lima, Perú'}</span>
                </div>
              </div>

              {/* Estadísticas de compras */}
              <div className="grid grid-cols-2 gap-2 bg-emerald-50/60 p-3 rounded-2xl border border-emerald-100 text-center">
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">Total Comprado</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">S/ {totalComprado.toFixed(2)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-emerald-600 font-bold uppercase block">N° de Compras</span>
                  <span className="text-sm font-black text-emerald-900 font-mono">{provPurchases.length}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    const prov = selectedSupplierDetail;
                    setSelectedSupplierDetail(null);
                    setSelectedSupplierPurchases(prov);
                  }}
                  className="flex-1 py-2 text-xs font-bold text-emerald-700 bg-emerald-100 hover:bg-emerald-200 rounded-xl transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Receipt className="w-3.5 h-3.5" />
                  <span>Ver historial compras</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedSupplierDetail(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: HISTORIAL DE COMPRAS AL PROVEEDOR (RECEIPT VERDE)          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {selectedSupplierPurchases && (() => {
        const provPurchases = compras.filter(
          c => c.proveedor_id === selectedSupplierPurchases.id ||
               (c.proveedor_nombre && c.proveedor_nombre.trim().toLowerCase() === selectedSupplierPurchases.razon_social?.trim().toLowerCase())
        );
        const totalFacturado = provPurchases.reduce((acc, c) => acc + (c.estado !== 'Anulada' ? Number(c.total || 0) : 0), 0);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
            <div className="bg-white rounded-3xl w-full max-w-2xl p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 leading-tight">
                      Historial de Compras
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {selectedSupplierPurchases.razon_social} ({getSupplierDocDisplay(selectedSupplierPurchases)})
                    </p>
                  </div>
                </div>
                <button 
                  type="button" 
                  onClick={() => setSelectedSupplierPurchases(null)}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Resumen */}
              <div className="flex items-center justify-between bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">TOTAL ACUMULADO</span>
                  <span className="font-extrabold text-slate-900 text-sm font-mono text-emerald-700">
                    S/ {totalFacturado.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] text-right">COMPRAS VÁLIDAS</span>
                  <span className="font-extrabold text-slate-900 text-sm font-mono text-right block">
                    {provPurchases.filter(c => c.estado !== 'Anulada').length} de {provPurchases.length}
                  </span>
                </div>
              </div>

              {/* Tabla de Compras */}
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-72 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100 sticky top-0">
                    <tr>
                      <th className="py-2.5 px-3">Fecha</th>
                      <th className="py-2.5 px-3">Comprobante</th>
                      <th className="py-2.5 px-3 text-right">Total</th>
                      <th className="py-2.5 px-3 text-center">Estado</th>
                      <th className="py-2.5 px-3 text-center">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {provPurchases.map((c) => (
                      <tr key={c.id} className="hover:bg-slate-50/70 transition">
                        <td className="py-2.5 px-3 font-medium text-slate-700 whitespace-nowrap">
                          {c.fechaDisplay || new Date(c.fecha).toLocaleDateString('es-PE')}
                        </td>
                        <td className="py-2.5 px-3">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">
                            {c.tipo_documento}
                          </span>
                          <span className="font-mono font-bold text-slate-900">
                            {c.numero_factura}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900 font-mono whitespace-nowrap">
                          S/ {Number(c.total || 0).toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center whitespace-nowrap">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            c.estado === 'Anulada' ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {c.estado || 'Recibida'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedSupplierPurchases(null);
                              setSelectedCompraDetail(c);
                            }}
                            className="p-1 text-emerald-600 hover:text-emerald-800 rounded hover:bg-emerald-50 transition cursor-pointer"
                            title="Ver detalle completo"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}

                    {provPurchases.length === 0 && (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400 italic">
                          No hay compras registradas para este proveedor todavía.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setSelectedSupplierPurchases(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold cursor-pointer"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 6: IMPORTAR PROVEEDORES DESDE ARCHIVO                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4 text-emerald-600" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-slate-900">Importar Proveedores</h3>
                  <p className="text-[11px] text-slate-400">Carga masiva desde archivo Excel o CSV</p>
                </div>
              </div>
              <button 
                type="button" 
                onClick={() => setIsImportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-500 rounded-2xl p-6 text-center transition cursor-pointer bg-slate-50/50">
                <FileSpreadsheet className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                <p className="text-xs font-bold text-slate-700">Arrastre su archivo .xlsx o .csv aquí</p>
                <p className="text-[10px] text-slate-400 mt-1">O haga clic para examinar en su equipo</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    showToast(`Archivo "${file.name}" cargado con éxito`);
                    setIsImportModalOpen(false);
                  }}
                  className="hidden"
                  id="import-proveedores-input"
                />
                <label
                  htmlFor="import-proveedores-input"
                  className="inline-block mt-3 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
                >
                  Seleccionar archivo
                </label>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-600">
                <span className="font-bold text-slate-800 block">Columnas esperadas:</span>
                <p className="font-mono text-[10px] text-slate-500">
                  DOC, NOMBRE_RAZON_SOCIAL, TELEFONO, EMAIL, CONTACTO, ESTADO
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8,DOC,NOMBRE_RAZON_SOCIAL,TELEFONO,EMAIL,CONTACTO,ESTADO\n20603890061,CORPORACION INDUSTRIAL PSG E.I.R.L.,-,grupo@gmail.com,—,Activo\n";
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "plantilla_proveedores.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Plantilla CSV descargada');
                }}
                className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
              >
                Descargar plantilla CSV
              </button>

              <button
                type="button"
                onClick={() => setIsImportModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
