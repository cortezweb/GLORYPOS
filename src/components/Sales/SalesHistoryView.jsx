import React, { useState, useEffect } from 'react';
import { FileText, Printer, Search, Calendar, Banknote, QrCode, CreditCard, ChevronRight } from 'lucide-react';
import { db } from '../../db/dexie';

export default function SalesHistoryView({ onOpenReceipt }) {
  const [ventas, setVentas] = useState([]);
  const [search, setSearch] = useState('');

  const loadVentas = async () => {
    const list = await db.ventas.reverse().toArray();
    setVentas(list);
  };

  useEffect(() => {
    loadVentas();
  }, []);

  const totalRecaudado = ventas.reduce((acc, curr) => acc + curr.total, 0);

  const filtered = ventas.filter(v =>
    v.correlativo?.includes(search) ||
    v.cliente_nombre?.toLowerCase().includes(search.toLowerCase()) ||
    v.cliente_ci_nit?.includes(search)
  );

  return (
    <div className="flex-1 flex flex-col bg-slate-50 overflow-y-auto pb-24">
      {/* Metrics Banner */}
      <div className="bg-white p-4 border-b border-slate-200 space-y-3">
        <div>
          <h2 className="font-bold text-slate-900 text-lg">Historial de Ventas</h2>
          <p className="text-xs text-slate-500">
            Registro de todos los comprobantes emitidos en el POS
          </p>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 block">
              Total Recaudado
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              Bs. {totalRecaudado.toFixed(2)}
            </span>
          </div>

          <div className="p-3 bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Comprobantes
            </span>
            <span className="text-lg font-extrabold text-slate-900">
              {ventas.length} ventas
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por N° comprobante o cliente..."
            className="w-full pl-9 pr-4 py-2 bg-slate-100 border-0 rounded-xl text-xs focus:bg-white focus:ring-2 focus:ring-indigo-600"
          />
        </div>
      </div>

      {/* Sales List */}
      <div className="p-4 space-y-2">
        {filtered.map((v) => {
          const isFactura = v.tipo_documento === 'FACTURA_SIAT';
          const fechaStr = new Date(v.fecha).toLocaleTimeString('es-BO', {
            hour: '2-digit',
            minute: '2-digit'
          });

          return (
            <div
              key={v.id}
              onClick={() => onOpenReceipt(v)}
              className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs hover:border-indigo-300 transition-all flex items-center justify-between gap-3 cursor-pointer group active:scale-[0.99]"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                  isFactura ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-700'
                }`}>
                  <FileText className="w-4 h-4" />
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-extrabold text-xs text-slate-900">
                      N° {v.correlativo}
                    </span>
                    <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full ${
                      isFactura ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {isFactura ? 'SIAT' : 'RECIBO'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 truncate mt-0.5">
                    {v.cliente_nombre} ({v.cliente_ci_nit})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <div className="text-right">
                  <span className="font-extrabold text-xs text-slate-900 block">
                    Bs. {Number(v.total).toFixed(2)}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    {fechaStr} • {v.metodo_pago}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-600 transition-colors" />
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 space-y-2">
            <FileText className="w-10 h-10 mx-auto text-slate-300" />
            <p className="text-xs font-semibold">No se encontraron ventas registradas</p>
          </div>
        )}
      </div>
    </div>
  );
}
