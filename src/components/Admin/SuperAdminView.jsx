import React, { useState, useEffect } from 'react';
import {
  Play, ShoppingCart, Tag, Search, BarChart3, Wallet, Sparkles,
  Building2, ShieldCheck, CheckCircle2, AlertCircle, Clock, Calendar,
  Users, Settings, Plus, RefreshCw, X, ExternalLink, HelpCircle,
  PhoneCall, ChevronRight, Layers, FileText, Check, DollarSign,
  ArrowUpRight, Store, Send, Lock, Eye, Edit3, UserCheck, Smartphone, LogOut
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { playCashChime } from '../../utils/audio';

// ── Mascotas SVG Estilizadas 3D para las tarjetas ────────────────────────────

function MascotPosPhone() {
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 select-none pointer-events-none drop-shadow-xl animate-bounce-subtle">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Glow de fondo */}
        <circle cx="60" cy="65" r="45" fill="#38bdf8" opacity="0.25" />
        
        {/* Teléfono / Terminal POS */}
        <rect x="36" y="16" width="48" height="84" rx="14" fill="#2563eb" stroke="#1d4ed8" strokeWidth="2.5" />
        <rect x="42" y="24" width="36" height="52" rx="6" fill="#eff6ff" />
        
        {/* Pantalla del POS con carita alegre */}
        <circle cx="53" cy="44" r="3.5" fill="#1e40af" />
        <circle cx="67" cy="44" r="3.5" fill="#1e40af" />
        <path d="M 53 53 Q 60 60 67 53" stroke="#1e40af" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Mejillas sonrojadas */}
        <circle cx="49" cy="49" r="2.5" fill="#f43f5e" opacity="0.6" />
        <circle cx="71" cy="49" r="2.5" fill="#f43f5e" opacity="0.6" />

        {/* Teclado táctil / Botón home */}
        <circle cx="60" cy="88" r="4.5" fill="#93c5fd" />

        {/* Canasta de compras rosa/roja */}
        <path d="M 20 68 L 42 68 L 38 88 L 24 88 Z" fill="#ec4899" stroke="#be185d" strokeWidth="1.5" />
        <line x1="22" y1="74" x2="39" y2="74" stroke="#fbcfe8" strokeWidth="1.5" />
        <line x1="24" y1="80" x2="37" y2="80" stroke="#fbcfe8" strokeWidth="1.5" />
        
        {/* Billete de Bolivianos Bs. flotando */}
        <rect x="80" y="36" width="32" height="18" rx="3" fill="#10b981" stroke="#047857" strokeWidth="1.5" transform="rotate(15 80 36)" />
        <text x="88" y="49" fill="#ffffff" fontSize="9" fontWeight="900" transform="rotate(15 80 36)">Bs.</text>

        {/* Manitas del personaje */}
        <circle cx="34" cy="56" r="4.5" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.5" />
        <circle cx="86" cy="56" r="4.5" fill="#93c5fd" stroke="#1d4ed8" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function MascotProductBox() {
  return (
    <div className="relative w-28 h-28 sm:w-32 sm:h-32 select-none pointer-events-none drop-shadow-xl animate-bounce-subtle">
      <svg viewBox="0 0 120 120" className="w-full h-full">
        {/* Sombra */}
        <ellipse cx="60" cy="100" rx="42" ry="10" fill="#fde68a" opacity="0.6" />

        {/* Caja de cartón marrón/naranja */}
        <rect x="18" y="38" width="56" height="58" rx="8" fill="#f59e0b" stroke="#d97706" strokeWidth="2.5" />
        <polygon points="18,38 32,24 88,24 74,38" fill="#fbbf24" stroke="#d97706" strokeWidth="2" />
        <polygon points="74,38 88,24 88,82 74,96" fill="#b45309" stroke="#92400e" strokeWidth="2" />
        
        {/* Cinta de empaque */}
        <rect x="42" y="24" width="10" height="72" fill="#d97706" opacity="0.35" />

        {/* Personaje Hoja / Factura sonriente adjunta a la caja */}
        <rect x="62" y="30" width="38" height="50" rx="5" fill="#ffffff" stroke="#3b82f6" strokeWidth="2.5" />
        {/* Ojos */}
        <circle cx="74" cy="46" r="3" fill="#1d4ed8" />
        <circle cx="88" cy="46" r="3" fill="#1d4ed8" />
        {/* Sonrisa */}
        <path d="M 74 54 Q 81 61 88 54" stroke="#1d4ed8" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        {/* Mejillas */}
        <circle cx="71" cy="50" r="2" fill="#f43f5e" opacity="0.6" />
        <circle cx="91" cy="50" r="2" fill="#f43f5e" opacity="0.6" />

        {/* Manitas del documento */}
        <circle cx="58" cy="56" r="3.5" fill="#93c5fd" stroke="#2563eb" strokeWidth="1.5" />
        <circle cx="102" cy="56" r="3.5" fill="#93c5fd" stroke="#2563eb" strokeWidth="1.5" />
      </svg>
    </div>
  );
}

function MascotClipboard() {
  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 select-none pointer-events-none drop-shadow-lg">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Tabla portapapeles */}
        <rect x="20" y="16" width="56" height="74" rx="8" fill="#e2e8f0" stroke="#94a3b8" strokeWidth="2" />
        <rect x="24" y="22" width="48" height="64" rx="4" fill="#ffffff" />
        {/* Clip superior */}
        <rect x="38" y="12" width="20" height="8" rx="3" fill="#3b82f6" />

        {/* Carita sonriente en la hoja */}
        <circle cx="42" cy="42" r="2.5" fill="#1e293b" />
        <circle cx="54" cy="42" r="2.5" fill="#1e293b" />
        <path d="M 43 49 Q 48 54 53 49" stroke="#1e293b" strokeWidth="2" strokeLinecap="round" fill="none" />

        {/* Líneas de texto del documento */}
        <line x1="30" y1="60" x2="66" y2="60" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="68" x2="56" y2="68" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
        <line x1="30" y1="76" x2="62" y2="76" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />

        {/* Lupa 3D */}
        <circle cx="68" cy="44" r="14" fill="#60a5fa" fillOpacity="0.4" stroke="#2563eb" strokeWidth="3" />
        <line x1="78" y1="54" x2="90" y2="66" stroke="#d97706" strokeWidth="5" strokeLinecap="round" />
      </svg>
    </div>
  );
}

function MascotReportCharts() {
  return (
    <div className="relative w-24 h-24 sm:w-28 sm:h-28 select-none pointer-events-none drop-shadow-lg">
      <svg viewBox="0 0 100 100" className="w-full h-full">
        {/* Hoja de reporte */}
        <rect x="18" y="18" width="58" height="72" rx="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
        
        {/* Barras de gráfico de crecimiento en 3D */}
        <rect x="28" y="58" width="8" height="24" rx="2" fill="#ec4899" />
        <rect x="40" y="44" width="8" height="38" rx="2" fill="#8b5cf6" />
        <rect x="52" y="32" width="8" height="50" rx="2" fill="#3b82f6" />
        <rect x="64" y="24" width="8" height="58" rx="2" fill="#10b981" />

        {/* Gráfico circular / Donut flotante */}
        <circle cx="34" cy="34" r="10" fill="none" stroke="#6366f1" strokeWidth="4" />
        <circle cx="34" cy="34" r="10" fill="none" stroke="#f59e0b" strokeWidth="4" strokeDasharray="30 40" />

        {/* Línea de tendencia ascendente */}
        <path d="M 28 54 Q 46 36 68 20" stroke="#f43f5e" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <polygon points="68,20 62,21 67,26" fill="#f43f5e" />
      </svg>
    </div>
  );
}

export default function SuperAdminView({
  onSelectView,
  onOpenCloseCash,
  onOpenRubroModal,
  currentRubro
}) {
  const { empresa, currentUser, logout, diasRestantes, isExpired, cambiarPlan, setTrialDays, updateEmpresa } = useAuth();

  // Modo de vista: 'hub' (dashboard visual de la imagen) o 'saas_manager' (gestión profunda de suscripciones)
  const [activeTab, setActiveTab] = useState('hub'); // 'hub' | 'clientes' | 'planes' | 'metricas'
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState(0);

  // Lista de empresas cliente SaaS registradas (simuladas + empresa local activa)
  const [clientCompanies, setClientCompanies] = useState([
    {
      id: 'empresa_activa',
      nombre: empresa?.nombre || 'Minimarket & Abarrotes El Prado',
      nit_ci: empresa?.nit_ci || '8472910014',
      rubro: empresa?.rubro || 'ABARROTES',
      propietario: empresa?.propietario || 'Carlos Gutiérrez',
      ciudad: empresa?.ciudad || 'Santa Cruz',
      telefono: empresa?.telefono || '77012345',
      plan_tipo: empresa?.plan_tipo || 'TRIAL',
      estado_suscripcion: empresa?.estado_suscripcion || 'ACTIVO',
      fecha_vencimiento: empresa?.fecha_vencimiento || new Date(Date.now() + 25 * 86400000).toISOString(),
      cajas_activas: 2,
      modulos_activos: ['POS', 'SIAT', 'INVENTARIO', 'KARDEX', 'REPORTES'],
      monto_mensual: 350
    },
    {
      id: 'emp-002',
      nombre: 'Ferretería El Tornillo Fuerte S.R.L.',
      nit_ci: '1029384756',
      rubro: 'FERRETERIA',
      propietario: 'Roberto Méndez',
      ciudad: 'Cochabamba',
      telefono: '76543210',
      plan_tipo: 'PROFESIONAL',
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: new Date(Date.now() + 18 * 86400000).toISOString(),
      cajas_activas: 3,
      modulos_activos: ['POS', 'COTIZACIONES', 'KARDEX', 'BALANZA'],
      monto_mensual: 350
    },
    {
      id: 'emp-003',
      nombre: 'Farmacia & Botica San Pedro',
      nit_ci: '4920192011',
      rubro: 'FARMACIA',
      propietario: 'Dra. Elena Vargas',
      ciudad: 'La Paz',
      telefono: '71239845',
      plan_tipo: 'BASICO',
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: new Date(Date.now() + 6 * 86400000).toISOString(),
      cajas_activas: 1,
      modulos_activos: ['POS', 'LOTES_VENCIMIENTOS', 'SIAT'],
      monto_mensual: 150
    },
    {
      id: 'emp-004',
      nombre: 'Boutique D’Luxe Ropa y Calzado',
      nit_ci: '7482910023',
      rubro: 'ROPA',
      propietario: 'Mariana Suarez',
      ciudad: 'Santa Cruz',
      telefono: '78901234',
      plan_tipo: 'TRIAL',
      estado_suscripcion: 'VENCIDO',
      fecha_vencimiento: new Date(Date.now() - 2 * 86400000).toISOString(),
      cajas_activas: 1,
      modulos_activos: ['POS', 'TALLAS_COLORES'],
      monto_mensual: 150
    },
    {
      id: 'emp-005',
      nombre: 'Frial & Carnicería Don Choco',
      nit_ci: '6192834018',
      rubro: 'CARNICERIA',
      propietario: 'Joaquín Castro',
      ciudad: 'Tarija',
      telefono: '75432190',
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
  const [selectedClientForEdit, setSelectedClientForEdit] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState(null);

  // Modal de alta de nuevo cliente SaaS
  const [isNewClientModalOpen, setIsNewClientModalOpen] = useState(false);
  const [newClientData, setNewClientData] = useState({
    nombre: '',
    propietario: '',
    email: '',
    nit_ci: '',
    telefono: '',
    ciudad: 'Santa Cruz',
    rubro: 'ABARROTES',
    plan_tipo: 'PROFESIONAL',
    duracion_dias: 30,
    cajas_activas: 2
  });
  const [credentialsModalClient, setCredentialsModalClient] = useState(null);
  const [copiedToast, setCopiedToast] = useState(false);

  const showToast = (msg) => {
    setNotificationMsg(msg);
    setTimeout(() => setNotificationMsg(null), 3500);
  };

  const handleCreateNewClient = (e) => {
    e.preventDefault();
    if (!newClientData.nombre.trim() || !newClientData.nit_ci.trim()) {
      alert('Por favor completa el nombre de la empresa y su NIT/CI.');
      return;
    }

    const montos = { BASICO: 150, PROFESIONAL: 350, EMPRESARIAL: 700, TRIAL: 0 };
    const duracion = Number(newClientData.duracion_dias) || 30;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + duracion);

    const emailGen = newClientData.email.trim() || `admin@${newClientData.nombre.toLowerCase().replace(/[^a-z0-9]/g, '')}.bo`;

    const createdClient = {
      id: `emp-${Date.now()}`,
      nombre: newClientData.nombre.trim(),
      nit_ci: newClientData.nit_ci.trim(),
      propietario: newClientData.propietario.trim() || 'Propietario General',
      email: emailGen,
      telefono: newClientData.telefono.trim() || '77000000',
      ciudad: newClientData.ciudad,
      rubro: newClientData.rubro,
      plan_tipo: newClientData.plan_tipo,
      estado_suscripcion: 'ACTIVO',
      fecha_vencimiento: expiry.toISOString(),
      cajas_activas: Number(newClientData.cajas_activas) || 2,
      modulos_activos: ['POS', 'INVENTARIO', 'KARDEX', 'REPORTES', 'SIAT'],
      monto_mensual: montos[newClientData.plan_tipo] || 150
    };

    setClientCompanies(prev => [createdClient, ...prev]);
    setIsNewClientModalOpen(false);
    setCredentialsModalClient(createdClient);
    playCashChime();
    showToast(`¡Cliente "${createdClient.nombre}" dado de alta con éxito!`);

    // Reset form
    setNewClientData({
      nombre: '',
      propietario: '',
      email: '',
      nit_ci: '',
      telefono: '',
      ciudad: 'Santa Cruz',
      rubro: 'ABARROTES',
      plan_tipo: 'PROFESIONAL',
      duracion_dias: 30,
      cajas_activas: 2
    });
  };

  const getWhatsAppMessage = (client) => {
    const venc = new Date(client.fecha_vencimiento).toLocaleDateString('es-BO');
    return `¡Hola ${client.propietario}! 👋%0A%0A` +
      `Te damos la bienvenida a *GLORYPOS Bolivia* 🇧🇴.%0A` +
      `Tu suscripción para *${client.nombre}* ha sido dada de alta con éxito:%0A%0A` +
      `⭐ *Plan:* ${client.plan_tipo}%0A` +
      `📅 *Vigencia hasta:* ${venc}%0A` +
      `🏪 *Rubro:* ${client.rubro}%0A%0A` +
      `🔑 *Tus credenciales de acceso:*%0A` +
      `• *Enlace:* https://app.glorypos.bo%0A` +
      `• *Usuario / Correo:* ${client.email}%0A` +
      `• *PIN Táctil de Cobro:* 1234%0A` +
      `• *Clave Admin:* admin%0A%0A` +
      `Estamos a tu disposición para soporte. ¡Buenas ventas! 🚀`;
  };

  // Renovar suscripción +30 días a un cliente
  const handleExtendSubscription = async (clientId) => {
    setClientCompanies(prev => prev.map(c => {
      if (c.id === clientId) {
        const currExp = new Date(c.fecha_vencimiento > new Date().toISOString() ? c.fecha_vencimiento : new Date());
        currExp.setDate(currExp.getDate() + 30);
        return {
          ...c,
          estado_suscripcion: 'ACTIVO',
          fecha_vencimiento: currExp.toISOString()
        };
      }
      return c;
    }));

    if (clientId === 'empresa_activa') {
      await setTrialDays(30);
    }
    playCashChime();
    showToast('¡Suscripción renovada por 30 días adicionales con éxito!');
  };

  // Cambiar plan a un cliente
  const handleChangeClientPlan = async (clientId, nuevoPlan) => {
    setClientCompanies(prev => prev.map(c => {
      if (c.id === clientId) {
        const montos = { BASICO: 150, PROFESIONAL: 350, EMPRESARIAL: 700, TRIAL: 0 };
        return {
          ...c,
          plan_tipo: nuevoPlan,
          monto_mensual: montos[nuevoPlan] || 150,
          estado_suscripcion: 'ACTIVO'
        };
      }
      return c;
    }));

    if (clientId === 'empresa_activa') {
      await cambiarPlan(nuevoPlan);
    }
    playCashChime();
    showToast(`Plan actualizado a: ${nuevoPlan}`);
  };

  // Calcular métricas SaaS
  const totalClientes = clientCompanies.length;
  const clientesActivos = clientCompanies.filter(c => c.estado_suscripcion === 'ACTIVO').length;
  const clientesVencidos = clientCompanies.filter(c => c.estado_suscripcion === 'VENCIDO').length;
  const mrrTotal = clientCompanies
    .filter(c => c.estado_suscripcion === 'ACTIVO')
    .reduce((acc, curr) => acc + (curr.monto_mensual || 0), 0);

  const tutorialVideos = [
    {
      title: 'Emisión rápida de Facturas SIAT y Notas de Venta',
      duration: '3:45 min',
      desc: 'Aprende a cobrar en 3 segundos con código de barras, Efectivo y QR Simple.',
      category: 'Ventas'
    },
    {
      title: 'Alta de Productos: Balanza, Lotes, Tallas y Sabores',
      duration: '4:20 min',
      desc: 'Configuración de catálogo según el rubro comercial activo en Bolivia.',
      category: 'Catálogo'
    },
    {
      title: 'Gestión de Suscripciones y Clientes SaaS',
      duration: '5:10 min',
      desc: 'Cómo activar planes, renovar licencias y supervisar cobranzas recurrentes.',
      category: 'SuperAdmin'
    }
  ];

  return (
    <div className="space-y-5 animate-fadeIn pb-16">
      
      {/* ── 1. TOP HEADER BRANDING & SHORTCUTS (ESTILO TUKIFAC / GLORYPOS) ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3">
        {/* Left: Quick Document Shortcuts */}
        <div className="flex items-center flex-wrap gap-2">
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => onSelectView('ventas_comprobantes')}
              title="Nota de Crédito"
              className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-black border border-slate-200 shadow-2xs transition flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-indigo-600" />
              <span>NC</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('ventas_notas')}
              title="Nota de Venta"
              className="px-2 py-1 bg-white hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg text-xs font-black border border-slate-200 shadow-2xs transition flex items-center gap-1"
            >
              <FileText className="w-3 h-3 text-emerald-600" />
              <span>NV</span>
            </button>
            <button
              type="button"
              onClick={() => onSelectView('pos')}
              title="Punto de Venta"
              className="px-2.5 py-1 bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 rounded-lg text-xs font-black shadow-xs transition flex items-center gap-1"
            >
              <ShoppingCart className="w-3 h-3" />
              <span>POS</span>
            </button>
          </div>

          {/* Plan Status Pill */}
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-emerald-50/80 border border-emerald-200 rounded-xl text-xs">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <div className="leading-tight">
              <span className="font-black text-emerald-800 uppercase block text-[10px]">
                Plan: {empresa?.plan_tipo || 'ILIMITADO SAAS'}
              </span>
              <span className="text-[10px] text-emerald-600 font-medium">
                {isExpired ? 'Suscripción por renovar' : `Estás al día en tus pagos (${diasRestantes}d)`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Soporte, SIAT Status, Notifications, SuperAdmin Avatar */}
        <div className="flex items-center gap-2">
          {/* WhatsApp Support Button */}
          <a
            href="https://wa.me/59177012345?text=Hola%20GLORYPOS%2C%20requiero%20soporte%20del%20sistema"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition"
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Soporte</span>
          </a>

          {/* Mode Badge SIAT */}
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-900 text-blue-100 text-[11px] font-bold border border-blue-700 shadow-xs">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            <span>Modo: PRODUCCIÓN SIAT</span>
          </div>

          {/* Tab Switcher: Vista Hub vs Control Clientes SaaS */}
          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => setActiveTab('hub')}
              className={`px-3 py-1 rounded-lg transition ${
                activeTab === 'hub' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Hub Inicio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('clientes')}
              className={`px-3 py-1 rounded-lg transition flex items-center gap-1 ${
                activeTab === 'clientes' ? 'bg-white text-blue-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Building2 className="w-3 h-3" />
              <span>Clientes SaaS ({totalClientes})</span>
            </button>
          </div>

          {/* User Profile & Logout Action */}
          <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
            <div className="hidden lg:flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                {currentUser?.nombre ? currentUser.nombre.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="flex flex-col text-left leading-none">
                <span className="text-[11px] font-bold text-slate-800 truncate max-w-[100px]">
                  {currentUser?.nombre ? currentUser.nombre.split(' ')[0] : 'Admin'}
                </span>
                <span className="text-[8px] font-extrabold text-blue-600 uppercase">
                  {currentUser?.rol || 'SUPERADMIN'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => logout()}
              title="Cerrar Sesión"
              className="flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-600 text-rose-600 hover:text-white rounded-xl text-xs font-bold border border-rose-200 hover:border-rose-600 transition shadow-xs cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {notificationMsg && (
        <div className="bg-emerald-600 text-white px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-bold animate-slideDown">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{notificationMsg}</span>
        </div>
      )}

      {/* ── 2. PESTAÑA PRINCIPAL: HUB VISUAL (IDÉNTICO A LA IMAGEN ADJUNTA) ── */}
      {activeTab === 'hub' && (
        <div className="space-y-5">
          
          {/* ── A. HERO TUTORIAL BANNER CON BOTÓN PLAY ── */}
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-xl border border-slate-800">
            {/* Imagen de fondo comercial con oscurecimiento */}
            <div 
              className="absolute inset-0 bg-cover bg-center opacity-25 mix-blend-luminosity"
              style={{
                backgroundImage: `url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=1200&q=80')`
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-900/80 to-indigo-950/90" />

            <div className="relative p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="space-y-2 max-w-xl text-center md:text-left">
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-500/20 text-blue-300 text-[11px] font-extrabold border border-blue-500/30">
                  <Sparkles className="w-3 h-3 text-blue-400" />
                  <span>CENTRO DE CAPACITACIÓN & GESTIÓN SAAS</span>
                </div>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight leading-tight">
                  Aprende a utilizar <span className="text-emerald-400">GLORYPOS</span> <br className="hidden sm:inline" />
                  con <span className="text-emerald-400 underline decoration-emerald-500/40">nuestros tutoriales</span>
                </h1>
                <p className="text-xs sm:text-sm text-slate-300 font-medium">
                  Domina la venta táctil, emisión de facturas SIAT, administración de inventarios y control de suscripciones mensuales.
                </p>
              </div>

              {/* Botón Circular Play 3D */}
              <div className="shrink-0 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsVideoModalOpen(true)}
                  aria-label="Reproducir tutoriales"
                  className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md border-2 border-white/40 flex items-center justify-center shadow-2xl transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-400 text-white flex items-center justify-center shadow-lg group-hover:from-emerald-400 group-hover:to-teal-300 transition">
                    <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white translate-x-0.5" />
                  </div>
                  {/* Onda de pulso animada */}
                  <span className="absolute inset-0 rounded-full border-2 border-emerald-400/60 animate-ping pointer-events-none" />
                </button>
                <span className="text-[11px] font-bold text-emerald-300 tracking-wider uppercase">
                  Ver Video Demo
                </span>
              </div>
            </div>
          </div>

          {/* ── B. SELECCIONA UNA DE LAS OPCIONES / OTRAS HERRAMIENTAS ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            
            {/* COLUMNA IZQUIERDA: 2 TARJETAS GRANDES PRINCIPALES (7 COLS) */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Selecciona una de las opciones
                </span>
                <span className="text-xs text-blue-600 font-bold hover:underline cursor-pointer" onClick={() => onSelectView('pos')}>
                  Ir al catálogo completo →
                </span>
              </div>

              {/* TARJETA 1: REALIZA UNA VENTA RÁPIDA (VERDE / MENTA / TEAL) */}
              <div 
                onClick={() => onSelectView('pos')}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-100/70 via-teal-50 to-cyan-50 border border-emerald-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-emerald-300 transition-all duration-200 cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-2 z-10 max-w-[240px] sm:max-w-xs">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/80 text-emerald-800 text-[10px] font-black border border-emerald-300/60 shadow-2xs">
                    Herramienta
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 leading-tight">
                    Realiza una <br />
                    <span className="text-emerald-700 group-hover:text-emerald-800 transition">Venta rápida</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Cobro en mostrador táctil, códigos de barra y tickets en Bs.
                  </p>
                </div>

                <div className="group-hover:scale-105 transition-transform duration-300">
                  <MascotPosPhone />
                </div>
              </div>

              {/* TARJETA 2: VER O AGREGAR PRODUCTOS (ÁMBAR / AMARILLO) */}
              <div 
                onClick={() => onSelectView('productos')}
                className="group relative overflow-hidden rounded-3xl bg-gradient-to-br from-amber-100/70 via-yellow-50 to-orange-50 border border-amber-200/90 p-5 sm:p-6 shadow-sm hover:shadow-md hover:border-amber-300 transition-all duration-200 cursor-pointer flex items-center justify-between"
              >
                <div className="space-y-2 z-10 max-w-[240px] sm:max-w-xs">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white/80 text-amber-800 text-[10px] font-black border border-amber-300/60 shadow-2xs">
                    Herramienta
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-800 leading-tight">
                    Ver o agregar <br />
                    <span className="text-amber-800 group-hover:text-amber-900 transition">Productos</span>
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    Precios, inventario, balanza al gramo, lotes y tallas.
                  </p>
                </div>

                <div className="group-hover:scale-105 transition-transform duration-300">
                  <MascotProductBox />
                </div>
              </div>
            </div>

            {/* COLUMNA DERECHA: OTRAS HERRAMIENTAS (5 COLS) */}
            <div className="lg:col-span-5 space-y-4 flex flex-col justify-between">
              <div className="flex items-center justify-between px-1">
                <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                  Otras herramientas
                </span>
                <span className="text-xs text-indigo-600 font-bold hover:underline cursor-pointer" onClick={() => onSelectView('reports')}>
                  Ver analíticas →
                </span>
              </div>

              {/* GRID 2 TARJETAS SUPERIORES */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* TARJETA 3: BUSCAR DOCUMENTOS */}
                <div 
                  onClick={() => onSelectView('ventas_comprobantes')}
                  className="group bg-gradient-to-br from-slate-50 to-blue-50/60 border border-slate-200/90 rounded-3xl p-4 sm:p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-slate-600 text-[10px] font-black border border-slate-200 shadow-2xs mb-2">
                      Herramienta
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                      Buscar <br />
                      <span className="text-blue-700">Documentos</span>
                    </h3>
                  </div>

                  <div className="flex justify-end mt-2 group-hover:scale-105 transition-transform duration-300">
                    <MascotClipboard />
                  </div>
                </div>

                {/* TARJETA 4: CONSULTAR REPORTES */}
                <div 
                  onClick={() => onSelectView('reports')}
                  className="group bg-gradient-to-br from-indigo-50/50 via-purple-50/30 to-slate-50 border border-indigo-100 rounded-3xl p-4 sm:p-5 hover:shadow-md hover:border-indigo-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-indigo-700 text-[10px] font-black border border-indigo-200 shadow-2xs mb-2">
                      Herramienta
                    </span>
                    <h3 className="text-lg sm:text-xl font-black text-slate-800 leading-tight">
                      Consultar <br />
                      <span className="text-indigo-800">Reportes</span>
                    </h3>
                  </div>

                  <div className="flex justify-end mt-2 group-hover:scale-105 transition-transform duration-300">
                    <MascotReportCharts />
                  </div>
                </div>
              </div>

              {/* TARJETA 5: APERTURA O CIERRE DE CAJAS (ANCHO INFERIOR) */}
              <div 
                onClick={onOpenCloseCash}
                className="group bg-gradient-to-r from-sky-50 via-blue-50 to-indigo-50 border border-blue-200 rounded-3xl p-4 sm:p-5 hover:shadow-md hover:border-blue-300 transition-all duration-200 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-white text-blue-700 text-[10px] font-black border border-blue-200 shadow-2xs mb-1.5">
                    Herramienta
                  </span>
                  <h3 className="text-base sm:text-lg font-black text-slate-800">
                    Apertura o cierre de cajas
                  </h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">
                    Arqueo de turnos, efectivo en gaveta y balance del día.
                  </p>
                </div>

                <div className="w-12 h-12 rounded-2xl bg-white text-blue-600 border border-blue-100 shadow-xs flex items-center justify-center group-hover:scale-110 group-hover:bg-blue-600 group-hover:text-white transition-all duration-200">
                  <Wallet className="w-6 h-6" />
                </div>
              </div>

            </div>
          </div>

          {/* ── C. BARRA INFERIOR DE ACCESO RÁPIDO SUPERADMIN SAAS ── */}
          <div className="bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-violet-600 flex items-center justify-center font-black">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="text-sm font-black">Panel de Gestión SuperAdmin SaaS</h4>
                <p className="text-xs text-slate-300">
                  Tienes <strong className="text-emerald-400">{clientesActivos} clientes activos</strong> generando <strong className="text-emerald-400">Bs. {mrrTotal.toLocaleString()} /mes</strong>.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('clientes')}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center gap-1.5"
              >
                <Users className="w-3.5 h-3.5" />
                <span>Administrar Suscripciones & Clientes</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

        </div>
      )}

      {/* ── 3. PESTAÑA SUPERADMIN: GESTIÓN DE CLIENTES & SUSCRIPCIONES SAAS ── */}
      {activeTab === 'clientes' && (
        <div className="space-y-5 animate-fadeIn">
          
          {/* Métricas KPI de Suscripciones */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Totales</span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">{totalClientes}</span>
              <span className="text-[10px] text-slate-500">Empresas registradas</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Clientes Activos</span>
              <span className="text-2xl font-black text-emerald-600 mt-1 block">{clientesActivos}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Al día con sus cuotas</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Por Vencer / Vencidos</span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">{clientesVencidos}</span>
              <span className="text-[10px] text-rose-600 font-semibold">Requieren renovación</span>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">MRR Facturado</span>
              <span className="text-2xl font-black text-indigo-600 mt-1 block">Bs. {mrrTotal.toLocaleString()}</span>
              <span className="text-[10px] text-indigo-600 font-semibold">Ingreso recurrente mensual</span>
            </div>
          </div>

          {/* Barra de Búsqueda y Filtros */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Buscar por negocio, NIT o ciudad..."
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs rounded-xl bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap w-full sm:w-auto">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
                {['TODOS', 'ACTIVO', 'VENCIDO', 'TRIAL'].map(st => (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setFilterStatus(st)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                      filterStatus === st 
                        ? 'bg-slate-900 text-white shadow-xs' 
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {st}
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setIsNewClientModalOpen(true)}
                className="px-3.5 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-black shadow-xs transition flex items-center gap-1.5 shrink-0 active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>+ Registrar Nuevo Cliente</span>
              </button>
            </div>
          </div>

          {/* Tabla de Clientes SaaS */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase tracking-wider font-extrabold text-[10px]">
                  <tr>
                    <th className="py-3.5 px-4">Empresa / Negocio</th>
                    <th className="py-3.5 px-4">NIT & Contacto</th>
                    <th className="py-3.5 px-4">Rubro Comercial</th>
                    <th className="py-3.5 px-4">Plan SaaS</th>
                    <th className="py-3.5 px-4">Estado Suscripción</th>
                    <th className="py-3.5 px-4">Vencimiento</th>
                    <th className="py-3.5 px-4 text-right">Acciones SuperAdmin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {clientCompanies
                    .filter(c => {
                      const matchSearch = c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                          c.nit_ci.includes(searchTerm) ||
                                          c.ciudad.toLowerCase().includes(searchTerm.toLowerCase());
                      const matchStatus = filterStatus === 'TODOS' || c.estado_suscripcion === filterStatus;
                      return matchSearch && matchStatus;
                    })
                    .map((client) => {
                      const diasRest = Math.ceil((new Date(client.fecha_vencimiento) - new Date()) / 86400000);
                      const isExpiredClient = diasRest <= 0;

                      return (
                        <tr key={client.id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 text-sm">{client.nombre}</div>
                            <div className="text-[11px] text-slate-500 font-medium">{client.propietario} • {client.ciudad}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-mono font-bold text-slate-700">NIT: {client.nit_ci}</div>
                            <div className="text-[11px] text-slate-500">Tel: {client.telefono}</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-200">
                              {client.rubro}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-black text-slate-800">{client.plan_tipo}</div>
                            <div className="text-[11px] text-emerald-600 font-bold">Bs. {client.monto_mensual}/mes</div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-[10px] ${
                              isExpiredClient
                                ? 'bg-rose-100 text-rose-700 border border-rose-200'
                                : client.plan_tipo === 'TRIAL'
                                ? 'bg-amber-100 text-amber-800 border border-amber-200'
                                : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            }`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${
                                isExpiredClient ? 'bg-rose-500' : 'bg-emerald-500'
                              }`} />
                              {isExpiredClient ? 'VENCIDO' : client.plan_tipo === 'TRIAL' ? 'PRUEBA TRIAL' : 'ACTIVO AL DÍA'}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-700">
                              {new Date(client.fecha_vencimiento).toLocaleDateString('es-BO')}
                            </div>
                            <div className={`text-[11px] font-semibold ${isExpiredClient ? 'text-rose-600' : 'text-slate-500'}`}>
                              {isExpiredClient ? `Expiró hace ${Math.abs(diasRest)} días` : `Quedan ${diasRest} días`}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {/* Botón Renovar +30 Días */}
                              <button
                                type="button"
                                onClick={() => handleExtendSubscription(client.id)}
                                title="Renovar +30 días de suscripción"
                                className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-xl transition flex items-center gap-1 active:scale-95"
                              >
                                <Plus className="w-3 h-3" />
                                <span>+30d</span>
                              </button>

                              {/* Botón WhatsApp / Credenciales */}
                              <button
                                type="button"
                                onClick={() => setCredentialsModalClient(client)}
                                title="Ver credenciales y enviar por WhatsApp"
                                className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 font-bold rounded-xl transition flex items-center gap-1 active:scale-95"
                              >
                                <PhoneCall className="w-3.5 h-3.5" />
                              </button>

                              {/* Cambiar Plan dropdown rápido */}
                              <select
                                value={client.plan_tipo}
                                onChange={(e) => handleChangeClientPlan(client.id, e.target.value)}
                                className="p-1.5 text-[11px] font-bold bg-slate-100 border border-slate-300 rounded-xl focus:outline-none"
                              >
                                <option value="BASICO">Básico (Bs.150)</option>
                                <option value="PROFESIONAL">Pro (Bs.350)</option>
                                <option value="EMPRESARIAL">Empresarial (Bs.700)</option>
                              </select>
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

      {/* ── MODAL: VIDEO TUTORIALES GLORYPOS BOLIVIA ── */}
      {isVideoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-white space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsVideoModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Play className="w-4 h-4 fill-current" />
              </div>
              <div>
                <h3 className="text-base font-bold">Tutoriales del Sistema GLORYPOS</h3>
                <p className="text-xs text-slate-400">Aprende paso a paso con los módulos de entrenamiento rápido.</p>
              </div>
            </div>

            {/* Simulación de Reproductor de Video */}
            <div className="relative aspect-video rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden group">
              <div 
                className="absolute inset-0 bg-cover bg-center opacity-40"
                style={{
                  backgroundImage: `url('https://images.unsplash.com/photo-1556740738-b6a63e27c4df?auto=format&fit=crop&w=800&q=80')`
                }}
              />
              <div className="relative text-center p-4 space-y-2">
                <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center mx-auto shadow-lg group-hover:scale-110 transition">
                  <Play className="w-6 h-6 fill-current translate-x-0.5" />
                </div>
                <h4 className="text-sm font-bold text-white">{tutorialVideos[selectedVideo].title}</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto">{tutorialVideos[selectedVideo].desc}</p>
                <span className="inline-block text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300">
                  Duración: {tutorialVideos[selectedVideo].duration}
                </span>
              </div>
            </div>

            {/* Playlist de Tutoriales */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-2">
              {tutorialVideos.map((vid, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedVideo(idx)}
                  className={`p-2.5 rounded-xl text-left border text-xs transition ${
                    selectedVideo === idx 
                      ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300' 
                      : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:text-white'
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-slate-500 block">
                    {vid.category} • {vid.duration}
                  </span>
                  <p className="font-bold truncate mt-0.5 text-white">{vid.title}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: REGISTRAR NUEVO CLIENTE SAAS ── */}
      {isNewClientModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 text-slate-900 space-y-4 shadow-2xl relative border border-slate-100 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsNewClientModalOpen(false)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 pb-2 border-b border-slate-100">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">Dar de Alta Nuevo Cliente SaaS</h3>
                <p className="text-xs text-slate-500">Configura los datos del negocio y activa su suscripción.</p>
              </div>
            </div>

            <form onSubmit={handleCreateNewClient} className="space-y-3.5 text-xs">
              {/* Nombre de la Empresa */}
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nombre Comercial del Negocio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Minimarket San Lorenzo"
                  value={newClientData.nombre}
                  onChange={e => setNewClientData({ ...newClientData, nombre: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              {/* NIT y Propietario en 2 columnas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIT / CI Fiscal *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. 1029384012"
                    value={newClientData.nit_ci}
                    onChange={e => setNewClientData({ ...newClientData, nit_ci: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Dueño / Contacto</label>
                  <input
                    type="text"
                    placeholder="Ej. Carlos Gutiérrez"
                    value={newClientData.propietario}
                    onChange={e => setNewClientData({ ...newClientData, propietario: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Teléfono y Correo */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">WhatsApp / Teléfono *</label>
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 77012345"
                    value={newClientData.telefono}
                    onChange={e => setNewClientData({ ...newClientData, telefono: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Correo Electrónico</label>
                  <input
                    type="email"
                    placeholder="admin@negocio.bo"
                    value={newClientData.email}
                    onChange={e => setNewClientData({ ...newClientData, email: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Ciudad y Rubro */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Ciudad (Bolivia)</label>
                  <select
                    value={newClientData.ciudad}
                    onChange={e => setNewClientData({ ...newClientData, ciudad: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="Santa Cruz">Santa Cruz</option>
                    <option value="La Paz">La Paz</option>
                    <option value="Cochabamba">Cochabamba</option>
                    <option value="Sucre">Sucre</option>
                    <option value="Tarija">Tarija</option>
                    <option value="Oruro">Oruro</option>
                    <option value="Potosí">Potosí</option>
                    <option value="Beni">Beni</option>
                    <option value="Pando">Pando</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rubro Comercial</label>
                  <select
                    value={newClientData.rubro}
                    onChange={e => setNewClientData({ ...newClientData, rubro: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    <option value="ABARROTES">🏪 Minimarket & Abarrotes</option>
                    <option value="FERRETERIA">🔧 Ferretería & Construcción</option>
                    <option value="FARMACIA">💊 Farmacia & Botica</option>
                    <option value="ROPA">👗 Ropa & Calzado</option>
                    <option value="CARNICERIA">🥩 Carnicería & Frial</option>
                    <option value="HELADERIA">🍦 Heladería & Cafetería</option>
                  </select>
                </div>
              </div>

              {/* Plan y Vigencia Inicial */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3 bg-blue-50/60 rounded-2xl border border-blue-100">
                <div>
                  <label className="block font-bold text-blue-900 mb-1">Plan a Asignar</label>
                  <select
                    value={newClientData.plan_tipo}
                    onChange={e => setNewClientData({ ...newClientData, plan_tipo: e.target.value })}
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl font-bold text-blue-800"
                  >
                    <option value="TRIAL">Prueba Gratuita (30 días)</option>
                    <option value="BASICO">Básico (Bs. 150/mes)</option>
                    <option value="PROFESIONAL">Profesional (Bs. 350/mes)</option>
                    <option value="EMPRESARIAL">Empresarial (Bs. 700/mes)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-blue-900 mb-1">Vigencia Inicial</label>
                  <select
                    value={newClientData.duracion_dias}
                    onChange={e => setNewClientData({ ...newClientData, duracion_dias: Number(e.target.value) })}
                    className="w-full p-2 bg-white border border-blue-200 rounded-xl font-bold text-blue-800"
                  >
                    <option value={30}>30 Días (1 mes)</option>
                    <option value={90}>90 Días (Trimestre)</option>
                    <option value={180}>180 Días (Semestre)</option>
                    <option value={365}>365 Días (1 Año Anual)</option>
                  </select>
                </div>
              </div>

              {/* Botones de Acción */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewClientModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 font-bold rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black rounded-xl shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Activar Suscripción</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: CREDENCIALES & COMPARTIR POR WHATSAPP ── */}
      {credentialsModalClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 text-slate-900 space-y-4 shadow-2xl relative border border-slate-100">
            <button
              onClick={() => setCredentialsModalClient(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-100 transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center space-y-1">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-2">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-black text-slate-900">Suscripción Activa</h3>
              <p className="text-xs text-slate-500 font-medium">
                Credenciales listas para entregar a <strong className="text-slate-800">{credentialsModalClient.nombre}</strong>
              </p>
            </div>

            {/* Tarjeta con los datos de acceso */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 font-bold">
                <span className="text-slate-500">Plan Asignado:</span>
                <span className="text-indigo-700 font-black">{credentialsModalClient.plan_tipo}</span>
              </div>
              <div className="flex justify-between items-center pb-1.5 border-b border-slate-200 font-bold">
                <span className="text-slate-500">Vigencia hasta:</span>
                <span className="text-emerald-700">
                  {new Date(credentialsModalClient.fecha_vencimiento).toLocaleDateString('es-BO')}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Enlace del Sistema:</span>
                <span className="font-mono text-blue-600 font-bold">app.glorypos.bo</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Usuario / Correo:</span>
                <span className="font-mono text-slate-800 font-bold">{credentialsModalClient.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">PIN Táctil Inicial:</span>
                <span className="font-mono text-slate-800 font-black px-2 py-0.5 bg-white border border-slate-200 rounded-md">1234</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Contraseña Admin:</span>
                <span className="font-mono text-slate-800 font-black px-2 py-0.5 bg-white border border-slate-200 rounded-md">admin</span>
              </div>
            </div>

            {/* Botones de Entrega */}
            <div className="space-y-2 pt-1">
              {/* Enviar por WhatsApp con 1 clic */}
              <a
                href={`https://wa.me/591${credentialsModalClient.telefono}?text=${getWhatsAppMessage(credentialsModalClient)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Enviar Credenciales por WhatsApp (+591 {credentialsModalClient.telefono})</span>
              </a>

              {/* Copiar texto al portapapeles */}
              <button
                type="button"
                onClick={() => {
                  const plainMsg = decodeURIComponent(getWhatsAppMessage(credentialsModalClient).replace(/%0A/g, '\n'));
                  navigator.clipboard.writeText(plainMsg);
                  setCopiedToast(true);
                  setTimeout(() => setCopiedToast(false), 2500);
                }}
                className="w-full py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
              >
                {copiedToast ? <Check className="w-4 h-4 text-emerald-600" /> : <FileText className="w-4 h-4 text-slate-500" />}
                <span>{copiedToast ? '¡Copiado al Portapapeles!' : 'Copiar Mensaje Completo'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
