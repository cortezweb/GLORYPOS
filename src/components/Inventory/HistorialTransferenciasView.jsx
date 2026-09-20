import React, { useState, useEffect, useMemo } from 'react';
import { 
  History, Plus, RefreshCw, Eye, CheckCircle2, X, ArrowRightLeft,
  Package, Calendar, Building2, FileText
} from 'lucide-react';
import { db } from '../../db/dexie';
import InventorySubNav from './InventorySubNav';

const SEED_TRANSFERENCIAS = [
  {
    id: 'trf-1',
    fechaDisplay: '16/9/2026, 1:30:01 p.m.',
    origen: 'Principal',
    destino: 'ALMACEN',
    productos: [{ nombre: 'Fresa', cantidad: 7, presentacion: 'Unidad' }],
    productosDisplay: '× 7',
    estado: 'Confirmado',
    notas: 'Traslado de reposición de tienda a almacén'
  },
  {
    id: 'trf-2',
    fechaDisplay: '13/9/2026, 7:22:10 p.m.',
    origen: 'Principal',
    destino: 'ALMACEN',
    productos: [
      { nombre: 'Boxer', cantidad: 25, presentacion: 'Unidad' },
      { nombre: 'Bolsa para basura grande', cantidad: 30, presentacion: 'Paquete' },
      { nombre: 'Vaso plástico PET 16 oz', cantidad: 40, presentacion: 'Ciento' }
    ],
    productosDisplay: '× 25  × 30  × 40',
    estado: 'Confirmado',
    notas: 'Traslado múltiple de insumos'
  },
  {
    id: 'trf-3',
    fechaDisplay: '6/8/2026, 3:48:15 p.m.',
    origen: 'Principal',
    destino: 'ALMACEN',
    productos: [{ nombre: 'Escurridor plástico para vajilla', cantidad: 5, presentacion: 'Unidad' }],
    productosDisplay: '× 5',
    estado: 'Confirmado',
    notas: 'Reposición programada'
  },
  {
    id: 'trf-4',
    fechaDisplay: '6/8/2026, 3:45:58 p.m.',
    origen: 'Principal',
    destino: 'ALMACEN',
    productos: [{ nombre: 'Colador plástico mediano', cantidad: 3, presentacion: 'Unidad' }],
    productosDisplay: '× 3',
    estado: 'Confirmado',
    notas: 'Traslado por solicitud de inventario'
  },
  {
    id: 'trf-5',
    fechaDisplay: '6/8/2026, 3:41:05 p.m.',
    origen: 'Principal',
    destino: 'ALMACEN',
    productos: [{ nombre: 'Balde plástico 20 litros', cantidad: 5, presentacion: 'Unidad' }],
    productosDisplay: '× 5',
    estado: 'Confirmado',
    notas: 'Traslado inicial'
  }
];

export default function HistorialTransferenciasView({ onSelectSubView }) {
  const [transferencias, setTransferencias] = useState([]);
  const [estadoFilter, setEstadoFilter] = useState('Todos los estados');
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  const loadData = async () => {
    try {
      let list = [];
      if (db.transferencias_inventario) {
        list = await db.transferencias_inventario.toArray();
      }
      if (!list || list.length === 0) {
        if (db.transferencias_inventario) {
          await db.transferencias_inventario.bulkAdd(SEED_TRANSFERENCIAS);
        }
        list = SEED_TRANSFERENCIAS;
      }
      setTransferencias(list);
    } catch (err) {
      console.warn('Error loading transferencias:', err);
      setTransferencias(SEED_TRANSFERENCIAS);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredTransferencias = useMemo(() => {
    if (estadoFilter === 'Todos los estados') return transferencias;
    return transferencias.filter(t => t.estado === estadoFilter);
  }, [transferencias, estadoFilter]);

  return (
    <div className="flex-1 flex flex-col font-sans animate-fadeIn pb-14 bg-slate-50 min-h-screen">
      
      {/* Sub-navegación superior de Inventario */}
      {onSelectSubView && (
        <InventorySubNav currentSubView="historial_transferencias" onSelectSubView={onSelectSubView} />
      )}

      <main className="max-w-7xl mx-auto px-4 py-5 w-full space-y-4">

        {/* ── CABECERA EXACTA A LA IMAGEN ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
              Historial de transferencias
            </h1>
            <p className="text-xs text-slate-500">
              Enviado = stock reservado en origen. Al confirmar en destino se suma el stock allí y ya no se puede cancelar.
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectSubView && onSelectSubView('transferencias')}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition flex items-center gap-1.5 shadow-2xs cursor-pointer shrink-0"
          >
            <Plus className="w-3.5 h-3.5 text-emerald-600" />
            <span>+ Nueva transferencia</span>
          </button>
        </div>

        {/* ── TARJETA DE TRANSFERENCIAS — ESTADOS ── */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          
          {/* Barra superior de la tarjeta */}
          <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <RefreshCw className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-bold text-slate-800">
                Transferencias — Estados
              </span>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={estadoFilter}
                onChange={(e) => setEstadoFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none cursor-pointer"
              >
                <option value="Todos los estados">Todos los estados</option>
                <option value="Confirmado">Confirmado</option>
                <option value="Enviado">Enviado</option>
                <option value="Cancelado">Cancelado</option>
              </select>
            </div>
          </div>

          {/* Tabla de Historial (Idéntica a la imagen) */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-semibold text-slate-400 bg-white">
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Origen → Destino</th>
                  <th className="py-3 px-4">Productos</th>
                  <th className="py-3 px-4">Estado</th>
                  <th className="py-3 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredTransferencias.map((trf) => (
                  <tr key={trf.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* Fecha */}
                    <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                      {trf.fechaDisplay || trf.fecha}
                    </td>

                    {/* Origen → Destino */}
                    <td className="py-3 px-4 text-slate-700 font-medium whitespace-nowrap">
                      <span className="font-semibold text-slate-900">{trf.origen}</span>
                      <span className="text-slate-400 mx-1.5">→</span>
                      <span className="font-bold text-slate-800">{trf.destino}</span>
                    </td>

                    {/* Productos (e.g. × 7, × 25  × 30  × 40) */}
                    <td className="py-3 px-4 text-slate-500 font-mono text-xs whitespace-nowrap">
                      {trf.productosDisplay || (trf.productos ? trf.productos.map(p => `× ${p.cantidad}`).join('  ') : '—')}
                    </td>

                    {/* Estado (Confirmado en verde suave) */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span className="text-[#00a650] font-bold text-xs">
                        {trf.estado || 'Confirmado'}
                      </span>
                    </td>

                    {/* Acciones */}
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => setSelectedTransfer(trf)}
                        className="px-2.5 py-1 text-slate-500 hover:text-slate-800 bg-slate-50 hover:bg-slate-100 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-400" />
                        <span>Ver detalle</span>
                      </button>
                    </td>

                  </tr>
                ))}

                {filteredTransferencias.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-12 text-center text-slate-400 italic">
                      No hay registros de transferencias para el estado seleccionado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        </div>

      </main>

      {/* ── MODAL: DETALLE DE TRANSFERENCIA ── */}
      {selectedTransfer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Detalle de Transferencia</h3>
                  <p className="text-[11px] text-slate-500">{selectedTransfer.fechaDisplay}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">ORIGEN</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.origen}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block">DESTINO</span>
                  <span className="font-bold text-slate-800">{selectedTransfer.destino}</span>
                </div>
              </div>

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1">ESTADO</span>
                <span className="inline-block px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-[#00a650]">
                  {selectedTransfer.estado}
                </span>
              </div>

              {selectedTransfer.notas && (
                <div>
                  <span className="text-[10px] text-slate-400 font-bold block mb-1">NOTAS / MOTIVO</span>
                  <p className="p-2.5 bg-slate-50 rounded-xl text-slate-700 italic border border-slate-100">
                    "{selectedTransfer.notas}"
                  </p>
                </div>
              )}

              <div>
                <span className="text-[10px] text-slate-400 font-bold block mb-1.5">PRODUCTOS TRANSFERIDOS</span>
                <div className="border border-slate-200 rounded-xl divide-y divide-slate-100 overflow-hidden">
                  {selectedTransfer.productos?.map((p, idx) => (
                    <div key={idx} className="p-2.5 flex items-center justify-between text-xs">
                      <div>
                        <p className="font-bold text-slate-800">{p.nombre || 'Producto'}</p>
                        <p className="text-[10px] text-slate-400">Presentación: {p.presentacion || 'Unidad'}</p>
                      </div>
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                        × {p.cantidad}
                      </span>
                    </div>
                  )) || (
                    <div className="p-3 text-slate-400 italic text-center">
                      {selectedTransfer.productosDisplay}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedTransfer(null)}
                className="px-4 py-2 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
