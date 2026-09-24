import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, ScanBarcode, Wifi, Bell, Maximize2, Minimize2, Lock, 
  Cloud, RefreshCw, LogOut, ChevronDown, MessageSquare, ShoppingCart, 
  CheckCircle2, ChevronLeft, FileText, ShoppingBag, Store, ExternalLink, Clock,
  User, Settings, Headphones, Building2, X
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { syncService } from '../../services/syncService';

export default function TopBar({ 
  onOpenSidebar, 
  onOpenScanner, 
  searchTerm, 
  setSearchTerm, 
  isOnline,
  onLockTerminal,
  currentRubro,
  onOpenRubroModal,
  onSelectView
}) {
  const { empresa, currentUser, logout } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const userMenuRef = useRef(null);
  const mobileUserMenuRef = useRef(null);

  // Reloj y fecha en vivo para la cabecera móvil (idéntico a la imagen)
  const [currentDateTime, setCurrentDateTime] = useState(() => {
    const now = new Date();
    return {
      date: now.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
      time: now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true })
    };
  });

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setCurrentDateTime({
        date: now.toLocaleDateString('es-BO', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' }),
        time: now.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: true })
      });
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const onSyncDone = () => {
      setLastSyncTime(new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }));
    };
    window.addEventListener('glorypos_sync_completed', onSyncDone);
    return () => window.removeEventListener('glorypos_sync_completed', onSyncDone);
  }, []);

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const res = await syncService.syncLocalToCloud();
      if (res.success) {
        setLastSyncTime(new Date().toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit' }));
      }
    } catch (e) {
      console.warn(e);
    } finally {
      setIsSyncing(false);
    }
  };

  // Cerrar menú de usuario al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (e) => {
      const inDesktop = userMenuRef.current && userMenuRef.current.contains(e.target);
      const inMobile = mobileUserMenuRef.current && mobileUserMenuRef.current.contains(e.target);
      if (!inDesktop && !inMobile) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSupportClick = () => {
    const phone = '59177012345';
    const msg = encodeURIComponent(`Hola soporte de ${empresa?.nombre || 'GLORYPOS'}, necesito asistencia con mi cuenta.`);
    window.open(`https://wa.me/${phone}?text=${msg}`, '_blank');
  };

  const userDisplayName = currentUser?.nombre || 'Esteffany Cordova';
  const userInitial = userDisplayName.trim().charAt(0).toUpperCase() || 'E';
  const initials = currentUser?.nombre 
    ? currentUser.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'EC';

  const renderUserDropdown = () => (
    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 p-3.5 animate-fadeIn">
      {/* Encabezado: SUCURSAL */}
      <div className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-1.5 px-0.5">
        SUCURSAL
      </div>

      {/* Caja Sucursal activa */}
      <div 
        onClick={() => {
          alert(`Sucursal activa: ${empresa?.sucursal_activa || 'Principal'} (Casa Matriz)`);
        }}
        className="flex items-center gap-2.5 px-3 py-2 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 transition cursor-pointer mb-2.5 shadow-2xs group"
        title="Clic para ver detalles de sucursal"
      >
        <Building2 className="w-4 h-4 text-slate-400 group-hover:text-slate-600 shrink-0" />
        <span className="text-xs font-semibold text-slate-700 truncate">
          {empresa?.sucursal_activa || 'Principal'}
        </span>
      </div>

      {/* Lista de enlaces: Perfil, Ajustes, Soporte */}
      <div className="space-y-0.5">
        {/* Perfil (Ícono verde exacto a la imagen adjunta) */}
        <button
          type="button"
          onClick={() => {
            setIsUserMenuOpen(false);
            setIsProfileModalOpen(true);
          }}
          className="w-full flex items-center gap-3 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer text-left"
        >
          <User className="w-4 h-4 text-[#10b981] shrink-0" />
          <span>Perfil</span>
        </button>

        {/* Ajustes */}
        <button
          type="button"
          onClick={() => {
            setIsUserMenuOpen(false);
            if (onSelectView) onSelectView('configuracion');
          }}
          className="w-full flex items-center gap-3 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer text-left"
        >
          <Settings className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Ajustes</span>
        </button>

        {/* Soporte */}
        <button
          type="button"
          onClick={() => {
            setIsUserMenuOpen(false);
            handleSupportClick();
          }}
          className="w-full flex items-center gap-3 px-2.5 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 rounded-xl transition cursor-pointer text-left"
        >
          <Headphones className="w-4 h-4 text-slate-500 shrink-0" />
          <span>Soporte</span>
        </button>
      </div>

      {/* Línea divisoria */}
      <div className="border-t border-slate-100 my-2"></div>

      {/* Etiqueta de versión */}
      <div className="text-[11px] text-slate-400 font-normal px-2.5 py-0.5 select-none font-mono">
        v2.0.1
      </div>

      {/* Cerrar sesión */}
      <button
        type="button"
        onClick={() => {
          setIsUserMenuOpen(false);
          logout();
        }}
        className="w-full flex items-center gap-3 px-2.5 py-2 text-xs font-medium text-slate-700 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer text-left mt-0.5 group"
      >
        <LogOut className="w-4 h-4 text-slate-500 group-hover:text-rose-600 shrink-0" />
        <span>Cerrar sesión</span>
      </button>
    </div>
  );

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 font-sans select-none shadow-xs">
      
      {/* ── MOBILE HEADER (IDÉNTICO A LAS 5 CAPTURAS DE LA IMAGEN) ── */}
      <div className="lg:hidden px-3.5 py-2.5 flex items-center justify-between bg-white border-b border-slate-100 shadow-2xs">
        
        {/* Izquierda: Reloj + Fecha en 2 líneas */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center shrink-0 shadow-2xs">
            <Clock className="w-4 h-4 text-slate-700" />
          </div>
          <div className="flex flex-col text-left leading-tight">
            <span className="text-[10px] text-slate-500 font-semibold capitalize truncate max-w-[125px]">
              {currentDateTime.date}
            </span>
            <span className="text-xs font-black text-slate-900 font-mono tracking-tight">
              {currentDateTime.time}
            </span>
          </div>
        </div>

        {/* Centro: Cápsula Verde de Suscripción (Idéntica a la imagen) */}
        <div 
          onClick={() => onSelectView && onSelectView('subscription')}
          className="flex flex-col items-center justify-center px-3 py-1 rounded-xl bg-[#eaf8ef] border border-emerald-400 text-center leading-tight cursor-pointer shadow-2xs active:scale-98 max-w-[155px]"
        >
          <span className="text-[9px] font-black text-emerald-800 tracking-tight whitespace-nowrap">
            Plan: {empresa?.plan_tipo === 'TRIAL' ? 'Ilimitado (Trial)' : (empresa?.plan_tipo || 'Ilimitado')}
          </span>
          <span className="text-[8px] font-bold text-emerald-700 whitespace-nowrap">
            Estado de cobro: Al corriente
          </span>
        </div>

        {/* Derecha: Notificaciones + Avatar Perfil + Botón Hamburguesa de Menú */}
        <div className="flex items-center gap-1.5">
          {/* Campana Móvil con Badge Naranja */}
          <button
            type="button"
            title="8 Notificaciones del sistema"
            onClick={() => alert('Tienes 8 avisos del sistema: 3 comprobantes emitidos, 5 alertas de inventario.')}
            className="relative p-1.5 rounded-xl text-slate-600 hover:bg-slate-100 transition cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-600 stroke-[1.8]" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-[16px] px-0.5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center shadow-xs border border-white">
              8
            </span>
          </button>

          {/* Menú de Perfil Móvil */}
          <div className="relative" ref={mobileUserMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-1 p-1 rounded-xl hover:bg-slate-100 transition cursor-pointer"
              title={userDisplayName}
            >
              <div className="w-7 h-7 rounded-full bg-[#10b981] text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {userInitial}
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isUserMenuOpen && renderUserDropdown()}
          </div>

          {/* Botón Hamburguesa de Menú */}
          <button 
            onClick={onOpenSidebar}
            aria-label="Abrir Menú" 
            className="w-8 h-8 rounded-xl flex items-center justify-center text-slate-800 hover:bg-slate-100 active:scale-95 transition cursor-pointer"
            type="button"
          >
            <Menu className="w-5 h-5 stroke-[2.2]" />
          </button>
        </div>
      </div>

      {/* ── DESKTOP TOP BANNER SUPERIOR ── */}
      <div className="hidden lg:flex bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-blue-100 text-[10px] font-bold py-1 px-4 items-center justify-center tracking-wider uppercase font-mono border-b border-blue-900/40 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          <span>WWW.GLORYPOS.COM — PLATAFORMA CLOUD DE FACTURACIÓN & PUNTO DE VENTA</span>
        </div>
      </div>

      {/* ── DESKTOP MAIN TOPBAR BARRA PRINCIPAL ── */}
      <div className="hidden lg:flex px-5 py-2 items-center justify-between gap-3">
        
        {/* Left Section: Toggle, Shortcuts NC/NV/POS & Subscription Status */}
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          
          {/* Mobile Menu Button */}
          <button 
            onClick={onOpenSidebar}
            aria-label="Abrir Menú" 
            className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition lg:hidden"
            type="button"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Desktop Back / Collapse Chevron */}
          <button
            type="button"
            onClick={() => onSelectView && onSelectView('inicio')}
            title="Ir a Inicio"
            className="hidden lg:flex items-center justify-center w-7 h-7 rounded-lg border border-slate-200 text-slate-400 hover:text-slate-800 hover:bg-slate-50 transition"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          {/* Direct Document Shortcuts: NC | NV | POS (Exact from Image) */}
          <div className="flex items-center gap-1 sm:gap-1.5">
            
            {/* NC: Nota de Crédito */}
            <button
              type="button"
              onClick={() => onSelectView && onSelectView('ventas_comprobantes')}
              title="Emitir o buscar Nota de Crédito"
              className="flex flex-col items-center justify-center px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[9px] font-black uppercase mt-0.5">NC</span>
            </button>

            {/* NV: Nota de Venta */}
            <button
              type="button"
              onClick={() => onSelectView && onSelectView('ventas_notas')}
              title="Emitir Nota de Venta rápida"
              className="flex flex-col items-center justify-center px-2 py-1 rounded-lg border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/50 text-slate-700 transition"
            >
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[9px] font-black uppercase mt-0.5">NV</span>
            </button>

            {/* POS: Punto de Venta */}
            <button
              type="button"
              onClick={() => onSelectView && onSelectView('pos')}
              title="Abrir Terminal de Ventas (F4)"
              className="flex flex-col items-center justify-center px-2.5 py-1 rounded-lg border border-emerald-500 bg-emerald-50 text-emerald-800 transition font-bold shadow-xs"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-600" />
              <span className="text-[9px] font-black uppercase mt-0.5">POS</span>
            </button>

          </div>

          {/* Plan & Payment Status Card (Exact from Image) */}
          <div className="hidden md:flex flex-col border border-slate-200 rounded-xl px-2.5 py-1 bg-slate-50/70 text-left leading-tight">
            <span className="text-[10px] font-black text-emerald-600">
              Plan: {empresa?.plan_tipo === 'TRIAL' ? 'Ilimitado (Trial)' : (empresa?.plan_tipo || 'Ilimitado')}
            </span>
            <span className="text-[9px] font-bold text-slate-700">
              Estás al día en tus pagos
            </span>
            <span className="text-[8px] text-slate-400">
              Fecha de pago: Al corriente
            </span>
          </div>

        </div>

        {/* Right Section: Soporte, Modo Demo, Carrito, Notificaciones, Avatar */}
        <div className="flex items-center gap-2 sm:gap-3">
          
          {/* Botón: Soporte WhatsApp */}
          <button
            type="button"
            onClick={handleSupportClick}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition active:scale-95 cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5 fill-white" />
            <span className="hidden sm:inline">Soporte</span>
          </button>

          {/* Sincronización Nube Cloud Status */}
          <button
            type="button"
            onClick={handleManualSync}
            disabled={isSyncing}
            title={lastSyncTime ? `Último respaldo en la nube: ${lastSyncTime}. Clic para sincronizar.` : 'Sincronizar datos con la nube Supabase'}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200 hover:border-emerald-500 bg-slate-50 hover:bg-emerald-50/50 text-slate-700 text-xs font-bold transition shadow-2xs cursor-pointer active:scale-95"
          >
            <Cloud className={`w-3.5 h-3.5 ${isSyncing ? 'text-blue-500 animate-spin' : 'text-emerald-600'}`} />
            <span className="text-[10px] font-extrabold text-slate-700">
              {isSyncing ? 'Sincronizando...' : (lastSyncTime ? `Nube: ${lastSyncTime}` : 'Nube OK')}
            </span>
          </button>

          {/* Insignia Azul: Modo DEMO Conectado a SUNAT/SIAT (Exact from Image) */}
          <div className="hidden sm:flex flex-col items-end px-2.5 py-1 rounded-xl bg-blue-700 text-white font-sans text-right leading-tight shadow-xs">
            <span className="text-[10px] font-black tracking-tight">
              Modo: DEMO
            </span>
            <span className="text-[8px] font-medium text-blue-100 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              Conectado a SUNAT/SIAT
            </span>
          </div>

          {/* Carrito de Compras con Badge (0) */}
          <button
            type="button"
            onClick={() => onSelectView && onSelectView('pos')}
            title="Carrito de compras"
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-slate-900 text-white text-[9px] font-black flex items-center justify-center">
              0
            </span>
          </button>

          {/* Campana de Notificaciones con Badge Naranja (Exacto a la imagen) */}
          <button
            type="button"
            title="8 Notificaciones del sistema"
            onClick={() => alert('Tienes 8 avisos del sistema: 3 comprobantes emitidos, 5 alertas de inventario.')}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition cursor-pointer"
          >
            <Bell className="w-5 h-5 text-slate-600 stroke-[1.8]" />
            <span className="absolute -top-0.5 -right-0.5 min-w-[17px] h-[17px] px-1 rounded-full bg-amber-500 text-white text-[10px] font-black flex items-center justify-center shadow-xs border-2 border-white">
              8
            </span>
          </button>

          {/* Menú de Perfil de Usuario (Estructura idéntica a la imagen adjunta) */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100/80 transition cursor-pointer select-none"
              title={`${userDisplayName} (${currentUser?.rol || 'ADMIN'})`}
            >
              {/* Círculo verde con la inicial */}
              <div className="w-8 h-8 rounded-full bg-[#10b981] text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                {userInitial}
              </div>
              {/* Nombre de usuario truncado */}
              <span className="hidden sm:inline-block text-xs sm:text-sm font-semibold text-slate-700 max-w-[125px] truncate text-left">
                {userDisplayName}
              </span>
              {/* Flecha Chevron hacia abajo */}
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200 ${isUserMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown flotante (Exacto al diseño de la imagen adjunta) */}
            {isUserMenuOpen && renderUserDropdown()}
          </div>

        </div>

      </div>

      {/* ── MODAL: MI PERFIL DE USUARIO ── */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 w-full max-w-md overflow-hidden animate-scaleUp">
            {/* Header del Modal */}
            <div className="relative p-6 pb-5 bg-gradient-to-br from-emerald-600 to-teal-700 text-white">
              <button
                type="button"
                onClick={() => setIsProfileModalOpen(false)}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-white text-emerald-700 font-black text-2xl flex items-center justify-center shadow-lg">
                  {userInitial}
                </div>
                <div>
                  <h3 className="text-lg font-black leading-tight text-white">
                    {userDisplayName}
                  </h3>
                  <p className="text-xs text-emerald-100 font-medium">
                    {currentUser?.email || 'admin@glorypos.com'}
                  </p>
                  <span className="inline-block mt-1.5 px-2 py-0.5 bg-emerald-500/40 text-emerald-100 text-[10px] font-bold rounded-full uppercase tracking-wider border border-white/20">
                    {currentUser?.rol || 'SUPERADMIN'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contenido del Perfil */}
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Sucursal</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 flex items-center gap-1.5 truncate">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    {empresa?.sucursal_activa || 'Principal'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Empresa</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 truncate" title={empresa?.nombre || 'GLORYPOS'}>
                    {empresa?.nombre || 'GLORYPOS'}
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Plataforma</span>
                  <p className="text-xs font-bold text-slate-800 mt-0.5 font-mono">
                    GLORYPOS v2.0.1
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Estado</span>
                  <p className="text-xs font-bold text-emerald-600 mt-0.5 flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    Activo / Conectado
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    if (onSelectView) onSelectView('configuracion');
                  }}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition cursor-pointer flex items-center justify-center gap-2"
                >
                  <Settings className="w-4 h-4 text-slate-500" />
                  <span>Ajustes de cuenta</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsProfileModalOpen(false);
                    logout();
                  }}
                  className="py-2.5 px-4 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar sesión</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </header>
  );
}
