import { useCallback, useEffect, useState } from 'react';
import { createTrip, deleteTrip, listTrips, updateTrip } from '../services/tripService';
import { errMsg } from '../services/api';

export function useTrips(params) {
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const key = JSON.stringify(params || {});
  const reload = useCallback(async () => {
    setLoading(true); setError('');
    try { setTrips(await listTrips(JSON.parse(key))); } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, [key]);
  useEffect(() => { reload(); }, [reload]);
  return {
    trips, loading, error, reload,
    create: async (d) => { const t = await createTrip(d); await reload(); return t; },
    update: async (id, d) => { const t = await updateTrip(id, d); await reload(); return t; },
    remove: async (id) => { await deleteTrip(id); setTrips((t) => t.filter((x) => x._id !== id)); },
  };
}
