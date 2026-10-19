import React, { useMemo, useState } from 'react';
import { FileText, RefreshCw, Ban, Search, X } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '../../db/dexie';
import { simbolo } from '../../utils/currency';

const hoy = () => new Date().toISOString().slice(0, 10);
const fechaDe = (iso) => String(iso || '').slice(0, 10);
const mostrarFecha = (iso) => {
  const [y, m, d] = fechaDe(iso).split('-');
  return y && m && d ? `${d}/${m}/${y}` : '';
};
const esBoleta = (v) => String(v.tipo_documento || '').toUpperCase() === 'BOLETA';
const esAnulable = (v) => ['FACTURA', 'FACTURA_SIAT', 'BOLETA'].includes(String(v.tipo_documento || '').toUpperCase()) && v.estado !== 'ANULADO';

const TIPOS_CDR = [
  { codigo: '01', label: '01 Factura', tipos: ['FACTURA', 'FACTURA_SIAT'], serie: 'F001' },
  { codigo: '03', label: '03 Boleta', tipos: ['BOLETA'], serie: 'B001' },
  { codigo: '07', label: '07 Nota de crédito', tipos: ['NOTA_CREDITO', 'NOTA DE CRÉDITO'], serie: 'FC01' },
];

function leerResumenes(clave) {
  try { return JSON.parse(localStorage.getItem(clave) || '[]'); } catch { return []; }
}

const Estado = ({ texto }) => (
  <span className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold ${texto === 'Aceptado' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-100 text-amber-800'}`}>{texto}</span>
);

// Pestaña "Resúmenes y bajas" de Consulta de Comprobantes
export default function ResumenesBajasPanel({ ventas, empresaId, puedeAnular, onActualizar, onVolver }) {
  const claveResumenes = `glorypos_resumenes_${empresaId || 'local'}`;
  const [resumenes, setResumenes] = useState(() => leerResumenes(claveResumenes));
  const [fechaResumen, setFechaResumen] = useState(hoy());
  const [bajaAbierta, setBajaAbierta] = useState(false);
  const [bajaVentaId, setBajaVentaId] = useState('');
  const [bajaMotivo, setBajaMotivo] = useState('');
  const [cdrTipo, setCdrTipo] = useState('03');
  const [cdrSerie, setCdrSerie] = useState('B001');
  const [cdrNumero, setCdrNumero] = useState('');
  const [cdrResultado, setCdrResultado] = useState(null);

  const bajas = useMemo(() => ventas
    .filter(v => v.estado === 'ANULADO')
    .map(v => {
      const fecha = fechaDe(v.fecha_anulacion || v.fecha);
      return { id: v.id, fecha, correlativo: `RA-${fecha.replace(/-/g, '')}-1`, comprobante: v.correlativo, estado: 'Pendiente', motivo: v.motivo_baja || '' };
    })
    .sort((a, b) => b.fecha.localeCompare(a.fecha)), [ventas]);

  const anulables = useMemo(() => ventas.filter(esAnulable), [ventas]);

  const generarResumen = () => {
    const detalles = ventas.filter(v => esBoleta(v) && fechaDe(v.fecha) === fechaResumen).length;
    if (detalles === 0) {
      toast.error(`No hay boletas emitidas el ${mostrarFecha(fechaResumen)}.`);
      return;
    }
    const correlativo = resumenes.filter(r => r.fecha === fechaResumen).length + 1;
    const nuevos = [{ id: `rc-${Date.now()}`, fecha: fechaResumen, correlativo, ticket: null, estado: 'Pendiente', detalles }, ...resumenes];
    setResumenes(nuevos);
    try { localStorage.setItem(claveResumenes, JSON.stringify(nuevos)); } catch { /* sin almacenamiento local */ }
    toast.success(`Resumen diario del ${mostrarFecha(fechaResumen)} generado con ${detalles} boleta(s).`);
  };

  const registrarBaja = async () => {
    const venta = anulables.find(v => String(v.id) === String(bajaVentaId));
    if (!venta) { toast.error('Selecciona el comprobante a dar de baja.'); return; }
    if (!bajaMotivo.trim()) { toast.error('Escribe el motivo de la baja.'); return; }
    await db.ventas.update(venta.id, {
      estado: 'ANULADO',
      estado_sunat: 'Anulado',
      motivo_baja: bajaMotivo.trim(),
      fecha_anulacion: new Date().toISOString(),
    });
    toast.success(`Comunicación de baja registrada para ${venta.correlativo}.`);
    setBajaAbierta(false);
    setBajaVentaId('');
    setBajaMotivo('');
    onActualizar();
  };

  const consultarCdr = () => {
    const tipo = TIPOS_CDR.find(t => t.codigo === cdrTipo);
    const numero = parseInt(cdrNumero, 10);
    if (!cdrSerie.trim() || !numero) { toast.error('Ingresa la serie y el número.'); return; }
    const venta = ventas.find(v => {
      const [serie, num] = String(v.correlativo || '').split('-');
      return tipo.tipos.includes(String(v.tipo_documento || '').toUpperCase())
        && serie?.toUpperCase() === cdrSerie.trim().toUpperCase()
        && parseInt(num, 10) === numero;
    });
    setCdrResultado(venta
      ? { encontrado: true, texto: `${venta.correlativo} · ${venta.cliente_nombre || 'Clientes Varios'} · ${simbolo()} ${(Number(venta.total) || 0).toFixed(2)}`, estado: venta.estado_sunat || (venta.estado === 'ANULADO' ? 'Anulado' : 'Aceptado') }
      : { encontrado: false, texto: `No se encontró el comprobante ${cdrSerie.toUpperCase()}-${cdrNumero}.` });
  };

  const th = 'py-3 px-4 text-[11px] font-bold text-slate-500 uppercase tracking-wider';
  const td = 'py-3 px-4 text-sm text-slate-700';

  return (
    <div className="space-y-5">
      {/* Resumen diario de boletas */}
      <section className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Resumen diario de boletas</h2>
          <div className="flex items-center gap-2">
            <input type="date" value={fechaResumen} onChange={(e) => setFechaResumen(e.target.value)} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
            <button type="button" onClick={generarResumen} className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold flex items-center gap-1.5">
              <FileText className="w-4 h-4" /> Generar resumen
            </button>
            <button type="button" onClick={() => setResumenes(leerResumenes(claveResumenes))} className="p-2 text-slate-500 hover:text-slate-800" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr><th className={th}>Fecha resumen</th><th className={th}>Correlativo</th><th className={th}>Ticket</th><th className={th}>Estado</th><th className={th}>Detalles</th><th className={th}>Acción</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {resumenes.length === 0 ? (
                <tr><td colSpan={6} className="py-8 text-center text-sm text-slate-400">Sin resúmenes generados.</td></tr>
              ) : resumenes.map(r => (
                <tr key={r.id}>
                  <td className={td}>{mostrarFecha(r.fecha)}</td>
                  <td className={td}>{r.correlativo}</td>
                  <td className={td}>{r.ticket || '—'}</td>
                  <td className={td}><Estado texto={r.estado} /></td>
                  <td className={td}>{r.detalles}</td>
                  <td className={td} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Comunicaciones de baja */}
      <section className="rounded-xl border border-slate-200 overflow-hidden">
        <div className="px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold text-slate-900">Comunicaciones de baja</h2>
          <div className="flex items-center gap-2">
            {puedeAnular && (
              <button type="button" onClick={() => setBajaAbierta(true)} className="px-4 py-2 rounded-lg bg-[#FF6B35] hover:bg-[#E85B28] text-white text-sm font-semibold flex items-center gap-1.5">
                <Ban className="w-4 h-4" /> Nueva comunicación de baja
              </button>
            )}
            <button type="button" onClick={onActualizar} className="p-2 text-slate-500 hover:text-slate-800" title="Actualizar">
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50 border-y border-slate-200">
              <tr><th className={th}>Fecha</th><th className={th}>Correlativo</th><th className={th}>Comprobantes</th><th className={th}>Estado</th><th className={th}>Acciones</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bajas.length === 0 ? (
                <tr><td colSpan={5} className="py-8 text-center text-sm text-slate-400">Sin comunicaciones de baja.</td></tr>
              ) : bajas.map(b => (
                <tr key={b.id}>
                  <td className={td}>{mostrarFecha(b.fecha)}</td>
                  <td className={td}>{b.correlativo}</td>
                  <td className={`${td} font-mono text-xs`}>{b.comprobante}</td>
                  <td className={td}><Estado texto={b.estado} /></td>
                  <td className={`${td} text-xs text-slate-500`}>{b.motivo || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Consulta de estado (CDR) */}
      <section className="rounded-xl border border-slate-200 p-4">
        <h2 className="font-semibold text-slate-900 mb-3">Consulta estado comprobante (CDR)</h2>
        <div className="flex flex-wrap items-center gap-2.5">
          <select value={cdrTipo} onChange={(e) => { setCdrTipo(e.target.value); setCdrSerie(TIPOS_CDR.find(t => t.codigo === e.target.value).serie); }} className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF6B35]">
            {TIPOS_CDR.map(t => <option key={t.codigo} value={t.codigo}>{t.label}</option>)}
          </select>
          <input value={cdrSerie} onChange={(e) => setCdrSerie(e.target.value)} placeholder="Serie" className="w-24 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
          <input value={cdrNumero} onChange={(e) => setCdrNumero(e.target.value.replace(/\D/g, ''))} onKeyDown={(e) => e.key === 'Enter' && consultarCdr()} placeholder="Número" className="w-28 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#FF6B35]" />
          <button type="button" onClick={consultarCdr} className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-sm font-semibold flex items-center gap-1.5">
            <Search className="w-4 h-4" /> Consultar
          </button>
        </div>
        {cdrResultado && (
          <p className={`mt-3 text-sm flex items-center gap-2 ${cdrResultado.encontrado ? 'text-slate-700' : 'text-rose-600'}`}>
            {cdrResultado.texto} {cdrResultado.encontrado && <Estado texto={cdrResultado.estado} />}
          </p>
        )}
      </section>

      <button type="button" onClick={onVolver} className="text-sm text-slate-500 hover:text-slate-800">← Volver a facturas y boletas</button>

      {bajaAbierta && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => setBajaAbierta(false)}>
          <div className="bg-white w-full max-w-md rounded-2xl shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Nueva comunicación de baja</h3>
              <button type="button" onClick={() => setBajaAbierta(false)} className="text-slate-500 hover:text-slate-900" aria-label="Cerrar"><X className="w-5 h-5" /></button>
            </div>
            <label className="block text-xs font-semibold text-slate-600">Comprobante
              <select value={bajaVentaId} onChange={(e) => setBajaVentaId(e.target.value)} className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-normal">
                <option value="">Selecciona...</option>
                {anulables.map(v => <option key={v.id} value={v.id}>{v.correlativo} · {v.cliente_nombre || 'Clientes Varios'} · {simbolo()} {(Number(v.total) || 0).toFixed(2)}</option>)}
              </select>
            </label>
            <label className="block text-xs font-semibold text-slate-600">Motivo
              <input value={bajaMotivo} onChange={(e) => setBajaMotivo(e.target.value)} placeholder="Ej: Error en el RUC del cliente" className="mt-1 w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-normal" />
            </label>
            <p className="text-xs text-slate-500">El comprobante quedará anulado y no se podrá revertir.</p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setBajaAbierta(false)} className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-semibold text-slate-700">Cancelar</button>
              <button type="button" onClick={registrarBaja} className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold">Dar de baja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
