// Envío de documentos por correo. El navegador no puede enviar correos con adjuntos por sí
// solo: se usa la API de GLORYPOS (server/, Railway) que envía con Resend. Si la API no está
// configurada, se descarga el PDF y se abre el correo del usuario para adjuntarlo.
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const API_URL = String(import.meta.env.VITE_API_URL || '').replace(/\/+$/, '');

export const envioAutomaticoDisponible = Boolean(API_URL) && isSupabaseConfigured;

export const correoValido = (correo) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(correo || '').trim());

// Devuelve { ok: true } o { ok: false, motivo: 'no_configurado' | 'error', mensaje }
export async function enviarPdfPorCorreo({ para, asunto, mensaje, nombreArchivo, pdfBase64, responderA, nombreRemitente }) {
  if (!envioAutomaticoDisponible) {
    return { ok: false, motivo: 'no_configurado', mensaje: 'El envío automático de correos no está configurado.' };
  }
  try {
    const { data } = await supabase.auth.getSession();
    const token = data?.session?.access_token;
    if (!token) return { ok: false, motivo: 'error', mensaje: 'Inicia sesión para enviar correos.' };

    const resp = await fetch(`${API_URL}/api/email/documento`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ para, asunto, mensaje, nombreArchivo, pdfBase64, responderA, nombreRemitente }),
    });
    const json = await resp.json().catch(() => ({}));
    if (resp.status === 503) return { ok: false, motivo: 'no_configurado', mensaje: json.error || 'El envío automático de correos no está configurado.' };
    if (!resp.ok || !json.success) return { ok: false, motivo: 'error', mensaje: json.error || 'No se pudo enviar el correo.' };
    return { ok: true };
  } catch (err) {
    return { ok: false, motivo: 'error', mensaje: 'No se pudo conectar con el servidor de correo.' };
  }
}

// Alternativa sin servidor: abre el correo del usuario con el asunto y el mensaje listos
export function abrirCorreoManual({ para, asunto, mensaje }) {
  const url = `mailto:${encodeURIComponent(para)}?subject=${encodeURIComponent(asunto)}&body=${encodeURIComponent(mensaje)}`;
  window.location.href = url;
}
