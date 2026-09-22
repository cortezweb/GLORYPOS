import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, Users, Building2, Printer, Save, CheckCircle2, 
  Settings, Download, FileSpreadsheet, HardDrive, Cloud, RefreshCw
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { exportLibroVentasRCV } from '../../utils/rcvExport';
import { syncService } from '../../services/syncService';
import { isSupabaseConfigured } from '../../lib/supabase';
import RolesPermisosTab from './RolesPermisosTab';
import UsuariosTab from './UsuariosTab';

export default function AdministracionView({ initialTab = 'roles' }) {
  const { empresa } = useAuth();
  const [activeTab, setActiveTab] = useState(initialTab);
  const [saved, setSaved] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncResult, setSyncResult] = useState(null);

  const handleSyncSupabase = async () => {
    setSyncing(true);
    setSyncResult(null);
    try {
      const res = await syncService.syncLocalToCloud();
      setSyncResult(res);
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

  const [formData, setFormData] = useState({
    nombre: empresa?.nombre || '',
    nit_ci: empresa?.nit_ci || '',
    propietario: empresa?.propietario || '',
    ciudad: empresa?.ciudad || '',
    direccion: empresa?.direccion || '',
    telefono: empresa?.telefono || ''
  });

  const handleSave = async (e) => {
    e.preventDefault();
    await db.config_empresa.update('empresa_activa', formData);
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
              ? 'bg-[#10b981] text-white shadow-xs'
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
              ? 'bg-[#10b981] text-white shadow-xs'
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
              ? 'bg-[#10b981] text-white shadow-xs'
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
                <Building2 className="w-5 h-5 text-emerald-600" />
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
                  <span className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" /> Datos guardados exitosamente
                  </span>
                )}
                <button
                  type="submit"
                  className="ml-auto px-5 py-2.5 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl shadow-xs transition flex items-center gap-1.5"
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
                  <Printer className="w-5 h-5 text-emerald-600" />
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
                  <span className="px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded font-bold text-[10px]">
                    Activo
                  </span>
                </div>
              </div>

              {/* Sincronización en la Nube con Supabase */}
              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                  <div className="flex items-center space-x-2">
                    <Cloud className="w-5 h-5 text-emerald-600" />
                    <h3 className="font-bold text-sm text-slate-800">Base de Datos Supabase</h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                    isSupabaseConfigured ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {isSupabaseConfigured ? 'Conectado' : 'Sin Configurar'}
                  </span>
                </div>
                <p className="text-xs text-slate-500">
                  Sincronización en la nube en tiempo real de productos, ventas, clientes, kardex, roles y usuarios.
                </p>
                
                {syncResult && (
                  <div className={`p-2.5 rounded-xl text-[11px] font-medium ${
                    syncResult.success 
                      ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                      : 'bg-rose-50 border border-rose-200 text-rose-800'
                  }`}>
                    {syncResult.success ? (
                      <div>
                        <p className="font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> ¡Sincronizado con Supabase!
                        </p>
                        <p className="text-[10px] opacity-80 mt-0.5">
                          Productos: {syncResult.summary?.productos || 0}, Ventas: {syncResult.summary?.ventas || 0}, Clientes: {syncResult.summary?.clientes || 0}
                        </p>
                      </div>
                    ) : (
                      <p>Error: {syncResult.error || 'No se pudo sincronizar'}</p>
                    )}
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleSyncSupabase}
                  disabled={syncing}
                  className="w-full py-2.5 px-3 bg-[#10b981] hover:bg-[#059669] text-white font-bold text-xs rounded-xl flex items-center justify-center gap-2 shadow-xs transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                  <span>{syncing ? 'Sincronizando con Supabase...' : 'Sincronizar con Supabase Ahora'}</span>
                </button>
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
                  <HardDrive className="w-5 h-5 text-emerald-600" />
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
                    <span>📊 Libro de Ventas RCV (SIAT / SIN)</span>
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
