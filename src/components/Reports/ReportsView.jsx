import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, Package, Award, Truck, FileText, Boxes, Wallet, BarChart2 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';
import ReporteVentasTab from './ReporteVentasTab';
import ReporteProductosTab from './ReporteProductosTab';
import ReporteVentasProductoTab from './ReporteVentasProductoTab';
import ReporteComprasTab from './ReporteComprasTab';
import ReporteNotasCreditoDebitoTab from './ReporteNotasCreditoDebitoTab';
import ReporteKardexTab from './ReporteKardexTab';
import ReporteCajaTab from './ReporteCajaTab';

export default function ReportsView({ onOpenReceipt, initialTab = 'ventas' }) {
  const { empresa } = useAuth();

  // 7 Pestañas Completas:
  // 1. 'ventas': Reporte de ventas
  // 2. 'productos': Reporte de productos
  // 3. 'ventas_producto': Ventas por producto
  // 4. 'compras': Reporte de compras
  // 5. 'notas': Reporte de notas de crédito y débito
  // 6. 'kardex': Reporte de kardex
  // 7. 'caja': Reporte de caja
  const [activeTab, setActiveTab] = useState(initialTab);

  // Sincronizar prop initialTab (navegación desde el sidebar o URL)
  useEffect(() => {
    if (initialTab) {
      const normalized = 
        ['ventas', 'reporte_ventas', 'reports', 'reportes'].includes(initialTab) ? 'ventas' :
        ['productos', 'reporte_productos'].includes(initialTab) ? 'productos' :
        ['ventas_producto', 'ventas_por_producto', 'reporte_ventas_producto'].includes(initialTab) ? 'ventas_producto' :
        ['compras', 'reporte_compras'].includes(initialTab) ? 'compras' :
        ['notas', 'notas_credito', 'notas_credito_debito', 'reporte_notas'].includes(initialTab) ? 'notas' :
        ['kardex', 'reporte_kardex'].includes(initialTab) ? 'kardex' :
        ['caja', 'reporte_caja', 'reporte_cajas_tab'].includes(initialTab) ? 'caja' :
        'ventas';
      setActiveTab(normalized);
    }
  }, [initialTab]);

  // Datos reactivos desde Dexie
  const [ventas, setVentas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [compras, setCompras] = useState([]);
  const [kardex, setKardex] = useState([]);
  const [movimientosCaja, setMovimientosCaja] = useState([]);

  const loadData = async () => {
    try {
      const [vts, prods, buys, kdx, movs] = await Promise.all([
        db.ventas ? db.ventas.reverse().toArray() : [],
        db.productos_tienda ? db.productos_tienda.toArray() : [],
        db.compras ? db.compras.reverse().toArray() : [],
        db.kardex ? db.kardex.reverse().toArray() : [],
        db.movimientos_caja ? db.movimientos_caja.reverse().toArray() : []
      ]);

      setVentas(vts);
      setProductos(prods);
      setCompras(buys);
      setKardex(kdx);
      setMovimientosCaja(movs);
    } catch (err) {
      console.error('Error cargando datos de reportes:', err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Configuración de las 7 pestañas
  const tabs = [
    { id: 'ventas', label: 'Reporte de ventas', icon: TrendingUp },
    { id: 'productos', label: 'Reporte de productos', icon: Package },
    { id: 'ventas_producto', label: 'Ventas por producto', icon: Award },
    { id: 'compras', label: 'Reporte de compras', icon: Truck },
    { id: 'notas', label: 'Notas de crédito & débito', icon: FileText },
    { id: 'kardex', label: 'Reporte de kardex', icon: Boxes },
    { id: 'caja', label: 'Reporte de caja', icon: Wallet }
  ];

  return (
    <div className="flex-1 flex flex-col font-sans">
      {/* Contenedor Principal de la Pestaña Activa */}
      <main className="w-full p-3 sm:p-5 space-y-4">
        {/* 1. Reporte de ventas */}
        {activeTab === 'ventas' && (
          <ReporteVentasTab ventas={ventas} />
        )}

        {/* 2. Reporte de productos */}
        {activeTab === 'productos' && (
          <ReporteProductosTab productos={productos} />
        )}

        {/* 3. Ventas por producto */}
        {activeTab === 'ventas_producto' && (
          <ReporteVentasProductoTab ventas={ventas} productos={productos} />
        )}

        {/* 4. Reporte de compras */}
        {activeTab === 'compras' && (
          <ReporteComprasTab compras={compras} />
        )}

        {/* 5. Reporte de notas de crédito y débito */}
        {activeTab === 'notas' && (
          <ReporteNotasCreditoDebitoTab />
        )}

        {/* 6. Reporte de kardex */}
        {activeTab === 'kardex' && (
          <ReporteKardexTab kardex={kardex} />
        )}

        {/* 7. Reporte de caja */}
        {activeTab === 'caja' && (
          <ReporteCajaTab movimientosCaja={movimientosCaja} />
        )}
      </main>
    </div>
  );
}

