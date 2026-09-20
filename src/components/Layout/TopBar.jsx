import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, ScanBarcode, Wifi, Bell, Maximize2, Minimize2, Lock, 
  Cloud, RefreshCw, LogOut, ChevronDown, MessageSquare, ShoppingCart, 
  CheckCircle2, ChevronLeft, FileText, ShoppingBag, Store, ExternalLink
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
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const userMenuRef = useRef(null);

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
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
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

  const initials = currentUser?.nombre 
    ? currentUser.nombre.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
    : 'AD';

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 font-sans select-none shadow-xs">
      
      {/* ── TOP BANNER SUPERIOR (GLORYPOS SAAS) ── */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-blue-100 text-[10px] font-bold py-1 px-4 flex items-center justify-center tracking-wider uppercase font-mono border-b border-blue-900/40 shadow-xs">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span>
          <span>WWW.GLORYPOS.COM — PLATAFORMA CLOUD DE FACTURACIÓN & PUNTO DE VENTA</span>
        </div>
      </div>

      {/* ── MAIN TOPBAR BARRA PRINCIPAL ── */}
      <div className="px-3 sm:px-5 py-2 flex items-center justify-between gap-3">
        
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

          {/* Campana de Notificaciones con Badge */}
          <button
            type="button"
            title="Avisos del sistema"
            onClick={() => alert('No hay comprobantes pendientes en cola de contingencia.')}
            className="relative p-2 rounded-xl text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 px-1 min-w-[16px] h-4 rounded-full bg-blue-600 text-white text-[9px] font-black flex items-center justify-center shadow-xs">
              0
            </span>
          </button>

          {/* Avatar del Usuario */}
          <div className="relative" ref={userMenuRef}>
            <button
              type="button"
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs flex items-center justify-center border border-blue-200 transition cursor-pointer shadow-xs"
              title={`${currentUser?.nombre || 'Administrador'} (${currentUser?.rol || 'ADMIN'})`}
            >
              {initials}
            </button>

            {/* Dropdown de Sesión */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-3 animate-fadeIn">
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-sm flex items-center justify-center shadow-sm">
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.nombre || 'Administrador'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate font-mono">
                      {currentUser?.email || 'admin@glorypos.com'}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-blue-50 text-blue-700 text-[9px] font-bold rounded">
                      {currentUser?.rol || 'SUPERADMIN'}
                    </span>
                  </div>
                </div>

                <div className="py-2 px-1 text-[11px] text-slate-600 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400">Empresa:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[130px]">{empresa?.nombre || 'DEMO'}</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs rounded-xl transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </div>

        </div>

      </div>

    </header>
  );
}
