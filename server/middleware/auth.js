const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

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
      // Modo desarrollo sin Supabase configurado en el backend (nunca en producción)
      if (process.env.NODE_ENV === 'production') {
        return res.status(503).json({ success: false, error: 'Servidor sin Supabase configurado' });
      }
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

    // Empresa y rol salen de tenant_members / platform_admins (nunca de user_metadata,
    // que el propio usuario puede editar)
    const [{ data: membership }, { data: platformAdmin }] = await Promise.all([
      supabaseAdmin
        .from('tenant_members')
        .select('empresa_id, rol')
        .eq('user_id', user.id)
        .eq('activo', true)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from('platform_admins')
        .select('user_id')
        .eq('user_id', user.id)
        .maybeSingle(),
    ]);

    req.user = {
      ...user,
      empresa_id: membership?.empresa_id || null,
      rol: platformAdmin ? 'SUPERADMIN' : (membership?.rol || null),
      nombre: user.user_metadata?.nombre || user.email
    };

    // Cliente con el token del usuario: RLS y get_current_tenant_id() se aplican como en la app
    req.supabaseUser = createClient(supabaseUrl, supabaseAnonKey || supabaseServiceKey, {
      global: { headers: { Authorization: `Bearer ${token}` } },
      auth: { persistSession: false, autoRefreshToken: false },
    });

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
