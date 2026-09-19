import React, { useState, useEffect } from 'react';
import { Lock, Unlock, ShieldAlert, KeyRound, Clock, UserCheck, LogOut } from 'lucide-react';
import { playErrorBeep } from '../../utils/audio';

export default function LockTerminalModal({ isOpen, onClose, onLogout, cajeroNombre = 'Carlos Gutiérrez', cajeroPin = '1234' }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Real-time clock update
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, [isOpen]);

  // Physical Keyboard Listener
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleDigit(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleBackspace();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, pin]);

  if (!isOpen) return null;

  const handleDigit = (digit) => {
    if (pin.length >= 4) return;
    const newPin = pin + digit;
    setPin(newPin);
    setError(false);

    if (newPin.length === 4) {
      // Validate PIN: cajeroPin or Master 1234 / 0000
      if (newPin === String(cajeroPin) || newPin === '1234' || newPin === '0000') {
        setTimeout(() => {
          setPin('');
          onClose();
        }, 150);
      } else {
        setError(true);
        playErrorBeep();
        setTimeout(() => {
          setPin('');
          setError(false);
        }, 800);
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setError(false);
  };

  const handleClear = () => {
    setPin('');
    setError(false);
  };

  const timeStr = currentTime.toLocaleTimeString('es-BO', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  const dateStr = currentTime.toLocaleDateString('es-BO', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col items-center justify-center p-4 select-none animate-fadeIn">
      <div className="w-full max-w-sm flex flex-col items-center text-center space-y-6">
        
        {/* Brand & Security Header */}
        <div className="space-y-1">
          <div className="flex items-center justify-center space-x-1 mb-2">
            <span className="text-2xl font-black tracking-tight text-[#2563eb]">GLORY</span>
            <span className="text-2xl font-black tracking-tight text-[#712ae2]">POS</span>
            <span className="w-2 h-2 rounded-full bg-[#8b5cf6] ml-0.5"></span>
          </div>
          
          <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/30 rounded-full text-amber-400 text-xs font-bold">
            <Lock className="w-3.5 h-3.5" />
            <span>TERMINAL BLOQUEADA</span>
          </div>
        </div>

        {/* Digital Clock */}
        <div className="space-y-0.5">
          <div className="text-4xl sm:text-5xl font-mono font-black text-white tracking-wider">
            {timeStr}
          </div>
          <div className="text-xs text-slate-400 capitalize">
            {dateStr}
          </div>
        </div>

        {/* Cashier Info */}
        <div className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-slate-300 text-xs font-medium">
          <UserCheck className="w-4 h-4 text-blue-400" />
          <span>Cajero: <strong className="text-white">{cajeroNombre}</strong> (Caja #01)</span>
        </div>

        {/* PIN Dots Display */}
        <div className={`flex items-center gap-4 py-2 ${error ? 'animate-shake' : ''}`}>
          {[0, 1, 2, 3].map((idx) => {
            const isFilled = pin.length > idx;
            return (
              <div
                key={idx}
                className={`w-4 h-4 rounded-full border-2 transition-all duration-150 ${
                  error
                    ? 'border-red-500 bg-red-500 shadow-md shadow-red-500/50'
                    : isFilled
                      ? 'border-blue-500 bg-blue-500 scale-110 shadow-md shadow-blue-500/50'
                      : 'border-slate-600 bg-transparent'
                }`}
              />
            );
          })}
        </div>

        {error && (
          <p className="text-xs font-bold text-red-400 -mt-2 animate-fadeIn">
            PIN incorrecto. Intenta de nuevo (PIN por defecto: 1234)
          </p>
        )}

        {/* Touch Keypad */}
        <div className="grid grid-cols-3 gap-2.5 w-full max-w-[280px]">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleDigit(digit)}
              className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-white font-bold text-xl border border-slate-800/80 shadow-md transition flex items-center justify-center cursor-pointer"
            >
              {digit}
            </button>
          ))}
          <button
            type="button"
            onClick={handleClear}
            className="h-14 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 active:scale-95 text-slate-400 font-semibold text-xs border border-slate-800/40 transition flex items-center justify-center cursor-pointer"
          >
            Limpiar
          </button>
          <button
            type="button"
            onClick={() => handleDigit('0')}
            className="h-14 rounded-2xl bg-slate-900/80 hover:bg-slate-800 active:scale-95 text-white font-bold text-xl border border-slate-800/80 shadow-md transition flex items-center justify-center cursor-pointer"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="h-14 rounded-2xl bg-slate-900/40 hover:bg-slate-800/60 active:scale-95 text-slate-400 font-semibold text-xs border border-slate-800/40 transition flex items-center justify-center cursor-pointer"
          >
            ⌫
          </button>
        </div>

        <div className="flex items-center gap-2.5 pt-1">
          {onClose && (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-900/60 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl text-xs font-bold border border-slate-800 transition cursor-pointer"
            >
              Cancelar
            </button>
          )}

          {onLogout && (
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 hover:text-white rounded-xl text-xs font-bold border border-rose-500/30 transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          )}
        </div>

        <p className="text-[11px] text-slate-500">
          Usa el teclado numérico o presiona los botones en pantalla.
        </p>
      </div>
    </div>
  );
}
