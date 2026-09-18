import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Volume2, VolumeX, Zap, Camera, Scan, Trash2, 
  Minus, Plus, ChevronRight, CheckCircle2 
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { db } from '../../db/dexie';

export default function BarcodeScannerModal({ isOpen, onClose, onOpenCheckout }) {
  const { items, total, count, updateQuantity, removeFromCart, clearCart, addToCart } = useCart();
  
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [lastDetected, setLastDetected] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Play beep sound on successful scan
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // audio context not available
    }
  };

  // Start back camera on mount if available
  useEffect(() => {
    if (!isOpen) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      setCameraActive(false);
      return;
    }

    let isMounted = true;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          const stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
          });
          if (isMounted) {
            streamRef.current = stream;
            if (videoRef.current) {
              videoRef.current.srcObject = stream;
            }
            setCameraActive(true);
          }
        }
      } catch (err) {
        console.warn('Camera not accessible or permission denied:', err);
        setCameraActive(false);
      }
    };

    startCamera();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Process code scanning
  const handleScanCode = async (codigo) => {
    if (!codigo) return;
    const cleanCode = codigo.trim();
    const prod = await db.productos_tienda.where('codigo_barras').equals(cleanCode).first();
    
    if (prod) {
      addToCart(prod);
      playBeep();
      setLastDetected({ nombre: prod.nombre, codigo: cleanCode });
      setManualCode('');
      setTimeout(() => setLastDetected(null), 2500);
    } else {
      // Fallback check in master products
      const master = await db.catalogo_maestro.where('codigo_barras').equals(cleanCode).first();
      if (master) {
        // Auto import from master catalog
        const newShopProd = {
          id: `prod-${Date.now()}`,
          maestro_id: master.id,
          codigo_barras: master.codigo_barras,
          nombre: master.nombre,
          categoria: master.categoria,
          unidad_medida: master.unidad_medida,
          foto_url: master.foto_url,
          precio_venta: master.precio_sugerido,
          precio_compra: master.precio_sugerido * 0.8,
          stock_actual: 24,
          stock_minimo: 3,
          activo: true,
          presentaciones: master.presentaciones || []
        };
        await db.productos_tienda.add(newShopProd);
        addToCart(newShopProd);
        playBeep();
        setLastDetected({ nombre: newShopProd.nombre, codigo: cleanCode });
        setManualCode('');
        setTimeout(() => setLastDetected(null), 2500);
      } else {
        alert(`Código ${cleanCode} no encontrado.`);
      }
    }
  };

  const handleCheckout = () => {
    onClose();
    if (onOpenCheckout) {
      onOpenCheckout();
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex justify-center animate-fadeIn">
      {/* Mobile Device Frame matching Stitch */}
      <main className="w-full max-w-md bg-slate-50 flex flex-col h-screen overflow-hidden shadow-2xl relative border-x border-slate-200">
        {/* Scanner Top Navigation Bar */}
        <section className="bg-slate-900 text-white px-4 py-2.5 flex items-center justify-between border-b border-slate-800 z-30 shadow-xs">
          <div className="flex items-center gap-3">
            <button 
              onClick={onClose}
              aria-label="Volver al punto de venta" 
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors active:scale-95" 
              type="button"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                <h1 className="font-bold text-sm tracking-tight leading-tight">Lector de Códigos</h1>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Facturación SIAT • GLORYPOS</p>
            </div>
          </div>

          {/* Quick Toggles: Sound & Flash */}
          <div className="flex items-center gap-1.5">
            <button 
              onClick={() => setSoundEnabled(!soundEnabled)}
              aria-label="Activar sonido beep" 
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                soundEnabled 
                  ? 'bg-slate-800 text-blue-400 border-slate-700' 
                  : 'bg-slate-800/50 text-slate-500 border-slate-800'
              }`}
              type="button"
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            <button 
              onClick={() => setTorchEnabled(!torchEnabled)}
              aria-label="Linterna" 
              className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors ${
                torchEnabled 
                  ? 'bg-amber-400 text-slate-950 border-amber-300' 
                  : 'bg-violet-500/20 text-violet-400 border-violet-500/40'
              }`}
              type="button"
            >
              <Zap className="w-4 h-4 fill-current" />
            </button>
          </div>
        </section>

        {/* Live Camera Viewport (Top ~36% split as in photo) */}
        <section className="relative bg-black w-full h-[36%] shrink-0 overflow-hidden flex flex-col justify-between p-3 select-none">
          {/* Real Camera Stream or Animated Background */}
          {cameraActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="absolute inset-0 w-full h-full object-cover"
            />
          ) : (
            <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px]"></div>
          )}

          {/* Top Helper Pill Overlay */}
          <div className="relative z-20 flex justify-between items-center">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-emerald-300 shadow-lg">
              <Scan className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              Apunta al código de barras
            </span>

            {/* Quick simulation pills in top corner */}
            <div className="flex gap-1">
              <button 
                onClick={() => handleScanCode('7771234000018')}
                className="px-2 py-0.5 bg-slate-900/80 text-white hover:bg-indigo-600 rounded text-[10px] font-bold border border-white/20"
                title="Simular Coca-Cola"
              >
                + Coca 2L
              </button>
              <button 
                onClick={() => handleScanCode('7771234000032')}
                className="px-2 py-0.5 bg-slate-900/80 text-white hover:bg-indigo-600 rounded text-[10px] font-bold border border-white/20"
                title="Simular Paceña"
              >
                + Paceña
              </button>
            </div>
          </div>

          {/* Central Reticle with Corner Brackets (Matching user's photo!) */}
          <div className="relative z-10 w-64 max-w-[85%] h-28 mx-auto my-auto flex items-center justify-center">
            {/* Green / Cyan Corner Brackets */}
            <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg shadow-[0_0_8px_#34d399]"></div>
            <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg shadow-[0_0_8px_#34d399]"></div>
            <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg shadow-[0_0_8px_#34d399]"></div>
            <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg shadow-[0_0_8px_#34d399]"></div>

            {/* Laser Scanning Line */}
            <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_12px_#10b981] animate-pulse"></div>

            {/* Detected Product Notification Tag */}
            {lastDetected && (
              <div className="absolute -bottom-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-3 py-0.5 rounded-full text-[10px] tracking-wider uppercase flex items-center gap-1 shadow-lg animate-bounce border border-white/30">
                <CheckCircle2 className="w-3 h-3 text-white" />
                <span>{lastDetected.nombre}</span>
              </div>
            )}
          </div>

          {/* Manual Input Bar */}
          <div className="relative z-20 pb-0.5">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleScanCode(manualCode); }}
              className="flex gap-1.5 bg-slate-900/90 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70"
            >
              <div className="relative flex-1 flex items-center">
                <Scan className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
                <input 
                  value={manualCode}
                  onChange={(e) => setManualCode(e.target.value)}
                  className="w-full bg-slate-800/90 text-white placeholder-slate-400 text-xs rounded-lg pl-8 pr-2 py-1.5 focus:ring-1 focus:ring-emerald-500 focus:outline-none border-0" 
                  placeholder="Ingreso manual de código..." 
                  type="text"
                />
              </div>
              <button 
                type="submit"
                className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shrink-0 shadow-xs"
              >
                <span>Agregar</span>
              </button>
            </form>
          </div>
        </section>

        {/* Lower Sliding Sheet with Live Cart Items (Matching user's photo!) */}
        <section className="flex-1 bg-slate-50 flex flex-col min-h-0 overflow-hidden rounded-t-2xl -mt-2 z-20 shadow-lg border-t border-slate-200">
          {/* Sheet Handle */}
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-1"></div>

          {/* Cart Header */}
          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Productos en Carrito
              </h2>
              <span className="inline-flex items-center justify-center bg-indigo-100 text-indigo-700 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {count} {count === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {items.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 active:underline flex items-center gap-1" 
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>
            )}
          </div>

          {/* Scrollable Scanned Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {items.map((it, idx) => (
              <article 
                key={`${it.productId}-${it.presId}`}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-indigo-300 transition-all relative"
              >
                {idx === items.length - 1 && (
                  <div className="absolute -top-2 right-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-[9px] font-extrabold px-2 py-0.2 rounded-full uppercase tracking-wider shadow-xs">
                    ¡Agregado recién!
                  </div>
                )}

                <div className="flex items-start gap-3">
                  <img
                    src={it.foto_url}
                    alt={it.nombre}
                    className="w-12 h-12 rounded-lg object-cover border border-slate-100 shrink-0"
                  />

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-xs text-slate-800 truncate leading-snug">
                      {it.nombre}
                    </h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] font-mono text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                        {it.codigo_barras || 'S/N'}
                      </span>
                      <span className="text-[10px] text-indigo-600 font-semibold">
                        {it.presNombre}
                      </span>
                    </div>

                    {/* Quantity Controls & Line Total */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">
                          Bs. {Number(it.precio).toFixed(2)}
                        </span>
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 ml-1">
                          <button 
                            onClick={() => updateQuantity(it.productId, it.presId, -1)}
                            className="w-5 h-5 rounded bg-white text-slate-700 shadow-xs flex items-center justify-center font-bold text-xs active:bg-slate-200" 
                            type="button"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-800">
                            {it.cantidad}
                          </span>
                          <button 
                            onClick={() => updateQuantity(it.productId, it.presId, 1)}
                            className="w-5 h-5 rounded bg-indigo-600 text-white shadow-xs flex items-center justify-center font-bold text-xs active:bg-indigo-700" 
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-indigo-700">
                          Bs. {it.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {items.length === 0 && (
              <div className="text-center py-10 text-slate-400 space-y-1">
                <Scan className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">El carrito está vacío</p>
                <p className="text-[11px]">Escanea un producto con la cámara o selecciónalo arriba</p>
              </div>
            )}
          </div>
        </section>

        {/* Quick Checkout Bar (Bottom bar matching user's photo with green button) */}
        <footer className="bg-white border-t border-slate-200 p-3.5 pb-6 z-30 shadow-lg">
          <div className="flex items-center justify-between mb-2 px-1">
            <div>
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider block">
                Total Comprobante
              </span>
              <span className="text-xs font-bold text-slate-600">
                {count} {count === 1 ? 'unidad' : 'unidades'}
              </span>
            </div>
            <div className="text-right">
              <span className="text-xl font-extrabold text-slate-900 tracking-tight">
                Bs. {Number(total).toFixed(2)}
              </span>
            </div>
          </div>

          <button 
            onClick={handleCheckout}
            disabled={count === 0}
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-between transition-all active:scale-[0.99]" 
            type="button"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">Cobrar</span>
            </div>
            <div className="flex items-center gap-1 font-extrabold text-sm">
              <span>Bs. {Number(total).toFixed(2)}</span>
              <ChevronRight className="w-4 h-4 stroke-[3]" />
            </div>
          </button>
        </footer>

      </main>
    </div>
  );
}
