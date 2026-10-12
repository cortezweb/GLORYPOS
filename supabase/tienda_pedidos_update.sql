-- ════════════════════════════════════════════════════════════════════════════
-- TIENDA EN LÍNEA · Pedidos web con datos del cliente, entrega, pago y comprobante
-- Ejecutar en el SQL Editor de Supabase. Se puede correr varias veces sin problema.
-- ════════════════════════════════════════════════════════════════════════════
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS numero_orden TEXT;
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS documento TEXT;          -- CI / NIT del cliente
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS direccion TEXT;
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS entrega JSONB DEFAULT '{}'::jsonb;     -- { tipo: DELIVERY|RECOJO, referencia, costo }
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS pago JSONB DEFAULT '{}'::jsonb;        -- { metodo, cambio_de }
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS comprobante JSONB DEFAULT '{}'::jsonb; -- { tipo, serie, numero, correlativo, estado }
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS notas TEXT;
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS subtotal NUMERIC DEFAULT 0;
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS envio NUMERIC DEFAULT 0;
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS venta_id TEXT;            -- venta emitida al confirmar el cierre
ALTER TABLE public.pedidos_web ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();

CREATE INDEX IF NOT EXISTS idx_pedidos_web_empresa_estado ON public.pedidos_web(empresa_id, estado);
