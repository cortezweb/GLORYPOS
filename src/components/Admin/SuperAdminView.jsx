import React, { useState, useEffect } from 'react';
import {
  Server, Globe, Building2, Users, ShieldCheck, Activity, Cpu, Database,
  Search, Plus, ChevronRight, ExternalLink, Copy, Check, CheckCircle2,
  AlertCircle, Clock, Sparkles, DollarSign, Lock, Mail, Phone, ArrowUpRight,
  LogOut, RefreshCw, X, FileText, ShoppingCart, Wallet, Send, Terminal,
  Layers, Zap, UserCheck, PhoneCall, CheckSquare, SlidersHorizontal, KeyRound,
  Palette, Laptop, CheckCheck
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { tenantService, slugify } from '../../services/tenantService';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import { hashText } from '../../utils/crypto';
import { playCashChime } from '../../utils/audio';

export const RUBROS = [
  { id: 'ABARROTES', label: 'Minimarket & Abarrotes', icon: '🏪' },
  { id: 'FERRETERIA', label: 'Ferretería & Construcción', icon: '🔧' },
  { id: 'FARMACIA', label: 'Farmacia & Botica', icon: '💊' },
  { id: 'ROPA', label: 'Ropa & Calzado', icon: '👗' },
  { id: 'CARNICERIA', label: 'Carnicería & Frial', icon: '🥩' },
  { id: 'HELADERIA', label: 'Heladería & Cafetería', icon: '🍦' },
];

export const CIUDADES = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'Tarija', 'Oruro', 'Potosí', 'Beni', 'Pando'];

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

// Paletas de Color para el Admin Dashboard
const COLOR_THEMES = {
  indigo: {
    id: 'indigo',
    name: 'Azul Real & Índigo (SaaS Pro)',
    dot: 'bg-blue-600',
    primary: 'blue',
    headerBg: 'bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white border-blue-900/50',
    btnPrimary: 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-md shadow-blue-500/20',
    badge: 'bg-blue-50 text-blue-700 border-blue-200',
    activeTab: 'bg-blue-600 text-white shadow-sm',
    accentText: 'text-blue-600',
    accentBorder: 'border-blue-500',
    highlightRing: 'focus:ring-blue-500',
  },
  violet: {
    id: 'violet',
    name: 'Violeta Eléctrico (Modern)',
    dot: 'bg-violet-600',
    primary: 'violet',
    headerBg: 'bg-gradient-to-r from-slate-900 via-purple-950 to-violet-950 text-white border-purple-900/50',
    btnPrimary: 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white shadow-md shadow-violet-500/20',
    badge: 'bg-violet-50 text-violet-700 border-violet-200',
    activeTab: 'bg-violet-600 text-white shadow-sm',
    accentText: 'text-violet-600',
    accentBorder: 'border-violet-500',
    highlightRing: 'focus:ring-violet-500',
  },
  emerald: {
    id: 'emerald',
    name: 'Esmeralda & Menta (Fintech)',
    dot: 'bg-emerald-600',
    primary: 'emerald',
    headerBg: 'bg-gradient-to-r from-slate-900 via-teal-950 to-emerald-950 text-white border-emerald-900/50',
    btnPrimary: 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-md shadow-emerald-500/20',
    badge: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    activeTab: 'bg-emerald-600 text-white shadow-sm',
    accentText: 'text-emerald-600',
    accentBorder: 'border-emerald-500',
    highlightRing: 'focus:ring-emerald-500',
  },
  dark: {
    id: 'dark',
    name: 'Modo Obsidiana (Dark Elegante)',
    dot: 'bg-slate-800',
    primary: 'slate',
    headerBg: 'bg-slate-900 text-white border-slate-800',
    btnPrimary: 'bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white shadow-md border border-slate-700',
    badge: 'bg-slate-800 text-slate-200 border-slate-700',
    activeTab: 'bg-slate-900 text-white shadow-sm',
    accentText: 'text-slate-900',
    accentBorder: 'border-slate-800',
    highlightRing: 'focus:ring-slate-800',
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

  // Selector de tema de color para el Admin Dashboard
  const [selectedTheme, setSelectedTheme] = useState(() => {
    return localStorage.getItem('glorypos_admin_theme') || 'indigo';
  });

  const theme = COLOR_THEMES[selectedTheme] || COLOR_THEMES.indigo;

  const handleThemeChange = (newTheme) => {
    setSelectedTheme(newTheme);
    localStorage.setItem('glorypos_admin_theme', newTheme);
  };

  // Pestañas de la consola: 'tenants' (directorio) | 'usuarios' | 'operativo'
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
      email: 'admin@glorypos.com',
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

  // Handlers del Drawer de Alta
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

  // Handlers de Edición de Módulos de Cliente Existente
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
        color: 'from-blue-600 to-indigo-600',
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

  // Impersonate: Entrar al POS de la empresa seleccionada
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
    <div className="min-h-screen bg-slate-50/70 text-slate-800 p-4 sm:p-6 space-y-6 font-sans antialiased select-none pb-24">
      
      {/* ── 1. HEADER EJECUTIVO MODERNO ── */}
      <div className={`rounded-3xl p-5 sm:p-6 shadow-xl border ${theme.headerBg} flex flex-wrap items-center justify-between gap-4 transition-all duration-300`}>
        
        {/* Left: Branding & Status */}
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center font-black text-white shadow-inner">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                GLORYPOS <span className="text-white/70 font-normal">|</span> Admin Dashboard
              </h1>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Cloud Multi-Tenant Activo
              </span>
            </div>
            <p className="text-xs text-slate-300 mt-0.5 font-medium">
              Consola SaaS • Supabase Postgres • Aislamiento de Datos por Empresa
            </p>
          </div>
        </div>

        {/* Right: Quick Operational Buttons, Theme Switcher & Provision CTA */}
        <div className="flex items-center gap-2.5 flex-wrap">
          
          {/* Selector de Color Interactivo */}
          <div className="flex items-center gap-1.5 bg-black/30 backdrop-blur-md px-3 py-1.5 rounded-2xl border border-white/10" title="Selecciona tu paleta de color favorita">
            <Palette className="w-3.5 h-3.5 text-slate-300 mr-1" />
            {Object.values(COLOR_THEMES).map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => handleThemeChange(t.id)}
                title={t.name}
                className={`w-5 h-5 rounded-full ${t.dot} transition-transform ${
                  selectedTheme === t.id 
                    ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110 shadow-sm' 
                    : 'opacity-60 hover:opacity-100 hover:scale-105'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-1 bg-black/30 p-1 rounded-2xl border border-white/10">
            <button
              type="button"
              onClick={() => onSelectView && onSelectView('pos')}
              title="Abrir Punto de Venta"
              className="px-3 py-1.5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <ShoppingCart className="w-3.5 h-3.5 text-blue-300" />
              <span>POS</span>
            </button>
            <button
              type="button"
              onClick={onOpenCloseCash}
              title="Cierre de Caja"
              className="px-3 py-1.5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <Wallet className="w-3.5 h-3.5 text-emerald-300" />
              <span>Caja</span>
            </button>
          </div>

          {/* BOTÓN PRINCIPAL: PROVISIONAR TENANT */}
          <button
            type="button"
            onClick={handleOpenDrawer}
            className={`px-4 py-2.5 ${theme.btnPrimary} active:scale-95 text-xs font-black rounded-2xl transition flex items-center gap-2 cursor-pointer`}
          >
            <Plus className="w-4 h-4" />
            <span>Provisionar Nuevo Tenant</span>
          </button>
        </div>
      </div>

      {/* ── 2. METRICS ROW (KPIs EJECUTIVOS) ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        
        {/* KPI 1: Tenants */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tenants Totales</span>
            <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalClientes}</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              {clientesActivos} activos
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            {clientesTrial} en prueba • {clientesVencidos} vencidos
          </div>
        </div>

        {/* KPI 2: MRR */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MRR Recurrente</span>
            <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              Bs. {mrrTotal.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
              /mes
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Facturación mensual estimada
          </div>
        </div>

        {/* KPI 3: Cajas Desplegadas */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Cajas POS Activas</span>
            <div className="w-8 h-8 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
              <Cpu className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">{totalCajas}</span>
            <span className="text-xs font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full border border-sky-100">
              Terminales
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Soporte táctil & lector láser
          </div>
        </div>

        {/* KPI 4: Estado de Red */}
        <div className="bg-white border border-slate-200/90 p-4 rounded-3xl shadow-xs relative overflow-hidden group hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Salud del Cluster</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">99.98%</span>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
              Operativo
            </span>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 font-medium">
            Supabase Postgres + Cloudflare
          </div>
        </div>
      </div>

      {/* ── 3. TABS DE NAVEGACIÓN SEGMENTADA ── */}
      <div className="bg-white p-1.5 rounded-2xl border border-slate-200/90 flex items-center gap-1 shadow-xs max-w-xl">
        <button
          type="button"
          onClick={() => setActiveTab('tenants')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'tenants'
              ? `${theme.activeTab}`
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Tenants & Empresas ({clientCompanies.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('usuarios')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'usuarios'
              ? `${theme.activeTab}`
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Directorio de Usuarios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('operativo')}
          className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'operativo'
              ? `${theme.activeTab}`
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <SlidersHorizontal className="w-4 h-4" />
          <span>Configuración</span>
        </button>
      </div>

      {/* Notificación Toast */}
      {notificationMsg && (
        <div className="fixed bottom-6 right-6 z-50 p-4 bg-slate-900 text-white font-bold text-xs rounded-2xl shadow-2xl flex items-center gap-2.5 border border-slate-700 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ── 4. PESTAÑA: TENANTS & EMPRESAS ── */}
      {activeTab === 'tenants' && (
        <div className="space-y-4">
          
          {/* Barra de Filtros & Búsqueda */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por slug, negocio o NIT..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 font-medium"
              />
            </div>

            <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
              {[
                { id: 'TODOS', label: 'Todos' },
                { id: 'ACTIVO', label: 'Activos' },
                { id: 'TRIAL', label: 'En Prueba' },
                { id: 'VENCIDO', label: 'Vencidos' }
              ].map(st => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setFilterStatus(st.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer ${
                    filterStatus === st.id
                      ? `${theme.badge} border shadow-2xs`
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabla de Tenants */}
          <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] font-extrabold tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Empresa / Subdominio</th>
                    <th className="px-5 py-3.5">NIT & Propietario</th>
                    <th className="px-5 py-3.5">Plan / Tarifa</th>
                    <th className="px-5 py-3.5">Estado / Vigencia</th>
                    <th className="px-5 py-3.5 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredClients.map((client) => {
                    const isClientExpired = client.estado_suscripcion === 'VENCIDO';
                    const isCurrentActive = client.slug === tenantSlug;

                    return (
                      <tr key={client.id} className="hover:bg-slate-50/80 transition">
                        
                        {/* Tenant / Subdominio */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-slate-100 border border-slate-200 flex items-center justify-center text-base font-bold shrink-0 shadow-2xs">
                              {RUBROS.find(r => r.id === client.rubro)?.icon || '🏪'}
                            </div>
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-slate-900 text-sm">{client.nombre}</span>
                                {isCurrentActive && (
                                  <span className="px-2 py-0.5 text-[9px] font-black rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                    ESPACIO ACTIVO
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 text-blue-600 font-mono text-[11px] font-semibold">
                                <Globe className="w-3 h-3 shrink-0" />
                                <span>{client.slug || 'admin'}.glorypos.bo</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* NIT & Dueño */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <span className="text-slate-900 font-bold block font-mono">NIT: {client.nit_ci}</span>
                            <span className="text-slate-500 text-[11px]">
                              {client.propietario} • {client.ciudad}
                            </span>
                          </div>
                        </td>

                        {/* Plan & Tarifa */}
                        <td className="px-5 py-4">
                          <div className="space-y-1">
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                              <span className={`w-1.5 h-1.5 rounded-full ${isClientExpired ? 'bg-rose-500' : 'bg-emerald-500'}`}></span>
                              {client.plan_tipo}
                            </span>
                            <span className="text-[11px] text-slate-500 font-medium block">
                              Bs. {client.monto_mensual}/mes • {client.cajas_activas} cajas
                            </span>
                          </div>
                        </td>

                        {/* Estado / Vigencia */}
                        <td className="px-5 py-4">
                          <div className="space-y-0.5">
                            <span className={`text-xs font-bold block ${isClientExpired ? 'text-rose-600' : 'text-slate-800'}`}>
                              {new Date(client.fecha_vencimiento).toLocaleDateString('es-BO')}
                            </span>
                            <span className={`text-[10px] font-bold uppercase tracking-wider ${isClientExpired ? 'text-rose-500' : 'text-emerald-600'}`}>
                              {isClientExpired ? 'Suscripción Vencida' : 'Activo'}
                            </span>
                          </div>
                        </td>

                        {/* Acciones */}
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            
                            {/* Botón ACCEDER (Impersonate) */}
                            <button
                              type="button"
                              onClick={() => handleImpersonate(client.slug)}
                              title="Conectarse al POS de este negocio"
                              className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                            >
                              <Laptop className="w-3.5 h-3.5" />
                              <span>Acceder</span>
                            </button>

                            {/* Botón MÓDULOS */}
                            <button
                              type="button"
                              onClick={() => handleOpenEditModules(client)}
                              title="Configurar módulos asignados a este cliente"
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
                            >
                              <Layers className="w-3.5 h-3.5 text-slate-500" />
                              <span>Módulos</span>
                            </button>

                            {/* Botón CREDENCIALES */}
                            <button
                              type="button"
                              onClick={() => setCredentialsModalClient(client)}
                              title="Ver credenciales de acceso y WhatsApp"
                              className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded-xl border border-slate-200 transition cursor-pointer"
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
        <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-4 shadow-xs">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Directorio de Administradores & Cajeros</h3>
              <p className="text-xs text-slate-500">Cuentas creadas automáticamente al registrar cada empresa en GLORYPOS</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 pt-2">
            {clientCompanies.map(c => (
              <div key={c.id} className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-2.5 shadow-2xs hover:border-blue-300 transition">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 text-sm truncate max-w-[180px]">{c.nombre}</span>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                    {c.slug}
                  </span>
                </div>
                <div className="text-slate-600 text-xs space-y-1 pt-1.5 border-t border-slate-200/80">
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">👤 Dueño:</span>
                    <strong className="text-slate-800">{c.propietario}</strong>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">✉️ Correo:</span>
                    <span className="font-mono text-slate-700">{c.email}</span>
                  </p>
                  <p className="flex items-center gap-1.5">
                    <span className="text-slate-400">🔑 PIN de Caja:</span>
                    <span className="font-mono font-bold text-blue-600">1234</span>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleImpersonate(c.slug)}
                  className="w-full mt-2 py-1.5 bg-white hover:bg-blue-50 text-blue-700 border border-slate-200 hover:border-blue-300 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5 shadow-2xs"
                >
                  <Laptop className="w-3.5 h-3.5" />
                  <span>Conectar a este POS</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── 6. PESTAÑA: CONFIGURACIÓN OPERATIVA ── */}
      {activeTab === 'operativo' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <SlidersHorizontal className="w-5 h-5 text-blue-600" />
              Rubro Comercial Activo
            </h3>
            <p className="text-xs text-slate-500">
              Configura el rubro activo del terminal para adaptar el catálogo a farmacia, abarrotes, ferretería, restaurante, etc.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between mt-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Rubro Actual</span>
                <span className="text-base font-black text-blue-600">{currentRubro}</span>
              </div>
              <button
                type="button"
                onClick={onOpenRubroModal}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Cambiar Rubro
              </button>
            </div>
          </div>

          <div className="bg-white border border-slate-200/90 p-6 rounded-3xl space-y-3 shadow-xs">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-600" />
              Arqueo y Cierre de Caja
            </h3>
            <p className="text-xs text-slate-500">
              Apertura de turno, control de ingresos/egresos y balance de efectivo en gaveta con impresión térmica.
            </p>
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between mt-3">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Módulo</span>
                <span className="text-base font-black text-emerald-700">Caja Chica POS</span>
              </div>
              <button
                type="button"
                onClick={onOpenCloseCash}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition cursor-pointer shadow-xs"
              >
                Abrir Arqueo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 7. SLIDE-OVER DRAWER: PROVISIONAR TENANT ── */}
      {isDrawerOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-lg bg-white h-full overflow-y-auto p-6 flex flex-col justify-between shadow-2xl text-slate-800 border-l border-slate-200">
            
            {/* Header del Drawer */}
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
                    <Plus className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">Provisionar Nuevo Tenant</h3>
                    <p className="text-xs text-slate-500">Alta y despliegue en GLORYPOS Cloud</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Formulario */}
              <form id="drawerForm" onSubmit={handleDeployTenant} className="space-y-4 pt-4 text-xs">
                
                {/* 1. Nombre del Negocio */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Nombre Comercial *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Farmacia Santa María"
                    value={drawerData.nombre}
                    onChange={e => handleNombreChange(e.target.value)}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>

                {/* 2. Subdominio / Slug */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">
                    Subdominio Único (Tenant Slug) *
                  </label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl overflow-hidden focus-within:ring-2 focus-within:ring-blue-500/30">
                    <span className="pl-3 text-slate-400 select-none font-mono">https://</span>
                    <input
                      type="text"
                      required
                      placeholder="farmacia-santa-maria"
                      value={drawerData.slug}
                      onChange={e => {
                        setIsManualSlug(true);
                        setDrawerData(prev => ({ ...prev, slug: slugify(e.target.value) }));
                      }}
                      className="w-full p-2.5 bg-transparent text-blue-600 font-mono font-bold focus:outline-none"
                    />
                    <span className="pr-3 text-slate-400 select-none font-mono">.glorypos.bo</span>
                  </div>
                  <span className="text-[10px] text-blue-600 font-semibold mt-1 block">
                    ✓ Subdominio web para producción e identificador de acceso local.
                  </span>
                </div>

                {/* 3. NIT / CI y Ciudad */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">NIT / CI *</label>
                    <input
                      type="text"
                      required
                      placeholder="Ej. 1029384012"
                      value={drawerData.nit_ci}
                      onChange={e => setDrawerData(prev => ({ ...prev, nit_ci: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30 font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Ciudad (Bolivia)</label>
                    <select
                      value={drawerData.ciudad}
                      onChange={e => setDrawerData(prev => ({ ...prev, ciudad: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                    >
                      {CIUDADES.map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Rubro Comercial */}
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Rubro Comercial</label>
                  <select
                    value={drawerData.rubro}
                    onChange={e => setDrawerData(prev => ({ ...prev, rubro: e.target.value }))}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {RUBROS.map(r => (
                      <option key={r.id} value={r.id}>{r.icon} {r.label}</option>
                    ))}
                  </select>
                </div>

                {/* 5. Contacto & Usuario Admin */}
                <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-600 block border-b border-slate-200 pb-1">
                    Cuenta del Administrador
                  </span>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 block mb-0.5">Nombre Dueño</label>
                      <input
                        type="text"
                        placeholder="Carlos"
                        value={drawerData.adminNombre}
                        onChange={e => setDrawerData(prev => ({ ...prev, adminNombre: e.target.value }))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">WhatsApp (+591)</label>
                      <input
                        type="tel"
                        placeholder="77012345"
                        value={drawerData.telefono}
                        onChange={e => setDrawerData(prev => ({ ...prev, telefono: e.target.value }))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-slate-500 block mb-0.5">Correo Login</label>
                      <input
                        type="email"
                        placeholder="admin@empresa.bo"
                        value={drawerData.email}
                        onChange={e => setDrawerData(prev => ({ ...prev, email: e.target.value }))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-slate-500 block mb-0.5">PIN Caja (4 dígitos)</label>
                      <input
                        type="text"
                        maxLength={4}
                        value={drawerData.pin}
                        onChange={e => setDrawerData(prev => ({ ...prev, pin: e.target.value }))}
                        className="w-full p-2 bg-white border border-slate-200 rounded-xl text-slate-900 text-center font-bold font-mono"
                      />
                    </div>
                  </div>
                </div>

                {/* 6. Plan Asignado */}
                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Plan</label>
                    <select
                      value={drawerData.plan_tipo}
                      onChange={e => setDrawerData(prev => ({ ...prev, plan_tipo: e.target.value }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-blue-700 font-bold"
                    >
                      <option value="TRIAL">Prueba (30 días)</option>
                      <option value="BASICO">Básico (Bs. 150/mes)</option>
                      <option value="PROFESIONAL">Profesional (Bs. 350/mes)</option>
                      <option value="EMPRESARIAL">Empresarial (Bs. 700/mes)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-slate-700 font-bold block mb-1">Duración</label>
                    <select
                      value={drawerData.duracion_dias}
                      onChange={e => setDrawerData(prev => ({ ...prev, duracion_dias: Number(e.target.value) }))}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                    >
                      <option value={30}>30 Días (1 Mes)</option>
                      <option value={90}>90 Días (Trimestre)</option>
                      <option value={180}>180 Días (Semestre)</option>
                      <option value={365}>365 Días (1 Año)</option>
                    </select>
                  </div>
                </div>

                {/* 7. Módulos asignados */}
                <div className="space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <label className="text-slate-800 font-bold">Módulos Habilitados</label>
                    <span className="text-[10px] text-blue-600 font-bold font-mono">
                      {drawerData.modulos_activos.length} de {ALL_CLIENT_MODULES.length}
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {Object.keys(MODULE_PRESETS).map(key => (
                      <button
                        key={key}
                        type="button"
                        onClick={() => applyDrawerPreset(key)}
                        className="px-2 py-0.5 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition border border-slate-200"
                      >
                        {MODULE_PRESETS[key].name}
                      </button>
                    ))}
                  </div>

                  <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
                    {ALL_CLIENT_MODULES.map(mod => {
                      const isChecked = drawerData.modulos_activos.includes(mod.id);
                      return (
                        <label
                          key={mod.id}
                          onClick={() => toggleDrawerModule(mod.id)}
                          className={`flex items-center gap-2 p-2 rounded-xl border text-[11px] cursor-pointer transition select-none ${
                            isChecked
                              ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                              : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {}}
                            className="rounded border-slate-300 text-blue-600 focus:ring-0"
                          />
                          <span className="text-sm">{mod.icon}</span>
                          <span className="truncate">{mod.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

              </form>
            </div>

            {/* Footer del Drawer */}
            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="px-4 py-2.5 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
              >
                Cancelar
              </button>

              <button
                type="submit"
                form="drawerForm"
                disabled={isDeploying}
                className={`px-5 py-2.5 ${theme.btnPrimary} font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 disabled:opacity-50 cursor-pointer`}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-800 space-y-4 shadow-2xl relative border border-slate-200">
            <button
              onClick={() => setCredentialsModalClient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-2 border border-emerald-200 shadow-xs">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tenant Desplegado con Éxito</h3>
              <p className="text-xs text-slate-500">
                Credenciales listas para entregar a <strong className="text-slate-900">{credentialsModalClient.nombre}</strong>
              </p>
            </div>

            {/* Tarjeta con los datos de acceso */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">Subdominio Web:</span>
                <span className="text-blue-600 font-bold font-mono">https://{credentialsModalClient.slug}.glorypos.bo</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">Identificador Local:</span>
                <span className="text-slate-900 font-bold font-mono">{credentialsModalClient.slug}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">Usuario / Correo:</span>
                <span className="text-slate-900 font-mono">{credentialsModalClient.email}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200/80">
                <span className="text-slate-500">Contraseña:</span>
                <span className="text-slate-900 font-bold bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
                  {credentialsModalClient.rawPassword || 'admin'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">PIN Caja POS:</span>
                <span className="text-blue-600 font-black bg-white px-2 py-0.5 rounded border border-slate-200 font-mono">
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
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
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
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {copiedToast ? (
                  <>
                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Copiado al Portapapeles!</span>
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

      {/* ── 9. MODAL EDITAR MÓDULOS DE CLIENTE EXISTENTE ── */}
      {editingModulesClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-800 space-y-4 shadow-2xl relative border border-slate-200 flex flex-col max-h-[90vh]">
            <button
              onClick={() => setEditingModulesClient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div>
              <div className="flex items-center gap-2 mb-1">
                <Layers className="w-5 h-5 text-blue-600" />
                <h3 className="text-base font-bold text-slate-900">
                  Módulos Autorizados: {editingModulesClient.nombre}
                </h3>
              </div>
              <p className="text-xs text-slate-500">
                Selecciona qué módulos estarán activos en el menú lateral de esta empresa.
              </p>
            </div>

            {/* Presets */}
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                Aplicar Plantilla Rápida:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {Object.keys(MODULE_PRESETS).map(key => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => applyEditingPreset(key)}
                    className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 border border-slate-200 transition"
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
                        ? 'bg-blue-50/80 border-blue-300 text-blue-900 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => {}}
                      className="rounded border-slate-300 text-blue-600 focus:ring-0 mt-0.5"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs flex items-center gap-1.5">
                        <span>{mod.icon}</span>
                        <span className="truncate">{mod.label}</span>
                      </p>
                      <p className="text-[10px] text-slate-400 font-normal mt-0.5 leading-tight">{mod.desc}</p>
                    </div>
                  </label>
                );
              })}
            </div>

            {/* Footer */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500 font-mono">
                {editingModulesList.length} de {ALL_CLIENT_MODULES.length} módulos seleccionados
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingModulesClient(null)}
                  className="px-3.5 py-2 text-slate-500 hover:text-slate-800 font-bold text-xs rounded-xl hover:bg-slate-100 transition"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveClientModules}
                  disabled={isSavingModules}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
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
