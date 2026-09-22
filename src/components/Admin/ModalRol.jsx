import React, { useState, useEffect } from 'react';
import { X, Shield, Check, CheckSquare, Square } from 'lucide-react';
import { db } from '../../db/dexie';

const MODULOS_DISPONIBLES = [
  { id: 'inicio', nombre: 'Inicio & Tablero Resumen', desc: 'Acceso a métricas rápidas del día y accesos directos' },
  { id: 'dashboard', nombre: 'Admin Dashboard SaaS', desc: 'Panel avanzado de métricas y rendimiento' },
  { id: 'preventa', nombre: 'Preventa (Cotizaciones & Pedidos)', desc: 'Crear cotizaciones y pedidos pendientes' },
  { id: 'ventas', nombre: 'Ventas & Facturación POS', desc: 'Caja rápida, emisión de facturas, boletas y notas de venta' },
  { id: 'tienda_virtual', nombre: 'Tienda Virtual & E-commerce', desc: 'Gestión de catálogo online y pedidos por WhatsApp' },
  { id: 'compras', nombre: 'Compras & Proveedores', desc: 'Registro de compras, gastos y directorio de proveedores' },
  { id: 'clientes', nombre: 'Clientes & Cuentas por Cobrar', desc: 'Directorio de clientes y control de créditos' },
  { id: 'productos', nombre: 'Productos, Servicios & Precios', desc: 'Catálogo de productos, combos, categorías y unidades' },
  { id: 'inventario', nombre: 'Inventario & Transferencias', desc: 'Control de existencias, traslados y ajustes de stock' },
  { id: 'finanzas', nombre: 'Finanzas, Caja & Bancos', desc: 'Sesiones de caja, ingresos, egresos y cuentas bancarias' },
  { id: 'guias_remision', nombre: 'Guías de Remisión (GRE)', desc: 'Guías de remitente, transportista, conductores y vehículos' },
  { id: 'documentos_avanzados', nombre: 'Documentos Avanzados', desc: 'Retenciones, percepciones y reversiones' },
  { id: 'contabilidad', nombre: 'Contabilidad & Libros SIAT/PLE', desc: 'Libros oficiales y exportación fiscal' },
  { id: 'reportes', nombre: 'Reportes & Análisis', desc: 'Reportes de ventas, compras, productos, kardex y caja' },
  { id: 'administracion', nombre: 'Administración & Usuarios', desc: 'Gestión de usuarios, perfiles y datos de la empresa' },
  { id: 'modulos', nombre: 'Módulos & Extensiones', desc: 'Configuración de módulos y características adicionales' }
];

export default function ModalRol({ isOpen, onClose, rolToEdit, onSaved }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [permisos, setPermisos] = useState([]);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rolToEdit) {
      setNombre(rolToEdit.nombre || '');
      setDescripcion(rolToEdit.descripcion || '');
      setActivo(rolToEdit.activo !== false);
      setPermisos(Array.isArray(rolToEdit.permisos) ? rolToEdit.permisos : []);
    } else {
      setNombre('');
      setDescripcion('');
      setActivo(true);
      setPermisos(['inicio', 'ventas', 'clientes']);
    }
    setError('');
  }, [rolToEdit, isOpen]);

  if (!isOpen) return null;

  const togglePermiso = (modId) => {
    if (permisos.includes(modId)) {
      setPermisos(permisos.filter(p => p !== modId));
    } else {
      setPermisos([...permisos, modId]);
    }
  };

  const handleSelectAll = () => {
    if (permisos.length === MODULOS_DISPONIBLES.length) {
      setPermisos([]);
    } else {
      setPermisos(MODULOS_DISPONIBLES.map(m => m.id));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const rolData = {
        id: rolToEdit?.id || `rol-${Date.now()}`,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        permisos,
        activo,
        esSistema: rolToEdit?.esSistema || false
      };

      await db.roles.put(rolData);
      if (onSaved) onSaved(rolData);
      onClose();
    } catch (err) {
      console.error('Error guardando rol:', err);
      setError('Ocurrió un error al guardar el rol');
    } finally {
      setGuardando(false);
    }
  };

  const allSelected = permisos.length === MODULOS_DISPONIBLES.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">
                {rolToEdit ? `Editar Rol: ${rolToEdit.nombre}` : 'Nuevo Rol de Usuario'}
              </h2>
              <p className="text-xs text-slate-500">
                Configura los módulos y permisos accesibles para este perfil
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
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 space-y-5">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Nombre del Rol <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Cajero Principal, Supervisor"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Estado
              </label>
              <div className="flex items-center gap-3 pt-2">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activo}
                    onChange={(e) => setActivo(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
                <span className="text-xs font-semibold text-slate-700">
                  {activo ? 'Rol Activo' : 'Rol Inactivo'}
                </span>
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Descripción del perfil
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Acceso completo a caja, arqueos y ventas"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:border-emerald-500 focus:outline-hidden transition"
              />
            </div>
          </div>

          {/* Permisos por Módulo */}
          <div>
            <div className="flex items-center justify-between mb-2.5 pb-2 border-b border-slate-100">
              <div>
                <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Permisos de Acceso a Módulos ({permisos.length}/{MODULOS_DISPONIBLES.length})
                </h3>
                <p className="text-[11px] text-slate-400">
                  Selecciona los módulos a los que los usuarios con este rol tendrán permiso
                </p>
              </div>
              <button
                type="button"
                onClick={handleSelectAll}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1.5 transition"
              >
                {allSelected ? <CheckSquare className="w-4 h-4" /> : <Square className="w-4 h-4" />}
                <span>{allSelected ? 'Desmarcar todos' : 'Marcar todos'}</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {MODULOS_DISPONIBLES.map((mod) => {
                const isSelected = permisos.includes(mod.id);
                return (
                  <div
                    key={mod.id}
                    onClick={() => togglePermiso(mod.id)}
                    className={`p-3 rounded-xl border text-xs cursor-pointer transition select-none flex items-start gap-2.5 ${
                      isSelected
                        ? 'bg-emerald-50/60 border-emerald-300 text-slate-800'
                        : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-md mt-0.5 flex items-center justify-center shrink-0 border transition ${
                        isSelected
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'border-slate-300 bg-white'
                      }`}
                    >
                      {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
                    <div className="min-w-0">
                      <p className={`font-bold ${isSelected ? 'text-emerald-950' : 'text-slate-700'}`}>
                        {mod.nombre}
                      </p>
                      <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                        {mod.desc}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        {/* Footer del Modal */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-800 hover:bg-slate-200/60 rounded-xl transition"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={guardando}
            className="px-5 py-2 text-xs font-bold text-white bg-[#10b981] hover:bg-[#059669] rounded-xl shadow-xs transition flex items-center gap-1.5 disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : rolToEdit ? 'Guardar Cambios' : 'Crear Rol'}
          </button>
        </div>

      </div>
    </div>
  );
}
