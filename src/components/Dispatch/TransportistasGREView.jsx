import React, { useState, useEffect } from 'react';
import { Truck, Plus, Search, X, CheckCircle2, Building2 } from 'lucide-react';
import { db } from '../../db/dexie';

export default function TransportistasGREView() {
  const [transportistas, setTransportistas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  const [formDoc, setFormDoc] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formMtc, setFormMtc] = useState('');
  const [formEstado, setFormEstado] = useState('Activo');

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    try {
      if (db.transportistas_gre) {
        const list = await db.transportistas_gre.toArray();
        setTransportistas(list);
      }
    } catch (err) {
      console.error('Error loading transportistas_gre:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveTransportista = async (e) => {
    e.preventDefault();
    if (!formDoc || !formNombre) {
      showToast('Por favor completa Documento y Nombre');
      return;
    }

    const newTrans = {
      id: `trans-${Date.now()}`,
      documento: formDoc,
      nombre: formNombre.toUpperCase(),
      mtc: formMtc || 'MTC-SCZ-001',
      estado: formEstado
    };

    try {
      if (db.transportistas_gre) {
        await db.transportistas_gre.add(newTrans);
      }
      setTransportistas([...transportistas, newTrans]);
      setIsModalOpen(false);
      setFormDoc('');
      setFormNombre('');
      setFormMtc('');
      setFormEstado('Activo');
      showToast('Transportista registrado exitosamente');
    } catch (err) {
      console.error('Error saving transportista:', err);
      showToast('Error al registrar transportista');
    }
  };

  const filtered = transportistas.filter(t => 
    t.documento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.mtc && t.mtc.toLowerCase().includes(searchTerm.toLowerCase()))
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

      {/* ── CABECERA EXACTA A media_1789932575539.png ── */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-start gap-2.5">
            <div className="p-2 bg-emerald-50 text-[#00a650] rounded-xl shrink-0 mt-0.5">
              <Truck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                Transportistas GRE
              </h1>
              <p className="text-xs text-slate-500">
                Catálogo para guías de remisión (transporte público).
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2.5 bg-[#00a650] hover:bg-[#008f45] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer self-start sm:self-auto"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nuevo transportista</span>
          </button>
        </div>

        {/* Buscador exacto a la imagen */}
        <div className="relative max-w-sm">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por RUC o razón social..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        {/* Tabla de Transportistas */}
        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">DOCUMENTO</th>
                <th className="py-3 px-4">NOMBRE</th>
                <th className="py-3 px-4">MTC</th>
                <th className="py-3 px-4">ESTADO</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-xs text-slate-400 font-normal">
                    No hay transportistas registrados
                  </td>
                </tr>
              ) : (
                filtered.map((t) => (
                  <tr key={t.id} className="hover:bg-slate-50 transition">
                    <td className="py-3 px-4 font-mono font-bold text-slate-700 whitespace-nowrap">
                      {t.documento}
                    </td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {t.nombre}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-600">
                      {t.mtc}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                        t.estado === 'Activo' 
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {t.estado}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: NUEVO TRANSPORTISTA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#00a650] flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Nuevo Transportista GRE</h3>
                  <p className="text-[11px] text-slate-500">Registro de transportista para servicio público</p>
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

            <form onSubmit={handleSaveTransportista} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-600 font-bold block mb-1">RUC / NIT *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. 20556677881"
                  value={formDoc}
                  onChange={(e) => setFormDoc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Razón Social / Nombre *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. TRANS LOGÍSTICA BOLIVIA S.R.L."
                  value={formNombre}
                  onChange={(e) => setFormNombre(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Nro. Registro MTC / Tránsito</label>
                <input
                  type="text"
                  placeholder="Ej. MTC-SCZ-8821"
                  value={formMtc}
                  onChange={(e) => setFormMtc(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
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
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
