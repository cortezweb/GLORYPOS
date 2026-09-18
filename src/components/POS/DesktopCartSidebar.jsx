import React from 'react';
import { ShoppingCart, Trash2, Plus, Minus, ArrowRight, Receipt, Sparkles } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function DesktopCartSidebar({ onOpenCheckout }) {
  const { items, total, count, updateQuantity, removeFromCart, clearCart, isBumping } = useCart();

  return (
    <aside className="w-84 xl:w-96 bg-white border-l border-gray-200 flex flex-col h-[calc(100vh-60px)] sticky top-[60px] shadow-xs shrink-0 z-20">
      {/* Header */}
      <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563eb] flex items-center justify-center">
            <ShoppingCart className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-bold text-sm text-slate-800 leading-tight">Venta en Curso</h2>
            <span className="text-[11px] text-slate-500 font-medium">
              {count} {count === 1 ? 'producto' : 'productos'}
            </span>
          </div>
        </div>

        {items.length > 0 && (
          <button
            onClick={clearCart}
            title="Vaciar carrito"
            className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 transition text-xs flex items-center gap-1 font-semibold"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Vaciar</span>
          </button>
        )}
      </div>

      {/* Cart Items List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2 divide-y divide-gray-50">
        {items.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-300">
              <ShoppingCart className="w-7 h-7" />
            </div>
            <p className="font-bold text-slate-600 text-sm">El carrito está vacío</p>
            <p className="text-xs text-slate-400 max-w-[200px]">
              Selecciona productos del catálogo o usa el lector de código de barras.
            </p>
          </div>
        ) : (
          items.map((item) => {
            const isPeso = item.tipo_venta === 'PESO' || item.customDetails?.tipo === 'PESO';
            const details = item.customDetails;

            return (
              <div key={item.id} className="pt-2.5 pb-1 flex items-start gap-2.5 group">
                <img
                  src={item.foto_url}
                  alt={item.nombre}
                  className="w-11 h-11 rounded-lg object-cover bg-slate-50 border border-slate-100 shrink-0 mt-0.5"
                />

                <div className="flex-1 min-w-0">
                  <h4 className="text-xs font-semibold text-slate-800 truncate leading-tight">
                    {item.nombre}
                  </h4>

                  {/* Rubro specifics & badges */}
                  <div className="flex flex-wrap items-center gap-1 mt-0.5">
                    {isPeso ? (
                      <span className="text-[10px] text-rose-700 font-bold bg-rose-50 px-1.5 py-0.2 rounded border border-rose-100">
                        {item.cantidad} Kg @ Bs. {Number(item.precio).toFixed(2)}/Kg
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-500 font-medium">
                        {item.cantidad}x Bs. {Number(item.precio).toFixed(2)}
                      </span>
                    )}

                    {item.presNombre && item.presNombre !== 'Unidad' && (
                      <span className="text-[9px] bg-violet-50 text-violet-700 font-bold px-1.5 py-0.2 rounded border border-violet-100">
                        {item.presNombre}
                      </span>
                    )}

                    {details?.tipo === 'ROPA' && (
                      <span className="text-[9px] bg-indigo-50 text-indigo-700 font-bold px-1.5 py-0.2 rounded border border-indigo-100">
                        {details.talla && `T: ${details.talla}`}{details.color && ` • ${details.color}`}
                      </span>
                    )}

                    {details?.tipo === 'HELADERIA' && details.sabores?.length > 0 && (
                      <span className="text-[9px] bg-cyan-50 text-cyan-700 font-bold px-1.5 py-0.2 rounded border border-cyan-100 truncate max-w-[170px]" title={details.sabores.join(', ')}>
                        {details.sabores.join(', ')}
                      </span>
                    )}

                    {item.lote && (
                      <span className="text-[9px] bg-emerald-50 text-emerald-700 font-medium px-1 rounded border border-emerald-100">
                        Lote: {item.lote}
                      </span>
                    )}
                  </div>

                  <div className="text-xs font-black text-slate-900 mt-1">
                    Bs. {Number(item.subtotal).toFixed(2)}
                  </div>
                </div>

                {/* Quantity Stepper */}
                <div className="flex items-center space-x-1 bg-slate-100 rounded-lg p-0.5 border border-slate-200 shrink-0">
                  <button
                    onClick={() => updateQuantity(item.id, -1)}
                    className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition shadow-2xs"
                    title={isPeso ? "Restar 0.250 Kg" : "Restar 1"}
                    type="button"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                  <span className="min-w-[28px] text-center text-[11px] font-extrabold text-slate-800 font-mono">
                    {isPeso ? Number(item.cantidad).toFixed(3) : item.cantidad}
                  </span>
                  <button
                    onClick={() => updateQuantity(item.id, 1)}
                    className="w-6 h-6 rounded bg-white text-slate-700 hover:bg-slate-200 flex items-center justify-center font-bold text-xs transition shadow-2xs"
                    title={isPeso ? "Sumar 0.250 Kg" : "Sumar 1"}
                    type="button"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                <button
                  onClick={() => removeFromCart(item.id)}
                  className="text-slate-400 hover:text-rose-600 p-1 opacity-60 group-hover:opacity-100 transition rounded-lg hover:bg-rose-50"
                  title="Eliminar producto"
                  type="button"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Summary and Action Button */}
      <div className="p-4 border-t border-gray-200 bg-slate-50/80 space-y-3">
        <div className="space-y-1 text-xs text-slate-600">
          <div className="flex justify-between items-center">
            <span>Subtotal:</span>
            <span className="font-semibold text-slate-800">Bs. {Number(total).toFixed(2)}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Impuestos / SIAT:</span>
            <span className="text-emerald-600 font-semibold">Incluido</span>
          </div>
          <div className="pt-1.5 border-t border-slate-200 flex justify-between items-baseline">
            <span className="text-sm font-bold text-slate-800">Total a Cobrar:</span>
            <span className={`text-xl font-black text-[#2563eb] transition-transform duration-200 ${
              isBumping ? 'scale-110 text-indigo-600' : 'scale-100'
            }`}>
              Bs. {Number(total).toFixed(2)}
            </span>
          </div>

          {/* Quick Fast Cash Change suggestions */}
          {items.length > 0 && (
            <div className="pt-2 border-t border-slate-200/80 space-y-1">
              <span className="text-[10px] text-slate-400 font-medium block">
                Pago sugerido en efectivo:
              </span>
              <div className="grid grid-cols-4 gap-1 text-[10px]">
                {[20, 50, 100, 200].map((b) => {
                  if (b < total) return null;
                  const cambio = b - total;
                  return (
                    <button
                      key={b}
                      onClick={onOpenCheckout}
                      type="button"
                      title={`Paga con Bs. ${b} • Vuelto: Bs. ${cambio.toFixed(2)}`}
                      className="py-1 px-1 bg-white hover:bg-blue-50 hover:text-blue-700 hover:border-blue-300 border border-slate-200 rounded-lg font-bold text-slate-700 transition shadow-2xs text-center truncate"
                    >
                      Bs. {b}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={onOpenCheckout}
          disabled={items.length === 0}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-blue-600 via-blue-700 to-[#7c3aed] hover:from-blue-700 hover:to-[#6d28d9] active:scale-[0.98] text-white rounded-xl font-bold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center space-x-2 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          <Receipt className="w-4 h-4" />
          <span>Cobrar / Procesar Pago</span>
          <ArrowRight className="w-4 h-4 ml-1" />
        </button>
      </div>
    </aside>
  );
}
