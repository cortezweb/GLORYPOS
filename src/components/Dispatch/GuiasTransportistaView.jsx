import React, { useState, useEffect } from 'react';
import { 
  RotateCw, Plus, Eye, Download, FileText, Inbox, 
  Search, X, CheckCircle2, AlertCircle, Printer, Truck, MapPin, User, Building2
} from 'lucide-react';
import { db } from '../../db/dexie';

export default function GuiasTransportistaView() {
  const [guias, setGuias] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedGuia, setSelectedGuia] = useState(null);
  const [selectedEstadoGuia, setSelectedEstadoGuia] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);

  // Catálogos para el formulario
  const [conductores, setConductores] = useState([]);
  const [vehiculos, setVehiculos] = useState([]);

  // Formulario nueva guía transportista
  const [formGuia, setFormGuia] = useState({
    destinatario: '',
    doc_destinatario: '',
    remitente: '',
    doc_remitente: '',
    pagador_flete: 'Destinatario',
    conductor: '',
    vehiculo: '',
    partida: '',
    llegada: '',
    items_count: 1,
    items_desc: '',
    motivo: 'Servicio de flete y transporte'
  });

  const showToast = (msg) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      if (db.guias_transportista) {
        const list = await db.guias_transportista.toArray();
        setGuias(list);
      }
      if (db.conductores_gre) {
        const condList = await db.conductores_gre.toArray();
        setConductores(condList);
        if (condList.length > 0 && !formGuia.conductor) {
          setFormGuia(prev => ({ ...prev, conductor: condList[0].nombre }));
        }
      }
      if (db.vehiculos_gre) {
        const vehList = await db.vehiculos_gre.toArray();
        setVehiculos(vehList);
        if (vehList.length > 0 && !formGuia.vehiculo) {
          setFormGuia(prev => ({ ...prev, vehiculo: `${vehList[0].placa} (${vehList[0].marca} ${vehList[0].modelo})` }));
        }
      }
    } catch (err) {
      console.error('Error loading guias transportista:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSaveGuia = async (e) => {
    e.preventDefault();
    if (!formGuia.destinatario || !formGuia.doc_destinatario) {
      showToast('Por favor completa los datos del destinatario');
      return;
    }

    const nextCorrelativo = `V001-${guias.length + 1}`;
    const today = new Date();
    const formattedDate = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    const newGuia = {
      id: `gt-${Date.now()}`,
      fecha: formattedDate,
      guia: nextCorrelativo,
      destinatario: formGuia.destinatario.toUpperCase(),
      doc_destinatario: formGuia.doc_destinatario,
      siat_code: 'SIAT 0',
      items_count: Number(formGuia.items_count) || 1,
      estado_siat: 'Aceptado',
      remitente: formGuia.remitente || 'Empresa Tercera Remitente',
      doc_remitente: formGuia.doc_remitente || '20491823910',
      partida: formGuia.partida || 'Origen de carga',
      llegada: formGuia.llegada || 'Destino final',
      modalidad: 'Transporte Público',
      pagador_flete: formGuia.pagador_flete,
      conductor: formGuia.conductor || 'Juan gabriel quispe huacarpuma',
      vehiculo: formGuia.vehiculo || 'V2105 (huyndai sedan)',
      items_desc: formGuia.items_desc || 'Mercadería transportada',
      motivo: formGuia.motivo
    };

    try {
      if (db.guias_transportista) {
        await db.guias_transportista.add(newGuia);
      }
      setGuias([newGuia, ...guias]);
      setIsModalOpen(false);
      showToast('Guía Transportista ' + nextCorrelativo + ' emitida exitosamente');
      setFormGuia({
        destinatario: '',
        doc_destinatario: '',
        remitente: '',
        doc_remitente: '',
        pagador_flete: 'Destinatario',
        conductor: conductores[0]?.nombre || '',
        vehiculo: vehiculos[0] ? `${vehiculos[0].placa} (${vehiculos[0].marca})` : '',
        partida: '',
        llegada: '',
        items_count: 1,
        items_desc: '',
        motivo: 'Servicio de flete y transporte'
      });
    } catch (err) {
      console.error('Error saving guia transportista:', err);
      showToast('Error al guardar la guía transportista');
    }
  };

  const handleDownloadXML = (g) => {
    const xmlData = `<?xml version="1.0" encoding="UTF-8"?>
<DespachoTransportista xmlns="siat:gre:transportista:v1">
  <Correlativo>${g.guia}</Correlativo>
  <FechaEmision>${g.fecha}</FechaEmision>
  <Destinatario doc="${g.doc_destinatario}">${g.destinatario}</Destinatario>
  <Remitente doc="${g.doc_remitente}">${g.remitente}</Remitente>
  <Estado>${g.estado_siat}</Estado>
  <Items>${g.items_count}</Items>
  <CodigoSIAT>${g.siat_code}</CodigoSIAT>
</DespachoTransportista>`;
    const blob = new Blob([xmlData], { type: 'application/xml' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${g.guia}_transportista_siat.xml`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 animate-fadeIn">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-2.5 rounded-xl shadow-lg flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* ── CABECERA EXACTA A media_1789932575543.png ── */}
      <div className="space-y-0.5">
        <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight">
          Guías de remisión — Transportista
        </h1>
        <p className="text-xs text-slate-500">
          Su empresa transporta mercadería de terceros (GRE 31).
        </p>
      </div>

      {/* ── TARJETA PRINCIPAL DE GUÍAS TRANSPORTISTA ── */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        
        {/* Cabecera de la tarjeta */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-xs font-bold text-slate-800">
            Guías de remisión — Transportista (31)
          </h2>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={loadData}
              title="Recargar datos"
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => setIsModalOpen(true)}
              className="px-3.5 py-2 bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
              <span>Nueva guía</span>
            </button>
          </div>
        </div>

        {/* Tabla de Guías Transportista */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-[10px] font-semibold text-slate-400 uppercase tracking-wider bg-white">
                <th className="py-3 px-4">FECHA</th>
                <th className="py-3 px-4">GUÍA</th>
                <th className="py-3 px-4">DESTINATARIO</th>
                <th className="py-3 px-4">ÍTEMS</th>
                <th className="py-3 px-4">ESTADO SIAT</th>
                <th className="py-3 px-3 text-center">PDF</th>
                <th className="py-3 px-3 text-center">XML</th>
                <th className="py-3 px-3 text-center">CDR</th>
                <th className="py-3 px-4 text-right">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {guias.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-xs text-slate-400 font-medium">
                    No hay guías de remisión transportista registradas
                  </td>
                </tr>
              ) : (
                guias.map((g) => (
                  <tr key={g.id} className="hover:bg-slate-50/70 transition">
                    
                    {/* FECHA */}
                    <td className="py-3 px-4 font-mono text-[11px] text-slate-600 whitespace-nowrap">
                      {g.fecha}
                    </td>

                    {/* GUÍA */}
                    <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                      {g.guia}
                    </td>

                    {/* DESTINATARIO */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div>
                        <div className="font-semibold text-slate-800 uppercase text-xs">
                          {g.destinatario}
                        </div>
                        <div className="text-[11px] text-slate-400 font-mono">
                          {g.doc_destinatario}
                        </div>
                        <div className="text-[11px] font-semibold text-rose-600">
                          {g.siat_code}
                        </div>
                      </div>
                    </td>

                    {/* ÍTEMS */}
                    <td className="py-3 px-4 font-medium text-slate-700 whitespace-nowrap">
                      {g.items_count}
                    </td>

                    {/* ESTADO SIAT */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      {g.estado_siat === 'Aceptado' ? (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          Aceptado
                        </span>
                      ) : (
                        <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-600 border border-rose-100">
                          Rechazado
                        </span>
                      )}
                    </td>

                    {/* PDF (Ver y Descargar) */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedGuia(g)}
                          title="Ver PDF"
                          className="p-1 text-rose-500 hover:text-rose-700 rounded transition cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => window.print()}
                          title="Descargar PDF"
                          className="p-1 text-rose-500 hover:text-rose-700 rounded transition cursor-pointer"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </td>

                    {/* XML */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => handleDownloadXML(g)}
                        title="Descargar XML SIAT"
                        className="p-1 text-amber-500 hover:text-amber-700 rounded transition cursor-pointer inline-flex items-center justify-center"
                      >
                        <FileText className="w-4 h-4" />
                      </button>
                    </td>

                    {/* CDR */}
                    <td className="py-3 px-3 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => showToast(`Constancia CDR descargada para ${g.guia}`)}
                        title="Constancia de Recepción SIAT"
                        className="p-1 text-blue-500 hover:text-blue-700 rounded transition cursor-pointer inline-flex items-center justify-center"
                      >
                        <Inbox className="w-4 h-4" />
                      </button>
                    </td>

                    {/* ACCIONES */}
                    <td className="py-3 px-4 whitespace-nowrap text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => setSelectedGuia(g)}
                          className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition cursor-pointer"
                        >
                          <Search className="w-3 h-3 text-slate-500" />
                          <span>Detalle</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedEstadoGuia(g)}
                          className="px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-blue-600 rounded-lg text-xs font-semibold transition cursor-pointer"
                        >
                          Estado
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── MODAL: NUEVA GUÍA TRANSPORTISTA ── */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-lg bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Nueva Guía de Remisión — Transportista (31)</h3>
                <p className="text-[11px] text-slate-500">Servicio de transporte de carga para terceros</p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveGuia} className="space-y-3 text-xs">
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100 space-y-2">
                <span className="text-[11px] font-bold text-blue-900 block">Datos del Remitente (Dueño de la Carga)</span>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <input
                      type="text"
                      placeholder="Razón Social Remitente"
                      value={formGuia.remitente}
                      onChange={(e) => setFormGuia({ ...formGuia, remitente: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                  <div>
                    <input
                      type="text"
                      placeholder="NIT / RUC Remitente"
                      value={formGuia.doc_remitente}
                      onChange={(e) => setFormGuia({ ...formGuia, doc_remitente: e.target.value })}
                      className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-slate-800 text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Destinatario Final *</label>
                  <input
                    type="text"
                    required
                    value={formGuia.destinatario}
                    onChange={(e) => setFormGuia({ ...formGuia, destinatario: e.target.value })}
                    placeholder="Ej. CASAS MEJIA RAFAEL FERNANDO"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">NIT / CI Destinatario *</label>
                  <input
                    type="text"
                    required
                    value={formGuia.doc_destinatario}
                    onChange={(e) => setFormGuia({ ...formGuia, doc_destinatario: e.target.value })}
                    placeholder="Ej. 10428288527"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Pagador del Flete</label>
                  <select
                    value={formGuia.pagador_flete}
                    onChange={(e) => setFormGuia({ ...formGuia, pagador_flete: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="Destinatario">Destinatario</option>
                    <option value="Remitente">Remitente</option>
                    <option value="Tercero">Tercero subcontratado</option>
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Conductor Asignado</label>
                  <select
                    value={formGuia.conductor}
                    onChange={(e) => setFormGuia({ ...formGuia, conductor: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {conductores.map(c => (
                      <option key={c.id} value={c.nombre}>{c.nombre} ({c.documento})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Vehículo / Unidad</label>
                  <select
                    value={formGuia.vehiculo}
                    onChange={(e) => setFormGuia({ ...formGuia, vehiculo: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none cursor-pointer"
                  >
                    {vehiculos.map(v => (
                      <option key={v.id} value={`${v.placa} (${v.marca} ${v.modelo})`}>{v.placa} — {v.marca} {v.modelo}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Nro. de Bultos / Ítems</label>
                  <input
                    type="number"
                    min="1"
                    value={formGuia.items_count}
                    onChange={(e) => setFormGuia({ ...formGuia, items_count: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Punto de Partida</label>
                  <input
                    type="text"
                    value={formGuia.partida}
                    onChange={(e) => setFormGuia({ ...formGuia, partida: e.target.value })}
                    placeholder="Dirección recojo mercadería"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-slate-600 font-bold block mb-1">Punto de Llegada</label>
                  <input
                    type="text"
                    value={formGuia.llegada}
                    onChange={(e) => setFormGuia({ ...formGuia, llegada: e.target.value })}
                    placeholder="Dirección entrega final"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="text-slate-600 font-bold block mb-1">Descripción de la Carga de Terceros</label>
                <input
                  type="text"
                  value={formGuia.items_desc}
                  onChange={(e) => setFormGuia({ ...formGuia, items_desc: e.target.value })}
                  placeholder="Ej. Pallet de mercadería pesada, insumos industriales"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:bg-white focus:outline-none"
                />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 text-xs font-bold text-white bg-[#2563eb] hover:bg-[#1d4ed8] rounded-xl transition shadow-xs cursor-pointer"
                >
                  Emitir Guía SIAT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL: DETALLE DE GUÍA ── */}
      {selectedGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Guía {selectedGuia.guia}</h3>
                  <p className="text-[11px] text-slate-500">GRE Transportista (31)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedGuia(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div className="flex justify-between">
                  <span className="text-slate-500">Destinatario:</span>
                  <span className="font-bold text-slate-800">{selectedGuia.destinatario}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">NIT/CI Destinatario:</span>
                  <span className="font-mono text-slate-700">{selectedGuia.doc_destinatario}</span>
                </div>
                {selectedGuia.remitente && (
                  <div className="flex justify-between pt-1 border-t border-slate-200/50">
                    <span className="text-slate-500">Remitente Tercero:</span>
                    <span className="font-semibold text-slate-800">{selectedGuia.remitente}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-slate-500">Fecha de emisión:</span>
                  <span className="text-slate-700">{selectedGuia.fecha}</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5">
                <div>
                  <span className="text-slate-400 font-bold block text-[10px]">ORIGEN DE CARGA</span>
                  <span className="text-slate-800">{selectedGuia.partida || 'Km 12 Doble Vía La Guardia'}</span>
                </div>
                <div className="pt-1 border-t border-slate-200/50">
                  <span className="text-slate-400 font-bold block text-[10px]">DESTINO DE ENTREGA</span>
                  <span className="text-slate-800 font-semibold">{selectedGuia.llegada || 'Terminal Bimodal Santa Cruz'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block text-[10px]">CONDUCTOR</span>
                  <span className="text-slate-800">{selectedGuia.conductor || 'Juan gabriel quispe huacarpuma'}</span>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100">
                  <span className="text-slate-400 font-bold block text-[10px]">VEHÍCULO</span>
                  <span className="text-slate-800 font-mono">{selectedGuia.vehiculo || 'V2105 (huyndai sedan)'}</span>
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-100 flex justify-between items-center">
                <span className="text-emerald-800 font-semibold">Total Ítems Transportados:</span>
                <span className="font-black text-emerald-700 text-sm">{selectedGuia.items_count}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => window.print()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Imprimir</span>
              </button>
              <button
                type="button"
                onClick={() => setSelectedGuia(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL: ESTADO SIAT ── */}
      {selectedEstadoGuia && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-fadeIn">
          <div className="relative w-full max-w-md bg-white rounded-3xl p-5 shadow-2xl z-10 space-y-4 border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Estado SIAT — {selectedEstadoGuia.guia}</h3>
                  <p className="text-[11px] text-slate-500">Validación de Guía de Remisión Transportista</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedEstadoGuia(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Estado de Recepción:</span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                    {selectedEstadoGuia.estado_siat}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Código de Respuesta:</span>
                  <span className="font-mono font-bold text-slate-800">{selectedEstadoGuia.siat_code}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Fecha de Consulta:</span>
                  <span className="text-slate-700">{selectedEstadoGuia.fecha}</span>
                </div>
              </div>

              <div className="p-3 bg-emerald-50/70 rounded-xl border border-emerald-100 text-emerald-800 text-[11px] space-y-1">
                <strong className="block font-bold">Validación Exitosa:</strong>
                <p>Código SIAT 0: Guía de remisión transportista recepcionada conforme en los servidores tributarios SIAT. Habilitada para control en tramos interdepartamentales.</p>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedEstadoGuia(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition cursor-pointer"
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
