import React from 'react';
import { 
  Home, LayoutDashboard, ShoppingCart, ShoppingBag, Globe, 
  Truck, Users, Tag, Boxes, Wallet, Send, FileCode, BarChart3, 
  Settings, Layers, Sparkles, Lock, PlayCircle, LogOut, ChevronRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DesktopSidebar({ 
  currentView, 
  onSelectView, 
  onOpenCloseCash, 
  onOpenDesktopDashboard,
  onOpenRubroModal,
  currentRubro
}) {
  const { empresa, diasRestantes, isExpired, cambiarPlan, setTrialDays, simularVencimiento } = useAuth();
  const initialLetter = (empresa?.propietario || empresa?.nombre || 'G').charAt(0).toUpperCase();

  const menuItems = [
    { id: 'inicio', label: 'Inicio', icon: Home, action: () => onSelectView('pos') },
    { id: 'rubro', label: `Rubro: ${currentRubro === 'FERRETERIA' ? 'Ferretería' : currentRubro === 'FARMACIA' ? 'Farmacia' : currentRubro === 'ROPA' ? 'Ropa & Calzado' : currentRubro === 'CARNICERIA' ? 'Carnicería' : currentRubro === 'HELADERIA' ? 'Heladería' : 'Minimarket'}`, icon: Sparkles, action: onOpenRubroModal, highlight: true },
    { id: 'admin_dashboard', label: 'Admin dashboard', icon: LayoutDashboard, action: onOpenDesktopDashboard },
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
    { id: 'subscription', label: 'Planes & Suscripción', icon: Sparkles, action: () => onSelectView('subscription'), badge: `${diasRestantes}d` },
  ];

  const [isVentasExpanded, setIsVentasExpanded] = React.useState(true);

  const ventasSubItems = [
    { id: 'ventas_caja', label: 'Caja Chica / Turno', view: 'ventas_caja' },
    { id: 'pos', label: 'Nueva Venta', view: 'pos' },
    { id: 'ventas_comprobantes', label: 'Comprobantes Emitidos', view: 'ventas_comprobantes' },
    { id: 'ventas_notas', label: 'Notas de Venta', view: 'ventas_notas' },
    { id: 'ventas_cotizaciones', label: 'Cotizaciones / Pedidos', view: 'ventas_cotizaciones' },
  ];

  return (
    <aside className="w-64 bg-white border-r border-gray-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden lg:flex select-none z-30">
      {/* Header */}
      <div className="p-4 pb-3 border-b border-gray-100">
        <div className="flex items-center space-x-1 mb-1">
          <span className="text-2xl font-black tracking-tight text-[#2563eb]">GLORY</span>
          <span className="text-2xl font-black tracking-tight text-[#712ae2]">POS</span>
          <span className="inline-block w-2 h-2 rounded-full bg-[#8b5cf6] ml-0.5 self-end mb-1"></span>
        </div>
        
        <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-400 truncate">
          {empresa?.nombre || 'CORPORACIÓN INDUSTRIAL BOLIVIA'}
        </h2>
        <div className="flex items-center gap-1.5 mt-1">
          <span className="text-[10px] text-gray-500 font-medium">NIT: {empresa?.nit_ci}</span>
          <span className="text-[10px] text-gray-300">•</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${
            isExpired ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-800'
          }`}>
            {isExpired ? 'Vencido' : `${diasRestantes} días`}
          </span>
        </div>
      </div>

      {/* Navigation Links (Full List) */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-0.5 text-xs font-semibold no-scrollbar">
        {menuItems.map((item) => {
          const Icon = item.icon;

          // Special Accordion Submenu for 'pos' (Ventas)
          if (item.id === 'pos') {
            return (
              <div key="desktop_ventas_accordion" className="rounded-xl bg-blue-50/50 border border-blue-100 overflow-hidden my-1">
                <button
                  type="button"
                  onClick={() => setIsVentasExpanded(!isVentasExpanded)}
                  className="w-full flex items-center justify-between px-3 py-2 bg-blue-50 text-[#2563eb] font-semibold transition text-left"
                >
                  <div className="flex items-center space-x-2.5">
                    <Icon className="w-4 h-4 text-[#2563eb]" />
                    <span>Ventas</span>
                  </div>
                  <svg 
                    className={`w-3.5 h-3.5 text-[#2563eb] stroke-current transition-transform duration-200 ${
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
                  <div className="pl-6 pr-2 py-1 space-y-0.5 bg-white/80 border-t border-blue-50">
                    {ventasSubItems.map((sub) => {
                      const isSubActive = currentView === sub.view;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => onSelectView(sub.view)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[11px] transition text-left ${
                            isSubActive
                              ? 'bg-gradient-to-r from-[#2563eb] to-[#7c3aed] text-white font-semibold shadow-xs'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          <div className="flex items-center space-x-2">
                            {isSubActive ? (
                              <svg className="w-3 h-3 stroke-current flex-shrink-0" fill="none" strokeWidth="2.5" viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            ) : (
                              <span className="w-1.5 h-1.5 rounded-full bg-gray-400"></span>
                            )}
                            <span>{sub.label}</span>
                          </div>
                          {isSubActive && (
                            <span className="text-[9px] bg-white/20 px-1 py-0.2 rounded font-bold uppercase tracking-wider">
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
              onClick={item.action}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                isActive
                  ? 'bg-gradient-to-r from-blue-50 to-indigo-50/80 text-[#2563eb] border border-blue-100/60 shadow-xs font-bold'
                  : 'text-gray-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <div className="flex items-center space-x-2.5">
                <Icon className={`w-4 h-4 ${isActive ? 'text-[#2563eb]' : 'text-gray-400'}`} />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}

        {/* Tutoriales en YouTube banner */}
        <div className="pt-2 pb-1">
          <a 
            href="https://youtube.com" 
            target="_blank" 
            rel="noreferrer"
            className="flex items-center space-x-2.5 p-2 rounded-xl bg-violet-50/70 hover:bg-violet-100/70 border border-violet-100 transition"
          >
            <div className="w-6 h-6 rounded-lg bg-[#ba1a1a] flex items-center justify-center flex-shrink-0 text-white shadow-xs">
              <PlayCircle className="w-4 h-4 fill-white text-[#ba1a1a]" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-bold text-gray-900 leading-tight">Tutoriales en YouTube</p>
            </div>
          </a>
        </div>
      </nav>

      {/* Footer Profile & Logout */}
      <footer className="p-3 border-t border-gray-100 bg-gray-50/60">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#2563eb] to-[#8b5cf6] text-white flex items-center justify-center font-bold text-xs shadow-xs">
              {initialLetter}
            </div>
            <div className="leading-tight min-w-0">
              <p className="text-xs font-bold text-gray-900 truncate max-w-[120px]">
                {empresa?.propietario || 'Carlos Gutiérrez'}
              </p>
              <p className="text-[10px] text-gray-400 font-medium">Administrador</p>
            </div>
          </div>

          <button
            onClick={onOpenCloseCash}
            className="p-1.5 text-gray-400 hover:text-rose-600 transition"
            title="Cerrar Turno / Sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </footer>
    </aside>
  );
}
