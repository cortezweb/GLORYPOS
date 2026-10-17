import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, ShieldCheck, AlertTriangle } from 'lucide-react';
import { db } from '../../db/dexie';
import ModalRol from './ModalRol';

import { DEFAULT_ROLES } from '../../config/permissions';

export default function RolesPermisosTab() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [rolToEdit, setRolToEdit] = useState(null);
  const [rolToDelete, setRolToDelete] = useState(null);

  const loadRoles = async () => {
    try {
      if (db.roles) {
        const storedRoles = await db.roles.toArray();
        if (storedRoles && storedRoles.length > 0) {
          // Detectar si los roles almacenados tienen el esquema antiguo de módulos
          const hasOldScheme = storedRoles.some(r => r.id === 'rol-almacenero' && (!r.permisos.includes('ver_dashboard')));
          if (hasOldScheme) {
            for (const def of DEFAULT_ROLES) {
              await db.roles.put(def);
            }
            const updated = await db.roles.toArray();
            setRoles(updated);
          } else {
            setRoles(storedRoles);
          }
        } else {
          // Si por alguna razón la tabla está vacía, sembrar por defecto
          await db.roles.bulkAdd(DEFAULT_ROLES);
          setRoles(DEFAULT_ROLES);
        }
      } else {
        setRoles(DEFAULT_ROLES);
      }
    } catch (err) {
      console.error('Error cargando roles:', err);
      setRoles(DEFAULT_ROLES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoles();
  }, []);

  const handleOpenNew = () => {
    setRolToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (rol) => {
    setRolToEdit(rol);
    setModalOpen(true);
  };

  const handleDeleteRol = async () => {
    if (!rolToDelete) return;
    try {
      if (db.roles) {
        await db.roles.delete(rolToDelete.id);
      }
      setRoles(prev => prev.filter(r => r.id !== rolToDelete.id));
      setRolToDelete(null);
      window.dispatchEvent(new CustomEvent('glorypos_roles_changed'));
    } catch (err) {
      console.error('Error eliminando rol:', err);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      
      {/* ── 1. ENCABEZADO SUPERIOR (Exacto al Screenshot media_1790120030272.png) ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Roles y Permisos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de acceso por perfil
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#FF6B35] hover:bg-[#FF6B35] text-white font-medium text-xs rounded-lg shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Nuevo rol</span>
        </button>
      </div>

      {/* ── 2. CUADRÍCULA DE TARJETAS (3 columnas x 2 filas) ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-slate-200/80 p-4 h-24 animate-pulse">
              <div className="h-4 bg-slate-200 rounded w-1/2 mb-3"></div>
              <div className="h-3 bg-slate-100 rounded w-3/4"></div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map((rol) => (
            <div
              key={rol.id}
              className="bg-white rounded-xl border border-slate-200/80 p-4 shadow-xs hover:border-slate-300 transition duration-150 flex flex-col justify-between group"
            >
              {/* Línea Superior: Título del Rol y Botones de Acción */}
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-slate-800 text-sm tracking-tight">
                  {rol.nombre}
                </h2>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleOpenEdit(rol)}
                    title={`Editar rol ${rol.nombre}`}
                    className="p-1 text-slate-400 hover:text-[#FF6B35] hover:bg-slate-50 rounded transition"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setRolToDelete(rol)}
                    title={`Eliminar rol ${rol.nombre}`}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-slate-50 rounded transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Línea Inferior: Descripción */}
              <p className="text-xs text-slate-500 mt-2">
                {rol.descripcion || 'Sin descripción'}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── 3. MODAL DE CREACIÓN / EDICIÓN DE ROL ── */}
      <ModalRol
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        rolToEdit={rolToEdit}
        onSaved={() => {
          loadRoles();
        }}
      />

      {/* ── 4. MODAL DE CONFIRMACIÓN DE ELIMINACIÓN ── */}
      {rolToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn overflow-y-auto [&>*]:my-auto">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              ¿Eliminar rol "{rolToDelete.nombre}"?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              Esta acción no se puede deshacer. Los usuarios que tengan asignado este rol podrían perder acceso a los módulos configurados.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setRolToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteRol}
                className="px-4 py-2 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-xs transition"
              >
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}


