import React, { useState, useEffect, useMemo } from 'react';
import { 
  Ruler, Search, Plus, Edit2, CheckCircle2, X, Check, Trash2 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';
import ProductsSubNav from './ProductsSubNav';

// ── CATÁLOGO SIAT N°03 DE UNIDADES DE MEDIDA ──
const SEED_UNIDADES_MEDIDA = [
  { id: 'u-1', codigo: 'AV', nombre: 'Cápsula', simbolo: 'CAPS', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-2', codigo: 'BE', nombre: 'Fardo', simbolo: 'FARD', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-3', codigo: 'BG', nombre: 'Bolsa', simbolo: 'BOLS', origen: 'Sistema', estado: 'Activa' },
  { id: 'u-4', codigo: 'BJ', nombre: 'Balde', simbolo: 'BALD', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-5', codigo: 'BLL', nombre: 'Barril', simbolo: 'BRL', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-6', codigo: 'BO', nombre: 'Botellas', simbolo: 'BOT', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-7', codigo: 'BT', nombre: 'Tornillo', simbolo: 'TORN', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-8', codigo: 'BX', nombre: 'Caja', simbolo: 'CAJ', origen: 'Sistema', estado: 'Activa' },
  { id: 'u-9', codigo: 'C62', nombre: 'Piezas', simbolo: 'PZ', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-10', codigo: 'CA', nombre: 'Latas', simbolo: 'LT', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-11', codigo: 'CEN', nombre: 'Centenar o ciento', simbolo: 'CTO', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-12', codigo: 'CH', nombre: 'Envase', simbolo: 'ENV', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-13', codigo: 'CMK', nombre: 'Centímetro cuadrado', simbolo: 'CM2', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-14', codigo: 'CMQ', nombre: 'Centímetro cúbico', simbolo: 'CM3', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-15', codigo: 'CMT', nombre: 'Centímetro', simbolo: 'CM', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-16', codigo: 'CT', nombre: 'Cartón', simbolo: 'CTON', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-17', codigo: 'CY', nombre: 'Cilindro', simbolo: 'CIL', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-18', codigo: 'DZN', nombre: 'Docena', simbolo: 'DOC', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-19', codigo: 'DZP', nombre: 'Docena de paquetes', simbolo: 'DOC2', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-20', codigo: 'FOT', nombre: 'Pies', simbolo: 'PIE', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-21', codigo: 'FTK', nombre: 'Pies cuadrados', simbolo: 'PIE2', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-22', codigo: 'FTQ', nombre: 'Pies cúbicos', simbolo: 'PIE3', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-23', codigo: 'GLI', nombre: 'Galón inglés', simbolo: 'GL', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-24', codigo: 'GLL', nombre: 'Galones', simbolo: 'GL', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-25', codigo: 'GRM', nombre: 'Gramos', simbolo: 'GR', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-26', codigo: 'HD', nombre: 'Media docena', simbolo: '1/2 DOC', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-27', codigo: 'HT', nombre: 'Media hora', simbolo: '1/2 H', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-28', codigo: 'HUR', nombre: 'Hora', simbolo: 'HR', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-29', codigo: 'INH', nombre: 'Pulgadas', simbolo: 'INCH', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-30', codigo: 'KGM', nombre: 'Kilogramo', simbolo: 'KG', origen: 'Sistema', estado: 'Activa' },
  { id: 'u-31', codigo: 'LTR', nombre: 'Litro', simbolo: 'LT', origen: 'Sistema', estado: 'Activa' },
  { id: 'u-32', codigo: 'MTR', nombre: 'Metro', simbolo: 'M', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-33', codigo: 'NIU', nombre: 'Unidad', simbolo: 'UND', origen: 'Sistema', estado: 'Activa' },
  { id: 'u-34', codigo: 'SET', nombre: 'Juego / Set', simbolo: 'SET', origen: 'Sistema', estado: 'Inactiva' },
  { id: 'u-35', codigo: 'TNE', nombre: 'Toneladas', simbolo: 'TN', origen: 'Sistema', estado: 'Inactiva' }
];

export default function UnidadesMedidaView({ onSelectSubView }) {
  const [unidades, setUnidades] = useState([]);
  const [search, setSearch] = useState('');
  const [toastMsg, setToastMsg] = useState(null);

  // Modales
  const [isNewModalOpen, setIsNewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingUnidad, setEditingUnidad] = useState(null);

  // Formularios
  const [form, setForm] = useState({
    codigo: '',
    nombre: '',
    simbolo: '',
    estado: 'Activa'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      let list = [];
      if (db.unidades_medida) {
        list = await db.unidades_medida.toArray();
      }
      if (!list || list.length === 0) {
        if (db.unidades_medida) {
          await db.unidades_medida.bulkAdd(SEED_UNIDADES_MEDIDA);
        }
        list = SEED_UNIDADES_MEDIDA;
      }
      setUnidades(list);
    } catch (err) {
      console.warn('Error loading unidades de medida:', err);
      setUnidades(SEED_UNIDADES_MEDIDA);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ── FILTRADO EN TIEMPO REAL ──
  const filteredUnidades = useMemo(() => {
    if (!search.trim()) return unidades;
    const term = search.toLowerCase();
    return unidades.filter(u => 
      u.codigo.toLowerCase().includes(term) ||
      u.nombre.toLowerCase().includes(term) ||
      u.simbolo.toLowerCase().includes(term)
    );
  }, [unidades, search]);

  // ── GUARDAR NUEVA UNIDAD ──
  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.codigo.trim() || !form.nombre.trim()) return;

    const newUnit = {
      id: `u-${Date.now()}`,
      codigo: form.codigo.trim().toUpperCase(),
      nombre: form.nombre.trim(),
      simbolo: form.simbolo.trim().toUpperCase() || form.codigo.trim().toUpperCase(),
      origen: 'Usuario',
      estado: form.estado
    };

    if (db.unidades_medida) {
      await db.unidades_medida.add(newUnit);
    }
    setUnidades(prev => [...prev, newUnit]);
    setIsNewModalOpen(false);
    setForm({ codigo: '', nombre: '', simbolo: '', estado: 'Activa' });
    showToast(`Unidad "${newUnit.nombre}" agregada con éxito.`);
    syncService.triggerBackgroundSync();
  };

  // ── EDITAR UNIDAD ──
  const handleOpenEdit = (u) => {
    setEditingUnidad(u);
    setForm({
      codigo: u.codigo,
      nombre: u.nombre,
      simbolo: u.simbolo,
      estado: u.estado
    });
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingUnidad || !form.nombre.trim()) return;

    const updated = {
      ...editingUnidad,
      nombre: form.nombre.trim(),
      simbolo: form.simbolo.trim().toUpperCase() || editingUnidad.simbolo,
      estado: form.estado
    };

    if (db.unidades_medida) {
      await db.unidades_medida.update(editingUnidad.id, updated);
    }
    setUnidades(prev => prev.map(u => u.id === editingUnidad.id ? updated : u));
    setIsEditModalOpen(false);
    setEditingUnidad(null);
    showToast(`Unidad "${updated.nombre}" actualizada.`);
    syncService.triggerBackgroundSync();
  };

  // ── TOGGLE DIRECTO ACTIVA / INACTIVA ──
  const handleToggleEstado = async (u) => {
    const nuevoEstado = u.estado === 'Activa' ? 'Inactiva' : 'Activa';
    const updated = { ...u, estado: nuevoEstado };

    if (db.unidades_medida) {
      await db.unidades_medida.update(u.id, { estado: nuevoEstado });
    }
    setUnidades(prev => prev.map(item => item.id === u.id ? updated : item));
    showToast(`Unidad "${u.nombre}" marcada como ${nuevoEstado}`);
    syncService.triggerBackgroundSync();
  };

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior de Productos */}
      {onSelectSubView && (
        <ProductsSubNav currentSubView="unidades_medida" onSelectSubView={onSelectSubView} />
      )}

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-xl flex items-center gap-2 text-xs font-semibold animate-slideUp">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 w-full space-y-4">
        
        {/* ── CABECERA EXACTA A LA IMAGEN (CON SIAT) ── */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Ruler className="w-4 h-4 text-emerald-600" />
                <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
                  Unidades de medida
                </h1>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed max-w-4xl">
                Catálogo SIAT (N°03) de tus productos — se usa al crear o editar un producto. Las marcadas "Sistema" vienen precargadas; agrega las tuyas libremente.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                setForm({ codigo: '', nombre: '', simbolo: '', estado: 'Activa' });
                setIsNewModalOpen(true);
              }}
              className="px-4 py-2 bg-[#00a650] hover:bg-[#009245] text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-2xs active:scale-95 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>+ Nueva unidad</span>
            </button>
          </div>

          {/* Buscador */}
          <div className="pt-1">
            <div className="relative w-full sm:max-w-md">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por código, nombre o símbolo..."
                className="w-full pl-9 pr-8 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 shadow-2xs transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── TABLA DE UNIDADES DE MEDIDA (IDÉNTICA AL SCREENSHOT) ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-white">
                  <th className="py-3 px-4">CÓDIGO</th>
                  <th className="py-3 px-4">NOMBRE</th>
                  <th className="py-3 px-4">SÍMBOLO</th>
                  <th className="py-3 px-4">ORIGEN</th>
                  <th className="py-3 px-4">ESTADO</th>
                  <th className="py-3 px-4 text-right"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredUnidades.map((u) => {
                  const isActiva = u.estado === 'Activa';

                  return (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* CÓDIGO */}
                      <td className="py-3 px-4 font-mono font-semibold text-slate-700 whitespace-nowrap">
                        {u.codigo}
                      </td>

                      {/* NOMBRE */}
                      <td className="py-3 px-4 font-medium text-slate-800">
                        {u.nombre}
                      </td>

                      {/* SÍMBOLO */}
                      <td className="py-3 px-4 font-mono font-medium text-slate-600 whitespace-nowrap">
                        {u.simbolo}
                      </td>

                      {/* ORIGEN */}
                      <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                        <span className="text-[11px] font-medium text-slate-400">
                          {u.origen || 'Sistema'}
                        </span>
                      </td>

                      {/* ESTADO */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleToggleEstado(u)}
                          className="cursor-pointer"
                          title="Haga clic para alternar Activa / Inactiva"
                        >
                          {isActiva ? (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700">
                              Activa
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px] font-medium">
                              Inactiva
                            </span>
                          )}
                        </button>
                      </td>

                      {/* ACCIONES (LÁPIZ DE EDICIÓN) */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(u)}
                          title="Editar unidad"
                          className="p-1 text-slate-400 hover:text-emerald-700 rounded hover:bg-slate-100 transition cursor-pointer"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}

                {filteredUnidades.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                      No se encontraron unidades de medida con los filtros aplicados.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pie de página con contador */}
        <p className="text-xs text-slate-400 px-1">
          {filteredUnidades.length} unidades de medida disponibles en el catálogo SIAT.
        </p>

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: NUEVA UNIDAD DE MEDIDA                                      */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isNewModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <Ruler className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Nueva Unidad de Medida</h3>
                  <p className="text-[11px] text-slate-400">Catálogo SIAT N°03</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Código SIAT *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. KGM, LTR, NIU o personalizado"
                  value={form.codigo}
                  onChange={(e) => setForm({ ...form, codigo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre de la Unidad *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Kilogramo, Litro, Caja"
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Símbolo / Abreviatura</label>
                <input
                  type="text"
                  placeholder="Ej. KG, LT, CAJ"
                  value={form.simbolo}
                  onChange={(e) => setForm({ ...form, simbolo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsNewModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#00a650] hover:bg-[#009245] rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Crear Unidad
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* MODAL: EDITAR UNIDAD DE MEDIDA                                     */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isEditModalOpen && editingUnidad && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <Edit2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-sm">Editar Unidad</h3>
                  <p className="text-[11px] text-slate-400 font-mono">Código: {editingUnidad.codigo}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre</label>
                <input
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Símbolo</label>
                <input
                  type="text"
                  value={form.simbolo}
                  onChange={(e) => setForm({ ...form, simbolo: e.target.value.toUpperCase() })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Estado</label>
                <select
                  value={form.estado}
                  onChange={(e) => setForm({ ...form, estado: e.target.value })}
                  className="w-full px-2.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none cursor-pointer"
                >
                  <option value="Activa">Activa</option>
                  <option value="Inactiva">Inactiva</option>
                </select>
              </div>

              <div className="flex gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition shadow-2xs cursor-pointer"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
