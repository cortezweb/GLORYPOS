import React, { useState, useEffect } from 'react';
import { 
  Globe, ShoppingBag, ExternalLink, Share2, Eye, 
  Smartphone, QrCode, CheckCircle2, Search, ArrowRight,
  Check, X, Copy, Printer, Download, MessageSquare, Store,
  Layers, Package, ChevronRight, RefreshCw
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import PedidosWebView from '../Sales/PedidosWebView';

export default function TiendaVirtualView({ initialTab = 'catalogo', onSelectView, onOpenPosWithCart }) {
  const { empresa } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab); // 'catalogo' | 'pedidos'
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [onlyActive, setOnlyActive] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [pedidosCount, setPedidosCount] = useState({ total: 13, nuevos: 12 });

  // Cargar productos de Dexie
  useEffect(() => {
    const loadProducts = async () => {
      try {
        let list = await db.productos_tienda.toArray();
        if (!list || list.length === 0) {
          list = await db.productos.toArray();
        }
        setProducts(list || []);
      } catch (err) {
        console.error('Error cargando productos de tienda:', err);
      }
    };
    loadProducts();
  }, []);

  // Cargar conteo de pedidos web
  useEffect(() => {
    const saved = localStorage.getItem('glorypos_pedidos_web_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) {
          const nuevos = parsed.filter(p => p.estado === 'Nuevo').length;
          setPedidosCount({ total: parsed.length, nuevos });
        }
      } catch (e) {
        // fallback
      }
    }
  }, [activeTab]);

  const storeSlug = empresa?.nit_ci || 'demo';
  const storeUrl = `https://glorypos.bo/catalogo/${storeSlug}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  const handleToggleProduct = async (prodId, currentVal) => {
    const updated = products.map(p => p.id === prodId ? { ...p, activo: !currentVal } : p);
    setProducts(updated);
    try {
      await db.productos_tienda.update(prodId, { activo: !currentVal });
    } catch (e) {
      // ignore
    }
  };

  // Categorías únicas
  const categories = ['TODAS', ...Array.from(new Set(products.map(p => p.categoria).filter(Boolean)))];

  const filteredProducts = products.filter(p => {
    const matchesSearch = 
      p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.categoria?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.codigo_barras?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'TODAS' || p.categoria === selectedCategory;
    const matchesActive = !onlyActive || p.activo !== false;
    return matchesSearch && matchesCat && matchesActive;
  });

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14">
      
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* BARRA SUPERIOR DE PESTAÑAS (Catálogo Online Web / Pedidos Web)     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-2.5">
          
          {/* Tabs Selector */}
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => setActiveTab('catalogo')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'catalogo'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Globe className="w-4 h-4" />
              <span>Catálogo Online Web</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'catalogo' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                {products.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pedidos'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pedidos Web</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                activeTab === 'pedidos' 
                  ? 'bg-white text-emerald-700' 
                  : 'bg-emerald-100 text-emerald-800 animate-pulse'
              }`}>
                {pedidosCount.nuevos > 0 ? `${pedidosCount.nuevos} Nuevos` : pedidosCount.total}
              </span>
            </button>
          </div>

          {/* Quick Actions Header */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200"
              title="Generar código QR del catálogo"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
              <span>Código QR</span>
            </button>

            <button
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span>Compartir</span>
                </>
              )}
            </button>

            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Ver Catálogo</span>
            </a>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* VISTA SEGÚN PESTAÑA ACTIVA                                         */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'pedidos' ? (
        <PedidosWebView 
          hideSubNav={true} 
          onOpenPosWithCart={onOpenPosWithCart}
          onSelectSubView={onSelectView}
        />
      ) : (
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-5">
          
          {/* ── 1. BANNER HERO DE TIENDA VIRTUAL ── */}
          <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-violet-700 rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="relative z-10 max-w-2xl">
              <div className="inline-flex items-center space-x-2 bg-white/15 backdrop-blur-md px-3 py-1 rounded-full text-blue-100 border border-white/20 mb-3">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span className="text-[11px] font-bold uppercase tracking-wider">
                  Catálogo Digital Sincronizado en Tiempo Real
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                {empresa?.nombre || 'Mi Tienda Online GLORYPOS'}
              </h1>
              <p className="text-xs sm:text-sm text-blue-100 mt-2 leading-relaxed">
                Tus clientes pueden ver tus productos, consultar precios, armar pedidos desde su celular y enviártelos directamente por WhatsApp para coordinar la entrega o facturar en el POS.
              </p>
            </div>

            {/* Banner Quick Link Box */}
            <div className="relative z-10 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/20 w-full md:w-auto shrink-0 space-y-2.5">
              <div className="text-[11px] text-blue-200 font-medium">Link directo para tus clientes:</div>
              <div className="flex items-center gap-2 bg-slate-900/60 rounded-xl px-3 py-2 text-xs font-mono text-emerald-300 border border-white/10">
                <Globe className="w-3.5 h-3.5 text-blue-300 shrink-0" />
                <span className="truncate max-w-[200px] sm:max-w-[260px] font-semibold">{storeUrl}</span>
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="ml-auto text-white hover:text-blue-300 font-sans text-[11px] font-bold underline shrink-0"
                >
                  {copied ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
              <div className="flex items-center justify-between text-[11px] text-blue-100 pt-1">
                <span>📱 Compatible con móviles y tablets</span>
                <span className="font-bold text-emerald-300">● 100% Online</span>
              </div>
            </div>

            {/* Decorative background circle */}
            <div className="absolute -right-12 -bottom-12 w-64 h-64 bg-white/5 rounded-full pointer-events-none blur-2xl"></div>
          </div>

          {/* ── 2. TARJETAS DE MÉTRICAS RÁPIDAS ── */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Card 1: URL Pública */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Enlace Catálogo</span>
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs font-mono text-slate-800 truncate font-semibold mb-2">{storeUrl}</p>
              <button
                type="button"
                onClick={handleCopyLink}
                className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start"
              >
                <Copy className="w-3 h-3" />
                <span>{copied ? 'Enlace copiado' : 'Copiar enlace'}</span>
              </button>
            </div>

            {/* Card 2: Productos Visibles */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Productos en Tienda</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Package className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{products.length}</span>
                <span className="text-xs text-slate-500 ml-1.5 font-medium">ítems sincronizados</span>
              </div>
              <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-2">
                <CheckCircle2 className="w-3 h-3" />
                <span>Stock sincronizado con tu POS</span>
              </div>
            </div>

            {/* Card 3: Pedidos Web Recibidos */}
            <div 
              onClick={() => setActiveTab('pedidos')}
              className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between hover:border-emerald-400 cursor-pointer group transition-colors"
            >
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Pedidos Web</span>
                <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-600 flex items-center justify-center">
                  <ShoppingBag className="w-4 h-4" />
                </div>
              </div>
              <div>
                <span className="text-2xl font-black text-slate-900">{pedidosCount.total}</span>
                <span className="text-xs text-emerald-600 ml-2 font-bold px-1.5 py-0.5 bg-emerald-50 rounded-md">
                  {pedidosCount.nuevos} nuevos
                </span>
              </div>
              <div className="text-xs font-bold text-teal-600 group-hover:text-teal-700 flex items-center gap-1 mt-2">
                <span>Gestionar pedidos web</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>

            {/* Card 4: Canal WhatsApp */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
              <div className="flex items-center justify-between mb-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Canal WhatsApp</span>
                <div className="w-8 h-8 rounded-xl bg-green-50 text-green-600 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <p className="text-xs font-bold text-slate-800">
                {empresa?.telefono ? `WhatsApp: ${empresa.telefono}` : 'Recepción Directa'}
              </p>
              <div className="text-[11px] text-slate-500 mt-2">
                Los clientes envían su pedido armado a tu chat oficial
              </div>
            </div>

          </div>

          {/* ── 3. SECCIÓN DE GESTIÓN DE PRODUCTOS EN TIENDA VIRTUAL ── */}
          <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-5 space-y-4">
            
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Productos en tu Catálogo Virtual
                </h3>
                <p className="text-xs text-slate-500">
                  Activa o desactiva los productos que deseas mostrar en tu catálogo público para clientes.
                </p>
              </div>

              {/* Filtro y Búsqueda */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Buscar producto..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-8.5 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-blue-500"
                  />
                  {searchTerm && (
                    <button 
                      onClick={() => setSearchTerm('')} 
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <label className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 cursor-pointer hover:bg-slate-100">
                  <input
                    type="checkbox"
                    checked={onlyActive}
                    onChange={e => setOnlyActive(e.target.checked)}
                    className="rounded text-blue-600 focus:ring-0"
                  />
                  <span>Solo activos</span>
                </label>
              </div>
            </div>

            {/* Categorías Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1 shrink-0">Categoría:</span>
              {categories.map(cat => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1 rounded-lg font-semibold shrink-0 transition text-xs ${
                    selectedCategory === cat
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Grid de Productos */}
            {filteredProducts.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Package className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No se encontraron productos con los filtros aplicados</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5 pt-1">
                {filteredProducts.map(prod => {
                  const isActive = prod.activo !== false;
                  return (
                    <div 
                      key={prod.id} 
                      className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between ${
                        isActive 
                          ? 'border-slate-200 bg-white hover:shadow-md' 
                          : 'border-slate-200/60 bg-slate-50 opacity-75'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        <img
                          src={prod.foto_url || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80'}
                          alt={prod.nombre}
                          className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                          onError={(e) => {
                            e.target.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=200&q=80';
                          }}
                        />
                        <div className="min-w-0 flex-1">
                          <span className="text-[9px] font-bold uppercase tracking-wider text-blue-600 block truncate">
                            {prod.categoria || 'General'}
                          </span>
                          <p className="text-xs font-bold text-slate-900 line-clamp-2 leading-tight mt-0.5">
                            {prod.nombre}
                          </p>
                          <div className="flex items-center gap-1.5 mt-1">
                            <span className="text-xs font-extrabold text-slate-900">
                              Bs. {Number(prod.precio_venta || 0).toFixed(2)}
                            </span>
                            <span className="text-[10px] text-slate-400 font-normal">
                              • Stock: <strong className="text-slate-700">{prod.stock_actual ?? 10}</strong>
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer card: Switch de visibilidad en tienda */}
                      <div className="mt-3 pt-2.5 border-t border-slate-100 flex items-center justify-between">
                        <span className={`text-[10px] font-bold ${isActive ? 'text-emerald-700' : 'text-slate-400'}`}>
                          {isActive ? '● En Catálogo' : '○ Oculto'}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleToggleProduct(prod.id, isActive)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition flex items-center gap-1 ${
                            isActive
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              : 'bg-slate-200 text-slate-600 hover:bg-slate-300'
                          }`}
                        >
                          {isActive ? 'Visible' : 'Activar'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL CÓDIGO QR PARA MOSTRADOR                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 text-center space-y-4 shadow-2xl border border-slate-100 relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 mx-auto flex items-center justify-center">
              <QrCode className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">QR de tu Catálogo Digital</h3>
              <p className="text-xs text-slate-500 mt-1">
                Tus clientes pueden escanearlo con la cámara de su celular para abrir tu tienda al instante.
              </p>
            </div>

            {/* QR Image Box */}
            <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(storeUrl)}`}
                alt="QR Tienda Virtual"
                className="w-48 h-48 mx-auto rounded-lg shadow-2xs"
              />
              <p className="text-[11px] font-mono font-semibold text-slate-700 mt-2 truncate max-w-[200px] mx-auto">
                {storeUrl}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? '¡Copiado!' : 'Copiar URL'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir QR</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
