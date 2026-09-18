import React, { useState, useEffect } from 'react';
import { 
  Lock, KeyRound, Mail, ShieldCheck, UserCheck, Delete, 
  ArrowRight, Store, Sparkles, CheckCircle2, AlertCircle, Eye, EyeOff 
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { playCashChime, playErrorBeep } from '../../utils/audio';

export default function LoginView() {
  const { empresa, usuarios, loginWithPin, loginWithCredentials } = useAuth();

  const [mode, setMode] = useState('pin'); // 'pin' | 'credentials'
  const [selectedUser, setSelectedUser] = useState(null);
  const [pin, setPin] = useState('');
  const [errorMsg, setErrorMsg] = useState(null);
  const [isErrorShaking, setIsErrorShaking] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Formulario por credenciales
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Inicializar con el primer usuario de la lista (por defecto Administrador o Carlos)
  useEffect(() => {
    if (usuarios && usuarios.length > 0 && !selectedUser) {
      setSelectedUser(usuarios[0]);
    }
  }, [usuarios]);

  // Listener para teclado físico en modo PIN
  useEffect(() => {
    if (mode !== 'pin') return;

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
  }, [mode, pin, selectedUser]);

  const triggerError = (msg) => {
    setErrorMsg(msg);
    setIsErrorShaking(true);
    playErrorBeep();
    setTimeout(() => {
      setIsErrorShaking(false);
      setPin('');
    }, 600);
  };

  const handleDigit = async (digit) => {
    if (pin.length >= 4 || isLoggingIn) return;
    const newPin = pin + digit;
    setPin(newPin);
    setErrorMsg(null);

    // Auto-validar al completar 4 dígitos
    if (newPin.length === 4) {
      setIsLoggingIn(true);
      setTimeout(async () => {
        const res = await loginWithPin(newPin, selectedUser?.id);
        if (res.success) {
          playCashChime();
        } else {
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
    setIsLoggingIn(true);
    setErrorMsg(null);

    const res = await loginWithCredentials(identifier, password);
    if (res.success) {
      playCashChime();
    } else {
      triggerError(res.error || 'Credenciales inválidas');
    }
    setIsLoggingIn(false);
  };

  const handleFastDemoLogin = async (usr) => {
    setSelectedUser(usr);
    setPin(usr.pin);
    setIsLoggingIn(true);
    setTimeout(async () => {
      const res = await loginWithPin(usr.pin, usr.id);
      if (res.success) {
        playCashChime();
      }
      setIsLoggingIn(false);
    }, 200);
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 flex flex-col justify-between p-4 sm:p-6 text-slate-100 antialiased select-none">
      {/* Top Bar Branding */}
      <header className="max-w-md mx-auto w-full flex items-center justify-between pt-2">
        <div className="flex items-center space-x-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-[#712ae2] flex items-center justify-center font-black text-white text-base shadow-md shadow-indigo-500/20">
            GP
          </div>
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="text-lg font-black tracking-tight text-white">
                GLORY<span className="text-violet-400">POS</span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-violet-400"></span>
              <span className="text-[10px] font-extrabold uppercase px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                BOLIVIA
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px]">
              {empresa?.nombre || 'GLORYPOS BOLIVIA S.R.L.'}
            </p>
          </div>
        </div>

        <span className="inline-flex items-center px-2 py-0.5 text-[10px] font-bold rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-1.5 animate-pulse"></span>
          SIAT ON
        </span>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md mx-auto w-full my-auto py-4">
        <div className="bg-white text-slate-900 rounded-3xl p-5 sm:p-7 shadow-2xl border border-slate-100 flex flex-col space-y-4">
          {/* Header Title */}
          <div className="text-center space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900">
              Control de Acceso
            </h1>
            <p className="text-xs text-slate-500">
              Ingresa tu PIN de 4 dígitos o credenciales de cajero
            </p>
          </div>

          {/* Toggle Modo: PIN vs Correo */}
          <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs font-bold">
            <button
              type="button"
              onClick={() => { setMode('pin'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                mode === 'pin'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PIN Rápido (Táctil)</span>
            </button>
            <button
              type="button"
              onClick={() => { setMode('credentials'); setErrorMsg(null); }}
              className={`flex-1 py-2 rounded-xl text-center transition flex items-center justify-center gap-1.5 ${
                mode === 'credentials'
                  ? 'bg-white text-blue-600 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Correo & Clave</span>
            </button>
          </div>

          {/* ======================================================== */}
          {/* MODO 1: PIN TÁCTIL (PREFERIDO PARA TIENDAS Y CAJEROS) */}
          {/* ======================================================== */}
          {mode === 'pin' && (
            <div className="space-y-4">
              {/* Selector de Cajero Activo */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
                  Selecciona tu usuario:
                </span>
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
                            ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-500/30'
                            : 'border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-full bg-gradient-to-tr ${usr.color || 'from-blue-600 to-indigo-600'} text-white font-bold text-xs flex items-center justify-center shadow-xs`}>
                          {usr.nombre.charAt(0)}
                        </div>
                        <span className="text-[11px] font-bold text-slate-800 truncate w-full text-center leading-tight">
                          {usr.nombre.split(' ')[0]}
                        </span>
                        <span className={`text-[8px] font-extrabold uppercase px-1.5 py-0.2 rounded-full ${
                          usr.rol === 'ADMIN'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-indigo-100 text-indigo-700'
                        }`}>
                          {usr.rol}
                        </span>
                      </button>
                    );
                  })}
                </div>
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
                            ? 'bg-blue-600 border-blue-600 scale-110 shadow-sm shadow-blue-500/40'
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
                    className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 active:text-blue-600 border border-slate-200 font-extrabold text-lg text-slate-800 transition active:scale-95 flex items-center justify-center shadow-2xs"
                  >
                    {digit}
                  </button>
                ))}
                
                {/* Botón Borrar Todo (C) */}
                <button
                  type="button"
                  onClick={() => { setPin(''); setErrorMsg(null); }}
                  className="h-12 rounded-2xl bg-slate-100 hover:bg-rose-50 hover:text-rose-600 border border-slate-200 font-bold text-xs text-slate-500 transition active:scale-95 flex items-center justify-center"
                >
                  C
                </button>

                {/* Dígito 0 */}
                <button
                  type="button"
                  onClick={() => handleDigit('0')}
                  disabled={isLoggingIn}
                  className="h-12 rounded-2xl bg-slate-50 hover:bg-slate-100 active:bg-blue-50 active:text-blue-600 border border-slate-200 font-extrabold text-lg text-slate-800 transition active:scale-95 flex items-center justify-center shadow-2xs"
                >
                  0
                </button>

                {/* Botón Retroceso (⌫) */}
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

          {/* ======================================================== */}
          {/* MODO 2: CORREO & CONTRASEÑA TRADICIONAL */}
          {/* ======================================================== */}
          {mode === 'credentials' && (
            <form onSubmit={handleCredentialsSubmit} className="space-y-3">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Usuario o Correo Electrónico
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="admin@glorypos.bo o Carlos"
                    className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Contraseña
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
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
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
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

              <button
                type="submit"
                disabled={isLoggingIn}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-[#7c3aed] hover:from-blue-700 hover:to-[#6d28d9] text-white font-bold text-xs rounded-xl shadow-md shadow-blue-500/20 transition active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{isLoggingIn ? 'Iniciando sesión...' : 'Entrar al Sistema'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          )}

          {/* ======================================================== */}
          {/* ACCESOS RÁPIDOS 1-CLIC (DEMO / CAJA RÁPIDA) */}
          {/* ======================================================== */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block text-center">
              Acceso Rápido de Prueba (1-Clic):
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 text-[10px]">
              {usuarios.map((usr) => (
                <button
                  key={usr.id}
                  type="button"
                  onClick={() => handleFastDemoLogin(usr)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 font-bold border border-slate-200 flex items-center justify-center gap-1 transition"
                  title={`PIN: ${usr.pin}`}
                >
                  <span>{usr.rol === 'ADMIN' ? '👑' : '🛒'}</span>
                  <span>{usr.nombre.split(' ')[0]}</span>
                  <span className="text-[9px] text-slate-400 font-mono">[{usr.pin}]</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </main>

      {/* Footer System Info */}
      <footer className="max-w-md mx-auto w-full text-center space-y-1 pb-2">
        <div className="flex items-center justify-center gap-3 text-[11px] text-slate-400">
          <span className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Encriptación Local & RLS</span>
          </span>
          <span>•</span>
          <span>Soporte Offline Dexie.js</span>
          <span>•</span>
          <span>Bolivia v2.0</span>
        </div>
      </footer>
    </div>
  );
}
