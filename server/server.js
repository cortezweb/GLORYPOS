require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');

const tenantRoutes = require('./routes/tenant');
const salesRoutes = require('./routes/sales');
const emailRoutes = require('./routes/email');

const app = express();
const PORT = process.env.PORT || 3001;

// ── SEGURIDAD Y MIDDLEWARES ──────────────────────────────────────────────────
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// Configuración CORS flexible para subdominios y Cloudflare Pages
const allowedOriginRegex = /^(https?:\/\/localhost(:\d+)?|https?:\/\/127\.0\.0\.1(:\d+)?|https:\/\/.*\.pages\.dev|https:\/\/.*\.glorypos\.bo)$/;

app.use(cors({
  origin: (origin, callback) => {
    // Permitir solicitudes sin origen (ej. curl, postman, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOriginRegex.test(origin)) {
      return callback(null, true);
    }
    // En producción permitir orígenes explícitos configurados
    if (process.env.CLIENT_URL && origin === process.env.CLIENT_URL) {
      return callback(null, true);
    }
    return callback(null, true); // Permisivo en desarrollo / APIs públicas del SaaS
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-tenant-slug']
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── RUTAS DE HEALTH CHECK ────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'glorypos-saas-api',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    mode: process.env.NODE_ENV || 'development',
    port: PORT,
    supabaseConfigured: Boolean(process.env.SUPABASE_URL)
  });
});

// ── RUTAS PRINCIPALES DEL SAAS ───────────────────────────────────────────────
app.use('/api/tenants', tenantRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/email', emailRoutes);

// ── MANEJO GLOBAL DE ERRORES ────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('[server error]', err);
  res.status(err.status || 500).json({
    success: false,
    error: err.message || 'Error interno del servidor'
  });
});

// ── INICIO DEL SERVIDOR ──────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.info(`🚀 GloryPOS SaaS Backend corriendo en puerto ${PORT}`);
  console.info(`📍 Health check: http://localhost:${PORT}/api/health`);
});
