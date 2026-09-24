import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  ShoppingBag, ShoppingCart, Search, X, Plus, Minus, Trash2, 
  ChevronRight, SlidersHorizontal, MessageCircle, Check, Store, 
  Phone, MapPin, ExternalLink, ArrowRight, Eye, Sparkles, Filter, 
  ChevronLeft, Package, Clock, ShieldCheck
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { syncService } from '../../services/syncService';

const CART_STORAGE_KEY = 'glorypos_ecommerce_cart';
const SETTINGS_STORAGE_KEY = 'glorypos_ecommerce_settings';
const SLIDERS_STORAGE_KEY = 'glorypos_ecommerce_sliders';

const DEFAULT_SLIDERS = [
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

export default function EcommerceStorefront({ isEmbedded = false, onBackToAdmin = null }) {
  const { empresa } = useAuth();
  
  // Data States
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sliders, setSliders] = useState(DEFAULT_SLIDERS);
  const [currentSlide, setCurrentSlide] = useState(0);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('TODAS');
  const [priceRange, setPriceRange] = useState({ min: 0, max: 1000, currentMax: 1000 });
  const [showPriceFilter, setShowPriceFilter] = useState(false);

  // Cart & Modal States
  const [cart, setCart] = useState(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Checkout Form States
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [customerAddress, setCustomerAddress] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastMessage, setToastMessage] = useState(null);

  // 1. Cargar Configuración y Sliders
  useEffect(() => {
    try {
      const savedSliders = localStorage.getItem(SLIDERS_STORAGE_KEY);
      if (savedSliders) {
        setSliders(JSON.parse(savedSliders));
      }
    } catch (e) {
      console.warn('Error loading custom sliders:', e);
    }
  }, []);

  // 2. Cargar Productos desde Dexie / Supabase
  useEffect(() => {
    const loadStoreProducts = async () => {
      setLoading(true);
      try {
        let list = [];
        try {
          list = await db.productos_tienda.toArray();
        } catch (e) {
          console.warn('Error reading db.productos_tienda:', e);
        }

        // Si la base de datos local Dexie aún no tiene productos, intentar traerlos desde Supabase
        if ((!list || list.length === 0) && isSupabaseConfigured && supabase) {
          try {
            const { data, error } = await supabase.from('productos').select('*');
            if (!error && data && data.length > 0) {
              list = data;
              // Guardar en Dexie para soporte offline
              for (const p of data) {
                await db.productos_tienda.put(p).catch(() => {});
              }
            }
          } catch (cloudErr) {
            console.warn('Error pulling products from Supabase:', cloudErr);
          }
        }

        const activeList = (list || []).filter(p => p.activo !== false);
        setProducts(activeList);

        // Calcular límites de precio
        if (activeList.length > 0) {
          const prices = activeList.map(p => Number(p.precio_venta || p.precio || 0)).filter(p => p > 0);
          if (prices.length > 0) {
            const minP = Math.floor(Math.min(...prices));
            const maxP = Math.ceil(Math.max(...prices));
            setPriceRange({ min: minP, max: maxP, currentMax: maxP });
          }
        }
      } catch (err) {
        console.error('Error cargando productos de tienda:', err);
      } finally {
        setLoading(false);
      }
    };
    loadStoreProducts();
  }, []);

  // 3. Persistir Carrito
  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
    } catch (e) {
      console.warn('Error saving cart:', e);
    }
  }, [cart]);

  // 4. Auto-Play de Sliders
  useEffect(() => {
    if (sliders.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % sliders.length);
    }, 6000);
    return () => clearInterval(interval);
  }, [sliders]);

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // Categorías Únicas
  const categories = useMemo(() => {
    const set = new Set();
    products.forEach(p => {
      if (p.categoria && p.categoria.trim()) {
        set.add(p.categoria.trim());
      }
    });
    return ['TODAS', ...Array.from(set)];
  }, [products]);

  // Productos Filtrados
  const filteredProducts = useMemo(() => {
    const term = searchTerm.toLowerCase().trim();
    return products.filter(p => {
      const name = (p.nombre || '').toLowerCase();
      const code = (p.codigo_barras || '').toLowerCase();
      const cat = (p.categoria || '').toLowerCase();
      const price = Number(p.precio_venta || p.precio || 0);

      const matchesSearch = !term || name.includes(term) || code.includes(term) || cat.includes(term);
      const matchesCategory = selectedCategory === 'TODAS' || p.categoria === selectedCategory;
      const matchesPrice = price <= priceRange.currentMax;

      return matchesSearch && matchesCategory && matchesPrice;
    });
  }, [products, searchTerm, selectedCategory, priceRange.currentMax]);

  // Helpers de Carrito
  const cartTotalItems = useMemo(() => {
    return cart.reduce((acc, item) => acc + item.cantidad, 0);
  }, [cart]);

  const cartTotalPrice = useMemo(() => {
    return cart.reduce((acc, item) => acc + (item.cantidad * item.precio), 0);
  }, [cart]);

  const handleAddToCart = (product, quantity = 1, e = null) => {
    if (e) e.stopPropagation();
    const price = Number(product.precio_venta || product.precio || 0);
    setCart(prev => {
      const idx = prev.findIndex(item => item.id === product.id);
      if (idx >= 0) {
        const next = [...prev];
        next[idx] = { ...next[idx], cantidad: next[idx].cantidad + quantity };
        return next;
      }
      return [...prev, {
        id: product.id,
        nombre: product.nombre,
        precio: price,
        unidad: product.unidad_medida || 'Unidad',
        imagen_url: product.imagen_url || product.foto_url || null,
        cantidad: quantity
      }];
    });
    showToast(`¡"${product.nombre}" agregado al carrito!`);
  };

  const handleUpdateQuantity = (productId, delta) => {
    setCart(prev => {
      return prev.map(item => {
        if (item.id === productId) {
          const newQ = item.cantidad + delta;
          return newQ > 0 ? { ...item, cantidad: newQ } : null;
        }
        return item;
      }).filter(Boolean);
    });
  };

  const handleRemoveFromCart = (productId) => {
    setCart(prev => prev.filter(item => item.id !== productId));
  };

  const handleOpenDetailModal = (product) => {
    setSelectedProduct(product);
    setModalQuantity(1);
  };

  // Enviar Pedido a WhatsApp y Guardar en GLORYPOS
  const handleSendOrderWhatsApp = async () => {
    if (cart.length === 0) return;
    if (!customerName.trim()) {
      alert('Por favor, ingresa tu nombre para procesar el pedido.');
      return;
    }
    if (!customerPhone.trim()) {
      alert('Por favor, ingresa tu número de celular o WhatsApp de contacto.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderNumber = 'PW-' + Math.floor(1000 + Math.random() * 9000);
      const newOrder = {
        id: 'pw-' + Date.now(),
        numero_orden: orderNumber,
        fecha: new Date().toLocaleString('es-BO'),
        cliente_nombre: customerName.trim(),
        telefono: customerPhone.trim(),
        direccion: customerAddress.trim() || 'Coordinar con el cliente',
        total: cartTotalPrice,
        estado: 'Nuevo',
        items: cart.map(item => ({
          nombre: item.nombre,
          cantidad: item.cantidad,
          precio: item.precio,
          subtotal: item.cantidad * item.precio
        }))
      };

      // 1. Guardar en Dexie pedidos_web
      try {
        if (db.pedidos_web) {
          await db.pedidos_web.put(newOrder);
        }
      } catch (dxErr) {
        console.warn('Error guardando pedido en Dexie:', dxErr);
      }

      // 2. Guardar en la lista persistente de Pedidos Web de GLORYPOS (localStorage)
      const existingSaved = localStorage.getItem('glorypos_pedidos_web_v2');
      let orderList = [];
      if (existingSaved) {
        try { orderList = JSON.parse(existingSaved); } catch { orderList = []; }
      }
      orderList.unshift(newOrder);
      localStorage.setItem('glorypos_pedidos_web_v2', JSON.stringify(orderList));

      // 3. Sincronizar directamente con Supabase
      if (isSupabaseConfigured && supabase) {
        const empresaId = empresa?.id || 'empresa_activa';
        
        // 3a. Intentar guardar en pedidos_web
        supabase.from('pedidos_web').upsert({
          id: newOrder.id,
          empresa_id: empresaId,
          fecha: new Date().toISOString(),
          cliente_nombre: newOrder.cliente_nombre,
          telefono: newOrder.telefono,
          total: Number(newOrder.total) || 0,
          estado: 'Nuevo',
          items: newOrder.items
        }).then(({ error: pwErr }) => {
          if (pwErr) {
            console.warn('[Ecommerce] Tabla pedidos_web pendiente en Supabase:', pwErr.message);
          }
        }).catch(() => {});

        // 3b. También reflejar en la tabla 'ventas' existente como tipo_documento = 'PEDIDO_WEB'
        // para que se refleje inmediatamente en el Dashboard de Supabase
        supabase.from('ventas').upsert({
          id: `vta-${newOrder.id}`,
          empresa_id: empresaId,
          fecha: new Date().toISOString(),
          correlativo: orderNumber,
          tipo_documento: 'PEDIDO_WEB',
          serie: 'WEB01',
          cliente_nombre: newOrder.cliente_nombre,
          cliente_ci_nit: newOrder.telefono,
          metodo_pago: 'WHATSAPP',
          subtotal: Number(newOrder.total) || 0,
          total: Number(newOrder.total) || 0,
          monto_recibido: 0,
          cambio: 0,
          estado_siat: 'NO_APLICA',
          items: newOrder.items
        }).then(({ error: vtaErr }) => {
          if (vtaErr) console.warn('[Ecommerce] Error al registrar pedido en ventas Supabase:', vtaErr.message);
          else console.info('[Ecommerce] ¡Pedido reflejado con éxito en Supabase!');
        }).catch(() => {});
      }

      // 4. Disparar sincronización global en segundo plano
      syncService.triggerBackgroundSync();

      // 5. Disparar evento para que el panel de pedidos web se actualice en tiempo real
      window.dispatchEvent(new CustomEvent('glorypos_order_created', { detail: newOrder }));

      // Formatear Mensaje estructurado de WhatsApp (Exacto al modelo Tukifac)
      const storeName = empresa?.nombre || 'GLORYPOS Tienda';
      const itemsListText = cart.map(item => 
        `• ${item.nombre} x${item.cantidad} — Bs. ${(item.cantidad * item.precio).toFixed(2)}`
      ).join('\n');

      const whatsappText = 
`Hola *${storeName}*, quiero hacer este pedido (N° *${orderNumber}*):

${itemsListText}

*Total a Pagar:* Bs. ${cartTotalPrice.toFixed(2)}

*Mis Datos:*
Nombre: ${customerName.trim()}
Celular: ${customerPhone.trim()}${customerAddress.trim() ? `\nDirección: ${customerAddress.trim()}` : ''}

_¡Aguardo su confirmación para coordinar el pago y entrega!_`;

      const storePhone = empresa?.telefono ? empresa.telefono.replace(/[^0-9]/g, '') : '59177012345';
      const cleanPhone = storePhone.startsWith('591') ? storePhone : '591' + storePhone;
      
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(whatsappText)}`;
      window.open(whatsappUrl, '_blank');

      // Limpiar carrito y cerrar
      setCart([]);
      setIsCartOpen(false);
      setCustomerName('');
      setCustomerPhone('');
      setCustomerAddress('');
      showToast('¡Pedido enviado con éxito! Continuando en WhatsApp...');
    } catch (err) {
      console.error('Error al procesar pedido:', err);
      alert('No se pudo registrar el pedido. Intenta nuevamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans select-none ${isEmbedded ? '' : 'relative'}`}>
      
      {/* ── NOTIFICACIÓN TOAST FLOTANTE ── */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-[500] bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-bold animate-slideUp border border-slate-700">
          <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ── HEADER SUPERIOR E-COMMERCE (Exacto a Tukifac) ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-40 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3">
          
          {/* Logo & Nombre de la Tienda */}
          <div className="flex items-center gap-3">
            {isEmbedded && onBackToAdmin && (
              <button
                type="button"
                onClick={onBackToAdmin}
                className="p-1.5 rounded-xl border border-slate-200 text-slate-500 hover:bg-slate-100 transition mr-1"
                title="Volver a la consola de administración"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            )}
            
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-indigo-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-emerald-500/20 shrink-0">
              <Store className="w-5 h-5 text-white" />
            </div>

            <div className="min-w-0">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-slate-900 truncate max-w-[170px] sm:max-w-xs leading-tight">
                {empresa?.nombre || 'GLORYPOS Store'}
              </h1>
              <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded-full inline-flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Tienda Virtual Oficial
              </span>
            </div>
          </div>

          {/* Barra de Búsqueda Predictiva */}
          <div className="order-3 sm:order-none basis-full sm:basis-auto sm:flex-1 sm:max-w-md relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar producto, categoría o marca..."
              className="w-full bg-slate-100 hover:bg-slate-100/80 focus:bg-white text-xs rounded-xl pl-9 pr-8 py-2.5 outline-hidden border border-transparent focus:border-emerald-500 transition-all text-slate-800 placeholder-slate-400"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Botón Carrito Flotante con Badge */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsCartOpen(true)}
              className="relative flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md shadow-emerald-600/25 transition active:scale-95 cursor-pointer"
            >
              <ShoppingCart className="w-4 h-4" />
              <span className="hidden sm:inline">Carrito</span>
              {cartTotalItems > 0 && (
                <span className="w-5 h-5 rounded-full bg-amber-400 text-slate-900 text-[10px] font-black flex items-center justify-center shadow-xs">
                  {cartTotalItems}
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ── CONTENIDO PRINCIPAL ── */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-6">

        {/* ── 1. HERO SLIDER BANNER (Exacto a Tukifac) ── */}
        {sliders.length > 0 && (
          <div className="relative rounded-3xl overflow-hidden shadow-xl text-white">
            <div className={`p-6 sm:p-10 lg:p-12 bg-gradient-to-r ${sliders[currentSlide]?.bgGradient || 'from-emerald-700 to-slate-900'} transition-all duration-700 relative`}>
              <div className="max-w-xl space-y-3 relative z-10">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-[11px] font-bold text-emerald-200 uppercase tracking-wider border border-white/20">
                  <Sparkles className="w-3 h-3 text-amber-300" />
                  Promociones Disponibles
                </span>
                <h2 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
                  {sliders[currentSlide]?.title}
                </h2>
                <p className="text-xs sm:text-sm text-slate-100/90 leading-relaxed max-w-lg">
                  {sliders[currentSlide]?.subtitle}
                </p>
                <div className="pt-2">
                  <a
                    href="#productos"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white text-slate-900 hover:bg-slate-100 font-black text-xs shadow-lg transition active:scale-95"
                  >
                    <span>{sliders[currentSlide]?.buttonText || 'Ver productos'}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                  </a>
                </div>
              </div>

              {/* Indicadores / Puntos */}
              {sliders.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 z-20">
                  {sliders.map((_, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setCurrentSlide(i)}
                      className={`h-1.5 rounded-full transition-all ${
                        currentSlide === i ? 'w-6 bg-white' : 'w-1.5 bg-white/40'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Elementos decorativos */}
              <div className="absolute -right-10 -bottom-10 w-64 h-64 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
            </div>
          </div>
        )}

        {/* ── 2. NAVEGACIÓN DE CATEGORÍAS (Píldoras con Scroll Horizontal) ── */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Categorías de Productos
            </h3>
            <span className="text-[11px] text-slate-400 font-semibold">
              {categories.length - 1} disponibles
            </span>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
            {categories.map((cat) => {
              const isSelected = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shrink-0 ${
                    isSelected
                      ? 'bg-emerald-600 text-white shadow-md shadow-emerald-500/20'
                      : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80 hover:text-slate-900'
                  }`}
                >
                  <span>{cat}</span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white"></span>}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── 3. CABECERA DE CATÁLOGO & FILTROS ── */}
        <section id="productos" className="space-y-4 pt-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200/80">
            <div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>{selectedCategory === 'TODAS' ? 'Todos los Productos' : selectedCategory}</span>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                  {filteredProducts.length} ítems
                </span>
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Precios oficiales en Bolivianos (Bs.) con entrega rápida
              </p>
            </div>

            {/* Botón Filtro de Precio */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setShowPriceFilter(prev => !prev)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                  showPriceFilter 
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800' 
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
                <span>Hasta Bs. {priceRange.currentMax}</span>
              </button>
            </div>
          </div>

          {/* Rango de precio desplegable */}
          {showPriceFilter && (
            <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-sm space-y-2 animate-fadeIn max-w-sm">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Filtro de Precio Máximo:</span>
                <span className="text-emerald-600 font-mono">Bs. {priceRange.currentMax}</span>
              </div>
              <input
                type="range"
                min={priceRange.min}
                max={priceRange.max}
                value={priceRange.currentMax}
                onChange={(e) => setPriceRange(prev => ({ ...prev, currentMax: Number(e.target.value) }))}
                className="w-full accent-emerald-600 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>Min: Bs. {priceRange.min}</span>
                <span>Max: Bs. {priceRange.max}</span>
              </div>
            </div>
          )}

          {/* ── 4. CUADRÍCULA DE PRODUCTOS (Grid Responsiva Exacta a Tukifac) ── */}
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center space-y-3">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                Cargando Tienda Virtual...
              </p>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                <Package className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-800">No encontramos productos</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                No hay productos que coincidan con la búsqueda o el filtro de categoría seleccionado.
              </p>
              <button
                type="button"
                onClick={() => { setSearchTerm(''); setSelectedCategory('TODAS'); }}
                className="px-4 py-2 bg-emerald-50 text-emerald-700 font-bold text-xs rounded-xl hover:bg-emerald-100 transition"
              >
                Ver todos los productos
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3.5 sm:gap-5">
              {filteredProducts.map((prod) => {
                const price = Number(prod.precio_venta || prod.precio || 0);
                const stock = prod.stock_actual ?? 10;
                const isOutOfStock = stock <= 0;

                return (
                  <div
                    key={prod.id}
                    onClick={() => handleOpenDetailModal(prod)}
                    className="bg-white rounded-2xl border border-slate-200/90 hover:border-emerald-500/80 shadow-2xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden cursor-pointer group"
                  >
                    {/* Imagen de Producto */}
                    <div className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center border-b border-slate-100">
                      {(prod.imagen_url || prod.foto_url) ? (
                        <img
                          src={prod.imagen_url || prod.foto_url}
                          alt={prod.nombre}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-300 group-hover:text-emerald-500/60 transition-colors">
                          <Package className="w-12 h-12 stroke-[1.5]" />
                          <span className="text-[10px] font-bold mt-1 text-slate-400">GLORYPOS</span>
                        </div>
                      )}

                      {/* Badge Agotado */}
                      {isOutOfStock ? (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-rose-500 text-white text-[9px] font-black uppercase tracking-wider shadow-xs">
                          Agotado
                        </span>
                      ) : (
                        <span className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-emerald-500 text-white text-[9px] font-black tracking-tight shadow-xs">
                          Disponible
                        </span>
                      )}
                    </div>

                    {/* Contenido / Datos de la Tarjeta */}
                    <div className="p-3.5 flex flex-col flex-1 justify-between gap-2">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 block truncate">
                          {prod.categoria || 'General'}
                        </span>
                        <h4 className="text-xs sm:text-sm font-bold text-slate-800 line-clamp-2 mt-0.5 group-hover:text-emerald-700 transition-colors leading-snug">
                          {prod.nombre}
                        </h4>
                        <span className="text-[11px] text-slate-400 block mt-0.5">
                          por {prod.unidad_medida || 'Unidad'}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-100/80 flex items-center justify-between gap-2">
                        <div>
                          <span className="text-[10px] text-slate-400 font-bold block leading-none">PRECIO</span>
                          <span className="text-sm sm:text-base font-black text-slate-900 font-mono tracking-tight text-emerald-600">
                            Bs. {price.toFixed(2)}
                          </span>
                        </div>

                        <button
                          type="button"
                          disabled={isOutOfStock}
                          onClick={(e) => handleAddToCart(prod, 1, e)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs active:scale-95 transition disabled:opacity-40 cursor-pointer flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Agregar</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>

      {/* ── MODAL: DETALLE DEL PRODUCTO (Exacto a Tukifac) ── */}
      {selectedProduct && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 w-full max-w-lg overflow-hidden animate-scaleUp max-h-[90vh] flex flex-col">
            
            {/* Cabecera del modal */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <span className="text-xs font-black uppercase text-emerald-600 tracking-wider">
                {selectedProduct.categoria || 'Detalle del Producto'}
              </span>
              <button
                type="button"
                onClick={() => setSelectedProduct(null)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Contenido scrolleable */}
            <div className="p-5 overflow-y-auto space-y-4">
              <div className="aspect-video bg-slate-50 rounded-2xl overflow-hidden flex items-center justify-center border border-slate-100">
                {(selectedProduct.imagen_url || selectedProduct.foto_url) ? (
                  <img
                    src={selectedProduct.imagen_url || selectedProduct.foto_url}
                    alt={selectedProduct.nombre}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-16 h-16 text-slate-300" />
                )}
              </div>

              <div>
                <h3 className="text-lg font-black text-slate-900 leading-snug">
                  {selectedProduct.nombre}
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Código: <span className="font-mono">{selectedProduct.codigo_barras || 'S/C'}</span> • Presentación: <span className="font-bold">{selectedProduct.unidad_medida || 'Unidad'}</span>
                </p>
                {selectedProduct.descripcion && (
                  <p className="text-xs text-slate-600 mt-2 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {selectedProduct.descripcion}
                  </p>
                )}
              </div>

              {/* Precio & Cantidad */}
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex items-center justify-between">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold uppercase block">Precio Unitario</span>
                  <span className="text-xl font-black text-emerald-600 font-mono">
                    Bs. {Number(selectedProduct.precio_venta || selectedProduct.precio || 0).toFixed(2)}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold text-slate-500">Cantidad:</span>
                  <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1 shadow-2xs">
                    <button
                      type="button"
                      onClick={() => setModalQuantity(prev => Math.max(1, prev - 1))}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-6 text-center text-sm font-black font-mono">
                      {modalQuantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => setModalQuantity(prev => prev + 1)}
                      className="p-1 rounded-lg text-slate-500 hover:bg-slate-100 transition"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie con botón de Agregar */}
            <div className="p-4 border-t border-slate-100 bg-white">
              <button
                type="button"
                onClick={() => {
                  handleAddToCart(selectedProduct, modalQuantity);
                  setSelectedProduct(null);
                }}
                className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 transition cursor-pointer flex items-center justify-center gap-2"
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Agregar al Carrito (Bs. {(Number(selectedProduct.precio_venta || selectedProduct.precio || 0) * modalQuantity).toFixed(2)})</span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── DRAWER LATERAL DE CARRITO (Exacto a Tukifac) ── */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[300] flex justify-end animate-fadeIn">
          {/* Backdrop */}
          <div
            onClick={() => setIsCartOpen(false)}
            className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
          />

          {/* Panel Deslizable */}
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl z-10 animate-slideLeft">
            
            {/* Header del Carrito */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-black text-slate-800 text-base">
                  Tu Carrito de Compras
                </h3>
                <span className="text-xs font-bold text-slate-400">({cartTotalItems})</span>
              </div>
              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Lista de Productos en el Carrito */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {cart.length === 0 ? (
                <div className="text-center text-slate-400 py-16 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-300">
                    <ShoppingCart className="w-8 h-8" />
                  </div>
                  <p className="font-bold text-slate-600 text-sm">Tu carrito está vacío</p>
                  <p className="text-xs text-slate-400">Agrega productos del catálogo para armar tu pedido.</p>
                </div>
              ) : (
                cart.map((item) => (
                  <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center shrink-0 border border-slate-200/80">
                      {item.imagen_url ? (
                        <img src={item.imagen_url} alt={item.nombre} className="w-full h-full object-cover" />
                      ) : (
                        <Package className="w-6 h-6 text-slate-300" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-800 truncate">
                        {item.nombre}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">
                        Bs. {item.precio.toFixed(2)} c/u
                      </p>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200/80 rounded-xl px-1.5 py-0.5">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, -1)}
                        className="p-1 text-slate-500 hover:text-slate-800 transition"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-5 text-center text-xs font-bold font-mono">
                        {item.cantidad}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item.id, 1)}
                        className="p-1 text-slate-500 hover:text-slate-800 transition"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Eliminar Ítem */}
                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 transition"
                      title="Eliminar del carrito"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Formulario de Checkout y Botón WhatsApp (Exacto a Tukifac) */}
            {cart.length > 0 && (
              <div className="border-t border-slate-100 p-4 space-y-3 bg-slate-50/70">
                <div className="space-y-2">
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Tu Nombre Completo *
                    </label>
                    <input
                      type="text"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-emerald-500 transition"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Tu Celular / WhatsApp *
                    </label>
                    <input
                      type="tel"
                      value={customerPhone}
                      onChange={(e) => setCustomerPhone(e.target.value)}
                      placeholder="Ej. 77012345"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-emerald-500 transition font-mono"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-wider text-slate-500 block mb-1">
                      Dirección de Entrega (Opcional)
                    </label>
                    <input
                      type="text"
                      value={customerAddress}
                      onChange={(e) => setCustomerAddress(e.target.value)}
                      placeholder="Ej. Av. Principal #123, Zona Central"
                      className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-medium text-slate-800 outline-hidden focus:border-emerald-500 transition"
                    />
                  </div>
                </div>

                {/* Total */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-200 text-sm font-black text-slate-900">
                  <span>Total a Pagar:</span>
                  <span className="text-lg font-mono text-emerald-600">
                    Bs. {cartTotalPrice.toFixed(2)}
                  </span>
                </div>

                {/* Botón Principal: Pedir por WhatsApp */}
                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={handleSendOrderWhatsApp}
                  className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-lg shadow-emerald-600/30 transition active:scale-98 cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>{isSubmitting ? 'Procesando pedido...' : 'Pedir por WhatsApp'}</span>
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {/* ── FOOTER DE LA TIENDA VIRTUAL (Exacto a Tukifac) ── */}
      <footer className="bg-slate-900 text-white mt-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10 grid grid-cols-1 sm:grid-cols-3 gap-8">
          
          {/* Info Tienda */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center font-bold text-white shadow-xs">
                <Store className="w-4 h-4" />
              </div>
              <span className="font-black text-lg text-white">
                {empresa?.nombre || 'GLORYPOS Store'}
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Tu tienda virtual en línea sincronizada en tiempo real con nuestro Punto de Venta. Pide por WhatsApp y recibe tus compras sin complicaciones.
            </p>
          </div>

          {/* Categorías Principales */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
              Categorías
            </h4>
            <ul className="space-y-1.5 text-xs text-slate-400">
              {categories.slice(1, 6).map(c => (
                <li key={c}>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategory(c);
                      const el = document.getElementById('productos');
                      if (el) el.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="hover:text-emerald-400 transition"
                  >
                    • {c}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Contacto & WhatsApp */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Atención al Cliente
            </h4>
            <div className="space-y-2 text-xs text-slate-400">
              <p className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>WhatsApp: {empresa?.telefono || '+591 77012345'}</span>
              </p>
              <p className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span>{empresa?.direccion || 'Oficina Principal (Casa Matriz)'}</span>
              </p>
            </div>
          </div>

        </div>

        <div className="border-t border-slate-800 py-4 text-center text-[11px] text-slate-500 font-mono">
          © {new Date().getFullYear()} {empresa?.nombre || 'GLORYPOS'} · Plataforma de Comercio Electrónico
        </div>
      </footer>

    </div>
  );
}
