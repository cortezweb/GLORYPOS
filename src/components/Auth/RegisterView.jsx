import React, { useState } from 'react';
import {
  Building2, User, Lock, Mail, Phone, MapPin, ChevronRight,
  ChevronLeft, CheckCircle2, Eye, EyeOff, Store, ArrowLeft, Sparkles
} from 'lucide-react';
import { db } from '../../db/dexie';
import { hashText } from '../../utils/crypto';
import { useAuth } from '../../context/AuthContext';
import { playCashChime } from '../../utils/audio';

const RUBROS = [
  { id: 'ABARROTES', label: 'Minimarket / Abarrotes', emoji: '🏪' },
  { id: 'FERRETERIA', label: 'Ferretería / Construcción', emoji: '🔧' },
  { id: 'FARMACIA', label: 'Farmacia / Botica', emoji: '💊' },
  { id: 'ROPA', label: 'Ropa / Calzado', emoji: '👗' },
  { id: 'CARNICERIA', label: 'Carnicería / Frial', emoji: '🥩' },
  { id: 'HELADERIA', label: 'Heladería / Cafetería', emoji: '🍦' },
];

const CIUDADES = ['Santa Cruz', 'La Paz', 'Cochabamba', 'Sucre', 'Oruro', 'Potosí', 'Tarija', 'Beni', 'Pando'];

function generateId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export default function RegisterView({ onGoToLogin }) {
  const { refresh } = useAuth();
  const [step, setStep] = useState(1); // 1 | 2 | 3
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});

  // Paso 1 — Datos del negocio
  const [negocio, setNegocio] = useState({
    nombre: '',
    rubro: '',
    nit_ci: '',
    ciudad: 'Santa Cruz',
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
    const e = {};
    if (!negocio.nombre.trim()) e.nombre = 'El nombre del negocio es requerido';
    if (!negocio.rubro) e.rubro = 'Selecciona el rubro';
    if (!negocio.nit_ci.trim()) e.nit_ci = 'El NIT/CI es requerido';
    if (!negocio.ciudad) e.ciudad = 'Selecciona la ciudad';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const validateStep2 = () => {
    const e = {};
    if (!admin.nombre.trim()) e.adminNombre = 'El nombre es requerido';
    if (!admin.email.trim() || !/^[^@]+@[^@]+\.[^@]+$/.test(admin.email))
      e.adminEmail = 'Correo electrónico inválido';
    if (!admin.password || admin.password.length < 6)
      e.adminPassword = 'La contraseña debe tener al menos 6 caracteres';
    if (admin.password !== admin.confirmPassword)
      e.adminConfirm = 'Las contraseñas no coinciden';
    setErrors(e);
    return Object.keys(e).length === 0;
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
    try {
      const empresaId = 'empresa_activa'; // Single-tenant por dispositivo
      const ahora = new Date();
      const vencimiento = new Date();
      vencimiento.setDate(ahora.getDate() + 30);

      // Guardar empresa en Dexie
      await db.config_empresa.put({
        id: empresaId,
        nombre: negocio.nombre.trim(),
        nit_ci: negocio.nit_ci.trim(),
        rubro: negocio.rubro,
        ciudad: negocio.ciudad,
        direccion: negocio.direccion.trim(),
        telefono: negocio.telefono.trim(),
        propietario: admin.nombre.trim(),
        plan_tipo: 'TRIAL',
        estado_suscripcion: 'ACTIVO',
        fecha_inicio: ahora.toISOString(),
        fecha_vencimiento: vencimiento.toISOString(),
        dias_prueba: 30,
        created_at: ahora.toISOString(),
      });

      // Crear usuario administrador con contraseña hasheada
      const adminId = generateId('usr');
      const [hashedPwd, hashedPin] = await Promise.all([
        hashText(admin.password),
        hashText('1234'), // PIN inicial para el admin
      ]);

      await db.usuarios.put({
        id: adminId,
        nombre: admin.nombre.trim(),
        email: admin.email.trim().toLowerCase(),
        password: hashedPwd,
        pin: hashedPin,
        rol: 'ADMIN',
        color: 'from-blue-600 to-indigo-600',
        activo: true,
        created_at: ahora.toISOString(),
      });

      playCashChime();
      // Refrescar AuthContext para que cargue la empresa y redirigir al login
      await refresh();
      // Guardar sesión automáticamente después de registrarse
      const newUser = await db.usuarios.get(adminId);
      if (newUser) {
        localStorage.setItem('glorypos_user_session', JSON.stringify(newUser));
      }
      window.location.reload(); // Recarga limpia para que AuthProvider reinicie con la nueva empresa
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
    `w-full px-3 py-2.5 text-sm rounded-xl border ${hasError ? 'border-rose-400 bg-rose-50' : 'border-slate-200 bg-white'} text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition`;

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 antialiased select-none">

      {/* Top Bar */}
      <header className="max-w-lg mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-[#712ae2] flex items-center justify-center font-black text-white text-base shadow-md">
            GP
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-white">
              GLORY<span className="text-violet-400">POS</span>
            </span>
            <p className="text-[10px] text-slate-400 font-medium">Registro de Negocio</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onGoToLogin}
          className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Ya tengo cuenta
        </button>
      </header>

      {/* Main Card */}
      <main className="max-w-lg mx-auto w-full my-auto py-4">
        <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 space-y-5">

          {/* Progress Steps */}
          <div className="flex items-center gap-1">
            {[1, 2, 3].map((s) => (
              <React.Fragment key={s}>
                <div className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-black transition
                  ${step >= s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                  {step > s ? <CheckCircle2 className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`flex-1 h-1 rounded-full transition ${step > s ? 'bg-blue-600' : 'bg-slate-100'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── PASO 1: Datos del Negocio ─────────────────────────────────── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Building2 className="w-5 h-5 text-blue-600" /> Datos de tu Negocio
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
                    onChange={e => { setNegocio(p => ({ ...p, nombre: e.target.value })); setErrors(prev => ({ ...prev, nombre: null })); }}
                    className={inputClass(errors.nombre)}
                    autoFocus
                  />
                  <FieldError msg={errors.nombre} />
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
                            ? 'border-blue-500 bg-blue-50 text-blue-700'
                            : 'border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-blue-50/50'}`}
                      >
                        <span>{r.emoji}</span> {r.label}
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
                  <User className="w-5 h-5 text-blue-600" /> Cuenta del Administrador
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

                <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 text-xs text-blue-700">
                  <p className="font-bold">🔒 Tu PIN táctil inicial será: <span className="font-mono text-blue-900">1234</span></p>
                  <p className="text-blue-500 mt-0.5">Puedes cambiarlo después desde Administración → Usuarios.</p>
                </div>
              </div>
            </div>
          )}

          {/* ── PASO 3: Confirmación ──────────────────────────────────────── */}
          {step === 3 && (
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-emerald-500" /> ¡Todo listo!
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
                  <div className="flex justify-between"><span className="text-slate-500">Rubro:</span> <span className="font-bold text-slate-800">{RUBROS.find(r => r.id === negocio.rubro)?.emoji} {RUBROS.find(r => r.id === negocio.rubro)?.label}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">NIT/CI:</span> <span className="font-bold text-slate-800">{negocio.nit_ci}</span></div>
                  <div className="flex justify-between"><span className="text-slate-500">Ciudad:</span> <span className="font-bold text-slate-800">{negocio.ciudad}</span></div>
                </div>
                <hr className="border-slate-200" />
                <div className="flex justify-between"><span className="text-slate-500">Administrador:</span> <span className="font-bold text-slate-800">{admin.nombre}</span></div>
                <div className="flex justify-between"><span className="text-slate-500">Correo:</span> <span className="font-bold text-slate-800 text-xs">{admin.email}</span></div>
              </div>

              {/* Trial info */}
              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl px-4 py-3">
                <p className="text-sm font-black text-emerald-700">🎉 Trial gratuito de 30 días activado</p>
                <p className="text-xs text-emerald-600 mt-0.5">Acceso completo a todos los módulos sin costo. Luego elige tu plan.</p>
              </div>

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
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-black transition"
              >
                Siguiente <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-black transition disabled:opacity-60"
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
