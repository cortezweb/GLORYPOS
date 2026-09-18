import React, { useState } from 'react';
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

// New Stitch Views
import TiendaVirtualView from './components/Store/TiendaVirtualView';
import FinanzasView from './components/Finance/FinanzasView';
import GuiasRemisionView from './components/Dispatch/GuiasRemisionView';
import DocumentosAvanzadosView from './components/AdvancedDocs/DocumentosAvanzadosView';
import AdministracionView from './components/Admin/AdministracionView';
import ModulosView from './components/Modules/ModulosView';

// Ventas Sub-Windows
import ComprobantesView from './components/Sales/ComprobantesView';
import NotasVentaView from './components/Sales/NotasVentaView';
import CotizacionesView from './components/Sales/CotizacionesView';
import CajaChicaView from './components/Sales/CajaChicaView';

function MainShell() {
  const { isExpired } = useAuth();

  // Navigation State
  const [currentView, setCurrentView] = useState('pos');
  const [searchTerm, setSearchTerm] = useState('');

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
        />

        {/* Trial Countdown Banner */}
        <TrialBanner onOpenSubscription={() => setCurrentView('subscription')} />

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
                onOpenInventory={() => setCurrentView('inventory')}
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
              {/* Ventas Sub-Windows */}
              {(currentView === 'ventas_comprobantes' || currentView === 'sales') && (
                <ComprobantesView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)} 
                />
              )}
              {currentView === 'ventas_notas' && (
                <NotasVentaView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenReceipt={(venta) => setActiveTicketSale(venta)} 
                />
              )}
              {currentView === 'ventas_cotizaciones' && (
                <CotizacionesView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenPosWithCart={() => setCurrentView('pos')} 
                />
              )}
              {currentView === 'ventas_caja' && (
                <CajaChicaView 
                  onSelectSubView={(sub) => setCurrentView(sub)}
                  onOpenCloseCash={() => setIsCloseCashOpen(true)} 
                />
              )}

              {currentView === 'productos' && (
                <ProductsView 
                  currentRubro={currentRubro}
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                  onOpenScanner={() => setIsScannerOpen(true)} 
                />
              )}
              {currentView === 'inventory' && (
                <InventoryView 
                  currentRubro={currentRubro}
                  onSelectSubView={(sub) => setCurrentView(sub)} 
                  onOpenScanner={() => setIsScannerOpen(true)} 
                />
              )}
              {currentView === 'clients' && <ClientsView />}
              {currentView === 'purchases' && <PurchasesView />}
              {currentView === 'reports' && (
                <ReportsView onOpenReceipt={(venta) => setActiveTicketSale(venta)} />
              )}
              {currentView === 'subscription' && <SubscriptionView />}
              
              {/* Additional Stitch Menu Views */}
              {currentView === 'tienda_virtual' && <TiendaVirtualView />}
              {currentView === 'finanzas' && (
                <FinanzasView onOpenCloseCash={() => setIsCloseCashOpen(true)} />
              )}
              {currentView === 'guias_remision' && <GuiasRemisionView />}
              {currentView === 'documentos_avanzados' && <DocumentosAvanzadosView />}
              {currentView === 'administracion' && <AdministracionView />}
              {currentView === 'modulos' && <ModulosView />}
            </div>
          </div>
        )}

        {/* Mobile Floating Cart Button (Hidden on Desktop) */}
        {currentView === 'pos' && (
          <div className="lg:hidden">
            <FloatingCartBar onOpenCheckout={() => setIsCheckoutOpen(true)} />
          </div>
        )}

        {/* Mobile Fixed Bottom Navigation (Hidden on Desktop) */}
        <div className="lg:hidden">
          <BottomNav
            currentView={currentView}
            onSelectView={(view) => {
              setCurrentView(view);
              setSearchTerm('');
            }}
          />
        </div>
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
        cajeroNombre="Carlos Gutiérrez"
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
