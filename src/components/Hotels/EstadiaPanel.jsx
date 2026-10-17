import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, LogIn, LogOut, Pencil, XCircle, UserX, Wallet, Printer, Plus, Search, Trash2,
  ArrowRightLeft, Phone, IdCard, Moon, Users
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import { hotelService, folio, formatFecha, RESERVA_ESTADOS, hoyISO } from '../../services/hotelService';
import { money } from './useHotelData';
import { simbolo } from '../../utils/currency';

const ESTADO_BADGE = {
  RESERVADA: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  EN_CASA: 'bg-sky-100 text-sky-800 border-sky-200',
  FINALIZADA: 'bg-slate-100 text-slate-600 border-slate-200',
  CANCELADA: 'bg-rose-50 text-rose-700 border-rose-200',
  NO_SHOW: 'bg-rose-50 text-rose-700 border-rose-200',
};

// Ficha de la reserva / estadía con el folio (cuenta) del huésped
export default function EstadiaPanel({ reserva: r, data, onBack, onEditar, onCobrar }) {
  const { empresa } = useAuth();
  const { habById, tiposById } = data;
  const hab = habById[r.habitacion_id];
  const tipo = tiposById[hab?.tipo_id];
  const f = folio(r);
  const [productos, setProductos] = useState([]);
  const [busq, setBusq] = useState('');
  const [mostrarConsumo, setMostrarConsumo] = useState(false);
  const [moviendo, setMoviendo] = useState(false);
  const [libres, setLibres] = useState([]);

  useEffect(() => {
    db.productos_tienda.toArray().then(list => setProductos(list.filter(p => !p.es_insumo && p.activo !== false)));
  }, []);

  useEffect(() => {
    if (moviendo) hotelService.habitacionesLibres(hoyISO() > r.llegada ? hoyISO() : r.llegada, r.salida, r.id).then(setLibres);
  }, [moviendo, r]);

  const filtrados = useMemo(
    () => productos.filter(p => p.nombre.toLowerCase().includes(busq.toLowerCase())).slice(0, 12),
    [productos, busq]
  );

  const run = async (fn) => {
    try { await fn(); } catch (err) { alert(err.message); }
  };

  const adelanto = () => {
    const valor = window.prompt(`Monto del adelanto / pago a cuenta (saldo de hospedaje ${money(f.saldoAlojamiento)}):`, f.saldoAlojamiento.toFixed(2));
    if (valor === null) return;
    onCobrar(r, { tipo: 'ADELANTO', monto: Number(valor) });
  };

  const checkOut = () => {
    if (f.saldo > 0) {
      onCobrar(r, { tipo: 'CUENTA', checkout: true });
    } else {
      run(() => hotelService.checkOut(r.id));
    }
  };

  const imprimir = () => {
    const filas = [
      `<tr><td>Hospedaje ${f.noches} noche(s) x ${Number(r.tarifa).toFixed(2)}</td><td style="text-align:right">${f.alojamiento.toFixed(2)}</td></tr>`,
      ...(r.consumos || []).filter(c => !c.anulado).map(c => `<tr><td>${c.cantidad} x ${c.nombre}</td><td style="text-align:right">${(c.precio * c.cantidad).toFixed(2)}</td></tr>`),
    ].join('');
    const pagos = (r.pagos || []).map(p => `<tr><td>Pago ${p.correlativo || ''} (${p.metodo || ''})</td><td style="text-align:right">-${Number(p.monto).toFixed(2)}</td></tr>`).join('');
    const w = window.open('', '_blank', 'width=380,height=680');
    if (!w) return;
    w.document.write(`<html><head><title>Folio ${r.codigo}</title><style>body{font-family:monospace;font-size:12px;padding:10px}table{width:100%}h3,p{text-align:center;margin:4px 0}</style></head><body>
      <h3>${empresa?.nombre || 'HOTEL'}</h3><p>FOLIO DEL HUÉSPED (no válido como factura)</p>
      <p>${r.codigo} · Hab. ${hab?.numero} (${tipo?.nombre || ''})</p>
      <p>${r.huesped?.nombre} · ${r.huesped?.tipo_doc || ''} ${r.huesped?.documento || ''}</p>
      <p>${formatFecha(r.llegada)} → ${formatFecha(r.salida)}</p><hr/>
      <table>${filas}</table><hr/><table>${pagos}</table><hr/>
      <table><tr><td><b>TOTAL</b></td><td style="text-align:right"><b>${f.total.toFixed(2)}</b></td></tr>
      <tr><td>Pagado</td><td style="text-align:right">${f.totalPagado.toFixed(2)}</td></tr>
      <tr><td><b>SALDO</b></td><td style="text-align:right"><b>${simbolo()} ${f.saldo.toFixed(2)}</b></td></tr></table>
      <script>window.print()</script></body></html>`);
    w.document.close();
  };

  const activa = r.estado === 'RESERVADA' || r.estado === 'EN_CASA';

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
      <section className="lg:col-span-2 space-y-3">
        <div className="bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
          <div className="flex items-start gap-2">
            <button type="button" onClick={onBack} className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200"><ArrowLeft className="w-4 h-4" /></button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-black text-slate-900 truncate">{r.huesped?.nombre}</h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${ESTADO_BADGE[r.estado]}`}>{RESERVA_ESTADOS[r.estado]}</span>
              </div>
              <p className="text-[11px] text-slate-500">{r.codigo} · {r.canal}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase">Habitación</p>
              <p className="font-black text-slate-900">{hab?.numero} <span className="font-semibold text-slate-500">· {tipo?.nombre}</span></p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Moon className="w-3 h-3" /> Fechas</p>
              <p className="font-black text-slate-900">{formatFecha(r.llegada)} → {formatFecha(r.salida)}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><IdCard className="w-3 h-3" /> Documento</p>
              <p className="font-semibold text-slate-800">{r.huesped?.tipo_doc} {r.huesped?.documento || '—'}</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-2.5">
              <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1"><Users className="w-3 h-3" /> Personas</p>
              <p className="font-semibold text-slate-800">{r.adultos} adulto(s){r.ninos > 0 ? ` · ${r.ninos} niño(s)` : ''}</p>
            </div>
          </div>
          {r.huesped?.telefono && (
            <a href={`https://wa.me/${String(r.huesped.telefono).replace(/\D/g, '')}`} target="_blank" rel="noreferrer" className="text-xs font-bold text-emerald-700 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5" /> {r.huesped.telefono} (WhatsApp)
            </a>
          )}
          {r.notas && <p className="text-xs bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-3 py-2">{r.notas}</p>}
          {r.motivo_cancelacion && <p className="text-xs text-rose-600">Motivo: {r.motivo_cancelacion}</p>}
        </div>

        {activa && (
          <div className="bg-white rounded-3xl border border-slate-200 p-4 grid grid-cols-2 gap-2 text-[11px] font-bold">
            {r.estado === 'RESERVADA' && (
              <button type="button" onClick={() => run(() => hotelService.checkIn(r.id))} className="col-span-2 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white flex items-center justify-center gap-1.5">
                <LogIn className="w-4 h-4" /> Hacer check-in
              </button>
            )}
            {r.estado === 'EN_CASA' && (
              <button type="button" onClick={checkOut} className="col-span-2 py-2.5 rounded-xl bg-primary-500 hover:bg-primary-600 text-white flex items-center justify-center gap-1.5">
                <LogOut className="w-4 h-4" /> {f.saldo > 0 ? `Cobrar ${money(f.saldo)} y hacer check-out` : 'Hacer check-out'}
              </button>
            )}
            <button type="button" disabled={f.saldoAlojamiento <= 0} onClick={adelanto} className="py-2 rounded-xl border border-slate-200 disabled:opacity-40 flex items-center justify-center gap-1">
              <Wallet className="w-3.5 h-3.5" /> Adelanto / pago
            </button>
            <button type="button" onClick={() => onEditar(r)} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
              <Pencil className="w-3.5 h-3.5" /> Editar / extender
            </button>
            <button type="button" onClick={() => setMoviendo(v => !v)} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
              <ArrowRightLeft className="w-3.5 h-3.5" /> Cambiar habitación
            </button>
            <button type="button" onClick={imprimir} className="py-2 rounded-xl border border-slate-200 flex items-center justify-center gap-1">
              <Printer className="w-3.5 h-3.5" /> Imprimir folio
            </button>
            {r.estado === 'RESERVADA' && (
              <>
                <button type="button" onClick={() => { const m = window.prompt('Motivo de la cancelación:'); if (m !== null) run(() => hotelService.cancelar(r.id, m)); }} className="py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
                  <XCircle className="w-3.5 h-3.5" /> Cancelar
                </button>
                <button type="button" onClick={() => window.confirm('¿Marcar como no show (no llegó)?') && run(() => hotelService.cancelar(r.id, 'No se presentó', 'NO_SHOW'))} className="py-2 rounded-xl text-rose-600 hover:bg-rose-50 flex items-center justify-center gap-1">
                  <UserX className="w-3.5 h-3.5" /> No show
                </button>
              </>
            )}
            {moviendo && (
              <div className="col-span-2 border border-slate-200 rounded-xl p-2">
                <p className="text-[11px] text-slate-600 mb-1.5">Habitaciones libres hasta {formatFecha(r.salida)}:</p>
                <div className="flex flex-wrap gap-1.5">
                  {libres.length === 0 && <span className="text-slate-400 font-normal">No hay habitaciones libres.</span>}
                  {libres.map(h => (
                    <button key={h.id} type="button" onClick={() => run(async () => { await hotelService.cambiarHabitacion(r.id, h.id); setMoviendo(false); })} className="px-2 py-1 rounded-lg bg-slate-100 hover:bg-sky-100">
                      {h.numero} · {tiposById[h.tipo_id]?.nombre}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
        {!activa && (
          <button type="button" onClick={imprimir} className="w-full py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold flex items-center justify-center gap-1">
            <Printer className="w-3.5 h-3.5" /> Imprimir folio
          </button>
        )}
      </section>

      <section className="lg:col-span-3 bg-white rounded-3xl border border-slate-200 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-black text-slate-900">Folio del huésped</h3>
          {r.estado === 'EN_CASA' && (
            <button type="button" onClick={() => setMostrarConsumo(v => !v)} className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 text-white text-[11px] font-bold flex items-center gap-1">
              <Plus className="w-3.5 h-3.5" /> Cargar consumo
            </button>
          )}
        </div>

        {mostrarConsumo && (
          <div className="border border-sky-200 bg-sky-50/40 rounded-2xl p-3 space-y-2">
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input autoFocus value={busq} onChange={e => setBusq(e.target.value)} placeholder="Minibar, lavandería, room service..." className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-sm bg-white" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {filtrados.map(p => (
                <button key={p.id} type="button" onClick={() => hotelService.agregarConsumo(r.id, p, 1, 'Recepción')} className="text-left bg-white border border-slate-200 hover:border-sky-300 rounded-xl px-2 py-1.5">
                  <p className="text-[11px] font-bold text-slate-800 truncate">{p.nombre}</p>
                  <p className="text-[10px] text-slate-500">{money(p.precio_venta)} · stock {p.stock_actual ?? '—'}</p>
                </button>
              ))}
            </div>
            <p className="text-[10px] text-slate-500">El stock se descuenta del inventario cuando se cobra el consumo.</p>
          </div>
        )}

        <table className="w-full text-xs">
          <thead className="text-[10px] text-slate-400 uppercase">
            <tr><th className="text-left py-1">Concepto</th><th className="text-left py-1">Fecha</th><th className="text-right py-1">Importe</th><th className="py-1 w-16"></th></tr>
          </thead>
          <tbody>
            <tr className="border-t border-slate-100">
              <td className="py-2 font-bold text-slate-800">Hospedaje · {f.noches} noche(s) x {money(r.tarifa)}</td>
              <td className="py-2 text-slate-500">{formatFecha(r.llegada)}</td>
              <td className="py-2 text-right font-bold">{money(f.alojamiento)}</td>
              <td className="py-2 text-right">{f.saldoAlojamiento === 0 && <span className="text-[9px] font-bold text-emerald-700">Pagado</span>}</td>
            </tr>
            {(r.consumos || []).map(c => (
              <tr key={c.id} className={`border-t border-slate-100 ${c.anulado ? 'opacity-40 line-through' : ''}`}>
                <td className="py-2 text-slate-800">{c.cantidad} x {c.nombre} <span className="text-[10px] text-slate-400">· {c.origen}</span></td>
                <td className="py-2 text-slate-500">{new Date(c.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}</td>
                <td className="py-2 text-right">{money(c.precio * c.cantidad)}</td>
                <td className="py-2 text-right">
                  {c.pagado ? <span className="text-[9px] font-bold text-emerald-700">Pagado</span> : !c.anulado && activa && (
                    <button type="button" onClick={() => window.confirm(`¿Anular ${c.nombre}?`) && hotelService.anularConsumo(r.id, c.id)} className="p-1 text-rose-500 hover:bg-rose-50 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                  )}
                </td>
              </tr>
            ))}
            {(r.pagos || []).map(p => (
              <tr key={p.id} className="border-t border-slate-100 text-emerald-700">
                <td className="py-2">Pago {p.correlativo} · {p.metodo}</td>
                <td className="py-2">{new Date(p.fecha).toLocaleDateString('es-BO', { day: '2-digit', month: 'short' })}</td>
                <td className="py-2 text-right font-bold">-{money(p.monto)}</td>
                <td />
              </tr>
            ))}
          </tbody>
        </table>

        <div className="border-t border-slate-200 pt-3 space-y-1 text-xs">
          <div className="flex justify-between text-slate-500"><span>Total cargos</span><span>{money(f.total)}</span></div>
          <div className="flex justify-between text-emerald-700"><span>Pagado</span><span>{money(f.totalPagado)}</span></div>
          <div className={`flex justify-between font-black text-base ${f.saldo > 0 ? 'text-rose-600' : 'text-slate-900'}`}><span>Saldo</span><span>{money(f.saldo)}</span></div>
        </div>
      </section>
    </div>
  );
}
