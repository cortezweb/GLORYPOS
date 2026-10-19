import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { db, initDatabase, switchTenantDatabase } from '../db/dexie';
import { hashText } from '../utils/crypto';
import { tenantService } from '../services/tenantService';
import { supabase, isSupabaseConfigured, isDemoMode } from '../lib/supabase';
import { syncService } from '../services/syncService';
import { setCurrency } from '../utils/currency';
import { resolvePermisos, hasAnyPermission, canAccessViewWith, groupPermissionList } from '../config/permissions';

const AuthContext = createContext();

// Registro hecho con "Confirmar correo" activo: la empresa se crea en el primer inicio de sesión
const PENDING_REGISTRATION_KEY = 'glorypos_registro_pendiente';
// Último acceso verificado por empresa, para seguir trabajando sin conexión
const ACCESS_CACHE_KEY = 'glorypos_acceso_nube';

const NO_ACCESS = { ok: false, rol: null, superAdmin: false };
const DEMO_ACCESS = { ok: true, rol: null, superAdmin: false };

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || 'null');
  } catch {
    return null;
  }
}

function cacheAccess(slug, access) {
  const all = readJson(ACCESS_CACHE_KEY) || {};
  if (access) all[slug] = access;
  else delete all[slug];
  localStorage.setItem(ACCESS_CACHE_KEY, JSON.stringify(all));
}

export function AuthProvider({ children }) {
  const [empresa, setEmpresa] = useState(null);
  const [tenantSlug, setTenantSlugState] = useState('admin');
  const [tenantError, setTenantError] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [loading, setLoading] = useState(true);
  // Acceso del dispositivo a la empresa, verificado por Supabase Auth + membresía
  const [cloudAccess, setCloudAccess] = useState(isDemoMode ? DEMO_ACCESS : NO_ACCESS);
  // Moneda de la empresa: al cambiar de empresa se vuelve a dibujar la app con su símbolo
  const [, setCurrencyTick] = useState(0);
  useEffect(() => {
    if (empresa && setCurrency(empresa.moneda)) setCurrencyTick(t => t + 1);
  }, [empresa]);

  // Roles de la empresa (permisos editables en Administración > Roles y permisos)
  const [roles, setRoles] = useState([]);

  const loadRoles = useCallback(async () => {
    try {
      setRoles(db.roles ? await db.roles.toArray() : []);
    } catch {
      setRoles([]);
    }
  }, []);

  useEffect(() => {
    loadRoles();
    window.addEventListener('glorypos_roles_changed', loadRoles);
    return () => window.removeEventListener('glorypos_roles_changed', loadRoles);
  }, [loadRoles]);

  const isLocalDev = tenantService.isLocalDev();
  const detectedSubdomain = tenantService.detectSubdomain();

  // ¿La sesión de Supabase de este dispositivo pertenece a esta empresa?
  const resolveCloudAccess = useCallback(async (slug) => {
    if (isDemoMode) return DEMO_ACCESS;
    // Sin conexión se usa el último acceso verificado. Va antes de mirar la sesión porque,
    // pasada una hora, Supabase no puede renovar el token sin red y la daría por cerrada.
    // Cerrar sesión (SIGNED_OUT) borra esta copia, así que no deja entrar a nadie de más.
    if (!navigator.onLine) {
      return (readJson(ACCESS_CACHE_KEY) || {})[slug] || NO_ACCESS;
    }
    if (!(await tenantService.hasCloudSession())) {
      cacheAccess(slug, null);
      return NO_ACCESS;
    }
    try {
      const m = await tenantService.getMembership(slug);
      const ok = slug === 'admin' ? Boolean(m?.super_admin) : Boolean(m?.miembro || m?.super_admin);
      const access = ok ? { ok, rol: m.rol, superAdmin: Boolean(m.super_admin) } : NO_ACCESS;
      cacheAccess(slug, ok ? access : null);
      return access;
    } catch (err) {
      console.warn('[AuthContext] No se pudo verificar la membresía:', err);
      return (readJson(ACCESS_CACHE_KEY) || {})[slug] || NO_ACCESS;
    }
  }, []);

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
      const access = await resolveCloudAccess(activeSlug);
      setCloudAccess(access);

      if (tenant) {
        setEmpresa(tenant);
        // 3. Cargar usuarios asignados a este tenant y los roles de la nube
        const userList = await tenantService.getTenantUsers(tenant.id);
        setUsuarios(userList);
        if (access.ok && !isDemoMode) await syncService.pullRoles?.();
        await loadRoles();

        // 4. Recuperar sesión persistente de usuario si pertenece a este tenant y el
        //    dispositivo sigue autenticado en la nube
        try {
          const savedSession = localStorage.getItem('glorypos_user_session');
          if (savedSession && access.ok) {
            const parsed = JSON.parse(savedSession);
            const existing = userList.find(u => u.id === parsed.id)
              || (parsed.rol === 'SUPERADMIN' && access.superAdmin ? parsed : null);
            if (existing) {
              setCurrentUser(existing);
            } else {
              localStorage.removeItem('glorypos_user_session');
              setCurrentUser(null);
            }
          } else {
            localStorage.removeItem('glorypos_user_session');
            setCurrentUser(null);
          }
        } catch {
          localStorage.removeItem('glorypos_user_session');
          setCurrentUser(null);
        }
      } else {
        setTenantError(`No se encontró la empresa con identificador "${activeSlug}".`);
        if (isDemoMode) {
          // En modo demo se carga la empresa local para no bloquear la app
          const fallback = await db.config_empresa.get('empresa_activa');
          setEmpresa(fallback || null);
          const localUsers = await db.usuarios.toArray();
          setUsuarios(localUsers);
        } else {
          setEmpresa(null);
          setUsuarios([]);
        }
      }
    } catch (err) {
      console.error('[AuthContext] Error al cargar datos:', err);
    } finally {
      setLoading(false);
    }
  }, [resolveCloudAccess, loadRoles]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Listener para sincronizar estado de Supabase Auth
  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) return;

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('glorypos_user_session');
        localStorage.removeItem(ACCESS_CACHE_KEY);
        setCurrentUser(null);
        if (!isDemoMode) setCloudAccess(NO_ACCESS);
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
    setCloudAccess(await resolveCloudAccess(clean));
    const userList = await tenantService.getTenantUsers(tenant.id);
    setUsuarios(userList);

    // Cerrar sesión del usuario anterior al cambiar de tenant
    localStorage.removeItem('glorypos_user_session');
    setCurrentUser(null);

    return { success: true, empresa: tenant };
  };

  const startUserSession = (user) => {
    localStorage.setItem('glorypos_user_session', JSON.stringify(user));
    setCurrentUser(user);
  };

  // Lleva el navegador a la empresa recién creada (su subdominio si está configurado)
  const goToTenant = (slug) => {
    const url = tenantService.urlForTenant(slug);
    if (url && url !== window.location.origin) {
      window.location.href = url;
    } else {
      window.location.reload();
    }
  };

  // Crea la empresa en la nube y deja al usuario como su administrador en este dispositivo
  const finishCloudRegistration = async (empresaData, adminNombre, authUser) => {
    const nueva = await tenantService.registerTenant(empresaData);
    await tenantService.activateCloudTenantLocally(nueva);
    const adminUser = {
      id: authUser.id,
      empresa_id: nueva.id,
      nombre: adminNombre || authUser.email.split('@')[0],
      email: authUser.email,
      rol: 'ADMIN',
      color: 'from-[#FF6B35] to-[#E85B28]',
      activo: true,
      created_at: new Date().toISOString(),
    };
    await db.usuarios.put(adminUser);
    cacheAccess(nueva.slug, { ok: true, rol: 'ADMIN', superAdmin: false });
    localStorage.setItem('glorypos_user_session', JSON.stringify(adminUser));
    goToTenant(nueva.slug);
    return { success: true, empresa: nueva, redirecting: true };
  };

  // Después de autenticarse en Supabase: verifica que la cuenta pertenezca a esta empresa
  const completeCloudLogin = async (authUser) => {
    const email = authUser.email?.toLowerCase();

    // 1. Registro pendiente (el correo se confirmó después de registrarse)
    const pending = readJson(PENDING_REGISTRATION_KEY);
    if (pending && pending.email === email) {
      try {
        const res = await finishCloudRegistration(pending.empresa, pending.adminNombre, authUser);
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
        return res;
      } catch (err) {
        localStorage.removeItem(PENDING_REGISTRATION_KEY);
        await supabase.auth.signOut();
        return { success: false, error: err.message || 'No se pudo crear la empresa.' };
      }
    }

    // 2. Membresía en la empresa del subdominio
    const access = await resolveCloudAccess(tenantSlug);
    if (!access.ok) {
      await supabase.auth.signOut();
      return { success: false, error: 'Tu cuenta no tiene acceso a esta empresa.' };
    }
    setCloudAccess(access);

    // 3. Ya autenticados: datos completos de la empresa y sus usuarios
    const tenant = await tenantService.getTenantBySlug(tenantSlug);
    if (tenant) setEmpresa(tenant);
    const userList = await tenantService.getTenantUsers(tenant?.id);
    setUsuarios(userList);
    await syncService.pullRoles?.();
    await loadRoles();

    let matchedUser = userList.find(u => u.email?.toLowerCase() === email)
      || await db.usuarios.where('email').equalsIgnoreCase(email).first();

    if (!matchedUser) {
      // Perfil inicial en el tenant con el rol que da su membresía (nunca uno elegido en el navegador)
      matchedUser = {
        id: authUser.id,
        empresa_id: tenant?.id,
        email,
        nombre: authUser.user_metadata?.nombre || email.split('@')[0],
        rol: access.rol || 'CAJERO',
        activo: true,
        created_at: new Date().toISOString()
      };
      if (matchedUser.rol !== 'SUPERADMIN') {
        await db.usuarios.put(matchedUser);
      }
    }

    startUserSession(matchedUser);
    return { success: true, user: matchedUser };
  };

  // Iniciar sesión con PIN táctil (4 dígitos) — cambio rápido de cajero en un dispositivo
  // que ya inició sesión con correo en la nube
  const loginWithPin = async (pin, specificUserId = null) => {
    if (!pin) return { success: false, error: 'Ingresa un PIN' };
    if (!cloudAccess.ok) {
      return { success: false, error: 'Primero inicia sesión con tu correo en este dispositivo.' };
    }

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
      startUserSession(user);
      return { success: true, user };
    } else {
      return { success: false, error: 'PIN incorrecto. Intenta de nuevo.' };
    }
  };

  // Iniciar sesión con Correo / Usuario y Contraseña (Supabase Auth con respaldo sin conexión)
  const loginWithCredentials = async (identifier, password) => {
    if (!identifier || !password) {
      return { success: false, error: 'Completa todos los campos' };
    }

    const term = identifier.trim().toLowerCase();
    const isEmail = term.includes('@');

    // 1. Supabase Auth en la nube: es la única forma de vincular un dispositivo a la empresa
    if (!isDemoMode && isEmail && navigator.onLine) {
      try {
        const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
          email: term,
          password: password,
        });
        if (authError || !authData?.user) {
          const msg = /fetch/i.test(authError?.name || '') || authError?.status === 0
            ? 'No se pudo conectar. Intenta de nuevo.'
            : /confirm/i.test(authError?.message || '')
              ? 'Confirma tu correo con el enlace que te enviamos y vuelve a intentar.'
              : 'Correo o clave incorrectos.';
          return { success: false, error: msg };
        }
        return await completeCloudLogin(authData.user);
      } catch (cloudAuthErr) {
        console.warn('[AuthContext] Supabase Auth no respondió:', cloudAuthErr);
        return { success: false, error: 'No se pudo conectar. Intenta de nuevo.' };
      }
    }

    // 2. Verificación local (sin conexión o por nombre de usuario): solo en un dispositivo
    //    ya vinculado a esta empresa, o en modo demo
    if (!cloudAccess.ok) {
      return {
        success: false,
        error: navigator.onLine
          ? 'Inicia sesión con tu correo para vincular este dispositivo.'
          : 'Sin conexión: este dispositivo aún no está vinculado a la empresa.',
      };
    }

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
      startUserSession(user);
      return { success: true, user };
    } else {
      return { success: false, error: 'Credenciales inválidas. Revisa correo/usuario y clave.' };
    }
  };

  // Registro de una empresa nueva por su dueño (pantalla "Registrar empresa")
  const registerCompanyCloud = async ({ empresaData, adminNombre, email, password }) => {
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: { data: { nombre: adminNombre } },
    });
    if (error) return { success: false, error: error.message };

    if (!data.session) {
      // Supabase pide confirmar el correo: la empresa se crea en el primer inicio de sesión
      localStorage.setItem(PENDING_REGISTRATION_KEY, JSON.stringify({ email: cleanEmail, empresa: empresaData, adminNombre }));
      return { success: true, needsConfirmation: true };
    }

    try {
      return await finishCloudRegistration(empresaData, adminNombre, data.user);
    } catch (err) {
      await supabase.auth.signOut();
      return { success: false, error: err.message || 'No se pudo crear la empresa.' };
    }
  };

  // Crear el acceso de una persona invitada a una empresa existente (por el Super Admin o el ADMIN)
  const signUpInvited = async (email, password) => {
    if (isDemoMode) return { success: false, error: 'No disponible en modo demo' };
    const cleanEmail = email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({ email: cleanEmail, password });
    if (error) return { success: false, error: error.message };
    if (!data.session) return { success: true, needsConfirmation: true };
    return completeCloudLogin(data.user);
  };

  // Registrar usuario local de la empresa (sin datos de empresa ni rol en la cuenta de Supabase)
  const signUpWithCredentials = async (email, password, nombre = '', rol = 'CAJERO') => {
    if (!email || !password) return { success: false, error: 'Correo y clave requeridos' };
    const cleanEmail = email.trim().toLowerCase();
    const hashedPwd = await hashText(password);
    const newUserId = `usr-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

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

  // Cerrar sesión del usuario (el dispositivo sigue vinculado para el cambio de turno con PIN)
  const logout = async () => {
    if (isDemoMode && isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Error cerrando sesión en Supabase:', err);
      }
    }
    localStorage.removeItem('glorypos_user_session');
    setCurrentUser(null);
  };

  // Desvincular el dispositivo: cierra la sesión de Supabase (el PIN deja de funcionar)
  const unlinkDevice = async () => {
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('[AuthContext] Error cerrando sesión en Supabase:', err);
      }
    }
    localStorage.removeItem('glorypos_user_session');
    localStorage.removeItem(ACCESS_CACHE_KEY);
    setCurrentUser(null);
    if (!isDemoMode) setCloudAccess(NO_ACCESS);
  };

  // Cambiar de usuario rápidamente (ej. cambio de turno de cajero)
  const switchUser = (user) => {
    if (user) {
      startUserSession(user);
    }
  };

  const updateEmpresa = async (newData) => {
    const local = await db.config_empresa.get('empresa_activa');
    await db.config_empresa.put({
      ...(local || {}),
      ...newData,
      id: 'empresa_activa',
      cloud_id: local?.cloud_id || (empresa?.id !== 'empresa_activa' ? empresa?.id : undefined),
    });
    setEmpresa(prev => ({ ...prev, ...newData }));
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

  // Permisos del usuario activo (null = administrador: todos)
  const permisos = (!isDemoMode && cloudAccess.superAdmin)
    ? null
    : resolvePermisos(currentUser?.rol, roles);
  const can = (permiso) => hasAnyPermission(permisos, [permiso]);
  const canAny = (lista) => hasAnyPermission(permisos, lista);
  const canAccessView = (view) => canAccessViewWith(permisos, view);
  const canShowGroup = (modId) => hasAnyPermission(permisos, groupPermissionList(modId));

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
        isDemoMode,
        detectedSubdomain,
        currentUser,
        usuarios,
        isAuthenticated: !!currentUser,
        deviceLinked: cloudAccess.ok,
        can,
        canAny,
        canAccessView,
        canShowGroup,
        isPlatformAdmin: !isDemoMode && cloudAccess.superAdmin,
        loading,
        diasRestantes: calcularDiasRestantes(),
        isExpired,
        switchTenant,
        loginWithPin,
        loginWithCredentials,
        registerCompanyCloud,
        signUpInvited,
        signUpWithCredentials,
        logout,
        unlinkDevice,
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
