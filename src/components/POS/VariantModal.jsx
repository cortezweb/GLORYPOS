import React, { useState, useEffect } from 'react';
import { useCart } from '../../context/CartContext';

export default function VariantModal({ product, isOpen, onClose }) {
  const { addToCart } = useCart();
  const [selectedTalla, setSelectedTalla] = useState(null);
  const [selectedColor, setSelectedColor] = useState(null);

  useEffect(() => {
    if (product) {
      if (product.presentaciones && product.presentaciones.length > 0) {
        setSelectedVariant(product.presentaciones[0]);
      } else {
        setSelectedVariant(null);
      }

      if (product.tallas && product.tallas.length > 0) {
        setSelectedTalla(product.tallas[0]);
      } else {
        setSelectedTalla(null);
      }

      if (product.colores && product.colores.length > 0) {
        setSelectedColor(product.colores[0]);
      } else {
        setSelectedColor(null);
      }

      setQuantity(1);
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  const currentPrice = selectedVariant?.precio || product.precio_venta;

  const handleAdd = () => {
    const customDetails = (selectedTalla || selectedColor) ? {
      tipo: 'ROPA',
      talla: selectedTalla,
      color: selectedColor
    } : null;

    addToCart(product, selectedVariant, quantity, customDetails);
    onClose();
  };

  const hasPresentaciones = product.presentaciones && product.presentaciones.length > 0;
  const hasTallas = product.tallas && product.tallas.length > 0;
  const hasColores = product.colores && product.colores.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center animate-fadeIn">
      {/* BEGIN: BackdropOverlay (Stitch backdrop) */}
      <div 
        onClick={onClose}
        className="fixed inset-0 bg-black/40 backdrop-blur-xs z-10 transition-opacity"
      />
      {/* END: BackdropOverlay */}

      {/* BEGIN: PresentationModalSheet (Exact Stitch layout & classes) */}
      <section 
        className="relative z-20 mt-auto bg-white rounded-t-[32px] p-5 shadow-[0_-10px_25px_-5px_rgba(0,0,0,0.25)] flex flex-col max-h-[88%] w-full max-w-md transition-transform animate-slideUp"
        data-purpose="variant-selection-bottom-sheet"
      >
        {/* Indicador visual de arrastre superior */}
        <div className="w-10 h-1 bg-gray-300 rounded-full mx-auto mb-3"></div>

        {/* Nombre del Producto */}
        <h2 className="text-xl font-bold text-gray-800 tracking-tight mb-3 line-clamp-1">
          {product.nombre}
        </h2>

        {/* Detalle de Producto / Miniatura y Precio de la presentación */}
        <div className="flex items-center space-x-3 mb-4 pb-1">
          {/* Miniatura del Producto */}
          <div className="w-14 h-14 bg-gradient-to-br from-violet-100 to-blue-100 rounded-xl flex items-center justify-center p-0.5 border border-violet-200/80 shadow-xs shrink-0 overflow-hidden">
            {product.foto_url ? (
              <img 
                src={product.foto_url} 
                alt={product.nombre}
                className="w-full h-full object-cover rounded-lg"
              />
            ) : (
              <svg className="w-8 h-8 text-violet-700" fill="currentColor" viewBox="0 0 24 24">
                <path d="M9 3L12 6L15 3H19L20 9L18 10V21H6V10L4 9L5 3H9Z" />
              </svg>
            )}
          </div>

          {/* Información de precio dinámico */}
          <div className="flex flex-col">
            <span className="text-xs text-gray-500 font-medium">Precio de la presentación</span>
            <span className="text-xl font-bold text-gray-900 tracking-tight leading-none mt-1">
              Bs. {Number(currentPrice).toFixed(2)}
            </span>
          </div>
        </div>

        {/* BEGIN: PresentationSection (Only if has multiple presentaciones) */}
        {hasPresentaciones && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
              PRESENTACIÓN
            </h3>
            <p className="text-[11px] text-gray-400 mt-0.5 mb-2.5">
              Elige una presentación:
            </p>

            <div aria-label="Seleccione presentación" className="grid grid-cols-3 gap-2" role="radiogroup">
              {product.presentaciones.map((pres) => {
                const isChecked = selectedVariant?.id === pres.id;
                return (
                  <button
                    key={pres.id}
                    onClick={() => setSelectedVariant(pres)}
                    aria-checked={isChecked}
                    className={`variant-btn flex flex-col items-center justify-center py-2 px-2 rounded-xl transition-all ${
                      isChecked
                        ? 'border border-blue-600 bg-gradient-to-r from-blue-600 to-[#7c3aed] text-white shadow-xs'
                        : 'border border-gray-200 bg-gray-50 hover:bg-gray-100 text-gray-700'
                    }`}
                    role="radio"
                    type="button"
                  >
                    <span className={`text-xs font-bold ${isChecked ? 'text-white' : 'text-gray-700'}`}>
                      {pres.nombre}
                    </span>
                    <span className={`text-[10px] mt-0.5 ${isChecked ? 'text-blue-100 font-normal' : 'text-gray-500 font-normal'}`}>
                      Bs. {Number(pres.precio).toFixed(2)}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
        {/* END: PresentationSection */}

        {/* BEGIN: Tallas Section for Clothing */}
        {hasTallas && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
              <span>TALLA DISPONIBLE</span>
              <span className="text-[10px] text-indigo-600 font-bold">Seleccionada: {selectedTalla}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.tallas.map((talla) => {
                const isChecked = selectedTalla === talla;
                return (
                  <button
                    key={talla}
                    type="button"
                    onClick={() => setSelectedTalla(talla)}
                    className={`min-w-[42px] py-1.5 px-3 rounded-xl text-xs font-extrabold font-mono transition-all ${
                      isChecked
                        ? 'bg-indigo-600 text-white shadow-xs scale-105 ring-2 ring-indigo-300'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {talla}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BEGIN: Colores Section for Clothing */}
        {hasColores && (
          <div className="mb-4">
            <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide flex items-center justify-between">
              <span>COLOR</span>
              <span className="text-[10px] text-indigo-600 font-bold">Seleccionado: {selectedColor}</span>
            </h3>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {product.colores.map((color) => {
                const isChecked = selectedColor === color;
                return (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setSelectedColor(color)}
                    className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all ${
                      isChecked
                        ? 'bg-slate-900 text-white shadow-xs ring-2 ring-slate-400'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-200'
                    }`}
                  >
                    {color}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* BEGIN: PriceSummarySection */}
        <div className="border-t border-gray-100 pt-3 mb-4">
          <div className="flex justify-between items-center text-xs text-gray-500 mb-1">
            <span>Resumen de precio</span>
            <span className="font-semibold text-[#7c3aed]">
              Bs. {Number(currentPrice).toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs text-gray-400 mb-3">
            <span className="font-medium text-slate-700">
              {selectedVariant ? selectedVariant.nombre : 'Unidad'} (Bs. {Number(currentPrice).toFixed(2)})
            </span>
            <div className="flex items-center space-x-2">
              <button 
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-6 h-6 rounded-full bg-violet-50 text-[#7c3aed] font-bold text-sm flex items-center justify-center active:bg-violet-100" 
                type="button"
              >
                -
              </button>
              <span className="text-xs font-bold text-gray-800 w-4 text-center">{quantity}</span>
              <button 
                onClick={() => setQuantity(quantity + 1)}
                className="w-6 h-6 rounded-full bg-violet-50 text-[#7c3aed] font-bold text-sm flex items-center justify-center active:bg-violet-100" 
                type="button"
              >
                +
              </button>
            </div>
          </div>

          {/* Total Unitario Destacado */}
          <div className="flex justify-between items-baseline pt-1">
            <span className="text-sm font-semibold text-gray-800">Total a pagar</span>
            <span className="text-xl font-extrabold text-[#2563eb] tracking-tight">
              Bs. {Number(currentPrice * quantity).toFixed(2)}
            </span>
          </div>
        </div>
        {/* END: PriceSummarySection */}

        {/* BEGIN: ActionButtons (Exact Stitch layout & gradient) */}
        <div className="flex items-center gap-3 pt-1">
          <button 
            onClick={onClose}
            className="w-1/3 py-3 rounded-xl font-medium text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 transition-colors text-center" 
            type="button"
          >
            Cancelar
          </button>
          <button 
            onClick={handleAdd}
            className="w-2/3 py-3.5 rounded-xl font-semibold text-sm text-white bg-gradient-to-r from-blue-600 via-blue-700 to-[#7c3aed] hover:from-blue-700 hover:to-[#6d28d9] active:opacity-95 shadow-md shadow-blue-500/20 transition-all text-center tracking-wide" 
            type="button"
          >
            Agregar
          </button>
        </div>
        {/* END: ActionButtons */}
      </section>
      {/* END: PresentationModalSheet */}
    </div>
  );
}
