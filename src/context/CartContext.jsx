import React, { createContext, useContext, useState } from 'react';
import { playSupermarketBeep } from '../utils/audio';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [lastRemovedItem, setLastRemovedItem] = useState(null);
  const [toastMessage, setToastMessage] = useState(null);
  const [isBumping, setIsBumping] = useState(false);

  // Micro-vibration tactile feedback (15ms)
  const triggerHaptic = (pattern = 15) => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(pattern);
      } catch (e) {}
    }
  };

  const triggerBump = () => {
    setIsBumping(true);
    setTimeout(() => setIsBumping(false), 300);
  };

  const addToCart = (product, presentacion = null, qtyToAdd = 1, customDetails = null) => {
    triggerHaptic(15);
    triggerBump();
    playSupermarketBeep();

    const presId = presentacion ? presentacion.id : 'u';
    const presNombre = presentacion ? presentacion.nombre : 'Unidad';
    const precio = Number(presentacion && presentacion.precio ? presentacion.precio : product.precio_venta) || 0;

    // Generate unique key if it has specific custom details
    let uniqueKey = `${product.id}-${presId}`;
    if (customDetails) {
      if (customDetails.tipo === 'PESO') {
        uniqueKey = `peso-${product.id}-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
      } else if (customDetails.tipo === 'ROPA') {
        uniqueKey = `ropa-${product.id}-${customDetails.talla || ''}-${customDetails.color || ''}`;
      } else if (customDetails.tipo === 'HELADERIA') {
        uniqueKey = `hel-${product.id}-${(customDetails.sabores || []).join('-')}-${(customDetails.toppings || []).join('-')}`;
      }
    }

    setItems((prev) => {
      const index = prev.findIndex((i) => i.id === uniqueKey);
      if (index > -1 && !customDetails?.tipo?.includes('PESO')) {
        const updated = [...prev];
        const newQty = Math.round((updated[index].cantidad + qtyToAdd) * 1000) / 1000;
        updated[index].cantidad = newQty;
        updated[index].subtotal = Math.round(newQty * (Number(updated[index].precio) || 0) * 100) / 100;
        return updated;
      } else {
        const itemQty = Math.round(qtyToAdd * 1000) / 1000;
        return [
          ...prev,
          {
            id: uniqueKey,
            productId: product.id,
            nombre: product.nombre,
            categoria: product.categoria,
            foto_url: product.foto_url,
            codigo_barras: product.codigo_barras,
            unidad_medida: product.unidad_medida || 'Unidad',
            tipo_venta: product.tipo_venta || (customDetails?.tipo === 'PESO' ? 'PESO' : 'UNIDAD'),
            presId,
            presNombre,
            precio,
            cantidad: itemQty,
            subtotal: Math.round(precio * itemQty * 100) / 100,
            customDetails: customDetails || null,
            // Pharmacy info if available
            lote: product.lote || null,
            fecha_vencimiento: product.fecha_vencimiento || null
          }
        ];
      }
    });
  };

  const updateQuantity = (itemIdOrProdId, deltaOrPresId, maybeDelta) => {
    triggerHaptic(12);
    triggerBump();
    const deltaVal = typeof deltaOrPresId === 'number' ? deltaOrPresId : maybeDelta;
    if (deltaVal > 0) {
      playSupermarketBeep();
    }

    setItems((prev) => {
      return prev
        .map((item) => {
          let isMatch = false;
          let delta = 0;

          if (typeof deltaOrPresId === 'number') {
            // Called with (itemId, delta)
            isMatch = item.id === itemIdOrProdId || item.productId === itemIdOrProdId;
            delta = deltaOrPresId;
          } else {
            // Called with (productId, presId, delta)
            isMatch = item.productId === itemIdOrProdId && item.presId === deltaOrPresId;
            delta = maybeDelta;
          }

          if (isMatch) {
            // If item is PESO, adjust by 0.25 or delta
            const step = item.tipo_venta === 'PESO' ? (delta > 0 ? 0.25 : -0.25) : delta;
            const nuevaCantidad = Math.round((item.cantidad + step) * 1000) / 1000;
            if (nuevaCantidad <= 0) {
              setLastRemovedItem(item);
              setToastMessage(`Se quitó "${item.nombre}"`);
              return null;
            }
            return {
              ...item,
              cantidad: nuevaCantidad,
              subtotal: Math.round(nuevaCantidad * item.precio * 100) / 100
            };
          }
          return item;
        })
        .filter(Boolean);
    });
  };

  const removeFromCart = (itemIdOrProdId, presId = null) => {
    triggerHaptic([20, 50, 20]);
    const itemToRemove = items.find(
      (i) => i.id === itemIdOrProdId || (i.productId === itemIdOrProdId && (!presId || i.presId === presId))
    );
    if (itemToRemove) {
      setLastRemovedItem(itemToRemove);
      setToastMessage(`Se quitó "${itemToRemove.nombre}"`);
    }

    setItems((prev) =>
      prev.filter(
        (item) => !(item.id === itemIdOrProdId || (item.productId === itemIdOrProdId && (!presId || item.presId === presId)))
      )
    );
  };

  const undoRemove = () => {
    if (lastRemovedItem) {
      triggerHaptic(25);
      triggerBump();
      setItems((prev) => [...prev, lastRemovedItem]);
      setLastRemovedItem(null);
      setToastMessage(null);
    }
  };

  const dismissToast = () => {
    setToastMessage(null);
    setLastRemovedItem(null);
  };

  const clearCart = () => {
    if (items.length > 0) {
      triggerHaptic([30, 60, 30]);
    }
    setItems([]);
  };

  const total = items.reduce((acc, curr) => acc + (Number(curr.subtotal) || 0), 0);
  const count = items.reduce((acc, curr) => acc + (Number(curr.cantidad) || 0), 0);

  return (
    <CartContext.Provider
      value={{
        items,
        addToCart,
        updateQuantity,
        removeFromCart,
        undoRemove,
        dismissToast,
        toastMessage,
        lastRemovedItem,
        isBumping,
        clearCart,
        triggerHaptic,
        total,
        count
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
