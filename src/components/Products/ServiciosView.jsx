import React, { useState, useEffect, useMemo } from 'react';
import { 
  Wrench, Plus, Search, Edit2, Trash2, CheckCircle2, 
  Clock, DollarSign, Tag, Briefcase, FileText, X, 
  Layers, ChevronRight, ShieldCheck, Zap
} from 'lucide-react';
import { db } from '../../db/dexie';
import ProductsSubNav from './ProductsSubNav';

const DEFAULT_SERVICIOS = [
  {
    id: 'srv-1',
    codigo: 'SERV-001',
    nombre: 'Mantenimiento Preventivo de Computadora / Laptop',
    categoria: 'Soporte Técnico',
    precio_venta: 85.00,
    costo_estimado: 25.00,
    unidad: 'ZZ',
    duracion: '1 hora',
    descripcion: 'Limpieza interna de polvo, cambio de pasta térmica y optimización de sistema operativo.',
    estado: 'Activo'
  },
  {
    id: 'srv-2',
    codigo: 'SERV-002',
    nombre: 'Instalación y Configuración de Punto de Red / Cableado',
    categoria: 'Instalaciones',
    precio_venta: 120.00,
    costo_estimado: 35.00,
    unidad: 'ZZ',
    duracion: '2 horas',
    descripcion: 'Tendido de cable UTP Cat 6, conectorización RJ45 y pruebas de continuidad y velocidad.',
    estado: 'Activo'
  },
  {
    id: 'srv-3',
    codigo: 'SERV-003',
    nombre: 'Formateo e Instalación de Software / Antivirus',
    categoria: 'Software',
    precio_venta: 60.00,
    costo_estimado: 15.00,
    unidad: 'ZZ',
    duracion: '1.5 horas',
    descripcion: 'Instalación limpia de Windows 11/10, suite ofimática y utilitarios esenciales.',
    estado: 'Activo'
  },
  {
    id: 'srv-4',
    codigo: 'SERV-004',
    nombre: 'Servicio de Entrega y Delivery a Domicilio',
    categoria: 'Logística',
    precio_venta: 15.00,
    costo_estimado: 10.00,
    unidad: 'ZZ',
    duracion: '30 min',
    descripcion: 'Transporte de mercadería o repuestos hasta la dirección del cliente.',
    estado: 'Activo'
  },
  {
    id: 'srv-5',
    codigo: 'SERV-005',
    nombre: 'Asesoría y Capacitación en GLORYPOS (1 Hora)',
    categoria: 'Capacitaciones',
    precio_venta: 150.00,
    costo_estimado: 40.00,
    unidad: 'ZZ',
    duracion: '1 hora',
    descripcion: 'Capacitación al personal en apertura de caja, emisión de facturas y reportes.',
    estado: 'Activo'
  }
];

export default function ServiciosView({ onSelectSubView }) {
  const [servicios, setServicios] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategoria, setFilterCategoria] = useState('ALL');

  // Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingServicio, setEditingServicio] = useState(null);

  // Formulario
  const [formCodigo, setFormCodigo] = useState('');
  const [formNombre, setFormNombre] = useState('');
  const [formCategoria, setFormCategoria] = useState('Soporte Técnico');
  const [formPrecio, setFormPrecio] = useState('');
  const [formCosto, setFormCosto] = useState('');
  const [formDuracion, setFormDuracion] = useState('1 hora');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formEstado, setFormEstado] = useState('Activo');

  // Cargar servicios de LocalStorage o por defecto y sincronizar con Dexie
  const loadServicios = async () => {
    try {
      const saved = localStorage.getItem('glorypos_servicios_catalog');
      let data = DEFAULT_SERVICIOS;
      if (saved) {
        data = JSON.parse(saved);
      } else {
        localStorage.setItem('glorypos_servicios_catalog', JSON.stringify(DEFAULT_SERVICIOS));
      }
      setServicios(data);

      // Sincronizar con Dexie `productos_tienda` para que aparezcan en POS y Nuevo Comprobante
      for (const s of data) {
        const exists = await db.productos_tienda.get(s.id);
        if (!exists) {
          await db.productos_tienda.add({
            id: s.id,
            nombre: s.nombre,
            codigo_barras: s.codigo,
            categoria: s.categoria,
            precio_venta: s.precio_venta,
            precio_compra: s.costo_estimado,
            stock_actual: 9999,
            unidad_medida: 'ZZ',
            es_servicio: true,
            activo: s.estado === 'Activo'
          });
        }
      }
    } catch (err) {
      console.error('Error cargando servicios:', err);
    }
  };

  useEffect(() => {
    loadServicios();
  }, []);

  const saveServicios = async (updated) => {
    setServicios(updated);
    localStorage.setItem('glorypos_servicios_catalog', JSON.stringify(updated));
  };

  // Categorías únicas
  const categoriasList = useMemo(() => {
    const setCats = new Set(servicios.map(s => s.categoria).filter(Boolean));
    return Array.from(setCats);
  }, [servicios]);

  // Filtrado
  const filteredServicios = useMemo(() => {
    return servicios.filter(s => {
      const matchesSearch = 
        s.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.categoria.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCat = filterCategoria === 'ALL' || s.categoria === filterCategoria;
      return matchesSearch && matchesCat;
    });
  }, [servicios, searchTerm, filterCategoria]);

  // KPIs
  const totalActivos = servicios.filter(s => s.estado === 'Activo').length;
  const precioPromedio = servicios.length > 0 
    ? (servicios.reduce((acc, s) => acc + (Number(s.precio_venta) || 0), 0) / servicios.length).toFixed(2)
    : '0.00';

  // Manejadores del modal
  const handleOpenCreate = () => {
    setEditingServicio(null);
    setFormCodigo(`SERV-${Math.floor(100 + Math.random() * 900)}`);
    setFormNombre('');
    setFormCategoria('Soporte Técnico');
    setFormPrecio('');
    setFormCosto('');
    setFormDuracion('1 hora');
    setFormDescripcion('');
    setFormEstado('Activo');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (servicio) => {
    setEditingServicio(servicio);
    setFormCodigo(servicio.codigo);
    setFormNombre(servicio.nombre);
    setFormCategoria(servicio.categoria);
    setFormPrecio(servicio.precio_venta);
    setFormCosto(servicio.costo_estimado || '');
    setFormDuracion(servicio.duracion || '1 hora');
    setFormDescripcion(servicio.descripcion || '');
    setFormEstado(servicio.estado || 'Activo');
    setIsModalOpen(true);
  };

  const handleSaveServicio = async (e) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('Ingresa el nombre del servicio.');
      return;
    }
    if (!formPrecio || Number(formPrecio) < 0) {
      alert('Ingresa un precio válido para el servicio.');
      return;
    }

    const item = {
      id: editingServicio ? editingServicio.id : `srv-${Date.now()}`,
      codigo: formCodigo.trim() || `SERV-${Date.now().toString().slice(-3)}`,
      nombre: formNombre.trim(),
      categoria: formCategoria.trim() || 'Servicios Generales',
      precio_venta: Number(formPrecio),
      costo_estimado: Number(formCosto) || 0,
      unidad: 'ZZ',
      duracion: formDuracion.trim() || '1 hora',
      descripcion: formDescripcion.trim(),
      estado: formEstado
    };

    let updatedList;
    if (editingServicio) {
      updatedList = servicios.map(s => s.id === editingServicio.id ? item : s);
    } else {
      updatedList = [item, ...servicios];
    }

    await saveServicios(updatedList);

    // Guardar / Actualizar en Dexie `productos_tienda`
    await db.productos_tienda.put({
      id: item.id,
      nombre: item.nombre,
      codigo_barras: item.codigo,
      categoria: item.categoria,
      precio_venta: item.precio_venta,
      precio_compra: item.costo_estimado,
      stock_actual: 9999,
      unidad_medida: 'ZZ',
      es_servicio: true,
      activo: item.estado === 'Activo'
    });

    setIsModalOpen(false);
  };

  const handleDeleteServicio = async (id) => {
    if (window.confirm('¿Deseas eliminar este servicio del catálogo?')) {
      const updated = servicios.filter(s => s.id !== id);
      await saveServicios(updated);
      await db.productos_tienda.delete(id);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen font-sans">
      {/* Subnavegación de Productos */}
      <ProductsSubNav currentSubView="servicios" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-5">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Wrench className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Catálogo de Servicios
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Control de servicios, mano de obra, asesorías, mantenimientos y entregas (Unidad ZZ / No inventariable).
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Servicio</span>
          </button>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Servicios Registrados</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{servicios.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Servicios Activos</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalActivos}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Precio Promedio</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">S/ {precioPromedio}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Tipo de Facturación</span>
            <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full inline-block mt-2">
              Unidad ZZ (Servicio)
            </span>
          </div>
        </div>

        {/* Barra de Búsqueda y Filtros */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre, código o categoría..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            <button
              type="button"
              onClick={() => setFilterCategoria('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                filterCategoria === 'ALL'
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Todas las Categorías
            </button>
            {categoriasList.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setFilterCategoria(cat)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap ${
                  filterCategoria === cat
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Tabla de Servicios */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <th className="py-3 px-4 min-w-[90px]">CÓDIGO</th>
                  <th className="py-3 px-4 min-w-[240px]">NOMBRE DEL SERVICIO</th>
                  <th className="py-3 px-3 min-w-[130px]">CATEGORÍA</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">PRECIO VENTA</th>
                  <th className="py-3 px-3 text-right min-w-[110px]">COSTO ESTIM.</th>
                  <th className="py-3 px-2 text-center min-w-[70px]">UNID.</th>
                  <th className="py-3 px-3 min-w-[110px]">DURACIÓN</th>
                  <th className="py-3 px-3 text-center min-w-[90px]">ESTADO</th>
                  <th className="py-3 px-4 text-center w-24">ACCIONES</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs">
                {filteredServicios.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-12 text-center text-slate-400">
                      No se encontraron servicios registrados.
                    </td>
                  </tr>
                ) : (
                  filteredServicios.map((s) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition">
                      
                      {/* Código */}
                      <td className="py-3 px-4 font-mono font-bold text-slate-700">
                        {s.codigo}
                      </td>

                      {/* Nombre y Descripción */}
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-800 text-xs">{s.nombre}</div>
                        {s.descripcion && (
                          <div className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                            {s.descripcion}
                          </div>
                        )}
                      </td>

                      {/* Categoría */}
                      <td className="py-3 px-3">
                        <span className="bg-slate-100 text-slate-700 text-[10px] font-bold px-2 py-0.5 rounded-full">
                          {s.categoria}
                        </span>
                      </td>

                      {/* Precio Venta */}
                      <td className="py-3 px-3 text-right font-black text-slate-900">
                        S/ {Number(s.precio_venta).toFixed(2)}
                      </td>

                      {/* Costo Estimado */}
                      <td className="py-3 px-3 text-right text-slate-500 font-semibold">
                        S/ {Number(s.costo_estimado || 0).toFixed(2)}
                      </td>

                      {/* Unidad */}
                      <td className="py-3 px-2 text-center font-bold text-slate-600 text-[11px]">
                        {s.unidad}
                      </td>

                      {/* Duración */}
                      <td className="py-3 px-3 text-slate-600 font-medium">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{s.duracion}</span>
                        </div>
                      </td>

                      {/* Estado */}
                      <td className="py-3 px-3 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          s.estado === 'Activo'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-slate-100 text-slate-500 border border-slate-200'
                        }`}>
                          {s.estado}
                        </span>
                      </td>

                      {/* Acciones */}
                      <td className="py-3 px-4 text-center">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(s)}
                            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                            title="Editar servicio"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteServicio(s.id)}
                            className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                            title="Eliminar servicio"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
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

      </main>

      {/* ========================================================= */}
      {/* MODAL: NUEVO / EDITAR SERVICIO */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-blue-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {editingServicio ? 'Editar Servicio' : 'Nuevo Servicio'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveServicio} className="p-5 space-y-3.5 text-xs">
              
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-mono font-bold outline-none focus:border-blue-500"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Servicio *</label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Mantenimiento Preventivo"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Categoría del Servicio</label>
                  <input
                    type="text"
                    value={formCategoria}
                    onChange={(e) => setFormCategoria(e.target.value)}
                    placeholder="Soporte, Asesoría, Flete..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Duración Estimada</label>
                  <input
                    type="text"
                    value={formDuracion}
                    onChange={(e) => setFormDuracion(e.target.value)}
                    placeholder="1 hora, 45 min..."
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Precio de Venta (S/) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrecio}
                    onChange={(e) => setFormPrecio(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 font-bold text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Costo Estimado (S/)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formCosto}
                    onChange={(e) => setFormCosto(e.target.value)}
                    placeholder="0.00"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción del Servicio</label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Detalles sobre las tareas o alcances incluidos..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 resize-none"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Estado</label>
                <select
                  value={formEstado}
                  onChange={(e) => setFormEstado(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-blue-500 bg-white"
                >
                  <option value="Activo">Activo</option>
                  <option value="Inactivo">Inactivo</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-100 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 rounded-xl font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold shadow-sm transition active:scale-95"
                >
                  Guardar Servicio
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
