import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Heart, MapPin, Navigation, Plus, Save } from 'lucide-react';
import DestinationMap from '../components/DestinationMap.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import AddToTripModal from '../components/AddToTripModal.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import { Badge, ErrorState, Skeleton, useToast } from '../components/ui.jsx';
import { useFavorites } from '../hooks/useDestinations';
import { getCategories, nearbyPlaces, reverseGeocode } from '../services/destinationService';
import { addFavorite, updateFavorite } from '../services/favoriteService';
import { errMsg } from '../services/api';
import { destId, parseDest, prettyCat } from '../utils';

// Cities and towns need a wide view; buildings, parks and other landmarks are shown close up.
const zoomFor = (cat = '') => (/city|town|village|municipality|administrative|suburb|county|state|island|bay/.test(cat) ? 12 : 16);

export default function DestinationDetails() {
  const [sp] = useSearchParams();
  const nav = useNavigate();
  const toast = useToast();
  const base = useMemo(() => parseDest(sp), [sp]);
  const [d, setD] = useState(base);
  const { favorites, setFavorites, toggle } = useFavorites();
  const [cats, setCats] = useState(['all']);
  const [cat, setCat] = useState('all');
  const [near, setNear] = useState(null);
  const [nearErr, setNearErr] = useState('');
  const [note, setNote] = useState('');
  const [tripOpen, setTripOpen] = useState(false);
  const [wide, setWide] = useState(false); // false = zoomed in on the place, true = show nearby attractions
  const id = destId(base);
  const fav = favorites.find((f) => f.externalId === id);

  const valid = Number.isFinite(base.lat) && Number.isFinite(base.lon) && base.name;
  useEffect(() => { setWide(false); }, [id]);
  useEffect(() => { setD(base); if (valid && !base.displayName) reverseGeocode(base.lat, base.lon).then((r) => r && setD({ ...base, displayName: r.displayName })).catch(() => {}); }, [base, valid]);
  useEffect(() => { getCategories().then((c) => setCats(c)).catch(() => {}); }, []);
  useEffect(() => { setNote(fav?.notes || ''); }, [fav?.notes, fav?._id]);
  useEffect(() => {
    if (!valid) return;
    setNear(null); setNearErr('');
    nearbyPlaces(base.lat, base.lon, { category: cat, radius: 15000, limit: 12 }).then(setNear).catch((e) => { setNearErr(errMsg(e)); setNear([]); });
  }, [base, cat, valid]);

  if (!valid) return <ErrorState message="This destination link is incomplete. Search for it again." onRetry={() => nav('/explore')} />;

  const onFav = async () => { try { toast.success((await toggle(d)) ? 'Saved to favorites' : 'Removed from favorites'); } catch (e) { toast.error(errMsg(e)); } };
  const saveNote = async () => {
    try {
      if (fav) { const u = await updateFavorite(fav._id, { notes: note, collectionName: fav.collectionName }); setFavorites((l) => l.map((x) => (x._id === u._id ? u : x))); }
      else { const c = await addFavorite({ externalId: id, name: d.name, category: d.category, address: d.displayName, lat: d.lat, lon: d.lon, notes: note }); setFavorites((l) => [c, ...l]); }
      toast.success('Notes saved');
    } catch (e) { toast.error(errMsg(e)); }
  };
  const markers = [{ ...d, id, kind: 'destination' }, ...(near || []).map((p) => ({ ...p, id: destId(p), kind: 'attraction' }))];
  const zoom = zoomFor(d.category);

  return (
    <>
      <Link to="/explore" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-sea"><ArrowLeft size={16} /> Back to explore</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold">{d.name}</h1>
          <p className="mt-1 flex items-start gap-1.5 text-muted"><MapPin size={16} className="mt-1 shrink-0" />{d.displayName || 'Finding address…'}</p>
          <div className="mt-2 flex items-center gap-2"><Badge>{prettyCat(d.category)}</Badge><span className="text-sm text-muted">{d.lat.toFixed(4)}, {d.lon.toFixed(4)}</span></div>
        </div>
        <div className="flex flex-wrap gap-2">
          <button className={fav ? 'btn-ghost' : 'btn-primary'} onClick={onFav}><Heart size={16} className={fav ? 'fill-coral text-coral' : ''} />{fav ? 'Saved' : 'Add to favorites'}</button>
          <button className="btn-ghost" onClick={() => setTripOpen(true)}><Plus size={16} /> Add to trip</button>
          <Link className="btn-ghost" to={`/routes?${new URLSearchParams({ toName: d.name, toLat: d.lat, toLon: d.lon })}`}><Navigation size={16} /> Plan route</Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="relative">
            <DestinationMap
              key={wide ? 'wide' : 'close'}
              markers={markers} selectedId={id}
              center={[d.lat, d.lon]} zoom={zoom}
              flyTo={wide ? undefined : [d.lat, d.lon]} flyZoom={zoom}
              bounds={wide && markers.length > 1 ? markers.map((m) => [m.lat, m.lon]) : undefined}
              className="h-[380px]"
            />
            <button onClick={() => setWide((w) => !w)} className="btn-ghost absolute right-3 top-3 z-[500] px-3 py-1.5 text-xs shadow">
              {wide ? 'Zoom to this place' : 'Show nearby attractions'}
            </button>
          </div>
          <section>
            <h2 className="mb-3 text-xl font-bold">Nearby attractions</h2>
            <div className="mb-4"><FilterPanel categories={cats} category={cat} setCategory={setCat} /></div>
            {nearErr && <ErrorState message={nearErr} />}
            {!near ? <div className="grid gap-4 sm:grid-cols-2"><Skeleton className="h-56" /><Skeleton className="h-56" /></div> :
              near.length === 0 && !nearErr ? <p className="text-sm text-muted">No attractions found within 15 km for this category.</p> :
              <div className="grid gap-4 sm:grid-cols-2">{near.map((p) => <DestinationCard key={p.externalId} d={p} />)}</div>}
          </section>
        </div>
        <div className="space-y-6">
          <WeatherCard lat={d.lat} lon={d.lon} />
          <section className="card p-5">
            <h2 className="mb-2 text-lg font-bold">Travel notes</h2>
            <textarea className="input" rows={5} value={note} onChange={(e) => setNote(e.target.value)} placeholder="Best time to visit, things to book, who to bring…" aria-label="Travel notes" />
            <button className="btn-primary mt-3 w-full" onClick={saveNote}><Save size={16} /> Save notes</button>
            {!fav && <p className="mt-2 text-xs text-muted">Saving notes also adds this place to your favorites.</p>}
          </section>
        </div>
      </div>
      <AddToTripModal open={tripOpen} place={d} onClose={() => setTripOpen(false)} />
    </>
  );
}