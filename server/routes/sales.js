const express = require('express');
const router = express.Router();
const { supabaseAdmin, authenticateUser } = require('../middleware/auth');

/**
 * POST /api/sales/atomic
 * Registra una venta POS de forma atómica en Supabase utilizando la función RPC PostgreSQL
 * con bloqueo de filas (SELECT ... FOR UPDATE) para evitar condiciones de carrera en inventario.
 */
router.post('/atomic', authenticateUser, async (req, res) => {
  try {
    const { venta, items } = req.body;

    if (!venta || !venta.id || !Array.isArray(items)) {
      return res.status(400).json({
        success: false,
        error: 'Estructura inválida. Se requiere { venta, items } con id de venta'
      });
    }

    // Asegurar que la empresa_id pertenezca al usuario autenticado (Prevenir spoofing)
    venta.empresa_id = req.user.empresa_id || venta.empresa_id || 'empresa_activa';
    venta.usuario_id = req.user.id || venta.usuario_id;
    venta.usuario_nombre = req.user.nombre || venta.usuario_nombre;

    if (!supabaseAdmin) {
      return res.json({
        success: true,
        message: 'Modo local/offline sin conexión a Supabase Backend. Venta procesada en cliente.',
        venta_id: venta.id,
        correlativo: venta.correlativo
      });
    }

    // Llamar a la función RPC atómica en PostgreSQL
    const { data, error } = await supabaseAdmin.rpc('realizar_venta_pos_atomica', {
      p_venta: venta,
      p_items: items
    });

    if (error) {
      console.error('[sales route] Error en RPC realizar_venta_pos_atomica:', error);
      return res.status(500).json({
        success: false,
        error: error.message || 'Error en transacción atómica de venta'
      });
    }

    res.json({
      success: true,
      data
    });
  } catch (err) {
    console.error('[sales route] Excepción procesando venta atómica:', err);
    res.status(500).json({
      success: false,
      error: err.message || 'Error interno del servidor'
    });
  }
});

module.exports = router;
