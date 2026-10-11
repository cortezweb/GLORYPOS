import React, { useState, useEffect } from 'react';
import { db } from '../../db/dexie';
import ProductCard from './ProductCard';
import { Search, ScanBarcode, LayoutGrid, List, Package, Sparkles, X, ChevronLeft, ChevronRight } from 'lucide-react';
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

  // Paginación UX para catálogo POS
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(15);

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

  // Ref y estados para desplazamiento horizontal táctil y con botones de categorías
  const categoriesRef = React.useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);
  const [hasDragged, setHasDragged] = useState(false);

  const checkScroll = React.useCallback(() => {
    if (categoriesRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = categoriesRef.current;
      setCanScrollLeft(scrollLeft > 4);
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 4);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(checkScroll, 120);
    window.addEventListener('resize', checkScroll);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', checkScroll);
    };
  }, [categories, checkScroll]);

  const handleScrollCategories = (direction) => {
    if (categoriesRef.current) {
      const amount = direction === 'left' ? -220 : 220;
      categoriesRef.current.scrollBy({ left: amount, behavior: 'smooth' });
      setTimeout(checkScroll, 350);
    }
  };

  const handleCategoryWheel = (e) => {
    if (categoriesRef.current && e.deltaY !== 0) {
      categoriesRef.current.scrollLeft += e.deltaY;
      checkScroll();
    }
  };

  const handleMouseDown = (e) => {
    if (!categoriesRef.current) return;
    setIsDragging(true);
    setHasDragged(false);
    setStartX(e.pageX - categoriesRef.current.offsetLeft);
    setScrollLeftState(categoriesRef.current.scrollLeft);
  };

  const handleMouseMove = (e) => {
    if (!isDragging || !categoriesRef.current) return;
    const x = e.pageX - categoriesRef.current.offsetLeft;
    if (Math.abs(x - startX) > 4) {
      setHasDragged(true);
    }
    e.preventDefault();
    const walk = (x - startX) * 1.5;
    categoriesRef.current.scrollLeft = scrollLeftState - walk;
    checkScroll();
  };

  const handleMouseUpOrLeave = () => {
    setIsDragging(false);
    setTimeout(() => setHasDragged(false), 50);
    checkScroll();
  };

  const filtered = products.filter(p => {
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = p.nombre.toLowerCase().includes(term) ||
                          p.codigo_barras?.includes(term);
    const matchesCategory = selectedCategory === 'Todos' || p.categoria === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Reset page when category or search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedCategory, searchTerm]);

  const totalPages = Math.max(1, itemsPerPage === 'Todos' ? 1 : Math.ceil(filtered.length / itemsPerPage));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [totalPages, currentPage]);

  const paginatedProducts = React.useMemo(() => {
    if (itemsPerPage === 'Todos') return filtered;
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [filtered, currentPage, itemsPerPage]);

  const startIndex = filtered.length === 0 ? 0 : (currentPage - 1) * (itemsPerPage === 'Todos' ? filtered.length : itemsPerPage) + 1;
  const endIndex = itemsPerPage === 'Todos' ? filtered.length : Math.min(currentPage * itemsPerPage, filtered.length);

  const getPageNumbers = () => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const pages = [];
    if (currentPage <= 3) {
      pages.push(1, 2, 3, 4, '...', totalPages);
    } else if (currentPage >= totalPages - 2) {
      pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
      pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
    }
    return pages;
  };

  return (
    <main className="flex-1 flex flex-col h-full min-h-0 bg-slate-50 overflow-hidden">
      {/* ── BARRA SUPERIOR FIJA: SubNav, Buscador y Categorías ── */}
      <div className="shrink-0 bg-white border-b border-gray-100 z-10 shadow-xs">
        {/* Sales Sub-navigation Bar */}
        {onSelectSubView && (
          <SalesSubNav currentSubView="pos" onSelectSubView={onSelectSubView} />
        )}

        {/* Search and Toolbar (Exact Stitch Design) */}
        <section className="p-2.5 sm:p-3" data-purpose="search-bar-section">
          <div className="flex items-center space-x-2">
            {/* Search Input Box */}
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                <Search className="w-4 h-4" />
              </div>
              <input 
                value={searchTerm || ''}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-14 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-700 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#FF6B35] focus:border-[#FF6B35] transition" 
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
                className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-gray-400 hover:text-[#FF6B35] transition" 
                type="button"
              >
                <ScanBarcode className="w-4 h-4" />
              </button>
            </div>

            {/* Quick Toggle Grid/List Display */}
            <div className="flex items-center bg-gray-100 p-0.5 rounded-lg border border-gray-200 text-gray-500 shrink-0">
              <button 
                onClick={() => setIsGridView(true)}
                className={`p-1.5 rounded-md transition shadow-xs ${isGridView ? 'bg-white text-[#FF6B35]' : 'hover:text-gray-700'}`} 
                title="Vista en cuadrícula"
                type="button"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setIsGridView(false)}
                className={`p-1.5 rounded-md transition ${!isGridView ? 'bg-white text-[#FF6B35] shadow-xs' : 'hover:text-gray-700'}`} 
                title="Vista en lista"
                type="button"
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </section>

        {/* Category Tabs (Con flechas de navegación, arrastre y scroll de rueda) */}
        <div className="relative flex items-center bg-white border-t border-gray-100 group">
          {/* Botón flecha izquierda */}
          {canScrollLeft && (
            <button
              type="button"
              onClick={() => handleScrollCategories('left')}
              className="absolute left-1 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#FF6B35] shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
              title="Ver categorías anteriores"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          )}

          {/* Sombra difuminada izquierda */}
          {canScrollLeft && (
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-white via-white/80 to-transparent pointer-events-none z-10" />
          )}

          <nav
            ref={categoriesRef}
            onScroll={checkScroll}
            onWheel={handleCategoryWheel}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUpOrLeave}
            onMouseLeave={handleMouseUpOrLeave}
            className={`py-2 px-3 overflow-x-auto no-scrollbar flex space-x-1.5 text-xs select-none w-full scroll-smooth ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
            data-purpose="category-pills"
          >
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => {
                    if (!hasDragged) {
                      setSelectedCategory(cat);
                    }
                  }}
                  className={`px-3.5 py-1.5 rounded-full font-semibold whitespace-nowrap transition text-xs shrink-0 ${
                    isSelected
                      ? 'bg-[#FF6B35] text-white shadow-xs'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  {cat}
                </button>
              );
            })}
          </nav>

          {/* Sombra difuminada derecha */}
          {canScrollRight && (
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-r from-transparent via-white/80 to-white pointer-events-none z-10" />
          )}

          {/* Botón flecha derecha */}
          {canScrollRight && (
            <button
              type="button"
              onClick={() => handleScrollCategories('right')}
              className="absolute right-1 z-20 w-7 h-7 rounded-full bg-white/95 hover:bg-white text-slate-700 hover:text-[#FF6B35] shadow-md border border-slate-200 flex items-center justify-center transition active:scale-95"
              title="Ver más categorías"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* ── ÁREA CENTRAL DE PRODUCTOS CON SCROLL INTERNO ── */}
      <div className="flex-1 overflow-y-auto p-3 min-h-0 bg-slate-50/70" data-purpose="pos-product-grid">
        <div className="flex items-center justify-between mb-2 px-1">
          <span className="text-xs font-semibold text-gray-700">
            {selectedCategory === 'Todos' ? 'Catálogo General' : selectedCategory}
          </span>
          <span className="text-[11px] text-[#FF6B35] font-semibold bg-[#FF6B35]/10 px-2 py-0.5 rounded-md border border-[#FF6B35]/20">
            {filtered.length} {filtered.length === 1 ? 'Artículo' : 'Artículos'}
          </span>
        </div>

        {/* Responsive POS Grid */}
        {filtered.length > 0 ? (
          <div className={isGridView ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3" : "space-y-2"}>
            {paginatedProducts.map((prod) => (
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
              className="px-4 py-2 bg-[#FF6B35] text-white font-bold text-xs rounded-xl shadow-xs hover:bg-[#FF6B35]/90 transition flex items-center gap-1.5 mx-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              <span>Abrir Catálogo Maestro</span>
            </button>
          </div>
        )}
      </div>

      {/* ── BARRA INFERIOR DE PAGINACIÓN Y BOTONES FIJOS ── */}
      {filtered.length > 0 && (
        <footer className="shrink-0 bg-white border-t border-slate-200 px-3 py-2 sm:px-4 sm:py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs z-10 select-none">
          {/* Indicador de productos mostrados */}
          <div className="text-[11px] sm:text-xs text-slate-500 font-medium">
            Mostrando <span className="font-bold text-slate-700">{startIndex}</span> a <span className="font-bold text-slate-700">{endIndex}</span> de <span className="font-bold text-slate-800">{filtered.length}</span>
          </div>

          {/* Botones de Páginas */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-semibold flex items-center gap-1"
              title="Página anterior"
              type="button"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Ant.</span>
            </button>

            {totalPages > 1 && getPageNumbers().map((p, idx) => {
              if (p === '...') {
                return (
                  <span key={`dots-${idx}`} className="px-1 text-xs text-slate-400 select-none">
                    ...
                  </span>
                );
              }
              const isActive = currentPage === p;
              return (
                <button
                  key={p}
                  onClick={() => setCurrentPage(p)}
                  className={`min-w-[28px] sm:min-w-[32px] h-7 sm:h-8 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                    isActive
                      ? 'bg-[#FF6B35] text-white shadow-xs'
                      : 'border border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                  type="button"
                >
                  {p}
                </button>
              );
            })}

            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 disabled:opacity-30 disabled:hover:bg-transparent transition text-xs font-semibold flex items-center gap-1"
              title="Página siguiente"
              type="button"
            >
              <span className="hidden sm:inline">Sig.</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Selector de Items por Página */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span className="hidden md:inline text-[11px]">Por pág:</span>
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-semibold">
              {[15, 25, 40, 'Todos'].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    setItemsPerPage(num);
                    setCurrentPage(1);
                  }}
                  className={`px-2 py-0.5 rounded-md transition ${
                    itemsPerPage === num
                      ? 'bg-white text-[#FF6B35] font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </footer>
      )}
    </main>
  );
}
