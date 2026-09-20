import React, { useState, useEffect } from 'react';
import CajaSesionesView from './CajaSesionesView';
import IngresosView from './IngresosView';
import EgresosView from './EgresosView';
import CuentasBancariasView from './CuentasBancariasView';
import CuentasPorCobrarFinanzasView from './CuentasPorCobrarFinanzasView';
import CuentasPorPagarView from './CuentasPorPagarView';
import ReportesCajaView from './ReportesCajaView';
import MetodosPagoView from './MetodosPagoView';

export default function FinanzasView({ initialTab = 'caja', onSelectView, onOpenCloseCash }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleSelectTab = (tabKey) => {
    setActiveTab(tabKey);
    if (onSelectView) {
      onSelectView(tabKey);
    }
  };

  return (
    <div className="w-full">
      {activeTab === 'caja' && (
        <CajaSesionesView 
          onSelectSubView={handleSelectTab} 
          onOpenCloseCash={onOpenCloseCash} 
        />
      )}

      {activeTab === 'ingresos' && (
        <IngresosView 
          onSelectSubView={handleSelectTab} 
        />
      )}

      {activeTab === 'egresos' && (
        <EgresosView 
          onSelectSubView={handleSelectTab} 
        />
      )}

      {activeTab === 'cuentas_bancarias' && (
        <CuentasBancariasView 
          onSelectSubView={handleSelectTab} 
        />
      )}

      {activeTab === 'cuentas_por_cobrar' && (
        <CuentasPorCobrarFinanzasView 
          onSelectSubView={handleSelectTab} 
        />
      )}

      {activeTab === 'cuentas_por_pagar' && (
        <CuentasPorPagarView 
          onSelectSubView={handleSelectTab} 
        />
      )}

      {activeTab === 'reportes_caja' && (
        <ReportesCajaView 
          onSelectSubView={handleSelectTab} 
        />
      )}

      {activeTab === 'metodos_pago' && (
        <MetodosPagoView 
          onSelectSubView={handleSelectTab} 
        />
      )}
    </div>
  );
}
