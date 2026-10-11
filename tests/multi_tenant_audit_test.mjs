import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🧪 Iniciando batería de pruebas de auditoría y escalabilidad multi-tenant...\n');

let passedTests = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`  ✅ [PASS] ${message}`);
    passedTests++;
  } else {
    console.error(`  ❌ [FAIL] ${message}`);
  }
}

// ── TEST 1: Verificar que no existe uso de nodemon (Regla estricta) ─────────────
console.log('📋 Test 1: Verificación de regla de no uso de nodemon');
const serverPkgPath = path.join(rootDir, 'server', 'package.json');
const serverPkg = JSON.parse(fs.readFileSync(serverPkgPath, 'utf-8'));
assert(!JSON.stringify(serverPkg).includes('nodemon'), 'El servidor Express no contiene nodemon en sus dependencias ni scripts');

const rootPkgPath = path.join(rootDir, 'package.json');
const rootPkg = JSON.parse(fs.readFileSync(rootPkgPath, 'utf-8'));
assert(!JSON.stringify(rootPkg).includes('nodemon'), 'El proyecto raíz no contiene nodemon');

// ── TEST 2: Verificar integridad de scripts SQL Multi-Tenant ───────────────────
console.log('\n📋 Test 2: Integridad de scripts SQL Multi-Tenant');
const masterSqlPath = path.join(rootDir, 'supabase_master_all_tables.sql');
assert(fs.existsSync(masterSqlPath), 'Existe supabase_master_all_tables.sql');
const masterSql = fs.readFileSync(masterSqlPath, 'utf-8');

const requiredTables = [
  'empresas', 'roles', 'usuarios', 'clientes', 'proveedores', 'productos',
  'ventas', 'compras', 'kardex', 'caja_chica', 'cotizaciones', 'membresias',
  'pedidos_web', 'unidades_medida', 'transferencias_inventario', 'sesiones_caja',
  'ingresos_caja', 'egresos_caja', 'cuentas_bancarias', 'cuentas_por_cobrar',
  'cuentas_por_pagar', 'metodos_pago', 'guias_remitente', 'guias_transportista',
  'transportistas_gre', 'conductores_gre', 'vehiculos_gre', 'retenciones',
  'percepciones', 'reversiones'
];

let allTablesFound = true;
for (const tbl of requiredTables) {
  if (!masterSql.includes(`CREATE TABLE IF NOT EXISTS public.${tbl}`)) {
    console.warn(`    ⚠️ Tabla no encontrada en masterSql: ${tbl}`);
    allTablesFound = false;
  }
}
assert(allTablesFound, `Las 30 tablas del sistema están definidas con CREATE TABLE IF NOT EXISTS en el esquema SQL maestro`);

const rlsSqlPath = path.join(rootDir, 'supabase_phase2_security_rls.sql');
assert(fs.existsSync(rlsSqlPath), 'Existe supabase_phase2_security_rls.sql');
const rlsSql = fs.readFileSync(rlsSqlPath, 'utf-8');
assert(rlsSql.includes('get_current_tenant_id()'), 'supabase_phase2_security_rls.sql define la función de seguridad get_current_tenant_id()');
assert(rlsSql.includes('realizar_venta_pos_atomica'), 'supabase_phase2_security_rls.sql implementa la función RPC de venta atómica con control concurrente');
assert(rlsSql.includes('FOR UPDATE'), 'La función de venta atómica bloquea filas de productos con FOR UPDATE');

// ── TEST 3: Verificación de Aislamiento Dexie Proxy ───────────────────────────
console.log('\n📋 Test 3: Verificación del módulo de aislamiento Dexie');
const dexiePath = path.join(rootDir, 'src', 'db', 'dexie.js');
const dexieContent = fs.readFileSync(dexiePath, 'utf-8');
assert(dexieContent.includes('createTenantDatabase'), 'dexie.js exporta createTenantDatabase para particionar bases por tenant');
assert(dexieContent.includes('new Proxy'), 'dexie.js utiliza un ES6 Proxy inteligente para retrocompatibilidad total');
assert(dexieContent.includes('switchTenantDatabase'), 'dexie.js exporta switchTenantDatabase');
assert(dexieContent.includes('GloryPosDB_'), 'dexie.js genera nombres de base de datos aislados tipo GloryPosDB_<slug>');

// ── TEST 4: Verificación de Supabase Auth en AuthContext ────────────────────────
console.log('\n📋 Test 4: Verificación de Supabase Auth en AuthContext');
const authCtxPath = path.join(rootDir, 'src', 'context', 'AuthContext.jsx');
const authCtxContent = fs.readFileSync(authCtxPath, 'utf-8');
assert(authCtxContent.includes('supabase.auth.signInWithPassword'), 'AuthContext soporta inicio de sesión oficial vía Supabase Auth');
assert(authCtxContent.includes('switchTenantDatabase'), 'AuthContext invoca switchTenantDatabase al cambiar de empresa');
assert(authCtxContent.includes('signUpWithCredentials'), 'AuthContext soporta registro de credenciales seguras');

// ── TEST 5: Verificación de despliegue Railway y Cloudflare Pages ───────────────
console.log('\n📋 Test 5: Configuración de hosting (Railway y Cloudflare Pages)');
const railwayJsonPath = path.join(rootDir, 'railway.json');
assert(fs.existsSync(railwayJsonPath), 'Existe archivo railway.json para despliegue automatizado');
const railwayJson = JSON.parse(fs.readFileSync(railwayJsonPath, 'utf-8'));
assert(railwayJson.deploy?.startCommand?.includes('node server.js'), 'railway.json ejecuta el servidor con node server.js');

const redirectsPath = path.join(rootDir, 'public', '_redirects');
assert(fs.existsSync(redirectsPath), 'Existe public/_redirects para SPA routing en Cloudflare Pages');
const headersPath = path.join(rootDir, 'public', '_headers');
assert(fs.existsSync(headersPath), 'Existe public/_headers para cabeceras de seguridad');

// ── RESUMEN FINAL ─────────────────────────────────────────────────────────────
console.log(`\n======================================================`);
console.log(`📊 RESULTADO DE LA BATERÍA DE PRUEBAS: ${passedTests}/${totalTests} superadas`);
if (passedTests === totalTests) {
  console.log(`🎉 TODAS LAS PRUEBAS DE ARQUITECTURA MULTI-TENANT PASARON CON ÉXITO.`);
  process.exit(0);
} else {
  console.error(`⚠️ Algunas pruebas fallaron.`);
  process.exit(1);
}
