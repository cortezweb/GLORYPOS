import React, { useState, useEffect } from 'react';
import { 
  Globe, ShoppingBag, ExternalLink, Share2, Eye, 
  Smartphone, QrCode, CheckCircle2, Search, ArrowRight,
  Check, X, Copy, Printer, Download, MessageSquare, Store,
  Layers, Package, ChevronRight, RefreshCw, Settings, SlidersHorizontal,
  Plus, Trash2, Edit3, Image as ImageIcon, Sparkles
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { syncService } from '../../services/syncService';
import PedidosWebView from '../Sales/PedidosWebView';
import EcommerceStorefront from './EcommerceStorefront';

const SLIDERS_STORAGE_KEY = 'glorypos_ecommerce_sliders';

const INITIAL_SLIDERS = [
  {
    id: 'slide-1',
    title: '¡Gran Liquidación & Novedades!',
    subtitle: 'Encuentra los mejores productos a los mejores precios de la temporada con envío directo.',
    buttonText: 'Ver productos',
    linkUrl: '#productos',
    bgGradient: 'from-emerald-700 via-teal-700 to-slate-900',
    active: true
  },
  {
    id: 'slide-2',
    title: 'Pide Fácil por WhatsApp',
    subtitle: 'Arma tu carrito en segundos y te atendemos al instante por WhatsApp para tu entrega.',
    buttonText: 'Explorar Catálogo',
    linkUrl: '#productos',
    bgGradient: 'from-blue-700 via-indigo-800 to-slate-900',
    active: true
  }
];

export default function TiendaVirtualView({ initialTab = 'tienda', onSelectView, onOpenPosWithCart }) {
  const { empresa } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab === 'pedidos' ? 'pedidos' : 'tienda');
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);
  const [pedidosCount, setPedidosCount] = useState({ total: 0, nuevos: 0 });

  // Banner / Slider Management States
  const [sliders, setSliders] = useState(() => {
    try {
      const saved = localStorage.getItem(SLIDERS_STORAGE_KEY);
      return saved ? JSON.parse(saved) : INITIAL_SLIDERS;
    } catch {
      return INITIAL_SLIDERS;
    }
  });
  const [isEditingSlider, setIsEditingSlider] = useState(null); // slider obj or null
  const [newSliderData, setNewSliderData] = useState({
    title: '',
    subtitle: '',
    buttonText: 'Ver productos',
    bgGradient: 'from-emerald-700 via-teal-700 to-slate-900'
  });

  // Cargar productos de Dexie / Supabase
  useEffect(() => {
    const loadProducts = async () => {
      try {
        let list = [];
        try {
          list = await db.productos_tienda.toArray();
        } catch (e) {
          console.warn('Error reading db.productos_tienda:', e);
        }

        if ((!list || list.length === 0) && isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase.from('productos').select('*');
            if (!error && data && data.length > 0) {
              list = data;
              for (const p of data) {
                await db.productos_tienda.put(p).catch(() => {});
              }
            }
          } catch (cloudErr) {
            console.warn('Error pulling products from Supabase:', cloudErr);
          }
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
    const updateCount = () => {
      const saved = localStorage.getItem('glorypos_pedidos_web_v2');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            const nuevos = parsed.filter(p => p.estado === 'Nuevo').length;
            setPedidosCount({ total: parsed.length, nuevos });
          }
        } catch {
          // ignore
        }
      }
    };
    updateCount();
    window.addEventListener('glorypos_order_created', updateCount);
    return () => window.removeEventListener('glorypos_order_created', updateCount);
  }, []);

  // URL Pública de Ecommerce
  const storeUrl = `${window.location.origin}/#/ecommerce`;

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
      syncService.triggerBackgroundSync();
    } catch (e) {
      // ignore
    }
  };

  // Guardar Sliders en LocalStorage
  const handleSaveSliders = (updatedSliders) => {
    setSliders(updatedSliders);
    try {
      localStorage.setItem(SLIDERS_STORAGE_KEY, JSON.stringify(updatedSliders));
    } catch (e) {
      console.warn('Error saving sliders:', e);
    }
  };

  const handleAddSlider = () => {
    if (!newSliderData.title.trim()) return;
    const newSlide = {
      id: 'slide-' + Date.now(),
      title: newSliderData.title.trim(),
      subtitle: newSliderData.subtitle.trim(),
      buttonText: newSliderData.buttonText.trim() || 'Ver productos',
      linkUrl: '#productos',
      bgGradient: newSliderData.bgGradient,
      active: true
    };
    handleSaveSliders([...sliders, newSlide]);
    setNewSliderData({
      title: '',
      subtitle: '',
      buttonText: 'Ver productos',
      bgGradient: 'from-emerald-700 via-teal-700 to-slate-900'
    });
  };

  const handleDeleteSlider = (slideId) => {
    handleSaveSliders(sliders.filter(s => s.id !== slideId));
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14">
      
      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* BARRA SUPERIOR DE PESTAÑAS (Tienda en Vivo / Banners / Pedidos)    */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white border-b border-slate-200 sticky top-0 z-20 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 pb-2.5">
          
          {/* Pestañas Principales */}
          <div className="flex items-center space-x-2">
            {/* Pestaña 1: Tienda Virtual en Vivo */}
            <button
              type="button"
              onClick={() => setActiveTab('tienda')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tienda'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-sm shadow-emerald-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Store className="w-4 h-4" />
              <span>Tienda Virtual (Ecommerce)</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-black ${
                activeTab === 'tienda' ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
              }`}>
                En Vivo
              </span>
            </button>

            {/* Pestaña 2: Banners & Configuración */}
            <button
              type="button"
              onClick={() => setActiveTab('configuracion')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'configuracion'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-sm shadow-blue-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Banners & Catálogo</span>
            </button>

            {/* Pestaña 3: Pedidos Web */}
            <button
              type="button"
              onClick={() => setActiveTab('pedidos')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'pedidos'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-sm shadow-indigo-500/25'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Pedidos Web</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-black tracking-tight ${
                activeTab === 'pedidos' 
                  ? 'bg-white text-indigo-700' 
                  : 'bg-emerald-100 text-emerald-800 animate-pulse'
              }`}>
                {pedidosCount.nuevos > 0 ? `${pedidosCount.nuevos} Nuevos` : pedidosCount.total}
              </span>
            </button>
          </div>

          {/* Acciones Rápidas del Header */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={() => setIsQrModalOpen(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
              title="Generar código QR del ecommerce"
            >
              <QrCode className="w-3.5 h-3.5 text-slate-600" />
              <span className="hidden sm:inline">Código QR</span>
            </button>

            <button
              type="button"
              onClick={handleCopyLink}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 border border-slate-200 cursor-pointer"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700 font-bold">¡Copiado!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-slate-600" />
                  <span className="hidden sm:inline">Compartir</span>
                </>
              )}
            </button>

            <a
              href={storeUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Abrir Tienda</span>
            </a>
          </div>

        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* CONTENIDO SEGÚN LA PESTAÑA ACTIVA                                  */}
      {/* ══════════════════════════════════════════════════════════════════ */}

      {/* PESTAÑA 1: TIENDA VIRTUAL EN VIVO (Modelo Tukifac) */}
      {activeTab === 'tienda' && (
        <div className="flex-1 flex flex-col">
          {/* Banner Informativo Superior para el Administrador */}
          <div className="bg-slate-900 text-white px-4 py-2.5 text-xs flex flex-wrap items-center justify-between gap-3 border-b border-slate-800">
            <div className="flex items-center gap-2 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-slate-300">Enlace público de tu Tienda:</span>
              <span className="font-bold text-emerald-400 truncate max-w-xs">{storeUrl}</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition cursor-pointer"
              >
                {copied ? '¡Copiado!' : 'Copiar URL'}
              </button>
              <a
                href={storeUrl}
                target="_blank"
                rel="noreferrer"
                className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold transition flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                <span>Pestaña Nueva</span>
              </a>
            </div>
          </div>

          {/* Renderizado de la Tienda Virtual E-commerce */}
          <EcommerceStorefront isEmbedded={true} />
        </div>
      )}

      {/* PESTAÑA 2: CONFIGURACIÓN & BANNERS */}
      {activeTab === 'configuracion' && (
        <div className="max-w-7xl mx-auto w-full p-4 sm:p-6 space-y-6">
          
          {/* Gestión de Sliders / Banners */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Banners Promocionales de la Tienda
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Personaliza los anuncios que ven tus clientes en la cabecera del ecommerce.
                </p>
              </div>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                {sliders.length} activos
              </span>
            </div>

            {/* Lista de Banners Actuales */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sliders.map((s, idx) => (
                <div 
                  key={s.id} 
                  className={`p-5 rounded-2xl bg-gradient-to-r ${s.bgGradient} text-white shadow-md relative flex flex-col justify-between overflow-hidden`}
                >
                  <div className="relative z-10 space-y-2">
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 text-white inline-block">
                      Banner #{idx + 1}
                    </span>
                    <h4 className="text-lg font-black leading-snug">{s.title}</h4>
                    <p className="text-xs text-slate-100/90 line-clamp-2">{s.subtitle}</p>
                    <span className="inline-block mt-2 px-3 py-1 rounded-full bg-white text-slate-900 text-xs font-black shadow-xs">
                      {s.buttonText}
                    </span>
                  </div>

                  <div className="pt-4 flex items-center justify-end gap-2 relative z-10 border-t border-white/10 mt-3">
                    <button
                      type="button"
                      onClick={() => handleDeleteSlider(s.id)}
                      className="p-1.5 rounded-lg bg-white/10 hover:bg-rose-600 text-white transition cursor-pointer"
                      title="Eliminar banner"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Formulario Agregar Nuevo Banner */}
            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 space-y-3">
              <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Agregar Nuevo Banner Promocional</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Título del Banner</label>
                  <input
                    type="text"
                    value={newSliderData.title}
                    onChange={(e) => setNewSliderData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="Ej. ¡50% de Descuento en Bebidas!"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Texto del Botón</label>
                  <input
                    type="text"
                    value={newSliderData.buttonText}
                    onChange={(e) => setNewSliderData(prev => ({ ...prev, buttonText: e.target.value }))}
                    placeholder="Ej. Comprar Ahora"
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Subtítulo / Mensaje</label>
                  <input
                    type="text"
                    value={newSliderData.subtitle}
                    onChange={(e) => setNewSliderData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="Ej. Ofertas válidas hasta agotar stock. Envío inmediato por WhatsApp."
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-600 block mb-1">Tema de Color</label>
                  <select
                    value={newSliderData.bgGradient}
                    onChange={(e) => setNewSliderData(prev => ({ ...prev, bgGradient: e.target.value }))}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800"
                  >
                    <option value="from-emerald-700 via-teal-700 to-slate-900">Verde Esmeralda (Principal)</option>
                    <option value="from-blue-700 via-indigo-800 to-slate-900">Azul Océano</option>
                    <option value="from-violet-700 via-purple-800 to-slate-900">Morado Neón</option>
                    <option value="from-amber-600 via-orange-700 to-slate-900">Naranja / Dorado</option>
                    <option value="from-rose-700 via-red-800 to-slate-900">Rojo Fuego</option>
                  </select>
                </div>

                <div className="flex items-end">
                  <button
                    type="button"
                    onClick={handleAddSlider}
                    className="w-full py-2 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition cursor-pointer"
                  >
                    Guardar Banner
                  </button>
                </div>
              </div>
            </div>

          </div>

          {/* Gestión de Productos Visibles en la Tienda */}
          <div className="bg-white rounded-3xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Visibilidad de Productos en la Tienda
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Activa o desactiva qué productos se publican en el ecommerce.
                </p>
              </div>
              <span className="text-xs font-bold text-slate-500">
                {products.length} productos en catálogo
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase text-[10px]">
                    <th className="py-2.5 px-3">Producto</th>
                    <th className="py-2.5 px-3">Categoría</th>
                    <th className="py-2.5 px-3 text-right">Precio</th>
                    <th className="py-2.5 px-3 text-center">Estado en Tienda</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.slice(0, 50).map((prod) => {
                    const price = Number(prod.precio_venta || prod.precio || 0);
                    const isVisible = prod.activo !== false;
                    return (
                      <tr key={prod.id} className="hover:bg-slate-50">
                        <td className="py-2.5 px-3 font-semibold text-slate-800 flex items-center gap-2">
                          <Package className="w-4 h-4 text-slate-400 shrink-0" />
                          <span>{prod.nombre}</span>
                        </td>
                        <td className="py-2.5 px-3 text-slate-500">{prod.categoria || 'General'}</td>
                        <td className="py-2.5 px-3 text-right font-mono font-bold text-emerald-600">
                          Bs. {price.toFixed(2)}
                        </td>
                        <td className="py-2.5 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleToggleProduct(prod.id, isVisible)}
                            className={`px-3 py-1 rounded-full text-[10px] font-bold transition cursor-pointer ${
                              isVisible
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-slate-200 text-slate-600'
                            }`}
                          >
                            {isVisible ? 'Visible en Tienda' : 'Oculto'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* PESTAÑA 3: PEDIDOS WEB INTEGRADOS */}
      {activeTab === 'pedidos' && (
        <PedidosWebView 
          hideSubNav={true} 
          onOpenPosWithCart={onOpenPosWithCart}
          onSelectSubView={onSelectView}
        />
      )}

      {/* ── MODAL: CÓDIGO QR DE LA TIENDA ── */}
      {isQrModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-sm overflow-hidden p-6 text-center space-y-4 animate-scaleUp">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="text-sm font-black text-slate-900">Código QR de tu Tienda</h3>
              <button
                type="button"
                onClick={() => setIsQrModalOpen(false)}
                className="w-7 h-7 rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 inline-block mx-auto shadow-inner">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(storeUrl)}`}
                alt="QR Code Tienda Virtual"
                className="w-48 h-48 mx-auto"
              />
            </div>

            <div>
              <p className="text-xs font-bold text-slate-800 truncate">{empresa?.nombre || 'GLORYPOS'}</p>
              <p className="text-[11px] text-slate-400 font-mono mt-0.5">{storeUrl}</p>
            </div>

            <div className="pt-2 flex gap-2">
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copied ? '¡Copiado!' : 'Copiar Link'}</span>
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className="py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
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
