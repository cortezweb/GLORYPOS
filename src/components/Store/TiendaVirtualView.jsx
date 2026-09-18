import React, { useState, useEffect } from 'react';
import { 
  Globe, ShoppingBag, ExternalLink, Share2, Eye, 
  Smartphone, QrCode, CheckCircle2, Search, ArrowRight 
} from 'lucide-react';
import { db } from '../../db/dexie';
import { useAuth } from '../../context/AuthContext';

export default function TiendaVirtualView() {
  const { empresa } = useAuth();
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    db.productos_tienda.toArray().then(setProducts);
  }, []);

  const storeUrl = `https://glorypos.bo/catalogo/${empresa?.nit_ci || 'tienda'}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(storeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filtered = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.categoria.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4 animate-fadeIn pb-12">
      {/* Header Banner Tienda Virtual */}
      <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-[#7c3aed] rounded-2xl p-4 sm:p-6 text-white shadow-lg flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-100">
              Catálogo Web Online
            </span>
          </div>
          <h1 className="text-xl sm:text-2xl font-black mt-1">Tienda Virtual GLORYPOS</h1>
          <p className="text-xs sm:text-sm text-blue-100 mt-1 max-w-xl">
            Tus clientes pueden ver tu catálogo en tiempo real desde su celular y hacer pedidos directos a tu WhatsApp con QR de pago.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleCopyLink}
            className="px-3.5 py-2 bg-white/15 hover:bg-white/25 backdrop-blur-md rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-white/20"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? '¡Enlace Copiado!' : 'Compartir Link'}</span>
          </button>
          <a
            href={storeUrl}
            target="_blank"
            rel="noreferrer"
            className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold transition shadow-md flex items-center gap-1.5"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Ver Tienda</span>
          </a>
        </div>
      </div>

      {/* URL Box & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center gap-3 md:col-span-2">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Globe className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Enlace Público de tu Negocio</span>
            <p className="text-xs font-mono text-slate-800 truncate font-semibold">{storeUrl}</p>
          </div>
          <button
            onClick={handleCopyLink}
            className="text-xs font-bold text-blue-600 hover:underline shrink-0"
          >
            Copiar
          </button>
        </div>

        <div className="p-3.5 bg-white rounded-2xl border border-slate-200 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[10px] uppercase font-bold text-slate-400 block">Productos en Catálogo</span>
            <span className="text-xl font-black text-slate-900">{products.length} ítems</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            100%
          </div>
        </div>
      </div>

      {/* Product List Available in Virtual Store */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-4 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Productos Sincronizados</h3>
            <p className="text-xs text-slate-500">Se actualizan automáticamente con el stock de tu POS.</p>
          </div>

          <div className="relative w-64 max-w-xs">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            <input
              type="text"
              placeholder="Buscar en catálogo..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          {filtered.map(prod => (
            <div key={prod.id} className="p-3 rounded-xl border border-slate-100 bg-slate-50/50 flex items-center space-x-3">
              <img
                src={prod.foto_url}
                alt={prod.nombre}
                className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <span className="text-[9px] font-bold uppercase text-blue-600 block truncate">{prod.categoria}</span>
                <p className="text-xs font-semibold text-slate-800 truncate">{prod.nombre}</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-xs font-bold text-slate-900">Bs. {Number(prod.precio_venta).toFixed(2)}</span>
                  <span className="text-[10px] text-emerald-600 font-semibold">Stock: {prod.stock_actual}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
