import React, { useState } from 'react';
import { Save, Truck, Store, Receipt } from 'lucide-react';
import { getCheckoutSettings, saveCheckoutSettings } from '../../services/tiendaService';

const input = 'mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm';

// Configuración del checkout de la tienda en línea: envío, recojo y comprobante automático
export default function CheckoutSettingsPanel() {
  const [s, setS] = useState(getCheckoutSettings);
  const [ok, setOk] = useState(false);
  const set = (k, v) => setS(prev => ({ ...prev, [k]: v }));

  const guardar = (e) => {
    e.preventDefault();
    saveCheckoutSettings({
      ...s,
      costo_delivery: Number(s.costo_delivery) || 0,
      envio_gratis_desde: Number(s.envio_gratis_desde) || 0,
      serie: String(s.serie || 'NVW1').toUpperCase().trim(),
    });
    setOk(true);
    setTimeout(() => setOk(false), 2500);
  };

  return (
    <form onSubmit={guardar} className="max-w-3xl mx-auto px-4 sm:px-6 py-5 space-y-4">
      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Truck className="w-4 h-4 text-[#FF6B35]" /> Entrega</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={s.delivery_activo} onChange={e => set('delivery_activo', e.target.checked)} /> Ofrecer delivery
          </label>
          <label className="flex items-center gap-2 text-sm font-bold text-slate-700">
            <input type="checkbox" checked={s.recojo_activo} onChange={e => set('recojo_activo', e.target.checked)} /> Ofrecer recojo en tienda
          </label>
          <label className="text-[11px] font-bold text-slate-600">Costo de delivery (Bs.)
            <input type="number" min="0" step="0.5" value={s.costo_delivery} onChange={e => set('costo_delivery', e.target.value)} className={input} />
          </label>
          <label className="text-[11px] font-bold text-slate-600">Envío gratis desde (Bs., 0 = nunca)
            <input type="number" min="0" step="1" value={s.envio_gratis_desde} onChange={e => set('envio_gratis_desde', e.target.value)} className={input} />
          </label>
          <label className="text-[11px] font-bold text-slate-600 sm:col-span-2"><span className="flex items-center gap-1"><Store className="w-3.5 h-3.5" /> Dirección para recojo</span>
            <input value={s.direccion_recojo} onChange={e => set('direccion_recojo', e.target.value)} placeholder="Ej. Av. Monseñor Rivero #240" className={input} />
          </label>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4">
        <h3 className="text-sm font-black text-slate-900 flex items-center gap-2"><Receipt className="w-4 h-4 text-[#FF6B35]" /> Comprobante automático de los pedidos</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="text-[11px] font-bold text-slate-600">Tipo de comprobante
            <select value={s.tipo_comprobante} onChange={e => set('tipo_comprobante', e.target.value)} className={input}>
              <option value="NOTA_VENTA">Nota de venta</option>
              <option value="BOLETA">Boleta</option>
            </select>
          </label>
          <label className="text-[11px] font-bold text-slate-600">Serie
            <input value={s.serie} onChange={e => set('serie', e.target.value)} className={input} />
          </label>
        </div>
        <p className="text-[11px] text-slate-500">Cada pedido recibe su número de comprobante al llegar al sistema. Se emite cuando confirmas el cierre en Pedidos Web.</p>
      </div>

      <button type="submit" className="px-5 py-2.5 rounded-xl bg-[#FF6B35] hover:bg-[#ea580c] text-white text-xs font-black flex items-center gap-1.5">
        <Save className="w-4 h-4" /> {ok ? 'Guardado' : 'Guardar configuración'}
      </button>
    </form>
  );
}
