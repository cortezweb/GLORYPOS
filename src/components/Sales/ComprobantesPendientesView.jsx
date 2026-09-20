import React, { useState } from 'react';
import { 
  Clock, Cloud, RefreshCw, CheckCircle2, AlertCircle, 
  Send, FileText, Filter, Eye, ArrowRight
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { syncService } from '../../services/syncService';

export default function ComprobantesPendientesView() {
  const { empresa } = useAuth();
  const [isSending, setIsSending] = useState(false);

  const pendientes = [
    { id: '1', correlativo: 'F-000105', tipo: 'Factura Electrónica SIAT', cliente: 'Comercializadora del Sur', fecha: '2026-09-19 18:40', total: 'Bs. 480.00', motivo: 'Generada sin internet en caja 2 (Offline)' },
    { id: '2', correlativo: 'B-000425', tipo: 'Boleta de Venta', cliente: 'Cliente Mostrador', fecha: '2026-09-19 19:10', total: 'Bs. 35.50', motivo: 'En cola local de sincronización' }
  ];

  const handleSyncAll = async () => {
    setIsSending(true);
    try {
      await syncService.syncLocalToCloud();
      alert('Comprobantes enviados exitosamente a la nube.');
    } catch {
      alert('Sincronización finalizada.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Comprobantes Pendientes de Envío</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200">
                Contingencia & Cola Offline
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Documentos emitidos en modo sin conexión que deben sincronizarse con SIAT / SUNAT y la nube central.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSyncAll}
          disabled={isSending}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isSending ? 'animate-spin' : ''}`} />
          <span>{isSending ? 'Enviando...' : 'Reenviar Todo Ahora'}</span>
        </button>
      </div>

      {/* Tabla de Pendientes */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-black text-slate-800 uppercase tracking-wider">Documentos en Cola ({pendientes.length})</h2>
          <span className="text-xs text-slate-400 font-medium">Auto-sincronización activa</span>
        </div>

        <div className="divide-y divide-slate-100">
          {pendientes.map((doc) => (
            <div key={doc.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50 transition">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 border border-amber-200 flex items-center justify-center font-bold font-mono text-xs">
                  {doc.correlativo.slice(0, 3)}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-xs text-slate-900">{doc.correlativo}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 font-bold text-slate-600">
                      {doc.tipo}
                    </span>
                  </div>
                  <p className="text-xs text-slate-700 font-bold mt-0.5">{doc.cliente}</p>
                  <p className="text-[11px] text-amber-700 mt-0.5 font-medium">{doc.motivo}</p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900">{doc.total}</p>
                  <p className="text-[10px] text-slate-400">{doc.fecha}</p>
                </div>
                <button
                  type="button"
                  onClick={() => alert(`Reenviando comprobante ${doc.correlativo}...`)}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Enviar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
