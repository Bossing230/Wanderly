import { useCallback, useEffect, useMemo, useState } from 'react';
import { searchDestinations } from '../services/destinationService';
import { addFavorite, listFavorites, removeFavorite } from '../services/favoriteService';
import { errMsg } from '../services/api';
import { addrText, destId } from '../utils';

export function useDestinations() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const search = useCallback(async (q, params) => {
    setLoading(true); setError('');
    try { setResults(await searchDestinations(q, params)); setSearched(true); }
    catch (e) { setError(errMsg(e)); setResults([]); }
    finally { setLoading(false); }
  }, []);
  return { results, loading, error, searched, search };
}

export function useFavorites() {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setFavorites(await listFavorites()); } catch (e) { setError(errMsg(e)); } finally { setLoading(false); }
  }, []);
  useEffect(() => { load(); }, [load]);
  const ids = useMemo(() => new Set(favorites.map((f) => f.externalId)), [favorites]);
  // Returns true when saved, false when removed.
  const toggle = async (d) => {
    const id = destId(d);
    const existing = favorites.find((f) => f.externalId === id);
    if (existing) { await removeFavorite(existing._id); setFavorites((f) => f.filter((x) => x._id !== existing._id)); return false; }
    const created = await addFavorite({ externalId: id, name: d.name, category: d.category, address: addrText(d), lat: d.lat, lon: d.lon });
    setFavorites((f) => [created, ...f]);
    return true;
  };
  return { favorites, setFavorites, ids, loading, error, reload: load, toggle };
}
