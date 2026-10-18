// Esquemas Zod de los formularios clave. Se validan antes de guardar en Dexie/Supabase.
import { z } from 'zod';

const texto = (msg) => z.string({ error: msg }).trim().min(1, msg);
// Los inputs numéricos llegan como string: '' cuenta como vacío, no como 0.
const aNumero = v => (v === '' || v === null || v === undefined ? undefined : Number(v));
const numero = (msg, check, checkMsg) =>
  z.preprocess(aNumero, z.number({ error: msg }).finite(msg).refine(check, checkMsg));
const numeroOpcional = (msg, check, checkMsg) =>
  z.preprocess(aNumero, z.number({ error: msg }).finite(msg).refine(check, checkMsg).optional());

export const productoSchema = z.object({
  nombre: texto('Ingresa el nombre del producto.'),
  precio_venta: numero('Ingresa un precio de venta válido.', v => v > 0, 'El precio de venta debe ser mayor a 0.'),
  precio_compra: numeroOpcional('Precio de compra inválido.', v => v >= 0, 'El precio de compra no puede ser negativo.'),
  stock_actual: numeroOpcional('Stock inválido.', v => v >= 0, 'El stock no puede ser negativo.'),
  igv: numeroOpcional('Impuesto inválido.', v => v >= 0 && v <= 100, 'El impuesto debe estar entre 0 y 100.'),
});

export const ventaSchema = z.object({
  items: z.array(z.any()).min(1, 'Agrega al menos un producto a la venta.'),
  metodo_pago: z.enum(['EFECTIVO', 'QR', 'TARJETA', 'TRANSFERENCIA'], { error: 'Selecciona un método de pago.' }),
  total: z.number().finite().min(0, 'El total no puede ser negativo.'),
  monto_recibido: z.number({ error: 'Monto recibido inválido.' }).finite('Monto recibido inválido.'),
}).refine(
  v => v.metodo_pago !== 'EFECTIVO' || v.monto_recibido + 0.001 >= v.total,
  { message: 'El monto recibido es menor al total.', path: ['monto_recibido'] }
);

export const loginSchema = z.object({
  identifier: texto('Ingresa tu usuario o correo.'),
  password: texto('Ingresa tu contraseña.'),
});

export const registroNegocioSchema = z.object({
  nombre: texto('El nombre del negocio es requerido'),
  slug: z.string().trim().min(3, 'El identificador/subdominio debe tener al menos 3 caracteres'),
  rubro: texto('Selecciona el rubro'),
  nit_ci: texto('El NIT/CI es requerido'),
  ciudad: texto('Selecciona la ciudad'),
});

export const registroAdminSchema = z.object({
  nombre: texto('El nombre es requerido'),
  email: z.string().trim().email('Correo electrónico inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  confirmPassword: z.string(),
}).refine(v => v.password === v.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword'],
});

// Devuelve { ok, data, errors: { campo: mensaje }, firstError }.
export function validar(schema, values) {
  const res = schema.safeParse(values);
  if (res.success) return { ok: true, data: res.data, errors: {}, firstError: null };
  const errors = {};
  for (const issue of res.error.issues) {
    const key = issue.path[0] ?? '_';
    if (!errors[key]) errors[key] = issue.message;
  }
  return { ok: false, data: null, errors, firstError: res.error.issues[0]?.message };
}
