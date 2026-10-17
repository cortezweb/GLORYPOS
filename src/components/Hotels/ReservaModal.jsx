import React, { useEffect, useState } from 'react';
import { X, Search, Save, LogIn } from 'lucide-react';
import { hotelService, hoyISO, addDias, noches, CANALES, TIPOS_DOC } from '../../services/hotelService';
import { money } from './useHotelData';
import { simbolo } from '../../utils/currency';

const input = 'mt-1 w-full border border-slate-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-sky-200';
const label = 'block text-[11px] font-bold text-slate-600';

// Alta / edición de reserva. Con walkin=true hace check-in al guardar.
export default function ReservaModal({ inicial, data, onClose, onSaved }) {
  const { tiposById, habById } = data;
  const esEdicion = !!inicial.id;
  const walkin = !!inicial.walkin;
  const [form, setForm] = useState(() => ({
    llegada: inicial.llegada || hoyISO(),
    salida: inicial.salida || addDias(inicial.llegada || hoyISO(), 1),
    habitacion_id: inicial.habitacion_id || '',
    adultos: inicial.adultos ?? 1,
    ninos: inicial.ninos ?? 0,
    tarifa: inicial.tarifa ?? '',
    canal: inicial.canal || (walkin ? 'Walk-in' : 'Directo'),
    notas: inicial.notas || '',
    huesped: { tipo_doc: 'CI', nacionalidad: 'Boliviana', ...(inicial.huesped || {}) },
  }));
  const [libres, setLibres] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [sugerencias, setSugerencias] = useState([]);
  const [guardando, setGuardando] = useState(false);

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  const setH = (k, v) => setForm(f => ({ ...f, huesped: { ...f.huesped, [k]: v } }));

  useEffect(() => {
    if (!(form.llegada < form.salida)) { setLibres([]); return; }
    hotelService.habitacionesLibres(form.llegada, form.salida, inicial.id).then(setLibres);
  }, [form.llegada, form.salida, inicial.id]);

  useEffect(() => {
    let vivo = true;
    hotelService.buscarHuesped(busqueda).then(r => vivo && setSugerencias(r));
    return () => { vivo = false; };
  }, [busqueda]);

  // Tarifa sugerida según el tipo de habitación
  const elegirHab = (id) => {
    const tipo = tiposById[habById[id]?.tipo_id];
    setForm(f => ({ ...f, habitacion_id: id, tarifa: f.tarifa === '' || !esEdicion ? (tipo?.tarifa ?? f.tarifa) : f.tarifa }));
  };

  useEffect(() => {
    if (form.habitacion_id && form.tarifa === '') elegirHab(form.habitacion_id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const n = form.llegada < form.salida ? noches(form.llegada, form.salida) : 0;
  const capacidad = tiposById[habById[form.habitacion_id]?.tipo_id]?.capacidad || 0;
  const personas = Number(form.adultos || 0) + Number(form.ninos || 0);

  const guardar = async (e) => {
    e.preventDefault();
    setGuardando(true);
    try {
      let r = await hotelService.guardarReserva({ ...inicial, ...form, walkin: undefined });
      if (walkin) r = await hotelService.checkIn(r.id);
      onSaved(r);
    } catch (err) {
      alert(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const opcionesHab = [...libres];
  if (form.habitacion_id && !opcionesHab.some(h => h.id === form.habitacion_id) && habById[form.habitacion_id]) {
    opcionesHab.unshift({ ...habById[form.habitacion_id], ocupada: true });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-3 overflow-y-auto sm:[&>*]:my-auto">
      <div className="fixed inset-0 bg-slate-900/60" onClick={onClose} />
      <form onSubmit={guardar} className="relative z-10 w-full max-w-2xl bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl max-h-[94dvh] overflow-y-auto">
        <div className="sticky top-0 bg-white px-5 py-4 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="text-base font-black text-slate-900">{esEdicion ? `Editar reserva ${inicial.codigo}` : walkin ? 'Walk-in · Check-in directo' : 'Nueva reserva'}</h3>
            <p className="text-[11px] text-slate-500">{walkin ? 'El huésped entra ahora a la habitación.' : 'Bloquea la habitación en las fechas elegidas.'}</p>
          </div>
          <button type="button" onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700"><X className="w-5 h-5" /></button>
        </div>

        <div className="p-5 space-y-5">
          <section className="space-y-3">
            <p className="text-xs font-black text-slate-800 uppercase">Estadía</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <label className={label}>Llegada
                <input type="date" required value={form.llegada} disabled={walkin} onChange={e => set('llegada', e.target.value)} className={input} />
              </label>
              <label className={label}>Salida
                <input type="date" required min={addDias(form.llegada, 1)} value={form.salida} onChange={e => set('salida', e.target.value)} className={input} />
              </label>
              <label className={label}>Adultos
                <input type="number" min="1" value={form.adultos} onChange={e => set('adultos', e.target.value)} className={input} />
              </label>
              <label className={label}>Niños
                <input type="number" min="0" value={form.ninos} onChange={e => set('ninos', e.target.value)} className={input} />
              </label>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <label className={`${label} sm:col-span-2`}>Habitación ({libres.length} libres en esas fechas)
                <select required value={form.habitacion_id} onChange={e => elegirHab(e.target.value)} className={input}>
                  <option value="">Elegir habitación...</option>
                  {opcionesHab.map(h => {
                    const t = tiposById[h.tipo_id];
                    return (
                      <option key={h.id} value={h.id} disabled={h.ocupada}>
                        {h.numero} · {t?.nombre} · {t?.capacidad} pers. · {money(t?.tarifa)}{h.limpieza === 'SUCIA' ? ' · por limpiar' : ''}{h.ocupada ? ' (no disponible)' : ''}
                      </option>
                    );
                  })}
                </select>
              </label>
              <label className={label}>Tarifa por noche ({simbolo()})
                <input type="number" min="0" step="0.01" required value={form.tarifa} onChange={e => set('tarifa', e.target.value)} className={input} />
              </label>
            </div>
            {capacidad > 0 && personas > capacidad && (
              <p className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                La habitación es para {capacidad} persona(s) y la reserva tiene {personas}.
              </p>
            )}
          </section>

          <section className="space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-black text-slate-800 uppercase">Huésped titular</p>
              <div className="relative w-56">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                <input value={busqueda} onChange={e => setBusqueda(e.target.value)} placeholder="Buscar huésped frecuente" className="w-full pl-8 pr-2 py-1.5 border border-slate-200 rounded-xl text-xs" />
                {sugerencias.length > 0 && (
                  <div className="absolute right-0 left-0 top-full mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-20 overflow-hidden">
                    {sugerencias.map(h => (
                      <button key={h.id} type="button" onClick={() => { setForm(f => ({ ...f, huesped: { ...f.huesped, ...h } })); setBusqueda(''); }} className="w-full text-left px-3 py-2 hover:bg-slate-50 text-xs">
                        <b>{h.nombre}</b> <span className="text-slate-400">{h.tipo_doc} {h.documento} · {h.visitas || 0} visitas</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className={`${label} sm:col-span-2`}>Nombre completo
                <input required value={form.huesped.nombre || ''} onChange={e => setH('nombre', e.target.value)} className={input} />
              </label>
              <div className="grid grid-cols-3 gap-2">
                <label className={label}>Doc.
                  <select value={form.huesped.tipo_doc} onChange={e => setH('tipo_doc', e.target.value)} className={input}>
                    {TIPOS_DOC.map(t => <option key={t}>{t}</option>)}
                  </select>
                </label>
                <label className={`${label} col-span-2`}>Número
                  <input value={form.huesped.documento || ''} onChange={e => setH('documento', e.target.value)} className={input} />
                </label>
              </div>
              <label className={label}>Nacionalidad
                <input value={form.huesped.nacionalidad || ''} onChange={e => setH('nacionalidad', e.target.value)} className={input} />
              </label>
              <label className={label}>Celular / WhatsApp
                <input value={form.huesped.telefono || ''} onChange={e => setH('telefono', e.target.value)} className={input} />
              </label>
              <label className={label}>Correo
                <input type="email" value={form.huesped.email || ''} onChange={e => setH('email', e.target.value)} className={input} />
              </label>
            </div>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <label className={label}>Canal
              <select value={form.canal} onChange={e => set('canal', e.target.value)} className={input}>
                {CANALES.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label className={`${label} sm:col-span-2`}>Notas (llegada tarde, cama extra, alergias...)
              <input value={form.notas} onChange={e => set('notas', e.target.value)} className={input} />
            </label>
          </section>
        </div>

        <div className="sticky bottom-0 bg-white border-t border-slate-100 px-5 py-3 flex items-center justify-between gap-3">
          <div className="text-xs text-slate-500">
            {n} noche(s) · <b className="text-slate-900 text-sm">{money(n * (Number(form.tarifa) || 0))}</b>
          </div>
          <button type="submit" disabled={guardando} className="px-5 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 disabled:opacity-50 text-white text-xs font-black flex items-center gap-1.5">
            {walkin ? <LogIn className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {walkin ? 'Registrar y hacer check-in' : esEdicion ? 'Guardar cambios' : 'Confirmar reserva'}
          </button>
        </div>
      </form>
    </div>
  );
}
