import React, { useState } from 'react';
import { 
  Play, ShoppingCart, Tag, FileText, BarChart3, Wallet, 
  ArrowUpRight, Sparkles, CheckCircle2, HelpCircle, X, ExternalLink,
  Store, ChevronRight, ShieldCheck, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function InicioView({
  onSelectView,
  onOpenCloseCash,
  onOpenReceipt
}) {
  const { empresa, currentUser } = useAuth();
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [activeTutorialTab, setActiveTutorialTab] = useState(0);

  const tutorials = [
    {
      title: '1. Emisión de Comprobantes & Venta Rápida',
      duration: '3:45 min',
      description: 'Aprende a cobrar en segundos con lector de barras, selector táctil, emisión de Facturas SIAT / SUNAT y boletas.',
      steps: [
        'Ve al módulo de Ventas (F4 o botón POS).',
        'Busca un producto por código de barras o tocando la categoría.',
        'Presiona Cobrar, elige el método (Efectivo, QR, Tarjeta) e imprime el ticket.'
      ]
    },
    {
      title: '2. Gestión de Productos & Catálogo',
      duration: '4:10 min',
      description: 'Cómo registrar productos con variantes, precios por mayor, control de stock mínimo y fotos.',
      steps: [
        'Ingresa a Productos/Servicios > Catálogo.',
        'Presiona "Nuevo Producto" o escanea con la pistola de códigos.',
        'Configura el precio de compra, venta y el stock inicial.'
      ]
    },
    {
      title: '3. Apertura y Cierre de Caja Chica (Arqueo)',
      duration: '2:50 min',
      description: 'Control exacto de dinero en efectivo, ingresos, egresos y corte de turno del cajero.',
      steps: [
        'Abre tu turno con el fondo inicial en Finanzas > Caja Chica.',
        'Registra gastos menores con "Nuevo Egreso".',
        'Al terminar tu turno, realiza el "Cierre de Caja" e imprime el arqueo.'
      ]
    },
    {
      title: '4. Reportes de Ventas y Utilidades',
      duration: '3:15 min',
      description: 'Visualiza tus ganancias netas, productos más vendidos y exporta a Excel en 1 clic.',
      steps: [
        'Entra a Reportes > Reporte de Ventas.',
        'Filtra por fecha, vendedor o método de pago.',
        'Descarga el resumen en PDF o Excel para tu contador.'
      ]
    }
  ];

  return (
    <div className="space-y-6 select-none font-sans pb-12">
      
      {/* ======================================================== */}
      {/* 1. HERO BANNER: VIDEO TUTORIALES TUKIFAC STYLE            */}
      {/* ======================================================== */}
      <div 
        onClick={() => setIsVideoModalOpen(true)}
        className="relative w-full rounded-2xl overflow-hidden cursor-pointer shadow-sm hover:shadow-md transition-all duration-300 group border border-slate-200/80"
        style={{ minHeight: '190px' }}
      >
        {/* Fondo con imagen de tienda cálida + Overlay degradado */}
        <div 
          className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1578916171728-46686eac8d58?auto=format&fit=crop&w=1200&q=80')`
          }}
        />
        
        {/* Capa de oscurecimiento y gradiente para contraste idéntico al screenshot */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40 backdrop-blur-[1px]" />

        {/* Contenido del Banner */}
        <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between h-full min-h-[190px]">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold uppercase tracking-wider mb-2 border border-emerald-500/30">
              <Sparkles className="w-3 h-3 text-emerald-400" />
              <span>Centro de Capacitación</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md">
              Aprende a utilizar {empresa?.nombre ? 'tu sistema' : 'Tukifac'} <br />
              <span className="text-emerald-400">con nuestros tutoriales</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium hidden sm:block">
              Descubre cómo emitir comprobantes, controlar tu stock y cerrar cajas sin errores.
            </p>
          </div>

          {/* Botón Central Play (Estilo exacto de la imagen: círculo translúcido con triángulo blanco) */}
          <div className="shrink-0 pl-4">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-emerald-600 group-hover:border-emerald-500">
              <Play className="w-7 h-7 sm:w-9 sm:h-9 text-white fill-white ml-1 transition-transform group-hover:scale-110" />
            </div>
          </div>
        </div>
      </div>

      {/* ======================================================== */}
      {/* 2. GRID PRINCIPAL DE OPCIONES & HERRAMIENTAS RÁPIDAS      */}
      {/* ======================================================== */}
      <div>
        {/* Encabezados de sección idénticos a la imagen */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-3 px-1">
          <div className="lg:col-span-6">
            <span className="text-xs font-bold text-slate-400">Selecciona una de las opciones</span>
          </div>
          <div className="lg:col-span-6 hidden lg:block">
            <span className="text-xs font-bold text-slate-400">Otras herramientas</span>
          </div>
        </div>

        {/* Layout de Tarjetas */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          
          {/* ────────────────────────────────────────────────────────── */}
          {/* COLUMNA IZQUIERDA (6 Cols): Tarjeta 1 y Tarjeta 2           */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* TARJETA 1: REALIZA UNA VENTA RÁPIDA (Verde menta suave) */}
            <div
              onClick={() => onSelectView('pos')}
              className="group relative rounded-3xl p-6 sm:p-7 bg-[#eaf8ef] border border-emerald-100 hover:border-emerald-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden min-h-[175px] flex justify-between items-center"
            >
              <div className="relative z-10 max-w-[240px]">
                <span className="inline-block px-3 py-0.5 rounded-full bg-white text-emerald-700 text-[11px] font-bold border border-emerald-200 shadow-xs mb-3">
                  Herramienta
                </span>
                <h2 className="text-2xl sm:text-[26px] font-black text-slate-800 leading-tight tracking-tight">
                  <span className="text-[#0284c7]">Realiza una</span> <br />
                  <span className="text-emerald-700">Venta rápida</span>
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Caja táctil, lector de barras y emisión ágil de comprobantes.
                </p>
              </div>

              {/* Ilustración 3D de Mascota POS / Carrito / Dinero */}
              <div className="relative shrink-0 w-32 sm:w-40 h-32 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                  {/* Smartphone / Terminal POS */}
                  <rect x="70" y="25" width="80" height="135" rx="16" fill="#0284c7" />
                  <rect x="76" y="38" width="68" height="100" rx="8" fill="#ffffff" />
                  {/* Pantalla del POS */}
                  <rect x="82" y="46" width="56" height="30" rx="4" fill="#e0f2fe" />
                  <rect x="86" y="52" width="28" height="4" rx="2" fill="#0284c7" />
                  <rect x="86" y="60" width="44" height="3" rx="1.5" fill="#94a3b8" />
                  {/* Mascota Boleta / Factura Sonriente */}
                  <rect x="92" y="70" width="46" height="52" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
                  {/* Ojos y sonrisa de la mascota */}
                  <circle cx="106" cy="88" r="3" fill="#1e293b" />
                  <circle cx="124" cy="88" r="3" fill="#1e293b" />
                  <path d="M107 98 Q115 106 123 98" stroke="#1e293b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  {/* Brazos cruzados saludando */}
                  <path d="M92 95 Q82 92 88 105" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M138 95 Q148 92 142 105" stroke="#0284c7" strokeWidth="3" fill="none" strokeLinecap="round" />
                  {/* Cestita de compras rosada / morada al frente */}
                  <rect x="110" y="125" width="48" height="32" rx="6" fill="#ec4899" />
                  <line x1="114" y1="133" x2="154" y2="133" stroke="#fbcfe8" strokeWidth="2" />
                  <line x1="114" y1="143" x2="154" y2="143" stroke="#fbcfe8" strokeWidth="2" />
                  <line x1="124" y1="125" x2="124" y2="157" stroke="#fbcfe8" strokeWidth="2" />
                  <line x1="144" y1="125" x2="144" y2="157" stroke="#fbcfe8" strokeWidth="2" />
                  {/* Billetes de dinero verde flotando */}
                  <rect x="35" y="105" width="34" height="20" rx="3" fill="#10b981" transform="rotate(-25 35 105)" />
                  <circle cx="48" cy="112" r="3.5" fill="#a7f3d0" />
                  <rect x="42" y="70" width="30" height="18" rx="3" fill="#34d399" transform="rotate(15 42 70)" />
                </svg>
              </div>
            </div>

            {/* TARJETA 2: VER O AGREGAR PRODUCTOS (Amarillo crema suave) */}
            <div
              onClick={() => onSelectView('productos')}
              className="group relative rounded-3xl p-6 sm:p-7 bg-[#fff8e7] border border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden min-h-[175px] flex justify-between items-center"
            >
              {/* Ilustración 3D de Caja de cartón y Mascota sonriente */}
              <div className="relative shrink-0 w-32 sm:w-40 h-32 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 order-2 sm:order-1">
                <svg viewBox="0 0 200 200" className="w-full h-full drop-shadow-md">
                  {/* Comprobante azul flotante arriba a la izquierda */}
                  <rect x="25" y="40" width="42" height="60" rx="5" fill="#60a5fa" />
                  <rect x="32" y="48" width="16" height="4" rx="2" fill="#ffffff" />
                  <rect x="32" y="56" width="28" height="3" rx="1.5" fill="#dbeafe" />
                  <rect x="32" y="63" width="24" height="3" rx="1.5" fill="#dbeafe" />
                  <rect x="32" y="70" width="20" height="3" rx="1.5" fill="#dbeafe" />
                  {/* Caja de cartón marrón */}
                  <rect x="55" y="85" width="75" height="75" rx="8" fill="#f59e0b" />
                  <rect x="55" y="85" width="75" height="12" fill="#d97706" />
                  <line x1="92" y1="85" x2="92" y2="160" stroke="#b45309" strokeWidth="2" strokeDasharray="3,3" />
                  <rect x="68" y="125" width="20" height="12" rx="2" fill="#d97706" opacity="0.6" />
                  {/* Mascota Boleta Blanca Sonriente apoyada en la caja */}
                  <rect x="110" y="65" width="55" height="75" rx="8" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2.5" />
                  {/* Ojos y sonrisa */}
                  <circle cx="126" cy="85" r="4" fill="#0284c7" />
                  <circle cx="148" cy="85" r="4" fill="#0284c7" />
                  <path d="M127 97 Q137 110 148 97" stroke="#1e293b" strokeWidth="3" fill="#1e293b" strokeLinecap="round" />
                  {/* Brazos y patitas */}
                  <path d="M110 95 Q98 100 105 110" stroke="#0284c7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <path d="M165 95 Q175 105 168 115" stroke="#0284c7" strokeWidth="3.5" fill="none" strokeLinecap="round" />
                  <line x1="126" y1="140" x2="126" y2="156" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                  <line x1="148" y1="140" x2="148" y2="156" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                </svg>
              </div>

              <div className="relative z-10 max-w-[240px] text-right order-1 sm:order-2">
                <span className="inline-block px-3 py-0.5 rounded-full bg-white text-amber-700 text-[11px] font-bold border border-amber-200 shadow-xs mb-3">
                  Herramienta
                </span>
                <h2 className="text-2xl sm:text-[26px] font-black text-slate-800 leading-tight tracking-tight">
                  <span className="text-amber-600">Ver o agregar</span> <br />
                  <span className="text-slate-900">Productos</span>
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Control de stock, precios, marcas, categorías y variantes.
                </p>
              </div>
            </div>

          </div>

          {/* ────────────────────────────────────────────────────────── */}
          {/* COLUMNA DERECHA (6 Cols): Tarjetas 3, 4 y 5               */}
          {/* ────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-6 space-y-4">
            
            {/* Fila superior derecha: Tarjeta 3 (Buscar Docs) y Tarjeta 4 (Reportes) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* TARJETA 3: BUSCAR DOCUMENTOS (Gris azulado suave) */}
              <div
                onClick={() => onSelectView('ventas_comprobantes')}
                className="group relative rounded-3xl p-6 bg-[#f0f3f8] border border-slate-200/90 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-bold border border-slate-200 shadow-xs">
                    Herramienta
                  </span>
                </div>

                <div className="my-1">
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    Buscar <br />
                    <span className="text-blue-600">Documentos</span>
                  </h3>
                </div>

                {/* Ilustración 3D de Clipboard con lupa y personaje */}
                <div className="w-full h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <svg viewBox="0 0 160 140" className="w-32 h-28 drop-shadow-sm">
                    {/* Portapapeles azul */}
                    <rect x="35" y="20" width="80" height="95" rx="8" fill="#3b82f6" />
                    {/* Gancho dorado */}
                    <rect x="62" y="12" width="26" height="14" rx="4" fill="#fbbf24" />
                    <circle cx="75" cy="18" r="3" fill="#ffffff" />
                    {/* Hoja blanca con rostro sonriente */}
                    <rect x="42" y="28" width="66" height="80" rx="4" fill="#ffffff" />
                    <circle cx="64" cy="52" r="3" fill="#1e293b" />
                    <circle cx="86" cy="52" r="3" fill="#1e293b" />
                    <path d="M68 62 Q75 70 82 62" stroke="#1e293b" strokeWidth="2" fill="none" strokeLinecap="round" />
                    {/* Líneas de texto */}
                    <line x1="52" y1="76" x2="98" y2="76" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="52" y1="84" x2="98" y2="84" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="52" y1="92" x2="80" y2="92" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
                    {/* Lupa grande en 3D */}
                    <circle cx="105" cy="80" r="18" fill="#e0f2fe" stroke="#0284c7" strokeWidth="4" />
                    <line x1="118" y1="93" x2="132" y2="108" stroke="#0284c7" strokeWidth="6" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

              {/* TARJETA 4: CONSULTAR REPORTES (Lila suave) */}
              <div
                onClick={() => onSelectView('reports')}
                className="group relative rounded-3xl p-6 bg-[#f4f3f9] border border-slate-200/90 hover:border-purple-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[220px]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-purple-700 text-[10px] font-bold border border-purple-200 shadow-xs">
                    Herramienta
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-purple-600 transition-colors" />
                </div>

                <div className="my-1">
                  <h3 className="text-xl font-black text-slate-800 leading-tight">
                    Consultar <br />
                    <span className="text-purple-700">Reportes</span>
                  </h3>
                </div>

                {/* Ilustración 3D de Gráficos de barras y tarta con lupa */}
                <div className="w-full h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <svg viewBox="0 0 160 140" className="w-32 h-28 drop-shadow-sm">
                    {/* Hoja de reporte */}
                    <rect x="35" y="25" width="85" height="95" rx="6" fill="#ffffff" stroke="#e2e8f0" strokeWidth="2" />
                    {/* Barras moradas / fucsia */}
                    <rect x="48" y="75" width="10" height="35" rx="2" fill="#c084fc" />
                    <rect x="63" y="60" width="10" height="50" rx="2" fill="#a855f7" />
                    <rect x="78" y="45" width="10" height="65" rx="2" fill="#7e22ce" />
                    <rect x="93" y="68" width="10" height="42" rx="2" fill="#c084fc" />
                    {/* Tarta / Pie chart flotante */}
                    <circle cx="108" cy="48" r="16" fill="#f43f5e" />
                    <path d="M108 48 L108 32 A16 16 0 0 1 124 48 Z" fill="#fbbf24" />
                    {/* Lupa morada */}
                    <circle cx="45" cy="50" r="16" fill="#ede9fe" stroke="#8b5cf6" strokeWidth="3.5" />
                    <line x1="34" y1="62" x2="24" y2="72" stroke="#8b5cf6" strokeWidth="5" strokeLinecap="round" />
                  </svg>
                </div>
              </div>

            </div>

            {/* TARJETA 5: APERTURA O CIERRE DE CAJAS (Celeste suave horizontal) */}
            <div
              onClick={onOpenCloseCash}
              className="group relative rounded-3xl p-5 bg-[#eaf4fb] border border-sky-200/90 hover:border-sky-400 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex items-center justify-between min-h-[90px]"
            >
              <div>
                <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-sky-700 text-[10px] font-bold border border-sky-200 shadow-xs mb-1.5">
                  Herramienta
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-800 tracking-tight">
                  Apertura o cierre de cajas
                </h3>
              </div>

              <div className="flex items-center gap-2 pr-2">
                <div className="w-11 h-11 rounded-2xl bg-white text-sky-600 border border-sky-200 flex items-center justify-center shadow-xs transition-transform duration-300 group-hover:scale-110 group-hover:bg-sky-600 group-hover:text-white">
                  <Wallet className="w-5 h-5 stroke-current" />
                </div>
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ======================================================== */}
      {/* 3. MODAL DE VIDEO TUTORIALES / CENTRO DE APRENDIZAJE      */}
      {/* ======================================================== */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90vh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500 flex items-center justify-center font-bold text-white shadow-md">
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-white">Tutoriales en Video</h3>
                  <p className="text-xs text-slate-400 font-medium">Guías rápidas para dominar {empresa?.nombre || 'el sistema'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 hover:text-white flex items-center justify-center transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Video Player Mockup / Tutorial Content */}
            <div className="p-6 overflow-y-auto space-y-5">
              
              {/* Pantalla de Reproductor Simulada */}
              <div className="relative rounded-2xl bg-slate-950 aspect-video flex flex-col items-center justify-center text-white overflow-hidden border border-slate-800 shadow-inner">
                <div 
                  className="absolute inset-0 bg-cover bg-center opacity-40"
                  style={{
                    backgroundImage: `url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80')`
                  }}
                />
                <div className="relative z-10 flex flex-col items-center text-center p-6 space-y-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-500/30 animate-pulse">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{tutorials[activeTutorialTab].title}</h4>
                    <p className="text-xs text-slate-300 max-w-md mt-1">{tutorials[activeTutorialTab].description}</p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-emerald-400">
                    Duración: {tutorials[activeTutorialTab].duration}
                  </span>
                </div>
              </div>

              {/* Selector de Tutoriales */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-wider block">
                  Capítulos Disponibles:
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {tutorials.map((tut, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveTutorialTab(idx)}
                      className={`p-3 rounded-xl border text-left transition flex items-start gap-2.5 ${
                        activeTutorialTab === idx 
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold shadow-xs' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                        activeTutorialTab === idx ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                      }`}>
                        {idx + 1}
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold truncate">{tut.title}</p>
                        <p className="text-[10px] text-slate-500">{tut.duration}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Pasos Clave del Tutorial Seleccionado */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <h5 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  Pasos Clave a Seguir:
                </h5>
                <ul className="space-y-1.5">
                  {tutorials[activeTutorialTab].steps.map((st, i) => (
                    <li key={i} className="text-xs text-slate-600 flex items-start gap-2">
                      <span className="w-4 h-4 rounded-full bg-slate-200 text-slate-700 text-[10px] font-bold shrink-0 flex items-center justify-center mt-0.5">
                        {i + 1}
                      </span>
                      <span>{st}</span>
                    </li>
                  ))}
                </ul>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 bg-slate-100 border-t border-slate-200 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-medium">Soporte técnico 24/7 disponible</span>
              <button
                type="button"
                onClick={() => setIsVideoModalOpen(false)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition"
              >
                Cerrar Tutorial
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
