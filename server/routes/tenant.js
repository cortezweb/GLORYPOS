const express = require('express');
const router = express.Router();
const { supabaseAdmin, authenticateUser, requireRole } = require('../middleware/auth');

const RESERVED_SLUGS = ['admin', 'api', 'app', 'pos', 'www', 'mail', 'cdn', 'static', 'staging'];

/**
 * GET /api/tenants/:slug
 * Obtiene la información pública/comercial del tenant (branding, plan, módulos)
 */
router.get('/:slug', async (req, res) => {
  const slug = String(req.params.slug || '').toLowerCase().trim();

  if (!slug) {
    return res.status(400).json({ success: false, error: 'Slug requerido' });
  }

  // Fallback para admin / desarrollo
  if (slug === 'admin' && !supabaseAdmin) {
    return res.json({
      success: true,
      tenant: {
        id: 'empresa_activa',
        slug: 'admin',
        nombre: 'GLORYPOS BOLIVIA S.R.L.',
        rubro: 'ABARROTES',
        plan_tipo: 'PRO',
        estado_suscripcion: 'ACTIVO',
        modulos_activos: [
          'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
          'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
          'contabilidad', 'reportes', 'tienda_virtual', 'restaurante', 'farmacia', 'hoteles'
        ]
      }
    });
  }

  if (!supabaseAdmin) {
    return res.json({
      success: true,
      tenant: {
        id: `emp-${slug}`,
        slug: slug,
        nombre: `Empresa ${slug.toUpperCase()}`,
        rubro: 'GENERAL',
        plan_tipo: 'TRIAL',
        estado_suscripcion: 'ACTIVO',
        modulos_activos: ['ventas', 'productos', 'inventario', 'clientes']
      }
    });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('empresas')
      .select('id, slug, nombre, nit_ci, rubro, plan_tipo, ciudad, direccion, telefono, email, modulos_activos, estado_suscripcion, fecha_vencimiento')
      .eq('slug', slug)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ success: false, error: `Inquilino "${slug}" no encontrado` });
    }

    res.json({ success: true, tenant: data });
  } catch (err) {
    console.error('[tenant route] Error consultando empresa:', err);
    res.status(500).json({ success: false, error: 'Error consultando información del inquilino' });
  }
});

/**
 * POST /api/tenants
 * Registro de una nueva empresa / inquilino en la plataforma SaaS
 */
router.post('/', async (req, res) => {
  try {
    const {
      nombre,
      slug: rawSlug,
      nit_ci,
      rubro,
      plan_tipo = 'TRIAL',
      adminNombre,
      adminEmail,
      adminPassword,
      ciudad = 'Santa Cruz',
      telefono,
      modulos_activos = [
        'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
        'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
        'contabilidad', 'reportes', 'tienda_virtual'
      ]
    } = req.body;

    if (!nombre) {
      return res.status(400).json({ success: false, error: 'El nombre comercial es obligatorio' });
    }

    const slug = String(rawSlug || nombre)
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 30);

    if (RESERVED_SLUGS.includes(slug) && slug !== 'admin') {
      return res.status(400).json({ success: false, error: `El subdominio "${slug}" está reservado por el sistema` });
    }

    const empresaId = `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const fechaInicio = new Date().toISOString();
    const fechaVencimiento = new Date(Date.now() + 30 * 86400000).toISOString();

    const newEmpresa = {
      id: empresaId,
      slug,
      nombre: nombre.trim(),
      nit_ci: nit_ci || '0',
      rubro: rubro || 'ABARROTES',
      plan_tipo,
      ciudad,
      telefono: telefono || '',
      email: adminEmail || '',
      estado_suscripcion: 'ACTIVO',
      dias_prueba: 30,
      fecha_inicio: fechaInicio,
      fecha_vencimiento: fechaVencimiento,
      modulos_activos,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    if (supabaseAdmin) {
      // 1. Verificar si el slug ya existe
      const { data: existing } = await supabaseAdmin
        .from('empresas')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      if (existing) {
        return res.status(400).json({ success: false, error: `El identificador/subdominio "${slug}" ya está en uso.` });
      }

      // 2. Guardar empresa
      const { error: empError } = await supabaseAdmin.from('empresas').insert(newEmpresa);
      if (empError) throw empError;

      // 3. Crear usuario admin si se suministró correo y clave
      if (adminEmail && adminPassword) {
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: adminEmail,
          password: adminPassword,
          email_confirm: true,
          user_metadata: {
            nombre: adminNombre || 'Administrador',
            empresa_id: empresaId,
            rol: 'ADMIN'
          }
        });

        if (!authError && authUser?.user) {
          await supabaseAdmin.from('usuarios').insert({
            id: authUser.user.id,
            empresa_id: empresaId,
            email: adminEmail,
            nombre: adminNombre || 'Administrador',
            rol: 'ADMIN',
            activo: true,
            created_at: new Date().toISOString()
          });
        }
      }
    }

    res.status(201).json({
      success: true,
      message: 'Empresa creada exitosamente',
      empresa: newEmpresa
    });
  } catch (err) {
    console.error('[tenant route] Error creando empresa:', err);
    res.status(500).json({ success: false, error: err.message || 'Error al registrar empresa' });
  }
});

/**
 * PUT /api/tenants/:slug/modules
 * Actualiza los módulos habilitados para el inquilino (Protegido: ADMIN / SUPERADMIN)
 */
router.put('/:slug/modules', authenticateUser, requireRole(['ADMIN', 'SUPERADMIN']), async (req, res) => {
  try {
    const { modulos_activos } = req.body;
    const slug = req.params.slug;

    if (!Array.isArray(modulos_activos)) {
      return res.status(400).json({ success: false, error: 'modulos_activos debe ser una lista' });
    }

    if (supabaseAdmin) {
      const { error } = await supabaseAdmin
        .from('empresas')
        .update({ modulos_activos, updated_at: new Date().toISOString() })
        .eq('slug', slug);

      if (error) throw error;
    }

    res.json({ success: true, message: 'Módulos actualizados con éxito', modulos_activos });
  } catch (err) {
    console.error('[tenant route] Error actualizando módulos:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar módulos' });
  }
});

module.exports = router;
