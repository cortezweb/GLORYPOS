import React, { useState } from 'react';
import { Settings, Building2, Printer, Users, ShieldCheck, Save, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../db/dexie';
import { exportLibroVentasRCV } from '../../utils/rcvExport';

export default function AdministracionView() {
  const { empresa } = useAuth();
  const [saved, setSaved] = useState(false);

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
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Administración & Configuración</h1>
          <p className="text-xs text-slate-500">Parámetros de tu negocio, datos fiscales, hardware e impresoras.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Company profile form */}
        <form onSubmit={handleSave} className="lg:col-span-2 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center space-x-2 pb-3 border-b border-slate-100">
            <Building2 className="w-5 h-5 text-blue-600" />
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
              className="ml-auto px-5 py-2.5 bg-gradient-to-r from-blue-600 to-[#7c3aed] text-white font-bold text-xs rounded-xl shadow-md hover:opacity-95 transition flex items-center gap-1.5"
            >
              <Save className="w-4 h-4" />
              <span>Guardar Configuración</span>
            </button>
          </div>
        </form>

        {/* Hardware & Printers */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Printer className="w-5 h-5 text-blue-600" />
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

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <Users className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Usuarios & Permisos</h3>
            </div>
            <p className="text-xs text-slate-500">
              Cajeros asignados al turno actual.
            </p>
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div className="leading-tight">
                <span className="font-bold text-slate-800 block">{formData.propietario}</span>
                <span className="text-slate-400 text-[10px]">Administrador General</span>
              </div>
              <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded font-bold text-[10px]">
                Turno 1
              </span>
            </div>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <div className="flex items-center space-x-2 pb-2 border-b border-slate-100">
              <ShieldCheck className="w-5 h-5 text-blue-600" />
              <h3 className="font-bold text-sm text-slate-800">Respaldos & Seguridad de Datos</h3>
            </div>
            <p className="text-xs text-slate-500">
              Descarga una copia completa de tu catálogo, clientes y ventas para resguardar tu información fuera de línea.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={exportLibroVentasRCV}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100 text-indigo-900 font-bold text-xs rounded-xl flex items-center justify-between border border-indigo-200 transition shadow-2xs"
              >
                <span>📊 Exportar Libro de Ventas RCV (Formato SIAT / SIN)</span>
                <span>↓</span>
              </button>
              <button
                type="button"
                onClick={handleExportJSON}
                className="w-full py-2.5 px-3 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold text-xs rounded-xl flex items-center justify-between border border-blue-200 transition"
              >
                <span>Descargar Copia de Seguridad (.JSON)</span>
                <span>↓</span>
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-xs rounded-xl flex items-center justify-between border border-emerald-200 transition"
              >
                <span>Exportar Ventas a Excel (.CSV)</span>
                <span>↓</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
