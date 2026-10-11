const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';

const supabaseAdmin = (supabaseUrl && supabaseServiceKey)
  ? createClient(supabaseUrl, supabaseServiceKey)
  : null;

/**
 * Middleware para validar el JWT de Supabase Auth
 */
async function authenticateUser(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        error: 'Token de autorización ausente o inválido'
      });
    }

    const token = authHeader.split(' ')[1];

    if (!supabaseAdmin) {
      // Modo desarrollo sin Supabase configurado en el backend
      req.user = { id: 'dev-user', email: 'dev@glorypos.bo', rol: 'ADMIN' };
      return next();
    }

    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Sesión no válida o expirada'
      });
    }

    // Consultar el perfil y tenant_id del usuario
    const { data: profile } = await supabaseAdmin
      .from('usuarios')
      .select('id, empresa_id, rol, nombre, email, activo')
      .eq('id', user.id)
      .maybeSingle();

    req.user = {
      ...user,
      empresa_id: profile?.empresa_id || user.user_metadata?.empresa_id || 'empresa_activa',
      rol: profile?.rol || user.user_metadata?.rol || 'CAJERO',
      nombre: profile?.nombre || user.user_metadata?.nombre || user.email
    };

    next();
  } catch (err) {
    console.error('[auth middleware] Error:', err);
    res.status(500).json({ success: false, error: 'Error interno de autenticación' });
  }
}

/**
 * Middleware para requerir roles específicos
 */
function requireRole(allowedRoles = []) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, error: 'No autenticado' });
    }

    const userRole = String(req.user.rol || '').toUpperCase();
    const roles = allowedRoles.map(r => r.toUpperCase());

    if (!roles.includes(userRole) && userRole !== 'SUPERADMIN') {
      return res.status(403).json({
        success: false,
        error: `Acceso denegado: se requiere uno de los roles [${allowedRoles.join(', ')}]`
      });
    }

    next();
  };
}

module.exports = {
  supabaseAdmin,
  authenticateUser,
  requireRole
};
