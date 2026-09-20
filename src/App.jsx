import React, { useState } from 'react';
import { Store, AlertCircle, ShoppingCart } from 'lucide-react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';

import TopBar from './components/Layout/TopBar';
import Sidebar from './components/Layout/Sidebar';
import DesktopSidebar from './components/Layout/DesktopSidebar';
import BottomNav from './components/Layout/BottomNav';
import TrialBanner from './components/Subscription/TrialBanner';

import PosView from './components/POS/PosView';
import VariantModal from './components/POS/VariantModal';
import FloatingCartBar from './components/POS/FloatingCartBar';
import DesktopCartSidebar from './components/POS/DesktopCartSidebar';
import CheckoutModal from './components/POS/CheckoutModal';
import ThermalTicketModal from './components/POS/ThermalTicketModal';
import BarcodeScannerModal from './components/POS/BarcodeScannerModal';
import UndoToast from './components/POS/UndoToast';
import LockTerminalModal from './components/POS/LockTerminalModal';
import { useBarcodeGunScanner } from './hooks/useBarcodeGunScanner';

import ProductsView from './components/Products/ProductsView';
import CategoriasMarcasView from './components/Products/CategoriasMarcasView';
import InventoryView from './components/Inventory/InventoryView';
import ScaleModal from './components/POS/ScaleModal';
import ModifierModal from './components/POS/ModifierModal';
import RubroSelectorModal from './components/Settings/RubroSelectorModal';
import { db } from './db/dexie';
import ClientsView from './components/Clients/ClientsView';
import PurchasesView from './components/Purchases/PurchasesView';
import ReportsView from './components/Reports/ReportsView';
import SalesHistoryView from './components/Sales/SalesHistoryView';
import SubscriptionView from './components/Subscription/SubscriptionView';
import ExpiredScreen from './components/Subscription/ExpiredScreen';
import CloseCashModal from './components/CashRegister/CloseCashModal';
import DesktopDashboardModal from './components/Dashboard/DesktopDashboardModal';
import InicioView from './components/Dashboard/InicioView';

// New Stitch Views
import TiendaVirtualView from './components/Store/TiendaVirtualView';
import FinanzasView from './components/Finance/FinanzasView';
import GuiasRemisionView from './components/Dispatch/GuiasRemisionView';
import DocumentosAvanzadosView from './components/AdvancedDocs/DocumentosAvanzadosView';
import AdministracionView from './components/Admin/AdministracionView';
import SuperAdminView from './components/Admin/SuperAdminView';
import ModulosView from './components/Modules/ModulosView';
import ContabilidadView from './components/Accounting/ContabilidadView';
import RestauranteView from './components/Restaurant/RestauranteView';
import FarmaciaView from './components/Pharmacy/FarmaciaView';
import HotelesView from './components/Hotels/HotelesView';

// Ventas Sub-Windows
import ComprobantesView from './components/Sales/ComprobantesView';
import NotasVentaView from './components/Sales/NotasVentaView';
import CotizacionesView from './components/Sales/CotizacionesView';
import CajaChicaView from './components/Sales/CajaChicaView';
import ComprobantesPendientesView from './components/Sales/ComprobantesPendientesView';
import NuevoComprobanteView from './components/Sales/NuevoComprobanteView';
import MembresiasView from './components/Sales/MembresiasView';
import PedidosWebView from './components/Sales/PedidosWebView';
import CuentasPorCobrarView from './components/Sales/CuentasPorCobrarView';

// Productos Sub-Windows
import CombosPromocionesView from './components/Products/CombosPromocionesView';
import ServiciosView from './components/Products/ServiciosView';
import UnidadesMedidaView from './components/Products/UnidadesMedidaView';

// Auth Screens
import LoginView from './components/Auth/LoginView';
import RegisterView from './components/Auth/RegisterView';

function MainShell() {
  const { isExpired, currentUser, isAuthenticated, loading, empresa, logout } = useAuth();

  // Navigation State (Por defecto inicia en la vista Inicio)
  const [currentView, setCurrentView] = useState('inicio');
  const [searchTerm, setSearchTerm] = useState('');
  const [showRegister, setShowRegister] = useState(false);

  // Modals State
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isCloseCashOpen, setIsCloseCashOpen] = useState(false);
  const [isDesktopDashboardOpen, setIsDesktopDashboardOpen] = useState(false);
  const [selectedVariantProduct, setSelectedVariantProduct] = useState(null);
  const [selectedScaleProduct, setSelectedScaleProduct] = useState(null);
  const [selectedModifierProduct, setSelectedModifierProduct] = useState(null);
  const [isRubroModalOpen, setIsRubroModalOpen] = useState(false);
  const [currentRubro, setCurrentRubro] = useState('ABARROTES');
  const [activeTicketSale, setActiveTicketSale] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isTerminalLocked, setIsTerminalLocked] = useState(false);

  // Global Hardware USB / Laser Barcode Scanner Listener
  useBarcodeGunScanner();

  // Load configured rubro from Dexie
  React.useEffect(() => {
    db.config_empresa.get('empresa_activa').then((cfg) => {
      if (cfg && cfg.rubro) {
        setCurrentRubro(cfg.rubro);
      }
    }).catch(() => {});
  }, []);

  // Online / Offline Status Listener
  React.useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Cashier Keyboard Shortcuts (F2: Buscar, F4: Cobrar, F8: Bloquear, Esc: Salir)
  React.useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'F2') {
        e.preventDefault();
        const searchInput = document.querySelector('input[type="search"]');
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
      } else if (e.key === 'F4') {
        e.preventDefault();
        setIsCheckoutOpen(true);
      } else if (e.key === 'F8') {
        e.preventDefault();
        setIsTerminalLocked(true);
      } else if (e.key === 'Escape') {
        setIsCheckoutOpen(false);
        setIsScannerOpen(false);
        setIsCloseCashOpen(false);
        setIsDesktopDashboardOpen(false);
        setSelectedVariantProduct(null);
        setActiveTicketSale(null);
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSaleCompleted = (venta) => {
    setIsCheckoutOpen(false);
    setActiveTicketSale(venta);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 text-white">
        <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-xs font-bold text-slate-400 mt-4 tracking-widest uppercase">Iniciando GLORYPOS...</p>
      </div>
    );
  }

  // Sin empresa registrada → onboarding de registro
  if (!empresa?.nombre || showRegister) {
    return <RegisterView onGoToLogin={() => setShowRegister(false)} />;
  }

  // Con empresa pero sin sesión → pantalla de login
  if (!isAuthenticated || !currentUser) {
    return <LoginView onGoToRegister={() => setShowRegister(true)} />;
  }

  return (
    <div className="min-h-screen w-full bg-slate-100 flex flex-col lg:flex-row text-slate-800 antialiased overflow-x-hidden">
      {/* BEGIN: Persistent Desktop Navigation Sidebar (>= 1024px) */}
      <DesktopSidebar
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setSearchTerm('');
        }}
        onOpenCloseCash={() => setIsCloseCashOpen(true)}
        onOpenDesktopDashboard={() => setIsDesktopDashboardOpen(true)}
        onOpenRubroModal={() => setIsRubroModalOpen(true)}
        currentRubro={currentRubro}
      />
      {/* END: Persistent Desktop Navigation Sidebar */}

      {/* BEGIN: Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 bg-slate-50 min-h-screen relative">
        {/* Top Header Bar */}
        <TopBar
          onOpenSidebar={() => setIsSidebarOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          isOnline={isOnline}
          onLockTerminal={() => setIsTerminalLocked(true)}
          currentRubro={currentRubro}
          onOpenRubroModal={() => setIsRubroModalOpen(true)}
          onSelectView={(v) => setCurrentView(v)}
        />

        {/* Trial Countdown Banner (Solo Desktop; en móvil se muestra en la cabecera) */}
        <div className="hidden lg:block">
          <TrialBanner onOpenSubscription={() => setCurrentView('subscription')} />
        </div>

        {/* Active Main View Container */}
        {currentView === 'pos' ? (
          <div className="flex-1 flex overflow-hidden">
            {/* Left Catalog Area */}
            <div className="flex-1 overflow-y-auto">
              <PosView
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                onOpenScanner={() => setIsScannerOpen(true)}
                onOpenVariants={(prod) => setSelectedVariantProduct(prod)}
                onOpenScale={(prod) => setSelectedScaleProduct(prod)}
                onOpenModifiers={(prod) => setSelectedModifierProduct(prod)}
                onOpenInventory={() => setCurrentView('productos')}
                onSelectSubView={(sub) => setCurrentView(sub)}
              />
            </div>

            {/* Desktop Docked Live Cart Panel (Visible on Desktop >= 1024px) */}
            <div className="hidden lg:flex shrink-0">
              <DesktopCartSidebar onOpenCheckout={() => setIsCheckoutOpen(true)} />
            </div>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto pb-20 lg:pb-8">
            <div className="max-w-7xl mx-auto w-full p-2.5 sm:p-4 lg:p-6">
              {/* Ventas Sub-Windows (Soporta múltiples alias para evitar pantallas en blanco) */}
              {['ventas_comprobantes', 'comprobantes', 'sales'].includes(currentView) && (
                <ComprobantesView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)} 
                />
              )}
              {['ventas_notas', 'notas_venta', 'notas'].includes(currentView) && (
                <NotasVentaView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)} 
                />
              )}
              {['ventas_cotizaciones', 'cotizaciones', 'preventa'].includes(currentView) && (
                <CotizacionesView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenPosWithCart={() => setCurrentView('pos')} 
                />
              )}
              {['nuevo_comprobante', 'ventas_nuevo'].includes(currentView) && (
                <NuevoComprobanteView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)} 
                />
              )}
              {['membresias', 'suscripciones', 'ventas_membresias'].includes(currentView) && (
                <MembresiasView 
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                />
              )}
              {['pedidos_web', 'pedidosweb', 'ventas_pedidosweb'].includes(currentView) && (
                <PedidosWebView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenPosWithCart={() => setCurrentView('pos')} 
                />
              )}
              {['cuentas_por_cobrar', 'cuentas_cobrar', 'creditos', 'ventas_cuentas_cobrar'].includes(currentView) && (
                <CuentasPorCobrarView 
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                />
              )}
              {['ventas_caja', 'caja_chica', 'caja'].includes(currentView) && (
                <CajaChicaView 
                  defaultTab="mis_cajas"
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenCloseCash={() => setIsCloseCashOpen(true)} 
                />
              )}
              {['reporte_cajas', 'reporte_caja'].includes(currentView) && (
                <CajaChicaView 
                  defaultTab="reporte_cajas"
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenCloseCash={() => setIsCloseCashOpen(true)} 
                />
              )}

              {/* Catálogo, Combos, Servicios, Categorías y Kardex */}
              {['productos', 'products'].includes(currentView) && (
                <ProductsView 
                  currentRubro={currentRubro}
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                  onOpenScanner={() => setIsScannerOpen(true)} 
                />
              )}
              {['combos_promociones', 'combos', 'promociones'].includes(currentView) && (
                <CombosPromocionesView 
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                  onOpenPosWithCart={() => setCurrentView('pos')} 
                />
              )}
              {['servicios', 'services'].includes(currentView) && (
                <ServiciosView 
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                />
              )}
              {['categorias_marcas', 'categorias', 'marcas'].includes(currentView) && (
                <CategoriasMarcasView 
                  currentRubro={currentRubro}
                  initialTab={currentView === 'marcas' ? 'marcas' : 'categorias'}
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                />
              )}
              {['unidades_medida', 'unidades', 'unidades-medida'].includes(currentView) && (
                <UnidadesMedidaView 
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                />
              )}
              {['inventory', 'inventario', 'movimientos', 'inventario_movimientos', 'transferencias', 'inventario_transferencias', 'historial_transferencias', 'inventario_historial_transferencias', 'kardex', 'inventario_kardex'].includes(currentView) && (
                <InventoryView 
                  currentRubro={currentRubro}
                  initialTab={
                    ['transferencias', 'inventario_transferencias'].includes(currentView) ? 'transferencias' :
                    ['historial_transferencias', 'inventario_historial_transferencias'].includes(currentView) ? 'historial_transferencias' :
                    ['kardex', 'inventario_kardex'].includes(currentView) ? 'kardex' :
                    'movimientos'
                  }
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                  onOpenScanner={() => setIsScannerOpen(true)} 
                />
              )}

              {/* Operaciones & Clientes */}
              {['clients', 'clientes'].includes(currentView) && <ClientsView />}
              {['purchases', 'compras', 'nueva_compra', 'compras_historial', 'proveedores'].includes(currentView) && (
                <PurchasesView 
                  initialTab={
                    currentView === 'nueva_compra' ? 'nueva_compra' :
                    currentView === 'proveedores' ? 'proveedores' :
                    'compras'
                  } 
                />
              )}

              {/* Reportes Especializados (6 Ventanas) */}
              {['reports', 'reportes', 'reporte_ventas', 'reporte_productos', 'ventas_por_producto', 'reporte_ventas_producto', 'reporte_compras', 'reporte_kardex', 'reporte_caja', 'reporte_cajas_tab'].includes(currentView) && (
                <ReportsView 
                  initialTab={
                    currentView === 'reporte_productos' ? 'productos' :
                    ['ventas_por_producto', 'reporte_ventas_producto'].includes(currentView) ? 'ventas_producto' :
                    currentView === 'reporte_compras' ? 'compras' :
                    currentView === 'reporte_kardex' ? 'kardex' :
                    ['reporte_caja', 'reporte_cajas_tab'].includes(currentView) ? 'caja' :
                    'ventas'
                  }
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)} 
                />
              )}
              {['subscription', 'suscripcion', 'planes'].includes(currentView) && <SubscriptionView />}
              
              {['tienda_virtual', 'catalogo_online', 'tienda'].includes(currentView) && (
                <TiendaVirtualView 
                  initialTab="catalogo"
                  onSelectView={(v) => setCurrentView(v)}
                  onOpenPosWithCart={() => setCurrentView('pos')}
                />
              )}
              {['finanzas', 'sesiones_caja', 'ingresos', 'egresos', 'cuentas_bancarias', 'cuentas_por_cobrar_finanzas', 'cuentas_por_pagar', 'reportes_caja_finanzas', 'metodos_pago'].includes(currentView) && (
                <FinanzasView 
                  initialTab={
                    currentView === 'ingresos' ? 'ingresos' :
                    currentView === 'egresos' ? 'egresos' :
                    currentView === 'cuentas_bancarias' ? 'cuentas_bancarias' :
                    currentView === 'cuentas_por_cobrar_finanzas' ? 'cuentas_por_cobrar' :
                    currentView === 'cuentas_por_pagar' ? 'cuentas_por_pagar' :
                    currentView === 'reportes_caja_finanzas' ? 'reportes_caja' :
                    currentView === 'metodos_pago' ? 'metodos_pago' :
                    'caja'
                  }
                  onSelectView={(v) => setCurrentView(v)}
                  onOpenCloseCash={() => setIsCloseCashOpen(true)} 
                />
              )}
              {['guias_remision', 'guias', 'despacho'].includes(currentView) && <GuiasRemisionView />}
              {['documentos_avanzados', 'documentos'].includes(currentView) && <DocumentosAvanzadosView />}
              {['administracion', 'admin', 'configuracion'].includes(currentView) && <AdministracionView />}
              {['modulos'].includes(currentView) && <ModulosView />}
              {/* Pantalla de Inicio GLORYPOS */}
              {currentView === 'inicio' && (
                <InicioView 
                  onSelectView={(v) => setCurrentView(v)}
                  onOpenCloseCash={() => setIsCloseCashOpen(true)}
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)}
                />
              )}

              {/* Módulos Especializados */}
              {['contabilidad'].includes(currentView) && <ContabilidadView />}
              {['restaurante'].includes(currentView) && <RestauranteView onSelectSubView={(v) => setCurrentView(v)} />}
              {['farmacia'].includes(currentView) && <FarmaciaView />}
              {['hoteles'].includes(currentView) && <HotelesView />}
              {['comprobantes_pendientes', 'pendientes'].includes(currentView) && <ComprobantesPendientesView />}

              {/* Consola SuperAdmin SaaS */}
              {['superadmin', 'admin_dashboard', 'dashboard'].includes(currentView) && (
                <SuperAdminView
                  onSelectView={(v) => setCurrentView(v)}
                  onOpenCloseCash={() => setIsCloseCashOpen(true)}
                  onOpenRubroModal={() => setIsRubroModalOpen(true)}
                  currentRubro={currentRubro}
                />
              )}

              {/* Fallback de Seguridad: Evita pantallas en blanco / plomo si una vista no existe */}
              {![
                'pos', 'inicio',
                'superadmin', 'admin_dashboard', 'dashboard',
                'ventas_comprobantes', 'comprobantes', 'consulta_comprobantes', 'sales',
                'nuevo_comprobante', 'ventas_nuevo',
                'membresias', 'suscripciones', 'ventas_membresias',
                'pedidos_web', 'pedidosweb', 'ventas_pedidosweb',
                'cuentas_por_cobrar', 'cuentas_cobrar', 'creditos', 'ventas_cuentas_cobrar',
                'ventas_notas', 'notas_venta', 'notas',
                'ventas_cotizaciones', 'cotizaciones', 'preventa',
                'ventas_caja', 'caja_chica', 'caja', 'reporte_cajas', 'reporte_caja',
                'productos', 'products', 'combos_promociones', 'combos', 'promociones', 'servicios', 'services', 'categorias_marcas', 'categorias', 'marcas', 'unidades_medida', 'unidades', 'unidades-medida',
                'inventory', 'inventario', 'movimientos', 'inventario_movimientos', 'transferencias', 'inventario_transferencias', 'historial_transferencias', 'inventario_historial_transferencias', 'kardex', 'inventario_kardex',
                'clients', 'clientes',
                'purchases', 'compras', 'nueva_compra', 'compras_historial', 'proveedores',
                'reports', 'reportes', 'reporte_ventas', 'reporte_productos', 'ventas_por_producto', 'reporte_ventas_producto', 'reporte_compras', 'reporte_kardex', 'reporte_cajas_tab',
                'subscription', 'suscripcion', 'planes',
                'tienda_virtual', 'catalogo_online', 'tienda',
                'finanzas', 'sesiones_caja', 'ingresos', 'egresos', 'cuentas_bancarias', 'cuentas_por_cobrar_finanzas', 'cuentas_por_pagar', 'reportes_caja_finanzas', 'metodos_pago',
                'guias_remision', 'guias', 'despacho',
                'comprobantes_pendientes', 'pendientes',
                'documentos_avanzados', 'documentos',
                'contabilidad',
                'restaurante',
                'farmacia',
                'hoteles',
                'administracion', 'admin', 'configuracion',
                'modulos'
              ].includes(currentView) && (
                <div className="bg-white p-8 rounded-3xl border border-slate-200 text-center max-w-md mx-auto my-12 space-y-4 shadow-sm">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                    <Store className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Módulo en Preparación</h3>
                    <p className="text-xs text-slate-500 mt-1">
                      La sección <strong className="text-slate-700 font-mono">"{currentView}"</strong> se encuentra lista para el siguiente turno.
                    </p>
                  </div>
                  <button
                    onClick={() => setCurrentView('pos')}
                    className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition"
                  >
                    Volver al Punto de Venta (POS)
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Mobile Floating Cart Button (Hidden on Desktop) */}
        {currentView === 'pos' && (
          <div className="lg:hidden">
            <FloatingCartBar onOpenCheckout={() => setIsCheckoutOpen(true)} />
          </div>
        )}

        {/* Mobile Fixed Bottom Navigation (Oculto en Inicio para ser idéntico al mockup móvil) */}
        {currentView !== 'inicio' && (
          <div className="lg:hidden">
            <BottomNav
              currentView={currentView}
              onSelectView={(view) => {
                setCurrentView(view);
                setSearchTerm('');
              }}
            />
          </div>
        )}
      </div>
      {/* END: Main Content Area */}

      {/* Mobile Slide-in Drawer Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentView={currentView}
        onSelectView={(view) => {
          setCurrentView(view);
          setSearchTerm('');
        }}
        onOpenCloseCash={() => setIsCloseCashOpen(true)}
        onOpenDesktopDashboard={() => setIsDesktopDashboardOpen(true)}
        onOpenRubroModal={() => setIsRubroModalOpen(true)}
        currentRubro={currentRubro}
      />

      {/* Modals & Dialogs */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onOpenCheckout={() => setIsCheckoutOpen(true)}
      />

      <VariantModal
        isOpen={!!selectedVariantProduct}
        product={selectedVariantProduct}
        onClose={() => setSelectedVariantProduct(null)}
      />

      <ScaleModal
        isOpen={!!selectedScaleProduct}
        product={selectedScaleProduct}
        onClose={() => setSelectedScaleProduct(null)}
      />

      <ModifierModal
        isOpen={!!selectedModifierProduct}
        product={selectedModifierProduct}
        onClose={() => setSelectedModifierProduct(null)}
      />

      <RubroSelectorModal
        isOpen={isRubroModalOpen}
        onClose={() => setIsRubroModalOpen(false)}
        currentRubro={currentRubro}
        onRubroChanged={(newR) => {
          setCurrentRubro(newR);
          window.location.reload();
        }}
      />

      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
        onSaleCompleted={handleSaleCompleted}
      />

      <ThermalTicketModal
        isOpen={!!activeTicketSale}
        venta={activeTicketSale}
        onClose={() => setActiveTicketSale(null)}
        onNewSale={() => {
          setActiveTicketSale(null);
          setCurrentView('pos');
        }}
      />

      <CloseCashModal
        isOpen={isCloseCashOpen}
        onClose={() => setIsCloseCashOpen(false)}
      />

      <DesktopDashboardModal
        isOpen={isDesktopDashboardOpen}
        onClose={() => setIsDesktopDashboardOpen(false)}
      />

      {/* UX Undo Toast Notification */}
      <UndoToast />

      {/* Security Terminal Screen Lock Modal */}
      <LockTerminalModal
        isOpen={isTerminalLocked}
        onClose={() => setIsTerminalLocked(false)}
        onLogout={() => {
          setIsTerminalLocked(false);
          logout();
        }}
        cajeroNombre={currentUser?.nombre || "Carlos Gutiérrez"}
        cajeroPin={currentUser?.pin || "1234"}
      />

      {/* Soft Paywall when Subscription/Trial Expires */}
      {isExpired && <ExpiredScreen />}
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <CartProvider>
        <MainShell />
      </CartProvider>
    </AuthProvider>
  );
}
