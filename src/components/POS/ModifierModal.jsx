import React, { useState } from 'react';
import { Sparkles, X, Check, IceCream, Plus } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ModifierModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [selectedFlavors, setSelectedFlavors] = useState([]);
  const [selectedToppings, setSelectedToppings] = useState([]);
  const [nota, setNota] = useState('');

  if (!isOpen || !product) return null;

  const saboresDisponibles = product.sabores || ['Chocolate', 'Vainilla', 'Frutilla', 'Dulce de Leche'];
  const toppingsDisponibles = product.toppings || ['Grajeas', 'Salsa de Chocolate', 'Chispas', 'Maní'];

  const toggleFlavor = (flavor) => {
    if (selectedFlavors.includes(flavor)) {
      setSelectedFlavors(selectedFlavors.filter(f => f !== flavor));
    } else {
      if (selectedFlavors.length < 3) {
        setSelectedFlavors([...selectedFlavors, flavor]);
      }
    }
  };

  const toggleTopping = (topping) => {
    if (selectedToppings.includes(topping)) {
      setSelectedToppings(selectedToppings.filter(t => t !== topping));
    } else {
      setSelectedToppings([...selectedToppings, topping]);
    }
  };

  const handleConfirm = () => {
    const details = {
      tipo: 'HELADERIA',
      sabores: selectedFlavors,
      toppings: selectedToppings,
      nota: nota.trim()
    };
    addToCart(product, null, 1, details);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4 animate-scaleUp max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-cyan-100 text-cyan-700 flex items-center justify-center shrink-0">
              <IceCream className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-cyan-600 block">
                Personalización / Sabores
              </span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                {product.nombre}
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Bs. {Number(product.precio_venta).toFixed(2)}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 text-slate-400 hover:text-slate-700 flex items-center justify-center shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Flavors selection */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">
              Elige los Sabores ({selectedFlavors.length}/3)
            </label>
            <span className="text-[10px] text-cyan-600 font-bold">Máx 3 bolas</span>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {saboresDisponibles.map(sabor => {
              const isSelected = selectedFlavors.includes(sabor);
              return (
                <button
                  key={sabor}
                  type="button"
                  onClick={() => toggleFlavor(sabor)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{sabor}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Toppings selection */}
        <div>
          <label className="text-xs font-extrabold text-slate-700 uppercase tracking-wider block mb-1.5">
            Toppings y Salsas
          </label>
          <div className="flex flex-wrap gap-1.5">
            {toppingsDisponibles.map(topping => {
              const isSelected = selectedToppings.includes(topping);
              return (
                <button
                  key={topping}
                  type="button"
                  onClick={() => toggleTopping(topping)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1 ${
                    isSelected
                      ? 'bg-violet-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3" />}
                  <span>{topping}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Custom notes */}
        <div>
          <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block mb-1">
            Nota de Preparación (Opcional)
          </label>
          <input
            type="text"
            value={nota}
            onChange={(e) => setNota(e.target.value)}
            placeholder="Ej: Servir en vaso con cuchara extra..."
            className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-cyan-600"
          />
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          className="w-full h-12 bg-cyan-600 hover:bg-cyan-700 active:scale-95 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2 transition"
        >
          <Check className="w-4 h-4" />
          <span>Agregar al Pedido (Bs. {Number(product.precio_venta).toFixed(2)})</span>
        </button>
      </div>
    </div>
  );
}
