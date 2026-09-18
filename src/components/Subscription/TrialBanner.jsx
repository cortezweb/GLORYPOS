import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function TrialBanner({ onOpenSubscription }) {
  const { empresa, diasRestantes, isExpired } = useAuth();

  if (empresa?.plan_tipo !== 'TRIAL' || isExpired) return null;

  return (
    <div 
      onClick={onOpenSubscription}
      className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 text-white px-4 py-2 flex items-center justify-between text-xs cursor-pointer shadow-xs active:opacity-95"
    >
      <div className="flex items-center gap-2 min-w-0">
        <Sparkles className="w-3.5 h-3.5 text-amber-300 shrink-0" />
        <span className="font-semibold truncate">
          Periodo de Prueba: Te quedan <strong className="text-amber-300 font-extrabold">{diasRestantes} días</strong>
        </span>
      </div>

      <div className="flex items-center gap-1 text-[11px] font-bold text-indigo-100 hover:text-white shrink-0">
        <span>Ver Planes</span>
        <ArrowRight className="w-3 h-3" />
      </div>
    </div>
  );
}
