// Moneda de la empresa. Cada empresa elige la suya (Administración > Datos de la empresa);
// por defecto Bolivianos. AuthContext la activa al cargar la empresa y todas las pantallas
// toman el símbolo de aquí en lugar de escribir "Bs." o "S/" a mano.

export const CURRENCIES = [
  { code: 'BOB', label: 'Bolivianos (Bs.)', name: 'Bolivianos', symbol: 'Bs.' },
  { code: 'PEN', label: 'Soles (S/)', name: 'Soles', symbol: 'S/' },
  { code: 'ARS', label: 'Pesos argentinos ($)', name: 'Pesos argentinos', symbol: '$' },
  { code: 'CLP', label: 'Pesos chilenos ($)', name: 'Pesos chilenos', symbol: '$' },
];

export const DEFAULT_CURRENCY = 'BOB';
const STORAGE_KEY = 'glorypos_moneda';

const isValid = (code) => CURRENCIES.some(c => c.code === code);

function readStored() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return isValid(stored) ? stored : DEFAULT_CURRENCY;
  } catch {
    return DEFAULT_CURRENCY;
  }
}

let activeCode = readStored();

// Activa la moneda de la empresa (código ISO). Devuelve true si cambió.
export function setCurrency(code) {
  const next = isValid(code) ? code : DEFAULT_CURRENCY;
  const changed = next !== activeCode;
  activeCode = next;
  try {
    localStorage.setItem(STORAGE_KEY, next);
  } catch { /* sin almacenamiento: se usa solo en memoria */ }
  return changed;
}

export const getCurrencyCode = () => activeCode;
export const getCurrency = (code = activeCode) => CURRENCIES.find(c => c.code === code) || CURRENCIES[0];
export const simbolo = () => getCurrency().symbol;
export const nombreMoneda = () => getCurrency().name;

// "Bs. 1,234.50"
export function money(value, code = activeCode) {
  const n = Number(value) || 0;
  return `${getCurrency(code).symbol} ${n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
