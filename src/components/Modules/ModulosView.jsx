import React from 'react';
import { Layers, Check, Sparkles, Zap, Smartphone, Globe, Printer, ShieldCheck } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function ModulosView() {
  const { empresa } = useAuth();

  const modulos = [
    {
      id: 'mod-pos',
      nombre: 'Punto de Venta Móvil & Web (POS)',
      descripcion: 'Venta rápida en celular y PC, cobro en efectivo y QR Simple.',
      activo: true,
      badge: 'Incluido en todos los planes',
      icon: Smartphone,
      color: 'bg-blue-50 text-blue-600'
    },
    {
      id: 'mod-siat',
      nombre: 'Facturación Electrónica en Línea SIAT',
      descripcion: 'Conexión oficial con el Servicio de Impuestos Nacionales (SIN). Emisión de facturas con código CUF y firma digital.',
      activo: empresa?.plan_tipo === 'PRO',
      badge: empresa?.plan_tipo === 'PRO' ? 'Habilitado' : 'Requiere Plan PRO',
      icon: ShieldCheck,
      color: 'bg-emerald-50 text-emerald-600'
    },
    {
      id: 'mod-ecommerce',
      nombre: 'Tienda Virtual & Catálogo Online',
      descripcion: 'Enlace web con tus productos para que tus clientes pidan por WhatsApp.',
      activo: true,
      badge: 'Activo',
      icon: Globe,
      color: 'bg-purple-50 text-purple-600'
    },
    {
      id: 'mod-print',
      nombre: 'Impresión Térmica Bluetooth & USB',
      descripcion: 'Imprime tickets térmicos de 58mm y 80mm al instante.',
      activo: true,
      badge: 'Activo',
      icon: Printer,
      color: 'bg-indigo-50 text-indigo-600'
    },
    {
      id: 'mod-barcode',
      nombre: 'Lector de Código de Barras con Cámara',
      descripcion: 'Escaneo directo con la cámara del celular con visor split-view en vivo.',
      activo: true,
      badge: 'Activo',
      icon: Zap,
      color: 'bg-amber-50 text-amber-600'
    }
  ];

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Header */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
            <span className="text-[10px] font-bold uppercase text-blue-600">Ecosistema GLORYPOS</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-0.5">Módulos & Extensiones del Sistema</h1>
          <p className="text-xs text-slate-500">Activa o administra las herramientas especializadas de tu negocio.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {modulos.map(mod => {
          const Icon = mod.icon;
          return (
            <div key={mod.id} className="p-4 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-start space-x-3.5">
              <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-sm text-slate-900">{mod.nombre}</h3>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                    mod.activo ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {mod.badge}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">{mod.descripcion}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
