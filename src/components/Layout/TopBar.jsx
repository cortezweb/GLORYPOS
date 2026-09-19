import React, { useState, useEffect, useRef } from 'react';
import { Menu, ScanBarcode, Wifi, Bell, Maximize2, Minimize2, Lock, Cloud, RefreshCw, LogOut, ChevronDown } from 'lucide-react';
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
  onOpenRubroModal
}) {
  const { empresa, currentUser, logout } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [syncState, setSyncState] = useState('idle'); // 'idle' | 'syncing' | 'synced' | 'error'
  const [queueCount, setQueueCount] = useState(0);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

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

  // Refrescar conteo de pendientes cada 15s
  useEffect(() => {
    const refreshCount = () => syncService.getQueueCount().then(setQueueCount).catch(() => {});
    refreshCount();
    const interval = setInterval(refreshCount, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleManualSync = async () => {
    if (syncState === 'syncing') return;
    setSyncState('syncing');
    try {
      const res = await syncService.syncLocalToCloud();
      if (res?.success) {
        setSyncState('synced');
        setTimeout(() => setSyncState('idle'), 3500);
      } else {
        setSyncState('error');
        setTimeout(() => setSyncState('idle'), 4000);
      }
    } catch {
      setSyncState('error');
      setTimeout(() => setSyncState('idle'), 4000);
    }
    // Actualizar badge tras sync
    syncService.getQueueCount().then(setQueueCount).catch(() => {});
  };

  useEffect(() => {
    if (isOnline) {
      syncService.syncLocalToCloud().catch(() => {});
    }
  }, [isOnline]);

  useEffect(() => {
    const handleFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-30 shadow-xs">
      {/* Main App Topbar with Brand Logo and SIAT Badge */}
      <div className="px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <button 
            onClick={onOpenSidebar}
            aria-label="Abrir Menú" 
            className="p-1.5 -ml-1 rounded-lg text-gray-600 hover:bg-gray-100 active:scale-95 transition lg:hidden"
            type="button"
          >
            <Menu className="w-6 h-6 stroke-current stroke-2" />
          </button>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-sm font-black tracking-tight text-[#2563eb]">
                GLORY<span className="text-[#712ae2]">POS</span>
              </span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cf6]"></span>
              <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold bg-indigo-50 text-indigo-700 rounded-full border border-indigo-200">
                <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mr-1 animate-pulse"></span>
                {empresa?.plan_tipo === 'PRO' ? 'SIAT ON' : 'POS ACTIVO'}
              </span>

              {/* Real-time Connection Status Indicator */}
              <span className={`hidden sm:inline-flex items-center px-2 py-0.5 text-[9px] font-bold rounded-full border ${
                isOnline !== false 
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border-amber-300'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full mr-1 ${isOnline !== false ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`}></span>
                {isOnline !== false ? 'En Línea' : 'Offline'}
              </span>

              {/* Supabase Cloud Sync Indicator & Button */}
              <button
                type="button"
                onClick={handleManualSync}
                disabled={syncState === 'syncing' || !isOnline}
                title={
                  syncState === 'syncing'
                    ? 'Sincronizando con Supabase...'
                    : syncState === 'synced'
                      ? 'Datos sincronizados con la nube'
                      : syncState === 'error'
                        ? 'Error al sincronizar con Supabase'
                        : 'Sincronizar datos locales con Supabase (Nube)'
                }
                className={`hidden md:inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold rounded-full border transition cursor-pointer active:scale-95 ${
                  syncState === 'syncing'
                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                    : syncState === 'synced'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                      : syncState === 'error'
                        ? 'bg-rose-50 text-rose-700 border-rose-300'
                        : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border-indigo-200'
                }`}
              >
                {syncState === 'syncing' ? (
                  <RefreshCw className="w-3 h-3 text-blue-600 animate-spin" />
                ) : (
                  <Cloud className={`w-3 h-3 ${syncState === 'synced' ? 'text-emerald-600' : syncState === 'error' ? 'text-rose-500' : 'text-indigo-600'}`} />
                )}
                <span>
                  {syncState === 'syncing' ? 'Sincronizando...' : syncState === 'synced' ? 'Nube OK' : syncState === 'error' ? 'Sync Falló' : 'Sync Nube'}
                </span>
                {/* Badge de registros pendientes */}
                {queueCount > 0 && syncState === 'idle' && (
                  <span className="ml-0.5 bg-amber-500 text-white text-[8px] font-black rounded-full px-1 min-w-[14px] text-center leading-tight py-0.5">
                    {queueCount > 99 ? '99+' : queueCount}
                  </span>
                )}
              </button>

              {/* Rubro Selector Quick Button */}
              {onOpenRubroModal && (
                <button
                  type="button"
                  onClick={onOpenRubroModal}
                  title="Cambiar rubro de negocio"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-black rounded-full bg-slate-100 hover:bg-blue-50 text-slate-800 hover:text-blue-700 border border-slate-300 active:scale-95 transition"
                >
                  <span>
                    {currentRubro === 'FERRETERIA' ? '🔧 Ferretería' :
                     currentRubro === 'FARMACIA' ? '💊 Farmacia' :
                     currentRubro === 'ROPA' ? '👗 Ropa' :
                     currentRubro === 'CARNICERIA' ? '🥩 Carnicería' :
                     currentRubro === 'HELADERIA' ? '🍦 Heladería' : '🏪 Minimarket'}
                  </span>
                  <span className="text-[8px] text-slate-400">▾</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-gray-500 font-medium truncate max-w-[170px]">
              {empresa?.nombre || 'CORPORACIÓN INDUSTRIAL BOLIVIA'}
            </p>
          </div>
        </div>

        {/* Right Quick Actions */}
        <div className="flex items-center space-x-2">
          {/* Cashier Keyboard Shortcuts hints (Desktop) */}
          <div className="hidden xl:flex items-center gap-1.5 text-[10px] font-mono text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg border border-slate-200">
            <span className="bg-white px-1 py-0.2 rounded border shadow-2xs font-bold text-slate-700">F2</span> Buscar
            <span className="text-slate-300">•</span>
            <span className="bg-white px-1 py-0.2 rounded border shadow-2xs font-bold text-blue-700">F4</span> Cobrar
            <span className="text-slate-300">•</span>
            <span className="bg-white px-1 py-0.2 rounded border shadow-2xs font-bold text-amber-700">F8</span> Bloquear
            <span className="text-slate-300">•</span>
            <span className="bg-white px-1 py-0.2 rounded border shadow-2xs font-bold text-slate-700">Esc</span> Salir
          </div>

          {/* Lock Terminal Button */}
          {onLockTerminal && (
            <button
              onClick={onLockTerminal}
              aria-label="Bloquear terminal (F8)"
              title="Bloquear terminal (F8)"
              className="p-1.5 text-gray-600 hover:bg-amber-50 hover:text-amber-700 active:scale-95 rounded-lg transition"
              type="button"
            >
              <Lock className="w-5 h-5" />
            </button>
          )}

          {/* Fullscreen Kiosk Mode Button */}
          <button
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa (Kiosco)"}
            title={isFullscreen ? "Salir de pantalla completa" : "Modo pantalla completa (Kiosco)"}
            className="p-1.5 text-gray-600 hover:bg-gray-100 hover:text-blue-600 active:scale-95 rounded-lg transition"
            type="button"
          >
            {isFullscreen ? (
              <Minimize2 className="w-5 h-5 text-blue-600" />
            ) : (
              <Maximize2 className="w-5 h-5" />
            )}
          </button>

          {/* Notification Icon */}
          <button 
            aria-label="Notificaciones" 
            className="relative p-1.5 text-gray-600 hover:bg-gray-100 rounded-lg" 
            type="button"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-rose-500 rounded-full ring-2 ring-white"></span>
          </button>

          {/* User Profile Avatar & Dropdown Menu */}
          <div className="relative flex items-center gap-1 pl-1 border-l border-slate-200 ml-1" ref={userMenuRef}>
            <button 
              onClick={() => setIsUserMenuOpen(prev => !prev)}
              aria-label="Perfil y Sesión de Usuario" 
              title={`Usuario: ${currentUser?.nombre || 'Carlos Gutiérrez'} (${currentUser?.rol || 'CAJERO'})`}
              className={`flex items-center gap-1.5 p-1 rounded-full transition cursor-pointer ${
                isUserMenuOpen ? 'bg-indigo-50 ring-2 ring-indigo-300' : 'hover:bg-slate-100'
              }`} 
              type="button"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-indigo-100">
                {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'C'}
              </div>
              <div className="hidden xl:flex flex-col items-start leading-none pr-1">
                <span className="text-[11px] font-bold text-slate-800 truncate max-w-[100px]">
                  {currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Cajero'}
                </span>
                <span className="text-[8px] font-extrabold text-blue-600 uppercase">
                  {currentUser?.rol || 'CAJA'}
                </span>
              </div>
              <ChevronDown className={`w-3 h-3 text-slate-400 transition-transform ${isUserMenuOpen ? 'rotate-180 text-blue-600' : ''}`} />
            </button>

            {/* Quick Logout Action (direct, without blocking window.confirm) */}
            <button
              onClick={() => {
                logout();
              }}
              aria-label="Cerrar sesión"
              title="Cerrar sesión inmediatamente"
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
              type="button"
            >
              <LogOut className="w-4 h-4" />
            </button>

            {/* User Profile Popover Dropdown */}
            {isUserMenuOpen && (
              <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 z-50 p-3 animate-fadeIn">
                {/* User Header */}
                <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-white font-bold text-sm flex items-center justify-center shadow-xs">
                    {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'C'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold text-slate-900 truncate">
                      {currentUser?.nombre || 'Carlos Gutiérrez'}
                    </p>
                    <p className="text-[10px] text-slate-500 truncate">
                      {currentUser?.email || 'admin@glorypos.bo'}
                    </p>
                    <span className="inline-block mt-0.5 px-1.5 py-0.2 bg-indigo-50 text-indigo-700 text-[9px] font-black rounded-md border border-indigo-100 uppercase">
                      {currentUser?.rol || 'CAJERO'}
                    </span>
                  </div>
                </div>

                {/* Company info */}
                <div className="py-2 px-1 text-[11px] text-slate-600 border-b border-slate-100 flex items-center justify-between">
                  <span className="text-slate-400">Comercio:</span>
                  <span className="font-bold text-slate-800 truncate max-w-[130px]">{empresa?.nombre || 'GLORYPOS BOLIVIA'}</span>
                </div>

                {/* Lock Terminal shortcut button */}
                {onLockTerminal && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onLockTerminal();
                    }}
                    className="w-full mt-2 flex items-center gap-2 px-2.5 py-2 text-xs font-semibold text-slate-700 hover:bg-amber-50 hover:text-amber-800 rounded-xl transition cursor-pointer"
                  >
                    <Lock className="w-4 h-4 text-amber-600" />
                    <span>Bloquear Terminal (F8)</span>
                  </button>
                )}

                {/* Big Red Logout Button */}
                <button
                  type="button"
                  onClick={() => {
                    setIsUserMenuOpen(false);
                    logout();
                  }}
                  className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white font-bold text-xs rounded-xl border border-rose-200 hover:border-rose-600 transition shadow-xs cursor-pointer"
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
