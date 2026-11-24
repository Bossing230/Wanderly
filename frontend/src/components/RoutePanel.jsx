import { useState } from 'react';
import { Navigation, Plus, Route as RouteIcon, X } from 'lucide-react';
import SearchBar from './SearchBar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { useToast } from './ui.jsx';
import { getRoute } from '../services/destinationService';
import { errMsg } from '../services/api';
import { fmtDist, fmtDur } from '../utils';

// stops: [{ name, lat, lon } | null]; parent owns the list so the map can show the stops.
export default function RoutePanel({ stops, setStops, onRoute }) {
  const { user, units } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(user?.preferences?.defaultTravelMode || 'driving-car');
  const [route, setRoute] = useState(null);
  const [busy, setBusy] = useState(false);

  const setStop = (i, v) => setStops(stops.map((s, j) => (j === i ? v : s)));
  const calc = async () => {
    const pts = stops.filter(Boolean);
    if (pts.length < 2) return toast.error('Pick at least a start and a destination');
    setBusy(true);
    try { const r = await getRoute(pts, profile); setRoute(r); onRoute?.(r); toast.success('Route calculated'); }
    catch (e) { toast.error(errMsg(e)); }
    finally { setBusy(false); }
  };
  const labels = (i) => (i === 0 ? 'Start' : i === stops.length - 1 ? 'Destination' : `Stop ${i}`);

  return (
    <div className="card space-y-4 p-5">
      {stops.map((s, i) => (
        <div key={i}>
          <div className="mb-1.5 flex items-center justify-between text-sm font-medium">
            <span>{labels(i)}{s && <span className="ml-2 font-normal text-sea">{s.name}</span>}</span>
            {stops.length > 2 && <button onClick={() => setStops(stops.filter((_, j) => j !== i))} aria-label={`Remove ${labels(i)}`}><X size={16} className="text-muted" /></button>}
          </div>
          <SearchBar placeholder={`Search ${labels(i).toLowerCase()}…`} onSelect={(d) => setStop(i, { name: d.name, lat: d.lat, lon: d.lon, category: d.category })} />
        </div>
      ))}
      {stops.length < 8 && <button className="btn-ghost w-full" onClick={() => setStops([...stops.slice(0, -1), null, stops[stops.length - 1]])}><Plus size={16} /> Add a stop</button>}
      <div>
        <label className="label" htmlFor="profile">Travel mode</label>
        <select id="profile" className="input" value={profile} onChange={(e) => setProfile(e.target.value)}>
          <option value="driving-car">Driving</option><option value="cycling-regular">Cycling</option><option value="foot-walking">Walking</option>
        </select>
      </div>
      <button className="btn-primary w-full" onClick={calc} disabled={busy}><Navigation size={16} />{busy ? 'Calculating…' : 'Get route'}</button>
      {route && (
        <div className="rounded-xl bg-sea/10 p-4">
          <div className="flex items-center gap-2 font-display text-2xl font-bold"><RouteIcon size={22} className="text-sea" />{fmtDist(route.distanceKm, units)} · {fmtDur(route.durationMin)}</div>
          {route.segments.length > 1 && (
            <ul className="mt-3 space-y-1 text-sm text-muted">
              {route.segments.map((s, i) => <li key={i}>Leg {i + 1}: {fmtDist(s.distanceKm, units)}, {fmtDur(s.durationMin)}</li>)}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
