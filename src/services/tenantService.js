import { supabase, isSupabaseConfigured, isDemoMode, setSupabaseTenantSlug } from '../lib/supabase';
import { db, switchTenantDatabase } from '../db/dexie';

const RESERVED_SUBDOMAINS = ['www', 'app', 'pos', 'api', 'cdn', 'static', 'mail', 'staging', 'dev'];
const BASE_DOMAIN = String(import.meta.env.VITE_BASE_DOMAIN || '').toLowerCase().replace(/^\.+/, '');

/**
 * Convierte un nombre en un slug URL-friendly
 * Ej: "Minimarket & Abarrotes El Prado!" -> "minimarket-el-prado"
 */
export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Elimina acentos
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30);
}

export const tenantService = {
  /**
   * Determina si estamos corriendo en entorno de desarrollo local
   */
  isLocalDev() {
    if (typeof window === 'undefined') return true;
    const host = window.location.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host.endsWith('.local') ||
      /^192\.168\./.test(host) ||
      /^10\./.test(host)
    );
  },

  /**
   * En producción web, extrae el subdominio de la URL
   * Ej: "tienda-sol.glorypos.bo" -> "tienda-sol"
   */
  detectSubdomain() {
    if (typeof window === 'undefined') return null;
    if (this.isLocalDev()) return null;

    const host = window.location.hostname.toLowerCase();
    // Con VITE_BASE_DOMAIN (ej. "glorypos.com.bo") el subdominio se calcula sin ambigüedad
    if (BASE_DOMAIN) {
      if (!host.endsWith(`.${BASE_DOMAIN}`)) return null;
      const sub = host.slice(0, -(BASE_DOMAIN.length + 1)).split('.').pop();
      return sub && !RESERVED_SUBDOMAINS.includes(sub) ? sub : null;
    }

    const parts = host.split('.');
    // Necesitamos al menos 3 partes (sub.dominio.tld) o 4 (sub.dominio.com.bo)
    if (parts.length >= 3) {
      const sub = parts[0].toLowerCase();
      if (!RESERVED_SUBDOMAINS.includes(sub)) {
        return sub;
      }
    }
    return null;
  },

  /**
   * Dirección web de una empresa (su subdominio), o null si no hay dominio base configurado
   */
  urlForTenant(slug) {
    if (typeof window === 'undefined' || !BASE_DOMAIN || this.isLocalDev()) return null;
    return `${window.location.protocol}//${slugify(slug)}.${BASE_DOMAIN}`;
  },

  /**
   * Obtiene el slug de la empresa activa según prioridad:
   * 1. Subdominio en producción
   * 2. Query param (?empresa=xxx), solo en desarrollo local o modo demo
   * 3. localStorage (empresa elegida en este dispositivo)
   * 4. Fallback por defecto ('admin')
   */
  getActiveTenantSlug() {
    if (typeof window === 'undefined') return 'admin';

    // 1. Subdominio web: en producción manda siempre el subdominio
    const sub = this.detectSubdomain();
    if (sub) return sub;

    // 2. Query param solo para pruebas en desarrollo local o modo demo
    if (this.isLocalDev() || isDemoMode) {
      const params = new URLSearchParams(window.location.search);
      const paramSlug = params.get('empresa') || params.get('tenant');
      if (paramSlug) return slugify(paramSlug);
    }

    // 3. Empresa elegida en este dispositivo
    const stored = localStorage.getItem('glorypos_tenant_slug');
    if (stored) return slugify(stored);

    // 4. Default: consola de la plataforma (solo entra un Super Admin autenticado)
    return 'admin';
  },

  /**
   * Guarda el slug de la empresa seleccionada en local
   */
  setActiveTenantSlug(slug) {
    if (typeof window === 'undefined') return;
    const clean = slugify(slug);
    if (clean) {
      localStorage.setItem('glorypos_tenant_slug', clean);
    }
  },

  /**
   * Limpia la selección de empresa local
   */
  clearActiveTenantSlug() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('glorypos_tenant_slug');
  },

  /**
   * ¿Hay una sesión de Supabase Auth en este dispositivo?
   */
  async hasCloudSession() {
    if (!isSupabaseConfigured || !supabase) return false;
    try {
      const { data } = await supabase.auth.getSession();
      return Boolean(data?.session);
    } catch {
      return false;
    }
  },

  /**
   * Id real de la empresa en la nube. En Dexie la empresa se guarda con la clave
   * 'empresa_activa'; su id de Supabase va en cloud_id.
   */
  async getCloudEmpresaId() {
    try {
      const local = await db.config_empresa.get('empresa_activa');
      if (!local) return null;
      if (local.cloud_id) return local.cloud_id;
      return local.id && local.id !== 'empresa_activa' ? local.id : null;
    } catch {
      return null;
    }
  },

  /**
   * Consulta los datos de la empresa por su slug.
   * Sin sesión solo se leen los datos públicos (RPC empresa_publica); con sesión,
   * la fila completa que permite RLS. Fallback a Dexie sin conexión.
   */
  async getTenantBySlug(slug) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return null;
    setSupabaseTenantSlug(cleanSlug);

    // 1. Intentar consultar en Supabase
    if (isSupabaseConfigured && navigator.onLine && supabase) {
      try {
        const { data: publica, error } = await supabase.rpc('empresa_publica', { p_slug: cleanSlug });
        if (!error && publica?.id) {
          let data = publica;
          if (await this.hasCloudSession()) {
            const { data: completa } = await supabase
              .from('empresas')
              .select('*')
              .eq('id', publica.id)
              .maybeSingle();
            if (completa) data = completa;
          }
          const previa = await db.config_empresa.get('empresa_activa');
          // Guardar copia local en Dexie para soporte offline (conserva los ajustes locales)
          await db.config_empresa.put({
            ...(previa?.cloud_id === data.id ? previa : {}),
            ...data,
            id: 'empresa_activa',
            cloud_id: data.id,
            slug: cleanSlug,
          });
          return data;
        }
      } catch (err) {
        console.warn('[tenantService] Error al consultar Supabase:', err);
      }
    }

    // 2. Fallback a Dexie local
    try {
      const local = await db.config_empresa.get('empresa_activa');
      if (local && (local.slug === cleanSlug || (cleanSlug === 'admin' && isDemoMode))) {
        return {
          ...local,
          id: local.cloud_id || local.id,
          slug: local.slug || cleanSlug,
        };
      }
    } catch (err) {
      console.warn('[tenantService] Error al consultar Dexie:', err);
    }

    // 3. Fallback especial para slug 'admin' (consola de la plataforma / demo local)
    if (cleanSlug === 'admin') {
      return {
        id: 'empresa_activa',
        slug: 'admin',
        nombre: 'GLORYPOS BOLIVIA S.R.L.',
        nit_ci: '8472910014',
        rubro: 'ABARROTES',
        plan_tipo: 'PRO',
        ciudad: 'Santa Cruz, Bolivia',
        direccion: 'Av. Monseñor Rivero #240',
        telefono: '77012345',
        estado_suscripcion: 'ACTIVO',
        modulos_activos: [
          'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
          'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
          'contabilidad', 'reportes', 'tienda_virtual', 'restaurante', 'farmacia', 'hoteles'
        ]
      };
    }

    return null;
  },

  /**
   * Rol del usuario autenticado en la empresa del subdominio (y si es Super Admin).
   * También vincula invitaciones pendientes hechas a su correo.
   */
  async getMembership(slug) {
    if (!isSupabaseConfigured || !supabase) return null;
    const { data, error } = await supabase.rpc('mi_membresia', { p_slug: slugify(slug) });
    if (error) throw error;
    return data;
  },

  /**
   * Carga los usuarios pertenecientes al tenant. Con Supabase solo se consultan
   * con una sesión iniciada (RLS deja ver únicamente los de la propia empresa).
   */
  async getTenantUsers(empresaId) {
    if (isSupabaseConfigured && navigator.onLine && supabase && empresaId && empresaId !== 'empresa_activa'
        && await this.hasCloudSession()) {
      try {
        const { data, error } = await supabase
          .from('usuarios')
          .select('*')
          .eq('empresa_id', empresaId)
          .eq('activo', true);

        if (data && !error && data.length > 0) {
          return data;
        }
      } catch (err) {
        console.warn('[tenantService] Error al traer usuarios de Supabase:', err);
      }
    }

    // Fallback a los usuarios locales en Dexie (los de este dispositivo)
    try {
      const localUsers = await db.usuarios.toArray();
      return localUsers.filter(u => u.activo !== false);
    } catch {
      return [];
    }
  },

  /**
   * Registra una nueva empresa en el SaaS con sus módulos decididos por el SuperAdmin
   */
  async registerTenant(empresaData) {
    // Con Supabase, la empresa la crea el servidor (RPC registrar_empresa): decide el id,
    // valida el subdominio, fija la prueba de 30 días y deja al usuario como ADMIN.
    if (isSupabaseConfigured && supabase && !isDemoMode) {
      return this.registerTenantCloud(empresaData);
    }

    const slug = slugify(empresaData.slug || empresaData.nombre);
    const empresaId = `emp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    const newEmpresa = {
      id: empresaId,
      slug,
      nombre: empresaData.nombre.trim(),
      nit_ci: empresaData.nit_ci?.trim() || '0',
      rubro: empresaData.rubro || 'ABARROTES',
      plan_tipo: empresaData.plan_tipo || 'TRIAL',
      ciudad: empresaData.ciudad || 'Santa Cruz',
      direccion: empresaData.direccion || '',
      telefono: empresaData.telefono || '',
      email: empresaData.email || '',
      modulos_activos: empresaData.modulos_activos || [
        'preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario',
        'finanzas', 'guias_remision', 'comprobantes_pendientes', 'documentos_avanzados',
        'contabilidad', 'reportes', 'tienda_virtual'
      ],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Cambiar a la base de datos local aislada del nuevo inquilino
    await switchTenantDatabase(slug);

    // Guardar en Dexie como empresa activa dentro de su base aislada
    await db.config_empresa.put({
      ...newEmpresa,
      id: 'empresa_activa',
      propietario: empresaData.adminNombre || 'Administrador',
      estado_suscripcion: 'ACTIVO',
      dias_prueba: 30,
      fecha_inicio: new Date().toISOString(),
      fecha_vencimiento: new Date(Date.now() + 30 * 86400000).toISOString(),
    });

    this.setActiveTenantSlug(slug);
    return newEmpresa;
  },

  async registerTenantCloud(empresaData) {
    const { data, error } = await supabase.rpc('registrar_empresa', {
      p_empresa: {
        slug: slugify(empresaData.slug || empresaData.nombre),
        nombre: empresaData.nombre,
        nit_ci: empresaData.nit_ci,
        rubro: empresaData.rubro,
        ciudad: empresaData.ciudad,
        direccion: empresaData.direccion,
        telefono: empresaData.telefono,
        email: empresaData.email,
        propietario: empresaData.adminNombre,
        // Solo los toma en cuenta el servidor si quien llama es Super Admin
        plan_tipo: empresaData.plan_tipo,
        duracion_dias: empresaData.duracion_dias,
        modulos_activos: empresaData.modulos_activos,
        admin_email: empresaData.admin_email,
      },
    });
    if (error) throw new Error(error.message);
    return data;
  },

  /**
   * Prepara la base local del dispositivo para una empresa ya creada en la nube.
   */
  async activateCloudTenantLocally(empresa) {
    await switchTenantDatabase(empresa.slug);
    await db.config_empresa.put({ ...empresa, id: 'empresa_activa', cloud_id: empresa.id });
    this.setActiveTenantSlug(empresa.slug);
    setSupabaseTenantSlug(empresa.slug);
  },

  /**
   * Actualiza los módulos activos asignados a una empresa
   */
  async updateTenantModules(slug, modulos_activos) {
    const clean = slugify(slug);
    if (!clean) return { success: false, error: 'Slug inválido' };

    try {
      // 1. Si es la activa en Dexie
      const active = await db.config_empresa.get('empresa_activa');
      if (active && (active.slug === clean || clean === 'admin')) {
        await db.config_empresa.update('empresa_activa', { modulos_activos });
      }

      // 2. En Supabase si está configurado y la columna existe
      if (isSupabaseConfigured && navigator.onLine && supabase) {
        try {
          // Se filtra por el slug del cliente editado, no por la empresa activa en este navegador
          const { error } = await supabase
            .from('empresas')
            .update({ modulos_activos, updated_at: new Date().toISOString() })
            .eq('slug', clean);
          if (error) throw error;
        } catch (sErr) {
          console.warn('[tenantService] Supabase modulos_activos pendiente de migración SQL:', sErr);
        }
      }

      return { success: true };
    } catch (err) {
      console.error('[tenantService] Error al actualizar módulos:', err);
      return { success: false, error: err.message };
    }
  }
};
