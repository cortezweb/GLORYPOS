const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();
const { authenticateUser } = require('../middleware/auth');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const MAX_PDF_BASE64 = 7 * 1024 * 1024; // ~5 MB de PDF

// Límite sencillo por usuario: 20 correos por hora
const envios = new Map();
function dentroDelLimite(userId) {
  const ahora = Date.now();
  const recientes = (envios.get(userId) || []).filter(t => ahora - t < 60 * 60 * 1000);
  if (recientes.length >= 20) return false;
  recientes.push(ahora);
  envios.set(userId, recientes);
  return true;
}

// Proveedor de correo: Gmail (SMTP con contraseña de aplicación) o Resend (dominio propio)
const proveedor = () => {
  if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) return 'gmail';
  if (process.env.RESEND_API_KEY && process.env.MAIL_FROM) return 'resend';
  return null;
};

let transporteGmail = null;
function obtenerTransporteGmail() {
  if (!transporteGmail) {
    transporteGmail = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
    });
  }
  return transporteGmail;
}

const escapar = (t) => String(t || '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

/**
 * POST /api/email/documento
 * Envía un PDF (cotización) por correo. Solo usuarios con sesión y empresa.
 * Proveedor (el primero que esté configurado):
 *  - Gmail: GMAIL_USER y GMAIL_APP_PASSWORD (contraseña de aplicación de Google).
 *  - Resend: RESEND_API_KEY y MAIL_FROM (ej. "GLORYPOS <documentos@tudominio.com>").
 */
router.post('/documento', authenticateUser, async (req, res) => {
  try {
    const via = proveedor();
    if (!via) {
      return res.status(503).json({ success: false, error: 'El envío de correos no está configurado en el servidor.' });
    }
    if (!req.user?.empresa_id && req.user?.rol !== 'SUPERADMIN') {
      return res.status(403).json({ success: false, error: 'Tu cuenta no pertenece a una empresa.' });
    }

    const { para, asunto: asunto0, mensaje, nombreArchivo, pdfBase64, responderA, nombreRemitente } = req.body || {};

    if (!EMAIL_RE.test(String(para || '').trim())) {
      return res.status(400).json({ success: false, error: 'El correo del destinatario no es válido.' });
    }
    if (!pdfBase64 || typeof pdfBase64 !== 'string' || pdfBase64.length > MAX_PDF_BASE64) {
      return res.status(400).json({ success: false, error: 'El PDF falta o es demasiado grande.' });
    }
    if (!/^[A-Za-z0-9+/=]+$/.test(pdfBase64)) {
      return res.status(400).json({ success: false, error: 'El PDF no es válido.' });
    }
    if (!dentroDelLimite(req.user.id)) {
      return res.status(429).json({ success: false, error: 'Demasiados correos enviados. Intenta más tarde.' });
    }

    const archivo = String(nombreArchivo || 'documento.pdf').replace(/[^\w.\-]/g, '_').slice(0, 80);
    const remitente = String(nombreRemitente || '').replace(/[<>"\r\n]/g, '').slice(0, 80);
    const cuerpo = escapar(String(mensaje || 'Le enviamos el documento adjunto.').slice(0, 2000)).replace(/\n/g, '<br>');

    const asunto = String(asunto0 || 'Documento').replace(/[\r\n]/g, ' ').slice(0, 150);
    const respuestaA = EMAIL_RE.test(String(responderA || '').trim()) ? String(responderA).trim() : null;

    if (via === 'gmail') {
      // Sale desde la cuenta Gmail del sistema; el nombre que se ve es el de la empresa
      try {
        await obtenerTransporteGmail().sendMail({
          from: `"${remitente || 'GLORYPOS'}" <${process.env.GMAIL_USER}>`,
          to: String(para).trim(),
          replyTo: respuestaA || undefined,
          subject: asunto,
          text: `${String(mensaje || 'Le enviamos el documento adjunto.').slice(0, 2000)}\n\n--\n${remitente ? `${remitente} · ` : ''}Enviado con GLORYPOS`,
          attachments: [{ filename: archivo, content: pdfBase64, encoding: 'base64', contentType: 'application/pdf' }],
        });
      } catch (err) {
        console.error('[email route] Gmail rechazó el envío:', err.code || '', err.responseCode || '', String(err.message).slice(0, 200));
        return res.status(502).json({ success: false, error: 'Gmail rechazó el envío. Revisa la contraseña de aplicación.' });
      }
      return res.json({ success: true });
    }

    const payload = {
      from: process.env.MAIL_FROM,
      to: [String(para).trim()],
      subject: asunto,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px;color:#1E2022">${cuerpo}<br><br><span style="color:#888;font-size:12px">${escapar(remitente)}${remitente ? ' · ' : ''}Enviado con GLORYPOS</span></div>`,
      attachments: [{ filename: archivo, content: pdfBase64 }],
    };
    if (respuestaA) payload.reply_to = respuestaA;

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!resp.ok) {
      const detalle = await resp.text().catch(() => '');
      console.error('[email route] Resend respondió', resp.status, detalle.slice(0, 300));
      return res.status(502).json({ success: false, error: 'El servicio de correo rechazó el envío.' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('[email route] Error enviando correo:', err);
    res.status(500).json({ success: false, error: 'Error al enviar el correo.' });
  }
});

module.exports = router;
