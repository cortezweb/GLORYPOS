import React, { useState, useEffect } from 'react';
import { 
  Share2, Eye, ChevronDown, Check, ShoppingCart, 
  ExternalLink, Search, Clock, CheckCircle2, X, FileText
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import SalesSubNav from './SalesSubNav';

const SEED_PEDIDOS_WEB = [
  {
    id: 'pw-1',
    fecha: '18/9/2026, 14:02:30',
    cliente_nombre: 'Robert',
    telefono: '921861544',
    total: 45.90,
    estado: 'Nuevo',
    items: [
      { nombre: 'Gaseosa Inka Cola 1.5L', cantidad: 2, precio: 12.50, subtotal: 25.00 },
      { nombre: 'Galletas surtidas pack', cantidad: 1, precio: 20.90, subtotal: 20.90 }
    ]
  },
  {
    id: 'pw-2',
    fecha: '17/9/2026, 15:16:42',
    cliente_nombre: 'Carlos',
    telefono: '902722035',
    total: 111.90,
    estado: 'Nuevo',
    items: [
      { nombre: 'Arroz Superior 5kg', cantidad: 2, precio: 28.00, subtotal: 56.00 },
      { nombre: 'Aceite vegetal 1L', cantidad: 2, precio: 18.50, subtotal: 37.00 },
      { nombre: 'Azúcar rubia 2kg', cantidad: 2, precio: 9.45, subtotal: 18.90 }
    ]
  },
  {
    id: 'pw-3',
    fecha: '11/9/2026, 12:35:34',
    cliente_nombre: 'jorge',
    telefono: '997242038',
    total: 24.25,
    estado: 'Nuevo',
    items: [
      { nombre: 'Detergente floral 1kg', cantidad: 1, precio: 24.25, subtotal: 24.25 }
    ]
  },
  {
    id: 'pw-4',
    fecha: '10/9/2026, 13:34:08',
    cliente_nombre: 'Ald',
    telefono: '997731824',
    total: 333.00,
    estado: 'Nuevo',
    items: [
      { nombre: 'Ladrillo King Kong', cantidad: 1, precio: 250.00, subtotal: 250.00 },
      { nombre: 'Bolsa de Cemento', cantidad: 2, precio: 41.50, subtotal: 83.00 }
    ]
  },
  {
    id: 'pw-5',
    fecha: '9/9/2026, 13:25:58',
    cliente_nombre: 'efrain',
    telefono: '+59178855551',
    total: 24.25,
    estado: 'Nuevo',
    items: [
      { nombre: 'Pack Fideos Spaguetti', cantidad: 1, precio: 24.25, subtotal: 24.25 }
    ]
  },
  {
    id: 'pw-6',
    fecha: '7/9/2026, 20:28:04',
    cliente_nombre: 'DD',
    telefono: '988694053',
    total: 33.00,
    estado: 'Nuevo',
    items: [
      { nombre: 'Leche evaporada pack x6', cantidad: 1, precio: 33.00, subtotal: 33.00 }
    ]
  },
  {
    id: 'pw-7',
    fecha: '3/9/2026, 17:39:54',
    cliente_nombre: 'Valentin',
    telefono: '983333974',
    total: 133.00,
    estado: 'Nuevo',
    items: [
      { nombre: 'Aceite de Oliva 500ml', cantidad: 2, precio: 45.00, subtotal: 90.00 },
      { nombre: 'Atún en lomitos x3', cantidad: 2, precio: 21.50, subtotal: 43.00 }
    ]
  },
  {
    id: 'pw-8',
    fecha: '3/9/2026, 7:27:48',
    cliente_nombre: 'Luis',
    telefono: '983333974',
    total: 101.50,
    estado: 'Nuevo',
    items: [
      { nombre: 'Pañales Huggies G x32', cantidad: 1, precio: 65.50, subtotal: 65.50 },
      { nombre: 'Toallitas húmedas pack', cantidad: 2, precio: 18.00, subtotal: 36.00 }
    ]
  },
  {
    id: 'pw-9',
    fecha: '2/9/2026, 14:46:36',
    cliente_nombre: 'ROSA',
    telefono: '907443761',
    total: 30.00,
    estado: 'Nuevo',
    items: [
      { nombre: 'Limpiador multiusos 1L', cantidad: 2, precio: 15.00, subtotal: 30.00 }
    ]
  },
  {
    id: 'pw-10',
    fecha: '1/9/2026, 15:21:05',
    cliente_nombre: 'Juan',
    telefono: '902722035',
    total: 61.00,
    estado: 'Nuevo',
    items: [
      { nombre: 'Shampoo anticaspa 400ml', cantidad: 1, precio: 32.00, subtotal: 32.00 },
      { nombre: 'Jabón tocador pack x3', cantidad: 1, precio: 29.00, subtotal: 29.00 }
    ]
  },
  {
    id: 'pw-11',
    fecha: '1/9/2026, 3:52:51',
    cliente_nombre: 'Rafaela',
    telefono: '952802332',
    total: 152.95,
    estado: 'Nuevo',
    items: [
      { nombre: 'Queso Edam 1kg', cantidad: 1, precio: 58.00, subtotal: 58.00 },
      { nombre: 'Jamón inglés 500g', cantidad: 2, precio: 24.50, subtotal: 49.00 },
      { nombre: 'Mantequilla con sal 200g', cantidad: 3, precio: 15.31, subtotal: 45.95 }
    ]
  },
  {
    id: 'pw-12',
    fecha: '27/8/2026, 15:14:44',
    cliente_nombre: 'Jose',
    telefono: '988694053',
    total: 118.75,
    estado: 'Cerrado',
    items: [
      { nombre: 'Vino Tinto Reserva 750ml', cantidad: 1, precio: 75.00, subtotal: 75.00 },
      { nombre: 'Chocolates surtidos caja', cantidad: 1, precio: 43.75, subtotal: 43.75 }
    ]
  },
  {
    id: 'pw-13',
    fecha: '31/7/2026, 13:05:32',
    cliente_nombre: 'Nuevo pedido',
    telefono: '123456789',
    total: 77.75,
    estado: 'Nuevo',
    items: [
      { nombre: 'Café instantáneo 200g', cantidad: 1, precio: 38.00, subtotal: 38.00 },
      { nombre: 'Leche condensada 395g', cantidad: 3, precio: 13.25, subtotal: 39.75 }
    ]
  }
];

export default function PedidosWebView({ onSelectSubView, onOpenPosWithCart, hideSubNav = false }) {
  const { addItem, clearCart } = useCart();
  
  const [pedidos, setPedidos] = useState([]);
  const [filterEstado, setFilterEstado] = useState('TODOS');
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [detailModalOrder, setDetailModalOrder] = useState(null);

  useEffect(() => {
    const saved = localStorage.getItem('glorypos_pedidos_web_v2');
    if (saved) {
      try {
        setPedidos(JSON.parse(saved));
      } catch (e) {
        setPedidos(SEED_PEDIDOS_WEB);
      }
    } else {
      setPedidos(SEED_PEDIDOS_WEB);
      localStorage.setItem('glorypos_pedidos_web_v2', JSON.stringify(SEED_PEDIDOS_WEB));
    }
  }, []);

  const formatSoles = (amount) => {
    const val = Number(amount) || 0;
    return `S/ ${val.toFixed(2)}`;
  };

  const handleUpdateStatus = (id, nuevoEstado) => {
    const updated = pedidos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p);
    setPedidos(updated);
    localStorage.setItem('glorypos_pedidos_web_v2', JSON.stringify(updated));
  };

  const handleConvertToPos = (order) => {
    if (window.confirm(`¿Cargar los productos del pedido de ${order.cliente_nombre} al Punto de Venta (POS)?`)) {
      clearCart();
      if (Array.isArray(order.items)) {
        order.items.forEach(item => {
          addItem(
            {
              id: `item-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
              nombre: item.nombre,
              precio_venta: item.precio || (item.subtotal / (item.cantidad || 1)),
              unidad_medida: 'Unidad'
            },
            null,
            item.cantidad || 1
          );
        });
      }
      handleUpdateStatus(order.id, 'Cerrado');
      if (onOpenPosWithCart) {
        onOpenPosWithCart();
      } else if (onSelectSubView) {
        onSelectSubView('pos');
      }
    }
  };

  const filtered = pedidos.filter(p => {
    if (filterEstado === 'TODOS') return true;
    return p.estado?.toLowerCase() === filterEstado.toLowerCase();
  });

  return (
    <div className="flex-1 flex flex-col font-sans">
      
      {/* Sub-navegación si se renderiza en la sección de Ventas */}
      {!hideSubNav && onSelectSubView && (
        <SalesSubNav currentSubView="pedidos_web" onSelectSubView={onSelectSubView} />
      )}

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-4">
        
        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 1. CABECERA: TÍTULO, SUBTÍTULO & SELECTOR DE ESTADOS                */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Pedidos web
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Pedidos armados en tu Catálogo Digital. La negociación continúa por WhatsApp.
            </p>
          </div>

          <div className="relative self-start sm:self-auto">
            <select
              value={filterEstado}
              onChange={e => setFilterEstado(e.target.value)}
              className="appearance-none bg-white border border-slate-200 rounded-lg pl-3 pr-8 py-2 text-xs font-medium text-slate-700 shadow-2xs focus:outline-none cursor-pointer"
            >
              <option value="TODOS">Todos los estados</option>
              <option value="Nuevo">Nuevo</option>
              <option value="En preparación">En preparación</option>
              <option value="Cerrado">Cerrado</option>
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════ */}
        {/* 2. TABLA DE PEDIDOS WEB (ESTRUCTURA IDÉNTICA A LA IMAGEN)           */}
        {/* ══════════════════════════════════════════════════════════════════ */}
        <div className="bg-white rounded-2xl border border-slate-200/90 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              
              {/* Encabezados */}
              <thead className="bg-slate-50/80 text-[10px] font-bold uppercase text-slate-400 border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Fecha</th>
                  <th className="py-3 px-4">Cliente</th>
                  <th className="py-3 px-4">Productos</th>
                  <th className="py-3 px-4 text-right">Total</th>
                  <th className="py-3 px-4 text-center">Estado</th>
                  <th className="py-3 px-4 text-center">Acciones</th>
                </tr>
              </thead>

              {/* Filas */}
              <tbody className="divide-y divide-slate-100">
                {filtered.map((ord) => {
                  const itemsCount = ord.items?.length || 1;
                  const isExpanded = expandedOrderId === ord.id;
                  const isNuevo = ord.estado?.toLowerCase() === 'nuevo';
                  const isCerrado = ord.estado?.toLowerCase() === 'cerrado';

                  return (
                    <React.Fragment key={ord.id}>
                      <tr className="hover:bg-slate-50/60 transition">
                        
                        {/* 1. Fecha */}
                        <td className="py-3.5 px-4 text-slate-600 font-medium whitespace-nowrap">
                          {ord.fecha}
                        </td>

                        {/* 2. Cliente (Nombre + Teléfono debajo) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <span className="font-semibold text-slate-800 text-xs block">
                            {ord.cliente_nombre}
                          </span>
                          <span className="text-[11px] text-slate-400 block font-normal">
                            {ord.telefono}
                          </span>
                        </td>

                        {/* 3. Productos (Dropdown clickeable verde) */}
                        <td className="py-3.5 px-4 whitespace-nowrap">
                          <button
                            type="button"
                            onClick={() => setExpandedOrderId(isExpanded ? null : ord.id)}
                            className="text-[#00a650] hover:text-emerald-700 font-bold text-xs inline-flex items-center gap-1 cursor-pointer"
                          >
                            <span>{itemsCount} {itemsCount === 1 ? 'producto' : 'productos'}</span>
                            <span className="text-[10px]">▼</span>
                          </button>
                        </td>

                        {/* 4. Total */}
                        <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                          {formatSoles(ord.total)}
                        </td>

                        {/* 5. Estado (Dropdown pill: Nuevo / Cerrado) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="relative inline-block">
                            <select
                              value={ord.estado || 'Nuevo'}
                              onChange={e => handleUpdateStatus(ord.id, e.target.value)}
                              className={`appearance-none pl-3 pr-7 py-1 rounded-full text-xs font-semibold focus:outline-none cursor-pointer border ${
                                isCerrado
                                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                                  : 'bg-blue-50/70 text-blue-600 border-blue-200'
                              }`}
                            >
                              <option value="Nuevo">Nuevo</option>
                              <option value="En preparación">En preparación</option>
                              <option value="Cerrado">Cerrado</option>
                            </select>
                            <ChevronDown className={`w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none ${
                              isCerrado ? 'text-emerald-500' : 'text-blue-400'
                            }`} />
                          </div>
                        </td>

                        {/* 6. Acciones (WhatsApp, Ojo, Convertir) */}
                        <td className="py-3.5 px-4 text-center whitespace-nowrap">
                          <div className="inline-flex items-center gap-2">
                            
                            {/* Botón WhatsApp */}
                            <button
                              type="button"
                              onClick={() => {
                                const itemsSummary = ord.items?.map(i => `• ${i.cantidad}x ${i.nombre}`).join('\n') || '';
                                const msg = encodeURIComponent(
                                  `*PEDIDO WEB GLORYPOS*\n` +
                                  `Hola ${ord.cliente_nombre}, recibimos tu pedido:\n${itemsSummary}\n` +
                                  `Total: ${formatSoles(ord.total)}\n` +
                                  `¿Deseas confirmar la entrega?`
                                );
                                window.open(`https://wa.me/${ord.telefono?.replace(/\D/g, '')}?text=${msg}`, '_blank');
                              }}
                              title="Contactar por WhatsApp"
                              className="p-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg transition"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            {/* Botón Ojo / Ver Detalle */}
                            <button
                              type="button"
                              onClick={() => setDetailModalOrder(ord)}
                              title="Ver detalle del pedido"
                              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg transition"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            {/* Botón Convertir al POS */}
                            <button
                              type="button"
                              onClick={() => handleConvertToPos(ord)}
                              title="Cargar productos al POS y emitir comprobante"
                              className="px-2.5 py-1 text-emerald-700 hover:bg-emerald-50 border border-slate-200 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition cursor-pointer"
                            >
                              <FileText className="w-3 h-3 text-emerald-600" />
                              <span>Convertir</span>
                            </button>

                          </div>
                        </td>

                      </tr>

                      {/* Fila expandible con el desglose de productos */}
                      {isExpanded && (
                        <tr className="bg-slate-50/70 border-b border-slate-100">
                          <td colSpan="6" className="py-2.5 px-8">
                            <div className="bg-white p-3 rounded-xl border border-slate-200/80 shadow-2xs space-y-1.5">
                              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                                Detalle de ítems solicitados
                              </span>
                              {ord.items?.map((it, idx) => (
                                <div key={idx} className="flex justify-between text-xs text-slate-700 py-0.5 border-b border-slate-50 last:border-0">
                                  <span>{it.cantidad}x {it.nombre}</span>
                                  <span className="font-semibold text-slate-900">{formatSoles(it.subtotal || it.precio * it.cantidad)}</span>
                                </div>
                              ))}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </main>

      {/* Modal Detalle de Pedido */}
      {detailModalOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-slate-950/50 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-200 text-xs">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="font-bold text-sm">Detalle del Pedido Web</h3>
              <button
                type="button"
                onClick={() => setDetailModalOrder(null)}
                className="p-1 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-3">
              <div className="flex justify-between border-b border-slate-100 pb-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Cliente</span>
                  <span className="font-bold text-slate-900 text-sm">{detailModalOrder.cliente_nombre}</span>
                  <span className="text-slate-500">{detailModalOrder.telefono}</span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Fecha</span>
                  <span className="text-slate-600">{detailModalOrder.fecha}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Productos</span>
                {detailModalOrder.items?.map((it, i) => (
                  <div key={i} className="flex justify-between text-slate-700 py-0.5">
                    <span>{it.cantidad}x {it.nombre}</span>
                    <span className="font-semibold text-slate-900">{formatSoles(it.subtotal || it.precio * it.cantidad)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="font-bold text-slate-700">Total Pedido</span>
                <span className="text-lg font-black text-slate-900">{formatSoles(detailModalOrder.total)}</span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    handleConvertToPos(detailModalOrder);
                    setDetailModalOrder(null);
                  }}
                  className="flex-1 py-2 bg-[#00a650] hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs transition flex items-center justify-center gap-1.5"
                >
                  <ShoppingCart className="w-3.5 h-3.5" />
                  <span>Convertir a Venta POS</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
