import React, { useState, useEffect } from 'react';
import { db } from '../../db/dexie';
import ProductCard from './ProductCard';
import { Search, ScanBarcode, LayoutGrid, List, Package, Sparkles, X } from 'lucide-react';
import SalesSubNav from '../Sales/SalesSubNav';

export default function PosView({ 
  searchTerm, 
  setSearchTerm, 
  onOpenScanner, 
  onOpenVariants, 
  onOpenScale,
  onOpenModifiers,
  onOpenInventory,
  onSelectSubView
}) {
  const [products, setProducts] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isGridView, setIsGridView] = useState(true);
  const [loading, setLoading] = useState(true);

  const loadProducts = async () => {
    const list = await db.productos_tienda.toArray();
    setProducts(list);
    setLoading(false);
  };

  useEffect(() => {
    loadProducts();
  }, []);

  // Compute dynamic categories based on loaded products
  const categories = React.useMemo(() => {
    const set = new Set(products.map(p => p.categoria).filter(Boolean));
    return ['Todos', ...Array.from(set)];
  }, [products]);

  const filtered = products.filter(p => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = p.nombre.toLowerCase().includes(term) ||
                          p.codigo_barras?.includes(term);
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <main className="flex-1 overflow-y-auto pb-24">
      {/* Sales Sub-navigation Bar */}
      {onSelectSubView && (
        <SalesSubNav currentSubView="pos" onSelectSubView={onSelectSubView} />
      )}

      {/* Search and Toolbar (Exact Stitch Design) */}
      <section className="p-3 bg-white border-b border-gray-100 shadow-xs" data-purpose="search-bar-section">
        <div className="flex items-center space-x-2">
          {/* Search Input Box */}
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
              <Search className="w-4 h-4" />
            </div>
            <input 
              value={searchTerm || ''}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-14 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition" 
              placeholder="Buscar producto o código..." 
              type="search"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                aria-label="Borrar búsqueda"
                className="absolute inset-y-0 right-7 pr-1 flex items-center text-gray-400 hover:text-gray-700 transition" 
                type="button"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button 
              onClick={onOpenScanner}
              aria-label="Escanear Código de Barras" 
              className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-blue-600 transition" 
              type="button"
            >
              <ScanBarcode className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Toggle Grid/List Display */}
          <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-gray-500">
            <button 
              onClick={() => setIsGridView(true)}
              className={`p-1.5 rounded-md transition shadow-xs ${isGridView ? 'bg-white text-blue-600' : 'hover:text-gray-700'}`} 
              title="Vista en cuadrícula"
              type="button"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button 
              onClick={() => setIsGridView(false)}
              className={`p-1.5 rounded-md transition ${!isGridView ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-gray-700'}`} 
              title="Vista en lista"
              type="button"
            >
              <List className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* Category Tabs (Exact Stitch Pill bar) */}
      <nav className="py-2.5 px-3 bg-white border-b border-gray-200 overflow-x-auto no-scrollbar flex space-x-2 text-xs" data-purpose="category-pills">
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat;
          return (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition ${
                isSelected
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              type="button"
            >
              {cat}
            </button>
          );
        })}
      </nav>

      {/* Product Catalog Header */}
      <section className="p-3" data-purpose="pos-product-grid">
        <div className="flex items-center justify-between mb-2.5 px-1">
          <span className="text-xs font-semibold text-gray-600">
            {selectedCategory === 'Todos' ? 'Catálogo General' : selectedCategory}
          </span>
          <span className="text-[11px] text-blue-700 font-medium bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100">
            {filtered.length} {filtered.length === 1 ? 'Artículo' : 'Artículos'}
          </span>
        </div>

        {/* Responsive POS Grid (Mobile 2-col, Tablet 3-col, Desktop 4-5 col) */}
        {filtered.length > 0 ? (
          <div className={isGridView ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3" : "space-y-2"}>
            {filtered.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenVariants={onOpenVariants}
                onOpenScale={onOpenScale}
                onOpenModifiers={onOpenModifiers}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 space-y-3">
            <Package className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No encontramos ese producto</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto">
              Puedes agregarlo al instante desde el Catálogo Maestro precargado de Bolivia.
            </p>
            <button
              onClick={onOpenInventory}
              className="px-4 py-2 bg-blue-600 text-white font-bold text-xs rounded-xl shadow-xs hover:bg-blue-700 transition flex items-center gap-1.5 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Abrir Catálogo Maestro</span>
            </button>
          </div>
        )}
      </section>
    </main>
  );
}
