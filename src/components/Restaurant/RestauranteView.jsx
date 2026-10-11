import React, { useState } from 'react';
import { ChefHat } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { restaurantService } from '../../services/restaurantService';
import RestaurantSubNav from './RestaurantSubNav';
import { useGlorychefData } from './useGlorychefData';
import MesasTab from './MesasTab';
import PedidosTab from './PedidosTab';
import ComandaPanel from './ComandaPanel';
import CocinaKDS from './CocinaKDS';
import CartaRecetasTab from './CartaRecetasTab';
import ReportesChefTab from './ReportesChefTab';
import ConfigSalonesTab from './ConfigSalonesTab';

// GLORYCHEF · Módulo de restaurante de GLORYPOS
export default function RestauranteView({ currentView = 'chef_mesas', onSelectSubView, onOpenCheckout }) {
  const tab = currentView === 'restaurante' ? 'chef_mesas' : currentView;
  const data = useGlorychefData();
  const { loadItems } = useCart();
  const [comandaAbiertaId, setComandaAbiertaId] = useState(null);

  const comandaAbierta = comandaAbiertaId ? data.comandasById[comandaAbiertaId] : null;

  // Lleva la comanda (o los platos elegidos al dividir la cuenta) al checkout existente del POS
  const handleCobrar = (comanda, itemIds = null) => {
    const items = restaurantService.itemsParaCobro(comanda, itemIds);
    if (items.length === 0) {
      alert('No hay platos pendientes de cobro en esta comanda.');
      return;
    }
    loadItems(items, {
      comandaId: comanda.id,
      itemIds: items.map(i => i.customDetails.item_id),
      mesa: comanda.mesa_numero || null,
    });
    onOpenCheckout?.();
  };

  const goTab = (id) => {
    setComandaAbiertaId(null);
    onSelectSubView?.(id);
  };

  return (
    <div className="space-y-4 font-sans pb-12">
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-600 border border-orange-200 flex items-center justify-center">
            <ChefHat className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">GLORYCHEF</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-orange-50 text-orange-800 border border-orange-200">
                Restaurante
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mesas, comandas, cocina y recetas conectadas a tu inventario y caja.
            </p>
          </div>
        </div>
        <div className="flex gap-2 text-[11px] font-bold">
          <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-800 border border-amber-200">
            {data.mesas.filter(m => m.comanda_id).length}/{data.mesas.length} mesas ocupadas
          </span>
          <span className="px-2.5 py-1 rounded-xl bg-slate-100 text-slate-700 border border-slate-200">
            {data.comandas.length} comandas abiertas
          </span>
        </div>
      </div>

      <RestaurantSubNav currentSubView={tab} onSelectSubView={goTab} />

      {comandaAbierta ? (
        <ComandaPanel
          comanda={comandaAbierta}
          data={data}
          onBack={() => setComandaAbiertaId(null)}
          onCobrar={handleCobrar}
        />
      ) : (
        <>
          {tab === 'chef_mesas' && <MesasTab data={data} onOpenComanda={setComandaAbiertaId} />}
          {tab === 'chef_pedidos' && <PedidosTab data={data} onOpenComanda={setComandaAbiertaId} />}
          {tab === 'chef_cocina' && <CocinaKDS data={data} />}
          {tab === 'chef_carta' && <CartaRecetasTab data={data} />}
          {tab === 'chef_reportes' && <ReportesChefTab />}
          {tab === 'chef_config' && <ConfigSalonesTab data={data} />}
        </>
      )}
    </div>
  );
}
