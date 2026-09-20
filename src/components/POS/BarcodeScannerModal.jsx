import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, Volume2, VolumeX, Zap, Camera, Scan, Trash2, 
  Minus, Plus, ChevronRight, CheckCircle2, AlertTriangle, RefreshCw, ShieldAlert,
  SwitchCamera, Image as ImageIcon
} from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { useCart } from '../../context/CartContext';
import { db } from '../../db/dexie';

export default function BarcodeScannerModal({ isOpen, onClose, onOpenCheckout }) {
  const { items, total, count, updateQuantity, removeFromCart, clearCart, addToCart } = useCart();
  
  const scannerRef = useRef(null);
  const fileInputRef = useRef(null);
  const lastScanTimeRef = useRef(0);
  const lastScanCodeRef = useRef('');

  const [soundEnabled, setSoundEnabled] = useState(true);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [torchSupported, setTorchSupported] = useState(false);
  const [availableCameras, setAvailableCameras] = useState([]);
  const [currentCameraIndex, setCurrentCameraIndex] = useState(0);
  const [activeCameraLabel, setActiveCameraLabel] = useState('');
  const [manualCode, setManualCode] = useState('');
  const [lastDetected, setLastDetected] = useState(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Reproducir sonido beep al detectar código
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.value = 1800;
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.15);
    } catch (e) {
      // Audio context no soportado
    }
  };

  // Forzar purga de caché PWA en el celular
  const handleForceCachePurge = async () => {
    try {
      if ('caches' in window) {
        const names = await caches.keys();
        for (const name of names) await caches.delete(name);
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      window.location.href = window.location.origin + '?clear=1&t=' + Date.now();
    } catch (e) {
      window.location.reload();
    }
  };

  // Inicializar escáner con html5-qrcode
  const startScanner = async (forcedCameraId = null) => {
    setCameraError(null);
    setIsInitializing(true);
    setCameraActive(false);

    try {
      // Limpiar escáner previo si existía
      if (scannerRef.current) {
        try {
          if (scannerRef.current.isScanning) {
            await scannerRef.current.stop();
          }
          scannerRef.current.clear();
        } catch (e) {}
        scannerRef.current = null;
      }

      // Esperar a que el DOM tenga el elemento listo
      await new Promise(r => setTimeout(r, 100));

      const element = document.getElementById('glorypos-barcode-reader');
      if (!element) {
        setIsInitializing(false);
        return;
      }

      // 1. Obtener lista de cámaras disponibles
      let cameras = [];
      try {
        cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setAvailableCameras(cameras);
        }
      } catch (e) {
        console.warn('[BarcodeScanner] No se pudo enumerar cámaras:', e);
      }

      // 2. Determinar configuración de cámara (buscar trasera principal)
      let cameraConfig = { facingMode: 'environment' };

      if (forcedCameraId) {
        cameraConfig = forcedCameraId;
        const matched = cameras.find(c => c.id === forcedCameraId);
        if (matched) setActiveCameraLabel(matched.label || 'Lente seleccionado');
      } else if (cameras && cameras.length > 0) {
        const rearCamera = cameras.find(c => 
          /back|rear|environment|trasera|posterior/i.test(c.label) &&
          !/wide|ultra|macro|depth|0/i.test(c.label)
        ) || cameras.find(c => /back|rear|environment|trasera|posterior/i.test(c.label))
          || cameras[cameras.length - 1];

        if (rearCamera && rearCamera.id) {
          cameraConfig = rearCamera.id;
          setActiveCameraLabel(rearCamera.label || 'Cámara Trasera Principal');
          const idx = cameras.findIndex(c => c.id === rearCamera.id);
          if (idx !== -1) setCurrentCameraIndex(idx);
        }
      }

      // 3. Instanciar Html5Qrcode
      const formatsToSupport = [
        Html5QrcodeSupportedFormats.EAN_13,
        Html5QrcodeSupportedFormats.EAN_8,
        Html5QrcodeSupportedFormats.CODE_128,
        Html5QrcodeSupportedFormats.CODE_39,
        Html5QrcodeSupportedFormats.UPC_A,
        Html5QrcodeSupportedFormats.UPC_E,
        Html5QrcodeSupportedFormats.QR_CODE,
      ];

      const html5QrCode = new Html5Qrcode('glorypos-barcode-reader', {
        formatsToSupport,
        verbose: false,
        experimentalFeatures: {
          useBarCodeDetectorIfSupported: true // GPU acceleration
        }
      });

      scannerRef.current = html5QrCode;

      const scanConfig = {
        fps: 20,
        qrbox: (viewfinderWidth, viewfinderHeight) => {
          const width = Math.floor(viewfinderWidth * 0.88);
          const height = Math.floor(Math.min(viewfinderHeight * 0.55, 160));
          return { width, height };
        },
        aspectRatio: 1.777778
      };

      // 4. Iniciar cámara con fallback si un lente específico da error
      try {
        await html5QrCode.start(
          cameraConfig,
          scanConfig,
          (decodedText) => handleDecodedBarcode(decodedText),
          () => {}
        );
      } catch (errFirst) {
        console.warn('[BarcodeScanner] Primer intento falló, reintentando con facingMode:', errFirst);
        await html5QrCode.start(
          { facingMode: 'environment' },
          scanConfig,
          (decodedText) => handleDecodedBarcode(decodedText),
          () => {}
        );
      }

      setCameraActive(true);
      setCameraError(null);

      // Comprobar soporte de linterna (flash)
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities();
        if (capabilities && capabilities.torch) {
          setTorchSupported(true);
        }
      } catch (e) {
        setTorchSupported(false);
      }

    } catch (err) {
      console.warn('[BarcodeScanner] Error al iniciar cámara:', err);
      if (err.name === 'NotAllowedError' || String(err).includes('Permission denied')) {
        setCameraError('permission_denied');
      } else if (err.name === 'NotFoundError' || String(err).includes('NotFound')) {
        setCameraError('not_found');
      } else {
        setCameraError('general');
      }
      setCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  };

  // Alternar entre cámaras disponibles
  const handleSwitchCamera = () => {
    if (availableCameras.length <= 1) return;
    const nextIdx = (currentCameraIndex + 1) % availableCameras.length;
    setCurrentCameraIndex(nextIdx);
    startScanner(availableCameras[nextIdx].id);
  };

  // Escaneo alternativo con foto / cámara nativa
  const handleScanFromPhoto = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      let qrInstance = scannerRef.current;
      if (!qrInstance) {
        qrInstance = new Html5Qrcode('glorypos-barcode-reader', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.QR_CODE
          ]
        });
      }
      const decodedText = await qrInstance.scanFile(file, true);
      if (decodedText) {
        handleDecodedBarcode(decodedText);
      }
    } catch (err) {
      alert('No se detectó un código de barras claro en la foto. Intenta con mejor iluminación.');
    }
  };

  // Detener y limpiar escáner
  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        if (scannerRef.current.isScanning) {
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (err) {
        console.warn('[BarcodeScanner] Error al detener:', err);
      }
      scannerRef.current = null;
    }
    setCameraActive(false);
    setTorchEnabled(false);
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
    } else {
      stopScanner();
    }

    return () => {
      stopScanner();
    };
  }, [isOpen]);

  // Alternar Linterna
  const toggleTorch = async () => {
    if (!scannerRef.current || !torchSupported) return;
    try {
      const next = !torchEnabled;
      await scannerRef.current.applyVideoConstraints({
        advanced: [{ torch: next }]
      });
      setTorchEnabled(next);
    } catch (err) {
      console.warn('Error al activar linterna:', err);
    }
  };

  // Manejo de código detectado con debounce
  const handleDecodedBarcode = (code) => {
    if (!code) return;
    const clean = String(code).trim();
    const now = Date.now();

    if (clean === lastScanCodeRef.current && now - lastScanTimeRef.current < 1800) {
      return;
    }

    lastScanCodeRef.current = clean;
    lastScanTimeRef.current = now;

    if (navigator.vibrate) {
      try { navigator.vibrate(80); } catch (e) {}
    }

    handleScanCode(clean);
  };

  // Procesar búsqueda en inventario
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
      const master = await db.catalogo_maestro.where('codigo_barras').equals(cleanCode).first();
      if (master) {
        const newShopProd = {
          id: `prod-${Date.now()}`,
          maestro_id: master.id,
          codigo_barras: master.codigo_barras,
          nombre: master.nombre,
          categoria: master.categoria,
          unidad_medida: master.unidad_medida,
          foto_url: master.foto_url,
          precio_venta: master.precio_sugerido || 10,
          precio_compra: (master.precio_sugerido || 10) * 0.8,
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
        alert(`Código "${cleanCode}" no encontrado en inventario.`);
      }
    }
  };

  const handleCheckout = () => {
    onClose();
    if (onOpenCheckout) {
      onOpenCheckout();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950 flex justify-center animate-fadeIn">
      
      {/* Input oculto para escaneo por foto de cámara nativa */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={handleScanFromPhoto}
      />

      {/* Reglas CSS estrictas para renderizado de video en Android */}
      <style>{`
        #glorypos-barcode-reader {
          width: 100% !important;
          height: 100% !important;
          position: absolute !important;
          inset: 0 !important;
          background: #020617 !important;
          overflow: hidden !important;
        }
        #glorypos-barcode-reader video {
          width: 100% !important;
          height: 100% !important;
          object-fit: cover !important;
          display: block !important;
        }
        #glorypos-barcode-reader canvas {
          display: none !important;
        }
        #glorypos-barcode-reader #qr-shaded-region {
          display: none !important;
        }
      `}</style>

      {/* Frame Móvil */}
      <main className="w-full max-w-md bg-slate-50 flex flex-col h-screen overflow-hidden shadow-2xl relative border-x border-slate-200">
        
        {/* Barra Superior con indicador de versión v4.0 para confirmar que no sea caché viejo */}
        <section className="bg-slate-900 text-white px-3.5 py-2.5 flex items-center justify-between border-b border-slate-800 z-30 shadow-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <button 
              onClick={onClose}
              aria-label="Volver al punto de venta" 
              className="w-9 h-9 rounded-xl bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 transition-colors active:scale-95 cursor-pointer" 
              type="button"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <div>
              <div className="flex items-center gap-1.5">
                <span className={`inline-block w-2 h-2 rounded-full ${cameraActive ? 'bg-emerald-400 animate-ping' : 'bg-amber-400'}`}></span>
                <h1 className="font-bold text-sm tracking-tight leading-tight">Lector de Códigos</h1>
                <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  v4.0
                </span>
              </div>
              <p className="text-[10px] text-slate-400 font-medium truncate max-w-[160px]">
                {activeCameraLabel || 'GLORYPOS Móvil'}
              </p>
            </div>
          </div>

          {/* Botones de Control */}
          <div className="flex items-center gap-1">
            
            {/* Cambiar Lente si hay más de 1 cámara */}
            {availableCameras.length > 1 && (
              <button
                onClick={handleSwitchCamera}
                title="Cambiar de lente de cámara"
                className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-sky-400 border border-slate-700 flex items-center justify-center transition cursor-pointer"
                type="button"
              >
                <SwitchCamera className="w-4 h-4" />
              </button>
            )}

            {/* Escanear por Foto / Cámara Nativa */}
            <button
              onClick={() => fileInputRef.current?.click()}
              title="Tomar foto con cámara del celular"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-amber-400 border border-slate-700 flex items-center justify-center transition cursor-pointer"
              type="button"
            >
              <Camera className="w-4 h-4" />
            </button>

            {/* Linterna */}
            {torchSupported && (
              <button 
                onClick={toggleTorch}
                title="Linterna" 
                className={`w-8 h-8 rounded-xl flex items-center justify-center border transition-colors cursor-pointer ${
                  torchEnabled 
                    ? 'bg-amber-400 text-slate-950 border-amber-300 shadow-md' 
                    : 'bg-slate-800 text-slate-400 border-slate-700'
                }`}
                type="button"
              >
                <Zap className="w-4 h-4 fill-current" />
              </button>
            )}

            {/* Recargar / Limpiar Caché */}
            <button 
              onClick={() => startScanner()}
              title="Recargar cámara"
              className="w-8 h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center justify-center transition cursor-pointer"
              type="button"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isInitializing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
          </div>
        </section>

        {/* Visor de Cámara con altura fija explícita para evitar colapso a 0px en flexbox */}
        <section 
          style={{ height: '280px', minHeight: '280px' }}
          className="relative w-full shrink-0 overflow-hidden select-none bg-slate-950"
        >
          {/* Contenedor del video real */}
          <div id="glorypos-barcode-reader"></div>

          {/* Loader */}
          {isInitializing && (
            <div className="absolute inset-0 z-20 bg-slate-950/90 flex flex-col items-center justify-center text-white space-y-2">
              <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-xs text-slate-300 font-mono">Conectando sensor de cámara...</p>
            </div>
          )}

          {/* Mensaje de Error si la cámara está bloqueada */}
          {cameraError && (
            <div className="absolute inset-0 z-20 bg-slate-950/95 p-4 flex flex-col items-center justify-center text-center space-y-2">
              <ShieldAlert className="w-8 h-8 text-amber-400" />
              <h3 className="text-xs font-bold text-white">
                {cameraError === 'permission_denied' && 'Permiso de Cámara Denegado'}
                {cameraError === 'not_found' && 'No se detectó cámara trasera'}
                {cameraError === 'general' && 'No se pudo activar el visor'}
              </h3>
              <p className="text-[11px] text-slate-300 max-w-xs leading-relaxed">
                Toca el ícono del candado 🔒 en la barra de tu navegador para dar permiso de cámara, o usa el botón de tomar foto.
              </p>
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => startScanner()}
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Reintentar</span>
                </button>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Tomar Foto</span>
                </button>
              </div>
            </div>
          )}

          {/* Helper Superior */}
          <div className="absolute top-3 left-3 right-3 z-20 flex justify-between items-center pointer-events-none">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-950/80 backdrop-blur-md border border-slate-700/60 text-[11px] font-semibold text-emerald-300 shadow-lg">
              <Scan className="w-3.5 h-3.5 animate-pulse text-emerald-400" />
              <span>Apunta la línea al código</span>
            </span>

            {/* Simulación rápida en caso de pruebas */}
            <div className="flex gap-1 pointer-events-auto">
              <button 
                onClick={() => handleScanCode('7771234000018')}
                className="px-2 py-0.5 bg-slate-900/80 text-white hover:bg-emerald-600 rounded text-[10px] font-bold border border-white/20 transition cursor-pointer"
              >
                + Coca
              </button>
              <button 
                onClick={() => handleScanCode('7771234000032')}
                className="px-2 py-0.5 bg-slate-900/80 text-white hover:bg-emerald-600 rounded text-[10px] font-bold border border-white/20 transition cursor-pointer"
              >
                + Paceña
              </button>
            </div>
          </div>

          {/* Retícula Central con Esquinas y Línea Láser */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <div className="relative w-64 max-w-[88%] h-28 flex items-center justify-center">
              <div className="absolute top-0 left-0 w-7 h-7 border-t-4 border-l-4 border-emerald-400 rounded-tl-lg shadow-[0_0_10px_#34d399]"></div>
              <div className="absolute top-0 right-0 w-7 h-7 border-t-4 border-r-4 border-emerald-400 rounded-tr-lg shadow-[0_0_10px_#34d399]"></div>
              <div className="absolute bottom-0 left-0 w-7 h-7 border-b-4 border-l-4 border-emerald-400 rounded-bl-lg shadow-[0_0_10px_#34d399]"></div>
              <div className="absolute bottom-0 right-0 w-7 h-7 border-b-4 border-r-4 border-emerald-400 rounded-br-lg shadow-[0_0_10px_#34d399]"></div>

              <div className="absolute left-1 right-1 h-0.5 bg-gradient-to-r from-transparent via-emerald-400 to-transparent shadow-[0_0_14px_#10b981] animate-pulse"></div>

              {lastDetected && (
                <div className="absolute -bottom-3 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold px-3 py-1 rounded-full text-[10px] tracking-wider uppercase flex items-center gap-1.5 shadow-xl animate-bounce border border-white/30">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  <span className="truncate max-w-[200px]">{lastDetected.nombre}</span>
                </div>
              )}
            </div>
          </div>

          {/* Barra de Ingreso Manual */}
          <div className="absolute bottom-2 left-2 right-2 z-20">
            <form 
              onSubmit={(e) => { e.preventDefault(); handleScanCode(manualCode); }}
              className="flex gap-1.5 bg-slate-900/95 backdrop-blur-md p-1.5 rounded-xl border border-slate-700/70 shadow-lg"
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
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg transition-all flex items-center gap-1 active:scale-95 shrink-0 shadow-xs cursor-pointer"
              >
                <span>Agregar</span>
              </button>
            </form>
          </div>
        </section>

        {/* Botón de Purga de Caché si el celular tiene versión antigua */}
        <div className="bg-slate-100 px-4 py-1 flex items-center justify-between border-b border-slate-200 text-[10px] text-slate-500">
          <span>¿No ves la cámara?</span>
          <button
            type="button"
            onClick={handleForceCachePurge}
            className="text-emerald-700 font-bold hover:underline flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className="w-3 h-3" />
            <span>Limpiar caché PWA</span>
          </button>
        </div>

        {/* Hoja Inferior: Productos en Carrito */}
        <section className="flex-1 bg-slate-50 flex flex-col min-h-0 overflow-hidden shadow-lg border-t border-slate-200">
          <div className="w-10 h-1 bg-slate-300 rounded-full mx-auto mt-2 mb-1"></div>

          <div className="px-4 py-2 flex items-center justify-between border-b border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Productos en Carrito
              </h2>
              <span className="inline-flex items-center justify-center bg-emerald-100 text-emerald-800 text-[11px] font-bold px-2 py-0.5 rounded-full">
                {count} {count === 1 ? 'ítem' : 'ítems'}
              </span>
            </div>

            {items.length > 0 && (
              <button 
                onClick={clearCart}
                className="text-[11px] font-semibold text-rose-600 hover:text-rose-700 active:underline flex items-center gap-1 cursor-pointer" 
                type="button"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Vaciar
              </button>
            )}
          </div>

          {/* Lista de productos escaneados */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2 no-scrollbar">
            {items.map((it, idx) => (
              <article 
                key={`${it.productId}-${it.presId}`}
                className="bg-white border border-slate-200 rounded-xl p-3 shadow-xs hover:border-emerald-300 transition-all relative"
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
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        {it.presNombre}
                      </span>
                    </div>

                    {/* Controles de Cantidad */}
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-slate-500">
                          Bs. {Number(it.precio).toFixed(2)}
                        </span>
                        <div className="flex items-center bg-slate-100 rounded-lg p-0.5 border border-slate-200 ml-1">
                          <button 
                            onClick={() => updateQuantity(it.productId, it.presId, -1)}
                            className="w-5 h-5 rounded bg-white text-slate-700 shadow-xs flex items-center justify-center font-bold text-xs active:bg-slate-200 cursor-pointer" 
                            type="button"
                          >
                            -
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-slate-800">
                            {it.cantidad}
                          </span>
                          <button 
                            onClick={() => updateQuantity(it.productId, it.presId, 1)}
                            className="w-5 h-5 rounded bg-emerald-600 text-white shadow-xs flex items-center justify-center font-bold text-xs active:bg-emerald-700 cursor-pointer" 
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-extrabold text-emerald-700">
                          Bs. {it.subtotal.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            ))}

            {items.length === 0 && (
              <div className="text-center py-8 text-slate-400 space-y-1">
                <Scan className="w-8 h-8 mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">El carrito está vacío</p>
                <p className="text-[11px]">Apunta la cámara al código de barras del producto</p>
              </div>
            )}
          </div>
        </section>

        {/* Barra de Cobro Inferior */}
        <footer className="bg-white border-t border-slate-200 p-3.5 pb-6 z-30 shadow-lg shrink-0">
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
            className="w-full bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:opacity-50 text-white font-extrabold py-3.5 px-4 rounded-xl shadow-lg shadow-emerald-600/30 flex items-center justify-between transition-all active:scale-[0.99] cursor-pointer" 
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
