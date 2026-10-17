import { useAuth } from '../context/AuthContext';
import {
  empresaHasModule,
  isSuperAdminSession,
  getModuleForView,
  GLORYCHEF_MODULE_ID,
  TIENDA_MODULE_ID,
  HOTEL_MODULE_ID,
} from '../config/modules';

// Hook único para saber qué módulos tiene contratados la empresa activa (subdominio).
export function useModules() {
  const { empresa, tenantSlug, currentUser, isPlatformAdmin, isDemoMode, canAccessView, canShowGroup } = useAuth();
  const ctx = { tenantSlug, currentUser, isPlatformAdmin, isDemoMode };

  const hasModule = (modId) => empresaHasModule(empresa, modId, ctx);
  const canOpenView = (view) => {
    const modId = getModuleForView(view);
    return !modId || hasModule(modId);
  };

  // Grupo del menú: módulo contratado Y permiso del rol del usuario
  const showGroup = (modId) => hasModule(modId) && canShowGroup(modId);

  return {
    hasModule,
    showGroup,
    canAccessView,
    canOpenView,
    isSuperAdmin: isSuperAdminSession(tenantSlug, currentUser, ctx),
    glorychefActivo: hasModule(GLORYCHEF_MODULE_ID),
    tiendaActiva: hasModule(TIENDA_MODULE_ID),
    hotelActivo: hasModule(HOTEL_MODULE_ID),
  };
}
