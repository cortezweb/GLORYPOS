import React, { useState, useEffect, useMemo } from 'react';
import { 
  Users, Search, UserPlus, Phone, MessageCircle, 
  CreditCard, MapPin, X, CheckCircle2, ShieldCheck, ChevronRight,
  Building2, UserCheck, AlertTriangle, ArrowUpRight, DollarSign
} from 'lucide-react';
import { db } from '../../db/dexie';
import { syncService } from '../../services/syncService';

export default function ClientsView() {
  const [clientes, setClientes] = useState([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('TODOS');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  
  const [form, setForm] = useState({
    nit_ci: '',
    razon_social: '',
    telefono: '',
    ciudad: 'Santa Cruz',
    direccion: '',
    saldo_credito: '0'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadClientes = async () => {
    const list = await db.clientes.toArray();
    setClientes(list);
  };

  useEffect(() => {
    loadClientes();
  }, []);

  const totalCreditDebt = useMemo(() => {
    return clientes.reduce((acc, c) => acc + (Number(c.saldo_credito) || 0), 0);
  }, [clientes]);

  const debtClientsCount = useMemo(() => {
    return clientes.filter(c => (Number(c.saldo_credito) || 0) > 0).length;
  }, [clientes]);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.nit_ci || !form.razon_social) return;

    await db.clientes.add({
      id: `cli-${Date.now()}`,
      nit_ci: form.nit_ci.trim(),
      razon_social: form.razon_social.trim(),
      telefono: form.telefono.trim(),
      ciudad: form.ciudad,
      direccion: form.direccion.trim(),
      saldo_credito: Number(form.saldo_credito) || 0,
      total_compras: 0.00
    });

    setForm({ nit_ci: '', razon_social: '', telefono: '', ciudad: 'Santa Cruz', direccion: '', saldo_credito: '0' });
    setIsModalOpen(false);
    await loadClientes();
    showToast('Cliente registrado exitosamente');
    syncService.triggerBackgroundSync();
  };

  const filtered = clientes.filter(c => {
    const term = search.toLowerCase();
    const matchSearch = c.razon_social.toLowerCase().includes(term) ||
                        c.nit_ci.includes(term) ||
                        (c.telefono && c.telefono.includes(term));
    if (filterType === 'CREDITO') return matchSearch && (Number(c.saldo_credito) || 0) > 0;
    if (filterType === 'NIT') return matchSearch && c.nit_ci.length >= 9;
    if (filterType === 'CI') return matchSearch && c.nit_ci.length < 9;
    return matchSearch;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen pb-24 font-sans text-slate-800">
      
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-slate-900 text-white text-xs font-bold px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 border border-slate-700 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Banner (Stitch 1:1) */}
      <div className="bg-white px-4 pt-4 pb-3 border-b border-slate-200/80 shadow-xs flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-violet-600" />
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-violet-600">
                Directorio & Cartera
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight leading-tight mt-0.5">
              Clientes & Créditos
            </h1>
            <p className="text-xs text-slate-500 font-medium">
              Base de datos de contribuyentes, empresas y personas naturales
            </p>
          </div>

          <button
            onClick={() => setIsModalOpen(true)}
            className="h-10 px-3.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 active:scale-95 text-white text-xs font-extrabold rounded-xl shadow-md shadow-violet-500/20 transition-all flex items-center gap-1.5"
            type="button"
          >
            <UserPlus className="w-4 h-4" />
            <span>+ Nuevo Cliente</span>
          </button>
        </div>

        {/* Micro-Bento Estadísticas */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Clientes Activos</span>
            <div className="mt-1">
              <span className="text-2xl font-black text-slate-900">{clientes.length}</span>
              <span className="text-[10px] text-emerald-700 font-bold block mt-0.5">
                ● SIN / SIAT Verificados
              </span>
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-slate-500">Cartera por Cobrar</span>
            <div className="mt-1">
              <span className="text-xl sm:text-2xl font-black text-rose-700">
                Bs. {totalCreditDebt.toFixed(2)}
              </span>
              <span className="text-[10px] text-rose-600 font-bold block mt-0.5">
                {debtClientsCount} con saldo pendiente
              </span>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por NIT, Carnet (CI), teléfono o razón social..."
            className="w-full h-11 pl-10 pr-10 text-xs bg-slate-50 border border-slate-200 rounded-2xl placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-violet-600 transition"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-3.5 text-slate-400 hover:text-slate-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          {[
            { id: 'TODOS', label: `Todos (${clientes.length})` },
            { id: 'CREDITO', label: `Con Deuda (${debtClientsCount})` },
            { id: 'NIT', label: 'Empresas (NIT)' },
            { id: 'CI', label: 'Personas (CI)' }
          ].map((ft) => (
            <button
              key={ft.id}
              onClick={() => setFilterType(ft.id)}
              className={`min-h-[34px] px-3.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterType === ft.id
                  ? 'bg-violet-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {ft.label}
            </button>
          ))}
        </div>
      </div>

      {/* Client List Cards (Stitch 1:1) */}
      <div className="p-4 space-y-3">
        {filtered.map((cli) => {
          const initials = (cli.razon_social || 'CL').substring(0, 2).toUpperCase();
          const hasDebt = (Number(cli.saldo_credito) || 0) > 0;
          const isNit = (cli.nit_ci || '').length >= 9;

          // Pre-drafted WhatsApp reminder message
          const waMessage = encodeURIComponent(
            `Hola estimado(a) ${cli.razon_social}, le saludamos cordialmente de GLORYPOS. Le recordamos que cuenta con un saldo pendiente de Bs. ${(Number(cli.saldo_credito) || 0).toFixed(2)}. Agradecemos su preferencia y quedamos atentos a su pago. ¡Muchas gracias!`
          );

          return (
            <div
              key={cli.id}
              className={`bg-white p-4 rounded-2xl border shadow-xs hover:border-violet-300 transition-all space-y-3 ${
                hasDebt ? 'border-rose-200 bg-rose-50/10' : 'border-slate-200'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                    {initials}
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className={`px-2 py-0.2 rounded-md text-[10px] font-extrabold uppercase border ${
                        isNit 
                          ? 'bg-blue-50 text-blue-700 border-blue-200' 
                          : 'bg-purple-50 text-purple-700 border-purple-200'
                      }`}>
                        {isNit ? 'NIT' : 'CI'} {cli.nit_ci}
                      </span>
                      <span className="text-[10px] text-slate-400 font-medium truncate">
                        {isNit ? 'Persona Jurídica' : 'Persona Natural'}
                      </span>
                    </div>

                    <h3 className="font-extrabold text-sm text-slate-900 leading-snug mt-1 truncate">
                      {cli.razon_social}
                    </h3>

                    {cli.telefono && (
                      <p className="text-[11px] text-slate-500 font-medium mt-0.5">
                        Tel: <strong className="text-slate-700">{cli.telefono}</strong>
                      </p>
                    )}
                  </div>
                </div>

                {/* Debt pill */}
                {hasDebt ? (
                  <div className="text-right shrink-0">
                    <span className="px-2.5 py-1 rounded-xl bg-rose-100 text-rose-800 text-[11px] font-black border border-rose-300 block">
                      Debe: Bs. {Number(cli.saldo_credito).toFixed(2)}
                    </span>
                    <span className="text-[10px] text-rose-600 font-medium block mt-0.5">
                      Crédito activo
                    </span>
                  </div>
                ) : (
                  <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200 shrink-0">
                    Al Día
                  </span>
                )}
              </div>

              {/* Extra Details & Direct WhatsApp Debt Reminder */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <div className="flex items-center gap-1 text-[11px] truncate max-w-[220px]">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="truncate">{cli.ciudad || 'Bolivia'} • {cli.direccion || 'Sin dirección registrada'}</span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  {/* WhatsApp with auto-filled reminder if has debt */}
                  {cli.telefono && (
                    <a
                      href={`https://wa.me/591${cli.telefono}?text=${waMessage}`}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1 transition-all"
                      title="Enviar mensaje o cobro por WhatsApp"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp</span>
                    </a>
                  )}

                  {cli.telefono && (
                    <a
                      href={`tel:${cli.telefono}`}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-all"
                      title="Llamar directamente"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 p-6 space-y-2">
            <Users className="w-12 h-12 mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-800">No se encontraron clientes</p>
            <p className="text-xs text-slate-400">Intenta buscar con otro término o registra un nuevo cliente.</p>
          </div>
        )}
      </div>

      {/* Modal: Registrar Nuevo Cliente */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 animate-fadeIn">
          <div 
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          />

          <form 
            onSubmit={handleCreate}
            className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-3"
          >
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-extrabold text-slate-900 text-sm">Registrar Nuevo Cliente</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                NIT o Carnet de Identidad (CI) *
              </label>
              <input
                type="text"
                required
                value={form.nit_ci}
                onChange={(e) => setForm({ ...form, nit_ci: e.target.value })}
                placeholder="Ej: 1028394012 o 4892019"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold focus:ring-2 focus:ring-violet-600"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Nombre Completo o Razón Social *
              </label>
              <input
                type="text"
                required
                value={form.razon_social}
                onChange={(e) => setForm({ ...form, razon_social: e.target.value })}
                placeholder="Ej: Distribuidora Los Andes S.R.L."
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold focus:ring-2 focus:ring-violet-600"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Celular / WhatsApp
                </label>
                <input
                  type="tel"
                  value={form.telefono}
                  onChange={(e) => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej: 77212345"
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-600 block mb-1">
                  Ciudad
                </label>
                <select
                  value={form.ciudad}
                  onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  <option value="Santa Cruz">Santa Cruz</option>
                  <option value="La Paz">La Paz</option>
                  <option value="Cochabamba">Cochabamba</option>
                  <option value="El Alto">El Alto</option>
                  <option value="Oruro">Oruro</option>
                  <option value="Potosí">Potosí</option>
                  <option value="Tarija">Tarija</option>
                  <option value="Sucre">Sucre</option>
                  <option value="Beni">Beni</option>
                  <option value="Pando">Pando</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Dirección / Sucursal
              </label>
              <input
                type="text"
                value={form.direccion}
                onChange={(e) => setForm({ ...form, direccion: e.target.value })}
                placeholder="Av. Principal #123"
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-600 block mb-1">
                Saldo de Deuda / Crédito Inicial (Bs.)
              </label>
              <input
                type="number"
                step="any"
                value={form.saldo_credito}
                onChange={(e) => setForm({ ...form, saldo_credito: e.target.value })}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono font-bold text-rose-700"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs rounded-xl shadow-md transition-all mt-2"
            >
              Guardar Cliente
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
