import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function FloatingCartBar({ onOpenCheckout }) {
  const { count, total, isBumping } = useCart();

  if (count === 0) return null;

  return (
    <aside className="absolute bottom-20 right-4 z-40 animate-scaleUp" data-purpose="floating-cart">
      <button 
        onClick={onOpenCheckout}
        className={`relative group flex items-center bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-700 hover:to-violet-700 active:scale-95 text-white font-bold py-3 px-4 rounded-full shadow-xl transition-all duration-200 ease-in-out shadow-indigo-500/30 ${
          isBumping ? 'scale-105' : 'scale-100'
        }`}
        type="button"
      >
        <ShoppingCart className="w-5 h-5 mr-2" />
        <span className="text-sm font-bold">Bs. {Number(total).toFixed(2)}</span>
        
        {/* Cart Items Badge Indicator (Stitch exact style) with Bump Effect */}
        <span className={`absolute -top-1.5 -left-1.5 bg-amber-400 text-gray-900 border-2 border-white text-[11px] font-black rounded-full h-5 w-5 flex items-center justify-center shadow-xs transition-transform duration-200 ${
          isBumping ? 'scale-135 bg-amber-300 ring-2 ring-indigo-500' : 'scale-100'
        }`}>
          {count}
        </span>
      </button>
    </aside>
  );
}
