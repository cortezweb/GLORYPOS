import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { db } from '../db/dexie';

const RESERVED_SUBDOMAINS = ['www', 'app', 'pos', 'api', 'cdn', 'static', 'mail', 'staging', 'dev'];

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

    const parts = window.location.hostname.split('.');
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
   * Obtiene el slug de la empresa activa según prioridad:
   * 1. Query param (?empresa=xxx o ?tenant=xxx)
   * 2. Subdominio en producción
   * 3. localStorage (entorno local)
   * 4. Fallback por defecto ('admin')
   */
  getActiveTenantSlug() {
    if (typeof window === 'undefined') return 'admin';

    // 1. Query param para pruebas directas en cualquier entorno
    const params = new URLSearchParams(window.location.search);
    const paramSlug = params.get('empresa') || params.get('tenant');
    if (paramSlug) return slugify(paramSlug);

    // 2. Subdominio web
    const sub = this.detectSubdomain();
    if (sub) return sub;

    // 3. Almacenamiento local (desarrollo)
    const stored = localStorage.getItem('glorypos_tenant_slug');
    if (stored) return slugify(stored);

    // 4. Default
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
   * Consulta los datos de la empresa por su slug
   * Busca en Supabase si hay conexión, con fallback a Dexie
   */
  async getTenantBySlug(slug) {
    const cleanSlug = slugify(slug);
    if (!cleanSlug) return null;

    // 1. Intentar consultar en Supabase
    if (isSupabaseConfigured && navigator.onLine && supabase) {
      try {
        const { data, error } = await supabase
          .from('empresas')
          .select('*')
          .eq('slug', cleanSlug)
          .maybeSingle();

        if (data && !error) {
          // Guardar copia local en Dexie para soporte offline
          await db.config_empresa.put({
            ...data,
            id: 'empresa_activa',
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
      if (local && (local.slug === cleanSlug || cleanSlug === 'admin')) {
        return {
          ...local,
          slug: local.slug || cleanSlug,
        };
      }
    } catch (err) {
      console.warn('[tenantService] Error al consultar Dexie:', err);
    }

    // 3. Fallback especial para slug 'admin' (empresa demo predeterminada)
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
      };
    }

    return null;
  },

  /**
   * Carga los usuarios pertenecientes al tenant
   */
  async getTenantUsers(empresaId) {
    if (isSupabaseConfigured && navigator.onLine && supabase && empresaId && empresaId !== 'empresa_activa') {
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

    // Fallback a los usuarios locales en Dexie
    try {
      const localUsers = await db.usuarios.toArray();
      return localUsers.filter(u => u.activo !== false);
    } catch {
      return [];
    }
  },

  /**
   * Registra una nueva empresa en el SaaS
   */
  async registerTenant(empresaData) {
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 1. Guardar en Supabase si está disponible
    if (isSupabaseConfigured && navigator.onLine && supabase) {
      try {
        const { error } = await supabase.from('empresas').insert(newEmpresa);
        if (error) console.warn('[tenantService] Error al guardar en Supabase:', error);
      } catch (err) {
        console.warn('[tenantService] Excepción al guardar en Supabase:', err);
      }
    }

    // 2. Guardar en Dexie como empresa activa
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
  }
};
