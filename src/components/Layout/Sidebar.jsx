import React from 'react';
import { 
  X, Home, LayoutDashboard, ShoppingCart, ShoppingBag, Globe, 
  Truck, Users, Tag, Boxes, Wallet, Send, FileCode, BarChart3, 
  Settings, Layers, Sparkles, Lock, PlayCircle, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Sidebar({ 
  isOpen, 
  onClose, 
  currentView, 
  onSelectView, 
  onOpenCloseCash, 
  onOpenDesktopDashboard,
  onOpenRubroModal,
  currentRubro
}) {
  const { empresa, currentUser, logout, diasRestantes, isExpired, cambiarPlan, setTrialDays, simularVencimiento } = useAuth();

  if (!isOpen) return null;

  const initialLetter = (currentUser?.nombre || empresa?.propietario || empresa?.nombre || 'G').charAt(0).toUpperCase();

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home, action: () => { onClose(); onSelectView('inicio'); } },
    { id: 'rubro', label: `Rubro: ${currentRubro === 'FERRETERIA' ? 'Ferretería' : currentRubro === 'FARMACIA' ? 'Farmacia' : currentRubro === 'ROPA' ? 'Ropa & Calzado' : currentRubro === 'CARNICERIA' ? 'Carnicería' : currentRubro === 'HELADERIA' ? 'Heladería' : 'Minimarket'}`, icon: Sparkles, action: onOpenRubroModal, highlight: true },
    { id: 'admin_dashboard', label: 'Admin dashboard', icon: LayoutDashboard, action: () => { onClose(); onSelectView('superadmin'); }, badge: 'SaaS' },
    { id: 'preventa', label: 'Pre venta', icon: FileCode, action: () => onSelectView('ventas_cotizaciones') },
    { id: 'pos', label: 'Ventas', icon: ShoppingCart, action: () => onSelectView('pos') },
    { id: 'tienda_virtual', label: 'Tienda virtual', icon: Globe, action: () => onSelectView('tienda_virtual') },
    { id: 'purchases', label: 'Compras', icon: ShoppingBag, action: () => onSelectView('purchases') },
    { id: 'clients', label: 'Clientes', icon: Users, action: () => onSelectView('clients') },
    { id: 'productos', label: 'Productos', icon: Tag, action: () => onSelectView('productos') },
    { id: 'inventory', label: 'Inventario', icon: Boxes, action: () => onSelectView('inventory') },
    { id: 'finanzas', label: 'Finanzas', icon: Wallet, action: () => onSelectView('finanzas') },
    { id: 'guias_remision', label: 'Guías de remisión', icon: Send, action: () => onSelectView('guias_remision') },
    { id: 'documentos_avanzados', label: 'Documentos avanzados', icon: FileCode, action: () => onSelectView('documentos_avanzados') },
    { id: 'reports', label: 'Reportes', icon: BarChart3, action: () => onSelectView('reports') },
    { id: 'administracion', label: 'Administración', icon: Settings, action: () => onSelectView('administracion') },
    { id: 'modulos', label: 'Módulos', icon: Layers, action: () => onSelectView('modulos') },
    { id: 'subscription', label: 'Planes & Suscripción', icon: Sparkles, action: () => onSelectView('subscription') },
  ];

  const isVentasActive = ['pos', 'ventas_caja', 'ventas_comprobantes', 'ventas_notas', 'ventas_cotizaciones', 'sales'].includes(currentView);
  const [isVentasExpanded, setIsVentasExpanded] = React.useState(true);

  const ventasSubItems = [
    { id: 'ventas_caja', label: 'Caja Chica / Turno', view: 'ventas_caja' },
    { id: 'pos', label: 'Nueva Venta', view: 'pos' },
    { id: 'ventas_comprobantes', label: 'Comprobantes Emitidos', view: 'ventas_comprobantes' },
    { id: 'ventas_notas', label: 'Notas de Venta', view: 'ventas_notas' },
    { id: 'ventas_cotizaciones', label: 'Cotizaciones / Pedidos', view: 'ventas_cotizaciones' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn">
      {/* Drawer Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs transition-opacity"
        data-purpose="drawer-backdrop"
      />

      {/* Navigation Drawer */}
      <aside 
        className="relative z-20 w-[82%] max-w-[340px] h-full bg-white shadow-2xl flex flex-col justify-between border-r border-gray-200 animate-slideRight"
        data-purpose="sidebar-drawer-menu"
      >
        {/* Drawer Header */}
        <div className="p-4 pb-3 border-b border-gray-100">
          <div className="flex items-center justify-between mb-1.5">
            {/* Brand Logo GLORYPOS */}
            <div className="flex items-center space-x-0.5">
              <span className="text-2xl font-black tracking-tight text-[#2563eb]">GLORY</span>
              <span className="text-2xl font-black tracking-tight text-[#712ae2]">POS</span>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#8b5cf6] ml-0.5 self-end mb-1.5"></span>
            </div>

            {/* Close Button */}
            <button 
              onClick={onClose}
              aria-label="Cerrar menú" 
              className="w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition"
            >
              <X className="w-5 h-5 stroke-current stroke-2" />
            </button>
          </div>

          {/* Business details */}
          <div className="pt-0.5">
            <h2 className="text-[10px] uppercase font-bold tracking-wider text-gray-400 leading-tight truncate">
              {empresa?.nombre || 'CORPORACIÓN INDUSTRIAL BOLIVIA'}
            </h2>
            <div className="flex items-center gap-1.5 mt-1">
              <span className="text-[10px] text-gray-500 font-medium">NIT/CI: {empresa?.nit_ci || '8472910014'}</span>
              <span className="text-[10px] text-gray-300">•</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-md ${
                isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
              }`}>
                {isExpired ? 'Vencido' : `${diasRestantes} días`}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Items List (100% Complete Stitch Options) */}
        <nav 
          className="flex-1 overflow-y-auto py-2 px-3 space-y-0.5 text-[13px] font-medium text-gray-600 no-scrollbar"
          data-purpose="drawer-menu-links"
        >
          {menuItems.map((item) => {
            const Icon = item.icon;
            
            // Special Accordion Submenu for 'pos' (Ventas)
            if (item.id === 'pos') {
              return (
                <div key="ventas_accordion" className="rounded-xl bg-blue-50/50 border border-blue-100 overflow-hidden my-1">
                  <button
                    type="button"
                    onClick={() => setIsVentasExpanded(!isVentasExpanded)}
                    className="w-full flex items-center justify-between px-3 py-2.5 bg-blue-50 text-[#2563eb] font-semibold transition"
                  >
                    <div className="flex items-center space-x-3.5">
                      <Icon className="w-5 h-5 text-[#2563eb] stroke-current flex-shrink-0" />
                      <span>Ventas</span>
                    </div>
                    <svg 
                      className={`w-4 h-4 text-[#2563eb] stroke-current transition-transform duration-200 ${
                        isVentasExpanded ? 'rotate-180' : ''
                      }`} 
                      fill="none" 
                      strokeWidth="2" 
                      viewBox="0 0 24 24"
                    >
                      <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>

                  {isVentasExpanded && (
                    <div className="pl-6 pr-2 py-1.5 space-y-1 bg-white/70 border-t border-blue-50">
                      {ventasSubItems.map((sub) => {
                        const isSubActive = currentView === sub.view;
                        return (
                          <button
                            key={sub.id}
                            onClick={() => {
                              onSelectView(sub.view);
                              onClose();
                            }}
                            className={`w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition text-left ${
                              isSubActive
                                ? 'bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-semibold shadow-sm shadow-blue-500/20'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            <div className="flex items-center space-x-2.5">
                              {isSubActive ? (
                                <svg className="w-3.5 h-3.5 stroke-current flex-shrink-0" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                                  <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                              )}
                              <span>{sub.label}</span>
                            </div>
                            {isSubActive && (
                              <span className="text-[10px] bg-white/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                Activo
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            const isActive = currentView === item.id || (item.id === 'inicio' && currentView === 'pos');
            return (
              <button
                key={item.id}
                onClick={() => {
                  item.action();
                  onClose();
                }}
                className={`w-full flex items-center space-x-3.5 px-3 py-2 rounded-xl transition text-left ${
                  isActive
                    ? 'bg-gradient-to-r from-blue-50 to-indigo-50/80 text-[#2563eb] font-semibold border border-blue-100/60'
                    : 'hover:bg-slate-50 text-gray-600'
                }`}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 stroke-[1.8] ${isActive ? 'text-[#2563eb]' : 'text-gray-400'}`} />
                <span className={isActive ? 'text-[#2563eb] font-bold' : ''}>{item.label}</span>
              </button>
            );
          })}

          {/* Tutoriales en YouTube banner */}
          <div className="pt-2 pb-1">
            <a 
              href="https://youtube.com" 
              target="_blank" 
              rel="noreferrer"
              className="flex items-center space-x-3 p-2.5 rounded-xl bg-violet-50/70 hover:bg-violet-100/70 border border-violet-100 transition"
            >
              <div className="w-8 h-8 rounded-lg bg-[#ba1a1a] flex items-center justify-center flex-shrink-0 text-white shadow-xs">
                <PlayCircle className="w-5 h-5 fill-white text-[#ba1a1a]" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-gray-900 leading-tight">Tutoriales en YouTube</p>
                <p className="text-[10px] text-gray-500 line-clamp-1">Aprende a usar el sistema</p>
              </div>
            </a>
          </div>

          {/* Quick SaaS Simulator */}
          <div className="p-2 bg-slate-50 rounded-xl border border-slate-200 text-[11px] space-y-1 mt-2">
            <span className="font-bold text-slate-400 uppercase text-[9px] block">Simulador SaaS</span>
            <div className="grid grid-cols-2 gap-1 text-[10px]">
              <button
                onClick={() => setTrialDays(30)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-blue-50 font-medium text-center truncate"
              >
                Prueba 30d
              </button>
              <button
                onClick={() => cambiarPlan(empresa?.plan_tipo === 'PRO' ? 'TRIAL' : 'PRO')}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-slate-700 hover:bg-blue-50 font-medium text-center truncate"
              >
                {empresa?.plan_tipo === 'PRO' ? 'Trial' : 'Plan PRO'}
              </button>
            </div>
          </div>
        </nav>

        {/* Drawer Footer User Profile */}
        <footer 
          className="p-3 border-t border-gray-100 bg-gray-50/50" 
          data-purpose="drawer-footer-user-profile"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#8b5cf6] text-white flex items-center justify-center font-bold text-sm shadow-xs shadow-indigo-500/20">
                {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : initialLetter}
              </div>
              <div className="leading-snug">
                <p className="text-xs font-bold text-gray-900 tracking-tight truncate max-w-[150px]">
                  {currentUser?.nombre || empresa?.propietario || 'Carlos Gutiérrez'}
                </p>
                <p className="text-[11px] text-gray-400 font-medium">
                  {currentUser?.rol ? (currentUser.rol === 'ADMIN' ? 'Administrador' : 'Cajero Activo') : 'Administrador'}
                </p>
              </div>
            </div>

            <button 
              onClick={() => { 
                onClose(); 
                logout(); 
              }}
              aria-label="Cerrar Sesión" 
              className="p-2 text-gray-400 hover:text-red-500 transition rounded-lg hover:bg-rose-50 cursor-pointer" 
              title="Cerrar Sesión"
            >
              <LogOut className="w-5 h-5 stroke-[1.8]" />
            </button>
          </div>
        </footer>
      </aside>
    </div>
  );
}
