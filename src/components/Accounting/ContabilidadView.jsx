import React, { useState } from 'react';
import { 
  Calculator, FileSpreadsheet, Download, Calendar, Filter, 
  CheckCircle2, ArrowUpDown, BookOpen, AlertCircle, TrendingUp, DollarSign
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ContabilidadView() {
  const { empresa } = useAuth();
  const [activePeriod, setActivePeriod] = useState('2026-09');

  const books = [
    { id: '14.1', code: 'RCE-14.1', name: 'Registro de Ventas e Ingresos Electrónico', count: 184, total: 'Bs. 42,950.00', status: 'CERRADO' },
    { id: '8.1', code: 'RCE-8.1', name: 'Registro de Compras Electrónico', count: 48, total: 'Bs. 21,300.00', status: 'PENDIENTE' },
    { id: '5.1', code: 'LD-5.1', name: 'Libro Diario Formato Simplificado', count: 232, total: 'Bs. 64,250.00', status: 'GENERADO' },
    { id: '6.1', code: 'LM-6.1', name: 'Libro Mayor Acumulado', count: 18, total: 'Bs. 64,250.00', status: 'GENERADO' },
    { id: '3.7', code: 'INV-3.7', name: 'Kardex / Registro de Inventario Permanente Valorizado', count: 450, total: 'Bs. 89,120.00', status: 'ACTIVO' }
  ];

  const handleExport = (bookName) => {
    alert(`Generando archivo TXT / Excel para "${bookName}" del periodo ${activePeriod}...`);
  };

  return (
    <div className="space-y-6 font-sans select-none pb-12">
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 border border-indigo-100 flex items-center justify-center font-bold">
            <Calculator className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-slate-900">Módulo Contable & Libros Electrónicos</h1>
              <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                Oficial SIAT / SUNAT
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Generación de libros oficiales, exportación PLE, SIAT y resúmenes tributarios para {empresa?.nombre || 'la empresa'}.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-700">
            <Calendar className="w-4 h-4 text-slate-400" />
            <span>Periodo:</span>
            <input 
              type="month" 
              value={activePeriod} 
              onChange={(e) => setActivePeriod(e.target.value)}
              className="bg-transparent text-slate-900 font-bold outline-none"
            />
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 block mb-1">Total Débito Fiscal Estimado</span>
          <p className="text-2xl font-black text-slate-900">Bs. 5,583.50</p>
          <span className="text-[11px] text-emerald-600 font-bold mt-1 inline-block">13% sobre ventas declaradas</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 block mb-1">Total Crédito Fiscal Compras</span>
          <p className="text-2xl font-black text-indigo-600">Bs. 2,769.00</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">48 facturas de proveedores</span>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200">
          <span className="text-xs font-bold text-slate-400 block mb-1">Saldo Tributario del Periodo</span>
          <p className="text-2xl font-black text-emerald-700">Bs. 2,814.50</p>
          <span className="text-[11px] text-slate-500 font-medium mt-1 inline-block">Impuesto neto por liquidar</span>
        </div>
      </div>

      {/* Libros Electrónicos List */}
      <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" />
            <h2 className="text-sm font-black text-slate-800">Estructuras Contables & Libros Oficiales</h2>
          </div>
          <span className="text-xs text-slate-400 font-medium">Periodo activo: {activePeriod}</span>
        </div>

        <div className="divide-y divide-slate-100">
          {books.map((book) => (
            <div key={book.id} className="p-4 sm:p-5 flex flex-wrap items-center justify-between gap-3 hover:bg-slate-50/80 transition">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center font-mono font-bold text-xs text-slate-700">
                  {book.id}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xs font-black text-slate-900">{book.name}</h3>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 font-bold">
                      {book.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    {book.count} movimientos registrados • Monto: <span className="font-bold text-slate-700">{book.total}</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleExport(book.name)}
                  className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold border border-indigo-200 transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Exportar TXT / PLE</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleExport(book.name + ' (Excel)')}
                  className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200 transition flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Excel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
