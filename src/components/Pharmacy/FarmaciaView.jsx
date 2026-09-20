import React, { useState } from 'react';
import { 
  Pill, AlertTriangle, Calendar, ShieldCheck, Search, Filter, 
  Plus, CheckCircle2, Clock, FileSpreadsheet, Layers
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function FarmaciaView() {
  const { empresa } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');

  const lotes = [
    { id: 'L-01', medicamento: 'Paracetamol 500mg (Caja x100)', laboratorio: 'Bago', lote: 'BG-84910', vencimiento: '2027-02-15', stock: 120, estado: 'BUENO', dias: 512 },
    { id: 'L-02', medicamento: 'Amoxicilina 500mg Cápsulas', laboratorio: 'Vita', lote: 'VT-39102', vencimiento: '2026-10-30', stock: 45, estado: 'PROXIMO_A_VENCER', dias: 40 },
    { id: 'L-03', medicamento: 'Ibuprofeno 400mg Tabletas', laboratorio: 'Inti', lote: 'IN-77124', vencimiento: '2026-09-15', stock: 12, estado: 'VENCIDO', dias: -5 },
    { id: 'L-04', medicamento: 'Omeprazol 20mg Cápsulas', laboratorio: 'Bago', lote: 'BG-10928', vencimiento: '2027-06-20', stock: 80, estado: 'BUENO', dias: 638 },
    { id: 'L-05', medicamento: 'Loratadina 10mg Comprimidos', laboratorio: 'Vita', lote: 'VT-99481', vencimiento: '2026-11-15', stock: 35, estado: 'PROXIMO_A_VENCER', dias: 56 },
  ];

  const filtered = lotes.filter(l => 
    l.medicamento.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.laboratorio.toLowerCase().includes(searchTerm.toLowerCase()) ||
    l.lote.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 border border-teal-200 flex items-center justify-center font-bold">
            <Pill className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Control de Lotes & Vencimientos</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-teal-50 text-teal-800 border border-teal-200">
                Farmacia / Salud
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Registro obligatorio de números de lote, fecha de caducidad, registro sanitario y principios activos.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => alert('Formulario de ingreso de nuevo lote')}
          className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 text-white text-xs font-black rounded-xl transition flex items-center gap-2 shadow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>Ingresar Nuevo Lote</span>
        </button>
      </div>

      {/* Alerta de Vencimientos */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center gap-3 text-amber-900">
        <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
        <div className="text-xs">
          <p className="font-bold">2 Lotes próximos a vencer en los siguientes 60 días.</p>
          <p className="text-amber-700 mt-0.5">Revisa las promociones de rotación rápida antes de la fecha de caducidad.</p>
        </div>
      </div>

      {/* Lotes Table */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between gap-3">
          <div className="relative flex-1 max-w-sm">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Buscar por medicamento, lote o laboratorio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="p-3.5">Medicamento / Producto</th>
                <th className="p-3.5">Laboratorio</th>
                <th className="p-3.5">N° Lote</th>
                <th className="p-3.5">Vencimiento</th>
                <th className="p-3.5 text-right">Stock</th>
                <th className="p-3.5 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50/80 transition">
                  <td className="p-3.5 font-bold text-slate-900">{item.medicamento}</td>
                  <td className="p-3.5 text-slate-600">{item.laboratorio}</td>
                  <td className="p-3.5 font-mono text-slate-800 font-bold">{item.lote}</td>
                  <td className="p-3.5 text-slate-600">{item.vencimiento}</td>
                  <td className="p-3.5 text-right font-black text-slate-900">{item.stock} u.</td>
                  <td className="p-3.5 text-center">
                    {item.estado === 'BUENO' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        Vigente ({item.dias}d)
                      </span>
                    )}
                    {item.estado === 'PROXIMO_A_VENCER' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Por Vencer ({item.dias}d)
                      </span>
                    )}
                    {item.estado === 'VENCIDO' && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        Vencido
                      </span>
                    )}
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
