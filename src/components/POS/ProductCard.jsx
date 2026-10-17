import React from 'react';
import { Plus, Layers, Scale, Sparkles, AlertCircle, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { simbolo } from '../../utils/currency';

export default function ProductCard({ product, onOpenVariants, onOpenScale, onOpenModifiers }) {
  const { addToCart } = useCart();
  const hasVariants = product.presentaciones && product.presentaciones.length > 1;
  const isScaleItem = product.tipo_venta === 'PESO';
  const hasModifiers = (product.sabores && product.sabores.length > 0) || (product.toppings && product.toppings.length > 0);
  const hasSizes = (product.tallas && product.tallas.length > 0) || (product.colores && product.colores.length > 0);

  const stockNum = Number(product.stock_actual) || 0;
  const isOutOfStock = stockNum <= 0;
  const isLowStock = !isOutOfStock && stockNum <= (product.stock_minimo || 5);

  const [imgError, setImgError] = React.useState(!product.foto_url);

  // Expiration check for Farmacia
  let expiryInfo = null;
  if (product.fecha_vencimiento) {
    const diffTime = new Date(product.fecha_vencimiento) - new Date();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      expiryInfo = { label: `Vence en ${diffDays}d`, color: 'bg-rose-100 text-rose-800 border-rose-300' };
    } else if (diffDays <= 90) {
      expiryInfo = { label: `Vence ${diffDays}d`, color: 'bg-amber-100 text-amber-800 border-amber-300' };
    }
  }

  const handleAction = (e) => {
    e.stopPropagation();
    if (isOutOfStock) return;

    if (isScaleItem && onOpenScale) {
      onOpenScale(product);
    } else if (hasModifiers && onOpenModifiers) {
      onOpenModifiers(product);
    } else if ((hasVariants || hasSizes) && onOpenVariants) {
      onOpenVariants(product);
    } else {
      addToCart(product);
    }
  };

  return (
    <article 
      onClick={handleAction}
      className={`bg-white rounded-xl border overflow-hidden flex flex-col justify-between shadow-xs transition-all select-none ${
        isOutOfStock 
          ? 'border-gray-200 opacity-60 cursor-not-allowed' 
          : 'border-gray-200 hover:border-[#FF6B35] hover:shadow-xs cursor-pointer group active:scale-[0.97]'
      }`}
    >
      <div className="p-3 pb-1 flex flex-col items-center">
        {/* Centered Image Container (Stitch Design) */}
        <div className="w-full h-24 bg-gray-50 rounded-lg flex items-center justify-center p-2 mb-2 relative overflow-hidden">
          {/* Smart Stock UX Pill */}
          {isOutOfStock ? (
            <span className="absolute top-1 left-1 bg-rose-100 text-rose-800 text-[9px] font-black px-1.5 py-0.5 rounded shadow-2xs border border-rose-200">
              Agotado
            </span>
          ) : isLowStock ? (
            <span className="absolute top-1 left-1 bg-amber-100 text-amber-900 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-2xs border border-amber-300 flex items-center gap-1 animate-pulse">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
              ¡Solo {stockNum}!
            </span>
          ) : (
            <span className="absolute top-1 left-1 bg-gray-100/90 text-gray-600 text-[10px] font-bold px-1.5 py-0.5 rounded shadow-2xs">
              {isScaleItem ? `${stockNum} Kg` : `Stock ${stockNum}`}
            </span>
          )}

          {/* Industry Badges */}
          {isScaleItem ? (
            <span className="absolute top-1 right-1 bg-rose-50 text-rose-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-2xs border border-rose-200">
              <Scale className="w-2.5 h-2.5" /> Balanza
            </span>
          ) : hasModifiers ? (
            <span className="absolute top-1 right-1 bg-cyan-50 text-cyan-700 text-[9px] font-extrabold px-1.5 py-0.5 rounded flex items-center gap-0.5 shadow-2xs border border-cyan-200">
              <Sparkles className="w-2.5 h-2.5" /> Sabores
            </span>
          ) : (hasVariants || hasSizes) ? (
            <span className="absolute top-1 right-1 bg-indigo-50 text-indigo-700 text-[9px] font-bold px-1 py-0.5 rounded flex items-center gap-0.5 shadow-2xs border border-indigo-100">
              <Layers className="w-2.5 h-2.5" /> Opciones
            </span>
          ) : null}

          {/* Expiration badge for pharmacy */}
          {expiryInfo && (
            <span className={`absolute bottom-1 left-1 text-[8px] font-black px-1.5 py-0.2 rounded border ${expiryInfo.color}`}>
              {expiryInfo.label}
            </span>
          )}

          {product.foto_url && !imgError ? (
            <img
              src={product.foto_url}
              alt=""
              className={`max-h-full max-w-full object-contain transition-transform duration-200 ${
                isOutOfStock ? 'grayscale' : 'group-hover:scale-105'
              }`}
              loading="lazy"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-orange-50/80 text-[#FF6B35] flex items-center justify-center font-bold text-sm shadow-2xs border border-orange-100/60">
              <Package className="w-6 h-6 text-[#FF6B35]/70" />
            </div>
          )}
        </div>

        {/* Centered Title */}
        <h3 className="text-xs font-medium text-gray-800 text-center line-clamp-2 min-h-[32px] w-full">
          {product.nombre}
        </h3>

        {/* Clothing sizes / colors mini preview */}
        {hasSizes && (
          <div className="flex items-center gap-1 mt-0.5 overflow-hidden flex-wrap">
            {product.tallas && product.tallas.slice(0, 3).map(t => (
              <span key={t} className="text-[9px] font-mono font-bold bg-[#FDFBF7] text-[#1E2022] px-1 rounded border border-[#FFB627]/10">
                {t}
              </span>
            ))}
            {product.colores && product.colores.slice(0, 2).map(c => (
              <span key={c} className="text-[9px] font-bold bg-slate-100 text-slate-700 px-1 rounded">
                {c}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Price & Action Button Bar */}
      <div className="px-3 pb-2.5 pt-1 border-t border-gray-50 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-gray-400 block font-normal">
            {isScaleItem ? 'Por Kilo' : 'Precio'}
          </span>
          <span className="text-sm font-bold text-gray-900">
            {simbolo()} {Number(product.precio_venta).toFixed(2)}
            {isScaleItem && <span className="text-[10px] font-normal text-slate-500"> /Kg</span>}
          </span>
        </div>

        <button
          onClick={handleAction}
          aria-label={`Agregar ${product.nombre}`}
          className={`w-7 h-7 rounded-lg text-white flex items-center justify-center shadow-xs transition active:scale-95 ${
            isScaleItem 
              ? 'bg-rose-600 hover:bg-rose-700' 
              : hasModifiers 
                ? 'bg-cyan-600 hover:bg-cyan-700' 
                : 'bg-[#FF6B35] hover:bg-[#FF6B35]/90 active:bg-[#E85B28]'
          }`}
          type="button"
        >
          {isScaleItem ? (
            <Scale className="w-3.5 h-3.5" />
          ) : (
            <Plus className="w-4 h-4 stroke-[2.5]" />
          )}
        </button>
      </div>
    </article>
  );
}

