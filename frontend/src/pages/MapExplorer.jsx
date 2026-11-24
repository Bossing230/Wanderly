import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, List, Map as MapIcon, Plus } from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import DestinationMap from '../components/DestinationMap.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import AddToTripModal from '../components/AddToTripModal.jsx';
import { Badge, ErrorState, PageHeader, useToast } from '../components/ui.jsx';
import { useFavorites } from '../hooks/useDestinations';
import { nearbyPlaces, searchDestinations } from '../services/destinationService';
import { errMsg } from '../services/api';
import { addrText, destId, destUrl, prettyCat } from '../utils';

const CATS = ['all', 'beach', 'museum', 'park', 'nature', 'historic', 'viewpoint'];

export default function MapExplorer() {
  const toast = useToast();
  const { ids, toggle } = useFavorites();
  const [places, setPlaces] = useState([]);
  const [attractions, setAttractions] = useState([]);
  const [selected, setSelected] = useState(null);
  const [flyTo, setFlyTo] = useState(null);
  const [cat, setCat] = useState('all');
  const [view, setView] = useState('map');
  const [err, setErr] = useState('');
  const [tripPlace, setTripPlace] = useState(null);

  const loadNearby = async (d, c = cat) => {
    setErr('');
    try { setAttractions(await nearbyPlaces(d.lat, d.lon, { category: c, radius: 12000, limit: 25 })); } catch (e) { setErr(errMsg(e)); setAttractions([]); }
  };
  const choose = (d) => { setSelected(d); setFlyTo([d.lat, d.lon]); if (d.kind !== 'attraction') loadNearby(d); };
  const find = async (q) => {
    setErr('');
    try {
      const r = await searchDestinations(q, { limit: 8 });
      if (!r.length) return toast.error('No places found for that search');
      setPlaces(r); choose({ ...r[0], id: destId(r[0]), kind: 'destination' });
    } catch (e) { setErr(errMsg(e)); }
  };
  const changeCat = (c) => { setCat(c); if (selected) loadNearby(selected, c); };
  const fav = async (d) => { try { toast.success((await toggle(d)) ? `Saved ${d.name}` : `Removed ${d.name}`); } catch (e) { toast.error(errMsg(e)); } };

  const markers = [
    ...places.map((p) => ({ ...p, id: destId(p), kind: 'destination' })),
    ...attractions.map((p) => ({ ...p, id: destId(p), kind: 'attraction' })),
  ];
  const all = markers;

  return (
    <>
      <PageHeader title="Map explorer" subtitle="Search a place, then see what is worth visiting around it.">
        <div className="flex rounded-xl border border-line bg-surface p-1" role="group" aria-label="View mode">
          {[['map', MapIcon, 'Map'], ['list', List, 'List']].map(([v, Icon, l]) => (
            <button key={v} onClick={() => setView(v)} aria-pressed={view === v} className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-semibold ${view === v ? 'bg-sea text-white' : 'text-muted'}`}><Icon size={16} />{l}</button>
          ))}
        </div>
      </PageHeader>
      <div className="mb-4 max-w-xl"><SearchBar onSubmit={find} onSelect={(d) => { setPlaces([d]); choose({ ...d, id: destId(d), kind: 'destination' }); }} placeholder="Search a place to explore…" /></div>
      <div className="mb-4"><FilterPanel categories={CATS} category={cat} setCategory={changeCat} /></div>
      {err && <div className="mb-4"><ErrorState message={err} /></div>}

      {view === 'map' ? (
        <div className="grid gap-4 lg:grid-cols-[1fr_340px]">
          <DestinationMap markers={markers} selectedId={selected?.id} onSelect={choose} flyTo={flyTo} className="h-[560px]" />
          <aside className="card p-5">
            {selected ? (
              <>
                <Badge>{prettyCat(selected.category)}</Badge>
                <h2 className="mt-2 text-xl font-bold">{selected.name}</h2>
                <p className="mt-1 text-sm text-muted">{addrText(selected) || `${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)}`}</p>
                <div className="mt-4 grid gap-2">
                  <Link to={destUrl(selected)} className="btn-primary">View details</Link>
                  <button className="btn-ghost" onClick={() => fav(selected)}><Heart size={16} className={ids.has(destId(selected)) ? 'fill-coral text-coral' : ''} />{ids.has(destId(selected)) ? 'Saved' : 'Save to favorites'}</button>
                  <button className="btn-ghost" onClick={() => setTripPlace(selected)}><Plus size={16} /> Add to trip</button>
                </div>
                <p className="mt-4 text-xs text-muted">{attractions.length} attraction{attractions.length !== 1 && 's'} within 12 km.</p>
              </>
            ) : <p className="text-sm text-muted">Search for a place or click a marker to see its details here. Teal pins are destinations, amber pins are nearby attractions.</p>}
          </aside>
        </div>
      ) : all.length ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{all.map((d) => <DestinationCard key={d.id} d={d} isFav={ids.has(destId(d))} onFav={fav} onAdd={setTripPlace} active={d.id === selected?.id} />)}</div>
      ) : <p className="text-sm text-muted">Nothing to list yet. Search for a place first.</p>}
      <AddToTripModal open={!!tripPlace} place={tripPlace} onClose={() => setTripPlace(null)} />
    </>
  );
}
