import React, { useState, useEffect } from 'react';
import { 
  Tag, Search, Plus, Edit2, Trash2, CheckCircle2, 
  Layers, Sparkles, X, ChevronRight, Bookmark, Boxes
} from 'lucide-react';
import { db } from '../../db/dexie';
import { RUBROS_CONFIG } from '../../db/rubros';
import ProductsSubNav from './ProductsSubNav';

const DEFAULT_MARCAS = [
  'Coca-Cola', 'Nestlé', 'Pil Andina', 'Arcor', 'Fagal', 
  'PepsiCo', 'Unilever', 'Colgate-Palmolive', 'Gloria', 'Bimbo'
];

export default function CategoriasMarcasView({ currentRubro = 'ABARROTES', onSelectSubView }) {
  const [activeTab, setActiveTab] = useState('categorias'); // 'categorias' | 'marcas'
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState([]);
  const [marcas, setMarcas] = useState([]);
  const [productCounts, setProductCounts] = useState({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formName, setFormName] = useState('');
  const [formStatus, setFormStatus] = useState('Activo');

  const rubroConfig = RUBROS_CONFIG[currentRubro] || RUBROS_CONFIG.ABARROTES;

  const loadData = async () => {
    // 1. Obtener productos para contar cantidades por categoría
    const prods = await db.productos_tienda.toArray();
    const counts = {};
    prods.forEach(p => {
      const cat = p.categoria || 'Sin Categoría';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    setProductCounts(counts);

    // 2. Cargar categorías de LocalStorage o del rubro por defecto
    const savedCats = localStorage.getItem('glorypos_categorias');
    if (savedCats) {
      try {
        setCategories(JSON.parse(savedCats));
      } catch (e) {
        setCategories(rubroConfig.categorias.map(c => ({ id: c, nombre: c, estado: 'Activo' })));
      }
    } else {
      const initCats = rubroConfig.categorias.map(c => ({ id: c, nombre: c, estado: 'Activo' }));
      setCategories(initCats);
      localStorage.setItem('glorypos_categorias', JSON.stringify(initCats));
    }

    // 3. Cargar marcas de LocalStorage o por defecto
    const savedMarcas = localStorage.getItem('glorypos_marcas');
    if (savedMarcas) {
      try {
        setMarcas(JSON.parse(savedMarcas));
      } catch (e) {
        setMarcas(DEFAULT_MARCAS.map(m => ({ id: m, nombre: m, estado: 'Activo' })));
      }
    } else {
      const initMarcas = DEFAULT_MARCAS.map(m => ({ id: m, nombre: m, estado: 'Activo' }));
      setMarcas(initMarcas);
      localStorage.setItem('glorypos_marcas', JSON.stringify(initMarcas));
    }
  };

  useEffect(() => {
    loadData();
  }, [currentRubro]);

  const handleSave = (e) => {
    e.preventDefault();
    if (!formName.trim()) return;

    if (activeTab === 'categorias') {
      let updated;
      if (editingItem) {
        updated = categories.map(c => c.id === editingItem.id ? { ...c, nombre: formName.trim(), estado: formStatus } : c);
      } else {
        updated = [{ id: `cat-${Date.now()}`, nombre: formName.trim(), estado: formStatus }, ...categories];
      }
      setCategories(updated);
      localStorage.setItem('glorypos_categorias', JSON.stringify(updated));
    } else {
      let updated;
      if (editingItem) {
        updated = marcas.map(m => m.id === editingItem.id ? { ...m, nombre: formName.trim(), estado: formStatus } : m);
      } else {
        updated = [{ id: `mrc-${Date.now()}`, nombre: formName.trim(), estado: formStatus }, ...marcas];
      }
      setMarcas(updated);
      localStorage.setItem('glorypos_marcas', JSON.stringify(updated));
    }

    setIsModalOpen(false);
    setEditingItem(null);
    setFormName('');
  };

  const handleDelete = (item) => {
    if (!window.confirm(`¿Estás seguro de eliminar "${item.nombre}"?`)) return;

    if (activeTab === 'categorias') {
      const updated = categories.filter(c => c.id !== item.id);
      setCategories(updated);
      localStorage.setItem('glorypos_categorias', JSON.stringify(updated));
    } else {
      const updated = marcas.filter(m => m.id !== item.id);
      setMarcas(updated);
      localStorage.setItem('glorypos_marcas', JSON.stringify(updated));
    }
  };

  const openNew = () => {
    setEditingItem(null);
    setFormName('');
    setFormStatus('Activo');
    setIsModalOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setFormName(item.nombre);
    setFormStatus(item.estado || 'Activo');
    setIsModalOpen(true);
  };

  const listToRender = activeTab === 'categorias' ? categories : marcas;
  const filteredList = listToRender.filter(i => 
    i.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Sub-navegación de Productos */}
      <ProductsSubNav currentSubView="categorias_marcas" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Layers className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Mis Categorías y Marcas
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Organiza tu catálogo para una búsqueda rápida en el punto de venta móvil y web
            </p>
          </div>

          <button
            type="button"
            onClick={openNew}
            className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shadow-blue-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva {activeTab === 'categorias' ? 'Categoría' : 'Marca'}</span>
          </button>
        </div>

        {/* Tab Switcher & Search Bar (Exact Style from Screen 2 in Mobile Showcase) */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            
            {/* Tabs: Categorías / Marcas */}
            <div className="flex items-center p-1 bg-slate-100 rounded-xl max-w-xs w-full sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab('categorias')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'categorias'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Categorías ({categories.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('marcas')}
                className={`flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'marcas'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                Marcas ({marcas.length})
              </button>
            </div>

            {/* Input de Búsqueda */}
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={`Buscar ${activeTab === 'categorias' ? 'categoría' : 'marca'}...`}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none transition"
              />
            </div>

          </div>
        </div>

        {/* Items Grid / List (Mobile Card Style with status pill and actions) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filteredList.map((item) => {
            const count = activeTab === 'categorias' ? (productCounts[item.nombre] || 0) : 0;
            return (
              <div 
                key={item.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-500 flex items-center justify-center font-bold text-sm shrink-0 transition-colors">
                    {activeTab === 'categorias' ? <Tag className="w-5 h-5" /> : <Bookmark className="w-5 h-5" />}
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-slate-900 text-sm truncate">{item.nombre}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      {activeTab === 'categorias' && (
                        <span className="text-[11px] text-slate-500 font-medium">
                          {count} {count === 1 ? 'producto' : 'productos'}
                        </span>
                      )}
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <span className="w-1 h-1 rounded-full bg-emerald-500"></span>
                        {item.estado || 'Activo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0 ml-2">
                  <button
                    type="button"
                    onClick={() => openEdit(item)}
                    title="Editar"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(item)}
                    title="Eliminar"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filteredList.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Layers className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No se encontraron {activeTab}</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Crea una nueva con el botón superior.</p>
            </div>
          )}
        </div>

      </main>

      {/* Modal Crear / Editar */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">
                {editingItem ? `Editar ${activeTab === 'categorias' ? 'Categoría' : 'Marca'}` : `Nueva ${activeTab === 'categorias' ? 'Categoría' : 'Marca'}`}
              </h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre *</label>
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder={`Ej. ${activeTab === 'categorias' ? 'Bebidas Energéticas' : 'Coca-Cola'}`}
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estado</label>
                <select
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none font-semibold"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition shadow-md shadow-blue-600/20"
                >
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
