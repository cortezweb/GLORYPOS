import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Building2, Printer, Save, CheckCircle2, 
  Settings, Download, FileSpreadsheet, HardDrive, Cloud, RefreshCw,
  Copy, ExternalLink, AlertTriangle, ChevronDown, ChevronUp, Database, BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { exportLibroVentasRCV } from '../../utils/rcvExport';
import { syncService } from '../../services/syncService';
import { isSupabaseConfigured } from '../../lib/supabase';
import RolesPermisosTab from './RolesPermisosTab';
import UsuariosTab from './UsuariosTab';
import masterSql from '../../../supabase_master_all_tables.sql?raw';
import phase2Sql from '../../../supabase_phase2_security_rls.sql?raw';
import { CURRENCIES, DEFAULT_CURRENCY, getCurrencyCode, setCurrency } from '../../utils/currency';
import { leerLogo } from '../../utils/logoImagen';

export default function AdministracionView({ initialTab = 'roles' }) {
  const { empresa, updateEmpresa } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);
  const [cloudStatus, setCloudStatus] = useState(null);
  const [checkingCloud, setCheckingCloud] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);
  const [copiedRlsSql, setCopiedRlsSql] = useState(false);
  const [showTablesDetail, setShowTablesDetail] = useState(false);

  const checkStatus = async () => {
    setCheckingCloud(true);
    try {
      const status = await syncService.checkCloudStatus();
      setCloudStatus(status);
    } catch (e) {
      console.warn('Error verificando estado de Supabase:', e);
    } finally {
      setCheckingCloud(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  const handleCopySql = () => {
    navigator.clipboard.writeText(masterSql);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 3000);
  };

  const handleDownloadSql = () => {
    const blob = new Blob([masterSql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GLORYPOS_SUPABASE_MASTER_SCHEMA.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyRlsSql = () => {
    navigator.clipboard.writeText(phase2Sql);
    setCopiedRlsSql(true);
    setTimeout(() => setCopiedRlsSql(false), 3000);
  };

  const handleDownloadRlsSql = () => {
    const blob = new Blob([phase2Sql], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'GLORYPOS_FASE2_SEGURIDAD_RLS.sql';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncService.syncLocalToCloud();
      setSyncResult(res);
      await checkStatus();
    } catch (err) {
      setSyncResult({ success: false, error: err.message });
    } finally {
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (initialTab) {
      const normalized = 
        ['roles', 'roles_permisos', 'admin_roles'].includes(initialTab) ? 'roles' :
        ['usuarios', 'admin_usuarios'].includes(initialTab) ? 'usuarios' :
        ['empresa', 'configuracion', 'backup'].includes(initialTab) ? 'empresa' :
        initialTab;
      setActiveTab(normalized);
    }
  }, [initialTab]);

  const [logoError, setLogoError] = useState('');
  const [formData, setFormData] = useState({
    nombre: empresa?.nombre || '',
    nit_ci: empresa?.nit_ci || '',
    propietario: empresa?.propietario || '',
    ciudad: empresa?.ciudad || '',
    moneda: empresa?.moneda || DEFAULT_CURRENCY,
    logo_url: empresa?.logo_url || '',
    direccion: empresa?.direccion || '',
    telefono: empresa?.telefono || ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await updateEmpresa(formData);
    syncService.triggerBackgroundSync?.();
    // Cambiar la moneda cambia todos los montos que se muestran: se sube a la nube y se recarga
    if (formData.moneda !== getCurrencyCode()) {
      setCurrency(formData.moneda);
      try { await syncService.syncLocalToCloud(); } catch { /* se reintenta en segundo plano */ }
      window.location.reload();
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const handleExportJSON = async () => {
    const backup = {
      empresa: formData,
      ventas: await db.ventas.toArray(),
      productos: await db.productos_tienda.toArray(),
      clientes: await db.clientes.toArray(),
      proveedores: await db.proveedores.toArray(),
      fecha_respaldo: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GLORYPOS_BACKUP_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = async () => {
    const ventas = await db.ventas.toArray();
    let csv = 'ID,Correlativo,Fecha,Cliente,NIT_CI,TipoDoc,MetodoPago,Total_Bs\n';
    ventas.forEach(v => {
      csv += `"${v.id}","${v.correlativo}","${v.fecha}","${v.cliente_nombre}","${v.cliente_ci_nit}","${v.tipo_documento}","${v.metodo_pago}",${v.total}\n`;
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GLORYPOS_VENTAS_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5 animate-fadeIn pb-12">
      
      {/* ── BARRA DE PESTAÑAS DE ADMINISTRACIÓN ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pb-2">
        <button
          type="button"
          onClick={() => setActiveTab('roles')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'roles'
              ? 'bg-[#FF6B35] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <ShieldCheck className="w-4 h-4" />
          <span>Roles y permisos</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('usuarios')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'usuarios'
              ? 'bg-[#FF6B35] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuarios</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('empresa')}
          className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
            activeTab === 'empresa'
              ? 'bg-[#FF6B35] text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Datos de la Empresa & Respaldos</span>
        </button>
      </div>

      {/* ── CONTENIDO SEGÚN LA PESTAÑA ACTIVA ── */}
      {activeTab === 'roles' && <RolesPermisosTab />}

      {activeTab === 'usuarios' && <UsuariosTab />}

      {activeTab === 'empresa' && (
        <div className="space-y-4 animate-fadeIn">
          {/* Header Empresa */}
          <div>
            <h1 className="text-xl font-bold text-slate-800">
              Datos de la Empresa & Respaldos
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Parámetros de tu negocio, datos fiscales, hardware e impresoras
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Formulario de Empresa */}
            <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
              <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
                <Building2 className="w-5 h-5 text-[#FF6B35]" />
                <h3 className="font-bold text-sm text-slate-800">Datos Principales de la Empresa</h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Nombre Comercial / Negocio</label>
                  <input
                    type="text"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">NIT / CI Fiscal</label>
                  <input
                    type="text"
                    value={formData.nit_ci}
                    onChange={(e) => setFormData({ ...formData, nit_ci: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Propietario / Responsable</label>
                  <input
                    type="text"
                    value={formData.propietario}
                    onChange={(e) => setFormData({ ...formData, propietario: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Teléfono / WhatsApp</label>
                  <input
                    type="text"
                    value={formData.telefono}
                    onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Moneda</label>
                  <select
                    value={formData.moneda}
                    onChange={(e) => setFormData({ ...formData, moneda: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  >
                    {CURRENCIES.map(c => <option key={c.code} value={c.code}>{c.label}</option>)}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Logo de la empresa</label>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-14 rounded-xl border border-slate-200 bg-slate-50 flex items-center justify-center overflow-hidden shrink-0">
                      {formData.logo_url ? (
                        <img src={formData.logo_url} alt="Logo" className="max-w-full max-h-full object-contain" />
                      ) : (
                        <span className="text-[10px] text-slate-400">Sin logo</span>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <label className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-50 font-semibold cursor-pointer">
                          {formData.logo_url ? 'Cambiar logo' : 'Subir logo'}
                          <input
                            type="file"
                            accept="image/png,image/jpeg,image/webp"
                            className="hidden"
                            onChange={async (e) => {
                              const archivo = e.target.files?.[0];
                              e.target.value = '';
                              if (!archivo) return;
                              try {
                                setLogoError('');
                                setFormData(prev => ({ ...prev, logo_url: '' }));
                                const url = await leerLogo(archivo);
                                setFormData(prev => ({ ...prev, logo_url: url }));
                              } catch (err) {
                                setLogoError(err.message);
                                setFormData(prev => ({ ...prev, logo_url: empresa?.logo_url || '' }));
                              }
                            }}
                          />
                        </label>
                        {formData.logo_url && (
                          <button
                            type="button"
                            onClick={() => setFormData({ ...formData, logo_url: '' })}
                            className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 font-semibold"
                          >
                            Quitar
                          </button>
                        )}
                      </div>
                      <p className="text-[10px] text-slate-400">PNG, JPG o WEBP. Aparece en los PDF de cotizaciones. Pulsa "Guardar Configuración" para aplicarlo.</p>
                      {logoError && <p className="text-[10px] text-rose-600 font-semibold">{logoError}</p>}
                    </div>
                  </div>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Dirección / Casa Matriz</label>
                  <input
                    type="text"
                    value={formData.direccion}
                    onChange={(e) => setFormData({ ...formData, direccion: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-semibold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                {saved && (
                  <span className="text-xs font-bold text-[#FF6B35] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Datos guardados exitosamente
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 bg-[#FF6B35] hover:bg-[#FF6B35] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Guardar Configuración</span>
                </button>
              </div>
            </form>

            {/* Hardware & Printers & Backups */}
            <div className="space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <Printer className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="font-bold text-sm text-slate-800">Impresora Térmica</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Conexión para tickets térmicos en rollos de 58mm o 80mm vía Bluetooth o USB.
                </p>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
                  <div>
                    <span className="font-bold text-slate-800 block">Formato Predeterminado</span>
                    <span className="text-slate-500 text-[11px]">80mm Rollo Completo</span>
                  </div>
                  <span className="px-2 py-0.5 bg-[#FF6B35]/20 text-[#1E2022] rounded font-bold text-[10px]">
                    Activo
                  </span>
                </div>
              </div>

              {/* Sincronización en la Nube con Supabase y Gestión de Tablas */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Database className="w-5 h-5 text-[#FF6B35]" />
                    <div>
                      <h3 className="font-bold text-sm text-slate-800">Base de Datos Supabase</h3>
                      <p className="text-[11px] text-slate-400">PostgreSQL Cloud · zeftqkwnogcrbklolwzs</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={checkStatus}
                      disabled={checkingCloud}
                      title="Verificar tablas en la nube"
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 transition"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${checkingCloud ? 'animate-spin text-[#FF6B35]' : ''}`} />
                    </button>
                    <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                      isSupabaseConfigured ? 'bg-[#FF6B35]/20 text-[#1E2022]' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {isSupabaseConfigured ? 'Conectado' : 'Sin Configurar'}
                    </span>
                  </div>
                </div>

                {/* Resumen de Tablas en Supabase */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/70 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-slate-700">Estado de Tablas en la Nube:</span>
                    <span className="font-bold text-slate-900">
                      {cloudStatus ? `${cloudStatus.existingTables.length} de ${cloudStatus.existingTables.length + cloudStatus.missingTables.length} creadas` : 'Analizando...'}
                    </span>
                  </div>
                  {cloudStatus && (
                    <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden mt-2">
                      <div 
                        className={`h-full transition-all duration-500 ${cloudStatus.missingTables.length === 0 ? 'bg-[#FF6B35]' : 'bg-amber-500'}`}
                        style={{ width: `${Math.round((cloudStatus.existingTables.length / (cloudStatus.existingTables.length + cloudStatus.missingTables.length || 1)) * 100)}%` }}
                      />
                    </div>
                  )}
                </div>

                {/* ALERTA: FALTAN TABLAS EN SUPABASE */}
                {cloudStatus && cloudStatus.missingTables.length > 0 && (
                  <div className="bg-amber-50/90 border border-amber-200 rounded-xl p-3.5 space-y-2.5">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-xs font-bold text-amber-900">
                          {cloudStatus.missingTables.length} tablas pendientes de creación en Supabase
                        </p>
                        <p className="text-[11px] text-amber-700 mt-0.5 leading-relaxed">
                          Por esta razón las nuevas ventanas (Finanzas, Guías GRE, Cotizaciones, etc.) aún no reflejan sus datos en la nube. Debes ejecutar el script SQL maestro en tu panel de Supabase.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={handleCopySql}
                        className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>{copiedSql ? '¡SQL Tablas Copiado!' : '1. Copiar SQL Tablas (Fase 1)'}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleCopyRlsSql}
                        className="px-3 py-1.5 bg-[#FF6B35] hover:bg-[#E85B28] text-white font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition shadow-xs"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>{copiedRlsSql ? '¡SQL Seguridad Copiado!' : '2. Copiar SQL Seguridad RLS (Fase 2)'}</span>
                      </button>

                      <a
                        href="https://supabase.com/dashboard/project/zeftqkwnogcrbklolwzs/sql"
                        target="_blank"
                        rel="noreferrer"
                        className="px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-bold text-[11px] rounded-lg flex items-center gap-1.5 transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                        <span>Abrir SQL Editor Supabase</span>
                      </a>

                      <button
                        type="button"
                        onClick={handleDownloadSql}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[11px] rounded-lg flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar Tablas .SQL</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleDownloadRlsSql}
                        className="px-2.5 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-[11px] rounded-lg flex items-center gap-1 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Descargar RLS .SQL</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* DETALLE DESPLEGABLE DE TABLAS */}
                {cloudStatus && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowTablesDetail(!showTablesDetail)}
                      className="text-[11px] font-bold text-[#E85B28] hover:text-[#1E2022] flex items-center gap-1 transition"
                    >
                      <span>{showTablesDetail ? 'Ocultar listado de tablas' : 'Ver listado detallado de tablas (30 tablas)'}</span>
                      {showTablesDetail ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>

                    {showTablesDetail && (
                      <div className="mt-2 p-2.5 bg-slate-50 rounded-xl border border-slate-200 max-h-48 overflow-y-auto space-y-2 text-[11px]">
                        <div>
                          <span className="font-bold text-[#E85B28] flex items-center gap-1 mb-1">
                            <CheckCircle2 size={12} /> Tablas activas en Supabase ({cloudStatus.existingTables.length}):
                          </span>
                          <div className="flex flex-wrap gap-1">
                            {cloudStatus.existingTables.map(t => (
                              <span key={t} className="px-1.5 py-0.5 bg-[#FF6B35]/20 text-[#1E2022] rounded text-[10px] font-mono">
                                {t}
                              </span>
                            ))}
                          </div>
                        </div>

                        {cloudStatus.missingTables.length > 0 && (
                          <div className="pt-1.5 border-t border-slate-200">
                            <span className="font-bold text-amber-700 flex items-center gap-1 mb-1">
                              <AlertTriangle size={12} /> Tablas por crear en Supabase ({cloudStatus.missingTables.length}):
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {cloudStatus.missingTables.map(t => (
                                <span key={t} className="px-1.5 py-0.5 bg-amber-100 text-amber-800 rounded text-[10px] font-mono">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                
                {/* RESULTADO DE LA ÚLTIMA SINCRONIZACIÓN */}
                {syncResult && (
                  <div className={`p-3 rounded-xl text-[11px] font-medium space-y-1.5 ${
                    syncResult.success 
                      ? 'bg-[#FF6B35]/10 border border-[#FF6B35]/20 text-[#1E2022]' 
                      : 'bg-amber-50 border border-amber-200 text-amber-900'
                  }`}>
                    <div className="flex items-center justify-between">
                      <p className="font-bold flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-[#FF6B35]" /> Sincronización Ejecutada
                      </p>
                      <span className="text-[10px] opacity-75 font-mono">
                        {new Date().toLocaleTimeString()}
                      </span>
                    </div>

                    {syncResult.summary && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-1 pt-1 text-[10px]">
                        <div>Ventas: <span className="font-bold">{syncResult.summary.ventas}</span></div>
                        <div>Productos: <span className="font-bold">{syncResult.summary.productos}</span></div>
                        <div>Clientes: <span className="font-bold">{syncResult.summary.clientes}</span></div>
                        <div>Proveedores: <span className="font-bold">{syncResult.summary.proveedores}</span></div>
                        <div>Compras: <span className="font-bold">{syncResult.summary.compras}</span></div>
                        <div>Kardex: <span className="font-bold">{syncResult.summary.kardex}</span></div>
                        <div>Caja Chica: <span className="font-bold">{syncResult.summary.caja_chica}</span></div>
                        <div>Sesiones Caja: <span className="font-bold">{syncResult.summary.sesiones_caja}</span></div>
                        <div>Ingresos: <span className="font-bold">{syncResult.summary.ingresos_caja}</span></div>
                        <div>Egresos: <span className="font-bold">{syncResult.summary.egresos_caja}</span></div>
                        <div>Ctas. Bancarias: <span className="font-bold">{syncResult.summary.cuentas_bancarias}</span></div>
                        <div>Ctas. Cobrar: <span className="font-bold">{syncResult.summary.cuentas_por_cobrar}</span></div>
                        <div>Ctas. Pagar: <span className="font-bold">{syncResult.summary.cuentas_por_pagar}</span></div>
                        <div>Guías Remitente: <span className="font-bold">{syncResult.summary.guias_remitente}</span></div>
                        <div>Cotizaciones: <span className="font-bold">{syncResult.summary.cotizaciones}</span></div>
                      </div>
                    )}

                    {syncResult.summary?.errors?.length > 0 && (
                      <div className="mt-2 pt-2 border-t border-amber-200 text-[10px] text-amber-800">
                        <p className="font-bold mb-0.5">Advertencia ({syncResult.summary.errors.length} tablas no creadas en Supabase):</p>
                        <p>Ejecuta el script SQL maestro en Supabase para que estas tablas se guarden en la nube.</p>
                      </div>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSyncSupabase}
                  disabled={syncing}
                  className="w-full py-2.5 px-3 bg-[#FF6B35] hover:bg-[#FF6B35] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Sincronizando todas las entidades con Supabase...' : 'Sincronizar Todas las Tablas con Supabase Ahora'}</span>
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <HardDrive className="w-5 h-5 text-[#FF6B35]" />
                  <h3 className="font-bold text-sm text-slate-800">Respaldos & Seguridad</h3>
                </div>
                <p className="text-xs text-slate-500">
                  Descarga una copia completa de tus datos para resguardo fuera de línea.
                </p>
                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={exportLibroVentasRCV}
                    className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-between border border-slate-200 transition"
                  >
                    <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" /> Libro de Ventas RCV (SIAT / SIN)</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportJSON}
                    className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-between border border-slate-200 transition"
                  >
                    <span>Copia de Seguridad (.JSON)</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-slate-800 font-bold text-xs rounded-xl flex items-center justify-between border border-slate-200 transition"
                  >
                    <span>Ventas en Excel (.CSV)</span>
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}



