import { useEffect, useRef } from 'react';
import { db } from '../db/dexie';
import { useCart } from '../context/CartContext';
import { playSupermarketBeep, playErrorBeep } from '../utils/audio';

export function useBarcodeGunScanner({ onBarcodeScanned } = {}) {
  const { addToCart, triggerHaptic } = useCart();
  const bufferRef = useRef('');
  const lastTimeRef = useRef(0);
  const timingHistoryRef = useRef([]);

  useEffect(() => {
    const handleKeyDown = async (e) => {
      // Ignore functional modifier keys (Ctrl, Alt, Meta, Shift alone)
      if (['Shift', 'Control', 'Alt', 'Meta', 'CapsLock', 'Tab'].includes(e.key)) {
        return;
      }

      const now = Date.now();
      const delta = now - lastTimeRef.current;
      lastTimeRef.current = now;

      // Enter key marks the end of a barcode scanner sequence
      if (e.key === 'Enter') {
        const barcode = bufferRef.current.trim();
        const timings = timingHistoryRef.current;

        // Calculate average time between strokes
        const avgTiming = timings.length > 0
          ? timings.reduce((a, b) => a + b, 0) / timings.length
          : 999;

        // Reset buffers
        bufferRef.current = '';
        timingHistoryRef.current = [];

        // Check if input came from a high-speed scanner gun (typically avg < 50ms)
        // or has at least 4 characters
        if (barcode.length >= 4 && avgTiming < 65) {
          e.preventDefault();
          e.stopPropagation();

          try {
            // 1. Search in store inventory
            let prod = await db.productos_tienda.where('codigo_barras').equals(barcode).first();

            if (prod) {
              playSupermarketBeep();
              triggerHaptic(25);
              addToCart(prod);
              if (onBarcodeScanned) {
                onBarcodeScanned(prod, barcode);
              }
              return;
            }

            // 2. Search in master catalog if not in store
            const masterProd = await db.catalogo_maestro.where('codigo_barras').equals(barcode).first();
            if (masterProd) {
              // Automatically register in store and add to cart
              const newShopProd = {
                ...masterProd,
                id: `prod-${Date.now()}`,
                maestro_id: masterProd.id,
                stock_actual: 20,
                stock_minimo: 3,
                activo: true
              };
              await db.productos_tienda.add(newShopProd);
              playSupermarketBeep();
              triggerHaptic(25);
              addToCart(newShopProd);
              if (onBarcodeScanned) {
                onBarcodeScanned(newShopProd, barcode);
              }
              return;
            }

            // Not found
            playErrorBeep();
            triggerHaptic([40, 80, 40]);
            console.warn(`Código de barras ${barcode} no encontrado en la base de datos.`);
          } catch (err) {
            console.error('Error procesando escaneo de código de barras:', err);
          }
        }
        return;
      }

      // If key is a printable character (length 1)
      if (e.key.length === 1) {
        // If typing interval is longer than 60ms, reset buffer (it's human typing)
        if (delta > 60) {
          bufferRef.current = e.key;
          timingHistoryRef.current = [];
        } else {
          bufferRef.current += e.key;
          timingHistoryRef.current.push(delta);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, { capture: true });
    return () => window.removeEventListener('keydown', handleKeyDown, { capture: true });
  }, [addToCart, triggerHaptic, onBarcodeScanned]);
}
