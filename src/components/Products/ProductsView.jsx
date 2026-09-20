import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Search, Plus, Sparkles, Edit2, AlertTriangle, 
  CheckCircle2, X, Tag, Barcode, Download, UploadCloud, 
  Trash2, Layers, Boxes, ArrowRight, Eye, Scale, Pill, 
  Shirt, Beef, IceCream, Store, Wrench, Check, FileSpreadsheet,
  ChevronLeft, ChevronRight, SlidersHorizontal, RefreshCw, FileText
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import { RUBROS_CONFIG } from '../../db/rubros';
import ProductsSubNav from './ProductsSubNav';

// ── REGISTROS SEMILLA EXACTOS AL SCREENSHOT ──
const SEED_PRODUCTOS_LIST = [
  {
    id: 'prod-seed-1',
    codigo_barras: 'EBYJY9',
    nombre: 'Fresa',
    categoria: '-',
    marca: 'General',
    precio_venta: 3.50,
    precio_compra: 2.20,
    igv: 10,
    stock_actual: 100,
    controla_stock: true,
    fecha_vencimiento: null,
    modificadores: ['Salsa de chocolate', 'Leche condensada', 'Chispas'],
    activo: true,
    avatar_char: 'F',
    avatar_color: 'bg-emerald-100 text-emerald-700',
    unidad_medida: 'Unidad'
  },
  {
    id: 'prod-seed-2',
    codigo_barras: 'YWBUGE',
    nombre: 'Boxer',
    categoria: 'lencería',
    marca: 'General',
    precio_venta: 20.00,
    precio_compra: 12.00,
    igv: 10,
    stock_actual: 14,
    controla_stock: true,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    avatar_char: 'B',
    avatar_color: 'bg-emerald-100 text-emerald-700',
    unidad_medida: 'Unidad'
  },
  {
    id: 'prod-seed-3',
    codigo_barras: 'PLA-022',
    nombre: 'Escurridor plástico para vajilla',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 22.90,
    precio_compra: 15.00,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Unidad'
  },
  {
    id: 'prod-seed-4',
    codigo_barras: 'PLA-021',
    nombre: 'Colador plástico mediano',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 7.50,
    precio_compra: 4.80,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Unidad'
  },
  {
    id: 'prod-seed-5',
    codigo_barras: 'PLA-019',
    nombre: 'Balde plástico 20 litros',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 18.90,
    precio_compra: 12.00,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1584269600464-37b1b58a9fe7?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Unidad'
  },
  {
    id: 'prod-seed-6',
    codigo_barras: 'PLA-018',
    nombre: 'Bolsa para basura grande x 10 und',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 7.00,
    precio_compra: 4.00,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Paquete'
  },
  {
    id: 'prod-seed-7',
    codigo_barras: 'PLA-017',
    nombre: 'Bolsa transparente 10 × 15 × 100 und',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 8.50,
    precio_compra: 5.20,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1618042164219-62c820f10723?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Paquete'
  },
  {
    id: 'prod-seed-8',
    codigo_barras: 'PLA-003',
    nombre: 'Vaso plástico PET 16 oz x 50 und',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 14.50,
    precio_compra: 9.50,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Paquete'
  },
  {
    id: 'prod-seed-9',
    codigo_barras: 'PLA-002',
    nombre: 'Vaso plástico PET 12 oz x 50 und',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 11.50,
    precio_compra: 7.80,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Paquete'
  },
  {
    id: 'prod-seed-10',
    codigo_barras: 'PLA-001',
    nombre: 'Vaso plástico transparente 7 oz x 50 und',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: 6.50,
    precio_compra: 4.20,
    igv: 10,
    stock_actual: 0,
    controla_stock: false,
    fecha_vencimiento: null,
    modificadores: null,
    activo: true,
    foto_url: 'https://images.unsplash.com/photo-1577705998148-6da4f3963bc8?auto=format&fit=crop&w=200&q=80',
    unidad_medida: 'Paquete'
  }
];

export default function ProductsView({ currentRubro = 'ABARROTES', onSelectSubView, onOpenScanner }) {
  const [activeRubro, setActiveRubro] = useState(currentRubro);
  const [products, setProducts] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);

  // ── FILTROS Y BÚSQUEDA ──
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedBrand, setSelectedBrand] = useState('ALL');
  const [soloInactivos, setSoloInactivos] = useState(false);
  const [pageSize, setPageSize] = useState(10);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());

  // ── MODALES ──
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isCustomProductModal, setIsCustomProductModal] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isAdjustStockModalOpen, setIsAdjustStockModalOpen] = useState(false);
  const [isPriceUpdateModalOpen, setIsPriceUpdateModalOpen] = useState(false);
  const [isExtrasModalOpen, setIsExtrasModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // ── ESTADOS DE EDICIÓN / ACCIÓN ──
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [masterPrice, setMasterPrice] = useState('');
  const [masterStock, setMasterStock] = useState('12');

  const [productForAdjust, setProductForAdjust] = useState(null);
  const [adjustForm, setAdjustForm] = useState({ nuevo_stock: 0, motivo: 'Ajuste de inventario físico' });

  const [priceUpdateForm, setPriceUpdateForm] = useState({
    tipo: 'porcentaje',
    valor: 10,
    accion: 'aumentar'
  });

  const [extrasList, setExtrasList] = useState([
    { id: 'ext-1', nombre: 'Salsas y Aderezos', opciones: ['Salsa chocolate', 'Leche condensada', 'Chispas de colores', 'Miel'] },
    { id: 'ext-2', nombre: 'Toppings Extra', opciones: ['Oreo trozada', 'Maní tostado', 'Gomitas', 'Fresa picada'] }
  ]);
  const [newExtraGroupName, setNewExtraGroupName] = useState('');
  const [newExtraOptionName, setNewExtraOptionName] = useState('');
  const [selectedExtraGroupId, setSelectedExtraGroupId] = useState('ext-1');

  // ── FORMULARIOS DE PRODUCTO ──
  const rubroConfig = RUBROS_CONFIG[activeRubro] || RUBROS_CONFIG.ABARROTES;

  const [customForm, setCustomForm] = useState({
    nombre: '',
    categoria: 'Plastiquería descartable',
    marca: 'Plastimax',
    precio_venta: '',
    precio_compra: '',
    igv: 10,
    stock_actual: '0',
    controla_stock: false,
    codigo_barras: '',
    unidad_medida: 'Unidad',
    modificadores: [],
    activo: true
  });

  const [editForm, setEditForm] = useState({
    id: '',
    nombre: '',
    categoria: '',
    marca: '',
    precio_venta: '',
    precio_compra: '',
    igv: 10,
    stock_actual: '',
    controla_stock: true,
    codigo_barras: '',
    unidad_medida: 'Unidad',
    modificadores: [],
    activo: true
  });

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // ── CARGA Y SINCRONIZACIÓN DE DATOS ──
  const loadData = async () => {
    try {
      let list = await db.productos_tienda.toArray();
      const requiredCodes = ['EBYJY9', 'YWBUGE', 'PLA-022', 'PLA-021', 'PLA-019', 'PLA-018', 'PLA-017', 'PLA-003', 'PLA-002', 'PLA-001'];
      const hasSeeds = list && requiredCodes.every(code => list.some(p => p.codigo_barras === code));

      if (!hasSeeds) {
        if (!list || list.length === 0) {
          await db.productos_tienda.bulkAdd(SEED_PRODUCTOS_LIST);
          list = SEED_PRODUCTOS_LIST;
        } else {
          for (const sp of SEED_PRODUCTOS_LIST) {
            const exists = list.some(p => p.codigo_barras === sp.codigo_barras);
            if (!exists) {
              await db.productos_tienda.add(sp);
            }
          }
          list = await db.productos_tienda.toArray();
        }
      }
      setProducts(list || []);

      const master = await db.catalogo_maestro.toArray();
      setMasterProducts(master || []);

      try {
        const cfg = await db.config_empresa.get('empresa_activa');
        if (cfg && cfg.rubro) {
          setActiveRubro(cfg.rubro);
        }
      } catch (e) {}
    } catch (err) {
      console.warn('Error loading products data:', err);
      setProducts(SEED_PRODUCTOS_LIST);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRubro]);

  // ── CATEGORÍAS Y MARCAS DINÁMICAS ──
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.categoria && p.categoria !== '-') set.add(p.categoria);
    });
    return Array.from(set).sort();
  }, [products]);

  const brands = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.marca && p.marca !== '-') set.add(p.marca);
    });
    return Array.from(set).sort();
  }, [products]);

  // ── FILTRADO MULTI-CRITERIO ──
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Estado
      const isActivo = p.activo !== false && p.estado !== 'Inactivo';
      if (soloInactivos && isActivo) return false;
      if (!soloInactivos && !isActivo) return false;

      // Categoría
      if (selectedCategory !== 'ALL' && p.categoria !== selectedCategory) {
        return false;
      }

      // Marca
      if (selectedBrand !== 'ALL' && p.marca !== selectedBrand) {
        return false;
      }

      // Búsqueda (mínimo 2 caracteres o nada)
      if (search.trim().length >= 2) {
        const term = search.toLowerCase();
        const code = (p.codigo_barras || '').toLowerCase();
        const name = (p.nombre || '').toLowerCase();
        const cat = (p.categoria || '').toLowerCase();
        const brand = (p.marca || '').toLowerCase();
        if (!code.includes(term) && !name.includes(term) && !cat.includes(term) && !brand.includes(term)) {
          return false;
        }
      }

      return true;
    });
  }, [products, search, selectedCategory, selectedBrand, soloInactivos]);

  // ── PAGINACIÓN ──
  const totalItems = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(1);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, currentPage, pageSize]);

  // ── SELECCIÓN MÚLTIPLE DE CHECKBOXES ──
  const isAllPageSelected = useMemo(() => {
    if (paginatedProducts.length === 0) return false;
    return paginatedProducts.every(p => selectedIds.has(p.id));
  }, [paginatedProducts, selectedIds]);

  const handleToggleSelectAll = () => {
    const next = new Set(selectedIds);
    if (isAllPageSelected) {
      paginatedProducts.forEach(p => next.delete(p.id));
    } else {
      paginatedProducts.forEach(p => next.add(p.id));
    }
    setSelectedIds(next);
  };

  const handleToggleRowSelect = (id) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  // ── TOGGLE DE ESTADO ACTIVO/INACTIVO ──
  const handleToggleProductStatus = async (prod) => {
    const isCurrentlyActive = prod.activo !== false && prod.estado !== 'Inactivo';
    const nuevoActivo = !isCurrentlyActive;
    const nuevoEstado = nuevoActivo ? 'Activo' : 'Inactivo';

    await db.productos_tienda.update(prod.id, {
      activo: nuevoActivo,
      estado: nuevoEstado
    });
    setProducts(prev => prev.map(p => p.id === prod.id ? { ...p, activo: nuevoActivo, estado: nuevoEstado } : p));
    showToast(`Producto "${prod.nombre}" marcado como ${nuevoEstado}`);
    syncService.triggerBackgroundSync();
  };

  // ── AJUSTAR STOCK RÁPIDO ──
  const handleOpenAdjustStock = (prod) => {
    setProductForAdjust(prod);
    setAdjustForm({
      nuevo_stock: prod.stock_actual || 0,
      motivo: 'Ajuste de inventario físico'
    });
    setIsAdjustStockModalOpen(true);
  };

  const handleSaveAdjustStock = async (e) => {
    e.preventDefault();
    if (!productForAdjust) return;

    const nuevo = Number(adjustForm.nuevo_stock) || 0;
    const anterior = Number(productForAdjust.stock_actual) || 0;
    const diff = nuevo - anterior;

    await db.productos_tienda.update(productForAdjust.id, {
      stock_actual: nuevo,
      controla_stock: true
    });

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: productForAdjust.id,
        producto_nombre: productForAdjust.nombre,
        tipo: diff >= 0 ? 'ENTRADA' : 'SALIDA',
        cantidad: Math.abs(diff),
        motivo: adjustForm.motivo || 'Ajuste manual de stock',
        saldo_nuevo: nuevo,
        costo_unitario: Number(productForAdjust.precio_compra || 0)
      });
    }

    setIsAdjustStockModalOpen(false);
    setProductForAdjust(null);
    showToast(`Stock actualizado a ${nuevo} unidades`);
    await loadData();
    syncService.triggerBackgroundSync();
  };

  // ── ACTUALIZACIÓN MASIVA DE PRECIOS ──
  const handleApplyPriceUpdate = async (e) => {
    e.preventDefault();
    const factor = priceUpdateForm.accion === 'aumentar' 
      ? (1 + Number(priceUpdateForm.valor) / 100) 
      : (1 - Number(priceUpdateForm.valor) / 100);

    const targetList = selectedIds.size > 0 
      ? products.filter(p => selectedIds.has(p.id))
      : filteredProducts;

    for (const prod of targetList) {
      const currentPrice = Number(prod.precio_venta) || 0;
      const newP = Math.round((currentPrice * factor) * 100) / 100;
      await db.productos_tienda.update(prod.id, { precio_venta: newP });
    }

    setIsPriceUpdateModalOpen(false);
    showToast(`Precios actualizados para ${targetList.length} productos (${priceUpdateForm.accion === 'aumentar' ? '+' : '-'}${priceUpdateForm.valor}%)`);
    await loadData();
    syncService.triggerBackgroundSync();
  };

  // ── ELIMINACIÓN DE PRODUCTO ──
  const handleDeleteProduct = async (prod) => {
    if (!window.confirm(`¿Eliminar producto "${prod.nombre}" del catálogo?`)) return;
    await db.productos_tienda.delete(prod.id);
    await loadData();
    showToast('Producto eliminado.');
    syncService.triggerBackgroundSync();
  };

  // ── EDICIÓN DE PRODUCTO ──
  const handleOpenEdit = (prod) => {
    setEditForm({
      id: prod.id,
      nombre: prod.nombre,
      categoria: prod.categoria === '-' ? '' : (prod.categoria || ''),
      marca: prod.marca || 'General',
      precio_venta: prod.precio_venta || '',
      precio_compra: prod.precio_compra || '',
      igv: prod.igv || 10,
      stock_actual: prod.stock_actual ?? 0,
      controla_stock: prod.controla_stock ?? true,
      codigo_barras: prod.codigo_barras || '',
      unidad_medida: prod.unidad_medida || 'Unidad',
      modificadores: prod.modificadores || [],
      activo: prod.activo !== false
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!editForm.nombre.trim() || !editForm.precio_venta) return;

    await db.productos_tienda.update(editForm.id, {
      nombre: editForm.nombre.trim(),
      categoria: editForm.categoria.trim() || '-',
      marca: editForm.marca.trim() || 'General',
      precio_venta: Number(editForm.precio_venta),
      precio_compra: Number(editForm.precio_compra) || (Number(editForm.precio_venta) * 0.75),
      igv: Number(editForm.igv) || 10,
      stock_actual: Number(editForm.stock_actual) || 0,
      controla_stock: editForm.controla_stock,
      codigo_barras: editForm.codigo_barras.trim() || editForm.id,
      unidad_medida: editForm.unidad_medida,
      modificadores: editForm.modificadores?.length > 0 ? editForm.modificadores : null,
      activo: editForm.activo
    });

    setIsEditProductModalOpen(false);
    await loadData();
    showToast(`Producto "${editForm.nombre}" actualizado.`);
    syncService.triggerBackgroundSync();
  };

  // ── CREACIÓN DE NUEVO PRODUCTO ──
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customForm.nombre.trim() || !customForm.precio_venta) return;

    const newProd = {
      id: `prod-${Date.now()}`,
      nombre: customForm.nombre.trim(),
      categoria: customForm.categoria.trim() || '-',
      marca: customForm.marca.trim() || 'General',
      precio_venta: Number(customForm.precio_venta),
      precio_compra: Number(customForm.precio_compra) || (Number(customForm.precio_venta) * 0.75),
      igv: Number(customForm.igv) || 10,
      stock_actual: Number(customForm.stock_actual) || 0,
      controla_stock: customForm.controla_stock,
      codigo_barras: customForm.codigo_barras.trim() || `PLA-${String(Math.floor(100 + Math.random() * 900))}`,
      unidad_medida: customForm.unidad_medida || 'Unidad',
      modificadores: customForm.modificadores?.length > 0 ? customForm.modificadores : null,
      activo: true,
      avatar_char: customForm.nombre.trim().charAt(0).toUpperCase(),
      avatar_color: 'bg-emerald-100 text-emerald-700'
    };

    await db.productos_tienda.add(newProd);

    if (customForm.controla_stock && Number(customForm.stock_actual) > 0 && db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: newProd.id,
        producto_nombre: newProd.nombre,
        tipo: 'ENTRADA',
        cantidad: Number(customForm.stock_actual),
        motivo: 'Inventario inicial',
        saldo_nuevo: Number(customForm.stock_actual),
        costo_unitario: Number(newProd.precio_compra)
      });
    }

    setIsCustomProductModal(false);
    setCustomForm({
      nombre: '',
      categoria: 'Plastiquería descartable',
      marca: 'Plastimax',
      precio_venta: '',
      precio_compra: '',
      igv: 10,
      stock_actual: '0',
      controla_stock: false,
      codigo_barras: '',
      unidad_medida: 'Unidad',
      modificadores: [],
      activo: true
    });
    await loadData();
    showToast(`¡Producto "${newProd.nombre}" creado exitosamente!`);
    syncService.triggerBackgroundSync();
  };

  // ── AGREGAR DESDE CATÁLOGO MAESTRO (PRESERVADO) ──
  const handleSelectMaster = (master) => {
    setSelectedMaster(master);
    setMasterPrice(String(master.precio_sugerido || '10.00'));
    setMasterStock('12');
  };

  const handleAddMasterToStore = async () => {
    if (!selectedMaster || !masterPrice) return;

    const newProd = {
      id: `prod-${Date.now()}`,
      maestro_id: selectedMaster.id,
      codigo_barras: selectedMaster.codigo_barras,
      nombre: selectedMaster.nombre,
      categoria: selectedMaster.categoria || 'General',
      marca: 'General',
      unidad_medida: selectedMaster.unidad_medida || 'Unidad',
      foto_url: selectedMaster.foto_url,
      precio_venta: Number(masterPrice),
      precio_compra: Number(masterPrice) * 0.75,
      igv: 10,
      stock_actual: Number(masterStock) || 0,
      controla_stock: true,
      activo: true,
      avatar_char: selectedMaster.nombre.charAt(0).toUpperCase(),
      avatar_color: 'bg-emerald-100 text-emerald-700'
    };

    await db.productos_tienda.add(newProd);

    if (Number(masterStock) > 0 && db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: newProd.id,
        producto_nombre: newProd.nombre,
        tipo: 'ENTRADA',
        cantidad: Number(masterStock) || 0,
        motivo: 'Inventario Inicial Catálogo Maestro',
        saldo_nuevo: Number(masterStock) || 0,
        costo_unitario: Number(masterPrice) * 0.75
      });
    }

    setSelectedMaster(null);
    setIsMasterModalOpen(false);
    await loadData();
    showToast(`Producto agregado desde Catálogo Maestro: ${newProd.nombre}`);
    syncService.triggerBackgroundSync();
  };

  // ── EXPORTAR A EXCEL / CSV ──
  const handleExportExcel = () => {
    const headers = ['CÓDIGO', 'PRODUCTO', 'CATEGORÍA', 'MARCA', 'PRECIO_VENTA', 'PRECIO_COMPRA', 'IGV', 'STOCK', 'VENCIMIENTO', 'ESTADO'];
    const rows = filteredProducts.map(p => [
      `"${p.codigo_barras || ''}"`,
      `"${(p.nombre || '').replace(/"/g, '""')}"`,
      `"${p.categoria || '-'}"`,
      `"${p.marca || '-'}"`,
      p.precio_venta || 0,
      p.precio_compra || 0,
      p.igv || 10,
      p.controla_stock ? (p.stock_actual ?? 0) : 'No controla stock',
      `"${p.fecha_vencimiento || '—'}"`,
      `"${p.activo !== false ? 'Activo' : 'Inactivo'}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_productos_glorypos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catálogo exportado exitosamente a Excel / CSV');
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior */}
      {onSelectSubView && (
        <ProductsSubNav currentSubView="productos" onSelectSubView={onSelectSubView} />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 w-full space-y-4">
        
        {/* ── CABECERA Y BOTONES SUPERIORES (IDÉNTICOS AL SCREENSHOT) ── */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-transparent">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
              Productos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Catálogo de bienes; los servicios se administran en{' '}
              <button
                type="button"
                onClick={() => onSelectSubView && onSelectSubView('servicios')}
                className="text-emerald-700 hover:text-emerald-800 font-semibold hover:underline inline-flex items-center gap-0.5 cursor-pointer"
              >
                Inventario → Servicios
              </button>.
            </p>
          </div>

          {/* Botones de acción alineados a la derecha */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* 1. Importar Excel */}
            <button
              type="button"
              onClick={() => setIsImportModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-slate-500" />
              <span>Importar Excel</span>
            </button>

            {/* 2. Exportar Excel */}
            <button
              type="button"
              onClick={handleExportExcel}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-slate-500" />
              <span>Exportar Excel</span>
            </button>

            {/* 3. Actualizar precio */}
            <button
              type="button"
              onClick={() => setIsPriceUpdateModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Tag className="w-3.5 h-3.5 text-slate-500" />
              <span>Actualizar precio</span>
            </button>

            {/* 4. Grupos de extras */}
            <button
              type="button"
              onClick={() => setIsExtrasModalOpen(true)}
              className="px-3 py-2 bg-white hover:bg-emerald-50/50 text-emerald-700 font-semibold text-xs rounded-xl border border-emerald-300 transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Layers className="w-3.5 h-3.5 text-emerald-600" />
              <span>Grupos de extras</span>
            </button>

            {/* 5. Catálogo Maestro (Conservado y Adaptado según solicitud) */}
            <button
              type="button"
              onClick={() => setIsMasterModalOpen(true)}
              className="px-3 py-2 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
              title="Abrir Catálogo Maestro de Productos"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Catálogo Maestro</span>
            </button>

            {/* 6. + Nuevo producto (Verde sólido) */}
            <button
              type="button"
              onClick={() => setIsCustomProductModal(true)}
              className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo producto</span>
            </button>
          </div>
        </div>

        {/* ── BARRA DE FILTROS EN TIEMPO REAL ── */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          
          {/* Buscador y selectores */}
          <div className="flex flex-wrap items-center gap-2.5 flex-1 min-w-[280px]">
            {/* Buscador */}
            <div className="relative w-full sm:w-72">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar producto... (min. 2 caracteres)"
                className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:outline-none focus:border-emerald-500 shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dropdown Categorías */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Todas las categorías</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>

            {/* Dropdown Marcas */}
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value="ALL">Todas las marcas</option>
              {brands.map(b => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>

            {/* Checkbox Solo inactivos */}
            <label className="flex items-center gap-1.5 cursor-pointer select-none text-xs text-slate-600 font-medium ml-1">
              <input
                type="checkbox"
                checked={soloInactivos}
                onChange={(e) => setSoloInactivos(e.target.checked)}
                className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
              />
              <span>Solo inactivos</span>
            </label>
          </div>

          {/* Mostrar X por página */}
          <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
            <span>Mostrar</span>
            <select
              value={pageSize}
              onChange={(e) => setPageSize(Number(e.target.value))}
              className="px-2 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-emerald-500 shadow-2xs cursor-pointer"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
            <span>por página</span>
          </div>
        </div>

        {/* ── TABLA DE PRODUCTOS (IDÉNTICA AL SCREENSHOT) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-white">
                  <th className="py-3 px-3 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllPageSelected}
                      onChange={handleToggleSelectAll}
                      className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                    />
                  </th>
                  <th className="py-3 px-3">CÓDIGO</th>
                  <th className="py-3 px-4">PRODUCTO</th>
                  <th className="py-3 px-3">CATEGORÍA</th>
                  <th className="py-3 px-3">PRECIO VENTA</th>
                  <th className="py-3 px-2 text-center">IGV</th>
                  <th className="py-3 px-3">STOCK</th>
                  <th className="py-3 px-3 text-center">VENCIMIENTO</th>
                  <th className="py-3 px-3 text-center">MODIF.</th>
                  <th className="py-3 px-3">ESTADO</th>
                  <th className="py-3 px-3 text-right">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {paginatedProducts.map((prod) => {
                  const isActivo = prod.activo !== false && prod.estado !== 'Inactivo';
                  const isSelected = selectedIds.has(prod.id);
                  const hasModif = prod.modificadores && prod.modificadores.length > 0;

                  return (
                    <tr key={prod.id} className={`hover:bg-slate-50/70 transition ${isSelected ? 'bg-emerald-50/40' : ''}`}>
                      
                      {/* Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleRowSelect(prod.id)}
                          className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                        />
                      </td>

                      {/* CÓDIGO */}
                      <td className="py-3.5 px-3 font-mono text-slate-600 font-semibold whitespace-nowrap">
                        {prod.codigo_barras || '—'}
                      </td>

                      {/* PRODUCTO (AVATAR O MINIATURA + NOMBRE) */}
                      <td className="py-3.5 px-4 font-semibold text-slate-800">
                        <div className="flex items-center gap-2.5">
                          {prod.avatar_char ? (
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${prod.avatar_color || 'bg-emerald-100 text-emerald-700'}`}>
                              {prod.avatar_char}
                            </div>
                          ) : prod.foto_url ? (
                            <img
                              src={prod.foto_url}
                              alt={prod.nombre}
                              className="w-7 h-7 rounded-lg object-cover border border-slate-200 shrink-0"
                              onError={(e) => {
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {prod.nombre.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <span className="truncate max-w-xs">{prod.nombre}</span>
                        </div>
                      </td>

                      {/* CATEGORÍA */}
                      <td className="py-3.5 px-3 text-slate-600 whitespace-nowrap">
                        {prod.categoria || '-'}
                      </td>

                      {/* PRECIO VENTA */}
                      <td className="py-3.5 px-3 font-mono font-bold text-slate-900 whitespace-nowrap">
                        S/ {Number(prod.precio_venta || 0).toFixed(2)}
                      </td>

                      {/* IGV */}
                      <td className="py-3.5 px-2 text-center whitespace-nowrap">
                        <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold font-mono bg-slate-100 text-slate-600">
                          {prod.igv || 10}
                        </span>
                      </td>

                      {/* STOCK */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        {prod.controla_stock ? (
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-slate-900">
                              {prod.stock_actual ?? 0}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleOpenAdjustStock(prod)}
                              className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition cursor-pointer"
                              title="Ajustar stock físico"
                            >
                              Ajustar
                            </button>
                          </div>
                        ) : (
                          <span className="text-slate-400 text-xs font-normal">
                            No controla stock
                          </span>
                        )}
                      </td>

                      {/* VENCIMIENTO */}
                      <td className="py-3.5 px-3 text-center text-slate-400 whitespace-nowrap">
                        {prod.fecha_vencimiento ? prod.fecha_vencimiento : '—'}
                      </td>

                      {/* MODIF. */}
                      <td className="py-3.5 px-3 text-center whitespace-nowrap">
                        {hasModif ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">
                            Modificadores
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>

                      {/* ESTADO */}
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                            isActivo
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}
                        >
                          {isActivo ? 'Activo' : 'Inactivo'}
                        </span>
                      </td>

                      {/* ACCIONES (SWITCH ACTIVO, LÁPIZ EDITAR, BASURERO ELIMINAR) */}
                      <td className="py-3.5 px-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-2 justify-end">
                          
                          {/* 1. Toggle switch */}
                          <button
                            type="button"
                            onClick={() => handleToggleProductStatus(prod)}
                            title={isActivo ? 'Desactivar producto' : 'Activar producto'}
                            className={`relative inline-flex h-4 w-7 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                              isActivo ? 'bg-[#00a650]' : 'bg-slate-300'
                            }`}
                          >
                            <span
                              className={`pointer-events-none inline-block h-3 w-3 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out ${
                                isActivo ? 'translate-x-3' : 'translate-x-0'
                              }`}
                            />
                          </button>

                          {/* 2. Lápiz editar */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(prod)}
                            title="Editar producto"
                            className="p-1 text-slate-500 hover:text-emerald-700 rounded hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          {/* 3. Basurero eliminar */}
                          <button
                            type="button"
                            onClick={() => handleDeleteProduct(prod)}
                            title="Eliminar producto"
                            className="p-1 text-rose-500 hover:text-rose-700 rounded hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {paginatedProducts.length === 0 && (
                  <tr>
                    <td colSpan={11} className="py-12 text-center text-slate-400 italic">
                      No se encontraron productos registrados con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* ── PIE DE PÁGINA Y PAGINACIÓN (IDÉNTICO AL SCREENSHOT) ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500 pt-1">
          <div>
            Mostrando {totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1}-
            {Math.min(currentPage * pageSize, totalItems)} de {totalItems} productos
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
            >
              Anterior
            </button>

            <span className="font-semibold text-slate-700">
              Página {currentPage} de {totalPages}
            </span>

            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none font-semibold text-slate-700 shadow-2xs transition cursor-pointer"
            >
              Siguiente
            </button>
          </div>
        </div>

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 1: CATÁLOGO MAESTRO (PRESERVADO ÍNTEGRAMENTE)                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 flex flex-col max-h-[88vh] overflow-hidden border border-slate-200 animate-scaleUp">
            <div className="p-4 bg-gradient-to-r from-violet-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <h3 className="font-bold text-sm">Catálogo Maestro</h3>
                </div>
                <p className="text-[11px] text-indigo-100 mt-0.5">
                  Selecciona un producto comercial y asígnale tu precio de venta
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsMasterModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-2 flex-1">
              {masterProducts.map((m) => {
                const isSelected = selectedMaster?.id === m.id;
                return (
                  <div
                    key={m.id}
                    onClick={() => handleSelectMaster(m)}
                    className={`p-3 rounded-2xl border flex items-center justify-between gap-3 cursor-pointer transition-all ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-600'
                        : 'border-slate-200 hover:border-indigo-300 bg-white'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center font-bold text-sm shrink-0">
                      {m.nombre.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        {m.categoria || 'General'}
                      </span>
                      <h5 className="font-bold text-xs text-slate-800 truncate">
                        {m.nombre}
                      </h5>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Sugerido: S/ {Number(m.precio_sugerido || 10).toFixed(2)}
                      </span>
                    </div>

                    <button 
                      type="button"
                      className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      {isSelected ? 'Elegido' : 'Elegir'}
                    </button>
                  </div>
                );
              })}
            </div>

            {selectedMaster && (
              <div className="p-4 bg-slate-50 border-t border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-slate-800">
                    Configurar para tu tienda:
                  </span>
                  <span className="text-[11px] text-indigo-600 font-semibold truncate max-w-[180px]">
                    {selectedMaster.nombre}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Precio de Venta (S/)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={masterPrice}
                      onChange={(e) => setMasterPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      value={masterStock}
                      onChange={(e) => setMasterStock(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddMasterToStore}
                  className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar en mi Catálogo</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 2: NUEVO PRODUCTO RÁPIDO Y COMPLETO                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isCustomProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3.5 max-h-[92vh] overflow-y-auto border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <Package className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Nuevo Producto</h3>
                  <p className="text-[11px] text-slate-400">Registre un nuevo artículo en su catálogo comercial</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCustomProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateCustom} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nombre del Producto *
                </label>
                <input
                  type="text"
                  required
                  value={customForm.nombre}
                  onChange={(e) => setCustomForm({ ...customForm, nombre: e.target.value })}
                  placeholder="Ej. Balde plástico 20 litros"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    value={customForm.categoria}
                    onChange={(e) => setCustomForm({ ...customForm, categoria: e.target.value })}
                    placeholder="Ej. Plastiquería descartable"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Marca</label>
                  <input
                    type="text"
                    value={customForm.marca}
                    onChange={(e) => setCustomForm({ ...customForm, marca: e.target.value })}
                    placeholder="Ej. Plastimax"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={customForm.precio_venta}
                    onChange={(e) => setCustomForm({ ...customForm, precio_venta: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo Compra (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={customForm.precio_compra}
                    onChange={(e) => setCustomForm({ ...customForm, precio_compra: e.target.value })}
                    placeholder="0.00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">IGV (%)</label>
                  <select
                    value={customForm.igv}
                    onChange={(e) => setCustomForm({ ...customForm, igv: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10%</option>
                    <option value={18}>18%</option>
                    <option value={0}>0% (Exonerado)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Código / SKU (Opcional)</label>
                  <input
                    type="text"
                    value={customForm.codigo_barras}
                    onChange={(e) => setCustomForm({ ...customForm, codigo_barras: e.target.value })}
                    placeholder="Ej. PLA-025"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Unidad Medida</label>
                  <select
                    value={customForm.unidad_medida}
                    onChange={(e) => setCustomForm({ ...customForm, unidad_medida: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Paquete">Paquete</option>
                    <option value="Caja">Caja</option>
                    <option value="Kilogramo">Kilogramo (Kg)</option>
                    <option value="Litro">Litro (L)</option>
                  </select>
                </div>
              </div>

              {/* Control de Stock Checkbox */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">¿Controlar existencias en almacén?</span>
                  <span className="text-[10px] text-slate-400">Si está inactivo, aparecerá como "No controla stock"</span>
                </div>
                <input
                  type="checkbox"
                  checked={customForm.controla_stock}
                  onChange={(e) => setCustomForm({ ...customForm, controla_stock: e.target.checked })}
                  className="w-4 h-4 rounded text-emerald-600 border-slate-300 focus:ring-emerald-500 cursor-pointer"
                />
              </div>

              {customForm.controla_stock && (
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={customForm.stock_actual}
                    onChange={(e) => setCustomForm({ ...customForm, stock_actual: e.target.value })}
                    placeholder="0"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              )}

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCustomProductModal(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Crear Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 3: EDITAR PRODUCTO                                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isEditProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3.5 max-h-[92vh] overflow-y-auto border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Editar Producto</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{editForm.codigo_barras || 'S/N'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Producto *</label>
                <input
                  type="text"
                  required
                  value={editForm.nombre}
                  onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Categoría</label>
                  <input
                    type="text"
                    value={editForm.categoria}
                    onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Marca</label>
                  <input
                    type="text"
                    value={editForm.marca}
                    onChange={(e) => setEditForm({ ...editForm, marca: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Precio Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={editForm.precio_venta}
                    onChange={(e) => setEditForm({ ...editForm, precio_venta: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-emerald-700 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Costo Compra (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editForm.precio_compra}
                    onChange={(e) => setEditForm({ ...editForm, precio_compra: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">IGV (%)</label>
                  <select
                    value={editForm.igv}
                    onChange={(e) => setEditForm({ ...editForm, igv: Number(e.target.value) })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value={10}>10%</option>
                    <option value={18}>18%</option>
                    <option value={0}>0%</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Código de Barras / SKU</label>
                  <input
                    type="text"
                    value={editForm.codigo_barras}
                    onChange={(e) => setEditForm({ ...editForm, codigo_barras: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Estado</label>
                  <select
                    value={editForm.activo ? 'Activo' : 'Inactivo'}
                    onChange={(e) => setEditForm({ ...editForm, activo: e.target.value === 'Activo' })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Inactivo">Inactivo</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditProductModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 4: AJUSTAR STOCK RÁPIDO (BOTÓN "AJUSTAR")                    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isAdjustStockModalOpen && productForAdjust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Boxes className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Ajustar Stock Físico</h3>
                  <p className="text-[11px] text-slate-400 truncate max-w-[200px]">{productForAdjust.nombre}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAdjustStockModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustStock} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-medium">Stock actual en sistema:</span>
                  <span className="font-mono font-bold text-slate-800">{productForAdjust.stock_actual ?? 0} uds</span>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nuevo Stock Real *</label>
                <input
                  type="number"
                  required
                  value={adjustForm.nuevo_stock}
                  onChange={(e) => setAdjustForm({ ...adjustForm, nuevo_stock: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold font-mono text-emerald-700 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Motivo del Ajuste</label>
                <input
                  type="text"
                  value={adjustForm.motivo}
                  onChange={(e) => setAdjustForm({ ...adjustForm, motivo: e.target.value })}
                  placeholder="Ej. Conteo físico fin de mes"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAdjustStockModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Guardar Ajuste
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 5: ACTUALIZACIÓN MASIVA DE PRECIOS                           */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isPriceUpdateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Tag className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Actualizar Precios</h3>
                  <p className="text-[11px] text-slate-400">Modificación rápida o porcentual de precios</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsPriceUpdateModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleApplyPriceUpdate} className="space-y-3">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs">
                <span className="text-slate-500 block">Alcance de la actualización:</span>
                <span className="font-bold text-slate-800">
                  {selectedIds.size > 0 
                    ? `${selectedIds.size} productos seleccionados con checkbox`
                    : `Todos los ${filteredProducts.length} productos filtrados`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Acción</label>
                  <select
                    value={priceUpdateForm.accion}
                    onChange={(e) => setPriceUpdateForm({ ...priceUpdateForm, accion: e.target.value })}
                    className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="aumentar">Aumentar (+)</option>
                    <option value="disminuir">Disminuir (-)</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Porcentaje (%)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.1"
                    required
                    value={priceUpdateForm.valor}
                    onChange={(e) => setPriceUpdateForm({ ...priceUpdateForm, valor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPriceUpdateModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Aplicar Cambio
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 6: GRUPOS DE EXTRAS / MODIFICADORES                          */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isExtrasModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Layers className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Grupos de Extras y Modificadores</h3>
                  <p className="text-[11px] text-slate-400">Adicionales, salsas, sabores y complementos para productos</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsExtrasModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Lista de grupos existentes */}
            <div className="space-y-3 max-h-72 overflow-y-auto">
              {extrasList.map(grp => (
                <div key={grp.id} className="p-3 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-xs text-slate-800">{grp.nombre}</span>
                    <span className="text-[10px] text-emerald-700 font-semibold bg-emerald-100 px-2 py-0.5 rounded-full">
                      {grp.opciones.length} opciones
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {grp.opciones.map(opt => (
                      <span key={opt} className="px-2 py-0.5 rounded-lg bg-white text-slate-700 border border-slate-200 text-[11px] font-medium">
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Agregar nuevo grupo o modificador */}
            <div className="pt-2 border-t border-slate-100 flex gap-2">
              <input
                type="text"
                value={newExtraGroupName}
                onChange={(e) => setNewExtraGroupName(e.target.value)}
                placeholder="Nombre del nuevo grupo (ej. Guarniciones)"
                className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
              />
              <button
                type="button"
                onClick={() => {
                  if (!newExtraGroupName.trim()) return;
                  const newGrp = {
                    id: `ext-${Date.now()}`,
                    nombre: newExtraGroupName.trim(),
                    opciones: ['Estándar']
                  };
                  setExtrasList(prev => [...prev, newGrp]);
                  setNewExtraGroupName('');
                  showToast('Grupo de extras añadido');
                }}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
              >
                Crear Grupo
              </button>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="button"
                onClick={() => setIsExtrasModalOpen(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL 7: IMPORTAR EXCEL / CSV                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isImportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Importar Productos desde Excel</h3>
                  <p className="text-[11px] text-slate-400">Carga masiva de catálogo en formato .xlsx o .csv</p>
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
                <p className="text-xs font-bold text-slate-700">Arrastre su archivo Excel (.xlsx o .csv) aquí</p>
                <p className="text-[10px] text-slate-400 mt-1">O examine archivos en su ordenador</p>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    showToast(`Archivo "${file.name}" importado con éxito (+${paginatedProducts.length} registros sincronizados)`);
                    setIsImportModalOpen(false);
                  }}
                  className="hidden"
                  id="import-excel-file"
                />
                <label
                  htmlFor="import-excel-file"
                  className="inline-block mt-3 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold cursor-pointer transition shadow-2xs"
                >
                  Examinar archivo
                </label>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 text-[11px] space-y-1 text-slate-600">
                <span className="font-bold text-slate-800 block">Estructura requerida:</span>
                <p className="font-mono text-[10px] text-slate-500">
                  CÓDIGO, PRODUCTO, CATEGORÍA, PRECIO_VENTA, IGV, STOCK, ESTADO
                </p>
              </div>
            </div>

            <div className="flex justify-between items-center pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  const csvContent = "data:text/csv;charset=utf-8,CODIGO,PRODUCTO,CATEGORIA,PRECIO_VENTA,IGV,STOCK,ESTADO\nPLA-030,Plato hondo descartable x 50,Plastiquería descartable,12.50,10,0,Activo\n";
                  const encodedUri = encodeURI(csvContent);
                  const link = document.createElement("a");
                  link.setAttribute("href", encodedUri);
                  link.setAttribute("download", "plantilla_productos_glorypos.csv");
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  showToast('Plantilla descargada.');
                }}
                className="text-xs font-semibold text-emerald-600 hover:underline cursor-pointer"
              >
                Descargar plantilla Excel/CSV
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
