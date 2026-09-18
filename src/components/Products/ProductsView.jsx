import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  Package, Search, Plus, Sparkles, Edit2, AlertTriangle, 
  CheckCircle2, X, Tag, Barcode, Download, Upload, 
  Trash2, Layers, LayoutGrid, List, Boxes, ArrowRight, Eye,
  Scale, Pill, Shirt, Beef, IceCream, Store, Wrench, Check
} from 'lucide-react';
import { db } from '../../db/dexie';
import { RUBROS_CONFIG } from '../../db/rubros';
import ProductsSubNav from './ProductsSubNav';

const RUBRO_ICONS = {
  Store,
  Wrench,
  Pill,
  Shirt,
  Beef,
  IceCream
};

const COMMON_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', '28', '30', '32', '34', '36', '38', '40', '42'];
const COMMON_COLORS = ['Blanco', 'Negro', 'Azul Marino', 'Rojo', 'Gris Plomo', 'Verde', 'Beige', 'Rosado'];
const COMMON_FLAVORS = ['Chocolate Belga', 'Vainilla Francesa', 'Frutilla Natural', 'Dulce de Leche', 'Maracuyá', 'Menta Granizada', 'Oreo Cookies', 'Café'];
const COMMON_TOPPINGS = ['Grajeas de Colores', 'Chispas de Chocolate', 'Salsa de Frutilla', 'Salsa de Caramelo', 'Maní Picado', 'Crema Chantilly'];

export default function ProductsView({ currentRubro = 'ABARROTES', onSelectSubView, onOpenScanner }) {
  const [activeRubro, setActiveRubro] = useState(currentRubro);
  const [products, setProducts] = useState([]);
  const [masterProducts, setMasterProducts] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isGridView, setIsGridView] = useState(true);

  // Modals
  const [isMasterModalOpen, setIsMasterModalOpen] = useState(false);
  const [isCustomProductModal, setIsCustomProductModal] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState(null);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState(null);

  // Forms
  const [newPrice, setNewPrice] = useState('');
  const [newStock, setNewStock] = useState('12');

  const rubroConfig = RUBROS_CONFIG[activeRubro] || RUBROS_CONFIG.ABARROTES;
  const RubroIcon = RUBRO_ICONS[rubroConfig.icono] || Store;

  const [customForm, setCustomForm] = useState({
    nombre: '',
    categoria: rubroConfig.categorias[0] || 'Abarrotes',
    precio_venta: '',
    precio_compra: '',
    stock_actual: '10',
    stock_minimo: '5',
    codigo_barras: '',
    unidad_medida: rubroConfig.unidades_sugeridas[0] || 'Unidad',
    tipo_venta: activeRubro === 'CARNICERIA' ? 'PESO' : 'UNIDAD',
    lote: '',
    fecha_vencimiento: '',
    principio_activo: '',
    tallas: activeRubro === 'ROPA' ? ['S', 'M', 'L', 'XL'] : [],
    colores: activeRubro === 'ROPA' ? ['Blanco', 'Negro', 'Azul Marino'] : [],
    sabores: activeRubro === 'HELADERIA' ? ['Chocolate Belga', 'Vainilla Francesa', 'Frutilla Natural'] : [],
    toppings: activeRubro === 'HELADERIA' ? ['Grajeas de Colores', 'Chispas de Chocolate'] : []
  });

  const [editForm, setEditForm] = useState({
    id: '',
    nombre: '',
    categoria: '',
    precio_venta: '',
    precio_compra: '',
    stock_actual: '',
    stock_minimo: '',
    codigo_barras: '',
    unidad_medida: 'Unidad',
    tipo_venta: 'UNIDAD',
    lote: '',
    fecha_vencimiento: '',
    principio_activo: '',
    tallas: [],
    colores: [],
    sabores: [],
    toppings: []
  });

  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    const list = await db.productos_tienda.toArray();
    setProducts(list);
    const master = await db.catalogo_maestro.toArray();
    setMasterProducts(master);

    // Sync active rubro from Dexie config if available
    try {
      const cfg = await db.config_empresa.get('empresa_activa');
      if (cfg && cfg.rubro) {
        setActiveRubro(cfg.rubro);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
  }, [currentRubro]);

  // Update default form values whenever active rubro changes
  useEffect(() => {
    const cfg = RUBROS_CONFIG[activeRubro] || RUBROS_CONFIG.ABARROTES;
    setCustomForm(prev => ({
      ...prev,
      categoria: cfg.categorias[0] || 'General',
      unidad_medida: cfg.unidades_sugeridas[0] || 'Unidad',
      tipo_venta: activeRubro === 'CARNICERIA' ? 'PESO' : 'UNIDAD',
      tallas: activeRubro === 'ROPA' ? ['S', 'M', 'L', 'XL'] : [],
      colores: activeRubro === 'ROPA' ? ['Blanco', 'Negro', 'Azul Marino'] : [],
      sabores: activeRubro === 'HELADERIA' ? ['Chocolate Belga', 'Vainilla Francesa', 'Frutilla Natural'] : [],
      toppings: activeRubro === 'HELADERIA' ? ['Grajeas de Colores', 'Chispas de Chocolate'] : []
    }));
  }, [activeRubro]);

  const categories = useMemo(() => {
    const set = new Set(products.map(p => p.categoria).filter(Boolean));
    rubroConfig.categorias.forEach(c => set.add(c));
    return ['ALL', ...Array.from(set)];
  }, [products, rubroConfig]);

  const filtered = useMemo(() => {
    return products.filter(p => {
      const text = `${p.nombre} ${p.categoria} ${p.codigo_barras || ''} ${p.principio_activo || ''} ${p.lote || ''}`.toLowerCase();
      const matchSearch = text.includes(search.toLowerCase());
      const matchCat = selectedCategory === 'ALL' || p.categoria === selectedCategory;
      return matchSearch && matchCat;
    });
  }, [products, search, selectedCategory]);

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
      codigo_barras: prod.codigo_barras || '',
      unidad_medida: prod.unidad_medida || 'Unidad',
      tipo_venta: prod.tipo_venta || 'UNIDAD',
      lote: prod.lote || '',
      fecha_vencimiento: prod.fecha_vencimiento || '',
      principio_activo: prod.principio_activo || '',
      tallas: prod.tallas || [],
      colores: prod.colores || [],
      sabores: prod.sabores || [],
      toppings: prod.toppings || []
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
      codigo_barras: editForm.codigo_barras,
      unidad_medida: editForm.unidad_medida,
      tipo_venta: editForm.tipo_venta,
      lote: editForm.lote || null,
      fecha_vencimiento: editForm.fecha_vencimiento || null,
      principio_activo: editForm.principio_activo || null,
      tallas: editForm.tallas?.length ? editForm.tallas : null,
      colores: editForm.colores?.length ? editForm.colores : null,
      sabores: editForm.sabores?.length ? editForm.sabores : null,
      toppings: editForm.toppings?.length ? editForm.toppings : null
    });

    setIsEditProductModalOpen(false);
    await loadData();
    showToast(`Producto ${editForm.nombre} actualizado`);
  };

  const handleDeleteProduct = async (prod, e) => {
    e.stopPropagation();
    if (confirm(`¿Eliminar producto "${prod.nombre}" del catálogo?`)) {
      await db.productos_tienda.delete(prod.id);
      await loadData();
      showToast('Producto eliminado');
    }
  };

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
      tipo_venta: selectedMaster.tipo_venta || 'UNIDAD',
      presentaciones: selectedMaster.presentaciones || [],
      lote: selectedMaster.lote || null,
      fecha_vencimiento: selectedMaster.fecha_vencimiento || null,
      principio_activo: selectedMaster.principio_activo || null
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

  const handleCreateCustom = async (e) => {
    e.preventDefault();
    if (!customForm.nombre || !customForm.precio_venta) return;

    const newCustom = {
      id: `prod-custom-${Date.now()}`,
      maestro_id: null,
      codigo_barras: customForm.codigo_barras || `GEN-${Date.now()}`,
      nombre: customForm.nombre,
      categoria: customForm.categoria,
      unidad_medida: customForm.unidad_medida || 'Unidad',
      foto_url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80',
      precio_venta: Number(customForm.precio_venta),
      precio_compra: Number(customForm.precio_compra) || (Number(customForm.precio_venta) * 0.8),
      stock_actual: Number(customForm.stock_actual) || 0,
      stock_minimo: Number(customForm.stock_minimo) || 5,
      tipo_venta: customForm.tipo_venta || (activeRubro === 'CARNICERIA' ? 'PESO' : 'UNIDAD'),
      lote: customForm.lote || null,
      fecha_vencimiento: customForm.fecha_vencimiento || null,
      principio_activo: customForm.principio_activo || null,
      tallas: customForm.tallas?.length ? customForm.tallas : null,
      colores: customForm.colores?.length ? customForm.colores : null,
      sabores: customForm.sabores?.length ? customForm.sabores : null,
      toppings: customForm.toppings?.length ? customForm.toppings : null,
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
      categoria: rubroConfig.categorias[0] || 'General',
      precio_venta: '',
      precio_compra: '',
      stock_actual: '10',
      stock_minimo: '5',
      codigo_barras: '',
      unidad_medida: rubroConfig.unidades_sugeridas[0] || 'Unidad',
      tipo_venta: activeRubro === 'CARNICERIA' ? 'PESO' : 'UNIDAD',
      lote: '',
      fecha_vencimiento: '',
      principio_activo: '',
      tallas: activeRubro === 'ROPA' ? ['S', 'M', 'L', 'XL'] : [],
      colores: activeRubro === 'ROPA' ? ['Blanco', 'Negro', 'Azul Marino'] : [],
      sabores: activeRubro === 'HELADERIA' ? ['Chocolate Belga', 'Vainilla Francesa', 'Frutilla Natural'] : [],
      toppings: activeRubro === 'HELADERIA' ? ['Grajeas de Colores', 'Chispas de Chocolate'] : []
    });
    await loadData();
    showToast(`Producto creado: ${newCustom.nombre}`);
  };

  const toggleArrayItem = (setter, currentList, item) => {
    if (currentList.includes(item)) {
      setter(currentList.filter(x => x !== item));
    } else {
      setter([...currentList, item]);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['codigo_barras', 'nombre', 'categoria', 'precio_venta', 'precio_compra', 'stock_actual', 'stock_minimo', 'unidad_medida', 'tipo_venta', 'lote', 'fecha_vencimiento'];
    const rows = products.map(p => [
      `"${p.codigo_barras || ''}"`,
      `"${(p.nombre || '').replace(/"/g, '""')}"`,
      `"${p.categoria || ''}"`,
      p.precio_venta || 0,
      p.precio_compra || (p.precio_venta * 0.8),
      p.stock_actual || 0,
      p.stock_minimo || 5,
      `"${p.unidad_medida || 'Unidad'}"`,
      `"${p.tipo_venta || 'UNIDAD'}"`,
      `"${p.lote || ''}"`,
      `"${p.fecha_vencimiento || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' 
      + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `catalogo_${activeRubro.toLowerCase()}_glorypos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Catálogo exportado exitosamente a CSV');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      {/* Sub-navigation Tabs */}
      {onSelectSubView && (
        <ProductsSubNav currentSubView="productos" onSelectSubView={onSelectSubView} />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner with Rubro Badge */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-1 rounded-lg text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                <RubroIcon className="w-3.5 h-3.5" />
                {rubroConfig.nombre}
              </span>
              <span className="text-[11px] text-slate-400 font-medium">
                • {rubroConfig.badge}
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mt-1">
              Catálogo de Productos
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Gestión de artículos adaptada para {rubroConfig.subtitulo.toLowerCase()}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {onOpenScanner && (
              <button
                onClick={onOpenScanner}
                title="Escanear Código de Barras"
                className="w-10 h-10 bg-slate-100 active:bg-slate-200 text-slate-700 hover:text-blue-600 rounded-xl flex items-center justify-center transition-all border border-slate-200 active:scale-95"
              >
                <Barcode className="w-5 h-5" />
              </button>
            )}

            <button
              onClick={handleExportCSV}
              title="Exportar CSV"
              className="h-10 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl flex items-center gap-1.5 border border-slate-200 transition"
            >
              <Download className="w-3.5 h-3.5 text-emerald-600" />
              <span>CSV</span>
            </button>

            <button
              onClick={() => setIsMasterModalOpen(true)}
              className="h-10 px-3 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-md shadow-violet-500/20 transition-all"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>+ Catálogo Maestro</span>
            </button>

            <button
              onClick={() => setIsCustomProductModal(true)}
              className="h-10 px-3.5 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nuevo Producto</span>
            </button>
          </div>
        </div>

        {/* Micro-Bento Estadísticas */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Productos Registrados</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900">{products.length}</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                ● En catálogo activo
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Categorías de {rubroConfig.badge}</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-blue-700">{categories.filter(c => c !== 'ALL').length}</span>
              <span className="text-[10px] text-slate-500 font-medium block mt-0.5 truncate">
                {rubroConfig.categorias.slice(0, 2).join(', ')}...
              </span>
            </div>
          </div>

          <div className="hidden sm:flex bg-slate-50 p-3 rounded-2xl border border-slate-200 flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Funciones Especiales</span>
            <div className="flex flex-wrap gap-1 mt-1.5">
              {rubroConfig.features.map(f => (
                <span key={f} className="text-[10px] font-bold bg-white text-slate-700 px-1.5 py-0.5 rounded-md border border-slate-200">
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Search Bar & Grid/List toggle */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={`Buscar en ${rubroConfig.nombre.toLowerCase()}...`}
              className="w-full h-11 pl-10 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-2xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-600 transition"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-slate-600 shrink-0">
            <button
              onClick={() => setIsGridView(true)}
              className={`p-2 rounded-lg transition ${isGridView ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
              title="Vista en cuadrícula"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setIsGridView(false)}
              className={`p-2 rounded-lg transition ${!isGridView ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'}`}
              title="Vista en lista"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`min-h-[32px] px-3 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat === 'ALL' ? `Todos (${products.length})` : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product List / Grid */}
      <div className="p-4">
        {isGridView ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filtered.map((prod) => {
              const venta = Number(prod.precio_venta) || 0;
              const compra = Number(prod.precio_compra) || (venta * 0.8);
              const isPeso = prod.tipo_venta === 'PESO';

              // Pharmacy expiry calculation
              let expiryAlert = null;
              if (prod.fecha_vencimiento) {
                const diffDays = Math.ceil((new Date(prod.fecha_vencimiento) - new Date()) / (1000 * 60 * 60 * 24));
                if (diffDays <= 30) {
                  expiryAlert = { text: `Vence en ${diffDays}d`, bg: 'bg-rose-100 text-rose-800 border-rose-300' };
                } else if (diffDays <= 90) {
                  expiryAlert = { text: `Vence en ${diffDays}d`, bg: 'bg-amber-100 text-amber-800 border-amber-300' };
                }
              }

              return (
                <div
                  key={prod.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-xs hover:border-blue-300 transition-all flex flex-col justify-between gap-3"
                >
                  <div className="flex items-start gap-3">
                    <div className="relative shrink-0">
                      <img
                        src={prod.foto_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                        alt={prod.nombre}
                        className="w-16 h-16 rounded-xl object-cover border border-slate-100"
                        onError={(e) => {
                          e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80';
                        }}
                      />
                      {isPeso && (
                        <span className="absolute -top-1.5 -left-1.5 bg-rose-600 text-white text-[8px] font-black px-1.5 py-0.5 rounded-full shadow-xs flex items-center gap-0.5">
                          <Scale className="w-2.5 h-2.5" /> Kg
                        </span>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <span className="text-[10px] font-extrabold uppercase text-blue-600 tracking-wider">
                        {prod.categoria}
                      </span>
                      <h3 className="font-extrabold text-xs text-slate-900 leading-snug truncate mt-0.5">
                        {prod.nombre}
                      </h3>
                      
                      {/* Sub-details by rubro */}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="font-mono text-[10px] text-slate-400">
                          SKU: {prod.codigo_barras || 'S/N'}
                        </span>

                        {prod.lote && (
                          <span className="text-[9px] bg-emerald-50 text-emerald-800 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                            Lote: {prod.lote}
                          </span>
                        )}

                        {expiryAlert && (
                          <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${expiryAlert.bg}`}>
                            {expiryAlert.text}
                          </span>
                        )}

                        {prod.tallas && prod.tallas.length > 0 && (
                          <span className="text-[9px] bg-violet-50 text-violet-700 font-bold px-1.5 py-0.2 rounded border border-violet-100 truncate max-w-[130px]">
                            Tallas: {prod.tallas.slice(0, 3).join(', ')}
                          </span>
                        )}

                        {prod.sabores && prod.sabores.length > 0 && (
                          <span className="text-[9px] bg-cyan-50 text-cyan-700 font-bold px-1.5 py-0.2 rounded border border-cyan-100">
                            {prod.sabores.length} Sabores
                          </span>
                        )}
                      </div>

                      <div className="flex items-baseline gap-1.5 mt-1.5">
                        <span className="text-base font-black text-blue-600">
                          Bs. {venta.toFixed(2)}
                          {isPeso && <span className="text-[10px] font-normal text-slate-500"> / Kg</span>}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">
                          | Costo: Bs. {compra.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions Footer */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Stock: <strong className="text-slate-900">{prod.stock_actual || 0} {isPeso ? 'Kg' : (prod.unidad_medida || 'uds')}</strong>
                    </span>

                    <div className="flex items-center gap-1.5">
                      {onSelectSubView && (
                        <button
                          onClick={() => onSelectSubView('inventory')}
                          className="px-2 py-1 bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[10px] font-bold rounded-lg transition"
                          title="Ver en Kardex e Inventario"
                        >
                          Kardex
                        </button>
                      )}
                      <button
                        onClick={(e) => handleOpenEdit(prod, e)}
                        className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                        title="Editar"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => handleDeleteProduct(prod, e)}
                        className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-400 hover:text-rose-600 rounded-lg transition"
                        title="Eliminar"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden divide-y divide-slate-100">
            {filtered.map((prod) => {
              const venta = Number(prod.precio_venta) || 0;
              const compra = Number(prod.precio_compra) || (venta * 0.8);
              const isPeso = prod.tipo_venta === 'PESO';

              return (
                <div
                  key={prod.id}
                  className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={prod.foto_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=400&q=80'}
                      alt={prod.nombre}
                      className="w-11 h-11 rounded-xl object-cover border border-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[10px] font-bold text-blue-600 uppercase">
                          {prod.categoria}
                        </span>
                        {isPeso && (
                          <span className="text-[9px] bg-rose-50 text-rose-700 font-bold px-1 rounded border border-rose-200">
                            Balanza
                          </span>
                        )}
                        <span className="font-mono text-[10px] text-slate-400">
                          {prod.codigo_barras || 'S/N'}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-xs text-slate-900 truncate mt-0.5">
                        {prod.nombre}
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Costo: Bs. {compra.toFixed(2)} • Stock: {prod.stock_actual} {isPeso ? 'Kg' : (prod.unidad_medida || 'uds')}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="text-sm font-black text-blue-600">
                      Bs. {venta.toFixed(2)}
                      {isPeso && <span className="text-[10px] font-normal text-slate-400">/Kg</span>}
                    </span>
                    <button
                      onClick={(e) => handleOpenEdit(prod, e)}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-lg transition"
                      title="Editar"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Package className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-800">No se encontraron productos</p>
            <p className="text-xs text-slate-400">Prueba con otra búsqueda o agrega desde el Catálogo Maestro.</p>
          </div>
        )}
      </div>

      {/* Modal: Editar Producto Adaptativo */}
      {isEditProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsEditProductModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <form 
            onSubmit={handleSaveEditProduct}
            className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3.5 max-h-[92vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <RubroIcon className="w-4 h-4 text-blue-600" />
                <h3 className="font-extrabold text-slate-900 text-sm">Editar Producto ({rubroConfig.badge})</h3>
              </div>
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
                Nombre del Producto *
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
                <select
                  value={editForm.categoria}
                  onChange={(e) => setEditForm({ ...editForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {rubroConfig.categorias.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                  <option value="Otros">Otros</option>
                </select>
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

            {/* Farmacia Specific Fields in Edit */}
            {activeRubro === 'FARMACIA' && (
              <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-2xl space-y-2.5">
                <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-bold">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Control de Lote y Farmacia</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 block mb-0.5">Principio Activo</label>
                    <input
                      type="text"
                      value={editForm.principio_activo || ''}
                      onChange={(e) => setEditForm({ ...editForm, principio_activo: e.target.value })}
                      placeholder="Ej: Paracetamol 500mg"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 block mb-0.5">N° de Lote</label>
                    <input
                      type="text"
                      value={editForm.lote || ''}
                      onChange={(e) => setEditForm({ ...editForm, lote: e.target.value })}
                      placeholder="Ej: L-24901B"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 block mb-0.5">Fecha de Vencimiento</label>
                  <input
                    type="date"
                    value={editForm.fecha_vencimiento || ''}
                    onChange={(e) => setEditForm({ ...editForm, fecha_vencimiento: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* Carniceria Specific Fields in Edit */}
            {activeRubro === 'CARNICERIA' && (
              <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-2xl space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-rose-900 text-xs font-bold">
                    <Beef className="w-3.5 h-3.5 text-rose-600" />
                    <span>Tipo de Venta (Balanza)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={editForm.tipo_venta === 'PESO'}
                        onChange={() => setEditForm({ ...editForm, tipo_venta: 'PESO', unidad_medida: 'Kg' })}
                      />
                      <span>Por Kilo (Balanza)</span>
                    </label>
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1 cursor-pointer">
                      <input
                        type="radio"
                        checked={editForm.tipo_venta !== 'PESO'}
                        onChange={() => setEditForm({ ...editForm, tipo_venta: 'UNIDAD', unidad_medida: 'Unidad' })}
                      />
                      <span>Por Unidad</span>
                    </label>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Precio Venta (Bs.) {editForm.tipo_venta === 'PESO' ? '/ Kg' : ''} *
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
                  Stock Actual {editForm.tipo_venta === 'PESO' ? '(Kg)' : ''}
                </label>
                <input
                  type="number"
                  step="any"
                  value={editForm.stock_actual}
                  onChange={(e) => setEditForm({ ...editForm, stock_actual: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={editForm.unidad_medida}
                  onChange={(e) => setEditForm({ ...editForm, unidad_medida: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {rubroConfig.unidades_sugeridas.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
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

      {/* Modal: Catálogo Maestro Global de Bolivia */}
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
                  Selecciona un producto comercial y asígnale tu precio
                </p>
              </div>
              <button
                onClick={() => setIsMasterModalOpen(false)}
                className="p-1.5 text-white/80 hover:text-white rounded-full hover:bg-white/10"
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
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Guardar en mi Tienda</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Crear Producto Propio (Adaptativo por Rubro) */}
      {isCustomProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsCustomProductModal(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <form 
            onSubmit={handleCreateCustom}
            className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3.5 max-h-[92vh] overflow-y-auto"
          >
            {/* Rubro Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                  <RubroIcon className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Nuevo Producto • {rubroConfig.nombre}</h3>
                  <span className="text-[10px] text-slate-400 font-medium">{rubroConfig.badge}</span>
                </div>
              </div>
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
                placeholder={
                  activeRubro === 'FARMACIA' ? 'Ej: Ibuprofeno 400mg' :
                  activeRubro === 'ROPA' ? 'Ej: Polera Polo Piqué' :
                  activeRubro === 'CARNICERIA' ? 'Ej: Lomo Fino de Res' :
                  activeRubro === 'HELADERIA' ? 'Ej: Cono 2 Bolas Artesanal' :
                  activeRubro === 'FERRETERIA' ? 'Ej: Cemento Viacha 50kg' :
                  'Ej: Coca-Cola 2L'
                }
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Categoría ({rubroConfig.badge})
                </label>
                <select
                  value={customForm.categoria}
                  onChange={(e) => setCustomForm({ ...customForm, categoria: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {rubroConfig.categorias.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="General / Otros">General / Otros</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Código de Barras / SKU (Opcional)
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

            {/* FARMACIA: Campos de Lote y Vencimiento */}
            {activeRubro === 'FARMACIA' && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-emerald-900 text-xs font-extrabold">
                  <Pill className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Control Farmacéutico (Lotes & Fechas)</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 block mb-0.5">Principio Activo</label>
                    <input
                      type="text"
                      value={customForm.principio_activo}
                      onChange={(e) => setCustomForm({ ...customForm, principio_activo: e.target.value })}
                      placeholder="Ej: Amoxicilina 500mg"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-emerald-900 block mb-0.5">N° de Lote</label>
                    <input
                      type="text"
                      value={customForm.lote}
                      onChange={(e) => setCustomForm({ ...customForm, lote: e.target.value })}
                      placeholder="Ej: L-98124"
                      className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-mono"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-emerald-900 block mb-0.5">Fecha de Vencimiento *</label>
                  <input
                    type="date"
                    value={customForm.fecha_vencimiento}
                    onChange={(e) => setCustomForm({ ...customForm, fecha_vencimiento: e.target.value })}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs"
                  />
                </div>
              </div>
            )}

            {/* ROPA: Selector de Tallas y Colores */}
            {activeRubro === 'ROPA' && (
              <div className="p-3 bg-violet-50/70 border border-violet-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-violet-900 text-xs font-extrabold">
                  <Shirt className="w-3.5 h-3.5 text-violet-600" />
                  <span>Tallas y Colores Disponibles</span>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-violet-900 block mb-1">Selecciona las Tallas:</label>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_SIZES.map(s => {
                      const isSelected = customForm.tallas?.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => toggleArrayItem(
                            (list) => setCustomForm({ ...customForm, tallas: list }),
                            customForm.tallas || [],
                            s
                          )}
                          className={`min-w-[32px] py-1 px-2 rounded-lg text-xs font-bold font-mono transition ${
                            isSelected ? 'bg-violet-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-violet-200 hover:bg-violet-100'
                          }`}
                        >
                          {s}
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-violet-900 block mb-1">Colores Disponibles:</label>
                  <div className="flex flex-wrap gap-1">
                    {COMMON_COLORS.map(c => {
                      const isSelected = customForm.colores?.includes(c);
                      return (
                        <button
                          key={c}
                          type="button"
                          onClick={() => toggleArrayItem(
                            (list) => setCustomForm({ ...customForm, colores: list }),
                            customForm.colores || [],
                            c
                          )}
                          className={`py-1 px-2.5 rounded-lg text-xs font-bold transition ${
                            isSelected ? 'bg-slate-900 text-white shadow-2xs' : 'bg-white text-slate-700 border border-violet-200 hover:bg-violet-100'
                          }`}
                        >
                          {c}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* CARNICERIA: Venta al Peso vs Unidad */}
            {activeRubro === 'CARNICERIA' && (
              <div className="p-3 bg-rose-50/70 border border-rose-200 rounded-2xl space-y-2 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-rose-900 text-xs font-extrabold">
                  <Beef className="w-3.5 h-3.5 text-rose-600" />
                  <span>Modalidad de Venta al Peso</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setCustomForm({ ...customForm, tipo_venta: 'PESO', unidad_medida: 'Kg' })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                      customForm.tipo_venta === 'PESO' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-rose-200'
                    }`}
                  >
                    <Scale className="w-4 h-4" />
                    <span>Venta al Peso (Balanza Kg)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setCustomForm({ ...customForm, tipo_venta: 'UNIDAD', unidad_medida: 'Unidad' })}
                    className={`py-2 px-3 rounded-xl text-xs font-extrabold flex items-center justify-center gap-1.5 transition ${
                      customForm.tipo_venta !== 'PESO' 
                        ? 'bg-rose-600 text-white shadow-xs' 
                        : 'bg-white text-slate-700 border border-rose-200'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Por Pieza / Unidad</span>
                  </button>
                </div>
              </div>
            )}

            {/* HELADERIA: Sabores & Toppings */}
            {activeRubro === 'HELADERIA' && (
              <div className="p-3 bg-cyan-50/70 border border-cyan-200 rounded-2xl space-y-2.5 animate-fadeIn">
                <div className="flex items-center gap-1.5 text-cyan-900 text-xs font-extrabold">
                  <IceCream className="w-3.5 h-3.5 text-cyan-600" />
                  <span>Sabores de Helado Disponibles</span>
                </div>
                <div className="flex flex-wrap gap-1">
                  {COMMON_FLAVORS.map(f => {
                    const isSelected = customForm.sabores?.includes(f);
                    return (
                      <button
                        key={f}
                        type="button"
                        onClick={() => toggleArrayItem(
                          (list) => setCustomForm({ ...customForm, sabores: list }),
                          customForm.sabores || [],
                          f
                        )}
                        className={`py-1 px-2.5 rounded-lg text-xs font-bold transition ${
                          isSelected ? 'bg-cyan-600 text-white shadow-2xs' : 'bg-white text-slate-700 border border-cyan-200 hover:bg-cyan-100'
                        }`}
                      >
                        {f}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Pricing & Stock Fields */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Precio Venta (Bs.) {customForm.tipo_venta === 'PESO' ? '/ Kg' : ''} *
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
                  Stock Inicial {customForm.tipo_venta === 'PESO' ? '(Kg)' : ''}
                </label>
                <input
                  type="number"
                  step="any"
                  value={customForm.stock_actual}
                  onChange={(e) => setCustomForm({ ...customForm, stock_actual: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-bold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Unidad de Medida
                </label>
                <select
                  value={customForm.unidad_medida}
                  onChange={(e) => setCustomForm({ ...customForm, unidad_medida: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold bg-white"
                >
                  {rubroConfig.unidades_sugeridas.map(u => (
                    <option key={u} value={u}>{u}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Guardar Producto en {rubroConfig.nombre}</span>
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
