import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../../db/dexie';
import { restaurantService, onGlorychefChange } from '../../services/restaurantService';

// Datos en vivo de GLORYCHEF: se recargan cuando cambia una mesa, comanda o la cocina
// (en esta pestaña o en otra del mismo navegador, ej. la pantalla de cocina).
export function useGlorychefData({ includeCerradas = false } = {}) {
  const [salones, setSalones] = useState([]);
  const [mesas, setMesas] = useState([]);
  const [comandas, setComandas] = useState([]);
  const [productos, setProductos] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    await restaurantService.ensureSeed();
    const [s, m, c, p] = await Promise.all([
      restaurantService.listSalones(),
      restaurantService.listMesas(),
      includeCerradas ? db.comandas.toArray() : restaurantService.listComandasAbiertas(),
      db.productos_tienda.toArray(),
    ]);
    setSalones(s);
    setMesas(m);
    setComandas(c.sort((a, b) => (b.numero || 0) - (a.numero || 0)));
    setProductos(p);
    setLoading(false);
  }, [includeCerradas]);

  useEffect(() => {
    reload();
    const off = onGlorychefChange(() => reload());
    // Refresco periódico para los cronómetros y cambios desde la nube
    const timer = setInterval(reload, 30000);
    return () => {
      off();
      clearInterval(timer);
    };
  }, [reload]);

  const productosById = useMemo(() => Object.fromEntries(productos.map(p => [p.id, p])), [productos]);
  const comandasById = useMemo(() => Object.fromEntries(comandas.map(c => [c.id, c])), [comandas]);

  return { salones, mesas, comandas, productos, productosById, comandasById, loading, reload };
}

export function minutosDesde(iso) {
  if (!iso) return 0;
  return Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 60000));
}

export function formatMinutos(min) {
  if (min < 60) return `${min} min`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

export const money = (n) => `Bs. ${(Number(n) || 0).toFixed(2)}`;
