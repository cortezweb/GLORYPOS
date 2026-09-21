import React, { useState, useEffect } from 'react';
import { Car, Plus, Search, Edit2, X, CheckCircle2 } from 'lucide-react';
import { db } from '../../db/dexie';

export default function VehiculosGREView() {
  const [vehiculos, setVehiculos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingVehiculo, setEditingVehiculo] = useState(null);
  const [toastMsg, setToastMsg] = useState(null);

  const [formPlaca, setFormPlaca] = useState('');
  const [formMarca, setFormMarca] = useState('');
  const [formModelo, setFormModelo] = useState('');
  const [formCert, setFormCert] = useState('');
  const [formEstado, setFormEstado] = useState('Activo');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      if (db.vehiculos_gre) {
        const list = await db.vehiculos_gre.toArray();
        setVehiculos(list);
      }
    } catch (err) {
      console.error('Error loading vehiculos_gre:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenCreate = () => {
    setEditingVehiculo(null);
    setFormPlaca('');
    setFormMarca('');
    setFormModelo('');
    setFormCert('');
    setFormEstado('Activo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (v) => {
    setEditingVehiculo(v);
    setFormPlaca(v.placa || '');
    setFormMarca(v.marca || '');
    setFormModelo(v.modelo || '');
    setFormCert(v.cert_habilitacion || '');
    setFormEstado(v.estado || 'Activo');
    setIsModalOpen(true);
  };

  const handleSaveVehiculo = async (e) => {
    e.preventDefault();
    if (!formPlaca || !formMarca) {
      showToast('Por favor completa Placa y Marca');
      return;
    }

    if (editingVehiculo) {
      const updated = {
        ...editingVehiculo,
        placa: formPlaca.toUpperCase(),
        marca: formMarca.toLowerCase(),
        modelo: formModelo.toLowerCase(),
        cert_habilitacion: formCert,
        estado: formEstado
      };

      try {
        if (db.vehiculos_gre) {
          await db.vehiculos_gre.put(updated);
        }
        setVehiculos(vehiculos.map(v => v.id === updated.id ? updated : v));
        setIsModalOpen(false);
        showToast('Vehículo actualizado correctamente');
      } catch (err) {
        console.error('Error updating vehiculo:', err);
        showToast('Error al actualizar vehículo');
      }
    } else {
      const newVeh = {
        id: `veh-${Date.now()}`,
        placa: formPlaca.toUpperCase(),
        marca: formMarca.toLowerCase(),
        modelo: formModelo.toLowerCase(),
        cert_habilitacion: formCert || '64211554',
        estado: formEstado
      };

      try {
        if (db.vehiculos_gre) {
          await db.vehiculos_gre.add(newVeh);
        }
        setVehiculos([...vehiculos, newVeh]);
        setIsModalOpen(false);
        showToast('Vehículo registrado exitosamente');
      } catch (err) {
        console.error('Error creating vehiculo:', err);
        showToast('Error al registrar vehículo');
      }
    }
  };

  const filtered = vehiculos.filter(v => 
    v.placa.toLowerCase().includes(searchTerm.toLowerCase()) ||
    v.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (v.modelo && v.modelo.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* ── CABECERA EXACTA A media_1789932575536.png ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#00a650] rounded-xl shrink-0 mt-0.5">
              <Car className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Vehiculos GRE
              </h1>
              <p className="text-xs text-slate-500">
                Placas y certificado de habilitación vehicular para guias.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="px-4 py-2.5 bg-[#00a650] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo vehiculo</span>
          </button>
        </div>

        {/* Buscador exacto a la imagen */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por placa, marca o modelo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Tabla de Vehículos */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">PLACA</th>
                <th className="py-3 px-4">MARCA</th>
                <th className="py-3 px-4">MODELO</th>
                <th className="py-3 px-4">CERT. HABILITACIÓN</th>
                <th className="py-3 px-4">ESTADO</th>
                <th className="py-3 px-4 text-right"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-xs text-slate-400 font-normal">
                    No hay vehículos registrados
                  </td>
                </tr>
              ) : (
                filtered.map((v) => (
                  <tr key={v.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-800 whitespace-nowrap">
                      {v.placa}
                    </td>
                    <td className="py-3 px-4 text-slate-700 capitalize">
                      {v.marca}
                    </td>
                    <td className="py-3 px-4 text-slate-600 capitalize">
                      {v.modelo}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {v.cert_habilitacion}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        v.estado === 'Activo' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {v.estado}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(v)}
                        className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition cursor-pointer"
                        title="Editar vehículo"
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

      {/* ── MODAL: NUEVO / EDITAR VEHÍCULO ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <Car className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    {editingVehiculo ? 'Editar Vehículo GRE' : 'Nuevo Vehículo GRE'}
                  </h3>
                  <p className="text-[11px] text-slate-500">Unidad de transporte para guías de remisión</p>
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

            <form onSubmit={handleSaveVehiculo} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">Nro. de Placa *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. V2105"
                  value={formPlaca}
                  onChange={(e) => setFormPlaca(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none uppercase font-mono font-bold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Marca *</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hyundai, Toyota"
                    value={formMarca}
                    onChange={(e) => setFormMarca(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Modelo</label>
                  <input
                    type="text"
                    placeholder="Ej. Sedan, Camión 4T"
                    value={formModelo}
                    onChange={(e) => setFormModelo(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Certificado de Habilitación Vehicular</label>
                <input
                  type="text"
                  placeholder="Ej. 64211554"
                  value={formCert}
                  onChange={(e) => setFormCert(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none font-mono"
                />
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
                  {editingVehiculo ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
