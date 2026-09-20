import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Search, Plus, Sparkles, Edit2, AlertTriangle, 
  CheckCircle2, X, ArrowDownRight, ArrowUpRight, Layers, Tag, 
  Barcode, Download, Upload, Printer, RefreshCw, Eye, Trash2,
  TrendingUp, Building2, ShoppingBag, ArrowRight, Minus, FileSpreadsheet,
  AlertCircle, History
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import ProductsSubNav from '../Products/ProductsSubNav';

export default function InventoryView({ onOpenScanner, onSelectSubView }) {
  const [products, setProducts] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);
  const [kardexList, setKardexList] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'low', 'out', 'turnover'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [currentSede, setCurrentSede] = useState('Almacén Central - La Paz / Santa Cruz');

  // Modals
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isCustomProductModal, setIsCustomProductModal] = useState(false);
  const [isKardexModalOpen, setIsKardexModalOpen] = useState(false);
  const [isBarcodePrinterModalOpen, setIsBarcodePrinterModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedProductForKardex, setSelectedProductForKardex] = useState(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);
  const [selectedMaster, setSelectedMaster] = useState(null);

  // Kardex adjustment state
  const [kardexTipo, setKardexTipo] = useState('ENTRADA'); // 'ENTRADA', 'SALIDA', 'MERMA'
  const [kardexCantidad, setKardexCantidad] = useState(1);
  const [kardexMotivo, setKardexMotivo] = useState('Ingreso por Compra / Abastecimiento');

  // New / Edit product forms
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('12');
  const [customForm, setCustomForm] = useState({
    nombre: '',
    categoria: 'Abarrotes',
    precio_venta: '',
    precio_compra: '',
    stock_actual: '10',
    stock_minimo: '5',
    codigo_barras: ''
  });

  const [editForm, setEditForm] = useState({
    id: '',
    nombre: '',
    categoria: '',
    precio_venta: '',
    precio_compra: '',
    stock_actual: '',
    stock_minimo: '',
    codigo_barras: ''
  });

  // Notification Toast
  const [toastMsg, setToastMsg] = useState(null);
  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const fileInputRef = useRef(null);

  const loadData = async () => {
    const list = await db.productos_tienda.toArray();
    setProducts(list);
    const master = await db.catalogo_maestro.toArray();
    setMasterProducts(master);
    if (db.kardex) {
      const kdx = await db.kardex.reverse().limit(20).toArray();
      setKardexList(kdx);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Stats calculation
  const totalValuation = useMemo(() => {
    return products.reduce((acc, p) => acc + ((p.stock_actual || 0) * (p.precio_compra || p.precio_venta * 0.8)), 0);
  }, [products]);

  const criticalProductsCount = useMemo(() => {
    return products.filter(p => (p.stock_actual || 0) <= (p.stock_minimo || 5)).length;
  }, [products]);

  const outOfStockCount = useMemo(() => {
    return products.filter(p => (p.stock_actual || 0) === 0).length;
  }, [products]);

  const avgMargin = useMemo(() => {
    if (!products.length) return 0;
    const margins = products.map(p => {
      const venta = Number(p.precio_venta) || 0;
      const compra = Number(p.precio_compra) || (venta * 0.8);
      if (compra <= 0) return 30;
      return ((venta - compra) / compra) * 100;
    });
    const sum = margins.reduce((a, b) => a + b, 0);
    return Math.round(sum / products.length);
  }, [products]);

  // Categories list
  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.categoria).filter(Boolean));
    return ['ALL', ...Array.from(set)];
  }, [products]);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const text = `${p.nombre} ${p.categoria} ${p.codigo_barras || ''}`.toLowerCase();
      const matchesSearch = text.includes(search.toLowerCase());

      const isLow = (p.stock_actual || 0) <= (p.stock_minimo || 5) && (p.stock_actual || 0) > 0;
      const isOut = (p.stock_actual || 0) === 0;

      let matchesStatus = true;
      if (statusFilter === 'low') matchesStatus = isLow || isOut;
      else if (statusFilter === 'out') matchesStatus = isOut;
      else if (statusFilter === 'turnover') {
        const margin = ((Number(p.precio_venta) - Number(p.precio_compra || p.precio_venta * 0.8)) / (Number(p.precio_compra || 1))) * 100;
        matchesStatus = margin >= 30;
      }

      let matchesCategory = true;
      if (categoryFilter !== 'ALL') {
        matchesCategory = p.categoria === categoryFilter;
      }

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [products, search, statusFilter, categoryFilter]);

  // Quick 1-click +1 stock
  const handleQuickAddStock = async (prod, e) => {
    e.stopPropagation();
    const newStockVal = (prod.stock_actual || 0) + 1;
    await db.productos_tienda.update(prod.id, { stock_actual: newStockVal });
    
    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: prod.id,
        producto_nombre: prod.nombre,
        tipo: 'ENTRADA',
        cantidad: 1,
        motivo: 'Ajuste rápido (+1 unidad)',
        saldo_nuevo: newStockVal,
        costo_unitario: prod.precio_compra || (prod.precio_venta * 0.8)
      });
    }

    await loadData();
    showToast(`+1 unidad agregada a ${prod.nombre} (Stock: ${newStockVal})`);
    syncService.triggerBackgroundSync();
  };

  // Open Kardex modal for product
  const handleOpenKardex = (prod) => {
    setSelectedProductForKardex(prod);
    setKardexCantidad(1);
    setKardexTipo('ENTRADA');
    setKardexMotivo('Ingreso por Compra / Abastecimiento');
    setIsKardexModalOpen(true);
  };

  // Submit Kardex adjustment
  const handleSaveKardexAdjustment = async () => {
    if (!selectedProductForKardex || kardexCantidad <= 0) return;

    const currentStock = selectedProductForKardex.stock_actual || 0;
    let newStockVal = currentStock;

    if (kardexTipo === 'ENTRADA') {
      newStockVal = currentStock + Number(kardexCantidad);
    } else {
      newStockVal = Math.max(0, currentStock - Number(kardexCantidad));
    }
    newStockVal = Math.round(newStockVal * 1000) / 1000;

    await db.productos_tienda.update(selectedProductForKardex.id, {
      stock_actual: newStockVal
    });

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: selectedProductForKardex.id,
        producto_nombre: selectedProductForKardex.nombre,
        tipo: kardexTipo,
        cantidad: Number(kardexCantidad),
        motivo: kardexMotivo || 'Ajuste manual de inventario',
        saldo_nuevo: newStockVal,
        costo_unitario: selectedProductForKardex.precio_compra || (selectedProductForKardex.precio_venta * 0.8)
      });
    }

    setIsKardexModalOpen(false);
    await loadData();
    showToast(`Ajuste registrado: ${kardexTipo} de ${kardexCantidad} uds en ${selectedProductForKardex.nombre}`);
    syncService.triggerBackgroundSync();
  };

  // Open Edit Product Modal
  const handleOpenEdit = (prod, e) => {
    e.stopPropagation();
    setSelectedProductForEdit(prod);
    setEditForm({
      id: prod.id,
      nombre: prod.nombre,
      categoria: prod.categoria,
      precio_venta: prod.precio_venta,
      precio_compra: prod.precio_compra || (prod.precio_venta * 0.8).toFixed(2),
      stock_actual: prod.stock_actual,
      stock_minimo: prod.stock_minimo || 5,
      codigo_barras: prod.codigo_barras || ''
    });
    setIsEditProductModalOpen(true);
  };

  const handleSaveEditProduct = async (e) => {
    e.preventDefault();
    if (!selectedProductForEdit) return;

    await db.productos_tienda.update(selectedProductForEdit.id, {
      nombre: editForm.nombre,
      categoria: editForm.categoria,
      precio_venta: Number(editForm.precio_venta),
      precio_compra: Number(editForm.precio_compra),
      stock_actual: Number(editForm.stock_actual),
      stock_minimo: Number(editForm.stock_minimo),
      codigo_barras: editForm.codigo_barras
    });

    setIsEditProductModalOpen(false);
    await loadData();
    showToast(`Producto ${editForm.nombre} actualizado`);
    syncService.triggerBackgroundSync();
  };

  // Delete product
  const handleDeleteProduct = async (prod, e) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar producto "${prod.nombre}" del catálogo?`)) {
      await db.productos_tienda.delete(prod.id);
      syncService.addToQueue('productos', 'delete', { id: prod.id });
      await loadData();
      showToast(`Producto eliminado`);
      syncService.triggerBackgroundSync();
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['codigo_barras', 'nombre', 'categoria', 'precio_venta', 'precio_compra', 'stock_actual', 'stock_minimo'];
    const rows = products.map(p => [
      `"${p.codigo_barras || ''}"`,
      `"${(p.nombre || '').replace(/"/g, '""')}"`,
      `"${p.categoria || ''}"`,
      p.precio_venta || 0,
      p.precio_compra || (p.precio_venta * 0.8),
      p.stock_actual || 0,
      p.stock_minimo || 5
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `inventario_glorypos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catálogo exportado exitosamente a CSV');
  };

  // Import CSV
  const handleImportCSV = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const text = evt.target.result;
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        if (lines.length <= 1) {
          alert('El archivo CSV está vacío o no tiene registros.');
          return;
        }

        let addedCount = 0;
        // Skip header
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(',').map(c => c.replace(/^"|"$/g, '').trim());
          if (cols.length >= 4 && cols[1]) {
            const barcode = cols[0] || `GEN-${Date.now()}-${i}`;
            const nombre = cols[1];
            const categoria = cols[2] || 'Abarrotes';
            const precio_venta = Number(cols[3]) || 1.00;
            const precio_compra = Number(cols[4]) || (precio_venta * 0.8);
            const stock_actual = Number(cols[5]) || 10;
            const stock_minimo = Number(cols[6]) || 5;

            // Check if exists
            const existing = await db.productos_tienda.where('codigo_barras').equals(barcode).first();
            if (existing) {
              await db.productos_tienda.update(existing.id, {
                nombre,
                categoria,
                precio_venta,
                precio_compra,
                stock_actual,
                stock_minimo
              });
            } else {
              await db.productos_tienda.add({
                id: `prod-csv-${Date.now()}-${i}`,
                codigo_barras: barcode,
                nombre,
                categoria,
                precio_venta,
                precio_compra,
                stock_actual,
                stock_minimo,
                unidad_medida: 'Unidad',
                foto_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
                activo: true
              });
            }
            addedCount++;
          }
        }
        await loadData();
        showToast(`¡Éxito! Se procesaron ${addedCount} productos desde el archivo CSV.`);
      } catch (err) {
        console.error(err);
        alert('Error al leer el archivo CSV. Asegúrate de que el formato sea correcto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Add from Master Catalog
  const handleSelectMaster = (master) => {
    setSelectedMaster(master);
    setNewPrice(String(master.precio_sugerido));
    setNewStock('12');
  };

  const handleAddMasterToStore = async () => {
    if (!selectedMaster || !newPrice) return;

    const newProd = {
      id: `prod-${Date.now()}`,
      maestro_id: selectedMaster.id,
      codigo_barras: selectedMaster.codigo_barras,
      nombre: selectedMaster.nombre,
      categoria: selectedMaster.categoria,
      unidad_medida: selectedMaster.unidad_medida,
      foto_url: selectedMaster.foto_url,
      precio_venta: Number(newPrice),
      precio_compra: Number(newPrice) * 0.8,
      stock_actual: Number(newStock) || 0,
      stock_minimo: 5,
      activo: true,
      presentaciones: selectedMaster.presentaciones || []
    };

    await db.productos_tienda.add(newProd);
    
    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: newProd.id,
        producto_nombre: newProd.nombre,
        tipo: 'ENTRADA',
        cantidad: Number(newStock) || 0,
        motivo: 'Inventario Inicial Catálogo Maestro',
        saldo_nuevo: Number(newStock) || 0,
        costo_unitario: Number(newPrice) * 0.8
      });
    }

    setSelectedMaster(null);
    setIsMasterModalOpen(false);
    await loadData();
    showToast(`Producto agregado desde Catálogo Maestro: ${newProd.nombre}`);
  };

  // Create custom product
  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customForm.nombre || !customForm.precio_venta) return;

    const newCustom = {
      id: `prod-custom-${Date.now()}`,
      maestro_id: null,
      codigo_barras: customForm.codigo_barras || `GEN-${Date.now()}`,
      nombre: customForm.nombre,
      categoria: customForm.categoria,
      unidad_medida: 'Unidad',
      foto_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      precio_venta: Number(customForm.precio_venta),
      precio_compra: Number(customForm.precio_compra) || (Number(customForm.precio_venta) * 0.8),
      stock_actual: Number(customForm.stock_actual) || 0,
      stock_minimo: Number(customForm.stock_minimo) || 5,
      activo: true
    };

    await db.productos_tienda.add(newCustom);

    if (db.kardex) {
      await db.kardex.add({
        id: `kdx-${Date.now()}`,
        fecha: new Date().toISOString(),
        producto_id: newCustom.id,
        producto_nombre: newCustom.nombre,
        tipo: 'ENTRADA',
        cantidad: newCustom.stock_actual,
        motivo: 'Inventario Inicial Producto Nuevo',
        saldo_nuevo: newCustom.stock_actual,
        costo_unitario: newCustom.precio_compra
      });
    }

    setIsCustomProductModal(false);
    setCustomForm({
      nombre: '',
      categoria: 'Abarrotes',
      precio_venta: '',
      precio_compra: '',
      stock_actual: '10',
      stock_minimo: '5',
      codigo_barras: ''
    });
    await loadData();
    showToast(`Producto creado: ${newCustom.nombre}`);
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      {/* Sub-navigation Tabs */}
      {onSelectSubView && (
        <ProductsSubNav currentSubView="inventory" onSelectSubView={onSelectSubView} />
      )}
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Hidden CSV File Input */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleImportCSV} 
        accept=".csv" 
        className="hidden" 
      />

      {/* Top Action & Title Banner (1:1 Stitch Layout) */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-1.5">
              <Package className="w-4 h-4 text-blue-600" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
                Kardex & Almacén
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              Inventario & Stock
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Control de almacén, valorización y alertas de reposición
            </p>
          </div>

          {/* Action Bar */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Quick Barcode Gun / Camera Scanner */}
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                title="Escanear Código de Barras"
                className="w-10 h-10 bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-slate-200 active:scale-95"
              >
                <Barcode className="w-5 h-5" />
              </button>
            )}

            {/* Print Shelf Stickers */}
            <button
              onClick={() => setIsBarcodePrinterModalOpen(true)}
              title="Imprimir Etiquetas de Góndola / Códigos"
              className="w-10 h-10 bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-violet-600 rounded-xl flex items-center justify-center transition-all border border-slate-200 active:scale-95"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* CSV Export & Import */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200">
              <button
                onClick={handleExportCSV}
                title="Exportar Catálogo a Excel / CSV"
                className="px-2.5 py-2 text-slate-600 hover:text-emerald-700 font-bold text-xs flex items-center gap-1 rounded-lg hover:bg-white transition-all"
              >
                <Download className="w-3.5 h-3.5 text-emerald-600" />
                <span className="hidden sm:inline">CSV</span>
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                title="Importar Catálogo desde CSV"
                className="px-2.5 py-2 text-slate-600 hover:text-blue-700 font-bold text-xs flex items-center gap-1 rounded-lg hover:bg-white transition-all"
              >
                <Upload className="w-3.5 h-3.5 text-blue-600" />
                <span className="hidden sm:inline">Importar</span>
              </button>
            </div>

            {/* Quick Kardex Movement Button */}
            <button
              onClick={() => {
                if (products.length > 0) {
                  handleOpenKardex(products[0]);
                } else {
                  alert('Registra primero algún producto en tu catálogo.');
                }
              }}
              className="h-10 px-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-blue-500/20 transition-all"
            >
              <ArrowDownRight className="w-4 h-4" />
              <span>+ Kardex</span>
            </button>

            {/* Master Catalog */}
            <button
              onClick={() => setIsMasterModalOpen(true)}
              className="h-10 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span className="hidden sm:inline">Catálogo Maestro</span>
              <span className="sm:hidden">Maestro</span>
            </button>
          </div>
        </div>

        {/* Sede / Almacén Switcher Dropdown Bar (Stitch 1:1) */}
        <div className="flex items-center justify-between bg-slate-100/80 p-2 rounded-2xl border border-slate-200/60">
          <div className="flex items-center gap-2 pl-1 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="flex flex-col min-w-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 leading-none">
                Sede / Almacén Activo
              </span>
              <span className="text-xs font-bold text-slate-800 truncate">
                {currentSede}
              </span>
            </div>
          </div>

          <select
            value={currentSede}
            onChange={(e) => setCurrentSede(e.target.value)}
            className="text-xs font-bold text-slate-700 bg-white border border-slate-200 rounded-xl px-2 py-1.5 shadow-xs focus:ring-2 focus:ring-blue-500"
          >
            <option value="Almacén Central - La Paz / Santa Cruz">Almacén Central</option>
            <option value="Sucursal 1 - Tienda El Prado">Sucursal El Prado</option>
            <option value="Depósito Secundario - Mercadería General">Depósito General</option>
          </select>
        </div>
      </div>

      {/* Alertas & Micro-Bento Métricas (Stitch 1:1) */}
      <div className="p-4 flex flex-col gap-3">
        {/* Banner de Alerta Crítica (Delight Card) */}
        {criticalProductsCount > 0 && (
          <div className="relative overflow-hidden bg-rose-50 border border-rose-200 text-rose-950 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 animate-fadeIn">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-rose-500/30 animate-pulse">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-sm text-rose-900">
                    Alerta de Existencias
                  </span>
                  <span className="w-2 h-2 rounded-full bg-rose-500 inline-block animate-ping"></span>
                </div>
                <p className="text-xs text-rose-700 font-medium truncate">
                  {criticalProductsCount} {criticalProductsCount === 1 ? 'producto' : 'productos'} en stock crítico ({outOfStockCount} agotados)
                </p>
              </div>
            </div>

            <button
              onClick={() => {
                setStatusFilter('low');
                setCategoryFilter('ALL');
              }}
              className="h-9 px-3 bg-white text-rose-700 hover:bg-rose-100/60 font-bold rounded-xl text-xs shrink-0 shadow-xs border border-rose-200 active:scale-95 transition-all flex items-center gap-1"
            >
              <span>Ver críticos</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Micro-Bento Estadísticas rápidas */}
        <div className="grid grid-cols-2 gap-3">
          {/* Bento Card 1: Catálogo Activo */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Catálogo Activo</span>
              <span className="w-7 h-7 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Package className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-2xl font-black text-slate-900 tracking-tight">
                {products.length}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                <span className="text-[11px] font-bold text-emerald-700">
                  100% Offline & Sincronizado
                </span>
              </div>
            </div>
          </div>

          {/* Bento Card 2: Valorización Total de Stock */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500">Valorización Almacén</span>
              <span className="w-7 h-7 rounded-xl bg-violet-50 text-violet-600 flex items-center justify-center">
                <TrendingUp className="w-4 h-4" />
              </span>
            </div>
            <div className="mt-2">
              <div className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Bs. {totalValuation.toLocaleString('es-BO', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="flex items-center gap-1 mt-0.5">
                <span className="text-[11px] font-bold text-violet-700">
                  Margen Promedio: +{avgMargin}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Buscador Táctil y Filtros Rápidos (Stitch 1:1) */}
      <div className="px-4 pb-2 flex flex-col gap-2.5">
        <div className="relative flex items-center w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por producto, marca, categoría o código..."
            className="w-full h-11 pl-10 pr-10 bg-white text-slate-900 placeholder:text-slate-400 text-xs font-medium rounded-2xl border border-slate-200 shadow-xs focus:outline-none focus:ring-2 focus:ring-blue-600/30 transition-all"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chips de Filtrado Horizontal (Stitch 1:1) */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          <button
            onClick={() => setStatusFilter('all')}
            className={`min-h-[34px] px-3.5 rounded-full text-xs font-extrabold shrink-0 flex items-center gap-1.5 transition-all ${
              statusFilter === 'all'
                ? 'bg-blue-600 text-white shadow-sm shadow-blue-500/25'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Todos</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-600'
            }`}>
              {products.length}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('low')}
            className={`min-h-[34px] px-3.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
              statusFilter === 'low'
                ? 'bg-rose-600 text-white shadow-sm shadow-rose-500/25'
                : 'bg-white text-rose-700 hover:bg-rose-50 border border-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block"></span>
            <span>Bajo Stock</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'low' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
            }`}>
              {criticalProductsCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('out')}
            className={`min-h-[34px] px-3.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
              statusFilter === 'out'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <span>Agotados</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
              statusFilter === 'out' ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {outOfStockCount}
            </span>
          </button>

          <button
            onClick={() => setStatusFilter('turnover')}
            className={`min-h-[34px] px-3.5 rounded-full text-xs font-bold shrink-0 flex items-center gap-1.5 transition-all ${
              statusFilter === 'turnover'
                ? 'bg-violet-600 text-white shadow-sm shadow-violet-500/25'
                : 'bg-white text-violet-700 hover:bg-violet-50 border border-slate-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Mayor Margen</span>
          </button>

          {/* Categories */}
          {categories.filter(c => c !== 'ALL').map(cat => (
            <button
              key={cat}
              onClick={() => setCategoryFilter(categoryFilter === cat ? 'ALL' : cat)}
              className={`min-h-[34px] px-3 rounded-full text-xs font-semibold shrink-0 transition-all ${
                categoryFilter === cat
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Productos Táctiles (Stitch 1:1 Kardex Ready) */}
      <div className="px-4 py-1 flex flex-col gap-3">
        {filteredProducts.map((prod) => {
          const stock = Number(prod.stock_actual) || 0;
          const minStock = Number(prod.stock_minimo) || 5;
          const isOut = stock === 0;
          const isCritical = stock <= minStock && !isOut;
          
          // Stock meter percentage (based on minStock * 3 as target)
          const targetStock = Math.max(minStock * 3, 20);
          const stockPercent = Math.min(100, Math.round((stock / targetStock) * 100));

          // Margin calculation
          const venta = Number(prod.precio_venta) || 0;
          const compra = Number(prod.precio_compra) || (venta * 0.8);
          const marginPercent = compra > 0 ? Math.round(((venta - compra) / compra) * 100) : 30;

          // Acronym
          const acronym = (prod.categoria || 'PROD').substring(0, 3).toUpperCase();

          return (
            <div
              key={prod.id}
              className={`bg-white rounded-2xl p-4 border shadow-xs hover:shadow-md transition-all flex flex-col gap-3 ${
                isOut 
                  ? 'border-rose-200/80 bg-slate-50/50' 
                  : isCritical 
                    ? 'border-amber-300/80 bg-amber-50/20' 
                    : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Product Image & Acronym */}
                <div className="w-16 h-16 rounded-2xl bg-slate-100 shrink-0 overflow-hidden relative border border-slate-200/60 shadow-inner">
                  <img
                    src={prod.foto_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                    alt={prod.nombre}
                    className={`w-full h-full object-cover ${isOut ? 'grayscale opacity-60' : ''}`}
                    onError={(e) => {
                      e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
                    }}
                  />
                  <span className="absolute bottom-1 right-1 bg-slate-900/80 backdrop-blur-xs text-white text-[9px] font-bold px-1.5 py-0.2 rounded-md">
                    {acronym}
                  </span>
                </div>

                {/* Product Core Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                      SKU: {prod.codigo_barras || 'S/N'}
                    </span>

                    {/* Status Pill */}
                    {isOut ? (
                      <span className="px-2 py-0.5 rounded-full bg-rose-600 text-white font-extrabold text-[10px] uppercase tracking-wide">
                        Agotado
                      </span>
                    ) : isCritical ? (
                      <span className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-900 font-extrabold text-[10px] flex items-center gap-1 border border-amber-300">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-600 animate-ping"></span>
                        Stock Crítico
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-extrabold text-[10px] flex items-center gap-1 border border-blue-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                        En Stock
                      </span>
                    )}
                  </div>

                  <h2 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug mt-0.5 truncate">
                    {prod.nombre}
                  </h2>

                  {/* Pricing and Margin */}
                  <div className="flex items-baseline flex-wrap gap-2 mt-1">
                    <span className="text-[11px] font-bold text-slate-400">Venta:</span>
                    <span className="text-base font-extrabold text-blue-600">
                      Bs. {venta.toFixed(2)}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">
                      | Costo: Bs. {compra.toFixed(2)}
                    </span>
                    <span className="px-1.5 py-0.2 bg-emerald-50 text-emerald-700 rounded-md text-[10px] font-extrabold border border-emerald-200">
                      +{marginPercent}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Stock Meter & Quick Controls (Stitch 1:1) */}
              <div className={`p-2.5 rounded-xl flex items-center justify-between gap-3 ${
                isOut 
                  ? 'bg-rose-100/50' 
                  : isCritical 
                    ? 'bg-amber-100/50' 
                    : 'bg-slate-100/80'
              }`}>
                <div className="flex flex-col min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className={`text-base font-black ${
                      isOut ? 'text-rose-700' : isCritical ? 'text-amber-800' : 'text-slate-900'
                    }`}>
                      {stock}
                    </span>
                    <span className="text-xs font-semibold text-slate-500">
                      {isOut ? 'unid. en stock' : 'unid. disponibles'}
                    </span>
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="w-36 h-2 rounded-full bg-slate-200 overflow-hidden mt-1">
                    <div
                      className={`h-full rounded-full transition-all ${
                        isOut 
                          ? 'w-0 bg-rose-500' 
                          : isCritical 
                            ? 'bg-amber-500' 
                            : 'bg-gradient-to-r from-blue-600 to-violet-600'
                      }`}
                      style={{ width: `${stockPercent}%` }}
                    />
                  </div>
                  <span className="text-[10px] font-medium text-slate-400 mt-0.5">
                    Mínimo sugerido: {minStock} unid.
                  </span>
                </div>

                {/* Card Action Buttons */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {/* Kardex Quick Adjust */}
                  <button
                    onClick={() => handleOpenKardex(prod)}
                    className="min-h-[38px] px-3 bg-white hover:bg-slate-50 active:scale-95 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1 border border-slate-200 shadow-xs transition-all"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kardex</span>
                  </button>

                  {/* +1 Quick Stock Increment */}
                  <button
                    onClick={(e) => handleQuickAddStock(prod, e)}
                    title="Entrada rápida +1 unidad"
                    className="min-h-[38px] w-9 h-9 bg-blue-50 active:bg-blue-600 hover:bg-blue-100 text-blue-700 active:text-white rounded-xl flex items-center justify-center transition-all border border-blue-200 active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                  </button>

                  {/* Edit */}
                  <button
                    onClick={(e) => handleOpenEdit(prod, e)}
                    title="Editar producto"
                    className="min-h-[38px] w-9 h-9 bg-white active:bg-slate-100 text-slate-500 hover:text-slate-800 rounded-xl flex items-center justify-center transition-all border border-slate-200"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete */}
                  <button
                    onClick={(e) => handleDeleteProduct(prod, e)}
                    title="Eliminar del catálogo"
                    className="min-h-[38px] w-9 h-9 bg-white active:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-xl flex items-center justify-center transition-all border border-slate-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 space-y-3">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <h3 className="font-bold text-slate-800 text-sm">No se encontraron productos</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              No hay coincidencias para los filtros aplicados. Puedes agregar productos desde el Catálogo Maestro de Bolivia o registrar uno nuevo.
            </p>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setIsMasterModalOpen(true)}
                className="px-3.5 py-2 bg-blue-600 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-blue-700 transition"
              >
                Buscar en Catálogo Maestro
              </button>
              <button
                onClick={() => setIsCustomProductModal(true)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 text-xs font-bold rounded-xl hover:bg-slate-200 transition"
              >
                + Crear Personalizado
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sección Kardex Valorizado & Movimientos Recientes (Stitch 1:1) */}
      <div className="px-4 pt-6 pb-4 flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-violet-100 text-violet-700 flex items-center justify-center">
              <History className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-extrabold text-slate-900">
              Kardex de Movimientos Recientes
            </h3>
          </div>
          <span className="text-xs text-slate-400 font-medium">
            Últimos registros
          </span>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
          {kardexList.slice(0, 5).map((mov) => {
            const isEntry = mov.tipo === 'ENTRADA';
            const isMerma = mov.tipo === 'MERMA';
            return (
              <div
                key={mov.id}
                className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                    isEntry 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : isMerma 
                        ? 'bg-rose-100 text-rose-700' 
                        : 'bg-blue-100 text-blue-700'
                  }`}>
                    {isEntry ? (
                      <ArrowDownRight className="w-4 h-4" />
                    ) : (
                      <ArrowUpRight className="w-4 h-4" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {mov.motivo}
                      </span>
                      <span className="font-mono text-[10px] text-slate-400 font-medium">
                        {new Date(mov.fecha).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 truncate mt-0.5">
                      {mov.producto_nombre} • Saldo: <strong>{mov.saldo_nuevo} uds</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span className={`text-xs font-black block font-mono ${
                    isEntry ? 'text-emerald-700' : 'text-rose-700'
                  }`}>
                    {isEntry ? `+${mov.cantidad}` : `-${mov.cantidad}`} unid.
                  </span>
                  <span className="text-[10px] font-bold text-slate-400 uppercase">
                    {mov.tipo}
                  </span>
                </div>
              </div>
            );
          })}

          {kardexList.length === 0 && (
            <div className="p-6 text-center text-slate-400 text-xs">
              Aún no hay movimientos registrados en el Kardex.
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Button for Custom Product */}
      <div className="fixed bottom-20 right-4 z-20">
        <button
          onClick={() => setIsCustomProductModal(true)}
          className="px-4 py-3.5 bg-slate-900 text-white rounded-2xl shadow-xl flex items-center gap-2 text-xs font-bold hover:bg-slate-800 active:scale-95 transition-all border border-slate-700"
        >
          <Plus className="w-4 h-4 text-emerald-400" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Modal: Kardex Quick Adjust Bottom Sheet (Stitch 1:1) */}
      {isKardexModalOpen && selectedProductForKardex && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex flex-col justify-end animate-fadeIn">
          <div className="bg-white rounded-t-3xl p-5 shadow-2xl max-w-lg mx-auto w-full flex flex-col gap-4 animate-slideUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <RefreshCw className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">
                    Ajuste de Kardex & Existencias
                  </h3>
                  <p className="text-[11px] text-slate-500 truncate max-w-[240px]">
                    {selectedProductForKardex.nombre}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsKardexModalOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-100 text-slate-500 hover:text-slate-800 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Tipo de Movimiento Switcher (Stitch 1:1) */}
            <div className="grid grid-cols-3 gap-1 bg-slate-100 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setKardexTipo('ENTRADA');
                  setKardexMotivo('Ingreso por Compra / Abastecimiento');
                }}
                className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                  kardexTipo === 'ENTRADA'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                + Entrada
              </button>

              <button
                type="button"
                onClick={() => {
                  setKardexTipo('SALIDA');
                  setKardexMotivo('Ajuste de Salida / Conteo Físico');
                }}
                className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                  kardexTipo === 'SALIDA'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                - Salida
              </button>

              <button
                type="button"
                onClick={() => {
                  setKardexTipo('MERMA');
                  setKardexMotivo('Merma / Producto Vencido o Dañado');
                }}
                className={`py-2 text-center rounded-xl text-xs font-bold transition-all ${
                  kardexTipo === 'MERMA'
                    ? 'bg-rose-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Merma
              </button>
            </div>

            {/* Stepper Cantidad */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                Cantidad a modificar ({selectedProductForKardex.tipo_venta === 'PESO' ? 'Kg' : (selectedProductForKardex.unidad_medida || 'unidades')})
              </label>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const step = selectedProductForKardex.tipo_venta === 'PESO' ? 0.25 : 1;
                    setKardexCantidad(prev => Math.max(step, Math.round((prev - step) * 1000) / 1000));
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-100 active:bg-slate-200 text-slate-800 font-black text-xl flex items-center justify-center border border-slate-200"
                >
                  -
                </button>
                <input
                  type="number"
                  step="any"
                  min="0.001"
                  value={kardexCantidad}
                  onChange={(e) => setKardexCantidad(parseFloat(e.target.value) || 0)}
                  className="flex-1 h-12 text-center text-xl font-black bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="button"
                  onClick={() => {
                    const step = selectedProductForKardex.tipo_venta === 'PESO' ? 0.25 : 1;
                    setKardexCantidad(prev => Math.round((prev + step) * 1000) / 1000);
                  }}
                  className="w-12 h-12 rounded-2xl bg-slate-100 active:bg-slate-200 text-slate-800 font-black text-xl flex items-center justify-center border border-slate-200"
                >
                  +
                </button>
              </div>
            </div>

            {/* Stock Impact Preview */}
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
              <span className="text-slate-500 font-medium">Stock actual:</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-700">
                  {selectedProductForKardex.stock_actual} {selectedProductForKardex.tipo_venta === 'PESO' ? 'Kg' : (selectedProductForKardex.unidad_medida || 'uds')}
                </span>
                <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                <span className="font-black text-blue-700">
                  {Math.round((kardexTipo === 'ENTRADA'
                    ? selectedProductForKardex.stock_actual + Number(kardexCantidad)
                    : Math.max(0, selectedProductForKardex.stock_actual - Number(kardexCantidad))) * 1000) / 1000} {selectedProductForKardex.tipo_venta === 'PESO' ? 'Kg' : (selectedProductForKardex.unidad_medida || 'uds')}
                </span>
              </div>
            </div>

            {/* Motivo de Movimiento */}
            <div>
              <label className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1">
                Motivo del Movimiento / Referencia
              </label>
              <input
                type="text"
                value={kardexMotivo}
                onChange={(e) => setKardexMotivo(e.target.value)}
                placeholder="Ej. Conteo físico, factura proveedor 001-2839..."
                className="w-full h-11 px-3 bg-slate-50 text-xs font-semibold rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsKardexModalOpen(false)}
                className="flex-1 h-12 bg-slate-100 text-slate-700 font-bold text-xs rounded-2xl hover:bg-slate-200 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSaveKardexAdjustment}
                className="flex-1 h-12 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-2xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 transition-all"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirmar Ajuste</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Impresión de Etiquetas de Góndola / Códigos de Barra */}
      {isBarcodePrinterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsBarcodePrinterModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 flex flex-col max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-violet-600" />
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">
                    Impresión de Etiquetas de Góndola
                  </h3>
                  <p className="text-[11px] text-slate-500">
                    Genera etiquetas de precio y códigos de barra para estanterías
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsBarcodePrinterModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Sticker Preview Container (Printable) */}
            <div className="p-3 overflow-y-auto flex-1 space-y-3" id="printable-tags">
              <div className="text-[11px] text-slate-500 font-medium bg-violet-50 p-2 rounded-xl text-violet-800 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-violet-600 shrink-0" />
                <span>Formato estándar para impresoras térmicas de etiquetas (50mm x 30mm) o papel A4.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {products.slice(0, 8).map(p => (
                  <div
                    key={p.id}
                    className="p-3 bg-white border-2 border-dashed border-slate-300 rounded-xl flex flex-col justify-between items-center text-center space-y-1 shadow-xs"
                  >
                    <span className="text-[9px] font-black uppercase text-slate-400 tracking-wider">
                      GLORYPOS • BOLIVIA
                    </span>
                    <h4 className="font-bold text-xs text-slate-900 line-clamp-1 leading-tight">
                      {p.nombre}
                    </h4>
                    
                    {/* Barcode visual lines simulation */}
                    <div className="py-1 w-full flex flex-col items-center">
                      <div className="h-7 w-36 bg-slate-900 flex items-center justify-around px-1">
                        <div className="h-full w-0.5 bg-white"></div>
                        <div className="h-full w-1 bg-white"></div>
                        <div className="h-full w-0.5 bg-white"></div>
                        <div className="h-full w-1.5 bg-white"></div>
                        <div className="h-full w-0.5 bg-white"></div>
                        <div className="h-full w-1 bg-white"></div>
                        <div className="h-full w-2 bg-white"></div>
                        <div className="h-full w-0.5 bg-white"></div>
                      </div>
                      <span className="font-mono text-[9px] font-bold text-slate-600 tracking-widest mt-0.5">
                        {p.codigo_barras || '77700012345'}
                      </span>
                    </div>

                    <div className="w-full pt-1 border-t border-slate-100 flex items-center justify-between">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">{p.categoria}</span>
                      <span className="text-sm font-black text-slate-900">
                        Bs. {Number(p.precio_venta).toFixed(2)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer Print Actions */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
              <span className="text-xs text-slate-500 font-medium">
                {products.length} etiquetas listas
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsBarcodePrinterModalOpen(false)}
                  className="px-3 py-2 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200"
                >
                  Cerrar
                </button>
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-4 py-2 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md shadow-violet-500/25 flex items-center gap-1.5"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Etiquetas</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Editar Producto Existente */}
      {isEditProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsEditProductModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <form 
            onSubmit={handleSaveEditProduct}
            className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Editar Producto</h3>
              <button
                type="button"
                onClick={() => setIsEditProductModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Nombre del Producto
              </label>
              <input
                type="text"
                required
                value={editForm.nombre}
                onChange={(e) => setEditForm({ ...editForm, nombre: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Categoría
                </label>
                <input
                  type="text"
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Código de Barras / SKU
                </label>
                <input
                  type="text"
                  value={editForm.codigo_barras}
                  onChange={(e) => setEditForm({ ...editForm, codigo_barras: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Precio Venta (Bs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={editForm.precio_venta}
                  onChange={(e) => setEditForm({ ...editForm, precio_venta: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-extrabold text-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Precio Costo (Bs.)
                </label>
                <input
                  type="number"
                  step="any"
                  value={editForm.precio_compra}
                  onChange={(e) => setEditForm({ ...editForm, precio_compra: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Stock Actual
                </label>
                <input
                  type="number"
                  value={editForm.stock_actual}
                  onChange={(e) => setEditForm({ ...editForm, stock_actual: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Stock Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  value={editForm.stock_minimo}
                  onChange={(e) => setEditForm({ ...editForm, stock_minimo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditProductModalOpen(false)}
                className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition"
              >
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Catálogo Maestro Global de Bolivia (Stitch 1:1) */}
      {isMasterModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsMasterModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl z-10 flex flex-col max-h-[88vh] overflow-hidden">
            <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <h3 className="font-bold text-sm">Catálogo Maestro Bolivia</h3>
                </div>
                <p className="text-[11px] text-indigo-100 mt-0.5">
                  Selecciona un producto comercial de marcas líderes y fíjale tu precio
                </p>
              </div>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Master list */}
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
                    <img
                      src={m.foto_url}
                      alt={m.nombre}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-100"
                    />
                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-bold text-indigo-600 uppercase">
                        {m.categoria}
                      </span>
                      <h5 className="font-bold text-xs text-slate-800 truncate">
                        {m.nombre}
                      </h5>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Sugerido: Bs. {m.precio_sugerido?.toFixed(2) || '10.00'}
                      </span>
                    </div>

                    <button className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-700'
                    }`}>
                      {isSelected ? 'Seleccionado' : 'Elegir'}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Selected Master Form Footer */}
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
                      Tu Precio de Venta (Bs.)
                    </label>
                    <input
                      type="number"
                      step="any"
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-extrabold text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold text-slate-600 block mb-1">
                      Stock Inicial
                    </label>
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:ring-2 focus:ring-indigo-600"
                    />
                  </div>
                </div>

                <button
                  onClick={handleAddMasterToStore}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar en mi Tienda</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Crear Producto Personalizado */}
      {isCustomProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsCustomProductModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <form 
            onSubmit={handleCreateCustom}
            className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-slate-900 text-sm">Crear Producto Personalizado</h3>
              <button
                type="button"
                onClick={() => setIsCustomProductModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Nombre del Producto *
              </label>
              <input
                type="text"
                required
                value={customForm.nombre}
                onChange={(e) => setCustomForm({ ...customForm, nombre: e.target.value })}
                placeholder="Ej: Empanada de Queso Casera"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Categoría
                </label>
                <select
                  value={customForm.categoria}
                  onChange={(e) => setCustomForm({ ...customForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="Abarrotes">Abarrotes</option>
                  <option value="Bebidas & Gaseosas">Bebidas & Gaseosas</option>
                  <option value="Comida / Panadería">Comida / Panadería</option>
                  <option value="Lácteos & Huevos">Lácteos & Huevos</option>
                  <option value="Licores & Cervezas">Licores & Cervezas</option>
                  <option value="Snacks & Golosinas">Snacks & Golosinas</option>
                  <option value="Limpieza & Hogar">Limpieza & Hogar</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Código de Barras (Opcional)
                </label>
                <input
                  type="text"
                  value={customForm.codigo_barras}
                  onChange={(e) => setCustomForm({ ...customForm, codigo_barras: e.target.value })}
                  placeholder="EAN-13 / SKU"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Precio Venta (Bs.) *
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  value={customForm.precio_venta}
                  onChange={(e) => setCustomForm({ ...customForm, precio_venta: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-extrabold text-blue-600"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Costo de Compra (Bs.)
                </label>
                <input
                  type="number"
                  step="any"
                  value={customForm.precio_compra}
                  onChange={(e) => setCustomForm({ ...customForm, precio_compra: e.target.value })}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Stock Inicial
                </label>
                <input
                  type="number"
                  value={customForm.stock_actual}
                  onChange={(e) => setCustomForm({ ...customForm, stock_actual: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Stock Mínimo (Alerta)
                </label>
                <input
                  type="number"
                  value={customForm.stock_minimo}
                  onChange={(e) => setCustomForm({ ...customForm, stock_minimo: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
            >
              Guardar Producto
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
