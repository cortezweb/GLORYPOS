import React, { useEffect, useState } from 'react';
import { X, Send, Mail, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { cotizacionPdfBase64, descargarCotizacionPdf, nombreArchivoCotizacion } from '../../utils/cotizacionPdf';
import { enviarPdfPorCorreo, abrirCorreoManual, correoValido, envioAutomaticoDisponible } from '../../services/emailService';

// Envía la cotización en PDF al correo de una persona
export default function CotizacionEmailModal({ cot, empresa, vendedor, correoInicial = '', onClose }) {
  const nombreEmpresa = empresa?.nombre || 'GLORYPOS';
  const nombreCliente = cot.cliente_nombre && !/varios|general/i.test(cot.cliente_nombre) ? cot.cliente_nombre : '';
  const [para, setPara] = useState(correoInicial);
  const [asunto, setAsunto] = useState(`Cotización ${cot.correlativo} - ${nombreEmpresa}`);
  const [mensaje, setMensaje] = useState(
    `Hola ${nombreCliente},\n\nAdjuntamos la cotización ${cot.correlativo}. Quedamos atentos a tus comentarios.\n\nSaludos,\n${nombreEmpresa}`
  );
  const [estado, setEstado] = useState('editando'); // editando | enviando | enviado | manual | error
  const [detalle, setDetalle] = useState('');

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const enviar = async (e) => {
    e.preventDefault();
    if (!correoValido(para)) {
      setEstado('error');
      setDetalle('Escribe un correo válido.');
      return;
    }
    setEstado('enviando');
    setDetalle('');
    const res = await enviarPdfPorCorreo({
      para: para.trim(),
      asunto,
      mensaje,
      nombreArchivo: nombreArchivoCotizacion(cot),
      pdfBase64: cotizacionPdfBase64(cot, empresa, vendedor),
      responderA: empresa?.email,
      nombreRemitente: nombreEmpresa,
    });
    if (res.ok) {
      setEstado('enviado');
    } else if (res.motivo === 'no_configurado') {
      setEstado('manual');
      setDetalle(res.mensaje);
    } else {
      setEstado('error');
      setDetalle(res.mensaje);
    }
  };

  // Sin servidor de correo: se descarga el PDF y se abre el correo del usuario para adjuntarlo
  const usarMiCorreo = () => {
    descargarCotizacionPdf(cot, empresa, vendedor);
    abrirCorreoManual({
      para: para.trim(),
      asunto,
      mensaje: `${mensaje}\n\n(Adjunta el archivo ${nombreArchivoCotizacion(cot)} que se descargó.)`,
    });
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto" onClick={onClose}>
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-3.5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-[#FF6B35]" />
            <h3 className="font-bold text-sm text-slate-900">Enviar cotización por correo</h3>
          </div>
          <button type="button" onClick={onClose} className="text-slate-500 hover:text-slate-800 p-1" aria-label="Cerrar">
            <X className="w-5 h-5" />
          </button>
        </div>

        {estado === 'enviado' ? (
          <div className="p-6 text-center space-y-3">
            <CheckCircle2 className="w-10 h-10 text-[#FF6B35] mx-auto" />
            <p className="text-sm font-semibold text-slate-900">Cotización enviada a {para.trim()}</p>
            <p className="text-xs text-slate-500">Se envió el PDF {nombreArchivoCotizacion(cot)} adjunto.</p>
            <button type="button" onClick={onClose} className="px-5 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#E85B28] text-white text-xs font-bold">
              Listo
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="p-5 space-y-3 text-xs">
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Para (correo del destinatario) *</label>
              <input
                type="email"
                required
                value={para}
                onChange={(e) => setPara(e.target.value)}
                placeholder="cliente@correo.com"
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
                autoFocus
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Asunto</label>
              <input
                type="text"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-slate-700 mb-1">Mensaje</label>
              <textarea
                rows={5}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-xs focus:border-[#FF6B35] focus:ring-1 focus:ring-[#FF6B35] outline-none resize-none"
              />
            </div>

            <p className="text-[11px] text-slate-500">
              Se adjunta el PDF A4 <strong>{nombreArchivoCotizacion(cot)}</strong>.
              {!envioAutomaticoDisponible && ' El envío automático no está configurado: se descargará el PDF y se abrirá tu correo.'}
            </p>

            {estado === 'error' && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 text-rose-700 rounded-lg px-3 py-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{detalle}</span>
              </div>
            )}
            {estado === 'manual' && (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-lg px-3 py-2 space-y-2">
                <p>{detalle} Puedes descargar el PDF y enviarlo desde tu propio correo.</p>
                <button type="button" onClick={usarMiCorreo} className="px-3 py-1.5 rounded-lg bg-white border border-amber-300 text-amber-900 font-semibold hover:bg-amber-100">
                  Descargar PDF y abrir mi correo
                </button>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onClose} className="px-4 py-2 rounded-xl border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={estado === 'enviando'}
                className="px-4 py-2 rounded-xl bg-[#FF6B35] hover:bg-[#E85B28] text-white font-bold flex items-center gap-1.5 disabled:opacity-60"
              >
                {estado === 'enviando' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {estado === 'enviando' ? 'Enviando...' : envioAutomaticoDisponible ? 'Enviar' : 'Continuar'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
