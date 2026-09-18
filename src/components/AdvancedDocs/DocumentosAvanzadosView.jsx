import React, { useState } from 'react';
import { FileCode, FileText, CheckCircle2, ShieldCheck, AlertCircle, Plus, Search, Printer, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function DocumentosAvanzadosView() {
  const { empresa } = useAuth();
  const [activeTab, setActiveTab] = useState('NOTAS_CREDITO'); // 'NOTAS_CREDITO' | 'PROFORMAS' | 'SIAT'
  const [searchTerm, setSearchTerm] = useState('');

  const [documentos, setDocumentos] = useState([
    {
      id: 'NC-001',
      tipo: 'NOTA DE CRÉDITO',
      serie: 'NC01-000004',
      comprobanteModificado: 'F001-000021',
      cliente: 'Comercializadora Santa Cruz S.R.L.',
      motivo: 'Devolución de mercadería dañada',
      monto: 150.00,
      fecha: '2026-09-16',
      estado: 'SIAT ACEPTADO'
    },
    {
      id: 'PROF-001',
      tipo: 'PROFORMA / COTIZACIÓN',
      serie: 'COT-000109',
      comprobanteModificado: '-',
      cliente: 'Restaurante Los Tajibos',
      motivo: 'Cotización para provisión mensual',
      monto: 2450.00,
      fecha: '2026-09-18',
      estado: 'VIGENTE'
    }
  ]);

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center space-x-2">
            <span className="text-[10px] font-extrabold uppercase tracking-wider bg-violet-50 text-[#7c3aed] px-2 py-0.5 rounded-full border border-violet-100">
              SIAT Electrónico Bolivia
            </span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Documentos Avanzados</h1>
          <p className="text-xs text-slate-500">Notas de crédito, notas de débito, proformas y contingencias tributarias.</p>
        </div>

        <button
          onClick={() => alert('Emisión de Nota de Crédito / Débito habilitada con firma digital')}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#7c3aed] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>+ Nuevo Documento</span>
        </button>
      </div>

      {/* Tabs Filter */}
      <div className="flex space-x-2 bg-slate-100 p-1 rounded-xl border border-slate-200 text-xs font-bold">
        {[
          { id: 'NOTAS_CREDITO', label: 'Notas de Crédito & Débito' },
          { id: 'PROFORMAS', label: 'Proformas & Cotizaciones' },
          { id: 'SIAT', label: 'Paquetes Contingencia SIAT' }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-2 rounded-lg text-center transition ${
              activeTab === tab.id
                ? 'bg-white text-blue-600 shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Document List Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-400 text-[10px] uppercase font-bold">
                <th className="pb-2">Serie / N°</th>
                <th className="pb-2">Tipo</th>
                <th className="pb-2">Cliente</th>
                <th className="pb-2">Motivo / Modifica</th>
                <th className="pb-2">Estado</th>
                <th className="pb-2 text-right">Total (Bs.)</th>
                <th className="pb-2 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documentos.map(doc => (
                <tr key={doc.id} className="hover:bg-slate-50">
                  <td className="py-3 font-mono font-bold text-slate-900">{doc.serie}</td>
                  <td className="py-3 text-slate-700 font-semibold">{doc.tipo}</td>
                  <td className="py-3 font-medium text-slate-800">{doc.cliente}</td>
                  <td className="py-3 text-slate-500 text-[11px]">{doc.motivo}</td>
                  <td className="py-3">
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-700 font-bold rounded-full text-[10px] border border-blue-200">
                      {doc.estado}
                    </span>
                  </td>
                  <td className="py-3 text-right font-black text-slate-900">
                    Bs. {doc.monto.toFixed(2)}
                  </td>
                  <td className="py-3 text-center">
                    <button
                      onClick={() => window.print()}
                      className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1"
                    >
                      <Printer className="w-3 h-3" />
                      <span>Imprimir</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
