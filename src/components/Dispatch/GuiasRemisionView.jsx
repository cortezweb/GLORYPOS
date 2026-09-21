import React, { useState, useEffect } from 'react';
import DispatchSubNav from './DispatchSubNav';
import GuiasRemitenteView from './GuiasRemitenteView';
import GuiasTransportistaView from './GuiasTransportistaView';
import TransportistasGREView from './TransportistasGREView';
import ConductoresGREView from './ConductoresGREView';
import VehiculosGREView from './VehiculosGREView';

export default function GuiasRemisionView({ initialTab = 'guias_remitente', onSelectSubView }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onSelectSubView) {
      onSelectSubView(tabId);
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior del módulo Guías de Remisión */}
      <DispatchSubNav activeTab={activeTab} onSelectTab={handleTabChange} />

      {/* Vistas según pestaña activa */}
      {['guias_remitente', 'remitente', 'gre_09', 'guias_remision', 'guias'].includes(activeTab) && (
        <GuiasRemitenteView />
      )}

      {['guias_transportista', 'transportista', 'gre_31'].includes(activeTab) && (
        <GuiasTransportistaView />
      )}

      {['transportistas', 'transportistas_gre'].includes(activeTab) && (
        <TransportistasGREView />
      )}

      {['conductores', 'conductores_gre'].includes(activeTab) && (
        <ConductoresGREView />
      )}

      {['vehiculos', 'vehiculos_gre'].includes(activeTab) && (
        <VehiculosGREView />
      )}
    </div>
  );
}
