import React, { useState } from 'react';
import { Truck, Plus, FileText, CheckCircle2, Search, Printer, MapPin, Calendar } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function GuiasRemisionView() {
  const { empresa } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);

  const [guias, setGuias] = useState([
    {
      id: 'GR-001',
      serie: 'GR01-000012',
      fecha: '2026-09-17',
      origen: 'Almacén Central - Santa Cruz',
      destino: 'Sucursal 2 - Av. Banzer Km 6',
      conductor: 'Marco Antonio Roca',
      placa: '4829-YTL',
      motivo: 'Traslado entre sucursales',
      items: '24 Cajas Coca-Cola 2L, 12 Cajas Cerveza Paceña',
      estado: 'ENTREGADO'
    },
    {
      id: 'GR-002',
      serie: 'GR01-000013',
      fecha: '2026-09-18',
      origen: 'Almacén Central - Santa Cruz',
      destino: 'Cliente: Supermercado El Prado',
      conductor: 'Juan Carlos Torrez',
      placa: '3190-LPB',
      motivo: 'Venta con despacho a domicilio',
      items: '50 Paquetes Fideo Codito, 30 Aceites Fino 900ml',
      estado: 'EN RUTA'
    }
  ]);

  const [nuevaGuia, setNuevaGuia] = useState({
    destino: '',
    conductor: '',
    placa: '',
    motivo: 'Traslado entre sucursales',
    items: ''
  });

  const handleCreateGuia = (e) => {
    e.preventDefault();
    const created = {
      id: `GR-${Date.now()}`,
      serie: `GR01-0000${guias.length + 14}`,
      fecha: new Date().toISOString().split('T')[0],
      origen: empresa?.direccion || 'Almacén Central',
      destino: nuevaGuia.destino,
      conductor: nuevaGuia.conductor,
      placa: nuevaGuia.placa,
      motivo: nuevaGuia.motivo,
      items: nuevaGuia.items,
      estado: 'EN RUTA'
    };
    setGuias([created, ...guias]);
    setShowModal(false);
    setNuevaGuia({ destino: '', conductor: '', placa: '', motivo: 'Traslado entre sucursales', items: '' });
  };

  const filtered = guias.filter(g => 
    g.serie.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.destino.toLowerCase().includes(searchTerm.toLowerCase()) ||
    g.conductor.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <h1 className="text-xl font-bold text-slate-900">Guías de Remisión & Despacho</h1>
          <p className="text-xs text-slate-500">Control de transporte de mercadería, rutas y entregas.</p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-[#7c3aed] text-white rounded-xl text-xs font-bold shadow-md hover:opacity-95 transition flex items-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Emitir Guía de Remisión</span>
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-2">
        <Search className="w-4 h-4 text-slate-400 ml-1" />
        <input
          type="text"
          placeholder="Buscar por serie, destino o conductor..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full text-xs bg-transparent border-0 focus:ring-0 text-slate-700"
        />
      </div>

      {/* Guías List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {filtered.map(guia => (
          <div key={guia.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                  <Truck className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900">{guia.serie}</h3>
                  <span className="text-[10px] text-slate-400 font-mono">{guia.fecha}</span>
                </div>
              </div>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                guia.estado === 'ENTREGADO' 
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-700 border border-amber-200 animate-pulse'
              }`}>
                {guia.estado}
              </span>
            </div>

            <div className="space-y-1 text-xs text-slate-600 pt-1 border-t border-slate-100">
              <div className="flex items-start gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-slate-400 mt-0.5 shrink-0" />
                <div>
                  <span className="font-semibold text-slate-700">Destino: </span>
                  <span>{guia.destino}</span>
                </div>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span>Conductor: <strong className="text-slate-800">{guia.conductor}</strong></span>
                <span className="font-mono bg-slate-100 px-1.5 py-0.5 rounded">Placa: {guia.placa}</span>
              </div>
              <div className="p-2 bg-slate-50 rounded-lg text-[11px] text-slate-500 mt-1">
                <strong>Carga:</strong> {guia.items}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1 border-t border-slate-100">
              <button
                onClick={() => window.print()}
                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-lg flex items-center gap-1 transition"
              >
                <Printer className="w-3 h-3" />
                <span>Imprimir</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Emitir Guía */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl space-y-3 animate-scaleUp">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h3 className="font-bold text-sm text-slate-900">Nueva Guía de Remisión</h3>
              <button onClick={() => setShowModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>

            <form onSubmit={handleCreateGuia} className="space-y-2.5 text-xs">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Destino / Dirección</label>
                <input
                  type="text"
                  required
                  placeholder="Ej: Sucursal Norte - Av. Cristo Redentor"
                  value={nuevaGuia.destino}
                  onChange={(e) => setNuevaGuia({ ...nuevaGuia, destino: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Conductor</label>
                  <input
                    type="text"
                    required
                    placeholder="Nombre completo"
                    value={nuevaGuia.conductor}
                    onChange={(e) => setNuevaGuia({ ...nuevaGuia, conductor: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">Placa Vehículo</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej: 4829-ABC"
                    value={nuevaGuia.placa}
                    onChange={(e) => setNuevaGuia({ ...nuevaGuia, placa: e.target.value })}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">Mercadería / Paquetes</label>
                <textarea
                  rows="2"
                  required
                  placeholder="Detalle de los productos a transportar..."
                  value={nuevaGuia.items}
                  onChange={(e) => setNuevaGuia({ ...nuevaGuia, items: e.target.value })}
                  className="w-full p-2 bg-slate-50 border border-slate-200 rounded-xl"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-3 py-1.5 text-slate-500 hover:bg-slate-100 rounded-xl font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md"
                >
                  Guardar y Emitir
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
