import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseUrl &&
  supabaseKey &&
  supabaseUrl !== 'https://tu-proyecto.supabase.co'
);

// Modo demo: sin Supabase (o forzado con VITE_DEMO_MODE=true) la app funciona solo en el
// navegador con usuarios de prueba. Con Supabase, el acceso lo deciden Supabase Auth y RLS.
export const isDemoMode = !isSupabaseConfigured || import.meta.env.VITE_DEMO_MODE === 'true';

// Subdominio activo: viaja en cada petición (cabecera x-tenant-slug) para que la base de
// datos solo devuelva datos de esa empresa cuando el usuario es miembro de ella.
let currentTenantSlug = '';
export function setSupabaseTenantSlug(slug) {
  currentTenantSlug = String(slug || '').toLowerCase();
}

const fetchWithTenant = (input, init = {}) => {
  const headers = new Headers(init.headers || {});
  if (currentTenantSlug) headers.set('x-tenant-slug', currentTenantSlug);
  return fetch(input, { ...init, headers });
};

export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      global: { fetch: fetchWithTenant },
    })
  : null;
