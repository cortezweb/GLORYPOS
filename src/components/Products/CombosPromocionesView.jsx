import React, { useState, useEffect, useMemo } from 'react';
import { 
  Sparkles, Plus, Search, Edit2, Trash2, CheckCircle2, 
  Package, Tag, Calendar, DollarSign, ArrowRight, Percent, 
  ShoppingCart, Eye, X, AlertCircle, Clock, ShieldCheck
} from 'lucide-react';
import { db } from '../../db/dexie';
import ProductsSubNav from './ProductsSubNav';

const DEFAULT_COMBOS = [
  {
    id: 'cmb-1',
    nombre: 'Pack Gamer Pro: Teclado + Mouse RGB',
    codigo: 'CMB-001',
    descripcion: 'Incluye Teclado Mecánico RGB Redragon + Mouse Óptico Inalámbrico Logitech',
    productos: [
      { id: 'p1', nombre: 'Teclado Mecánico RGB Redragon', cantidad: 1, precio_unitario: 120.00 },
      { id: 'p2', nombre: 'Mouse Óptico Inalámbrico Logitech', cantidad: 1, precio_unitario: 88.00 }
    ],
    precio_regular: 208.00,
    precio_combo: 175.00,
    ahorro: 33.00,
    porcentaje_ahorro: 16,
    fecha_inicio: '2026-07-01',
    fecha_fin: '2026-08-31',
    estado: 'Activo'
  },
  {
    id: 'cmb-2',
    nombre: 'Combo Oficina: Papel Bond x2 + Cartucho Tóner',
    codigo: 'CMB-002',
    descripcion: '2 Cajas de Papel Bond A4 75g + 1 Cartucho Tóner HP Original',
    productos: [
      { id: 'p3', nombre: 'Pack Papel Bond A4 (Caja x5 millares)', cantidad: 2, precio_unitario: 170.00 },
      { id: 'p4', nombre: 'Cartucho Tóner HP LaserJet Original', cantidad: 1, precio_unitario: 245.00 }
    ],
    precio_regular: 585.00,
    precio_combo: 499.00,
    ahorro: 86.00,
    porcentaje_ahorro: 15,
    fecha_inicio: '2026-07-15',
    fecha_fin: '2026-08-15',
    estado: 'Activo'
  },
  {
    id: 'cmb-3',
    nombre: 'Super Pack Almacenamiento: SSD 480GB + USB 64GB',
    codigo: 'CMB-003',
    descripcion: '1 Disco Sólido SSD 480GB Kingston + 1 Memoria USB 64GB Kingston 3.2',
    productos: [
      { id: 'p5', nombre: 'Disco Duro SSD 480GB Kingston', cantidad: 1, precio_unitario: 120.00 },
      { id: 'p6', nombre: 'Memoria USB 64GB Kingston 3.2', cantidad: 1, precio_unitario: 76.00 }
    ],
    precio_regular: 196.00,
    precio_combo: 160.00,
    ahorro: 36.00,
    porcentaje_ahorro: 18,
    fecha_inicio: '2026-06-01',
    fecha_fin: '2026-09-30',
    estado: 'Activo'
  }
];

export default function CombosPromocionesView({ onSelectSubView, onOpenPosWithCart }) {
  const [combos, setCombos] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterEstado, setFilterEstado] = useState('ALL'); // ALL, Activo, Pausado, Vencido
  const [availableProducts, setAvailableProducts] = useState([]);

  // Modal Crear / Editar
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCombo, setEditingCombo] = useState(null);

  // Formulario
  const [formNombre, setFormNombre] = useState('');
  const [formCodigo, setFormCodigo] = useState('');
  const [formDescripcion, setFormDescripcion] = useState('');
  const [formPrecioCombo, setFormPrecioCombo] = useState('');
  const [formFechaInicio, setFormFechaInicio] = useState(new Date().toISOString().slice(0, 10));
  const [formFechaFin, setFormFechaFin] = useState(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
  const [formEstado, setFormEstado] = useState('Activo');
  const [formProductos, setFormProductos] = useState([]);

  // Cargar productos del inventario y combos
  useEffect(() => {
    const load = async () => {
      try {
        const prods = await db.productos_tienda.toArray();
        setAvailableProducts(prods || []);

        const saved = localStorage.getItem('glorypos_combos_promociones');
        if (saved) {
          setCombos(JSON.parse(saved));
        } else {
          setCombos(DEFAULT_COMBOS);
          localStorage.setItem('glorypos_combos_promociones', JSON.stringify(DEFAULT_COMBOS));
        }
      } catch (err) {
        console.error('Error cargando combos:', err);
      }
    };
    load();
  }, []);

  // Guardar en LocalStorage al actualizar
  const saveCombos = (updated) => {
    setCombos(updated);
    localStorage.setItem('glorypos_combos_promociones', JSON.stringify(updated));
  };

  // Cálculos del modal
  const formPrecioRegular = useMemo(() => {
    return formProductos.reduce((acc, p) => acc + (Number(p.cantidad || 1) * Number(p.precio_unitario || 0)), 0);
  }, [formProductos]);

  const formAhorro = Math.max(0, formPrecioRegular - (Number(formPrecioCombo) || 0));
  const formPorcentajeAhorro = formPrecioRegular > 0 ? Math.round((formAhorro / formPrecioRegular) * 100) : 0;

  // Filtrado
  const filteredCombos = useMemo(() => {
    return combos.filter(c => {
      const matchesSearch = 
        c.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.codigo.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesEstado = filterEstado === 'ALL' || c.estado === filterEstado;
      return matchesSearch && matchesEstado;
    });
  }, [combos, searchTerm, filterEstado]);

  // KPIs
  const totalActivos = combos.filter(c => c.estado === 'Activo').length;
  const promedioAhorro = combos.length > 0 
    ? Math.round(combos.reduce((sum, c) => sum + (c.porcentaje_ahorro || 0), 0) / combos.length) 
    : 0;

  // Manejadores del modal
  const handleOpenCreate = () => {
    setEditingCombo(null);
    setFormNombre('');
    setFormCodigo(`CMB-${Math.floor(100 + Math.random() * 900)}`);
    setFormDescripcion('');
    setFormPrecioCombo('');
    setFormFechaInicio(new Date().toISOString().slice(0, 10));
    setFormFechaFin(new Date(Date.now() + 30 * 86400000).toISOString().slice(0, 10));
    setFormEstado('Activo');
    setFormProductos([]);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (combo) => {
    setEditingCombo(combo);
    setFormNombre(combo.nombre);
    setFormCodigo(combo.codigo);
    setFormDescripcion(combo.descripcion || '');
    setFormPrecioCombo(combo.precio_combo);
    setFormFechaInicio(combo.fecha_inicio || new Date().toISOString().slice(0, 10));
    setFormFechaFin(combo.fecha_fin || new Date().toISOString().slice(0, 10));
    setFormEstado(combo.estado || 'Activo');
    setFormProductos(combo.productos || []);
    setIsModalOpen(true);
  };

  const handleAddProductToForm = (prodId) => {
    if (!prodId) return;
    const prod = availableProducts.find(p => String(p.id) === String(prodId));
    if (!prod) return;

    const exists = formProductos.find(p => String(p.id) === String(prod.id));
    if (exists) {
      setFormProductos(formProductos.map(p => 
        String(p.id) === String(prod.id) ? { ...p, cantidad: p.cantidad + 1 } : p
      ));
    } else {
      setFormProductos([
        ...formProductos,
        {
          id: prod.id,
          nombre: prod.nombre,
          cantidad: 1,
          precio_unitario: Number(prod.precio_venta) || 0
        }
      ]);
    }
  };

  const handleRemoveProductFromForm = (index) => {
    setFormProductos(formProductos.filter((_, i) => i !== index));
  };

  const handleUpdateProductQty = (index, qty) => {
    const updated = [...formProductos];
    updated[index].cantidad = Math.max(1, Number(qty) || 1);
    setFormProductos(updated);
  };

  const handleSaveCombo = (e) => {
    e.preventDefault();
    if (!formNombre.trim()) {
      alert('Ingresa el nombre del combo.');
      return;
    }
    if (formProductos.length === 0) {
      alert('Agrega al menos un producto al combo.');
      return;
    }
    if (!formPrecioCombo || Number(formPrecioCombo) <= 0) {
      alert('Ingresa un precio válido para el combo.');
      return;
    }

    const newCombo = {
      id: editingCombo ? editingCombo.id : `cmb-${Date.now()}`,
      nombre: formNombre.trim(),
      codigo: formCodigo.trim() || `CMB-${Date.now().toString().slice(-3)}`,
      descripcion: formDescripcion.trim(),
      productos: formProductos,
      precio_regular: formPrecioRegular,
      precio_combo: Number(formPrecioCombo),
      ahorro: formAhorro,
      porcentaje_ahorro: formPorcentajeAhorro,
      fecha_inicio: formFechaInicio,
      fecha_fin: formFechaFin,
      estado: formEstado
    };

    let updatedList;
    if (editingCombo) {
      updatedList = combos.map(c => c.id === editingCombo.id ? newCombo : c);
    } else {
      updatedList = [newCombo, ...combos];
    }

    saveCombos(updatedList);
    setIsModalOpen(false);
  };

  const handleDeleteCombo = (id) => {
    if (window.confirm('¿Deseas eliminar este combo / promoción?')) {
      const updated = combos.filter(c => c.id !== id);
      saveCombos(updated);
    }
  };

  const handleToggleEstado = (id) => {
    const updated = combos.map(c => {
      if (c.id === id) {
        const nuevoEstado = c.estado === 'Activo' ? 'Pausado' : 'Activo';
        return { ...c, estado: nuevoEstado };
      }
      return c;
    });
    saveCombos(updated);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#f8fafc] min-h-screen font-sans">
      {/* Subnavegación de Productos */}
      <ProductsSubNav currentSubView="combos_promociones" onSelectSubView={onSelectSubView} />

      <main className="max-w-7xl mx-auto w-full p-3 sm:p-5 space-y-5">
        
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Sparkles className="w-5 h-5" />
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Combos y Promociones
              </h1>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Crea paquetes de productos, kits armados, ofertas 2x1 y precios especiales con descuento.
            </p>
          </div>

          <button
            type="button"
            onClick={handleOpenCreate}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-2 shadow-sm transition active:scale-95 self-start sm:self-center"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Combo / Promoción</span>
          </button>
        </div>

        {/* Tarjetas KPI */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Combos Registrados</span>
            <span className="text-2xl font-black text-slate-800 mt-1 block">{combos.length}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Combos Activos</span>
            <span className="text-2xl font-black text-emerald-600 mt-1 block">{totalActivos}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Ahorro Promedio</span>
            <span className="text-2xl font-black text-blue-600 mt-1 block">{promedioAhorro}%</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">Estado de Campaña</span>
            <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full inline-block mt-2">
              Vigente en POS
            </span>
          </div>
        </div>

        {/* Filtros de Búsqueda */}
        <div className="bg-white p-3 sm:p-4 rounded-xl border border-slate-200 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por nombre o código..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-800 placeholder-slate-400 focus:bg-white focus:border-emerald-500 outline-none"
            />
          </div>

          <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto">
            {['ALL', 'Activo', 'Pausado'].map((st) => (
              <button
                key={st}
                type="button"
                onClick={() => setFilterEstado(st)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterEstado === st
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {st === 'ALL' ? 'Todos' : st}
              </button>
            ))}
          </div>
        </div>

        {/* Listado de Combos */}
        {filteredCombos.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
            <Sparkles className="w-10 h-10 mx-auto text-slate-300 mb-2" />
            <p className="text-sm font-semibold">No se encontraron combos o promociones.</p>
            <p className="text-xs mt-1">Crea un nuevo paquete o ajusta los términos de búsqueda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCombos.map((combo) => (
              <div 
                key={combo.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between overflow-hidden"
              >
                {/* Cabecera de la Tarjeta */}
                <div className="p-4 border-b border-slate-100">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="font-mono text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        {combo.codigo}
                      </span>
                      <h3 className="font-bold text-sm text-slate-900 mt-1.5 leading-snug">
                        {combo.nombre}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleToggleEstado(combo.id)}
                      className={`text-[10px] font-black px-2.5 py-0.5 rounded-full border transition shrink-0 ${
                        combo.estado === 'Activo'
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : 'bg-slate-100 text-slate-500 border-slate-200'
                      }`}
                      title="Click para cambiar estado"
                    >
                      {combo.estado}
                    </button>
                  </div>

                  {combo.descripcion && (
                    <p className="text-[11px] text-slate-500 mt-2 line-clamp-2">
                      {combo.descripcion}
                    </p>
                  )}
                </div>

                {/* Lista de Productos Incluidos */}
                <div className="p-4 flex-1 bg-slate-50/50">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
                    Productos del Combo:
                  </span>
                  <div className="space-y-1.5">
                    {combo.productos.map((prod, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs bg-white p-2 rounded-lg border border-slate-100">
                        <div className="flex items-center gap-1.5 truncate mr-2">
                          <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center shrink-0">
                            {prod.cantidad}x
                          </span>
                          <span className="text-slate-700 font-medium truncate">{prod.nombre}</span>
                        </div>
                        <span className="text-slate-500 font-semibold text-[11px] shrink-0">
                          S/ {(prod.cantidad * prod.precio_unitario).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Precios y Ahorro */}
                <div className="p-4 border-t border-slate-100 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 line-through block">
                        Normal: S/ {combo.precio_regular.toFixed(2)}
                      </span>
                      <div className="flex items-baseline gap-1">
                        <span className="text-lg font-black text-emerald-700">
                          S/ {combo.precio_combo.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="inline-flex items-center gap-1 bg-amber-50 border border-amber-200 text-amber-800 text-[11px] font-black px-2 py-0.5 rounded-lg">
                        <Percent className="w-3 h-3" />
                        Ahorra {combo.porcentaje_ahorro}%
                      </span>
                      <span className="text-[10px] text-slate-400 block mt-0.5">
                        (S/ {combo.ahorro.toFixed(2)} menos)
                      </span>
                    </div>
                  </div>

                  {/* Acciones */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                    <div className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Hasta: {combo.fecha_fin}</span>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(combo)}
                        className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition"
                        title="Editar combo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteCombo(combo.id)}
                        className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Eliminar combo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </main>

      {/* ========================================================= */}
      {/* MODAL: CREAR / EDITAR COMBO */}
      {/* ========================================================= */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden my-auto flex flex-col max-h-[90vh]">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <h3 className="font-bold text-sm text-slate-800">
                  {editingCombo ? 'Editar Combo / Promoción' : 'Nuevo Combo / Promoción'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCombo} className="p-5 space-y-4 overflow-y-auto text-xs">
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-bold text-slate-700 mb-1">Nombre del Combo *</label>
                  <input
                    type="text"
                    required
                    value={formNombre}
                    onChange={(e) => setFormNombre(e.target.value)}
                    placeholder="Ej: Pack Familiar Fin de Semana"
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Código</label>
                  <input
                    type="text"
                    value={formCodigo}
                    onChange={(e) => setFormCodigo(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Descripción / Condiciones</label>
                <textarea
                  rows={2}
                  value={formDescripcion}
                  onChange={(e) => setFormDescripcion(e.target.value)}
                  placeholder="Detalles de la promoción, restricciones o regalos incluidos..."
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 resize-none"
                />
              </div>

              {/* Selector de Productos */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800">Productos que Integran el Combo:</span>
                  <span className="text-[11px] text-slate-500">Agrega productos de tu inventario</span>
                </div>

                <div className="flex gap-2">
                  <select
                    id="productSelector"
                    className="flex-1 bg-white border border-slate-300 rounded-lg px-3 py-2 outline-none focus:border-emerald-500 text-xs cursor-pointer"
                    defaultValue=""
                    onChange={(e) => {
                      if (e.target.value) {
                        handleAddProductToForm(e.target.value);
                        e.target.value = "";
                      }
                    }}
                  >
                    <option value="" disabled>Selecciona un producto para añadir...</option>
                    {availableProducts.map(p => (
                      <option key={p.id} value={p.id}>
                        {p.nombre} — S/ {Number(p.precio_venta || 0).toFixed(2)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Tabla de productos agregados */}
                {formProductos.length === 0 ? (
                  <div className="py-4 text-center text-slate-400 text-xs italic">
                    Sin productos agregados. Usa el selector arriba para armar el paquete.
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    {formProductos.map((p, idx) => (
                      <div key={p.id} className="flex items-center justify-between bg-white p-2.5 rounded-lg border border-slate-200 gap-3">
                        <span className="font-semibold text-slate-800 flex-1 truncate">{p.nombre}</span>
                        
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 text-[10px]">Cant:</span>
                          <input
                            type="number"
                            min="1"
                            value={p.cantidad}
                            onChange={(e) => handleUpdateProductQty(idx, e.target.value)}
                            className="w-14 border border-slate-300 rounded px-1.5 py-1 text-center font-bold text-slate-800"
                          />
                        </div>

                        <span className="font-bold text-slate-700 w-20 text-right">
                          S/ {(p.cantidad * p.precio_unitario).toFixed(2)}
                        </span>

                        <button
                          type="button"
                          onClick={() => handleRemoveProductFromForm(idx)}
                          className="text-slate-400 hover:text-red-500 p-1"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Precios y Descuento */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200">
                <div>
                  <span className="text-[11px] font-bold text-slate-600 block">Suma Regular:</span>
                  <span className="text-base font-black text-slate-800 block mt-0.5">
                    S/ {formPrecioRegular.toFixed(2)}
                  </span>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-800 block mb-1">Precio Combo Promocional *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={formPrecioCombo}
                    onChange={(e) => setFormPrecioCombo(e.target.value)}
                    placeholder="0.00"
                    className="w-full bg-white border-2 border-emerald-500 rounded-lg px-3 py-1.5 font-black text-slate-900 text-sm outline-none"
                  />
                </div>

                <div>
                  <span className="text-[11px] font-bold text-slate-600 block">Ahorro del Cliente:</span>
                  <span className="text-sm font-black text-emerald-700 block mt-1">
                    S/ {formAhorro.toFixed(2)} ({formPorcentajeAhorro}%)
                  </span>
                </div>
              </div>

              {/* Fechas de Vigencia y Estado */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Inicio</label>
                  <input
                    type="date"
                    value={formFechaInicio}
                    onChange={(e) => setFormFechaInicio(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Fecha de Fin</label>
                  <input
                    type="date"
                    value={formFechaFin}
                    onChange={(e) => setFormFechaFin(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Estado</label>
                  <select
                    value={formEstado}
                    onChange={(e) => setFormEstado(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-3 py-1.5 outline-none focus:border-emerald-500 bg-white"
                  >
                    <option value="Activo">Activo</option>
                    <option value="Pausado">Pausado</option>
                  </select>
                </div>
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
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold shadow-sm transition active:scale-95"
                >
                  Guardar Combo
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
