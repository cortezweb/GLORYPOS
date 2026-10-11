import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initDatabase, switchTenantDatabase } from '../db/dexie';
import { hashText } from '../utils/crypto';
import { tenantService } from '../services/tenantService';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { syncService } from '../services/syncService';

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
      // 1. Resolver el slug del tenant activo
      const activeSlug = forcedSlug || tenantService.getActiveTenantSlug();
      setTenantSlugState(activeSlug);

      // Activar la base de datos Dexie aislada para este tenant
      await switchTenantDatabase(activeSlug);
      syncService.setupDexieSyncHooks(true);
      await initDatabase(activeSlug);

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

  // Listener para sincronizar estado de Supabase Auth
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('glorypos_user_session');
        setCurrentUser(null);
      }
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  // Cambiar de inquilino / empresa en caliente con aislamiento de base de datos local
  const switchTenant = async (newSlug) => {
    if (!newSlug || newSlug.trim() === '') return { success: false, error: 'Ingresa un identificador' };
    const clean = newSlug.trim().toLowerCase();
    tenantService.setActiveTenantSlug(clean);
    setTenantSlugState(clean);

    // Cambiar Dexie a la base de datos aislada GloryPosDB_<slug>
    await switchTenantDatabase(clean);
    syncService.setupDexieSyncHooks(true);
    await initDatabase(clean);

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

  // Iniciar sesión con PIN táctil (4 dígitos) — cajeros rápidos con hash SHA-256
  const loginWithPin = async (pin, specificUserId = null) => {
    if (!pin) return { success: false, error: 'Ingresa un PIN' };

    const hashedPin = await hashText(String(pin));
    let user = null;

    if (specificUserId) {
      user = usuarios.find(u => u.id === specificUserId && (u.pin === hashedPin || u.pin_hash === hashedPin));
      if (!user) {
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

  // Iniciar sesión con Correo / Usuario y Contraseña (Supabase Auth con Fallback Offline)
  const loginWithCredentials = async (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, error: 'Completa todos los campos' };
    }

    const term = identifier.trim().toLowerCase();
    const isEmail = term.includes('@');

    // 1. Supabase Auth en la nube si hay conexión
    if (isSupabaseConfigured && navigator.onLine && supabase && isEmail) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: term,
          password: password,
        });

        if (!authError && authData?.user) {
          let matchedUser = usuarios.find(u => u.email?.toLowerCase() === term);
          if (!matchedUser) {
            matchedUser = await db.usuarios.where('email').equalsIgnoreCase(term).first();
          }

          if (matchedUser) {
            localStorage.setItem('glorypos_user_session', JSON.stringify(matchedUser));
            setCurrentUser(matchedUser);
            return { success: true, user: matchedUser, session: authData.session };
          } else {
            // Perfil inicial en el tenant si se autenticó exitosamente
            const newAdminUser = {
              id: authData.user.id,
              empresa_id: empresa?.id || 'empresa_activa',
              email: authData.user.email,
              nombre: authData.user.user_metadata?.nombre || term.split('@')[0],
              rol: 'ADMIN',
              activo: true,
              created_at: new Date().toISOString()
            };
            await db.usuarios.put(newAdminUser);
            localStorage.setItem('glorypos_user_session', JSON.stringify(newAdminUser));
            setCurrentUser(newAdminUser);
            return { success: true, user: newAdminUser, session: authData.session };
          }
        }
      } catch (cloudAuthErr) {
        console.warn('[AuthContext] Supabase Auth falló o no respondió, usando verificación local:', cloudAuthErr);
      }
    }

    // 2. Fallback offline o login por nombre de usuario con hash SHA-256
    const hashedPwd = await hashText(password);
    let user = usuarios.find(
      u => (u.email?.toLowerCase() === term || u.nombre?.toLowerCase() === term) &&
           (u.password === hashedPwd || u.password_hash === hashedPwd)
    );

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
      return { success: false, error: 'Credenciales inválidas. Revisa correo/usuario y clave.' };
    }
  };

  // Registrar usuario en Supabase Auth y en Dexie local
  const signUpWithCredentials = async (email, password, nombre = '', rol = 'CAJERO') => {
    if (!email || !password) return { success: false, error: 'Correo y clave requeridos' };
    const cleanEmail = email.trim().toLowerCase();
    const hashedPwd = await hashText(password);
    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

    if (isSupabaseConfigured && navigator.onLine && supabase) {
      try {
        await supabase.auth.signUp({
          email: cleanEmail,
          password: password,
          options: {
            data: {
              nombre: nombre || cleanEmail.split('@')[0],
              empresa_id: empresa?.id || 'empresa_activa',
              rol: rol
            }
          }
        });
      } catch (err) {
        console.warn('[AuthContext] Error registrando en Supabase Auth:', err);
      }
    }

    const newUser = {
      id: newUserId,
      empresa_id: empresa?.id || 'empresa_activa',
      email: cleanEmail,
      nombre: nombre || cleanEmail.split('@')[0],
      password: hashedPwd,
      password_hash: hashedPwd,
      rol: rol,
      activo: true,
      created_at: new Date().toISOString()
    };
    await db.usuarios.put(newUser);
    setUsuarios(prev => [...prev.filter(u => u.id !== newUserId), newUser]);
    return { success: true, user: newUser };
  };

  // Cerrar sesión
  const logout = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Error cerrando sesión en Supabase:', err);
      }
    }
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
        signUpWithCredentials,
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
