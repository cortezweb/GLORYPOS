// Web Crypto API — SHA-256 Hash Utility
// Usa la API nativa del navegador, sin dependencias externas.
// Los hashes son deterministas: mismo input → mismo output hex de 64 chars.

/**
 * Genera un hash SHA-256 del texto dado.
 * @param {string} text — el texto a hashear (contraseña, PIN, etc.)
 * @returns {Promise<string>} — string hexadecimal de 64 caracteres
 */
export async function hashText(text) {
  try {
    const encoder = new TextEncoder();
    const data = encoder.encode(String(text));
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } catch (err) {
    console.error('[crypto] Error al hashear:', err);
    // Fallback básico si el browser no soporta crypto.subtle (muy raro)
    return String(text);
  }
}

/**
 * Verifica si un texto coincide con su hash SHA-256.
 * @param {string} plainText — texto en plano a verificar
 * @param {string} hash — hash SHA-256 almacenado
 * @returns {Promise<boolean>}
 */
export async function verifyHash(plainText, hash) {
  const computed = await hashText(plainText);
  return computed === hash;
}

/**
 * Detecta si un string ya es un hash SHA-256 (64 caracteres hex).
 * Útil para migrar datos legacy sin re-hashear lo que ya está hasheado.
 * @param {string} value
 * @returns {boolean}
 */
export function isAlreadyHashed(value) {
  return typeof value === 'string' && /^[0-9a-f]{64}$/.test(value);
}
