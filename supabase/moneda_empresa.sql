-- ════════════════════════════════════════════════════════════════════════════
-- MONEDA POR EMPRESA (BOB, PEN, ARS o CLP; por defecto Bolivianos)
-- Ejecutar una sola vez en el SQL Editor de Supabase (se puede repetir sin problema).
-- Si todavía no ejecutaste supabase/saas_seguridad_multitenant.sql, no hace falta este
-- archivo: esa versión ya incluye la moneda.
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.empresas ADD COLUMN IF NOT EXISTS moneda TEXT NOT NULL DEFAULT 'BOB';

CREATE OR REPLACE FUNCTION public.registrar_empresa(p_empresa jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_super boolean := public.is_super_admin();
  v_slug text;
  v_id text;
  v_email text := lower(auth.jwt()->>'email');
  v_modulos jsonb;
  v_plan text;
  v_dias int;
  v_admin_email text := NULLIF(lower(trim(p_empresa->>'admin_email')), '');
  v_moneda text := upper(COALESCE(NULLIF(p_empresa->>'moneda', ''), 'BOB'));
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Sesión requerida';
  END IF;

  IF NOT v_super AND EXISTS (SELECT 1 FROM public.tenant_members WHERE user_id = auth.uid()::text) THEN
    RAISE EXCEPTION 'Tu cuenta ya pertenece a una empresa';
  END IF;

  v_slug := regexp_replace(lower(COALESCE(p_empresa->>'slug', '')), '[^a-z0-9-]', '', 'g');
  v_slug := left(trim(both '-' from v_slug), 30);
  IF length(v_slug) < 3 THEN
    RAISE EXCEPTION 'El identificador debe tener al menos 3 caracteres';
  END IF;
  IF v_slug IN ('admin', 'www', 'app', 'pos', 'api', 'cdn', 'static', 'mail', 'staging', 'dev', 'empresa_activa') THEN
    RAISE EXCEPTION 'Ese identificador está reservado';
  END IF;
  IF EXISTS (SELECT 1 FROM public.empresas WHERE slug = v_slug) THEN
    RAISE EXCEPTION 'El identificador ya está en uso';
  END IF;

  IF v_moneda NOT IN ('BOB', 'PEN', 'ARS', 'CLP') THEN
    RAISE EXCEPTION 'Moneda no válida';
  END IF;

  IF v_super THEN
    v_plan := COALESCE(NULLIF(p_empresa->>'plan_tipo', ''), 'TRIAL');
    v_dias := COALESCE(NULLIF(p_empresa->>'duracion_dias', '')::int, 30);
    v_modulos := CASE WHEN jsonb_typeof(p_empresa->'modulos_activos') = 'array' THEN p_empresa->'modulos_activos' END;
  ELSE
    v_plan := 'TRIAL';
    v_dias := 30;
    v_modulos := NULL; -- usa el valor por defecto de la columna
  END IF;

  v_id := 'emp-' || substr(md5(random()::text || clock_timestamp()::text), 1, 12);

  INSERT INTO public.empresas (
    id, slug, nombre, nit_ci, rubro, ciudad, moneda, direccion, telefono, email, propietario,
    plan_tipo, estado_suscripcion, fecha_inicio, fecha_vencimiento, dias_prueba, created_at, updated_at
  ) VALUES (
    v_id, v_slug,
    COALESCE(NULLIF(trim(p_empresa->>'nombre'), ''), v_slug),
    COALESCE(NULLIF(trim(p_empresa->>'nit_ci'), ''), '0'),
    COALESCE(NULLIF(p_empresa->>'rubro', ''), 'ABARROTES'),
    COALESCE(p_empresa->>'ciudad', ''),
    v_moneda,
    COALESCE(p_empresa->>'direccion', ''),
    COALESCE(p_empresa->>'telefono', ''),
    COALESCE(NULLIF(lower(p_empresa->>'email'), ''), v_admin_email, v_email),
    COALESCE(p_empresa->>'propietario', ''),
    v_plan, 'ACTIVO', now(), now() + make_interval(days => v_dias), v_dias, now(), now()
  );

  IF v_modulos IS NOT NULL THEN
    UPDATE public.empresas SET modulos_activos = v_modulos WHERE id = v_id;
  END IF;

  IF NOT v_super THEN
    INSERT INTO public.tenant_members (empresa_id, user_id, email, rol)
    VALUES (v_id, auth.uid()::text, v_email, 'ADMIN');
  ELSIF v_admin_email IS NOT NULL THEN
    INSERT INTO public.tenant_members (empresa_id, user_id, email, rol)
    VALUES (v_id, NULL, v_admin_email, 'ADMIN');
  END IF;

  RETURN (SELECT to_jsonb(e) FROM public.empresas e WHERE e.id = v_id);
END;
$$;

CREATE OR REPLACE FUNCTION public.empresa_publica(p_slug text)
RETURNS jsonb
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', e.id, 'slug', e.slug, 'nombre', e.nombre, 'rubro', e.rubro,
    'ciudad', e.ciudad, 'moneda', e.moneda, 'direccion', e.direccion, 'telefono', e.telefono,
    'logo_url', to_jsonb(e)->'logo_url',
    'plan_tipo', e.plan_tipo, 'estado_suscripcion', e.estado_suscripcion,
    'fecha_vencimiento', e.fecha_vencimiento, 'modulos_activos', e.modulos_activos
  )
  FROM public.empresas e
  WHERE e.slug = lower(p_slug);
$$;

-- Los permisos de ejecución se mantienen; se repiten por si acaso
REVOKE EXECUTE ON FUNCTION public.registrar_empresa(jsonb) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.registrar_empresa(jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION public.empresa_publica(text) TO anon, authenticated;
