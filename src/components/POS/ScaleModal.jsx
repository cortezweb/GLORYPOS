import React, { useState, useEffect } from 'react';
import { Scale, X, Check, Delete, ArrowRight, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function ScaleModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [weightStr, setWeightStr] = useState('1.000');

  useEffect(() => {
    if (isOpen) {
      setWeightStr('1.000');
    }
  }, [isOpen, product]);

  if (!isOpen || !product) return null;

  const pricePerKg = Number(product.precio_venta) || 0;
  const weightNum = parseFloat(weightStr) || 0;
  const totalCalculated = Math.round(weightNum * pricePerKg * 100) / 100;

  const handleKeyPress = (char) => {
    if (char === 'C') {
      setWeightStr('0');
      return;
    }
    if (char === '.') {
      if (!weightStr.includes('.')) {
        setWeightStr(weightStr + '.');
      }
      return;
    }
    if (weightStr === '0' || weightStr === '1.000') {
      setWeightStr(char);
    } else {
      // Limit to 3 decimal places
      if (weightStr.includes('.')) {
        const parts = weightStr.split('.');
        if (parts[1] && parts[1].length >= 3) return;
      }
      setWeightStr(weightStr + char);
    }
  };

  const handleBackspace = () => {
    if (weightStr.length <= 1) {
      setWeightStr('0');
    } else {
      setWeightStr(weightStr.slice(0, -1));
    }
  };

  const setPreset = (val) => {
    setWeightStr(val.toFixed(3));
  };

  const handleConfirm = () => {
    if (weightNum <= 0) return;
    addToCart(product, null, weightNum, { tipo: 'PESO', peso_kg: weightNum });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
      {/* Backdrop */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs transition-opacity"
      />

      <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 flex flex-col gap-4 animate-scaleUp">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0">
              <Scale className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
                Balanza & Venta al Peso
              </span>
              <h3 className="font-extrabold text-sm text-slate-900 truncate">
                {product.nombre}
              </h3>
              <span className="text-xs font-bold text-slate-500">
                Bs. {pricePerKg.toFixed(2)} / Kg
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

        {/* Live Weight Display */}
        <div className="bg-slate-900 text-white rounded-2xl p-4 flex flex-col items-center justify-center shadow-inner">
          <span className="text-[10px] font-mono tracking-widest text-slate-400 uppercase">
            Peso Registrado (Balanza)
          </span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-4xl font-black font-mono tracking-tight text-emerald-400">
              {weightStr}
            </span>
            <span className="text-lg font-bold text-slate-400">Kg</span>
          </div>

          <div className="w-full mt-2 pt-2 border-t border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400">Total a Cobrar:</span>
            <span className="text-lg font-black text-white">
              Bs. {totalCalculated.toFixed(2)}
            </span>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="grid grid-cols-4 gap-1.5">
          {[
            { label: '¼ Kg', val: 0.250 },
            { label: '½ Kg', val: 0.500 },
            { label: '¾ Kg', val: 0.750 },
            { label: '1 Kg', val: 1.000 },
            { label: '1.5 Kg', val: 1.500 },
            { label: '2 Kg', val: 2.000 },
            { label: '3 Kg', val: 3.000 },
            { label: '5 Kg', val: 5.000 },
          ].map(p => (
            <button
              key={p.label}
              type="button"
              onClick={() => setPreset(p.val)}
              className="py-1.5 px-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 active:scale-95 text-slate-700 text-xs font-extrabold rounded-xl transition border border-slate-200"
            >
              {p.label}
            </button>
          ))}
        </div>

        {/* Touch Numpad */}
        <div className="grid grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(n => (
            <button
              key={n}
              type="button"
              onClick={() => handleKeyPress(n)}
              className="h-11 bg-slate-50 hover:bg-slate-100 active:bg-slate-200 text-slate-800 text-lg font-black rounded-xl border border-slate-200 shadow-2xs active:scale-95 transition"
            >
              {n}
            </button>
          ))}
          <button
            type="button"
            onClick={() => handleKeyPress('.')}
            className="h-11 bg-slate-100 text-slate-800 text-lg font-black rounded-xl border border-slate-200 active:scale-95"
          >
            .
          </button>
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="h-11 bg-slate-50 text-slate-800 text-lg font-black rounded-xl border border-slate-200 active:scale-95"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-11 bg-rose-50 text-rose-700 text-sm font-bold rounded-xl border border-rose-200 flex items-center justify-center active:scale-95"
            title="Borrar"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleConfirm}
          disabled={weightNum <= 0}
          className="w-full h-12 bg-rose-600 hover:bg-rose-700 active:scale-95 disabled:opacity-50 text-white font-extrabold text-sm rounded-2xl shadow-lg shadow-rose-500/25 flex items-center justify-center gap-2 transition"
        >
          <Check className="w-4 h-4" />
          <span>Agregar ({weightNum} Kg • Bs. {totalCalculated.toFixed(2)})</span>
        </button>
      </div>
    </div>
  );
}
