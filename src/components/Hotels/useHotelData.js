import { useCallback, useEffect, useMemo, useState } from 'react';
import { db } from '../../db/dexie';
import { hotelService, onHotelChange } from '../../services/hotelService';
import { simbolo } from '../../utils/currency';

// Datos en vivo del hotel: se recargan cuando cambia una reserva, habitación o limpieza
export function useHotelData() {
  const [tipos, setTipos] = useState([]);
  const [habitaciones, setHabitaciones] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    await hotelService.ensureSeed();
    const [t, h, r] = await Promise.all([db.hab_tipos.toArray(), db.habitaciones.toArray(), db.reservas.toArray()]);
    setTipos(t);
    setHabitaciones(h.sort((a, b) => (a.piso - b.piso) || String(a.numero).localeCompare(String(b.numero), 'es', { numeric: true })));
    setReservas(r.sort((a, b) => a.llegada.localeCompare(b.llegada)));
    setLoading(false);
  }, []);

  useEffect(() => {
    reload();
    const off = onHotelChange(reload);
    const timer = setInterval(reload, 60000);
    return () => {
      off();
      clearInterval(timer);
    };
  }, [reload]);

  const tiposById = useMemo(() => Object.fromEntries(tipos.map(t => [t.id, t])), [tipos]);
  const habById = useMemo(() => Object.fromEntries(habitaciones.map(h => [h.id, h])), [habitaciones]);
  const reservasById = useMemo(() => Object.fromEntries(reservas.map(r => [r.id, r])), [reservas]);

  return { tipos, habitaciones, reservas, tiposById, habById, reservasById, loading, reload };
}

export const money = (n) => `${simbolo()} ${(Number(n) || 0).toFixed(2)}`;
