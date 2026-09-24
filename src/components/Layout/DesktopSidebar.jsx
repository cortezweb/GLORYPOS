import React, { useState, useEffect } from 'react';
import { 
  Home, LayoutDashboard, ShoppingCart, ShoppingBag, Globe, 
  Truck, Users, Tag, Boxes, Wallet, Send, FileCode, BarChart3, 
  Settings, Layers, Sparkles, Lock, PlayCircle, LogOut, ChevronDown, ChevronRight,
  Calculator, UtensilsCrossed, Pill, BedDouble, Clock, FileText, LayoutGrid, ShieldCheck
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
  const { empresa, currentUser, logout, diasRestantes, isExpired, tenantSlug } = useAuth();

  // Estado de apertura de los acordeones del menú lateral
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
    administracion: false,
    tienda_virtual: false,
    restaurante: false,
    farmacia: false,
    hoteles: false
  });

  const toggleMenu = (menuId) => {
    setExpandedMenus(prev => ({ ...prev, [menuId]: !prev[menuId] }));
  };

  // Permisos: Superadmin ve todo; cliente ve módulos activos + módulos estándar
  const isSuperAdmin = tenantSlug === 'admin' || currentUser?.rol === 'SUPERADMIN' || currentUser?.id === 'usr-admin';
  const allowedModules = empresa?.modulos_activos || [
    'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
    'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
    'contabilidad', 'reportes', 'administracion', 'modulos', 'tienda_virtual'
  ];

  const hasModule = (modId) => {
    if (isSuperAdmin) return true;
    const alwaysVisible = [
      'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
      'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
      'contabilidad', 'reportes', 'administracion', 'modulos'
    ];
    if (alwaysVisible.includes(modId)) return true;
    return allowedModules.includes(modId);
  };

  // Auto-expandir el menú si la vista actual pertenece a ese módulo
  useEffect(() => {
    if (['pos', 'ventas_comprobantes', 'ventas_notas', 'ventas_caja'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, ventas: true }));
    } else if (['productos'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, productos: true }));
    } else if (['ventas_cotizaciones', 'cotizaciones', 'preventa'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, preventa: true }));
    } else if (['reports', 'reportes', 'reporte_ventas', 'reporte_productos', 'ventas_por_producto', 'reporte_ventas_producto', 'reporte_compras', 'reporte_notas', 'notas_credito_debito', 'reporte_kardex', 'reporte_caja', 'reporte_cajas', 'reportes_caja_finanzas'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, reportes: true }));
    } else if (['tienda_virtual', 'catalogo_online', 'tienda'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, tienda_virtual: true }));
    } else if (['finanzas', 'caja', 'sesiones_caja', 'ingresos', 'egresos', 'cuentas_bancarias', 'cuentas_por_cobrar', 'cuentas_por_pagar', 'reportes_caja', 'metodos_pago'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, finanzas: true }));
    } else if (['guias_remision', 'guias_remitente', 'guias_transportista', 'transportistas_gre', 'transportistas', 'conductores_gre', 'conductores', 'vehiculos_gre', 'vehiculos'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, guias_remision: true }));
    } else if (['documentos_avanzados', 'retenciones', 'percepciones', 'reversiones', 'documentos'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, documentos_avanzados: true }));
    } else if (['administracion', 'admin', 'roles_permisos', 'admin_roles', 'usuarios', 'admin_usuarios'].includes(currentView)) {
      setExpandedMenus(prev => ({ ...prev, administracion: true }));
    }
  }, [currentView]);

  return (
    <aside className="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 h-screen sticky top-0 hidden lg:flex select-none z-30 font-sans shadow-xs">
      
      {/* ── 1. HEADER: BRAND LOGO & NOMBRE DE EMPRESA (GLORYPOS SAAS) ── */}
      <div className="p-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2.5 mb-2 cursor-pointer" onClick={() => onSelectView('inicio')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 flex items-center justify-center font-black text-white shadow-md shadow-blue-500/20 group hover:scale-105 transition-transform">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-baseline">
              <span className="text-2xl font-black tracking-tight text-slate-900">GLORY</span>
              <span className="text-2xl font-black tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent ml-0.5">POS</span>
            </div>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block -mt-1">
              Cloud System
            </span>
          </div>
        </div>
        
        {/* Nombre de la empresa en mayúsculas idéntico al screenshot */}
        <h2 className="text-[11px] font-black uppercase tracking-tight text-slate-800 truncate leading-snug">
          {empresa?.nombre || 'GLORYPOS BOLIVIA S.R.L.'}
        </h2>
        <div className="flex items-center gap-1.5 mt-0.5">
          <span className="text-[10px] text-slate-400 font-mono">NIT: {empresa?.nit_ci || '8472910014'}</span>
          <span className="text-[10px] text-slate-300">•</span>
          <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-1.5 py-0.2 rounded">
            {empresa?.plan_tipo || 'PRO'}
          </span>
        </div>
      </div>

      {/* ── 2. NAVEGACIÓN PRINCIPAL ── */}
      <nav className="flex-1 overflow-y-auto p-2.5 space-y-1 text-xs font-semibold no-scrollbar">
        
        {/* 1. INICIO */}
        <button
          type="button"
          onClick={() => onSelectView('inicio')}
          className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition font-bold text-left ${
            currentView === 'inicio'
              ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
          }`}
        >
          <Home className="w-4 h-4" />
          <span>Inicio</span>
        </button>

        {/* 2. ADMIN DASHBOARD (Consola SaaS para SuperAdmin) */}
        {isSuperAdmin && (
          <button
            type="button"
            onClick={() => onSelectView('superadmin')}
            className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
              ['superadmin', 'admin_dashboard', 'dashboard'].includes(currentView)
                ? 'bg-gradient-to-r from-slate-900 to-indigo-950 text-white font-bold shadow-sm'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <div className="flex items-center gap-2.5">
              <LayoutDashboard className={`w-4 h-4 ${['superadmin', 'admin_dashboard', 'dashboard'].includes(currentView) ? 'text-indigo-400' : 'text-indigo-600'}`} />
              <span>Admin dashboard</span>
            </div>
            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-800 font-mono">
              SaaS
            </span>
          </button>
        )}

        {/* 3. PREVENTA (Acordeón con Cotizaciones y Pedidos) */}
        {hasModule('preventa') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('preventa')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-slate-500" />
                <span>Preventa</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.preventa ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.preventa && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('ventas_cotizaciones')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['ventas_cotizaciones', 'cotizaciones'].includes(currentView)
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Cotizaciones / Pedidos
                </button>
              </div>
            )}
          </div>
        )}

        {/* 4. VENTAS (Acordeón con Nueva Venta POS, Comprobantes, Notas, Caja) */}
        {hasModule('ventas') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('ventas')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <FileText className="w-4 h-4 text-slate-500" />
                <span>Ventas</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.ventas ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.ventas && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('pos')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'pos'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Punto de Venta (POS)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('nuevo_comprobante')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'nuevo_comprobante'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Nuevo Comprobante
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('ventas_comprobantes')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['ventas_comprobantes', 'comprobantes'].includes(currentView)
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Consulta de Comprobantes
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('ventas_notas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['ventas_notas', 'notas_venta'].includes(currentView)
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Notas de Venta
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('cuentas_por_cobrar')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'cuentas_por_cobrar'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Cuentas por Cobrar
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('pedidos_web')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'pedidos_web'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Pedidos Web
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('membresias')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'membresias'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Membresías
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('ventas_caja')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'ventas_caja'
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Mis Cajas (Turnos)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_cajas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['reporte_cajas', 'reporte_caja'].includes(currentView)
                      ? 'bg-emerald-50 text-emerald-700 font-bold'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reporte de Cajas
                </button>
              </div>
            )}
          </div>
        )}

        {/* 5. COMPRAS (Acordeón) */}
        {hasModule('compras') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('compras')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 text-slate-500" />
                <span>Compras</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.compras ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.compras && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('nueva_compra')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'nueva_compra' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Nueva Compra
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('purchases')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['purchases', 'compras'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Compras
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('proveedores')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'proveedores' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Proveedores
                </button>
              </div>
            )}
          </div>
        )}

        {/* 6. CLIENTES (Acordeón) */}
        {hasModule('clientes') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('clientes')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Clientes</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.clientes ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.clientes && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('clients')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'clients' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Directorio de Clientes
                </button>
              </div>
            )}
          </div>
        )}

        {/* 7. PRODUCTOS / SERVICIOS (Acordeón) */}
        {hasModule('productos') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('productos')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Tag className="w-4 h-4 text-slate-500" />
                <span>Productos/Servicios</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.productos ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.productos && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('productos')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['productos', 'products'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Productos
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('combos_promociones')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['combos_promociones', 'combos', 'promociones'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Combos y Promociones
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('servicios')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['servicios', 'services'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Servicios
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('categorias')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['categorias', 'categorias_marcas'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Categorías
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('marcas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'marcas' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Marcas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('unidades_medida')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['unidades_medida', 'unidades'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Unidades de medida
                </button>
              </div>
            )}
          </div>
        )}

        {/* 8. INVENTARIO (Acordeón) */}
        {hasModule('inventario') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('inventario')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Boxes className="w-4 h-4 text-slate-500" />
                <span>Inventario</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.inventario ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.inventario && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('movimientos')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['movimientos', 'inventory', 'inventario', 'inventario_movimientos'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Movimientos
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('transferencias')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['transferencias', 'inventario_transferencias'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Transferencias
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('historial_transferencias')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['historial_transferencias', 'inventario_historial_transferencias'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Historial de transferencias
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('kardex')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['kardex', 'inventario_kardex'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Kardex
                </button>
              </div>
            )}
          </div>
        )}

        {/* 9. FINANZAS (Acordeón) */}
        {hasModule('finanzas') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('finanzas')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Wallet className="w-4 h-4 text-slate-500" />
                <span>Finanzas</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.finanzas ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.finanzas && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('sesiones_caja')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['sesiones_caja', 'finanzas'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Caja
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('ingresos')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'ingresos' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Ingresos
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('egresos')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'egresos' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Egresos
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('cuentas_bancarias')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'cuentas_bancarias' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Cuentas Bancarias
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('cuentas_por_cobrar_finanzas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'cuentas_por_cobrar_finanzas' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Cuentas por cobrar
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('cuentas_por_pagar')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'cuentas_por_pagar' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Cuentas por pagar
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reportes_caja_finanzas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'reportes_caja_finanzas' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reportes de caja
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('metodos_pago')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'metodos_pago' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Métodos de pago
                </button>
              </div>
            )}
          </div>
        )}

        {/* 10. GUÍAS DE REMISIÓN (Acordeón) */}
        {hasModule('guias_remision') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('guias_remision')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Send className="w-4 h-4 text-slate-500" />
                <span>Guías de remisión</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.guias_remision ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.guias_remision && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('guias_remitente')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['guias_remitente', 'guias_remision', 'guias'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Remitente (09)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('guias_transportista')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'guias_transportista' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Transportista (31)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('transportistas_gre')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['transportistas_gre', 'transportistas'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Transportistas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('conductores_gre')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['conductores_gre', 'conductores'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Conductores
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('vehiculos_gre')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['vehiculos_gre', 'vehiculos'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Vehículos
                </button>
              </div>
            )}
          </div>
        )}

        {/* 11. COMPROBANTES PENDIENTES (Acordeón) */}
        {hasModule('comprobantes_pendientes') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('comprobantes_pendientes')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Clock className="w-4 h-4 text-slate-500" />
                <span>Comprobantes pendientes</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.comprobantes_pendientes ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.comprobantes_pendientes && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('comprobantes_pendientes')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'comprobantes_pendientes' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Cola Offline & Contingencia
                </button>
              </div>
            )}
          </div>
        )}

        {/* 12. DOCUMENTOS AVANZADOS (Acordeón exacto a media_1790120030276.png) */}
        {hasModule('documentos_avanzados') && (
          <div>
            <button
              type="button"
              onClick={() => {
                toggleMenu('documentos_avanzados');
                onSelectView('documentos_avanzados');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                ['documentos_avanzados', 'retenciones', 'percepciones', 'reversiones', 'documentos'].includes(currentView)
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <FileCode className="w-4 h-4 text-slate-500" />
                <span>Documentos avanzados</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.documentos_avanzados ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.documentos_avanzados && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('retenciones')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['retenciones', 'documentos_avanzados', 'documentos'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Retenciones
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('percepciones')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'percepciones' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Percepciones
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reversiones')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'reversiones' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reversiones
                </button>
              </div>
            )}
          </div>
        )}

        {/* 13. CONTABILIDAD (Acordeón) */}
        {hasModule('contabilidad') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('contabilidad')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-slate-500" />
                <span>Contabilidad</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.contabilidad ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.contabilidad && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('contabilidad')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'contabilidad' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Libros Oficiales SIAT/PLE
                </button>
              </div>
            )}
          </div>
        )}

        {/* 14. REPORTES (Acordeón) */}
        {hasModule('reportes') && (
          <div>
            <button
              type="button"
              onClick={() => {
                toggleMenu('reportes');
                onSelectView('reporte_ventas');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                ['reports', 'reportes', 'reporte_ventas', 'reporte_productos', 'ventas_por_producto', 'reporte_ventas_producto', 'reporte_compras', 'reporte_notas', 'notas_credito_debito', 'reporte_kardex', 'reporte_caja', 'reporte_cajas', 'reportes_caja_finanzas'].includes(currentView)
                  ? 'bg-slate-100 text-slate-900 font-bold'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <BarChart3 className="w-4 h-4 text-slate-500" />
                <span>Reportes</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.reportes ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.reportes && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_ventas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['reports', 'reportes', 'reporte_ventas'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reporte de Ventas
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_productos')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'reporte_productos' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reporte de Productos
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('ventas_por_producto')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['ventas_por_producto', 'reporte_ventas_producto'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Ventas por Producto
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_compras')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'reporte_compras' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reporte de Compras
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_notas')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['reporte_notas', 'notas_credito_debito'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Notas de Crédito & Débito
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_kardex')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'reporte_kardex' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reporte de Kardex
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('reporte_caja')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['reporte_caja', 'reporte_cajas'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Reporte de Caja
                </button>
              </div>
            )}
          </div>
        )}

        {/* 15. ADMINISTRACIÓN (Acordeón exacto a media_1790120030276.png) */}
        {hasModule('administracion') && (
          <div>
            <button
              type="button"
              onClick={() => {
                toggleMenu('administracion');
                onSelectView('admin_usuarios');
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl transition text-left ${
                ['administracion', 'admin', 'roles_permisos', 'admin_roles', 'usuarios', 'admin_usuarios'].includes(currentView)
                  ? 'text-slate-900 font-bold bg-slate-100'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 text-slate-500" />
                <span>Administración</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.administracion ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.administracion && (
              <div className="pl-6 pr-2 py-1 space-y-1">
                <button
                  type="button"
                  onClick={() => onSelectView('admin_usuarios')}
                  className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                    ['admin_usuarios', 'usuarios'].includes(currentView)
                      ? 'bg-[#10b981] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Users className="w-3.5 h-3.5 opacity-80" />
                  <span>Usuarios</span>
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('roles_permisos')}
                  className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-lg text-[11px] transition ${
                    ['roles_permisos', 'admin_roles'].includes(currentView)
                      ? 'bg-[#10b981] text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5 opacity-80" />
                  <span>Roles y permisos</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* 16. MÓDULOS (Botón directo exacto a media_1790120030276.png) */}
        {hasModule('modulos') && (
          <button
            type="button"
            onClick={() => onSelectView('modulos')}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition text-left ${
              currentView === 'modulos'
                ? 'bg-[#10b981] text-white font-bold shadow-xs'
                : 'text-slate-700 hover:bg-slate-100'
            }`}
          >
            <LayoutGrid className="w-4 h-4 text-slate-500" />
            <span>Módulos</span>
          </button>
        )}

        {/* 17. TIENDA VIRTUAL (Acordeón) */}
        {hasModule('tienda_virtual') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('tienda_virtual')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Globe className="w-4 h-4 text-slate-500" />
                <span>Tienda Virtual</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.tienda_virtual ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.tienda_virtual && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('tienda_virtual')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['tienda_virtual', 'catalogo_online', 'tienda', 'ecommerce'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Tienda Virtual (Ecommerce)
                </button>
                <button
                  type="button"
                  onClick={() => onSelectView('pedidos_web')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    ['pedidos_web', 'pedidosweb'].includes(currentView) ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Pedidos Web
                </button>
              </div>
            )}
          </div>
        )}

        {/* 16. RESTAURANTE (Acordeón) */}
        {hasModule('restaurante') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('restaurante')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <UtensilsCrossed className="w-4 h-4 text-slate-500" />
                <span>Restaurante</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.restaurante ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.restaurante && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('restaurante')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'restaurante' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Mesas, Salones & Comandas
                </button>
              </div>
            )}
          </div>
        )}

        {/* 17. FARMACIA (Acordeón) */}
        {hasModule('farmacia') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('farmacia')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <Pill className="w-4 h-4 text-slate-500" />
                <span>Farmacia</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.farmacia ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.farmacia && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('farmacia')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'farmacia' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Control de Lotes & Vencimientos
                </button>
              </div>
            )}
          </div>
        )}

        {/* 18. HOTELES (Acordeón) */}
        {hasModule('hoteles') && (
          <div>
            <button
              type="button"
              onClick={() => toggleMenu('hoteles')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-slate-700 hover:bg-slate-100 transition text-left"
            >
              <div className="flex items-center gap-2.5">
                <BedDouble className="w-4 h-4 text-slate-500" />
                <span>Hoteles</span>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${expandedMenus.hoteles ? 'rotate-180' : ''}`} />
            </button>
            {expandedMenus.hoteles && (
              <div className="pl-8 pr-2 py-1 space-y-0.5">
                <button
                  type="button"
                  onClick={() => onSelectView('hoteles')}
                  className={`w-full text-left px-2 py-1.5 rounded-lg text-[11px] transition ${
                    currentView === 'hoteles' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  • Habitaciones & Check-in
                </button>
              </div>
            )}
          </div>
        )}

      </nav>

      {/* ── 3. FOOTER DEL MENÚ LATERAL ── */}
      <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <div className="w-7 h-7 rounded-lg bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {currentUser?.nombre?.charAt(0) || 'U'}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-bold text-slate-800 truncate">{currentUser?.nombre || 'Usuario'}</p>
            <p className="text-[10px] text-slate-400 truncate">{currentUser?.rol || 'OPERADOR'}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={logout}
          title="Cerrar sesión"
          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-white transition"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>

    </aside>
  );
}
