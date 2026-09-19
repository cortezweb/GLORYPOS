import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, initDatabase } from '../db/dexie';
import { hashText } from '../utils/crypto';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [empresa, setEmpresa] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    await initDatabase();
    const config = await db.config_empresa.get('empresa_activa');
    setEmpresa(config);

    const userList = await db.usuarios.toArray();
    setUsuarios(userList);

    // Recuperar sesión persistente de usuario
    try {
      const savedSession = localStorage.getItem('glorypos_user_session');
      if (savedSession) {
        const parsed = JSON.parse(savedSession);
        const existing = userList.find(u => u.id === parsed.id);
        if (existing) {
          setCurrentUser(existing);
        } else {
          localStorage.removeItem('glorypos_user_session');
          setCurrentUser(null);
        }
      }
    } catch {
      localStorage.removeItem('glorypos_user_session');
      setCurrentUser(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  // Iniciar sesión con PIN táctil (4 dígitos) — compara hash SHA-256
  const loginWithPin = async (pin, specificUserId = null) => {
    if (!pin) return { success: false, error: 'Ingresa un PIN' };

    const hashedPin = await hashText(String(pin));
    let user = null;

    if (specificUserId) {
      const target = await db.usuarios.get(specificUserId);
      if (target && target.pin === hashedPin) {
        user = target;
      }
    } else {
      user = await db.usuarios.where('pin').equals(hashedPin).first();
    }

    if (user) {
      localStorage.setItem('glorypos_user_session', JSON.stringify(user));
      setCurrentUser(user);
      return { success: true, user };
    } else {
      return { success: false, error: 'PIN incorrecto. Intenta de nuevo.' };
    }
  };

  // Iniciar sesión con Correo / Usuario y Contraseña — compara hash SHA-256
  const loginWithCredentials = async (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, error: 'Completa todos los campos' };
    }

    const term = identifier.trim().toLowerCase();
    const hashedPwd = await hashText(password);
    const allUsers = await db.usuarios.toArray();
    const user = allUsers.find(
      u => (u.email?.toLowerCase() === term || u.nombre?.toLowerCase() === term) && u.password === hashedPwd
    );

    if (user) {
      localStorage.setItem('glorypos_user_session', JSON.stringify(user));
      setCurrentUser(user);
      return { success: true, user };
    } else {
      return { success: false, error: 'Credenciales inválidas. Revisa correo y clave.' };
    }
  };

  // Cerrar sesión
  const logout = () => {
    localStorage.removeItem('glorypos_user_session');
    setCurrentUser(null);
  };

  // Cambiar de usuario rápidamente (ej. cambio de turno de cajero)
  const switchUser = (user) => {
    if (user) {
      localStorage.setItem('glorypos_user_session', JSON.stringify(user));
      setCurrentUser(user);
    }
  };

  const updateEmpresa = async (newData) => {
    const updated = { ...empresa, ...newData };
    await db.config_empresa.put(updated);
    setEmpresa(updated);
  };

  // Calcular días restantes de prueba / suscripción
  const calcularDiasRestantes = () => {
    if (!empresa || !empresa.fecha_vencimiento) return 0;
    const ahora = new Date();
    const vencimiento = new Date(empresa.fecha_vencimiento);
    const diffTime = vencimiento - ahora;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const isExpired = empresa?.estado_suscripcion === 'VENCIDO' || calcularDiasRestantes() <= 0;

  // Cambiar entre planes de prueba o comercial (para probar el sistema)
  const setTrialDays = async (dias) => {
    const ahora = new Date();
    const vencimiento = new Date();
    vencimiento.setDate(ahora.getDate() + dias);
    await updateEmpresa({
      plan_tipo: 'TRIAL',
      dias_prueba: dias,
      fecha_inicio: ahora.toISOString(),
      fecha_vencimiento: vencimiento.toISOString(),
      estado_suscripcion: 'ACTIVO'
    });
  };

  const simularVencimiento = async (vencido = true) => {
    if (vencido) {
      const ayer = new Date();
      ayer.setDate(ayer.getDate() - 1);
      await updateEmpresa({
        estado_suscripcion: 'VENCIDO',
        fecha_vencimiento: ayer.toISOString()
      });
    } else {
      await setTrialDays(30);
    }
  };

  const cambiarPlan = async (nuevoPlan) => {
    await updateEmpresa({ plan_tipo: nuevoPlan, estado_suscripcion: 'ACTIVO' });
  };

  return (
    <AuthContext.Provider
      value={{
        empresa,
        currentUser,
        usuarios,
        isAuthenticated: !!currentUser,
        loading,
        diasRestantes: calcularDiasRestantes(),
        isExpired,
        loginWithPin,
        loginWithCredentials,
        logout,
        switchUser,
        updateEmpresa,
        setTrialDays,
        simularVencimiento,
        cambiarPlan,
        refresh: loadData
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
