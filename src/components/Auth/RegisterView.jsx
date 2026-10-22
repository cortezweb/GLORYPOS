import React, { useState } from 'react';
import {
  Building2, User, Lock, Mail, Phone, MapPin, ChevronRight,
  ChevronLeft, CheckCircle2, Eye, EyeOff, Store, ArrowLeft, Sparkles, Globe, Wrench, Pill, Shirt, Beef, IceCreamCone, PartyPopper
} from 'lucide-react';
import { db } from '../../db/dexie';
import { hashText } from '../../utils/crypto';
import { useAuth } from '../../context/AuthContext';
import { playCashChime } from '../../utils/audio';
import { tenantService, slugify } from '../../services/tenantService';
import { isDemoMode } from '../../lib/supabase';
import GloryLogo from '../Common/GloryLogo';
import GloryMascota from '../Common/GloryMascota';
import { CURRENCIES, DEFAULT_CURRENCY } from '../../utils/currency';
import { registroNegocioSchema, registroAdminSchema, validar } from '../../lib/schemas';

const RUBROS = [
  { id: 'ABARROTES', label: 'Minimarket / Abarrotes', emoji: Store },
  { id: 'FERRETERIA', label: 'Ferretería / Construcción', emoji: Wrench },
  { id: 'FARMACIA', label: 'Farmacia / Botica', emoji: Pill },
  { id: 'ROPA', label: 'Ropa / Calzado', emoji: Shirt },
  { id: 'CARNICERIA', label: 'Carnicería / Frial', emoji: Beef },
  { id: 'HELADERIA', label: 'Heladería / Cafetería', emoji: IceCreamCone },
];

const CIUDADES = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Beni', 'Pando'];

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function RegisterView({ onGoToLogin }) {
  const { refresh, registerCompanyCloud } = useAuth();
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [confirmEmailMsg, setConfirmEmailMsg] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isManualSlug, setIsManualSlug] = useState(false);

  // Paso 1 — Datos del negocio
  const [negocio, setNegocio] = useState({
    nombre: '',
    slug: '',
    rubro: '',
    nit_ci: '',
    ciudad: 'Santa Cruz',
    moneda: DEFAULT_CURRENCY,
    direccion: '',
    telefono: '',
  });

  // Paso 2 — Cuenta del administrador
  const [admin, setAdmin] = useState({
    nombre: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  // ── Validaciones ────────────────────────────────────────────────────────────
  const validateStep1 = () => {
    const { ok, errors } = validar(registroNegocioSchema, negocio);
    setErrors(errors);
    return ok;
  };

  const validateStep2 = () => {
    const { ok, errors } = validar(registroAdminSchema, admin);
    // Los mensajes del paso 2 usan claves con prefijo en el formulario.
    setErrors({
      adminNombre: errors.nombre,
      adminEmail: errors.email,
      adminPassword: errors.password,
      adminConfirm: errors.confirmPassword,
    });
    return ok;
  };

  const handleNext = () => {
    if (step === 1 && validateStep1()) setStep(2);
    else if (step === 2 && validateStep2()) setStep(3);
  };

  const handleBack = () => {
    setStep(s => s - 1);
    setErrors({});
  };

  // ── Registro final ──────────────────────────────────────────────────────────
  const handleSubmit = async () => {
    setIsSubmitting(true);
    const empresaData = {
      nombre: negocio.nombre.trim(),
      slug: negocio.slug.trim().toLowerCase(),
      nit_ci: negocio.nit_ci.trim(),
      rubro: negocio.rubro,
      ciudad: negocio.ciudad,
      moneda: negocio.moneda,
      direccion: negocio.direccion.trim(),
      telefono: negocio.telefono.trim(),
      email: admin.email.trim().toLowerCase(),
      adminNombre: admin.nombre.trim(),
    };

    // Con Supabase: cuenta en Supabase Auth + empresa creada por el servidor
    if (!isDemoMode) {
      try {
        const res = await registerCompanyCloud({
          empresaData,
          adminNombre: admin.nombre.trim(),
          email: admin.email,
          password: admin.password,
        });
        if (!res.success) {
          setErrors({ submit: res.error || 'Ocurrió un error. Intenta de nuevo.' });
        } else if (res.needsConfirmation) {
          setConfirmEmailMsg(`Te enviamos un correo a ${admin.email.trim().toLowerCase()}. Confírmalo y luego inicia sesión: tu empresa se creará en ese momento.`);
        } else {
          playCashChime();
        }
      } catch (err) {
        console.error('[RegisterView] Error al registrar:', err);
        setErrors({ submit: err.message || 'Ocurrió un error. Intenta de nuevo.' });
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    try {
      // 1. Registrar empresa con slug vía tenantService (modo demo, solo en este navegador)
      const newEmpresa = await tenantService.registerTenant({
        nombre: negocio.nombre.trim(),
        slug: negocio.slug.trim().toLowerCase(),
        nit_ci: negocio.nit_ci.trim(),
        rubro: negocio.rubro,
        ciudad: negocio.ciudad,
        moneda: negocio.moneda,
        direccion: negocio.direccion.trim(),
        telefono: negocio.telefono.trim(),
        email: admin.email.trim().toLowerCase(),
        adminNombre: admin.nombre.trim(),
        plan_tipo: 'TRIAL',
      });

      // 2. Crear usuario administrador con contraseña hasheada
      const adminId = generateId('usr');
      const [hashedPwd, hashedPin] = await Promise.all([
        hashText(admin.password),
        hashText('1234'), // PIN inicial para el admin
      ]);

      const adminUser = {
        id: adminId,
        empresa_id: newEmpresa.id,
        nombre: admin.nombre.trim(),
        email: admin.email.trim().toLowerCase(),
        password: hashedPwd,
        password_hash: hashedPwd,
        pin: hashedPin,
        pin_hash: hashedPin,
        rol: 'ADMIN',
        color: 'from-[#FF6B35] to-[#E85B28]',
        activo: true,
        created_at: new Date().toISOString(),
      };

      // Guardar en Dexie
      await db.usuarios.put(adminUser);

      playCashChime();
      localStorage.setItem('glorypos_user_session', JSON.stringify(adminUser));
      await refresh();
      window.location.reload();
    } catch (err) {
      console.error('[RegisterView] Error al registrar:', err);
      setErrors({ submit: 'Ocurrió un error. Intenta de nuevo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Helper UI ───────────────────────────────────────────────────────────────
  const FieldError = ({ msg }) =>
    msg ? <p className="text-[11px] text-rose-500 font-medium mt-1">{msg}</p> : null;

  const inputClass = (hasError) =>
    `w-full px-3 py-2.5 text-sm rounded-xl border ${hasError ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'} text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6B35]/30 transition`;

  const hayErrores = Object.values(errors).some(Boolean);
  const mascotaMood = hayErrores ? 'preocupado' : isSubmitting ? 'pensando' : step === 3 ? 'celebra' : step === 2 ? 'feliz' : 'saludo';
  const mascotaMensaje = {
    preocupado: 'Revisemos los campos marcados.',
    pensando: 'Creando tu empresa...',
    celebra: '¡Ya casi! Confirma y empezamos a vender.',
    feliz: 'Ahora crea tu cuenta de administrador.',
    saludo: '¡Hola! Vamos a registrar tu negocio.',
  }[mascotaMood];

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#1E2022] via-[#2a2d30] to-[#1E2022] flex flex-col justify-between p-4 sm:p-6 text-slate-100 antialiased select-none">

      {/* Top Bar */}
      <header className="max-w-lg mx-auto w-full flex items-center justify-between pt-2">
        <div className="bg-white/95 rounded-xl px-2.5 py-1">
          <GloryLogo size="sm" subtitleText="Registro SaaS" />
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Ya tengo cuenta
        </button>
      </header>

      {/* Main Card */}
      <main className="max-w-lg mx-auto w-full my-auto py-4">
        {/* Mascota que acompaña cada paso del registro */}
        <div className="flex items-end justify-center gap-3 -mb-6 relative z-10">
          <GloryMascota mood={mascotaMood} size={104} />
          <div key={step} className="mb-10 max-w-[200px] bg-white text-[#1F2128] text-xs font-bold font-brand px-3.5 py-2 rounded-2xl rounded-bl-md shadow-lg gm-burbuja">
            {mascotaMensaje}
          </div>
        </div>
        <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 pt-8 sm:pt-9 shadow-2xl border border-slate-100 space-y-5">

          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition
                  ${step >= s ? 'bg-[#FF6B35] text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded-full transition ${step > s ? 'bg-[#FF6B35]' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── PASO 1: Datos del Negocio ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-[#FF6B35]" /> Datos de tu Negocio
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Paso 1 de 3 — Configura tu empresa</p>
              </div>

              <div className="space-y-3">
                {/* Nombre del negocio */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Nombre del Negocio *</label>
                  <input
                    type="text"
                    placeholder="Ej: Minimarket El Rey"
                    value={negocio.nombre}
                    onChange={e => {
                      const val = e.target.value;
                      setNegocio(p => ({
                        ...p,
                        nombre: val,
                        slug: isManualSlug ? p.slug : slugify(val)
                      }));
                      setErrors(prev => ({ ...prev, nombre: null, slug: null }));
                    }}
                    className={inputClass(errors.nombre)}
                    autoFocus
                  />
                  <FieldError msg={errors.nombre} />
                </div>

                {/* Subdominio / Identificador de la Empresa */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">
                    Subdominio / Identificador de tu Empresa *
                  </label>
                  <div className={`flex items-center rounded-xl border ${errors.slug ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-slate-50'} overflow-hidden focus-within:ring-2 focus-within:ring-[#FF6B35]/30 transition`}>
                    <span className="pl-3 text-slate-400 text-xs font-mono select-none">https://</span>
                    <input
                      type="text"
                      placeholder="minimarket-el-rey"
                      value={negocio.slug}
                      onChange={e => {
                        setIsManualSlug(true);
                        setNegocio(p => ({ ...p, slug: slugify(e.target.value) }));
                        setErrors(prev => ({ ...prev, slug: null }));
                      }}
                      className="w-full px-2 py-2 text-xs bg-transparent text-slate-900 font-mono font-bold focus:outline-none"
                    />
                    <span className="pr-3 text-slate-400 text-xs font-mono select-none">.glorypos.bo</span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">
                    Tu subdominio web único y tu identificador de acceso local en GLORYPOS.
                  </p>
                  <FieldError msg={errors.slug} />
                </div>

                {/* Rubro */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Rubro *</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {RUBROS.map(r => (
                      <button
                        key={r.id}
                        type="button"
                        onClick={() => { setNegocio(p => ({ ...p, rubro: r.id })); setErrors(prev => ({ ...prev, rubro: null })); }}
                        className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-xs font-bold transition
                          ${negocio.rubro === r.id
                            ? 'border-[#FF6B35] bg-[#FF6B35]/10 text-[#FF6B35]'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-[#FF6B35]/10'}`}
                      >
                        <r.emoji size={16} className="shrink-0" /> {r.label}
                      </button>
                    ))}
                  </div>
                  <FieldError msg={errors.rubro} />
                </div>

                {/* NIT/CI y Ciudad en fila */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">NIT / CI *</label>
                    <input
                      type="text"
                      placeholder="Ej: 1234567890"
                      value={negocio.nit_ci}
                      onChange={e => { setNegocio(p => ({ ...p, nit_ci: e.target.value })); setErrors(prev => ({ ...prev, nit_ci: null })); }}
                      className={inputClass(errors.nit_ci)}
                    />
                    <FieldError msg={errors.nit_ci} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Ciudad *</label>
                    <select
                      value={negocio.ciudad}
                      onChange={e => setNegocio(p => ({ ...p, ciudad: e.target.value }))}
                      className={inputClass(false)}
                    >
                      {CIUDADES.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                </div>

                {/* Moneda */}
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Moneda de tu negocio</label>
                  <select
                    value={negocio.moneda}
                    onChange={e => setNegocio(p => ({ ...p, moneda: e.target.value }))}
                    className={inputClass(false)}
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>

                {/* Dirección y Teléfono */}
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Dirección</label>
                    <input
                      type="text"
                      placeholder="Av. Principal 123"
                      value={negocio.direccion}
                      onChange={e => setNegocio(p => ({ ...p, direccion: e.target.value }))}
                      className={inputClass(false)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 block mb-1">Teléfono</label>
                    <input
                      type="tel"
                      placeholder="+591 70000000"
                      value={negocio.telefono}
                      onChange={e => setNegocio(p => ({ ...p, telefono: e.target.value }))}
                      className={inputClass(false)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 2: Cuenta del Admin ──────────────────────────────────── */}
          {step === 2 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-[#FF6B35]" /> Cuenta del Administrador
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Paso 2 de 3 — Tus credenciales de acceso</p>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Tu Nombre Completo *</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan Pérez"
                    value={admin.nombre}
                    onChange={e => { setAdmin(p => ({ ...p, nombre: e.target.value })); setErrors(prev => ({ ...prev, adminNombre: null })); }}
                    className={inputClass(errors.adminNombre)}
                    autoFocus
                  />
                  <FieldError msg={errors.adminNombre} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    placeholder="admin@tunegocio.com"
                    value={admin.email}
                    onChange={e => { setAdmin(p => ({ ...p, email: e.target.value })); setErrors(prev => ({ ...prev, adminEmail: null })); }}
                    className={inputClass(errors.adminEmail)}
                  />
                  <FieldError msg={errors.adminEmail} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Contraseña *</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Mínimo 6 caracteres"
                      value={admin.password}
                      onChange={e => { setAdmin(p => ({ ...p, password: e.target.value })); setErrors(prev => ({ ...prev, adminPassword: null })); }}
                      className={inputClass(errors.adminPassword) + ' pr-10'}
                    />
                    <button type="button" onClick={() => setShowPassword(s => !s)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <FieldError msg={errors.adminPassword} />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-600 block mb-1">Confirmar Contraseña *</label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Repite tu contraseña"
                    value={admin.confirmPassword}
                    onChange={e => { setAdmin(p => ({ ...p, confirmPassword: e.target.value })); setErrors(prev => ({ ...prev, adminConfirm: null })); }}
                    className={inputClass(errors.adminConfirm)}
                  />
                  <FieldError msg={errors.adminConfirm} />
                </div>

                <div className="bg-[#FF6B35]/10 border border-blue-100 rounded-xl p-3 text-xs text-[#FF6B35]">
                  <p className="font-bold flex items-center gap-1"><Lock size={13} /> Tu PIN táctil inicial será: <span className="font-mono text-blue-900">1234</span></p>
                  <p className="text-[#FF6B35] mt-0.5">Puedes cambiarlo después desde Administración → Usuarios.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Confirmación ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-[#FF6B35]" /> ¡Todo listo!
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">Paso 3 de 3 — Confirma tu registro</p>
              </div>

              {/* Resumen */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 text-sm">
                <div className="flex justify-between items-start">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Negocio</span>
                </div>
                <div className="space-y-1.5">
                  <div className="flex justify-between"><span className="text-slate-500">Nombre:</span> <span className="font-bold text-slate-800">{negocio.nombre}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Rubro:</span> <span className="font-bold text-slate-800">{RUBROS.find(r => r.id === negocio.rubro)?.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">NIT/CI:</span> <span className="font-bold text-slate-800">{negocio.nit_ci}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Ciudad:</span> <span className="font-bold text-slate-800">{negocio.ciudad}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Moneda:</span> <span className="font-bold text-slate-800">{CURRENCIES.find(c => c.code === negocio.moneda)?.label}</span></div>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between"><span className="text-slate-500">Administrador:</span> <span className="font-bold text-slate-800">{admin.nombre}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Correo:</span> <span className="font-bold text-slate-800 text-xs">{admin.email}</span></div>
              </div>

              {/* Trial info */}
              <div className="bg-[#FF6B35]/10 border border-[#FF6B35]/20 rounded-2xl px-4 py-3">
                <p className="text-sm font-black text-[#E85B28] flex items-center justify-center gap-1.5"><PartyPopper size={16} /> Trial gratuito de 30 días activado</p>
                <p className="text-xs text-[#FF6B35] mt-0.5">Acceso completo a todos los módulos sin costo. Luego elige tu plan.</p>
              </div>

              {confirmEmailMsg && (
                <p className="text-xs text-emerald-700 font-bold text-center">{confirmEmailMsg}</p>
              )}
              {errors.submit && (
                <p className="text-xs text-rose-600 font-bold text-center">{errors.submit}</p>
              )}
            </div>
          )}

          {/* ── Botones de Navegación ──────────────────────────────────────── */}
          <div className="flex gap-2 pt-1">
            {step > 1 && (
              <button
                type="button"
                onClick={handleBack}
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-2xl border border-slate-200 text-sm font-bold text-slate-600 hover:bg-slate-50 transition disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" /> Atrás
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={handleNext}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-[#FF6B35] hover:bg-[#ea580c] active:bg-[#c2410c] text-white text-sm font-black transition shadow-md shadow-orange-500/25"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting || Boolean(confirmEmailMsg)}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-[#00B574] hover:bg-[#009c63] active:bg-[#E85B28] text-white text-sm font-black transition disabled:opacity-60 shadow-md shadow-[#FF6B35]/30"
              >
                {isSubmitting ? (
                  <><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Registrando...</>
                ) : (
                  <><CheckCircle2 className="w-4 h-4" /> Activar Trial Gratis</>
                )}
              </button>
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-lg mx-auto w-full text-center pb-2">
        <p className="text-[11px] text-slate-500">
          Al registrarte aceptas los términos de uso de GLORYPOS BOLIVIA.
        </p>
      </footer>
    </div>
  );
}






