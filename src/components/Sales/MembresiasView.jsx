import React, { useState, useEffect } from 'react';
import { 
  Award, Search, Plus, Calendar, CheckCircle2, 
  AlertTriangle, X, User, DollarSign, Clock, RefreshCw,
  Sparkles, Check, Trash2, Phone
} from 'lucide-react';
import { db } from '../../db/dexie';
import SalesSubNav from './SalesSubNav';

const DEFAULT_MEMBRESIAS = [
  {
    id: 'mem-1',
    socio_nombre: 'Rodrigo Mendoza Paz',
    ci_nit: '4829103',
    telefono: '77019283',
    plan: 'Plan Premium Anual',
    fecha_inicio: '2026-01-15',
    fecha_vencimiento: '2027-01-15',
    monto_cuota: 1800.00,
    estado: 'ACTIVO',
    beneficios: 'Acceso total + descuento 15% en compras'
  },
  {
    id: 'mem-2',
    socio_nombre: 'Mariana Suarez Vega',
    ci_nit: '6819201',
    telefono: '78192834',
    plan: 'Membresía Mensual VIP',
    fecha_inicio: '2026-08-01',
    fecha_vencimiento: '2026-09-01',
    monto_cuota: 190.00,
    estado: 'VENCIDO',
    beneficios: 'Entrada ilimitada + locker'
  },
  {
    id: 'mem-3',
    socio_nombre: 'Carlos Villarroel',
    ci_nit: '5910293',
    telefono: '79018273',
    plan: 'Plan Trimestral Familiar',
    fecha_inicio: '2026-07-10',
    fecha_vencimiento: '2026-10-10',
    monto_cuota: 520.00,
    estado: 'ACTIVO',
    beneficios: 'Hasta 4 miembros registrados'
  }
];

export default function MembresiasView({ onSelectSubView }) {
  const [membresias, setMembresias] = useState([]);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('ALL'); // 'ALL', 'ACTIVO', 'VENCIDO'
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form nueva membresía
  const [formSocio, setFormSocio] = useState('');
  const [formCi, setFormCi] = useState('');
  const [formTelefono, setFormTelefono] = useState('');
  const [formPlan, setFormPlan] = useState('Membresía Mensual VIP');
  const [formMonto, setFormMonto] = useState('190.00');
  const [formDias, setFormDias] = useState('30');

  useEffect(() => {
    const saved = localStorage.getItem('glorypos_membresias');
    if (saved) {
      try {
        setMembresias(JSON.parse(saved));
      } catch (e) {
        setMembresias(DEFAULT_MEMBRESIAS);
      }
    } else {
      setMembresias(DEFAULT_MEMBRESIAS);
      localStorage.setItem('glorypos_membresias', JSON.stringify(DEFAULT_MEMBRESIAS));
    }
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formSocio.trim()) return;

    const hoy = new Date();
    const venc = new Date(hoy);
    venc.setDate(venc.getDate() + Number(formDias));

    const nueva = {
      id: `mem-${Date.now()}`,
      socio_nombre: formSocio.trim(),
      ci_nit: formCi.trim() || 'S/N',
      telefono: formTelefono.trim() || 'N/A',
      plan: formPlan,
      fecha_inicio: hoy.toISOString().split('T')[0],
      fecha_vencimiento: venc.toISOString().split('T')[0],
      monto_cuota: Number(formMonto) || 0,
      estado: 'ACTIVO',
      beneficios: 'Acceso autorizado al establecimiento'
    };

    const updated = [nueva, ...membresias];
    setMembresias(updated);
    localStorage.setItem('glorypos_membresias', JSON.stringify(updated));

    setIsModalOpen(false);
    setFormSocio('');
    setFormCi('');
    setFormTelefono('');
  };

  const handleRenovar = (id) => {
    const updated = membresias.map(m => {
      if (m.id === id) {
        const hoy = new Date();
        const venc = new Date(hoy);
        venc.setDate(venc.getDate() + 30);
        return {
          ...m,
          estado: 'ACTIVO',
          fecha_inicio: hoy.toISOString().split('T')[0],
          fecha_vencimiento: venc.toISOString().split('T')[0]
        };
      }
      return m;
    });
    setMembresias(updated);
    localStorage.setItem('glorypos_membresias', JSON.stringify(updated));
  };

  const handleDelete = (id) => {
    if (!window.confirm('¿Deseas eliminar el registro de esta membresía?')) return;
    const updated = membresias.filter(m => m.id !== id);
    setMembresias(updated);
    localStorage.setItem('glorypos_membresias', JSON.stringify(updated));
  };

  const filtered = membresias.filter(m => {
    const textMatch = `${m.socio_nombre} ${m.ci_nit} ${m.plan}`.toLowerCase().includes(search.toLowerCase());
    if (filterEstado === 'ACTIVO') return textMatch && m.estado === 'ACTIVO';
    if (filterEstado === 'VENCIDO') return textMatch && m.estado === 'VENCIDO';
    return textMatch;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans">
      <SalesSubNav currentSubView="membresias" onSelectSubView={onSelectSubView} />

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Award className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Membresías & Suscripciones
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Control de cuotas mensuales, socios afiliados, vencimientos y planes periódicos
            </p>
          </div>

          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 shadow-sm shadow-purple-500/20 active:scale-95 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Membresía</span>
          </button>
        </div>

        {/* 3 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-slate-400">Total Socios / Afiliados</span>
            <div className="text-2xl font-black text-slate-900 font-mono">{membresias.length}</div>
            <p className="text-[10px] text-slate-400">Planes registrados</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-600">Membresías Activas</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {membresias.filter(m => m.estado === 'ACTIVO').length}
            </div>
            <p className="text-[10px] text-slate-400">Al corriente de pago</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-rose-600">Por Vencer / Vencidas</span>
            <div className="text-2xl font-black text-rose-600 font-mono">
              {membresias.filter(m => m.estado === 'VENCIDO').length}
            </div>
            <p className="text-[10px] text-slate-400">Requieren renovación</p>
          </div>
        </div>

        {/* Buscador y Filtros */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterEstado('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEstado === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Todos ({membresias.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado('ACTIVO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEstado === 'ACTIVO' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Activos
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado('VENCIDO')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEstado === 'VENCIDO' ? 'bg-white text-rose-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Vencidos
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar socio, CI o plan..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Lista de Membresías */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(m => {
            const isActivo = m.estado === 'ACTIVO';
            return (
              <div key={m.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 flex flex-col justify-between hover:border-purple-300 transition">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm truncate">{m.socio_nombre}</h3>
                      <p className="text-[10px] text-slate-400 font-mono">CI/NIT: {m.ci_nit}</p>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      isActivo ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {m.estado}
                    </span>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-100 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Plan:</span>
                      <span className="font-bold text-purple-700">{m.plan}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Cuota:</span>
                      <span className="font-mono font-bold text-slate-900">Bs. {Number(m.monto_cuota).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Vencimiento:</span>
                      <span className="font-mono font-bold text-slate-700">{m.fecha_vencimiento}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleRenovar(m.id)}
                    className="flex-1 py-1.5 bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs rounded-xl transition flex items-center justify-center gap-1"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Renovar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(m.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 transition rounded-xl hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="col-span-full py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Award className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No se encontraron membresías</p>
            </div>
          )}
        </div>
      </main>

      {/* Modal Nueva Membresía */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 shadow-2xl border border-slate-200 space-y-4 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-sm font-black text-slate-900">Registrar Nueva Membresía</h3>
              <button 
                type="button" 
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Nombre del Socio *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Rodrigo Mendoza"
                  value={formSocio}
                  onChange={(e) => setFormSocio(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">CI / NIT</label>
                  <input
                    type="text"
                    placeholder="4829102"
                    value={formCi}
                    onChange={(e) => setFormCi(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="77012345"
                    value={formTelefono}
                    onChange={(e) => setFormTelefono(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">Plan / Membresía</label>
                <select
                  value={formPlan}
                  onChange={(e) => setFormPlan(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none"
                >
                  <option value="Membresía Mensual VIP">Membresía Mensual VIP (30 días)</option>
                  <option value="Plan Trimestral Familiar">Plan Trimestral Familiar (90 días)</option>
                  <option value="Plan Premium Anual">Plan Premium Anual (365 días)</option>
                  <option value="Pase Semanal Estudiante">Pase Semanal Estudiante (7 días)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Importe Cuota (Bs.)</label>
                  <input
                    type="number"
                    step="5"
                    value={formMonto}
                    onChange={(e) => setFormMonto(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Duración (Días)</label>
                  <input
                    type="number"
                    value={formDias}
                    onChange={(e) => setFormDias(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-purple-600 hover:bg-purple-700 rounded-xl transition shadow-md shadow-purple-600/20"
                >
                  Guardar Membresía
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
