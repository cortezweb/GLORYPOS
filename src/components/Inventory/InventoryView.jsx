import React, { useState, useEffect } from 'react';
import MovimientosView from './MovimientosView';
import TransferenciasView from './TransferenciasView';
import HistorialTransferenciasView from './HistorialTransferenciasView';
import KardexView from './KardexView';

export default function InventoryView({ initialTab = 'movimientos', onSelectSubView, onOpenScanner }) {
  const [activeTab, setActiveTab] = useState(initialTab || 'movimientos');
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    if (initialTab) {
      if (['transferencias', 'inventario_transferencias'].includes(initialTab)) {
        setActiveTab('transferencias');
      } else if (['historial_transferencias', 'inventario_historial_transferencias'].includes(initialTab)) {
        setActiveTab('historial_transferencias');
      } else if (['kardex', 'inventario_kardex'].includes(initialTab)) {
        setActiveTab('kardex');
      } else {
        setActiveTab('movimientos');
      }
    }
  }, [initialTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onSelectSubView) {
      onSelectSubView(tabId);
    }
  };

  return (
    <div className="flex-1 flex flex-col font-sans">
      {activeTab === 'movimientos' && (
        <MovimientosView
          onSelectSubView={handleTabChange}
          onSelectProductForKardex={(prod) => {
            setSelectedProduct(prod);
            handleTabChange('kardex');
          }}
          onSelectProductForTransfer={(prod) => {
            setSelectedProduct(prod);
            handleTabChange('transferencias');
          }}
        />
      )}

      {activeTab === 'transferencias' && (
        <TransferenciasView
          onSelectSubView={handleTabChange}
          initialProductToTransfer={selectedProduct}
        />
      )}

      {activeTab === 'historial_transferencias' && (
        <HistorialTransferenciasView
          onSelectSubView={handleTabChange}
        />
      )}

      {activeTab === 'kardex' && (
        <KardexView
          onSelectSubView={handleTabChange}
          initialProduct={selectedProduct}
        />
      )}
    </div>
  );
}
