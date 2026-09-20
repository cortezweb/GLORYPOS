import React, { useState, useEffect } from 'react';
import {
  Server, Globe, Building2, Users, ShieldCheck, Activity, Cpu, Database,
  Search, Plus, ChevronRight, ExternalLink, Copy, Check, CheckCircle2,
  AlertCircle, Clock, Sparkles, DollarSign, Lock, Mail, Phone, ArrowUpRight,
  LogOut, RefreshCw, X, FileText, ShoppingCart, Wallet, Send, Terminal,
  Layers, Zap, UserCheck, PhoneCall, CheckSquare, SlidersHorizontal, KeyRound
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { tenantService, slugify } from '../../services/tenantService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { hashText } from '../../utils/crypto';
import { playCashChime } from '../../utils/audio';

const RUBROS = [
  { id: 'ABARROTES', label: 'Minimarket & Abarrotes', icon: '🏪' },
  { id: 'FERRETERIA', label: 'Ferretería & Construcción', icon: '🔧' },
  { id: 'FARMACIA', label: 'Farmacia & Botica', icon: '💊' },
  { id: 'ROPA', label: 'Ropa & Calzado', icon: '👗' },
  { id: 'CARNICERIA', label: 'Carnicería & Frial', icon: '🥩' },
  { id: 'HELADERIA', label: 'Heladería & Cafetería', icon: '🍦' },
];

const CIUDADES = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'Tarija', 'Oruro', 'Potosí', 'Beni', 'Pando'];

export const ALL_CLIENT_MODULES = [
  { id: 'preventa', label: 'Preventa & Cotizaciones', icon: '📝', desc: 'Cotizaciones, proformas y pedidos' },
  { id: 'ventas', label: 'Ventas & Facturación (POS)', icon: '🛒', desc: 'Caja rápida, facturas SIAT / SUNAT y boletas' },
  { id: 'compras', label: 'Compras & Proveedores', icon: '🛍️', desc: 'Facturas de compras y proveedores' },
  { id: 'clientes', label: 'Directorio de Clientes', icon: '👥', desc: 'Directorio, cuentas y crédito' },
  { id: 'productos', label: 'Productos / Servicios', icon: '🏷️', desc: 'Catálogo con variantes, códigos y precios' },
  { id: 'inventario', label: 'Inventario & Kardex', icon: '📦', desc: 'Stock valorizado y ajustes de merma' },
  { id: 'finanzas', label: 'Finanzas & Caja Chica', icon: '💵', desc: 'Arqueos, movimientos de turno e ingresos/egresos' },
  { id: 'guias_remision', label: 'Guías de Remisión', icon: '🚚', desc: 'Guías de despacho electrónicas' },
  { id: 'comprobantes_pendientes', label: 'Comprobantes Pendientes', icon: '⏳', desc: 'Cola offline y contingencia' },
  { id: 'documentos_avanzados', label: 'Comprobantes Avanzados', icon: '📄', desc: 'Retenciones, percepciones y especiales' },
  { id: 'contabilidad', label: 'Contabilidad & Libros', icon: '🧮', desc: 'Exportación PLE, SIAT y resúmenes' },
  { id: 'reportes', label: 'Reportes & Analíticas', icon: '📊', desc: 'Métricas de ventas, utilidades y Excel' },
  { id: 'tienda_virtual', label: 'Tienda Virtual', icon: '🌐', desc: 'Catálogo online y pedidos WhatsApp' },
  { id: 'restaurante', label: 'Restaurante / Mesas', icon: '🍽️', desc: 'Comandas, salones y cocina' },
  { id: 'farmacia', label: 'Farmacia & Botica', icon: '💊', desc: 'Lotes, vencimientos y boticas' },
  { id: 'hoteles', label: 'Hoteles & Hospedajes', icon: '🏨', desc: 'Recepción y habitaciones' },
];

export const MODULE_PRESETS = {
  FULL: {
    name: 'Full Suite (16)',
    ids: ALL_CLIENT_MODULES.map(m => m.id)
  },
  RETAIL: {
    name: 'Comercio / Retail',
    ids: ['preventa', 'ventas', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'reportes', 'tienda_virtual']
  },
  GASTRONOMIA: {
    name: 'Restaurante',
    ids: ['ventas', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'restaurante', 'reportes']
  },
  FARMACIA: {
    name: 'Farmacia',
    ids: ['ventas', 'compras', 'clientes', 'productos', 'inventario', 'finanzas', 'farmacia', 'guias_remision', 'reportes']
  },
  HOTEL: {
    name: 'Hoteles',
    ids: ['ventas', 'clientes', 'productos', 'finanzas', 'hoteles', 'reportes']
  },
  FACTURACION: {
    name: 'Facturación Básica',
    ids: ['preventa', 'ventas', 'clientes', 'productos', 'reportes']
  }
};

export default function SuperAdminView({
  onSelectView,
  onOpenCloseCash,
  onOpenRubroModal,
  currentRubro
}) {
  const { 
    empresa, 
    currentUser, 
    logout, 
    diasRestantes, 
    isExpired, 
    switchTenant,
    tenantSlug,
    updateEmpresa
  } = useAuth();

  // Pestañas de la consola: 'tenants' (directorio) | 'usuarios' | 'metricas' | 'operativo'
  const [activeTab, setActiveTab] = useState('tenants');

  // Estado del listado de empresas / tenants
  const [clientCompanies, setClientCompanies] = useState([
    {
      id: 'empresa_activa',
      slug: 'admin',
      nombre: empresa?.nombre || 'GLORYPOS BOLIVIA S.R.L.',
      nit_ci: empresa?.nit_ci || '8472910014',
      rubro: empresa?.rubro || 'ABARROTES',
      propietario: empresa?.propietario || 'Carlos Gutiérrez',
      ciudad: empresa?.ciudad || 'Santa Cruz',
      telefono: empresa?.telefono || '77012345',
      email: 'admin@glorypos.bo',
      plan_tipo: empresa?.plan_tipo || 'PRO',
      estado_suscripcion: empresa?.estado_suscripcion || 'ACTIVO',
      fecha_vencimiento: empresa?.fecha_vencimiento || new Date(Date.now() + 30 * 86400000).toISOString(),
      cajas_activas: 2,
      modulos_activos: ['POS', 'SIAT', 'INVENTARIO', 'KARDEX', 'REPORTES'],
      monto_mensual: 350
    },
    {
      id: 'emp-prado',
      slug: 'prado',
      nombre: 'Minimarket & Abarrotes El Prado',
      nit_ci: '8472910014',
      rubro: 'ABARROTES',
      propietario: 'Carlos Gutiérrez',
      ciudad: 'Santa Cruz',
      telefono: '77012345',
      email: 'contacto@elprado.bo',
      plan_tipo: 'TRIAL',
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: new Date(Date.now() + 25 * 86400000).toISOString(),
      cajas_activas: 2,
      modulos_activos: ['POS', 'INVENTARIO', 'KARDEX'],
      monto_mensual: 150
    },
    {
      id: 'emp-002',
      slug: 'tornillo-fuerte',
      nombre: 'Ferretería El Tornillo Fuerte S.R.L.',
      nit_ci: '1029384756',
      rubro: 'FERRETERIA',
      propietario: 'Roberto Méndez',
      ciudad: 'Cochabamba',
      telefono: '76543210',
      email: 'ventas@tornillofuerte.bo',
      plan_tipo: 'PROFESIONAL',
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: new Date(Date.now() + 18 * 86400000).toISOString(),
      cajas_activas: 3,
      modulos_activos: ['POS', 'COTIZACIONES', 'KARDEX', 'BALANZA'],
      monto_mensual: 350
    },
    {
      id: 'emp-003',
      slug: 'farmacia-san-pedro',
      nombre: 'Farmacia & Botica San Pedro',
      nit_ci: '4920192011',
      rubro: 'FARMACIA',
      propietario: 'Dra. Elena Vargas',
      ciudad: 'La Paz',
      telefono: '71239845',
      email: 'botica@sanpedro.bo',
      plan_tipo: 'BASICO',
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: new Date(Date.now() + 6 * 86400000).toISOString(),
      cajas_activas: 1,
      modulos_activos: ['POS', 'LOTES_VENCIMIENTOS', 'SIAT'],
      monto_mensual: 150
    },
    {
      id: 'emp-004',
      slug: 'boutique-dluxe',
      nombre: 'Boutique D’Luxe Ropa y Calzado',
      nit_ci: '7482910023',
      rubro: 'ROPA',
      propietario: 'Mariana Suarez',
      ciudad: 'Santa Cruz',
      telefono: '78901234',
      email: 'mariana@dluxeboutique.bo',
      plan_tipo: 'TRIAL',
      estado_suscripcion: 'VENCIDO',
      fecha_vencimiento: new Date(Date.now() - 2 * 86400000).toISOString(),
      cajas_activas: 1,
      modulos_activos: ['POS', 'TALLAS_COLORES'],
      monto_mensual: 150
    },
    {
      id: 'emp-005',
      slug: 'carniceria-don-choco',
      nombre: 'Frial & Carnicería Don Choco',
      nit_ci: '6192834018',
      rubro: 'CARNICERIA',
      propietario: 'Joaquín Castro',
      ciudad: 'Tarija',
      telefono: '75432190',
      email: 'choco@frialdonchoco.bo',
      plan_tipo: 'EMPRESARIAL',
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: new Date(Date.now() + 45 * 86400000).toISOString(),
      cajas_activas: 5,
      modulos_activos: ['POS', 'BALANZA_PESO', 'KARDEX', 'TIENDA_VIRTUAL', 'SIAT'],
      monto_mensual: 700
    }
  ]);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Drawer lateral de provisionamiento (Slide-over)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isDeploying, setIsDeploying] = useState(false);
  const [isManualSlug, setIsManualSlug] = useState(false);

  // Formulario del nuevo tenant
  const [drawerData, setDrawerData] = useState({
    nombre: '',
    slug: '',
    nit_ci: '',
    rubro: 'ABARROTES',
    ciudad: 'Santa Cruz',
    telefono: '',
    adminNombre: '',
    email: '',
    password: '',
    pin: '1234',
    plan_tipo: 'PROFESIONAL',
    duracion_dias: 30,
    modulos_activos: MODULE_PRESETS.FULL.ids
  });

  // Modal para editar módulos de un cliente ya existente
  const [editingModulesClient, setEditingModulesClient] = useState(null);
  const [editingModulesList, setEditingModulesList] = useState([]);
  const [isSavingModules, setIsSavingModules] = useState(false);

  // Modal de credenciales generadas
  const [credentialsModalClient, setCredentialsModalClient] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  // Cargar empresas de Supabase si está disponible
  useEffect(() => {
    async function loadCloudTenants() {
      if (isSupabaseConfigured && navigator.onLine && supabase) {
        try {
          const { data, error } = await supabase.from('empresas').select('*');
          if (data && !error && data.length > 0) {
            setClientCompanies(prev => {
              // Combinar asegurando slugs únicos
              const existingSlugs = new Set(data.map(d => d.slug));
              const localExtras = prev.filter(p => !existingSlugs.has(p.slug));
              return [...data, ...localExtras];
            });
          }
        } catch (err) {
          console.warn('[SuperAdminView] No se pudo cargar de Supabase:', err);
        }
      }
    }
    loadCloudTenants();
  }, []);

  const showToast = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  // ── Handlers del Drawer de Alta ──────────────────────────────────────────
  const handleOpenDrawer = () => {
    setDrawerData({
      nombre: '',
      slug: '',
      nit_ci: '',
      rubro: 'ABARROTES',
      ciudad: 'Santa Cruz',
      telefono: '',
      adminNombre: '',
      email: '',
      password: 'admin' + Math.floor(100 + Math.random() * 900),
      pin: '1234',
      plan_tipo: 'PROFESIONAL',
      duracion_dias: 30,
      modulos_activos: MODULE_PRESETS.FULL.ids
    });
    setIsManualSlug(false);
    setIsDrawerOpen(true);
  };

  const toggleDrawerModule = (moduleId) => {
    setDrawerData(prev => {
      const exists = prev.modulos_activos.includes(moduleId);
      const updated = exists 
        ? prev.modulos_activos.filter(m => m !== moduleId)
        : [...prev.modulos_activos, moduleId];
      return { ...prev, modulos_activos: updated };
    });
  };

  const applyDrawerPreset = (presetKey) => {
    if (MODULE_PRESETS[presetKey]) {
      setDrawerData(prev => ({
        ...prev,
        modulos_activos: [...MODULE_PRESETS[presetKey].ids]
      }));
    }
  };

  // ── Handlers de Edición de Módulos de Cliente Existente ─────────────────
  const handleOpenEditModules = (client) => {
    setEditingModulesClient(client);
    setEditingModulesList(client.modulos_activos || MODULE_PRESETS.FULL.ids);
  };

  const toggleEditingModule = (moduleId) => {
    setEditingModulesList(prev => {
      const exists = prev.includes(moduleId);
      return exists ? prev.filter(m => m !== moduleId) : [...prev, moduleId];
    });
  };

  const applyEditingPreset = (presetKey) => {
    if (MODULE_PRESETS[presetKey]) {
      setEditingModulesList([...MODULE_PRESETS[presetKey].ids]);
    }
  };

  const handleSaveClientModules = async () => {
    if (!editingModulesClient) return;
    setIsSavingModules(true);
    try {
      const res = await tenantService.updateTenantModules(editingModulesClient.slug, editingModulesList);
      if (res.success) {
        setClientCompanies(prev => prev.map(c => 
          c.id === editingModulesClient.id ? { ...c, modulos_activos: editingModulesList } : c
        ));
        showToast(`Módulos de "${editingModulesClient.nombre}" actualizados correctamente`);
        setEditingModulesClient(null);
      } else {
        alert('Error al actualizar módulos: ' + res.error);
      }
    } catch (err) {
      alert('Error: ' + err.message);
    } finally {
      setIsSavingModules(false);
    }
  };

  const handleNombreChange = (val) => {
    setDrawerData(prev => ({
      ...prev,
      nombre: val,
      slug: isManualSlug ? prev.slug : slugify(val),
      email: isManualSlug ? prev.email : (slugify(val) ? `admin@${slugify(val)}.bo` : '')
    }));
  };

  const handleDeployTenant = async (e) => {
    e.preventDefault();
    if (!drawerData.nombre.trim() || !drawerData.slug.trim()) {
      alert('Por favor ingresa el nombre del negocio y su subdominio.');
      return;
    }

    if (!drawerData.modulos_activos || drawerData.modulos_activos.length === 0) {
      alert('Por favor selecciona al menos un módulo para este cliente.');
      return;
    }

    setIsDeploying(true);

    try {
      const montos = { BASICO: 150, PROFESIONAL: 350, EMPRESARIAL: 700, TRIAL: 0 };
      const duracion = Number(drawerData.duracion_dias) || 30;
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + duracion);

      // 1. Registrar empresa vía tenantService con los módulos decididos por el SuperAdmin
      const newEmpresa = await tenantService.registerTenant({
        nombre: drawerData.nombre.trim(),
        slug: drawerData.slug.trim().toLowerCase(),
        nit_ci: drawerData.nit_ci.trim() || '0',
        rubro: drawerData.rubro,
        ciudad: drawerData.ciudad,
        telefono: drawerData.telefono.trim(),
        email: drawerData.email.trim().toLowerCase(),
        adminNombre: drawerData.adminNombre.trim() || 'Administrador',
        plan_tipo: drawerData.plan_tipo,
        modulos_activos: drawerData.modulos_activos
      });

      // 2. Registrar usuario administrador
      const adminId = `usr-${Date.now()}`;
      const [hashedPwd, hashedPin] = await Promise.all([
        hashText(drawerData.password || 'admin'),
        hashText(drawerData.pin || '1234'),
      ]);

      const adminUser = {
        id: adminId,
        empresa_id: newEmpresa.id,
        nombre: drawerData.adminNombre.trim() || 'Administrador',
        email: drawerData.email.trim().toLowerCase() || `admin@${drawerData.slug}.bo`,
        password: hashedPwd,
        password_hash: hashedPwd,
        pin: hashedPin,
        pin_hash: hashedPin,
        rol: 'ADMIN',
        color: 'from-emerald-600 to-teal-600',
        activo: true,
        created_at: new Date().toISOString()
      };

      if (isSupabaseConfigured && navigator.onLine && supabase) {
        try {
          await supabase.from('usuarios').insert(adminUser);
        } catch (err) {
          console.warn('[SuperAdmin] Error al guardar admin en Supabase:', err);
        }
      }

      await db.usuarios.put(adminUser);

      // Agregar al estado local
      const fullCreated = {
        ...newEmpresa,
        propietario: drawerData.adminNombre.trim() || 'Administrador',
        fecha_vencimiento: expiry.toISOString(),
        estado_suscripcion: 'ACTIVO',
        cajas_activas: 2,
        monto_mensual: montos[drawerData.plan_tipo] || 150,
        rawPassword: drawerData.password,
        rawPin: drawerData.pin
      };

      setClientCompanies(prev => [fullCreated, ...prev]);
      setIsDrawerOpen(false);
      setCredentialsModalClient(fullCreated);
      playCashChime();
      showToast(`¡Tenant "${fullCreated.nombre}" desplegado con éxito!`);
    } catch (err) {
      console.error('[SuperAdmin] Error en deploy:', err);
      alert('Ocurrió un error al desplegar el tenant: ' + err.message);
    } finally {
      setIsDeploying(false);
    }
  };

  // ── Impersonate: Entrar al POS de la empresa seleccionada ────────────────
  const handleImpersonate = async (targetSlug) => {
    if (!targetSlug) return;
    const res = await switchTenant(targetSlug);
    if (res.success) {
      showToast(`Conectado al espacio de "${res.empresa.nombre}"`);
      if (onSelectView) onSelectView('pos');
    } else {
      alert(res.error || 'No se pudo conectar a la empresa');
    }
  };

  // Métricas calculadas
  const totalClientes = clientCompanies.length;
  const clientesActivos = clientCompanies.filter(c => c.estado_suscripcion === 'ACTIVO').length;
  const clientesVencidos = clientCompanies.filter(c => c.estado_suscripcion === 'VENCIDO').length;
  const clientesTrial = clientCompanies.filter(c => c.plan_tipo === 'TRIAL').length;
  const mrrTotal = clientCompanies
    .filter(c => c.estado_suscripcion === 'ACTIVO')
    .reduce((acc, c) => acc + (Number(c.monto_mensual) || 0), 0);
  const totalCajas = clientCompanies.reduce((acc, c) => acc + (Number(c.cajas_activas) || 1), 0);

  // Filtrado reactivo
  const filteredClients = clientCompanies.filter(client => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      client.nombre?.toLowerCase().includes(term) ||
      client.slug?.toLowerCase().includes(term) ||
      client.nit_ci?.includes(term) ||
      client.ciudad?.toLowerCase().includes(term);

    if (!matchesSearch) return false;
    if (filterStatus === 'ACTIVO') return client.estado_suscripcion === 'ACTIVO';
    if (filterStatus === 'VENCIDO') return client.estado_suscripcion === 'VENCIDO';
    if (filterStatus === 'TRIAL') return client.plan_tipo === 'TRIAL';
    return true;
  });

  const getWhatsAppMessage = (c) => {
    const rawPwd = c.rawPassword || 'admin';
    const rawPin = c.rawPin || '1234';
    return encodeURIComponent(
      `¡Hola ${c.propietario || c.nombre}! 👋\n\n` +
      `Tu espacio en *GLORYPOS SaaS* ha sido activado con éxito.\n\n` +
      `🌐 *Subdominio Web:* https://${c.slug}.glorypos.bo\n` +
      `🏢 *Identificador Local:* ${c.slug}\n` +
      `👤 *Usuario:* ${c.email}\n` +
      `🔑 *Contraseña:* ${rawPwd}\n` +
      `🔢 *PIN de Caja POS:* ${rawPin}\n\n` +
      `📦 *Plan:* ${c.plan_tipo}\n` +
      `📅 *Válido hasta:* ${new Date(c.fecha_vencimiento).toLocaleDateString('es-BO')}\n\n` +
      `Soporte oficial: +591 77012345`
    );
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 sm:p-6 space-y-6 font-sans antialiased select-none pb-20">
      
      {/* ── 1. CONSOLE SYSTEM HEADER (HIGH-TECH VERCEL STYLE) ── */}
      <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-4 sm:p-5 shadow-2xl backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Branding & Node Info */}
        <div className="flex items-center gap-3.5">
          <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-600 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-emerald-500/20">
            <Server className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2 font-mono">
                GLORYPOS // CONTROL PLANE
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                bolivia-central-1 (ONLINE)
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Cluster Multi-Tenant • Supabase Postgres • Dexie v7 Sync
            </p>
          </div>
        </div>

        {/* Right: Quick Operational Buttons & Provision CTA */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800">
            <button
              type="button"
              onClick={() => onSelectView && onSelectView('pos')}
              title="Abrir Punto de Venta"
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-800 transition flex items-center gap-1.5"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-emerald-400" />
              <span>POS</span>
            </button>
            <button
              type="button"
              onClick={onOpenCloseCash}
              title="Cierre de Caja"
              className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-lg text-xs font-bold border border-slate-800 transition flex items-center gap-1.5"
            >
              <Wallet className="w-3.5 h-3.5 text-sky-400" />
              <span>Caja</span>
            </button>
          </div>

          {/* BOTÓN PRINCIPAL: PROVISIONAR TENANT */}
          <button
            type="button"
            onClick={handleOpenDrawer}
            className="px-4 py-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 active:scale-98 text-white text-xs font-black rounded-xl shadow-lg shadow-emerald-500/20 transition flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Provisionar Nuevo Tenant</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRICS ROW (KPIs CLOUD CONSOLE) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Tenants Totales</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-white font-mono">{totalClientes}</span>
            <span className="text-[11px] text-emerald-400 font-semibold">{clientesActivos} activos</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            {clientesTrial} en trial • {clientesVencidos} vencidos
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">MRR Recurrente</span>
            <DollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-indigo-300 font-mono">Bs. {mrrTotal.toLocaleString()}</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            Facturación mensual estimada
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-sky-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Cajas POS Desplegadas</span>
            <Cpu className="w-4 h-4 text-sky-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-sky-300 font-mono">{totalCajas}</span>
            <span className="text-[11px] text-sky-400 font-semibold">Terminales</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            Soporte Touch & Código de Barras
          </div>
        </div>

        <div className="bg-slate-900/80 border border-slate-800/80 p-4 rounded-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none"></div>
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-400">Estado de Red</span>
            <Activity className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-emerald-400 font-mono">99.98%</span>
            <span className="text-[11px] text-emerald-300">Healthy</span>
          </div>
          <div className="mt-1 text-[10px] text-slate-500 font-mono">
            Cloudflare CDN + Supabase Sync
          </div>
        </div>
      </div>

      {/* ── 3. TABS DE NAVEGACIÓN TÉCNICA ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-800 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('tenants')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'tenants'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-400" />
          <span>Tenants & Empresas ({clientCompanies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('usuarios')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'usuarios'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <Users className="w-4 h-4 text-indigo-400" />
          <span>Usuarios Globales</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operativo')}
          className={`px-3.5 py-2 rounded-xl text-xs font-mono font-bold transition flex items-center gap-2 ${
            activeTab === 'operativo'
              ? 'bg-slate-800 text-white border border-slate-700'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4 text-sky-400" />
          <span>Configuración de Rubro & Terminal</span>
        </button>
      </div>

      {/* Notificación Toast */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-emerald-500 text-slate-950 font-black text-xs rounded-2xl shadow-2xl flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-slate-950" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ── 4. PESTAÑA: TENANTS & EMPRESAS (TABLA DE ALTA DENSIDAD) ── */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros & Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/60 p-3 rounded-2xl border border-slate-800/80">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por slug, negocio o NIT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs font-mono rounded-xl bg-slate-950 border border-slate-800 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {['TODOS', 'ACTIVO', 'TRIAL', 'VENCIDO'].map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition ${
                    filterStatus === st
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {st}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Tenants */}
          <div className="bg-slate-900/80 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950/80 text-slate-400 uppercase text-[10px] tracking-wider border-b border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Tenant / Subdominio</th>
                    <th className="px-4 py-3">NIT & Contacto</th>
                    <th className="px-4 py-3">Plan / Estado</th>
                    <th className="px-4 py-3">Vigencia</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {filteredClients.map((client) => {
                    const isClientExpired = client.estado_suscripcion === 'VENCIDO';
                    const isCurrentActive = client.slug === tenantSlug;

                    return (
                      <tr key={client.id} className="hover:bg-slate-800/40 transition">
                        
                        {/* Tenant / Subdominio */}
                        <td className="px-4 py-3.5">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-sm font-bold shrink-0">
                              {RUBROS.find(r => r.id === client.rubro)?.icon || '🏪'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-100">{client.nombre}</span>
                                {isCurrentActive && (
                                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                    ESPACIO ACTIVO
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-emerald-400 text-[11px]">
                                <Globe className="w-3 h-3 shrink-0" />
                                <span>{client.slug || 'admin'}.glorypos.bo</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* NIT & Dueño */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-0.5">
                            <span className="text-slate-200 block">NIT: {client.nit_ci}</span>
                            <span className="text-slate-400 text-[11px]">
                              {client.propietario} • {client.ciudad}
                            </span>
                          </div>
                        </td>

                        {/* Plan & Estado */}
                        <td className="px-4 py-3.5">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-800 border border-slate-700">
                              <span className={`w-1.5 h-1.5 rounded-full ${isClientExpired ? 'bg-rose-500' : 'bg-emerald-400 animate-pulse'}`}></span>
                              {client.plan_tipo}
                            </span>
                            <span className="text-[10px] text-slate-500 block">
                              Bs. {client.monto_mensual}/mes • {client.cajas_activas} cajas
                            </span>
                          </div>
                        </td>

                        {/* Vigencia */}
                        <td className="px-4 py-3.5">
                          <span className={`text-[11px] block font-semibold ${isClientExpired ? 'text-rose-400' : 'text-slate-300'}`}>
                            {new Date(client.fecha_vencimiento).toLocaleDateString('es-BO')}
                          </span>
                          <span className="text-[10px] text-slate-500">
                            {isClientExpired ? 'Vencido' : 'Activo'}
                          </span>
                        </td>

                        {/* Acciones */}
                        <td className="px-4 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Botón IMPERSONATE (Entrar como Tenant) */}
                            <button
                              type="button"
                              onClick={() => handleImpersonate(client.slug)}
                              title="Acceder al POS de este tenant"
                              className="px-2.5 py-1.5 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Terminal className="w-3 h-3" />
                              <span>Acceder</span>
                            </button>

                            {/* Botón Gestionar Módulos Decididos por el SuperAdmin */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModules(client)}
                              title="Configurar módulos asignados a este cliente"
                              className="px-2.5 py-1.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 border border-blue-500/30 rounded-lg text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Layers className="w-3 h-3" />
                              <span>Módulos</span>
                            </button>

                            {/* Botón Credenciales */}
                            <button
                              type="button"
                              onClick={() => setCredentialsModalClient(client)}
                              title="Ver credenciales y WhatsApp"
                              className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg border border-slate-700 transition"
                            >
                              <KeyRound className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── 5. PESTAÑA: USUARIOS GLOBALES ── */}
      {activeTab === 'usuarios' && (
        <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-black text-white font-mono">Directorio de Usuarios de Tenants</h3>
              <p className="text-xs text-slate-400">Usuarios con permisos de Administrador y Cajeros por empresa</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {clientCompanies.map(c => (
              <div key={c.id} className="p-3.5 bg-slate-950 border border-slate-800 rounded-xl space-y-2 font-mono text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white truncate max-w-[180px]">{c.nombre}</span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-emerald-400">
                    {c.slug}
                  </span>
                </div>
                <div className="text-slate-400 text-[11px] space-y-1 pt-1 border-t border-slate-800/80">
                  <p>👤 Admin: {c.propietario}</p>
                  <p>✉️ Correo: {c.email}</p>
                  <p>🔑 PIN Inicial: 1234</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. PESTAÑA: CONFIGURACIÓN OPERATIVA ── */}
      {activeTab === 'operativo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-black text-white font-mono flex items-center gap-2">
              <SlidersHorizontal className="w-4 h-4 text-emerald-400" />
              Rubro Comercial Activo
            </h3>
            <p className="text-xs text-slate-400">
              Configura el rubro activo del terminal para adaptar el catálogo a farmacia, abarrotes, ferretería, etc.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-mono block">Rubro Actual</span>
                <span className="text-sm font-black text-emerald-400 font-mono">{currentRubro}</span>
              </div>
              <button
                type="button"
                onClick={onOpenRubroModal}
                className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-black text-xs rounded-xl transition"
              >
                Cambiar Rubro
              </button>
            </div>
          </div>

          <div className="bg-slate-900/80 border border-slate-800/80 p-5 rounded-2xl space-y-3">
            <h3 className="text-sm font-black text-white font-mono flex items-center gap-2">
              <Wallet className="w-4 h-4 text-sky-400" />
              Arqueo y Cierre de Caja
            </h3>
            <p className="text-xs text-slate-400">
              Apertura de turno, control de ingresos/egresos y balance de efectivo en gaveta.
            </p>
            <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-[11px] text-slate-500 font-mono block">Módulo</span>
                <span className="text-sm font-black text-sky-300 font-mono">Caja Chica POS</span>
              </div>
              <button
                type="button"
                onClick={onOpenCloseCash}
                className="px-3 py-1.5 bg-sky-500 hover:bg-sky-600 text-slate-950 font-black text-xs rounded-xl transition"
              >
                Abrir Arqueo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. SLIDE-OVER DRAWER: PROVISIONAR TENANT (ALTA EN 3 PASOS) ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-lg bg-slate-900 border-l border-slate-800 h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl text-slate-100">
            
            {/* Header del Drawer */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-white font-mono">Provisionar Tenant</h3>
                    <p className="text-xs text-slate-400">Despliegue de nuevo negocio en GLORYPOS Cloud</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form id="drawerForm" onSubmit={handleDeployTenant} className="space-y-4 pt-4 text-xs font-mono">
                
                {/* 1. Nombre del Negocio */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Farmacia Santa María"
                    value={drawerData.nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                {/* 2. Subdominio / Slug */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">
                    Subdominio Único (Tenant Slug) *
                  </label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-emerald-500/30">
                    <span className="pl-3 text-slate-500 select-none">https://</span>
                    <input
                      type="text"
                      required
                      placeholder="farmacia-santa-maria"
                      value={drawerData.slug}
                      onChange={e => {
                        setIsManualSlug(true);
                        setDrawerData(prev => ({ ...prev, slug: slugify(e.target.value) }));
                      }}
                      className="w-full p-2.5 bg-transparent text-emerald-400 font-bold focus:outline-none"
                    />
                    <span className="pr-3 text-slate-500 select-none">.glorypos.bo</span>
                  </div>
                  <span className="text-[10px] text-emerald-400/80 mt-1 block">
                    ✓ Subdominio web para producción e identificador local.
                  </span>
                </div>

                {/* 3. NIT / CI y Ciudad */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">NIT / CI *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1029384012"
                      value={drawerData.nit_ci}
                      onChange={e => setDrawerData(prev => ({ ...prev, nit_ci: e.target.value }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    />
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Ciudad (Bolivia)</label>
                    <select
                      value={drawerData.ciudad}
                      onChange={e => setDrawerData(prev => ({ ...prev, ciudad: e.target.value }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                    >
                      {CIUDADES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Rubro Comercial */}
                <div>
                  <label className="text-slate-300 font-bold block mb-1">Rubro Comercial</label>
                  <select
                    value={drawerData.rubro}
                    onChange={e => setDrawerData(prev => ({ ...prev, rubro: e.target.value }))}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  >
                    {RUBROS.map(r => (
                      <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Contacto & Usuario Admin */}
                <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-400 block border-b border-slate-800 pb-1">
                    Cuenta del Administrador
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Nombre Dueño</label>
                      <input
                        type="text"
                        placeholder="Carlos"
                        value={drawerData.adminNombre}
                        onChange={e => setDrawerData(prev => ({ ...prev, adminNombre: e.target.value }))}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">WhatsApp (+591)</label>
                      <input
                        type="tel"
                        placeholder="77012345"
                        value={drawerData.telefono}
                        onChange={e => setDrawerData(prev => ({ ...prev, telefono: e.target.value }))}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-400 block mb-0.5">Correo Login</label>
                      <input
                        type="email"
                        placeholder="admin@empresa.bo"
                        value={drawerData.email}
                        onChange={e => setDrawerData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100"
                      />
                    </div>
                    <div>
                      <label className="text-slate-400 block mb-0.5">PIN Caja (4 dígitos)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={drawerData.pin}
                        onChange={e => setDrawerData(prev => ({ ...prev, pin: e.target.value }))}
                        className="w-full p-2 bg-slate-900 border border-slate-800 rounded-lg text-slate-100 text-center font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Plan Asignado */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Plan</label>
                    <select
                      value={drawerData.plan_tipo}
                      onChange={e => setDrawerData(prev => ({ ...prev, plan_tipo: e.target.value }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-emerald-400 font-bold"
                    >
                      <option value="TRIAL">Prueba (30 días)</option>
                      <option value="BASICO">Básico (Bs. 150/mes)</option>
                      <option value="PROFESIONAL">Profesional (Bs. 350/mes)</option>
                      <option value="EMPRESARIAL">Empresarial (Bs. 700/mes)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-300 font-bold block mb-1">Duración</label>
                    <select
                      value={drawerData.duracion_dias}
                      onChange={e => setDrawerData(prev => ({ ...prev, duracion_dias: Number(e.target.value) }))}
                      className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100"
                    >
                      <option value={30}>30 Días (1 Mes)</option>
                      <option value={90}>90 Días (Trimestre)</option>
                      <option value={180}>180 Días (Semestre)</option>
                      <option value={365}>365 Días (1 Año)</option>
                    </select>
                  </div>
                </div>

                {/* 7. Módulos Asignados (El SuperAdmin decide qué tendrá el cliente) */}
                <div className="p-3.5 bg-slate-950/90 border border-slate-800 rounded-xl space-y-3">
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                    <div>
                      <span className="text-xs font-black text-emerald-400 font-mono block">
                        ⚙️ Módulos Autorizados ({drawerData.modulos_activos?.length || 0}/16)
                      </span>
                      <span className="text-[10px] text-slate-400">
                        El SuperAdmin define qué módulos verá este cliente en su menú lateral
                      </span>
                    </div>
                  </div>

                  {/* Presets de selección rápida */}
                  <div className="space-y-1">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Plantillas Rápidas (Presets):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {Object.keys(MODULE_PRESETS).map(key => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => applyDrawerPreset(key)}
                          className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 hover:border-emerald-500/50 transition"
                        >
                          {MODULE_PRESETS[key].name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Lista de Checkboxes de los 16 módulos */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-52 overflow-y-auto pr-1">
                    {ALL_CLIENT_MODULES.map(mod => {
                      const isChecked = drawerData.modulos_activos?.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          onClick={() => toggleDrawerModule(mod.id)}
                          className={`flex items-center gap-2 p-2 rounded-lg border text-xs cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-emerald-950/40 border-emerald-500/50 text-emerald-300 font-bold'
                              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}} // Manejado por onClick del label
                            className="rounded border-slate-700 text-emerald-500 focus:ring-0 focus:ring-offset-0 bg-slate-800"
                          />
                          <span className="text-sm">{mod.icon}</span>
                          <div className="min-w-0 flex-1">
                            <p className="text-[11px] truncate leading-tight">{mod.label}</p>
                          </div>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer del Drawer */}
            <div className="pt-4 border-t border-slate-800 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2.5 text-slate-400 hover:text-white font-mono text-xs rounded-xl hover:bg-slate-800 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="drawerForm"
                disabled={isDeploying}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-mono font-black text-xs rounded-xl shadow-lg transition flex items-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {isDeploying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Desplegando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4" />
                    <span>Desplegar Tenant</span>
                  </>
                )}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── 8. MODAL DE CREDENCIALES & WHATSAPP ── */}
      {credentialsModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-md w-full p-6 text-slate-100 space-y-4 shadow-2xl relative border border-slate-800">
            <button
              onClick={() => setCredentialsModalClient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-500/30">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-white font-mono">Tenant Desplegado</h3>
              <p className="text-xs text-slate-400">
                Credenciales listas para entregar a <strong className="text-emerald-400">{credentialsModalClient.nombre}</strong>
              </p>
            </div>

            {/* Tarjeta con los datos de acceso */}
            <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl space-y-2 text-xs font-mono">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Subdominio Web:</span>
                <span className="text-emerald-400 font-bold">https://{credentialsModalClient.slug}.glorypos.bo</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Identificador Local:</span>
                <span className="text-white font-bold">{credentialsModalClient.slug}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Usuario / Correo:</span>
                <span className="text-white">{credentialsModalClient.email}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-800">
                <span className="text-slate-400">Contraseña Temporal:</span>
                <span className="text-white font-black bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {credentialsModalClient.rawPassword || 'admin'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-400">PIN Caja POS:</span>
                <span className="text-white font-black bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {credentialsModalClient.rawPin || '1234'}
                </span>
              </div>
            </div>

            {/* Botones de Entrega */}
            <div className="space-y-2 pt-1">
              <a
                href={`https://wa.me/591${credentialsModalClient.telefono}?text=${getWhatsAppMessage(credentialsModalClient)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer font-mono"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Enviar Credenciales por WhatsApp (+591 {credentialsModalClient.telefono})</span>
              </a>

              <button
                type="button"
                onClick={() => {
                  const text = decodeURIComponent(getWhatsAppMessage(credentialsModalClient));
                  navigator.clipboard.writeText(text);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 2500);
                }}
                className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs rounded-xl border border-slate-700 transition flex items-center justify-center gap-2"
              >
                {copiedToast ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">¡Copiado al Portapapeles!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    <span>Copiar Datos de Acceso</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 9. MODAL EDITAR MÓDULOS DE CLIENTE EXISTENTE (SUPERADMIN) ── */}
      {editingModulesClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 rounded-3xl max-w-lg w-full p-6 text-slate-100 space-y-4 shadow-2xl relative border border-slate-800 flex flex-col max-h-[90vh]">
            <button
              onClick={() => setEditingModulesClient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-black text-white font-mono">
                  Módulos Autorizados: {editingModulesClient.nombre}
                </h3>
              </div>
              <p className="text-xs text-slate-400">
                Selecciona qué módulos tendrá activos este cliente en su menú lateral.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Aplicar Plantilla Rápida:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(MODULE_PRESETS).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyEditingPreset(key)}
                    className="px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition"
                  >
                    {MODULE_PRESETS[key].name}
                  </button>
                ))}
              </div>
            </div>

            {/* Checkboxes de los 16 módulos */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 overflow-y-auto pr-1 flex-1 max-h-80">
              {ALL_CLIENT_MODULES.map(mod => {
                const isChecked = editingModulesList.includes(mod.id);
                return (
                  <label
                    key={mod.id}
                    onClick={() => toggleEditingModule(mod.id)}
                    className={`flex items-start gap-2.5 p-2.5 rounded-xl border text-xs cursor-pointer transition select-none ${
                      isChecked
                        ? 'bg-blue-950/40 border-blue-500/50 text-blue-200 font-bold'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-700 text-blue-500 focus:ring-0 focus:ring-offset-0 bg-slate-800 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs flex items-center gap-1.5">
                        <span>{mod.icon}</span>
                        <span className="truncate">{mod.label}</span>
                      </p>
                      <p className="text-[10px] text-slate-500 font-normal mt-0.5">{mod.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
              <span className="text-xs text-slate-400 font-mono">
                {editingModulesList.length} de {ALL_CLIENT_MODULES.length} módulos seleccionados
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModulesClient(null)}
                  className="px-3.5 py-2 text-slate-400 hover:text-white font-mono text-xs rounded-xl hover:bg-slate-800 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveClientModules}
                  disabled={isSavingModules}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-mono font-bold text-xs rounded-xl shadow-lg transition flex items-center gap-1.5 disabled:opacity-50"
                >
                  {isSavingModules ? 'Guardando...' : 'Guardar Módulos'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
