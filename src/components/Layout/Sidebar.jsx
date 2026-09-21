import React, { useState } from 'react';
import { 
  X, Home, LayoutDashboard, ShoppingCart, ShoppingBag, Globe, 
  Truck, Users, Tag, Boxes, Wallet, Send, FileCode, BarChart3, 
  Settings, Layers, Sparkles, Lock, PlayCircle, LogOut, ChevronDown,
  Calculator, UtensilsCrossed, Pill, BedDouble, Clock, FileText
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
  const { empresa, currentUser, logout, diasRestantes, isExpired, tenantSlug } = useAuth();

  const [expandedMenus, setExpandedMenus] = useState({
    ventas: true,
    productos: false,
    preventa: false,
    compras: false,
    clientes: false,
    inventario: false,
    finanzas: false,
    guias_remision: false,
    comprobantes_pendientes: false,
    documentos_avanzados: false,
    contabilidad: false,
    reportes: false,
    tienda_virtual: false,
    restaurante: false,
    farmacia: false,
    hoteles: false
  });

  if (!isOpen) return null;

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  const isSuperAdmin = tenantSlug === 'admin' || currentUser?.rol === 'SUPERADMIN' || currentUser?.id === 'usr-admin';
  const allowedModules = empresa?.modulos_activos || [
    'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
    'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
    'contabilidad', 'reportes', 'tienda_virtual'
  ];

  const hasModule = (modId) => isSuperAdmin || allowedModules.includes(modId);

  const handleNav = (view) => {
    onClose();
    onSelectView(view);
  };

  return (
    <div className="fixed inset-0 z-50 flex animate-fadeIn font-sans select-none">
      {/* Drawer Backdrop Overlay */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/50 backdrop-blur-xs transition-opacity"
      />

      {/* Navigation Drawer */}
      <aside className="relative z-20 w-[82%] max-w-[320px] h-full bg-white shadow-2xl flex flex-col justify-between border-r border-slate-200 animate-slideRight">
        
        {/* Header */}
        <div className="p-4 pb-3 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center text-white text-base shadow-md shadow-blue-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="flex items-baseline">
                <span className="text-xl font-black tracking-tight text-slate-900">GLORY</span>
                <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-0.5">POS</span>
              </div>
              <h2 className="text-[10px] font-black uppercase text-slate-700 truncate max-w-[180px]">
                {empresa?.nombre || 'GLORYPOS BOLIVIA'}
              </h2>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1 text-xs font-semibold">
          
          {/* Inicio */}
          <button
            type="button"
            onClick={() => handleNav('inicio')}
            className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-bold transition text-left ${
              currentView === 'inicio' ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20' : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>Inicio</span>
          </button>

          {/* Superadmin SaaS */}
          {isSuperAdmin && (
            <button
              type="button"
              onClick={() => handleNav('superadmin')}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition text-left ${
                ['superadmin', 'admin_dashboard'].includes(currentView) ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white font-bold shadow-sm' : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <LayoutDashboard className={`w-4 h-4 ${['superadmin', 'admin_dashboard'].includes(currentView) ? 'text-indigo-400' : 'text-indigo-600'}`} />
                <span>Admin dashboard</span>
              </div>
              <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
                SaaS
              </span>
            </button>
          )}

          {/* Preventa */}
          {hasModule('preventa') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('preventa')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <FileCode className="w-4 h-4 text-slate-500" />
                  <span>Preventa</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.preventa ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.preventa && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('ventas_cotizaciones')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Cotizaciones
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Ventas */}
          {hasModule('ventas') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('ventas')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-slate-500" />
                  <span>Ventas</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.ventas ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.ventas && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('pos')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Punto de Venta (POS)
                  </button>
                  <button type="button" onClick={() => handleNav('nuevo_comprobante')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Nuevo Comprobante
                  </button>
                  <button type="button" onClick={() => handleNav('ventas_comprobantes')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Consulta de Comprobantes
                  </button>
                  <button type="button" onClick={() => handleNav('ventas_notas')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Notas de Venta
                  </button>
                  <button type="button" onClick={() => handleNav('cuentas_por_cobrar')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Cuentas por Cobrar
                  </button>
                  <button type="button" onClick={() => handleNav('pedidos_web')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Pedidos Web
                  </button>
                  <button type="button" onClick={() => handleNav('membresias')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Membresías
                  </button>
                  <button type="button" onClick={() => handleNav('ventas_caja')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Mis Cajas (Turnos)
                  </button>
                  <button type="button" onClick={() => handleNav('reporte_cajas')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reporte de Cajas
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Compras */}
          {hasModule('compras') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('compras')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <ShoppingBag className="w-4 h-4 text-slate-500" />
                  <span>Compras</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.compras ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.compras && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('nueva_compra')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Nueva Compra
                  </button>
                  <button type="button" onClick={() => handleNav('purchases')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Compras
                  </button>
                  <button type="button" onClick={() => handleNav('proveedores')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Proveedores
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Clientes */}
          {hasModule('clientes') && (
            <button type="button" onClick={() => handleNav('clients')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <Users className="w-4 h-4 text-slate-500" />
              <span>Clientes</span>
            </button>
          )}

          {/* Productos/Servicios (Acordeón) */}
          {hasModule('productos') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('productos')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Tag className="w-4 h-4 text-slate-500" />
                  <span>Productos</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.productos ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.productos && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('productos')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Productos
                  </button>
                  <button type="button" onClick={() => handleNav('combos_promociones')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Combos y Promociones
                  </button>
                  <button type="button" onClick={() => handleNav('servicios')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Servicios
                  </button>
                  <button type="button" onClick={() => handleNav('categorias')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Categorías
                  </button>
                  <button type="button" onClick={() => handleNav('marcas')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Marcas
                  </button>
                  <button type="button" onClick={() => handleNav('unidades_medida')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Unidades de medida
                  </button>
                  <button type="button" onClick={() => handleNav('inventory')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Stock & Kardex
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Inventario */}
          {hasModule('inventario') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('inventario')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Boxes className="w-4 h-4 text-slate-500" />
                  <span>Inventario</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.inventario ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.inventario && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('movimientos')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Movimientos
                  </button>
                  <button type="button" onClick={() => handleNav('transferencias')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Transferencias
                  </button>
                  <button type="button" onClick={() => handleNav('historial_transferencias')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Historial de transferencias
                  </button>
                  <button type="button" onClick={() => handleNav('kardex')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Kardex
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Finanzas */}
          {hasModule('finanzas') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('finanzas')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Wallet className="w-4 h-4 text-slate-500" />
                  <span>Finanzas</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.finanzas ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.finanzas && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('sesiones_caja')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Caja
                  </button>
                  <button type="button" onClick={() => handleNav('ingresos')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Ingresos
                  </button>
                  <button type="button" onClick={() => handleNav('egresos')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Egresos
                  </button>
                  <button type="button" onClick={() => handleNav('cuentas_bancarias')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Cuentas Bancarias
                  </button>
                  <button type="button" onClick={() => handleNav('cuentas_por_cobrar_finanzas')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Cuentas por cobrar
                  </button>
                  <button type="button" onClick={() => handleNav('cuentas_por_pagar')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Cuentas por pagar
                  </button>
                  <button type="button" onClick={() => handleNav('reportes_caja_finanzas')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reportes de caja
                  </button>
                  <button type="button" onClick={() => handleNav('metodos_pago')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Métodos de pago
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Guías de remisión */}
          {hasModule('guias_remision') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('guias_remision')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Send className="w-4 h-4 text-slate-500" />
                  <span>Guías de remisión</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.guias_remision ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.guias_remision && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('guias_remitente')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Remitente (09)
                  </button>
                  <button type="button" onClick={() => handleNav('guias_transportista')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Transportista (31)
                  </button>
                  <button type="button" onClick={() => handleNav('transportistas_gre')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Transportistas
                  </button>
                  <button type="button" onClick={() => handleNav('conductores_gre')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Conductores
                  </button>
                  <button type="button" onClick={() => handleNav('vehiculos_gre')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Vehículos
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Comprobantes pendientes */}
          {hasModule('comprobantes_pendientes') && (
            <button type="button" onClick={() => handleNav('comprobantes_pendientes')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <Clock className="w-4 h-4 text-slate-500" />
              <span>Comprobantes pendientes</span>
            </button>
          )}

          {/* Comprobantes avanzados */}
          {hasModule('documentos_avanzados') && (
            <button type="button" onClick={() => handleNav('documentos_avanzados')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <FileCode className="w-4 h-4 text-slate-500" />
              <span>Comprobantes avanzados</span>
            </button>
          )}

          {/* Contabilidad */}
          {hasModule('contabilidad') && (
            <button type="button" onClick={() => handleNav('contabilidad')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <Calculator className="w-4 h-4 text-slate-500" />
              <span>Contabilidad</span>
            </button>
          )}

          {/* Reportes (Acordeón) */}
          {hasModule('reportes') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('reportes')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <BarChart3 className="w-4 h-4 text-slate-500" />
                  <span>Reportes</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.reportes ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.reportes && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('reporte_ventas')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reporte de Ventas
                  </button>
                  <button type="button" onClick={() => handleNav('reporte_productos')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reporte de Productos
                  </button>
                  <button type="button" onClick={() => handleNav('ventas_por_producto')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Ventas por Producto
                  </button>
                  <button type="button" onClick={() => handleNav('reporte_compras')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reporte de Compras
                  </button>
                  <button type="button" onClick={() => handleNav('reporte_kardex')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reporte de Kardex
                  </button>
                  <button type="button" onClick={() => handleNav('reporte_caja')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Reporte de Caja
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Tienda Virtual (Acordeón) */}
          {hasModule('tienda_virtual') && (
            <div>
              <button
                type="button"
                onClick={() => toggleMenu('tienda_virtual')}
                className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100"
              >
                <div className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-slate-500" />
                  <span>Tienda Virtual</span>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${expandedMenus.tienda_virtual ? 'rotate-180' : ''}`} />
              </button>
              {expandedMenus.tienda_virtual && (
                <div className="pl-8 pr-2 py-1 space-y-0.5">
                  <button type="button" onClick={() => handleNav('tienda_virtual')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Catálogo Online Web
                  </button>
                  <button type="button" onClick={() => handleNav('pedidos_web')} className="w-full text-left py-1 text-[11px] text-slate-600 hover:text-emerald-600">
                    • Pedidos Web
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Restaurante */}
          {hasModule('restaurante') && (
            <button type="button" onClick={() => handleNav('restaurante')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <UtensilsCrossed className="w-4 h-4 text-slate-500" />
              <span>Restaurante</span>
            </button>
          )}

          {/* Farmacia */}
          {hasModule('farmacia') && (
            <button type="button" onClick={() => handleNav('farmacia')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <Pill className="w-4 h-4 text-slate-500" />
              <span>Farmacia</span>
            </button>
          )}

          {/* Hoteles */}
          {hasModule('hoteles') && (
            <button type="button" onClick={() => handleNav('hoteles')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100">
              <BedDouble className="w-4 h-4 text-slate-500" />
              <span>Hoteles</span>
            </button>
          )}

        </nav>

        {/* Footer */}
        <div className="p-3 border-t border-slate-100 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center">
              {currentUser?.nombre?.charAt(0) || 'U'}
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">{currentUser?.nombre || 'Usuario'}</p>
              <p className="text-[10px] text-slate-400">{currentUser?.rol || 'OPERADOR'}</p>
            </div>
          </div>
          <button type="button" onClick={logout} className="p-1.5 text-slate-400 hover:text-rose-600">
            <LogOut className="w-4 h-4" />
          </button>
        </div>

      </aside>
    </div>
  );
}
