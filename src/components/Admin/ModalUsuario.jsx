import React, { useState, useEffect } from 'react';
import { X, User, Key, Mail, Shield, Check, Lock } from 'lucide-react';
import { db } from '../../db/dexie';
import { hashText, isAlreadyHashed } from '../../utils/crypto';

export default function ModalUsuario({ isOpen, onClose, userToEdit, roles = [], onSaved }) {
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [rol, setRol] = useState('Cajero');
  const [pin, setPin] = useState('');
  const [password, setPassword] = useState('');
  const [activo, setActivo] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userToEdit) {
      setNombre(userToEdit.nombre || '');
      setEmail(userToEdit.email || '');
      setRol(userToEdit.rol || 'Cajero');
      setPin(''); // Para no sobreescribir a menos que el usuario lo cambie
      setPassword('');
      setActivo(userToEdit.activo !== false);
    } else {
      setNombre('');
      setEmail('');
      setRol(roles.length > 0 ? roles[0].nombre : 'Cajero');
      setPin('1234');
      setPassword('123456');
      setActivo(true);
    }
    setError('');
  }, [userToEdit, isOpen, roles]);

  if (!isOpen) return null;

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del usuario es obligatorio');
      return;
    }
    if (!email.trim()) {
      setError('El correo electrónico es obligatorio');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      let finalPin = userToEdit?.pin || '';
      if (pin.trim()) {
        finalPin = await hashText(pin.trim());
      }

      let finalPassword = userToEdit?.password || '';
      if (password.trim()) {
        finalPassword = await hashText(password.trim());
      } else if (!userToEdit) {
        finalPassword = await hashText('123456');
      }

      const userData = {
        id: userToEdit?.id || `usr-${Date.now()}`,
        empresa_id: 'empresa_activa',
        nombre: nombre.trim(),
        email: email.trim().toLowerCase(),
        rol: rol,
        pin: finalPin,
        password: finalPassword,
        activo: activo,
        created_at: userToEdit?.created_at || new Date().toISOString()
      };

      await db.usuarios.put(userData);
      if (onSaved) onSaved(userData);
      onClose();
    } catch (err) {
      console.error('Error guardando usuario:', err);
      setError('Ocurrió un error al guardar el usuario');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {userToEdit ? `Editar Usuario: ${userToEdit.nombre}` : 'Nuevo Usuario'}
              </h2>
              <p className="text-xs text-slate-500">
                Asigna datos de acceso, perfil y rol en el sistema
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSave} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Nombre Completo <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Ej. Esteffany Cordova"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Correo Electrónico <span className="text-rose-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Ej. esteffany@tukfac.com"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Rol / Perfil <span className="text-rose-500">*</span>
              </label>
              <select
                value={rol}
                onChange={(e) => setRol(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              >
                {roles.map((r) => (
                  <option key={r.id || r.nombre} value={r.nombre}>
                    {r.nombre}
                  </option>
                ))}
                {roles.length === 0 && (
                  <>
                    <option value="Administrador">Administrador</option>
                    <option value="Almacenero">Almacenero</option>
                    <option value="Cajero">Cajero</option>
                    <option value="Contador">Contador</option>
                    <option value="Supervisor">Supervisor</option>
                    <option value="Vendedor">Vendedor</option>
                  </>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                PIN Rápido (4 dígitos)
              </label>
              <input
                type="password"
                maxLength={6}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder={userToEdit ? 'Sin cambios (****)' : 'Ej. 1234'}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">
              {userToEdit ? 'Cambiar Contraseña (opcional)' : 'Contraseña de Acceso'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder={userToEdit ? 'Dejar en blanco para mantener la actual' : 'Mínimo 6 caracteres'}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:border-blue-500 focus:outline-hidden transition"
            />
          </div>

          <div className="pt-2">
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={activo}
                onChange={(e) => setActivo(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
              <span className="ml-3 font-semibold text-slate-700">
                {activo ? 'Usuario Activo con Acceso al Sistema' : 'Usuario Inactivo / Bloqueado'}
              </span>
            </label>
          </div>

          {/* Footer del Modal */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={guardando}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs transition disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : userToEdit ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
