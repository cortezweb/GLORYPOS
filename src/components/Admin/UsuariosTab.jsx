import React, { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, CheckCircle2, XCircle, Shield, Key, AlertTriangle } from 'lucide-react';
import { db } from '../../db/dexie';
import ModalUsuario from './ModalUsuario';

export default function UsuariosTab() {
  const [usuarios, setUsuarios] = useState([]);
  const [roles, setRoles] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [userToEdit, setUserToEdit] = useState(null);
  const [userToDelete, setUserToDelete] = useState(null);

  const loadData = async () => {
    try {
      const [storedUsers, storedRoles] = await Promise.all([
        db.usuarios ? db.usuarios.toArray() : [],
        db.roles ? db.roles.toArray() : []
      ]);
      setUsuarios(storedUsers || []);
      setRoles(storedRoles || []);
    } catch (err) {
      console.error('Error cargando usuarios:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenNew = () => {
    setUserToEdit(null);
    setModalOpen(true);
  };

  const handleOpenEdit = (user) => {
    setUserToEdit(user);
    setModalOpen(true);
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      if (db.usuarios) {
        await db.usuarios.delete(userToDelete.id);
      }
      setUsuarios(prev => prev.filter(u => u.id !== userToDelete.id));
      setUserToDelete(null);
    } catch (err) {
      console.error('Error eliminando usuario:', err);
    }
  };

  const handleToggleActivo = async (user) => {
    try {
      const nuevoEstado = !user.activo;
      if (db.usuarios) {
        await db.usuarios.update(user.id, { activo: nuevoEstado });
      }
      setUsuarios(prev => prev.map(u => u.id === user.id ? { ...u, activo: nuevoEstado } : u));
    } catch (err) {
      console.error('Error actualizando estado:', err);
    }
  };

  const filteredUsers = usuarios.filter(u => {
    const q = searchTerm.toLowerCase();
    return (
      (u.nombre || '').toLowerCase().includes(q) ||
      (u.email || '').toLowerCase().includes(q) ||
      (u.rol || '').toLowerCase().includes(q)
    );
  });

  const getRoleBadgeColor = (rolName) => {
    const norm = (rolName || '').toLowerCase();
    if (norm.includes('admin')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (norm.includes('cajer')) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
    if (norm.includes('vended')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (norm.includes('supervis')) return 'bg-sky-50 text-sky-700 border-sky-200';
    if (norm.includes('contad')) return 'bg-amber-50 text-amber-700 border-amber-200';
    if (norm.includes('almacen')) return 'bg-teal-50 text-teal-700 border-teal-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-800">
            Usuarios
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión y asignación de perfiles a los miembros del equipo
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenNew}
          className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-[#10b981] hover:bg-[#059669] text-white font-medium text-xs rounded-lg shadow-xs transition active:scale-95 shrink-0"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Nuevo usuario</span>
        </button>
      </div>

      {/* Barra de Filtro */}
      <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 shrink-0 ml-1" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Buscar usuario por nombre, correo electrónico o rol..."
          className="w-full text-xs font-medium text-slate-700 placeholder-slate-400 bg-transparent focus:outline-hidden"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="text-[11px] font-bold text-slate-400 hover:text-slate-600 px-2 py-0.5 rounded"
          >
            Limpiar
          </button>
        )}
      </div>

      {/* Tabla de Usuarios */}
      <div className="bg-white rounded-xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200/70 text-slate-500 font-bold uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Correo Electrónico</th>
                <th className="px-4 py-3">Rol Asignado</th>
                <th className="px-4 py-3 text-center">Acceso PIN</th>
                <th className="px-4 py-3 text-center">Estado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {loading ? (
                <tr>
                  <td colSpan="6" className="text-center py-8 text-slate-400">
                    Cargando usuarios...
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="text-center py-10 text-slate-400">
                    No se encontraron usuarios registrados.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/60 transition">
                    
                    {/* Usuario (Avatar + Nombre) */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
                          {user.nombre?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{user.nombre}</p>
                          <p className="text-[10px] text-slate-400">ID: {user.id}</p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3 text-slate-600 font-mono text-[11px]">
                      {user.email}
                    </td>

                    {/* Rol */}
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeColor(user.rol)}`}>
                        <Shield className="w-3 h-3" />
                        <span>{user.rol || 'Sin Rol'}</span>
                      </span>
                    </td>

                    {/* PIN */}
                    <td className="px-4 py-3 text-center">
                      <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        <Key className="w-3 h-3 text-slate-400" />
                        <span>••••</span>
                      </span>
                    </td>

                    {/* Estado */}
                    <td className="px-4 py-3 text-center">
                      <button
                        type="button"
                        onClick={() => handleToggleActivo(user)}
                        title={user.activo ? 'Clic para desactivar' : 'Clic para activar'}
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                          user.activo
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        {user.activo ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            <span>Activo</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-3 h-3 text-rose-500" />
                            <span>Inactivo</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* Acciones */}
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(user)}
                          title={`Editar ${user.nombre}`}
                          className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>

                        <button
                          type="button"
                          onClick={() => setUserToDelete(user)}
                          title={`Eliminar ${user.nombre}`}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Crear / Editar */}
      <ModalUsuario
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        userToEdit={userToEdit}
        roles={roles}
        onSaved={() => {
          loadData();
        }}
      />

      {/* Modal Confirmar Eliminación */}
      {userToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 border border-slate-200">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center mb-4">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <h3 className="text-base font-bold text-slate-800 mb-1">
              ¿Eliminar usuario "{userToDelete.nombre}"?
            </h3>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              El usuario será retirado del sistema y no podrá volver a iniciar sesión con sus credenciales actuales.
            </p>

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setUserToDelete(null)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleDeleteUser}
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
