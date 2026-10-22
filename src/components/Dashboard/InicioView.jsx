import React, { useState } from 'react';
import { 
  Play, ShoppingCart, Tag, FileText, BarChart3, Wallet, 
  ArrowUpRight, Sparkles, CheckCircle2, HelpCircle, X, ExternalLink,
  Store, ChevronRight, ShieldCheck, Clock
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import GloryMascota from '../Common/GloryMascota';

// Mascota con un ícono de la herramienta flotando a su lado
function MascotaHerramienta({ mood, Icon, color, fondo, size = 120 }) {
  return (
    <div className="relative">
      <div className={`absolute inset-x-2 bottom-1 top-4 rounded-full ${fondo}`} />
      <GloryMascota mood={mood} size={size} animated={false} className="relative" />
      <div className={`absolute -top-1 -right-2 w-10 h-10 rounded-2xl bg-white border border-slate-200 shadow-md flex items-center justify-center ${color} rotate-6`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

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
      {/* 1. HERO BANNER: VIDEO TUTORIALES GLORYPOS                 */}
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
        
        {/* Capa de oscurecimiento y gradiente para contraste */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/85 via-black/60 to-black/40 backdrop-blur-[1px]" />

        {/* Contenido del Banner */}
        <div className="relative z-10 p-6 sm:p-8 flex items-center justify-between h-full min-h-[190px]">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[#FF6B35]/20 text-[#FFB627] text-[10px] font-bold uppercase tracking-wider mb-2 border border-[#FF6B35]/30">
              <Sparkles className="w-3 h-3 text-[#FFB627]" />
              <span>Centro de Capacitación GLORYPOS</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-display font-bold text-white tracking-tight leading-tight drop-shadow-md">
              Aprende a utilizar {empresa?.nombre ? 'tu sistema' : 'GLORYPOS'} <br />
              <span className="text-[#FF6B35]">con nuestros tutoriales</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-2 font-medium hidden sm:block">
              Descubre cómo emitir comprobantes, controlar tu stock y cerrar cajas sin errores.
            </p>
          </div>

          {/* Botón Central Play (Estilo exacto de la imagen: círculo translúcido con triángulo blanco) */}
          <div className="shrink-0 pl-4 flex items-center gap-4">
            <div className="hidden md:block relative -mb-8 self-end">
              <GloryMascota mood="saludo" size={150} />
            </div>
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full border-2 border-white/80 bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-2xl transition-all duration-300 group-hover:scale-110 group-hover:bg-[#FF6B35] group-hover:border-[#FF6B35]">
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
              className="group relative rounded-3xl p-6 sm:p-7 bg-[#E6F6F3] border border-[#2BB3A3]/15 hover:border-[#FF6B35]/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden min-h-[175px] flex justify-between items-center"
            >
              <div className="relative z-10 max-w-[240px]">
                <span className="inline-block px-3 py-0.5 rounded-full bg-white text-[#E85B28] text-[11px] font-bold border border-[#FF6B35]/20 shadow-xs mb-3">
                  Herramienta
                </span>
                <h2 className="text-2xl sm:text-[26px] font-display font-bold text-slate-800 leading-tight tracking-tight">
                  <span className="text-[#1F2128]">Realiza una</span> <br />
                  <span className="text-[#E85B28]">Venta rápida</span>
                </h2>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Caja táctil, lector de barras y emisión ágil de comprobantes.
                </p>
              </div>

              {/* Mascota celebrando la venta */}
              <div className="relative shrink-0 w-32 sm:w-40 h-32 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                <MascotaHerramienta mood="celebra" Icon={ShoppingCart} color="text-[#2BB3A3]" fondo="bg-[#2BB3A3]/15" />
              </div>
            </div>

            {/* TARJETA 2: VER O AGREGAR PRODUCTOS (Amarillo crema suave) */}
            <div
              onClick={() => onSelectView('productos')}
              className="group relative rounded-3xl p-6 sm:p-7 bg-[#fff8e7] border border-amber-100 hover:border-amber-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden min-h-[175px] flex justify-between items-center"
            >
              {/* Mascota con etiqueta de producto */}
              <div className="relative shrink-0 w-32 sm:w-40 h-32 flex items-center justify-center transition-transform duration-300 group-hover:scale-105 order-2 sm:order-1">
                <MascotaHerramienta mood="feliz" Icon={Tag} color="text-[#E8A317]" fondo="bg-[#FFC94D]/25" />
              </div>

              <div className="relative z-10 max-w-[240px] text-right order-1 sm:order-2">
                <span className="inline-block px-3 py-0.5 rounded-full bg-white text-amber-700 text-[11px] font-bold border border-amber-200 shadow-xs mb-3">
                  Herramienta
                </span>
                <h2 className="text-2xl sm:text-[26px] font-display font-bold text-slate-800 leading-tight tracking-tight">
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
            
            {/* Título de sección en móvil */}
            <div className="lg:hidden px-1 pt-1">
              <span className="text-xs font-bold text-slate-400">Otras herramientas</span>
            </div>

            {/* Fila superior derecha: Tarjeta 3 (Buscar Docs) y Tarjeta 4 (Reportes) */}
            <div className="grid grid-cols-2 gap-3 sm:gap-4">
              
              {/* TARJETA 3: BUSCAR DOCUMENTOS (Gris azulado suave) */}
              <div
                onClick={() => onSelectView('ventas_comprobantes')}
                className="group relative rounded-3xl p-4 sm:p-6 bg-[#f0f3f8] border border-slate-200/90 hover:border-blue-300 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-bold border border-slate-200 shadow-xs">
                    Herramienta
                  </span>
                </div>

                <div className="my-1">
                  <h3 className="text-xl font-display font-bold text-slate-800 leading-tight">
                    Buscar <br />
                    <span className="text-[#FF6B35]">Documentos</span>
                  </h3>
                </div>

                {/* Mascota buscando documentos */}
                <div className="w-full h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <MascotaHerramienta mood="pensando" Icon={FileText} color="text-[#FF6B35]" fondo="bg-[#FF6B35]/10" size={104} />
                </div>
              </div>

              {/* TARJETA 4: CONSULTAR REPORTES (Lila suave) */}
              <div
                onClick={() => onSelectView('reports')}
                className="group relative rounded-3xl p-4 sm:p-6 bg-[#f4f3f9] border border-slate-200/90 hover:border-[#FFB627]/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between min-h-[190px] sm:min-h-[220px]"
              >
                <div className="flex items-center justify-between">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-[#FF6B35] text-[10px] font-bold border border-[#FFB627]/20 shadow-xs">
                    Herramienta
                  </span>
                  <ArrowUpRight className="w-4 h-4 text-slate-400 group-hover:text-[#1E2022] transition-colors" />
                </div>

                <div className="my-1">
                  <h3 className="text-xl font-display font-bold text-slate-800 leading-tight">
                    Consultar <br />
                    <span className="text-[#FF6B35]">Reportes</span>
                  </h3>
                </div>

                {/* Mascota con reportes */}
                <div className="w-full h-28 flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
                  <MascotaHerramienta mood="feliz" Icon={BarChart3} color="text-[#F2668B]" fondo="bg-[#F2668B]/15" size={104} />
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
                <h3 className="text-lg sm:text-xl font-display font-bold text-slate-800 tracking-tight">
                  Apertura o cierre de cajas
                </h3>
              </div>

              <div className="flex items-center gap-3 pr-2">
                <GloryMascota mood="saludo" size={64} animated={false} className="hidden sm:block -my-2" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fadeIn overflow-y-auto [&>*]:my-auto">
          <div className="bg-white w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col max-h-[90dvh]">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-[#FF6B35] flex items-center justify-center font-bold text-white shadow-md">
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
                  <div className="w-16 h-16 rounded-full bg-[#FF6B35] text-white flex items-center justify-center shadow-lg shadow-[#FF6B35]/30 animate-pulse">
                    <Play className="w-8 h-8 fill-white ml-1" />
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-white">{tutorials[activeTutorialTab].title}</h4>
                    <p className="text-xs text-slate-300 max-w-md mt-1">{tutorials[activeTutorialTab].description}</p>
                  </div>
                  <span className="text-[11px] font-mono px-2.5 py-1 rounded-full bg-black/60 border border-white/20 text-[#FFB627]">
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
                          ? 'bg-[#FF6B35]/10 border-[#FF6B35] text-[#1E2022] font-bold shadow-xs' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className={`w-6 h-6 rounded-lg shrink-0 flex items-center justify-center text-xs ${
                        activeTutorialTab === idx ? 'bg-[#FF6B35] text-white' : 'bg-slate-200 text-slate-600'
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
                  <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" />
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





