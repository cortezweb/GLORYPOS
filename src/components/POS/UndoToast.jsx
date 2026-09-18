import React, { useEffect } from 'react';
import { RotateCcw, X, Trash2 } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function UndoToast() {
  const { toastMessage, undoRemove, dismissToast } = useCart();

  useEffect(() => {
    if (!toastMessage) return;
    const timer = setTimeout(() => {
      dismissToast();
    }, 4500);
    return () => clearTimeout(timer);
  }, [toastMessage]);

  if (!toastMessage) return null;

  return (
    <div className="fixed bottom-20 lg:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-slideUp select-none max-w-[92vw] sm:max-w-md">
      <div className="bg-slate-900/95 backdrop-blur-md text-white px-4 py-2.5 rounded-2xl shadow-2xl border border-slate-800 flex items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-6 h-6 rounded-lg bg-red-500/20 text-red-400 flex items-center justify-center shrink-0">
            <Trash2 className="w-3.5 h-3.5" />
          </div>
          <span className="font-medium truncate text-slate-200">
            {toastMessage}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={undoRemove}
            className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-bold rounded-xl transition flex items-center gap-1 text-[11px] shadow-xs"
          >
            <RotateCcw className="w-3 h-3 stroke-[2.5]" />
            Deshacer
          </button>
          <button
            onClick={dismissToast}
            className="p-1 text-slate-400 hover:text-white rounded-lg transition"
            aria-label="Cerrar aviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
