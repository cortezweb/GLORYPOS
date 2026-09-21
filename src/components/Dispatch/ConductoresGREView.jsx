import React, { useState, useEffect } from 'react';
import { UserCheck, Plus, Search, Edit2, X, CheckCircle2, Star } from 'lucide-react';
import { db } from '../../db/dexie';

export default function ConductoresGREView() {
  const [conductores, setConductores] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingConductor, setEditingConductor] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [formDoc, setFormDoc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formLicencia, setFormLicencia] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formEstado, setFormEstado] = useState('Activo');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      if (db.conductores_gre) {
        const list = await db.conductores_gre.toArray();
        setConductores(list);
      }
    } catch (err) {
      console.error('Error loading conductores_gre:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingConductor(null);
    setFormDoc('');
    setFormNombre('');
    setFormLicencia('');
    setFormTelefono('');
    setFormEstado('Activo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c) => {
    setEditingConductor(c);
    setFormDoc(c.documento || '');
    setFormNombre(c.nombre || '');
    setFormLicencia(c.licencia || '');
    setFormTelefono(c.telefono || '');
    setFormEstado(c.estado || 'Activo');
    setIsModalOpen(true);
  };

  const handleSaveConductor = async (e) => {
    e.preventDefault();
    if (!formDoc || !formNombre) {
      showToast('Por favor completa Documento y Nombre');
      return;
    }

    if (editingConductor) {
      const updated = {
        ...editingConductor,
        documento: formDoc,
        nombre: formNombre,
        licencia: formLicencia,
        telefono: formTelefono,
        estado: formEstado
      };

      try {
        if (db.conductores_gre) {
          await db.conductores_gre.put(updated);
        }
        setConductores(conductores.map(c => c.id === updated.id ? updated : c));
        setIsModalOpen(false);
        showToast('Conductor actualizado correctamente');
      } catch (err) {
        console.error('Error updating conductor:', err);
        showToast('Error al actualizar conductor');
      }
    } else {
      const newCond = {
        id: `cond-${Date.now()}`,
        documento: formDoc,
        hasStar: true,
        nombre: formNombre,
        licencia: formLicencia,
        telefono: formTelefono,
        estado: formEstado
      };

      try {
        if (db.conductores_gre) {
          await db.conductores_gre.add(newCond);
        }
        setConductores([...conductores, newCond]);
        setIsModalOpen(false);
        showToast('Conductor registrado exitosamente');
      } catch (err) {
        console.error('Error creating conductor:', err);
        showToast('Error al registrar conductor');
      }
    }
  };

  const filtered = conductores.filter(c => 
    c.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (c.licencia && c.licencia.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── CABECERA EXACTA A media_1789932575537.png ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#00a650] rounded-xl shrink-0 mt-0.5">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Conductores GRE
              </h1>
              <p className="text-xs text-slate-500">
                Choferes para traslado privado y guías transportista.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#00a650] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo conductor</span>
          </button>
        </div>

        {/* Buscador exacto a la imagen */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por documento o nombre..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Tabla de Conductores */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">DOCUMENTO</th>
                <th className="py-3 px-4">NOMBRE</th>
                <th className="py-3 px-4">LICENCIA</th>
                <th className="py-3 px-4">TELÉFONO</th>
                <th className="py-3 px-4">ESTADO</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-normal">
                    No hay conductores registrados
                  </td>
                </tr>
              ) : (
                filtered.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span>{c.documento}</span>
                        {c.hasStar && <Star className="w-3 h-3 text-amber-500 fill-amber-500" />}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {c.nombre}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.licencia || '—'}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {c.telefono || '—'}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        c.estado === 'Activo' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {c.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(c)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Editar conductor"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: NUEVO / EDITAR CONDUCTOR ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <UserCheck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingConductor ? 'Editar Conductor GRE' : 'Nuevo Conductor GRE'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Chofer habilitado para guías de remisión</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveConductor} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Documento (NIT / CI / DNI) *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 1-71079426"
                  value={formDoc}
                  onChange={(e) => setFormDoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Nombre Completo *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Juan gabriel quispe huacarpuma"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Licencia de Conducir</label>
                  <input
                    type="text"
                    placeholder="Ej. V710794265"
                    value={formLicencia}
                    onChange={(e) => setFormLicencia(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Ej. 927303279"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Estado</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#008f45] rounded-xl transition shadow-xs cursor-pointer"
                >
                  {editingConductor ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
