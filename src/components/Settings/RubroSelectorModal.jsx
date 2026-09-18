import React, { useState } from 'react';
import { 
  X, Check, Store, Wrench, Pill, Shirt, Beef, IceCream, 
  Sparkles, Layers, ArrowRight 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { RUBROS_CONFIG, DEMO_CATALOGS } from '../../db/rubros';

const ICONS = {
  Store: Store,
  Wrench: Wrench,
  Pill: Pill,
  Shirt: Shirt,
  Beef: Beef,
  IceCream: IceCream
};

export default function RubroSelectorModal({ isOpen, onClose, currentRubro = 'ABARROTES', onRubroChanged }) {
  const [selectedRubro, setSelectedRubro] = useState(currentRubro);
  const [loadDemoProducts, setLoadDemoProducts] = useState(true);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleApply = async () => {
    setLoading(true);
    try {
      // 1. Update config_empresa
      const config = await db.config_empresa.get('empresa_activa');
      if (config) {
        await db.config_empresa.update('empresa_activa', { rubro: selectedRubro });
      } else {
        await db.config_empresa.put({ id: 'empresa_activa', rubro: selectedRubro });
      }

      // 2. Load demo products if checked
      if (loadDemoProducts && DEMO_CATALOGS[selectedRubro]) {
        const demoItems = DEMO_CATALOGS[selectedRubro];
        // Clear old products and bulk add
        await db.productos_tienda.clear();
        await db.productos_tienda.bulkAdd(demoItems);
      }

      if (onRubroChanged) {
        onRubroChanged(selectedRubro);
      }
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al cambiar de rubro.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-xl bg-white rounded-3xl p-5 sm:p-6 shadow-2xl z-10 flex flex-col gap-4 animate-scaleUp max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-black uppercase tracking-wider">
                Multi-Industria SaaS
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight mt-1">
              Seleccionar Rubro de Negocio
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              Elige el tipo de negocio para adaptar las funciones, medidas y catálogo del POS
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Rubro Cards Grid */}
        <div className="overflow-y-auto flex-1 pr-1 space-y-2.5">
          {Object.values(RUBROS_CONFIG).map((r) => {
            const Icon = ICONS[r.icono] || Store;
            const isSelected = selectedRubro === r.id;

            return (
              <div
                key={r.id}
                onClick={() => setSelectedRubro(r.id)}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-500/20'
                    : 'border-slate-200 hover:border-slate-300 bg-white'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-100 text-slate-700'
                  }`}>
                    <Icon className="w-6 h-6" />
                  </div>

                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h4 className="font-extrabold text-sm text-slate-900 truncate">
                        {r.nombre}
                      </h4>
                      <span className="px-2 py-0.2 rounded-md bg-slate-100 text-slate-600 text-[10px] font-bold">
                        {r.badge}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 line-clamp-1 mt-0.5">
                      {r.descripcion}
                    </p>

                    <div className="flex items-center gap-1.5 mt-1 overflow-x-auto no-scrollbar">
                      {r.features.map(f => (
                        <span key={f} className="text-[10px] font-bold text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded">
                          ✓ {f}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center border-2 transition-all ${
                    isSelected ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'
                  }`}>
                    {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Demo products checkbox */}
        <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={loadDemoProducts}
              onChange={(e) => setLoadDemoProducts(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-slate-300"
            />
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-800">
                Cargar productos de demostración de este rubro
              </span>
              <span className="text-[10px] text-slate-500">
                Precarga artículos reales para hacer pruebas inmediatas de venta.
              </span>
            </div>
          </label>
        </div>

        {/* Actions Footer */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-100">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl hover:bg-slate-200 transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={loading}
            onClick={handleApply}
            className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-xs rounded-xl shadow-md shadow-blue-500/25 transition flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>{loading ? 'Aplicando...' : 'Activar Rubro'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
