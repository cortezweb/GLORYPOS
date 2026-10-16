import React, { useState, useEffect, useRef } from 'react';
import { 
  Lock, KeyRound, Mail, ShieldCheck, UserCheck, Delete, 
  ArrowRight, Building2, Store, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff,
  Clock, UserPlus, Globe, Check, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playCashChime, playErrorBeep } from '../../utils/audio';
import GloryLogo from '../Common/GloryLogo';

export default function LoginView({ onGoToRegister }) {
  const { 
    empresa, 
    tenantSlug, 
    tenantError, 
    isLocalDev, 
    detectedSubdomain, 
    usuarios, 
    switchTenant, 
    loginWithPin, 
    loginWithCredentials,
    signUpInvited,
    unlinkDevice,
    deviceLinked,
    isDemoMode
  } = useAuth();

  // Modo de acceso: 'credentials' (SaaS estándar) o 'pin' (Cajero rápido)
  const [mode, setMode] = useState('credentials');
  const [companyIdInput, setCompanyIdInput] = useState(tenantSlug || 'admin');
  const [isApplyingTenant, setIsApplyingTenant] = useState(false);
  const [tenantSuccessMsg, setTenantSuccessMsg] = useState(null);

  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isErrorShaking, setIsErrorShaking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Rate limiting: bloqueo tras 5 intentos fallidos consecutivos
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [lockoutSeconds, setLockoutSeconds] = useState(0);
  const lockoutTimerRef = useRef(null);

  // Formulario por credenciales
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  // Persona invitada a la empresa que aún no tiene su acceso creado
  const [inviteMode, setInviteMode] = useState(false);
  const [infoMsg, setInfoMsg] = useState(null);

  // Sincronizar input de empresa con el slug activo
  useEffect(() => {
    if (tenantSlug) {
      setCompanyIdInput(tenantSlug);
    }
  }, [tenantSlug]);

  // Inicializar con el primer usuario de la lista si hay usuarios
  useEffect(() => {
    if (usuarios && usuarios.length > 0) {
      if (!selectedUser || !usuarios.some(u => u.id === selectedUser.id)) {
        setSelectedUser(usuarios[0]);
      }
    } else {
      setSelectedUser(null);
    }
  }, [usuarios, selectedUser]);

  // Countdown del bloqueo
  useEffect(() => {
    if (lockoutUntil) {
      const tick = () => {
        const remaining = Math.ceil((lockoutUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockoutUntil(null);
          setLockoutSeconds(0);
          setFailedAttempts(0);
          setErrorMsg(null);
          clearInterval(lockoutTimerRef.current);
        } else {
          setLockoutSeconds(remaining);
        }
      };
      tick();
      lockoutTimerRef.current = setInterval(tick, 1000);
    }
    return () => clearInterval(lockoutTimerRef.current);
  }, [lockoutUntil]);

  const isLocked = lockoutUntil && Date.now() < lockoutUntil;

  // Listener para teclado físico en modo PIN
  useEffect(() => {
    if (mode !== 'pin' || isLocked) return;
    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape' || e.key === 'Delete') {
        e.preventDefault();
        setPin('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mode, pin, selectedUser, isLocked]);

  const registerFailedAttempt = () => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= 5) {
      const until = Date.now() + 30_000;
      setLockoutUntil(until);
      setErrorMsg('Demasiados intentos fallidos. Espera 30 segundos.');
    }
  };

  const triggerError = (msg) => {
    setErrorMsg(msg);
    setIsErrorShaking(true);
    playErrorBeep();
    setTimeout(() => {
      setIsErrorShaking(false);
      setPin('');
    }, 600);
  };

  // Manejador para cambiar de tenant en local
  const handleApplyCompanyId = async (e) => {
    if (e) e.preventDefault();
    const clean = companyIdInput.trim().toLowerCase();
    if (!clean || clean === tenantSlug) return;

    setIsApplyingTenant(true);
    setTenantSuccessMsg(null);
    setErrorMsg(null);

    const res = await switchTenant(clean);
    setIsApplyingTenant(false);

    if (res.success) {
      setTenantSuccessMsg(`Empresa "${res.empresa.nombre}" cargada correctamente`);
      setTimeout(() => setTenantSuccessMsg(null), 3000);
    } else {
      triggerError(res.error || 'No se encontró la empresa');
    }
  };

  const handleDigit = async (digit) => {
    if (pin.length >= 4 || isLoggingIn || isLocked) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg(null);

    if (newPin.length === 4) {
      setIsLoggingIn(true);
      setTimeout(async () => {
        const res = await loginWithPin(newPin, selectedUser?.id);
        if (res.success) {
          playCashChime();
        } else {
          registerFailedAttempt();
          triggerError(res.error || 'PIN incorrecto');
        }
        setIsLoggingIn(false);
      }, 150);
    }
  };

  const handleBackspace = () => {
    if (pin.length > 0) {
      setPin(pin.slice(0, -1));
      setErrorMsg(null);
    }
  };

  const handleCredentialsSubmit = async (e) => {
    e.preventDefault();
    if (isLocked) return;

    // Si el usuario modificó el identificador de empresa pero no dio enter, aplicarlo primero
    if (isLocalDev && companyIdInput.trim() !== tenantSlug) {
      const switchRes = await switchTenant(companyIdInput.trim());
      if (!switchRes.success) {
        triggerError(switchRes.error || 'Empresa no encontrada');
        return;
      }
    }

    setIsLoggingIn(true);
    setErrorMsg(null);
    setInfoMsg(null);

    const res = inviteMode
      ? await signUpInvited(identifier, password)
      : await loginWithCredentials(identifier, password);
    if (res.success && res.needsConfirmation) {
      setInfoMsg('Te enviamos un correo. Confírmalo y luego inicia sesión aquí.');
      setInviteMode(false);
    } else if (res.success) {
      playCashChime();
    } else {
      registerFailedAttempt();
      triggerError(res.error || 'Credenciales inválidas');
    }
    setIsLoggingIn(false);
  };

  // Demo rápido (1-clic)
  const handleFastDemoLogin = async (usr) => {
    if (isLocked) return;
    setSelectedUser(usr);
    setIsLoggingIn(true);
    const demoPins = { 'usr-admin': '1234', 'usr-carlos': '0000', 'usr-maria': '4321' };
    const rawPin = demoPins[usr.id] || '1234';
    setPin(rawPin);
    setTimeout(async () => {
      const res = await loginWithPin(rawPin, usr.id);
      if (res.success) {
        playCashChime();
      }
      setIsLoggingIn(false);
    }, 200);
  };

  return (
    <div className="min-h-screen w-full bg-[#FDFBF7] flex flex-col justify-between p-4 sm:p-6 text-[#1E2022] antialiased select-none font-sans">
      
      {/* Top Bar Branding */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2.5">
          <GloryLogo size="sm" showSubtitle={false} />
          <div className="border-l border-slate-200 pl-2">
            <p className="text-[11px] text-slate-500 font-semibold truncate max-w-[180px]">
              {empresa?.nombre || 'GLORYPOS BOLIVIA S.R.L.'}
            </p>
          </div>
        </div>

        {/* Indicador de Subdominio o Modo Local */}
        {detectedSubdomain ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-bold rounded-full bg-[#FF6B35]/10 text-[#00B574] border border-[#FF6B35]/20">
            <Globe className="w-3.5 h-3.5 text-[#00B574]" />
            <span className="font-mono">{detectedSubdomain}</span>
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold rounded-full bg-amber-50 text-[#FFB627] border border-amber-200 font-mono">
            <span className="w-2 h-2 rounded-full bg-[#FFB627] animate-pulse"></span>
            MODO LOCAL
          </span>
        )}
      </header>

      {/* Main Login Card (GLORYPOS SaaS) */}
      <main className="max-w-md mx-auto w-full my-auto py-6">
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl shadow-slate-200/60 border border-slate-200/80 flex flex-col space-y-5">
          
          {/* Logo Central GLORYPOS */}
          <div className="flex flex-col items-center space-y-2 text-center">
            <GloryLogo size="xl" className="items-center" subtitleText="Cloud System" />
            <p className="text-xs text-slate-500 mt-0.5">
              {empresa?.nombre ? `Acceso a ${empresa.nombre}` : 'Inicia sesión en tu espacio de trabajo'}
            </p>
          </div>

          {/* Banner de Bloqueo por Intentos */}
          {isLocked && (
            <div className="flex items-center gap-3 bg-rose-50 border border-rose-200 rounded-2xl px-4 py-3">
              <Clock className="w-5 h-5 text-rose-500 shrink-0 animate-pulse" />
              <div>
                <p className="text-xs font-black text-rose-700">Acceso bloqueado temporalmente</p>
                <p className="text-[11px] text-rose-500">
                  Demasiados intentos fallidos. Espera <span className="font-bold">{lockoutSeconds}s</span>
                </p>
              </div>
            </div>
          )}

          {/* Toggle Modo: Correo & Clave vs PIN Rápido (POS) */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('credentials'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                mode === 'credentials'
                  ? 'bg-white text-[#FF6B35] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Correo & Clave</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('pin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                mode === 'pin'
                  ? 'bg-white text-[#FF6B35] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Cajero (Táctil)</span>
            </button>
          </div>

          {/* Feedback de cambio de empresa */}
          {tenantSuccessMsg && (
            <div className="p-2.5 bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#1E2022] text-xs rounded-xl flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-[#FF6B35] shrink-0" />
              <span>{tenantSuccessMsg}</span>
            </div>
          )}

          {tenantError && (
            <div className="p-2.5 bg-amber-50 border border-amber-200 text-amber-800 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{tenantError}</span>
            </div>
          )}

          {/* ======================================================== */}
          {/* MODO 1: CREDENCIALES EMPRESA                            */}
          {/* ======================================================== */}
          {mode === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3.5">
              
              {/* CAMPO 1: IDENTIFICADOR DE EMPRESA */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Identificador de empresa
                </label>
                
                {/* En producción web con subdominio fijo */}
                {detectedSubdomain ? (
                  <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs">
                    <div className="flex items-center gap-2">
                      <Store className="w-4 h-4 text-[#FF6B35]" />
                      <span className="font-mono font-bold text-slate-900">{detectedSubdomain}</span>
                    </div>
                    <span className="text-[10px] text-[#FF6B35] font-bold bg-[#FF6B35]/10 px-2 py-0.5 rounded-full border border-blue-200">
                      Subdominio Verificado
                    </span>
                  </div>
                ) : (
                  /* En desarrollo local: Campo editable */
                  <div>
                    <div className="relative flex items-center">
                      <Store className="w-4 h-4 text-slate-400 absolute left-3" />
                      <input
                        type="text"
                        required
                        value={companyIdInput}
                        onChange={(e) => setCompanyIdInput(e.target.value.toLowerCase())}
                        onBlur={handleApplyCompanyId}
                        placeholder="admin"
                        className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyCompanyId}
                        title="Cargar empresa"
                        disabled={isApplyingTenant}
                        className="absolute right-2 p-1.5 text-slate-400 hover:text-[#FF6B35] rounded-lg hover:bg-slate-100 transition"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isApplyingTenant ? 'animate-spin text-[#FF6B35]' : ''}`} />
                      </button>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1.5 leading-tight">
                      Solo en desarrollo local; en producción web usa el subdominio de tu empresa.
                    </p>
                  </div>
                )}
              </div>

              {/* CAMPO 2: CORREO O USUARIO */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Correo Electrónico o Usuario
                </label>
                <div className="relative flex items-center">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@glorypos.com"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {/* CAMPO 3: CONTRASEÑA */}
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Contraseña
                </label>
                <div className="relative flex items-center">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(prev => !prev)}
                    className="absolute right-2 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl flex items-center gap-1.5 font-medium">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* BOTÓN INGRESAR */}
              <button
                type="submit"
                disabled={isLoggingIn || isLocked}
                className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#ea580c] hover:from-[#ea580c] hover:to-[#c2410c] active:from-[#c2410c] active:to-[#9a3412] text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-500/25 transition active:scale-98 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <span>{isLoggingIn ? 'Iniciando sesión...' : inviteMode ? 'Crear mi acceso' : 'Ingresar'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {infoMsg && (
                <p className="text-[11px] text-emerald-700 font-bold text-center">{infoMsg}</p>
              )}

              {!isDemoMode && (
                <button
                  type="button"
                  onClick={() => { setInviteMode(v => !v); setErrorMsg(null); setInfoMsg(null); }}
                  className="w-full text-center text-[11px] font-bold text-slate-500 hover:text-[#FF6B35] transition"
                >
                  {inviteMode ? 'Ya tengo acceso, quiero ingresar' : '¿Te invitaron a esta empresa? Crea tu acceso'}
                </button>
              )}
            </form>
          )}

          {/* ======================================================== */}
          {/* MODO 2: PIN TÁCTIL RÁPIDO PARA PUNTO DE VENTA           */}
          {/* ======================================================== */}
          {mode === 'pin' && (
            <div className="space-y-4">
              {/* Selector de Cajero Activo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Cajeros de {empresa?.nombre || 'la Empresa'}:
                </span>
                
                {usuarios.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {usuarios.map((usr) => {
                      const isSelected = selectedUser?.id === usr.id;
                      return (
                        <button
                          key={usr.id}
                          type="button"
                          onClick={() => {
                            setSelectedUser(usr);
                            setPin('');
                            setErrorMsg(null);
                          }}
                          className={`p-2 rounded-2xl border flex flex-col items-center gap-1 transition-all ${
                            isSelected
                              ? 'border-[#FF6B35] bg-[#FF6B35]/10/70 ring-2 ring-[#FF6B35]/30'
                              : 'border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${usr.color || 'from-[#FF6B35] to-[#E85B28]'} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                            {usr.nombre.charAt(0)}
                          </div>
                          <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center leading-tight">
                            {usr.nombre.split(' ')[0]}
                          </span>
                          <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                            usr.rol === 'ADMIN'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-[#FF6B35]/20 text-[#E85B28]'
                          }`}>
                            {usr.rol}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-4 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-500">
                    No hay cajeros registrados en este tenant. Usa el login por correo y contraseña.
                  </div>
                )}
              </div>

              {/* Indicador de 4 dígitos */}
              <div className="flex flex-col items-center space-y-2 py-1">
                <div className={`flex items-center gap-3.5 ${isErrorShaking ? 'animate-bounce' : ''}`}>
                  {[0, 1, 2, 3].map((idx) => {
                    const isFilled = pin.length > idx;
                    return (
                      <div
                        key={idx}
                        className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                          isFilled
                            ? 'bg-[#FF6B35] border-[#FF6B35] scale-110 shadow-sm shadow-orange-500/40'
                            : 'border-slate-300 bg-slate-100'
                        }`}
                      />
                    );
                  })}
                </div>

                {errorMsg ? (
                  <span className="text-xs font-bold text-rose-600 flex items-center gap-1 animate-fadeIn">
                    <AlertCircle className="w-3.5 h-3.5" />
                    {errorMsg}
                  </span>
                ) : (
                  <span className="text-[11px] text-slate-400 font-medium">
                    {selectedUser ? `PIN para ${selectedUser.nombre}` : 'Digita los 4 números'}
                  </span>
                )}
              </div>

              {/* Teclado Numérico Táctil */}
              <div className="grid grid-cols-3 gap-2 max-w-[280px] mx-auto">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
                  <button
                    key={digit}
                    type="button"
                    onClick={() => handleDigit(digit)}
                    disabled={isLoggingIn}
                    className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-orange-50 active:text-[#FF6B35] border border-slate-200 font-extrabold text-lg text-[#1E2022] transition active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                  >
                    {digit}
                  </button>
                ))}
                
                <button
                  type="button"
                  onClick={() => { setPin(''); setErrorMsg(null); }}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 font-bold text-xs text-slate-500 transition active:scale-95 flex items-center justify-center"
                >
                  C
                </button>

                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  disabled={isLoggingIn}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-orange-50 active:text-[#FF6B35] border border-slate-200 font-extrabold text-lg text-[#1E2022] transition active:scale-95 flex items-center justify-center shadow-2xs cursor-pointer"
                >
                  0
                </button>

                <button
                  type="button"
                  onClick={handleBackspace}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-slate-200 active:bg-slate-300 border border-slate-200 text-slate-600 transition active:scale-95 flex items-center justify-center"
                  title="Borrar último"
                >
                  <Delete className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Accesos rápidos de prueba (1-clic) */}
          {isDemoMode && usuarios.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                Acceso Rápido de Prueba:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px]">
                {usuarios.slice(0, 2).map((usr) => {
                  const demoPins = { 'usr-admin': '1234', 'usr-carlos': '0000', 'usr-maria': '4321' };
                  const rawPin = demoPins[usr.id] || '1234';
                  return (
                    <button
                      key={usr.id}
                      type="button"
                      onClick={() => handleFastDemoLogin(usr)}
                      disabled={isLocked}
                      className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-orange-50 text-slate-700 hover:text-[#FF6B35] font-bold border border-slate-200 flex items-center justify-center gap-1 transition"
                    >
                      <span>{usr.rol === 'ADMIN' ? '👑' : '🛒'}</span>
                      <span>{usr.nombre.split(' ')[0]}</span>
                      <span className="text-[9px] text-slate-400 font-mono">[{rawPin}]</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer: "GLORYPOS SaaS @ 2026" */}
      <footer className="max-w-md mx-auto w-full text-center space-y-2 pb-2">
        {onGoToRegister && (
          <button
            type="button"
            onClick={onGoToRegister}
            className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#FF6B35] hover:text-[#ea580c] transition cursor-pointer"
          >
            <UserPlus className="w-3.5 h-3.5" />
            ¿Quieres registrar una nueva empresa? Haz clic aquí →
          </button>
        )}
        {!isDemoMode && deviceLinked && (
          <button
            type="button"
            onClick={unlinkDevice}
            className="block mx-auto text-[11px] font-bold text-slate-400 hover:text-rose-600 transition cursor-pointer"
          >
            Desvincular este dispositivo
          </button>
        )}
        <p className="text-[11px] text-slate-400 font-medium">
          GLORYPOS SaaS @ 2026
        </p>
      </footer>
    </div>
  );
}




