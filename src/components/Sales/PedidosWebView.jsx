import React, { useState, useEffect } from 'react';
import { 
  Globe, Search, CheckCircle2, Clock, Truck, 
  MapPin, Phone, ShoppingBag, ArrowRight, ExternalLink,
  Plus, Eye, Check, X, AlertCircle
} from 'lucide-react';
import SalesSubNav from './SalesSubNav';

const DEFAULT_ORDERS = [
  {
    id: 'ord-101',
    cliente_nombre: 'Carolina Rojas Montero',
    telefono: '77291823',
    direccion: 'Av. San Martín, Edificio Las Palmas #4B',
    tipo_entrega: 'DELIVERY',
    fecha: '2026-08-20T10:30:00',
    items: [
      { nombre: 'Coca-Cola Original 2L Retornable', cantidad: 2, subtotal: 23.00 },
      { nombre: 'Galletas Mabel Moraditas 140g', cantidad: 3, subtotal: 13.50 }
    ],
    total: 36.50,
    metodo_pago: 'QR Simple',
    estado: 'PENDIENTE'
  },
  {
    id: 'ord-102',
    cliente_nombre: 'Fernando Zeballos',
    telefono: '78019283',
    direccion: 'Retiro en Tienda',
    tipo_entrega: 'RETIRO',
    fecha: '2026-08-20T09:15:00',
    items: [
      { nombre: 'Cerveza Paceña Pilsener 710ml', cantidad: 6, subtotal: 90.00 }
    ],
    total: 90.00,
    metodo_pago: 'Efectivo contra entrega',
    estado: 'EN_PREPARACION'
  },
  {
    id: 'ord-103',
    cliente_nombre: 'Luciana Justiniano',
    telefono: '79102938',
    direccion: 'Barrio Sirari, Calle 3 #120',
    tipo_entrega: 'DELIVERY',
    fecha: '2026-08-19T18:40:00',
    items: [
      { nombre: 'Aceite Vegetal Fino 900ml', cantidad: 2, subtotal: 24.00 },
      { nombre: 'Fideo Famosa Spaguetti 400g', cantidad: 4, subtotal: 22.00 }
    ],
    total: 46.00,
    metodo_pago: 'Transferencia QR',
    estado: 'ENTREGADO'
  }
];

export default function PedidosWebView({ onSelectSubView, onOpenPosWithCart }) {
  const [pedidos, setPedidos] = useState([]);
  const [search, setSearch] = useState('');
  const [filterEstado, setFilterEstado] = useState('ALL');

  useEffect(() => {
    const saved = localStorage.getItem('glorypos_pedidos_web');
    if (saved) {
      try {
        setPedidos(JSON.parse(saved));
      } catch (e) {
        setPedidos(DEFAULT_ORDERS);
      }
    } else {
      setPedidos(DEFAULT_ORDERS);
      localStorage.setItem('glorypos_pedidos_web', JSON.stringify(DEFAULT_ORDERS));
    }
  }, []);

  const handleUpdateStatus = (id, nuevoEstado) => {
    const updated = pedidos.map(p => p.id === id ? { ...p, estado: nuevoEstado } : p);
    setPedidos(updated);
    localStorage.setItem('glorypos_pedidos_web', JSON.stringify(updated));
  };

  const filtered = pedidos.filter(p => {
    const match = `${p.cliente_nombre} ${p.id} ${p.telefono}`.toLowerCase().includes(search.toLowerCase());
    if (filterEstado === 'PENDIENTE') return match && p.estado === 'PENDIENTE';
    if (filterEstado === 'EN_PREPARACION') return match && p.estado === 'EN_PREPARACION';
    if (filterEstado === 'ENTREGADO') return match && p.estado === 'ENTREGADO';
    return match;
  });

  return (
    <div className="flex-1 flex flex-col bg-slate-50 min-h-screen font-sans">
      <SalesSubNav currentSubView="pedidos_web" onSelectSubView={onSelectSubView} />

      <main className="max-w-6xl mx-auto w-full p-3 sm:p-5 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Globe className="w-4 h-4" />
              </div>
              <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                Pedidos Web & Catálogo Online
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestión de pedidos recibidos desde la tienda virtual, delivery y pedidos por WhatsApp
            </p>
          </div>

          <button
            type="button"
            onClick={() => onSelectSubView && onSelectSubView('tienda_virtual')}
            className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl transition flex items-center gap-1.5"
          >
            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
            <span>Configurar Tienda Web</span>
          </button>
        </div>

        {/* 3 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-amber-600">Pedidos Pendientes</span>
            <div className="text-2xl font-black text-amber-600 font-mono">
              {pedidos.filter(p => p.estado === 'PENDIENTE').length}
            </div>
            <p className="text-[10px] text-slate-400">Requieren confirmación</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-blue-600">En Preparación</span>
            <div className="text-2xl font-black text-blue-600 font-mono">
              {pedidos.filter(p => p.estado === 'EN_PREPARACION').length}
            </div>
            <p className="text-[10px] text-slate-400">Empaquetando en almacén</p>
          </div>
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-600">Entregados / Facturados</span>
            <div className="text-2xl font-black text-emerald-600 font-mono">
              {pedidos.filter(p => p.estado === 'ENTREGADO').length}
            </div>
            <p className="text-[10px] text-slate-400">Finalizados exitosamente</p>
          </div>
        </div>

        {/* Filtros */}
        <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setFilterEstado('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEstado === 'ALL' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500'
              }`}
            >
              Todos ({pedidos.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado('PENDIENTE')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEstado === 'PENDIENTE' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              Pendientes
            </button>
            <button
              type="button"
              onClick={() => setFilterEstado('EN_PREPARACION')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                filterEstado === 'EN_PREPARACION' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-500'
              }`}
            >
              En Preparación
            </button>
          </div>

          <div className="relative max-w-xs w-full">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar cliente, orden o teléfono..."
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:bg-white focus:outline-none"
            />
          </div>
        </div>

        {/* Lista de Pedidos */}
        <div className="space-y-3">
          {filtered.map(p => (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3 hover:border-blue-300 transition">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{p.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                        p.estado === 'PENDIENTE' ? 'bg-amber-100 text-amber-800' :
                        p.estado === 'EN_PREPARACION' ? 'bg-blue-100 text-blue-800' : 'bg-emerald-100 text-emerald-800'
                      }`}>
                        {p.estado}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500">{p.cliente_nombre} • Tel: {p.telefono}</p>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-base font-black text-slate-900 font-mono">Bs. {p.total.toFixed(2)}</span>
                  <span className="text-[10px] text-slate-400 block">{p.metodo_pago}</span>
                </div>
              </div>

              {/* Items & Entrega */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs bg-slate-50 p-3 rounded-xl">
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Ítems Solicitados:</span>
                  <ul className="space-y-0.5">
                    {p.items.map((it, i) => (
                      <li key={i} className="text-slate-700 flex justify-between">
                        <span>{it.cantidad}x {it.nombre}</span>
                        <span className="font-mono font-bold">Bs. {it.subtotal.toFixed(2)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 block mb-1">Tipo de Entrega:</span>
                  <p className="text-slate-800 font-medium flex items-center gap-1.5">
                    {p.tipo_entrega === 'DELIVERY' ? <Truck className="w-3.5 h-3.5 text-blue-600" /> : <MapPin className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{p.tipo_entrega === 'DELIVERY' ? `Delivery: ${p.direccion}` : 'Retiro en Mostrador Tienda'}</span>
                  </p>
                </div>
              </div>

              {/* Botones de acción */}
              <div className="flex flex-wrap items-center justify-end gap-2 pt-1">
                {p.estado === 'PENDIENTE' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(p.id, 'EN_PREPARACION')}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Aceptar & Preparar Pedido
                  </button>
                )}
                {p.estado === 'EN_PREPARACION' && (
                  <button
                    type="button"
                    onClick={() => handleUpdateStatus(p.id, 'ENTREGADO')}
                    className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Marcar como Entregado / Facturar</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onSelectSubView && onSelectSubView('pos')}
                  className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl transition"
                >
                  Abrir en POS
                </button>
              </div>
            </div>
          ))}

          {filtered.length === 0 && (
            <div className="py-12 text-center bg-white rounded-2xl border border-slate-200">
              <Globe className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-xs font-bold text-slate-600">No hay pedidos web en esta sección</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
