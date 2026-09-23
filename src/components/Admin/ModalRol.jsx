import React, { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight } from 'lucide-react';
import { db } from '../../db/dexie';

// Definición exacta de las 20 categorías y sus columnas de permisos
// basadas en media_1790121199245.png y media_1790121199253.png
export const COLUMNA_IZQUIERDA_CATEGORIAS = [
  {
    id: 'panel',
    nombre: 'PANEL',
    col1: [
      { id: 'ver_dashboard', label: 'Ver dashboard' }
    ],
    col2: []
  },
  {
    id: 'cotizaciones',
    nombre: 'COTIZACIONES',
    col1: [
      { id: 'convertir_cotizacion_venta', label: 'Convertir cotización en venta' },
      { id: 'eliminar_cotizaciones', label: 'Eliminar cotizaciones' },
      { id: 'ver_cotizaciones', label: 'Ver cotizaciones' }
    ],
    col2: [
      { id: 'crear_cotizaciones', label: 'Crear cotizaciones' },
      { id: 'editar_cotizaciones', label: 'Editar cotizaciones' }
    ]
  },
  {
    id: 'compras',
    nombre: 'COMPRAS',
    col1: [
      { id: 'crear_compras', label: 'Crear compras' },
      { id: 'ver_compras', label: 'Ver compras' }
    ],
    col2: [
      { id: 'eliminar_compras', label: 'Eliminar compras' }
    ]
  },
  {
    id: 'productos',
    nombre: 'PRODUCTOS',
    col1: [
      { id: 'crear_productos', label: 'Crear productos' },
      { id: 'editar_productos', label: 'Editar productos' }
    ],
    col2: [
      { id: 'eliminar_productos', label: 'Eliminar productos' },
      { id: 'ver_productos', label: 'Ver productos' }
    ]
  },
  {
    id: 'contactos',
    nombre: 'CONTACTOS',
    col1: [
      { id: 'crear_contactos', label: 'Crear contactos' },
      { id: 'editar_contactos', label: 'Editar contactos' }
    ],
    col2: [
      { id: 'eliminar_contactos', label: 'Eliminar contactos' },
      { id: 'ver_contactos', label: 'Ver contactos' }
    ]
  },
  {
    id: 'facturacion_electronica',
    nombre: 'FACTURACIÓN ELECTRÓNICA',
    col1: [
      { id: 'retenciones_percepciones_reversiones', label: 'Retenciones, percepciones y reversiones' },
      { id: 'emitir_nota_debito', label: 'Emitir nota de débito' },
      { id: 'gestionar_facturacion_electronica', label: 'Gestionar facturación electrónica (todo lo de abajo)' }
    ],
    col2: [
      { id: 'anular_venta_nota_credito', label: 'Anular venta con nota de crédito' },
      { id: 'emitir_guias_remision', label: 'Emitir guías de remisión' },
      { id: 'enviar_sunat', label: 'Enviar a SUNAT' }
    ]
  },
  {
    id: 'transportistas_flota',
    nombre: 'TRANSPORTISTAS Y FLOTA',
    col1: [
      { id: 'gestionar_transportistas_flota', label: 'Gestionar transportistas, conductores y vehículos' }
    ],
    col2: [
      { id: 'ver_transportistas_flota', label: 'Ver transportistas, conductores y vehículos' }
    ]
  },
  {
    id: 'membresias',
    nombre: 'MEMBRESÍAS',
    col1: [
      { id: 'crear_membresias', label: 'Crear membresías' },
      { id: 'editar_membresias', label: 'Editar membresías' },
      { id: 'ver_membresias', label: 'Ver membresías' }
    ],
    col2: [
      { id: 'eliminar_membresias', label: 'Eliminar membresías' },
      { id: 'generar_venta_membresia', label: 'Generar venta desde membresía' }
    ]
  },
  {
    id: 'modulos_plan',
    nombre: 'MÓDULOS DEL PLAN',
    col1: [
      { id: 'activar_desactivar_modulos', label: 'Activar/desactivar módulos' }
    ],
    col2: []
  },
  {
    id: 'usuarios',
    nombre: 'USUARIOS',
    col1: [
      { id: 'crear_usuarios', label: 'Crear usuarios' },
      { id: 'editar_usuarios', label: 'Editar usuarios' }
    ],
    col2: [
      { id: 'eliminar_usuarios', label: 'Eliminar usuarios' },
      { id: 'ver_usuarios', label: 'Ver usuarios' }
    ]
  }
];

export const COLUMNA_DERECHA_CATEGORIAS = [
  {
    id: 'ventas',
    nombre: 'VENTAS',
    col1: [
      { id: 'anular_ventas', label: 'Anular ventas' },
      { id: 'cambiar_precio_vender', label: 'Cambiar precio al vender sin restricción de catálogo' },
      { id: 'ver_ventas', label: 'Ver ventas' }
    ],
    col2: [
      { id: 'crear_ventas', label: 'Crear ventas' },
      { id: 'usar_pos', label: 'Usar punto de venta' }
    ]
  },
  {
    id: 'cuentas_por_cobrar',
    nombre: 'CUENTAS POR COBRAR',
    col1: [
      { id: 'registrar_cobro_cxc', label: 'Registrar cobro (CxC)' },
      { id: 'ver_cuentas_cobrar', label: 'Ver cuentas por cobrar' }
    ],
    col2: [
      { id: 'confirmar_deposito_bn', label: 'Confirmar depósito Banco de la Nación' }
    ]
  },
  {
    id: 'cuentas_por_pagar',
    nombre: 'CUENTAS POR PAGAR',
    col1: [
      { id: 'registrar_pago_cxp', label: 'Registrar pago (CxP)' }
    ],
    col2: [
      { id: 'ver_cuentas_pagar', label: 'Ver cuentas por pagar' }
    ]
  },
  {
    id: 'inventario',
    nombre: 'INVENTARIO',
    col1: [
      { id: 'ajustar_stock', label: 'Ajustar stock' },
      { id: 'confirmar_doc_inventario', label: 'Confirmar documento de inventario' },
      { id: 'crear_doc_ingreso_egreso', label: 'Crear documento de ingreso/egreso' },
      { id: 'gestionar_inventario', label: 'Gestionar inventario' },
      { id: 'ver_inventario', label: 'Ver inventario' }
    ],
    col2: [
      { id: 'cancelar_revertir_transferencia', label: 'Cancelar/revertir transferencia' },
      { id: 'confirmar_transferencia_recibida', label: 'Confirmar transferencia recibida' },
      { id: 'ajuste_stock_importacion', label: 'Ajuste de stock por importación' },
      { id: 'transferir_sucursales', label: 'Transferir entre sucursales' },
      { id: 'anular_doc_inventario', label: 'Anular documento de inventario' }
    ]
  },
  {
    id: 'caja_bancos',
    nombre: 'CAJA Y BANCOS',
    col1: [
      { id: 'registrar_arqueo_caja', label: 'Registrar arqueo de caja' },
      { id: 'gestionar_caja_bancos', label: 'Gestionar caja y bancos' },
      { id: 'abrir_caja', label: 'Abrir caja' }
    ],
    col2: [
      { id: 'cerrar_caja', label: 'Cerrar caja' },
      { id: 'movimientos_caja', label: 'Movimientos de caja' },
      { id: 'ver_caja_bancos', label: 'Ver caja y bancos' }
    ]
  },
  {
    id: 'reportes',
    nombre: 'REPORTES',
    col1: [
      { id: 'ver_reporte_caja', label: 'Ver reporte de caja' },
      { id: 'ver_todos_reportes', label: 'Ver todos los reportes' },
      { id: 'ver_reporte_productos', label: 'Ver reporte de productos' },
      { id: 'ver_reporte_ventas', label: 'Ver reporte de ventas' }
    ],
    col2: [
      { id: 'ver_reporte_kardex', label: 'Ver reporte de kardex' },
      { id: 'ver_reporte_notas', label: 'Ver reporte de notas de crédito/débito' },
      { id: 'ver_reporte_compras', label: 'Ver reporte de compras' },
      { id: 'ver_reporte_ventas_producto', label: 'Ver reporte de ventas por producto' }
    ]
  },
  {
    id: 'tienda_virtual',
    nombre: 'TIENDA VIRTUAL',
    col1: [
      { id: 'configurar_tienda_virtual', label: 'Configurar tienda virtual' },
      { id: 'ver_tienda_virtual_pedidos', label: 'Ver tienda virtual y pedidos web' }
    ],
    col2: [
      { id: 'gestionar_pedidos_web', label: 'Gestionar pedidos web' }
    ]
  },
  {
    id: 'empresa',
    nombre: 'EMPRESA',
    col1: [
      { id: 'editar_config_empresa', label: 'Editar configuración de empresa' }
    ],
    col2: [
      { id: 'ver_config_empresa', label: 'Ver configuración de empresa' }
    ]
  },
  {
    id: 'suscripcion_tukifac',
    nombre: 'SUSCRIPCIÓN TUKIFAC',
    col1: [
      { id: 'registrar_pagos_paquetes', label: 'Registrar pagos y comprar paquetes de documentos' }
    ],
    col2: [
      { id: 'ver_suscripcion_facturacion', label: 'Ver suscripción y facturación de Tukifac' }
    ]
  },
  {
    id: 'roles',
    nombre: 'ROLES',
    col1: [
      { id: 'gestionar_roles', label: 'Gestionar roles' }
    ],
    col2: [
      { id: 'ver_roles', label: 'Ver roles' }
    ]
  }
];

// Helper para extraer todos los IDs de permisos de una categoría
export const getAllCategoryPermissionIds = (cat) => {
  return [...cat.col1.map(p => p.id), ...cat.col2.map(p => p.id)];
};

export default function ModalRol({ isOpen, onClose, rolToEdit, onSaved }) {
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [permisos, setPermisos] = useState([]);
  const [collapsedCategories, setCollapsedCategories] = useState({});
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (rolToEdit) {
      setNombre(rolToEdit.nombre || '');
      setDescripcion(rolToEdit.descripcion || '');
      setPermisos(Array.isArray(rolToEdit.permisos) ? rolToEdit.permisos : []);
    } else {
      setNombre('');
      setDescripcion('');
      // Permisos por defecto iniciales
      setPermisos(['ver_dashboard', 'usar_pos', 'ver_ventas', 'ver_productos']);
    }
    setError('');
  }, [rolToEdit, isOpen]);

  if (!isOpen) return null;

  const togglePermiso = (permId) => {
    if (permisos.includes(permId)) {
      setPermisos(permisos.filter(p => p !== permId));
    } else {
      setPermisos([...permisos, permId]);
    }
  };

  const toggleCategoryCollapse = (catId) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }));
  };

  const handleSave = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    if (!nombre.trim()) {
      setError('El nombre del rol es requerido');
      return;
    }

    setGuardando(true);
    setError('');

    try {
      const rolData = {
        id: rolToEdit?.id || `rol-${Date.now()}`,
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        permisos,
        activo: rolToEdit?.activo !== false,
        esSistema: rolToEdit?.esSistema || false
      };

      await db.roles.put(rolData);
      if (onSaved) onSaved(rolData);
      onClose();
    } catch (err) {
      console.error('Error guardando rol:', err);
      setError('Ocurrió un error al guardar el rol');
    } finally {
      setGuardando(false);
    }
  };

  // Renderizador de una categoría individual (con borde, chevron y columnas de checkboxes)
  const renderCategoryCard = (cat) => {
    const isCollapsed = !!collapsedCategories[cat.id];
    const hasCol2 = cat.col2 && cat.col2.length > 0;

    return (
      <div 
        key={cat.id} 
        className="border border-slate-200/90 rounded-lg p-3 bg-white shadow-2xs transition hover:border-slate-300"
      >
        {/* Cabecera de Categoría con Chevron */}
        <div 
          onClick={() => toggleCategoryCollapse(cat.id)}
          className="flex items-center gap-1.5 cursor-pointer select-none mb-2"
        >
          {isCollapsed ? (
            <ChevronRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          )}
          <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wide">
            {cat.nombre}
          </span>
        </div>

        {/* Checkboxes de Permisos */}
        {!isCollapsed && (
          <div className={`grid ${hasCol2 ? 'grid-cols-1 sm:grid-cols-2' : 'grid-cols-1'} gap-x-3 gap-y-1.5 pt-0.5`}>
            {/* Columna 1 */}
            <div className="space-y-1.5">
              {cat.col1.map((p) => {
                const checked = permisos.includes(p.id);
                return (
                  <label 
                    key={p.id} 
                    className="flex items-start gap-2 cursor-pointer group text-slate-700 select-none"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => togglePermiso(p.id)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer accent-[#2563eb]"
                    />
                    <span className="text-[11px] leading-tight text-slate-700 group-hover:text-slate-950 font-normal">
                      {p.label}
                    </span>
                  </label>
                );
              })}
            </div>

            {/* Columna 2 */}
            {hasCol2 && (
              <div className="space-y-1.5">
                {cat.col2.map((p) => {
                  const checked = permisos.includes(p.id);
                  return (
                    <label 
                      key={p.id} 
                      className="flex items-start gap-2 cursor-pointer group text-slate-700 select-none"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => togglePermiso(p.id)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500 border-slate-300 w-3.5 h-3.5 cursor-pointer accent-[#2563eb]"
                      />
                      <span className="text-[11px] leading-tight text-slate-700 group-hover:text-slate-950 font-normal">
                        {p.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-2xs animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Cabecera del Modal (Exacta a media_1790121199245.png) */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between">
          <h2 className="text-base font-bold text-slate-800 tracking-tight">
            {rolToEdit ? 'Editar rol' : 'Nuevo rol'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cuerpo del Formulario */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium">
              {error}
            </div>
          )}

          {/* Fila 1: Nombre * y Descripción */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Nombre *
              </label>
              <input
                type="text"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                placeholder="Ej. Almacenero"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Descripción
              </label>
              <input
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Gestión de inventario"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs font-normal text-slate-800 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition"
              />
            </div>
          </div>

          {/* Fila 2: Contador de Permisos (X seleccionados) */}
          <div className="pt-1">
            <h3 className="text-xs font-semibold text-slate-700">
              Permisos ({permisos.length} seleccionados)
            </h3>
          </div>

          {/* Cuadrícula de 2 Columnas de Tarjetas de Permisos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 pt-1">
            {/* Columna Izquierda (10 Categorías) */}
            <div className="space-y-3">
              {COLUMNA_IZQUIERDA_CATEGORIAS.map(renderCategoryCard)}
            </div>

            {/* Columna Derecha (10 Categorías) */}
            <div className="space-y-3">
              {COLUMNA_DERECHA_CATEGORIAS.map(renderCategoryCard)}
            </div>
          </div>
        </div>

        {/* Pie del Modal (Botones Cancelar y Guardar exactos al Screenshot) */}
        <div className="px-6 py-3.5 bg-white border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="w-1/2 sm:w-44 py-2 border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-medium rounded-lg transition text-center"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={guardando}
            className="w-1/2 sm:w-56 py-2 bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold rounded-lg shadow-xs transition text-center disabled:opacity-50"
          >
            {guardando ? 'Guardando...' : 'Guardar'}
          </button>
        </div>

      </div>
    </div>
  );
}
