import React, { useState, useEffect } from 'react';
import { 
  CreditCard, RotateCw, Plus, ChevronDown, Search, X, 
  CheckCircle2, Clock, Trash2, Edit, AlertCircle, Calendar
} from 'lucide-react';
import SalesSubNav from './SalesSubNav';
import { db } from '../../db/dexie';

export default function MembresiasView({ onSelectSubView }) {
  const [membresias, setMembresias] = useState([]);
  const [filterEstado, setFilterEstado] = useState('TODOS'); // 'TODOS', 'ACTIVA', 'PAUSADA', 'VENCIDA'
  const [sucursal, setSucursal] = useState('TODAS');
  const [searchCliente, setSearchCliente] = useState('');
  const [proximoCobro, setProximoCobro] = useState('TODOS');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form State
  const [clientList, setClientList] = useState([]);
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_doc: '',
    plan_nombre: 'Membresía Mensual VIP',
    sucursal: 'Principal',
    monto_cuota: '150.00',
    frecuencia: 'Mensual',
    fecha_inicio: new Date().toISOString().split('T')[0],
    proximo_cobro: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    estado: 'Activa'
  });

  const loadData = async () => {
    setIsRefreshing(true);
    try {
      const saved = localStorage.getItem('glorypos_membresias_v2');
      if (saved) {
        setMembresias(JSON.parse(saved));
      } else {
        setMembresias([]);
      }
      const clients = await db.clientes.toArray();
      setClientList(clients);
    } catch (e) {
      console.warn('Error loading membresias:', e);
    } finally {
      setTimeout(() => setIsRefreshing(false), 350);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const formatSoles = (amount) => {
    const val = Number(amount) || 0;
    return `S/ ${val.toFixed(2)}`;
  };

  // Filtrado
  const filtered = membresias.filter(m => {
    // Filtro por Estado
    if (filterEstado !== 'TODOS' && m.estado?.toUpperCase() !== filterEstado) {
      return false;
    }
    // Filtro por Sucursal
    if (sucursal !== 'TODAS' && m.sucursal?.toUpperCase() !== sucursal) {
      return false;
    }
    // Filtro por Cliente
    if (searchCliente.trim()) {
      const q = searchCliente.toLowerCase();
      const matchCli = m.cliente_nombre?.toLowerCase().includes(q) || m.cliente_doc?.toLowerCase().includes(q);
      if (!matchCli) return false;
    }
    return true;
  });

  const handleCreate = (e) => {
    e.preventDefault();
    if (!formData.cliente_nombre.trim()) {
      alert('Por favor ingresa el nombre del cliente');
      return;
    }

    const nueva = {
      id: `mem-${Date.now()}`,
      cliente_nombre: formData.cliente_nombre.trim(),
      cliente_doc: formData.cliente_doc.trim() || 'S/N',
      plan_nombre: formData.plan_nombre.trim(),
      sucursal: formData.sucursal,
      monto_cuota: Number(formData.monto_cuota) || 0,
      frecuencia: formData.frecuencia,
      fecha_inicio: formData.fecha_inicio,
      proximo_cobro: formData.proximo_cobro,
      estado: formData.estado || 'Activa'
    };

    const updated = [nueva, ...membresias];
    setMembresias(updated);
    localStorage.setItem('glorypos_membresias_v2', JSON.stringify(updated));
    setIsModalOpen(false);
    setFormData({
      cliente_nombre: '',
      cliente_doc: '',
      plan_nombre: 'Membresía Mensual VIP',
      sucursal: 'Principal',
      monto_cuota: '150.00',
      frecuencia: 'Mensual',
      fecha_inicio: new Date().toISOString().split('T')[0],
      proximo_cobro: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
      estado: 'Activa'
    });
  };

  const handleDelete = (id) => {
    if (window.confirm('¿Deseas eliminar este registro de membresía?')) {
      const updated = membresias.filter(m => m.id !== id);
      setMembresias(updated);
      localStorage.setItem('glorypos_membresias_v2', JSON.stringify(updated));
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans pb-16">
      
      {/* Sub-navegación si se navega desde Ventas */}
      {onSelectSubView && (
        <SalesSubNav currentSubView="membresias" onSelectSubView={onSelectSubView} />
      )}

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1. CABECERA: TÍTULO, SELECTOR DE ESTADOS & BOTÓN NUEVA MEMBRESÍA     */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          
          {/* Left: Icono verde y Título */}
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-emerald-600" />
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Membresías y cuotas
            </h1>
          </div>

          {/* Right: Filtro Estado, Botón Actualizar & Botón Nueva Membresía */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            
            {/* Dropdown: Todos los estados ⌄ */}
            <div className="relative">
              <select
                value={filterEstado}
                onChange={e => setFilterEstado(e.target.value)}
                className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos los estados</option>
                <option value="ACTIVA">Activas</option>
                <option value="PAUSADA">Pausadas</option>
                <option value="VENCIDA">Vencidas</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Botón Actualizar */}
            <button
              type="button"
              onClick={loadData}
              disabled={isRefreshing}
              className="px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 font-medium text-xs rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <RotateCw className={`w-3.5 h-3.5 text-slate-500 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Actualizar</span>
            </button>

            {/* Botón Principal: + Nueva membresía */}
            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-4 py-2 bg-[#00a650] hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm rounded-lg shadow-2xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nueva membresía</span>
            </button>

          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2. BARRA DE FILTROS: SUCURSAL, CLIENTE & PRÓXIMO COBRO               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
          
          {/* Campo 1: SUCURSAL (2 cols) */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              SUCURSAL
            </label>
            <div className="relative">
              <select
                value={sucursal}
                onChange={e => setSucursal(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="TODAS">Todas</option>
                <option value="PRINCIPAL">Principal</option>
                <option value="ALMACEN">Almacén</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Campo 2: CLIENTE (8 cols) */}
          <div className="sm:col-span-8 space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              CLIENTE
            </label>
            <input
              type="text"
              value={searchCliente}
              onChange={e => setSearchCliente(e.target.value)}
              placeholder="Nombre, razón social o documento..."
              className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 placeholder-slate-400 shadow-2xs focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Campo 3: PRÓXIMO COBRO (2 cols) */}
          <div className="sm:col-span-2 space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
              PRÓXIMO COBRO
            </label>
            <div className="relative">
              <select
                value={proximoCobro}
                onChange={e => setProximoCobro(e.target.value)}
                className="w-full appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-7 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
              >
                <option value="TODOS">Todos</option>
                <option value="HOY">Hoy</option>
                <option value="SEMANA">Esta semana</option>
                <option value="MES">Este mes</option>
                <option value="VENCIDOS">Vencidos</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 3. PANEL CONTENEDOR DE DATOS CON TOTAL Y ESTADO VACÍO               */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs p-4 sm:p-6 min-h-[300px] flex flex-col justify-start">
          
          {/* Contador superior izquierdo: Total: X */}
          <div className="text-xs text-slate-400 font-semibold mb-4">
            Total: {filtered.length}
          </div>

          {/* Estado vacío cuando no hay membresías */}
          {filtered.length === 0 && (
            <div className="flex-1 flex items-center justify-center py-16 text-center">
              <p className="text-sm text-slate-500 font-medium">
                No hay membresías registradas.
              </p>
            </div>
          )}

          {/* Tabla cuando existen membresías */}
          {filtered.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                  <tr>
                    <th className="py-2.5 px-4">CLIENTE</th>
                    <th className="py-2.5 px-4">MEMBRESÍA / PLAN</th>
                    <th className="py-2.5 px-4">SUCURSAL</th>
                    <th className="py-2.5 px-4 text-right">MONTO / CUOTA</th>
                    <th className="py-2.5 px-4 text-center">FRECUENCIA</th>
                    <th className="py-2.5 px-4 text-center">PRÓXIMO COBRO</th>
                    <th className="py-2.5 px-4 text-center">ESTADO</th>
                    <th className="py-2.5 px-4 text-center">ACCIONES</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filtered.map(mem => (
                    <tr key={mem.id} className="hover:bg-slate-50/60 transition">
                      <td className="py-3 px-4 font-semibold text-slate-900">
                        {mem.cliente_nombre}
                        <span className="text-[10px] text-slate-400 font-normal block">Doc: {mem.cliente_doc}</span>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-700">{mem.plan_nombre}</td>
                      <td className="py-3 px-4 text-slate-500">{mem.sucursal}</td>
                      <td className="py-3 px-4 text-right font-bold text-slate-900">{formatSoles(mem.monto_cuota)}</td>
                      <td className="py-3 px-4 text-center text-slate-600">{mem.frecuencia}</td>
                      <td className="py-3 px-4 text-center text-slate-600 font-mono text-[11px]">{mem.proximo_cobro}</td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          mem.estado === 'Activa' 
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {mem.estado}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleDelete(mem.id)}
                          className="p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

        </div>

      </main>

      {/* ══════════════════════════════════════════════════════════════════ */}
      {/* 4. MODAL: REGISTRAR NUEVA MEMBRESÍA                                 */}
      {/* ══════════════════════════════════════════════════════════════════ */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden border border-slate-200">
            
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-[#00a650] text-white">
              <div className="flex items-center gap-2">
                <CreditCard className="w-5 h-5" />
                <h3 className="font-bold text-base">Nueva Membresía / Cuota</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition cursor-pointer"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="p-5 space-y-4 text-xs">
              <div>
                <label className="text-slate-700 font-bold block mb-1">Cliente *</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre completo o razón social"
                  value={formData.cliente_nombre}
                  onChange={e => setFormData({ ...formData, cliente_nombre: e.target.value })}
                  list="clients-list"
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
                <datalist id="clients-list">
                  {clientList.map(c => (
                    <option key={c.id} value={c.razon_social} />
                  ))}
                </datalist>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Documento (DNI/RUC)</label>
                  <input
                    type="text"
                    placeholder="Doc identidad"
                    value={formData.cliente_doc}
                    onChange={e => setFormData({ ...formData, cliente_doc: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Sucursal</label>
                  <select
                    value={formData.sucursal}
                    onChange={e => setFormData({ ...formData, sucursal: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Principal">Principal</option>
                    <option value="Almacén">Almacén</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-slate-700 font-bold block mb-1">Nombre del Plan / Cuota *</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Membresía Mensual VIP, Cuota Club"
                  value={formData.plan_nombre}
                  onChange={e => setFormData({ ...formData, plan_nombre: e.target.value })}
                  className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Monto de la Cuota (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.monto_cuota}
                    onChange={e => setFormData({ ...formData, monto_cuota: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Frecuencia</label>
                  <select
                    value={formData.frecuencia}
                    onChange={e => setFormData({ ...formData, frecuencia: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Mensual">Mensual</option>
                    <option value="Quincenal">Quincenal</option>
                    <option value="Anual">Anual</option>
                    <option value="Semanal">Semanal</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={formData.fecha_inicio}
                    onChange={e => setFormData({ ...formData, fecha_inicio: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-700 font-bold block mb-1">Próximo Cobro</label>
                  <input
                    type="date"
                    value={formData.proximo_cobro}
                    onChange={e => setFormData({ ...formData, proximo_cobro: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl font-bold transition"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#00a650] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
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
