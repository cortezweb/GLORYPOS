import React from 'react';
import { Lock, QrCode, MessageCircle, Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ExpiredScreen() {
  const { empresa, setTrialDays } = useAuth();

  const handleWhatsApp = () => {
    const msg = encodeURIComponent(
      `Hola GLORYPOS Bolivia, mi periodo de prueba ha finalizado y deseo renovar la suscripción de mi negocio: *${empresa?.nombre}* (NIT: ${empresa?.nit_ci}).`
    );
    window.open(`https://wa.me/59177012345?text=${msg}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="relative w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl text-center space-y-4 animate-scaleUp">
        {/* Icon */}
        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-2xl mx-auto flex items-center justify-center shadow-inner">
          <Lock className="w-8 h-8" />
        </div>

        {/* Text */}
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-600 block">
            Acceso Suspendido Temporalmente
          </span>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1">
            Tu Periodo de Prueba Finalizó
          </h2>
          <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
            Esperamos que hayas disfrutado la rapidez de GLORYPOS. Tus datos, productos y ventas siguen guardados de forma segura.
          </p>
        </div>

        {/* QR de Pago en Bolivia */}
        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-2">
          <p className="text-xs font-bold text-slate-800">
            Escanea para pagar tu suscripción mensual:
          </p>
          <div className="inline-block p-2 bg-white rounded-xl shadow-xs border border-slate-200">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=GLORYPOS_PAGO_SUSCRIPCION_BOLIVIA"
              alt="QR Pago"
              className="w-32 h-32 mx-auto"
            />
          </div>
          <span className="text-[11px] font-extrabold text-indigo-600 block">
            Monto: Bs. 99 (Plan Básico) / Bs. 199 (Plan PRO)
          </span>
        </div>

        {/* WhatsApp Notification Button */}
        <div className="space-y-2">
          <button
            onClick={handleWhatsApp}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar Comprobante por WhatsApp</span>
          </button>

          {/* Shortcut to unblock during local testing */}
          <button
            onClick={() => setTrialDays(30)}
            className="w-full py-2 text-slate-400 hover:text-indigo-600 text-[11px] font-semibold flex items-center justify-center gap-1"
          >
            <RefreshCw className="w-3 h-3" />
            <span>(Modo Prueba: Reactivar 30 días gratis)</span>
          </button>
        </div>
      </div>
    </div>
  );
}
