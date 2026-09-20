import React, { useState, useEffect } from 'react';
import { 
  CreditCard, Plus, Edit2, Trash2, Check, X, Shield, Wallet, Building2, AlertCircle 
} from 'lucide-react';
import { db } from '../../db/dexie';
import FinanceSubNav from './FinanceSubNav';

export default function MetodosPagoView({ onSelectSubView }) {
  const [metodos, setMetodos] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMetodo, setEditingMetodo] = useState(null);

  // Form
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDestino, setFormDestino] = useState('Caja'); // 'Caja' | 'Cuenta bancaria'
  const [formEstado, setFormEstado] = useState('Activo');
  const [toastMsg, setToastMsg] = useState(null);

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadMetodos = async () => {
    try {
      if (db.metodos_pago) {
        const list = await db.metodos_pago.toArray();
        setMetodos(list || []);
      }
    } catch (err) {
      console.warn('Error al cargar metodos de pago:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetodos();
  }, []);

  const handleOpenNew = () => {
    setEditingMetodo(null);
    setFormNombre('');
    setFormCodigo('');
    setFormDestino('Cuenta bancaria');
    setFormEstado('Activo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (m) => {
    setEditingMetodo(m);
    setFormNombre(m.nombre);
    setFormCodigo(m.codigo);
    setFormDestino(m.destino);
    setFormEstado(m.estado);
    setIsModalOpen(true);
  };

  const handleSaveMetodo = async (e) => {
    e.preventDefault();
    if (!formNombre) return;

    if (editingMetodo) {
      await db.metodos_pago.update(editingMetodo.id, {
        nombre: formNombre,
        codigo: formCodigo || formNombre.toLowerCase().replace(/\s+/g, '_'),
        destino: formDestino,
        estado: formEstado
      });
      showToast('Método de pago actualizado');
    } else {
      const newMetodo = {
        id: `mp-${Date.now()}`,
        nombre: formNombre,
        codigo: formCodigo || formNombre.toLowerCase().replace(/\s+/g, '_'),
        destino: formDestino,
        destinoId: formDestino === 'Caja' ? null : '1',
        estado: formEstado,
        isProtected: false
      };
      await db.metodos_pago.add(newMetodo);
      showToast('Nuevo método de pago agregado');
    }

    setIsModalOpen(false);
    loadMetodos();
  };

  const handleDeleteMetodo = async (id, nombre, isProtected) => {
    if (isProtected) {
      showToast('Este método de pago es requerido por el sistema y no puede eliminarse');
      return;
    }

    if (window.confirm(`¿Está seguro de eliminar el método de pago "${nombre}"?`)) {
      await db.metodos_pago.delete(id);
      showToast('Método de pago eliminado');
      loadMetodos();
    }
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Subnavegación Superior de Finanzas */}
      <FinanceSubNav activeTab="metodos_pago" onSelectTab={onSelectSubView} />

      {/* Header Principal */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 tracking-tight">Métodos de pago</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure cómo se registran los pagos: en caja o en cuenta bancaria
          </p>
        </div>

        <button
          onClick={handleOpenNew}
          className="px-4 py-2.5 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center gap-1.5 self-start md:self-auto active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo método</span>
        </button>
      </div>

      {/* Tabla de Métodos de Pago (Diseño idéntico a media_1789925791176.png) */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50/75 border-b border-slate-200/80 text-[10px] font-black uppercase text-slate-500 tracking-wider">
                <th className="py-3 px-4">Nombre</th>
                <th className="py-3 px-4">Código</th>
                <th className="py-3 px-4">Destino</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {metodos.map((m) => (
                <tr key={m.id} className="hover:bg-slate-50/70 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-800 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-slate-300"></span>
                    <span>{m.nombre}</span>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                    {m.codigo}
                  </td>
                  <td className="py-3.5 px-4">
                    {m.destino === 'Caja' ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-blue-50 text-blue-700 border border-blue-200/60">
                        <Wallet className="w-3.5 h-3.5" />
                        Caja
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                        <Building2 className="w-3.5 h-3.5" />
                        Cuenta bancaria
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {m.estado}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleOpenEdit(m)}
                        className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>

                      {!m.isProtected ? (
                        <button
                          onClick={() => handleDeleteMetodo(m.id, m.nombre, m.isProtected)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-300" title="Protegido por el sistema">
                          <Shield className="w-4 h-4" />
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nuevo / Editar Método */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#00a650] text-white flex items-center justify-center font-bold">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">
                    {editingMetodo ? 'Editar Método de Pago' : 'Nuevo Método de Pago'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Destino de flujo en caja o banco</p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveMetodo} className="p-4 space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Método</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Billetera Tunki, Apple Pay, Cheque"
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium focus:outline-hidden focus:ring-2 focus:ring-[#00a650]/20 focus:border-[#00a650]"
                  autoFocus
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código de Sistema</label>
                <input
                  type="text"
                  placeholder="Ej. tunki, apple_pay"
                  value={formCodigo}
                  onChange={(e) => setFormCodigo(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-slate-700"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Destino de Registro</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setFormDestino('Caja')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      formDestino === 'Caja'
                        ? 'border-blue-600 bg-blue-50/50 text-blue-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Wallet className="w-4 h-4 text-blue-600" />
                    <div>
                      <div className="text-xs">Caja</div>
                      <div className="text-[10px] text-slate-400 font-normal">Afecta arqueo físico</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setFormDestino('Cuenta bancaria')}
                    className={`p-3 rounded-xl border text-left transition flex items-center gap-2 ${
                      formDestino === 'Cuenta bancaria'
                        ? 'border-emerald-600 bg-emerald-50/50 text-emerald-900 font-bold'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <Building2 className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs">Cuenta bancaria</div>
                      <div className="text-[10px] text-slate-400 font-normal">Depósito o billetera</div>
                    </div>
                  </button>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Estado</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-medium text-slate-700"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl text-slate-600 font-bold hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a650] hover:bg-[#009245] text-white rounded-xl font-bold shadow-sm"
                >
                  Guardar Método
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Toast */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}
    </div>
  );
}
