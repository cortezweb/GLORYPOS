import React, { useState, useEffect } from 'react';
import { 
  Receipt, Search, Printer, Share2, ArrowRightLeft, 
  CheckCircle2, Clock, Truck, Plus, DollarSign, AlertCircle 
} from 'lucide-react';
import { db } from '../../db/dexie';
import SalesSubNav from './SalesSubNav';

export default function NotasVentaView({ onSelectSubView, onOpenReceipt }) {
  const [ventas, setVentas] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, PAGADO, PENDIENTE, DESPACHO_PENDIENTE

  const loadVentas = async () => {
    const list = await db.ventas.reverse().toArray();
    setVentas(list);
  };

  useEffect(() => {
    loadVentas();
  }, []);

  const notas = ventas.filter(v => v.tipo_documento === 'NOTA_VENTA');

  const totalNotas = notas.reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  const totalPagadas = notas.filter(v => v.estado === 'PAGADO').reduce((sum, v) => sum + (Number(v.total) || 0), 0);
  const totalPendientes = notas.filter(v => v.estado === 'PENDIENTE').reduce((sum, v) => sum + (Number(v.total) || 0), 0);

  const filtered = notas.filter(v => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = 
      v.correlativo?.toLowerCase().includes(term) ||
      v.cliente_nombre?.toLowerCase().includes(term) ||
      v.cliente_ci_nit?.includes(term);

    let matchesStatus = true;
    if (filterStatus === 'PAGADO') matchesStatus = v.estado === 'PAGADO';
    if (filterStatus === 'PENDIENTE') matchesStatus = v.estado === 'PENDIENTE';
    if (filterStatus === 'DESPACHO_PENDIENTE') matchesStatus = v.despacho_estado === 'PENDIENTE';

    return matchesSearch && matchesStatus;
  });

  // Action: Convert internal Note into Official SIAT Invoice
  const handleConvertToSiat = async (nota) => {
    if (window.confirm(`¿Deseas convertir la Nota de Venta ${nota.correlativo} en una Factura Electrónica SIAT oficial?`)) {
      const randomCuf = Array.from({ length: 48 }, () => Math.floor(Math.random() * 16).toString(16).toUpperCase()).join('');
      const correlativoFactura = `F-${Math.floor(100000 + Math.random() * 900000)}`;
      
      await db.ventas.update(nota.id, {
        tipo_documento: 'FACTURA_SIAT',
        tipo_label: 'Factura Electrónica SIAT',
        correlativo: correlativoFactura,
        cuf: randomCuf,
        estado: 'EMITIDO'
      });
      
      alert(`¡Nota convertida exitosamente a Factura SIAT N° ${correlativoFactura}!`);
      await loadVentas();
    }
  };

  // Action: Mark as Paid
  const handleMarkAsPaid = async (id) => {
    await db.ventas.update(id, { 
      estado: 'PAGADO', 
      metodo_pago: 'Efectivo',
      monto_recibido: ventas.find(v => v.id === id)?.total || 0 
    });
    await loadVentas();
  };

  // Action: Mark as Dispatched
  const handleMarkAsDispatched = async (id) => {
    await db.ventas.update(id, { despacho_estado: 'ENTREGADO' });
    await loadVentas();
  };

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen">
      {/* Sales Sub-navigation Bar */}
      <SalesSubNav currentSubView="notas_venta" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-2xs">
          <div>
            <h1 className="text-lg sm:text-xl font-black text-gray-900 tracking-tight flex items-center gap-2">
              <Receipt className="w-5 h-5 text-indigo-600" />
              Notas de Venta Internas
            </h1>
            <p className="text-xs text-gray-500 mt-0.5">
              Control de tickets internos, entregas a crédito y despachos de mercadería
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectSubView('pos')}
              className="px-3.5 py-2 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
            >
              <Plus className="w-4 h-4" />
              Nueva Nota en POS
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50/60 border border-indigo-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 block">
              Total Notas Registradas
            </span>
            <span className="text-xl font-black text-gray-900 mt-1 block">
              Bs. {totalNotas.toFixed(2)}
            </span>
            <span className="text-[11px] text-gray-500 mt-0.5 block">
              {notas.length} notas de venta emitidas
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-emerald-50 to-teal-50/60 border border-emerald-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">
              Cobradas al Contado
            </span>
            <span className="text-xl font-black text-emerald-800 mt-1 block">
              Bs. {totalPagadas.toFixed(2)}
            </span>
            <span className="text-[11px] text-emerald-600 font-semibold mt-0.5 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" /> Fondos en caja
            </span>
          </div>

          <div className="p-3.5 bg-gradient-to-br from-amber-50 to-orange-50/60 border border-amber-100 rounded-2xl">
            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">
              Pendientes de Cobro (Crédito)
            </span>
            <span className="text-xl font-black text-amber-800 mt-1 block">
              Bs. {totalPendientes.toFixed(2)}
            </span>
            <span className="text-[11px] text-amber-600 font-medium mt-0.5 flex items-center gap-1">
              <Clock className="w-3 h-3" /> Cuentas por cobrar
            </span>
          </div>
        </div>

        {/* Search & Status Filters */}
        <div className="bg-white p-3.5 rounded-2xl border border-gray-200 shadow-2xs space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por N° de nota o cliente..."
                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex items-center gap-1 bg-gray-100 p-1 rounded-xl shrink-0 overflow-x-auto no-scrollbar">
              <button
                onClick={() => setFilterStatus('ALL')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === 'ALL'
                    ? 'bg-white text-indigo-600 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Todas ({notas.length})
              </button>
              <button
                onClick={() => setFilterStatus('PAGADO')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === 'PAGADO'
                    ? 'bg-white text-emerald-600 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Pagadas
              </button>
              <button
                onClick={() => setFilterStatus('PENDIENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === 'PENDIENTE'
                    ? 'bg-white text-amber-600 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Por Cobrar
              </button>
              <button
                onClick={() => setFilterStatus('DESPACHO_PENDIENTE')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                  filterStatus === 'DESPACHO_PENDIENTE'
                    ? 'bg-white text-blue-600 shadow-2xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Despacho Pendiente
              </button>
            </div>
          </div>
        </div>

        {/* Notes List */}
        <div className="space-y-2.5">
          {filtered.map((nota) => {
            const isPagado = nota.estado === 'PAGADO';
            const isEntregado = nota.despacho_estado === 'ENTREGADO';
            const fechaFormateada = new Date(nota.fecha).toLocaleString('es-BO', {
              day: '2-digit',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit'
            });

            return (
              <div
                key={nota.id}
                className="bg-white rounded-2xl border border-gray-200 hover:border-indigo-300 transition-all p-4 shadow-2xs"
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  {/* Left Note Details */}
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div className="w-11 h-11 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-xs shrink-0 border border-indigo-100">
                      <Receipt className="w-5 h-5" />
                    </div>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-black text-sm text-gray-900">
                          {nota.correlativo || 'NV-000'}
                        </span>
                        {/* Payment Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isPagado
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isPagado ? (
                            <><CheckCircle2 className="w-3 h-3" /> PAGADO</>
                          ) : (
                            <><Clock className="w-3 h-3" /> POR COBRAR</>
                          )}
                        </span>

                        {/* Dispatch Badge */}
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isEntregado
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-orange-100 text-orange-800'
                        }`}>
                          <Truck className="w-3 h-3" />
                          {isEntregado ? 'ENTREGADO' : 'PENDIENTE DESPACHO'}
                        </span>

                        <span className="text-xs text-gray-400 font-medium">
                          {fechaFormateada}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-gray-800 mt-1 truncate">
                        {nota.cliente_nombre || 'Cliente Particular'}
                        <span className="text-gray-400 font-normal ml-1">
                          (NIT/CI: {nota.cliente_ci_nit || '0'})
                        </span>
                      </p>

                      <div className="text-[11px] text-gray-500 mt-0.5 flex flex-wrap items-center gap-2">
                        <span>{nota.items?.length || 1} producto(s) en pedido</span>
                        <span>•</span>
                        <span className="font-medium text-gray-700">
                          Modalidad: {nota.metodo_pago || 'Contado'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Amount & Actions */}
                  <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-gray-100">
                    <div className="text-left md:text-right">
                      <span className="text-[10px] font-bold uppercase text-gray-400 block">Total Nota</span>
                      <span className="text-lg font-black text-gray-900 tracking-tight block">
                        Bs. {Number(nota.total || 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {/* Convert to SIAT Invoice */}
                      <button
                        onClick={() => handleConvertToSiat(nota)}
                        className="px-2.5 py-1.5 bg-blue-50 text-[#2563eb] hover:bg-blue-100 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-blue-200"
                        title="Convertir esta nota en Factura Electrónica SIAT"
                      >
                        <ArrowRightLeft className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">A Factura SIAT</span>
                      </button>

                      {/* Mark as paid button if pending */}
                      {!isPagado && (
                        <button
                          onClick={() => handleMarkAsPaid(nota.id)}
                          className="px-2.5 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-emerald-200"
                          title="Registrar cobro de esta nota"
                        >
                          <DollarSign className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Cobrar</span>
                        </button>
                      )}

                      {/* Mark as dispatched if pending */}
                      {!isEntregado && (
                        <button
                          onClick={() => handleMarkAsDispatched(nota.id)}
                          className="px-2.5 py-1.5 bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-xl text-xs font-bold transition flex items-center gap-1 border border-purple-200"
                          title="Marcar pedido como entregado al cliente"
                        >
                          <Truck className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Entregar</span>
                        </button>
                      )}

                      {/* Print receipt */}
                      <button
                        onClick={() => onOpenReceipt(nota)}
                        className="p-2 text-gray-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition border border-gray-200"
                        title="Reimprimir Nota de Venta"
                      >
                        <Printer className="w-4 h-4" />
                      </button>

                      {/* WhatsApp share */}
                      <button
                        onClick={() => {
                          const msg = encodeURIComponent(`Hola ${nota.cliente_nombre}, le adjuntamos su Nota de Venta GLORYPOS N° ${nota.correlativo} por un total de Bs. ${Number(nota.total).toFixed(2)}. Estado: ${nota.estado}. ¡Muchas gracias!`);
                          window.open(`https://wa.me/?text=${msg}`, '_blank');
                        }}
                        className="p-2 text-gray-600 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition border border-gray-200"
                        title="Enviar Nota por WhatsApp"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {filtered.length === 0 && (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-200 p-8 space-y-3">
              <Receipt className="w-12 h-12 mx-auto text-gray-300" />
              <h3 className="font-bold text-gray-800 text-sm">No se encontraron notas de venta</h3>
              <p className="text-xs text-gray-500 max-w-sm mx-auto">
                No hay notas internas registradas con los filtros actuales.
              </p>
              <button
                onClick={() => onSelectSubView('pos')}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700 transition"
              >
                Crear Nota en POS
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
