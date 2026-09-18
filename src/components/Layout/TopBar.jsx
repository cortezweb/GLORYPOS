import React, { useState, useEffect } from 'react';
import { Menu, ScanBarcode, Wifi, Bell, Maximize2, Minimize2, Lock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

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
  const { empresa } = useAuth();
  const [isFullscreen, setIsFullscreen] = useState(false);

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

          {/* User Profile Avatar */}
          <button 
            onClick={onOpenSidebar}
            aria-label="Perfil de Cajero" 
            className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-violet-600 text-white font-bold text-xs flex items-center justify-center shadow-xs ring-2 ring-indigo-100" 
            type="button"
          >
            {empresa?.nombre ? empresa.nombre.charAt(0).toUpperCase() : 'T'}
          </button>
        </div>
      </div>
    </header>
  );
}
