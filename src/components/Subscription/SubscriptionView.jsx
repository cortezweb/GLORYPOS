import React from 'react';
import { 
  Sparkles, ShieldCheck, CheckCircle2, QrCode, MessageCircle, 
  Clock, AlertCircle, RefreshCw 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function SubscriptionView() {
  const { empresa, diasRestantes, isExpired, setTrialDays, cambiarPlan, simularVencimiento } = useAuth();

  const handleWhatsAppRenew = (planNombre) => {
    const msg = encodeURIComponent(
      `Hola GLORYPOS Bolivia, deseo activar/renovar mi suscripción para el negocio: *${empresa?.nombre}* (NIT/CI: ${empresa?.nit_ci}) al *${planNombre}*.`
    );
    window.open(`https://wa.me/59177012345?text=${msg}`, '_blank');
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-24">
      {/* Current Subscription Status Header */}
      <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-indigo-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-amber-300" />
            Estado de Suscripción SaaS
          </span>
          <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
            isExpired ? 'bg-rose-500 text-white' : 'bg-emerald-400 text-slate-950'
          }`}>
            {isExpired ? 'VENCIDO' : 'ACTIVO'}
          </span>
        </div>

        <h2 className="text-xl font-extrabold leading-tight">
          {empresa?.plan_tipo === 'TRIAL' ? 'Periodo de Prueba Gratuita' : `Plan ${empresa?.plan_tipo}`}
        </h2>
        <p className="text-xs text-slate-300 mt-1">
          {isExpired 
            ? 'Tu suscripción ha finalizado. Renueva para continuar vendiendo.' 
            : `Te quedan ${diasRestantes} días de acceso completo a GLORYPOS.`}
        </p>

        {/* Progress Bar */}
        <div className="mt-4 pt-3 border-t border-white/10 flex items-center justify-between text-xs">
          <span className="text-slate-400">Negocio: {empresa?.nombre}</span>
          <span className="font-bold text-amber-300">{diasRestantes} días restantes</span>
        </div>
      </div>

      {/* Plans Comparison */}
      <div className="p-4 space-y-3">
        <h3 className="font-bold text-slate-800 text-sm">Planes de Suscripción para Bolivia</h3>

        {/* Plan Básico */}
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-600">
                Ideal para Tiendas y Comercio
              </span>
              <h4 className="font-bold text-slate-900 text-base">Plan Básico POS</h4>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900">Bs. 99</span>
              <span className="text-[10px] text-slate-500 block">/ mes</span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-600">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Punto de Venta PWA Offline-First</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Acceso al Catálogo Maestro de Bolivia</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Impresión térmica de Recibos / Notas de Venta</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Control de Inventario y Caja Chica</span>
            </li>
          </ul>

          <button
            onClick={() => handleWhatsAppRenew('Plan Básico (Bs. 99/mes)')}
            className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span>Contratar Plan Básico</span>
          </button>
        </div>

        {/* Plan PRO con SIAT */}
        <div className="p-4 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-2xl border-2 border-indigo-500 shadow-md space-y-3 relative overflow-hidden">
          <div className="absolute top-2 right-2 bg-indigo-600 text-white text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider">
            Recomendado
          </div>

          <div className="flex items-start justify-between">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                Facturación Oficial SIN
              </span>
              <h4 className="font-bold text-slate-900 text-base">Plan PRO SIAT</h4>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-indigo-900">Bs. 199</span>
              <span className="text-[10px] text-slate-500 block">/ mes</span>
            </div>
          </div>

          <ul className="space-y-1.5 text-xs text-slate-700">
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Todo lo incluido en el Plan Básico</span>
            </li>
            <li className="flex items-center gap-2 font-bold text-indigo-950">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Emisión de Facturas Electrónicas SIAT</span>
            </li>
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Firma digital XML y sincronización con el SIN</span>
            </li>
            <li className="flex items-center gap-2 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>Soporte de contingencia offline ante caídas del SIN</span>
            </li>
          </ul>

          <button
            onClick={() => handleWhatsAppRenew('Plan PRO SIAT (Bs. 199/mes)')}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition-all flex items-center justify-center gap-2"
          >
            <Sparkles className="w-4 h-4 text-amber-300" />
            <span>Activar Plan PRO SIAT</span>
          </button>
        </div>

        {/* Testing Shortcuts Panel */}
        <div className="p-3 bg-white rounded-2xl border border-slate-200 text-xs space-y-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
            Herramientas para Demostración / Pruebas:
          </span>
          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => setTrialDays(30)}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-800 font-semibold text-[11px] text-center"
            >
              Probar 30 Días Gratis
            </button>
            <button
              onClick={() => setTrialDays(90)}
              className="px-2.5 py-2 rounded-xl bg-slate-100 hover:bg-indigo-50 text-slate-800 font-semibold text-[11px] text-center"
            >
              Probar 90 Días (3m)
            </button>
            <button
              onClick={() => cambiarPlan('PRO')}
              className="px-2.5 py-2 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] text-center"
            >
              Activar Modo PRO SIAT
            </button>
            <button
              onClick={() => simularVencimiento(true)}
              className="px-2.5 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] text-center"
            >
              Simular Plan Vencido
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
