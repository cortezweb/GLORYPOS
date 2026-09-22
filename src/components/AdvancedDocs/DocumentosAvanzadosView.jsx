import React, { useState, useEffect, useMemo } from 'react';
import { 
  Search, RotateCw, Plus, Eye, Download, Calendar, 
  Percent, DollarSign, RotateCcw, AlertCircle, CheckCircle2 
} from 'lucide-react';
import { db } from '../../db/dexie';
import NuevaRetencionModal from './NuevaRetencionModal';
import NuevaPercepcionModal from './NuevaPercepcionModal';
import NuevaReversionModal from './NuevaReversionModal';
import DetalleDocumentoModal from './DetalleDocumentoModal';
import EstadoSunatModal from './EstadoSunatModal';
import DocumentoPdfPreviewModal from './DocumentoPdfPreviewModal';

export default function DocumentosAvanzadosView({ initialTab = 'retenciones', onSelectSubView }) {
  // Pestaña activa: 'retenciones', 'percepciones', 'reversiones'
  const [activeTab, setActiveTab] = useState(initialTab);

  // Estados de filtros superiores
  const [filtroBuscar, setFiltroBuscar] = useState('');
  const [filtroSerie, setFiltroSerie] = useState('');
  const [filtroCorrelativo, setFiltroCorrelativo] = useState('');
  const [filtroEstadoSunat, setFiltroEstadoSunat] = useState('Todos');
  const [filtroDesde, setFiltroDesde] = useState('');
  const [filtroHasta, setFiltroHasta] = useState('');

  // Estados de datos
  const [retenciones, setRetenciones] = useState([]);
  const [percepciones, setPercepciones] = useState([]);
  const [reversiones, setReversiones] = useState([]);
  const [loading, setLoading] = useState(false);

  // Modales
  const [isNuevaRetencionOpen, setIsNuevaRetencionOpen] = useState(false);
  const [isNuevaPercepcionOpen, setIsNuevaPercepcionOpen] = useState(false);
  const [isNuevaReversionOpen, setIsNuevaReversionOpen] = useState(false);
  
  const [selectedDocDetalle, setSelectedDocDetalle] = useState(null);
  const [selectedDocEstado, setSelectedDocEstado] = useState(null);
  const [selectedDocPdf, setSelectedDocPdf] = useState(null);

  // Sincronizar prop initialTab
  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (onSelectSubView) {
      onSelectSubView(tabId);
    }
  };

  // Carga de datos desde Dexie con fallback seed
  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Retenciones
      let retList = [];
      if (db.retenciones) {
        retList = await db.retenciones.toArray();
      }
      if (!retList || retList.length === 0) {
        const seedRet = {
          id: 'ret-seed-1',
          fecha: '15/09/2026',
          serie_nro: 'R001-1',
          serie: 'R001',
          correlativo: '1',
          origen: 'Fdh-00004478',
          proveedor_nombre: 'Clientes varios',
          proveedor_doc: '000000',
          retenido: 6.45,
          moneda: 'S/',
          tasa_porcentaje: 3,
          monto_total_comprobante: 215.00,
          estado_sunat: 'Error envio',
          sunat_obs: 'Error 1033: El comprobante fue registrado previamente con errores de formato o timeout en conexión con SUNAT.',
          rr: '—',
          observacion: 'Retención de IGV 3% aplicada sobre comprobante Fdh-00004478'
        };
        if (db.retenciones) {
          try {
            await db.retenciones.put(seedRet);
          } catch (e) {
            console.warn('Could not seed retenciones to db', e);
          }
        }
        retList = [seedRet];
      }
      setRetenciones(retList);

      // 2. Percepciones (inicialmente vacío conforme a la captura 1)
      let percList = [];
      if (db.percepciones) {
        percList = await db.percepciones.toArray();
      }
      setPercepciones(percList);

      // 3. Reversiones (inicialmente vacío)
      let revList = [];
      if (db.reversiones) {
        revList = await db.reversiones.toArray();
      }
      setReversiones(revList);

    } catch (err) {
      console.error('Error cargando documentos avanzados:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guardar nueva retención
  const handleSaveRetencion = async (newDoc) => {
    setRetenciones(prev => [newDoc, ...prev]);
    if (db.retenciones) {
      try {
        await db.retenciones.put(newDoc);
      } catch (err) {
        console.error('Error guardando retención en Dexie:', err);
      }
    }
  };

  // Guardar nueva percepción
  const handleSavePercepcion = async (newDoc) => {
    setPercepciones(prev => [newDoc, ...prev]);
    if (db.percepciones) {
      try {
        await db.percepciones.put(newDoc);
      } catch (err) {
        console.error('Error guardando percepción en Dexie:', err);
      }
    }
  };

  // Guardar nueva reversión
  const handleSaveReversion = async (newDoc) => {
    setReversiones(prev => [newDoc, ...prev]);
    if (db.reversiones) {
      try {
        await db.reversiones.put(newDoc);
      } catch (err) {
        console.error('Error guardando reversión en Dexie:', err);
      }
    }
  };

  // Actualizar estado SUNAT (ej. tras reintentar)
  const handleUpdateStatus = async (docId, newStatus, newObs) => {
    const updater = (list) =>
      list.map(d => d.id === docId ? { ...d, estado_sunat: newStatus, sunat_obs: newObs } : d);

    if (activeTab === 'retenciones') {
      setRetenciones(updater);
      if (db.retenciones) {
        const item = await db.retenciones.get(docId);
        if (item) await db.retenciones.put({ ...item, estado_sunat: newStatus, sunat_obs: newObs });
      }
    } else if (activeTab === 'percepciones') {
      setPercepciones(updater);
      if (db.percepciones) {
        const item = await db.percepciones.get(docId);
        if (item) await db.percepciones.put({ ...item, estado_sunat: newStatus, sunat_obs: newObs });
      }
    } else {
      setReversiones(updater);
      if (db.reversiones) {
        const item = await db.reversiones.get(docId);
        if (item) await db.reversiones.put({ ...item, estado_sunat: newStatus, sunat_obs: newObs });
      }
    }
  };

  // Descarga de XML de prueba
  const handleDownloadXml = (doc) => {
    const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>
<RetentionPerceptionDocument xmlns="urn:sunat:names:specification:ubl:peru:schema:xsd:Retention-1">
  <ID>${doc.serie_nro}</ID>
  <IssueDate>${doc.fecha}</IssueDate>
  <PartyIdentification>${doc.proveedor_doc || doc.sujeto_doc || '000000'}</PartyIdentification>
  <PartyName>${doc.proveedor_nombre || doc.sujeto_nombre || 'Clientes varios'}</PartyName>
  <TotalAmount currencyID="PEN">${doc.retenido || doc.percibido || doc.monto}</TotalAmount>
  <DocumentReference>${doc.origen}</DocumentReference>
  <SunatStatus>${doc.estado_sunat}</SunatStatus>
</RetentionPerceptionDocument>`;

    const blob = new Blob([xmlContent], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${doc.serie_nro}.xml`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Filtrado de la lista actual
  const currentList = useMemo(() => {
    let list = [];
    if (activeTab === 'retenciones') list = retenciones;
    else if (activeTab === 'percepciones') list = percepciones;
    else list = reversiones;

    return list.filter(item => {
      // 1. Filtro Buscar (Serie, RUC, razón social)
      if (filtroBuscar.trim()) {
        const q = filtroBuscar.toLowerCase();
        const serieMatch = (item.serie_nro || '').toLowerCase().includes(q);
        const nameMatch = (item.proveedor_nombre || item.sujeto_nombre || '').toLowerCase().includes(q);
        const docMatch = (item.proveedor_doc || item.sujeto_doc || '').toLowerCase().includes(q);
        const origenMatch = (item.origen || '').toLowerCase().includes(q);
        if (!serieMatch && !nameMatch && !docMatch && !origenMatch) return false;
      }

      // 2. Filtro Serie
      if (filtroSerie.trim()) {
        const serieText = (item.serie || item.serie_nro || '').toLowerCase();
        if (!serieText.includes(filtroSerie.toLowerCase())) return false;
      }

      // 3. Filtro Correlativo
      if (filtroCorrelativo.trim()) {
        const corrText = (item.correlativo || (item.serie_nro ? item.serie_nro.split('-')[1] : '')).toLowerCase();
        if (!corrText.includes(filtroCorrelativo.toLowerCase())) return false;
      }

      // 4. Filtro Estado SUNAT
      if (filtroEstadoSunat !== 'Todos') {
        if (item.estado_sunat !== filtroEstadoSunat) return false;
      }

      return true;
    });
  }, [activeTab, retenciones, percepciones, reversiones, filtroBuscar, filtroSerie, filtroCorrelativo, filtroEstadoSunat]);

  // Resetear filtros
  const handleResetFilters = () => {
    setFiltroBuscar('');
    setFiltroSerie('');
    setFiltroCorrelativo('');
    setFiltroEstadoSunat('Todos');
    setFiltroDesde('');
    setFiltroHasta('');
    loadData();
  };

  return (
    <div className="space-y-4 animate-fadeIn pb-16">
      {/* Título de la vista */}
      <div>
        <h1 className="text-xl font-bold text-slate-800 tracking-tight">
          Retención, Percepción y Reversión
        </h1>
      </div>

      {/* Tabs / Pills Superiores idénticos a los screenshots */}
      <div className="flex items-center gap-2 pt-1">
        {/* Pestaña Retenciones */}
        <button
          type="button"
          onClick={() => handleTabChange('retenciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'retenciones'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="font-black text-sm leading-none">%</span>
          <span>Retenciones</span>
        </button>

        {/* Pestaña Percepciones */}
        <button
          type="button"
          onClick={() => handleTabChange('percepciones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'percepciones'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center text-[10px] font-black leading-none">
            $
          </span>
          <span>Percepciones</span>
        </button>

        {/* Pestaña Reversiones */}
        <button
          type="button"
          onClick={() => handleTabChange('reversiones')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeTab === 'reversiones'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
          }`}
        >
          <RotateCcw className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>Reversiones</span>
        </button>
      </div>

      {/* Barra de Filtros */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4">
        <div className="flex flex-wrap items-end gap-3">
          {/* BUSCAR */}
          <div className="flex-1 min-w-[220px]">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              BUSCAR
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={filtroBuscar}
                onChange={(e) => setFiltroBuscar(e.target.value)}
                placeholder="Serie, RUC, razón social..."
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* SERIE */}
          <div className="w-20">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              SERIE
            </label>
            <input
              type="text"
              value={filtroSerie}
              onChange={(e) => setFiltroSerie(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* CORRELATIVO */}
          <div className="w-28">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              CORRELATIVO
            </label>
            <input
              type="text"
              value={filtroCorrelativo}
              onChange={(e) => setFiltroCorrelativo(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          {/* ESTADO SUNAT */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              ESTADO SUNAT
            </label>
            <select
              value={filtroEstadoSunat}
              onChange={(e) => setFiltroEstadoSunat(e.target.value)}
              className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 text-slate-700"
            >
              <option value="Todos">Todos</option>
              <option value="Aceptado">Aceptado</option>
              <option value="Error envio">Error envio</option>
              <option value="Pendiente">Pendiente</option>
              <option value="Anulado">Anulado</option>
            </select>
          </div>

          {/* DESDE */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              DESDE
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={filtroDesde}
                onChange={(e) => setFiltroDesde(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* HASTA */}
          <div className="w-36">
            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
              HASTA
            </label>
            <div className="relative">
              <input
                type="text"
                placeholder="dd/mm/aaaa"
                value={filtroHasta}
                onChange={(e) => setFiltroHasta(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 placeholder:text-slate-400"
              />
              <Calendar className="w-3.5 h-3.5 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>

          {/* Botón Filtrar */}
          <div>
            <button
              type="button"
              onClick={() => {}}
              className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition h-[38px] flex items-center justify-center"
            >
              Filtrar
            </button>
          </div>
        </div>
      </div>

      {/* Tarjeta de Contenido / Tabla */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Cabecera de la Tarjeta */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="text-sm font-bold text-slate-800">
            {activeTab === 'retenciones' && 'Comprobantes de retención'}
            {activeTab === 'percepciones' && 'Comprobantes de percepción'}
            {activeTab === 'reversiones' && 'Comprobantes de reversión'}
          </h2>

          <div className="flex items-center gap-2">
            {/* Botón Refrescar */}
            <button
              type="button"
              onClick={handleResetFilters}
              title="Refrescar lista y filtros"
              className="p-2 border border-slate-200 hover:bg-slate-50 text-slate-500 rounded-lg transition"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            {/* Botón Azul de Acción */}
            {activeTab === 'retenciones' && (
              <button
                type="button"
                onClick={() => setIsNuevaRetencionOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Nueva retención</span>
              </button>
            )}

            {activeTab === 'percepciones' && (
              <button
                type="button"
                onClick={() => setIsNuevaPercepcionOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Nueva percepción</span>
              </button>
            )}

            {activeTab === 'reversiones' && (
              <button
                type="button"
                onClick={() => setIsNuevaReversionOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 shadow-xs transition"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span>+ Nueva reversión</span>
              </button>
            )}
          </div>
        </div>

        {/* Tabla */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 text-[10px] font-bold uppercase tracking-wider bg-slate-50/50">
                <th className="py-3 px-4">FECHA</th>
                <th className="py-3 px-4">SERIE-NRO</th>
                <th className="py-3 px-4">ORIGEN</th>
                <th className="py-3 px-4">
                  {activeTab === 'retenciones' && 'PROVEEDOR'}
                  {activeTab === 'percepciones' && 'SUJETO PERCIBIDO'}
                  {activeTab === 'reversiones' && 'PROVEEDOR / CLIENTE'}
                </th>
                <th className="py-3 px-4">
                  {activeTab === 'retenciones' && 'RETENIDO'}
                  {activeTab === 'percepciones' && 'PERCIBIDO'}
                  {activeTab === 'reversiones' && 'MONTO'}
                </th>
                <th className="py-3 px-4">ESTADO SUNAT</th>
                <th className="py-3 px-4 text-center">RR</th>
                <th className="py-3 px-4 text-center">PDF</th>
                <th className="py-3 px-4 text-center">XML</th>
                <th className="py-3 px-4 text-center">CDR</th>
                <th className="py-3 px-4 text-center">ACCIONES</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentList.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-14 text-center text-slate-400 text-xs">
                    Sin registros.
                  </td>
                </tr>
              ) : (
                currentList.map((doc) => {
                  const subjectName = doc.proveedor_nombre || doc.sujeto_nombre || 'Clientes varios';
                  const subjectDoc = doc.proveedor_doc || doc.sujeto_doc || '000000';
                  const amount = doc.retenido ?? doc.percibido ?? doc.monto ?? 0;

                  return (
                    <tr key={doc.id} className="hover:bg-slate-50/70 transition">
                      {/* FECHA */}
                      <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                        {doc.fecha}
                      </td>

                      {/* SERIE-NRO */}
                      <td className="py-3 px-4 font-bold text-slate-900 font-mono whitespace-nowrap">
                        {doc.serie_nro}
                      </td>

                      {/* ORIGEN */}
                      <td className="py-3 px-4 font-mono font-medium text-emerald-600 hover:underline cursor-pointer whitespace-nowrap"
                          onClick={() => setSelectedDocDetalle(doc)}>
                        {doc.origen || '—'}
                      </td>

                      {/* PROVEEDOR / SUJETO */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-800 leading-snug">
                          {subjectName}
                        </div>
                        <div className="text-slate-400 text-[11px] font-mono leading-none mt-0.5">
                          {subjectDoc}
                        </div>
                      </td>

                      {/* RETENIDO / PERCIBIDO */}
                      <td className="py-3 px-4 font-semibold text-slate-800 whitespace-nowrap">
                        S/ {Number(amount).toFixed(2)}
                      </td>

                      {/* ESTADO SUNAT */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {doc.estado_sunat === 'Error envio' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#fff3eb] text-[#f97316] border border-[#fed7aa]">
                            Error envio
                          </span>
                        )}
                        {doc.estado_sunat === 'Aceptado' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Aceptado
                          </span>
                        )}
                        {doc.estado_sunat === 'Pendiente' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-700 border border-amber-200">
                            Pendiente
                          </span>
                        )}
                        {doc.estado_sunat === 'Anulado' && (
                          <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-rose-50 text-rose-700 border border-rose-200">
                            Anulado
                          </span>
                        )}
                      </td>

                      {/* RR */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        {doc.rr || '—'}
                      </td>

                      {/* PDF */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center justify-center gap-1.5 text-rose-500">
                          <button
                            type="button"
                            title="Previsualizar PDF"
                            onClick={() => setSelectedDocPdf(doc)}
                            className="hover:text-rose-700 transition p-0.5"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            title="Descargar PDF"
                            onClick={() => setSelectedDocPdf(doc)}
                            className="hover:text-rose-700 transition p-0.5"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>

                      {/* XML */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          title="Descargar XML Electrónico"
                          onClick={() => handleDownloadXml(doc)}
                          className="text-amber-500 hover:text-amber-700 transition p-0.5 inline-flex items-center justify-center"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>

                      {/* CDR */}
                      <td className="py-3 px-4 text-center text-slate-400">
                        {doc.estado_sunat === 'Aceptado' ? (
                          <span className="text-emerald-600 font-bold" title="CDR Disponible">✓</span>
                        ) : (
                          '—'
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="inline-flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => setSelectedDocDetalle(doc)}
                            className="px-2 py-0.5 border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-medium inline-flex items-center gap-1 transition"
                          >
                            <Search className="w-3 h-3 text-slate-400" />
                            <span>Detalle</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedDocEstado(doc)}
                            className="px-2.5 py-0.5 bg-blue-100 hover:bg-blue-200 text-blue-700 rounded-lg text-xs font-semibold transition"
                          >
                            Estado
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Nueva Retención */}
      <NuevaRetencionModal
        isOpen={isNuevaRetencionOpen}
        onClose={() => setIsNuevaRetencionOpen(false)}
        onSave={handleSaveRetencion}
        nextNumber={retenciones.length + 1}
      />

      {/* Modal Nueva Percepción */}
      <NuevaPercepcionModal
        isOpen={isNuevaPercepcionOpen}
        onClose={() => setIsNuevaPercepcionOpen(false)}
        onSave={handleSavePercepcion}
        nextNumber={percepciones.length + 1}
      />

      {/* Modal Nueva Reversión */}
      <NuevaReversionModal
        isOpen={isNuevaReversionOpen}
        onClose={() => setIsNuevaReversionOpen(false)}
        onSave={handleSaveReversion}
        nextNumber={reversiones.length + 1}
      />

      {/* Modal Detalle Comprobante */}
      <DetalleDocumentoModal
        isOpen={!!selectedDocDetalle}
        onClose={() => setSelectedDocDetalle(null)}
        doc={selectedDocDetalle}
        type={activeTab}
        onPrint={(doc) => {
          setSelectedDocDetalle(null);
          setSelectedDocPdf(doc);
        }}
      />

      {/* Modal Estado SUNAT */}
      <EstadoSunatModal
        isOpen={!!selectedDocEstado}
        onClose={() => setSelectedDocEstado(null)}
        doc={selectedDocEstado}
        onUpdateStatus={handleUpdateStatus}
      />

      {/* Modal Preview e Impresión PDF */}
      <DocumentoPdfPreviewModal
        isOpen={!!selectedDocPdf}
        onClose={() => setSelectedDocPdf(null)}
        doc={selectedDocPdf}
        type={activeTab}
      />
    </div>
  );
}
