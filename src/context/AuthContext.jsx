import React, { createContext, useContext, useState, useEffect } from 'react';
import { db, initDatabase } from '../db/dexie';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [empresa, setEmpresa] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadEmpresa = async () => {
    await initDatabase();
    const config = await db.config_empresa.get('empresa_activa');
    setEmpresa(config);
    setLoading(false);
  };

  useEffect(() => {
    loadEmpresa();
  }, []);

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
        loading,
        diasRestantes: calcularDiasRestantes(),
        isExpired,
        updateEmpresa,
        setTrialDays,
        simularVencimiento,
        cambiarPlan,
        refresh: loadEmpresa
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
