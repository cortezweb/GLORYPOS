import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initDatabase } from '../db/dexie';
import { hashText } from '../utils/crypto';
import { tenantService } from '../services/tenantService';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [empresa, setEmpresa] = useState(null);
  const [tenantSlug, setTenantSlugState] = useState('admin');
  const [tenantError, setTenantError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);

  const isLocalDev = tenantService.isLocalDev();
  const detectedSubdomain = tenantService.detectSubdomain();

  const loadData = useCallback(async (forcedSlug = null) => {
    setLoading(true);
    setTenantError(null);

    try {
      await initDatabase();

      // 1. Resolver el slug del tenant
      const activeSlug = forcedSlug || tenantService.getActiveTenantSlug();
      setTenantSlugState(activeSlug);

      // 2. Cargar datos del inquilino (Supabase -> Dexie)
      const tenant = await tenantService.getTenantBySlug(activeSlug);

      if (tenant) {
        setEmpresa(tenant);
        // 3. Cargar usuarios asignados a este tenant
        const userList = await tenantService.getTenantUsers(tenant.id);
        setUsuarios(userList);

        // 4. Recuperar sesión persistente de usuario si pertenece a este tenant
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
      } else {
        setTenantError(`No se encontró la empresa con identificador "${activeSlug}".`);
        // En caso de que no exista el slug en local, intentamos cargar la demo local para no bloquear la app
        const fallback = await db.config_empresa.get('empresa_activa');
        setEmpresa(fallback || null);
        const localUsers = await db.usuarios.toArray();
        setUsuarios(localUsers);
      }
    } catch (err) {
      console.error('[AuthContext] Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cambiar de inquilino / empresa en caliente (estilo Tukifac en local)
  const switchTenant = async (newSlug) => {
    if (!newSlug || newSlug.trim() === '') return { success: false, error: 'Ingresa un identificador' };
    const clean = newSlug.trim().toLowerCase();
    tenantService.setActiveTenantSlug(clean);
    setTenantSlugState(clean);

    const tenant = await tenantService.getTenantBySlug(clean);
    if (!tenant) {
      const errorMsg = `No se encontró la empresa "${clean}". Verifica el identificador o regístrala.`;
      setTenantError(errorMsg);
      return { success: false, error: errorMsg };
    }

    setTenantError(null);
    setEmpresa(tenant);
    const userList = await tenantService.getTenantUsers(tenant.id);
    setUsuarios(userList);

    // Cerrar sesión del usuario anterior al cambiar de tenant
    localStorage.removeItem('glorypos_user_session');
    setCurrentUser(null);

    return { success: true, empresa: tenant };
  };

  // Iniciar sesión con PIN táctil (4 dígitos) — compara hash SHA-256
  const loginWithPin = async (pin, specificUserId = null) => {
    if (!pin) return { success: false, error: 'Ingresa un PIN' };

    const hashedPin = await hashText(String(pin));
    let user = null;

    if (specificUserId) {
      user = usuarios.find(u => u.id === specificUserId && (u.pin === hashedPin || u.pin_hash === hashedPin));
      if (!user) {
        // Buscar en db local
        const target = await db.usuarios.get(specificUserId);
        if (target && (target.pin === hashedPin || target.pin_hash === hashedPin)) {
          user = target;
        }
      }
    } else {
      user = usuarios.find(u => u.pin === hashedPin || u.pin_hash === hashedPin);
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
    
    // Buscar usuario en la lista del tenant activo
    let user = usuarios.find(
      u => (u.email?.toLowerCase() === term || u.nombre?.toLowerCase() === term) &&
           (u.password === hashedPwd || u.password_hash === hashedPwd)
    );

    // Fallback a Dexie si aún no estaba en memoria
    if (!user) {
      const allUsers = await db.usuarios.toArray();
      user = allUsers.find(
        u => (u.email?.toLowerCase() === term || u.nombre?.toLowerCase() === term) &&
             (u.password === hashedPwd || u.password_hash === hashedPwd)
      );
    }

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
    if (!empresa || !empresa.fecha_vencimiento) return 30;
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
        tenantSlug,
        tenantError,
        isLocalDev,
        detectedSubdomain,
        currentUser,
        usuarios,
        isAuthenticated: !!currentUser,
        loading,
        diasRestantes: calcularDiasRestantes(),
        isExpired,
        switchTenant,
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
