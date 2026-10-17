-- ════════════════════════════════════════════════════════════════════════════
-- LOGO DE LA EMPRESA (se guarda reducido, como texto, en la propia fila de la empresa)
-- Ejecutar una sola vez en el SQL Editor de Supabase (se puede repetir sin problema).
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS logo_url TEXT;
