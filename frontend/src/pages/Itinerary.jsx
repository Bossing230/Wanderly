import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, CalendarDays, Plus, Route as RouteIcon } from 'lucide-react';
import ItineraryTimeline from '../components/ItineraryTimeline.jsx';
import DestinationMap from '../components/DestinationMap.jsx';
import WeatherCard from '../components/WeatherCard.jsx';
import { ConfirmDialog, EmptyState, ErrorState, Modal, PageHeader, Skeleton, useToast } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { getTrip, listTrips } from '../services/tripService';
import { createItem, deleteItem, listItems, updateItem } from '../services/itineraryService';
import { listFavorites } from '../services/favoriteService';
import { getRoute, searchDestinations } from '../services/destinationService';
import { errMsg } from '../services/api';
import { fmtDate, fmtDist, fmtDur, toInput } from '../utils';

export default function Itinerary() {
  const { tripId } = useParams();
  const nav = useNavigate();
  const toast = useToast();
  const { units } = useAuth();
  const [trips, setTrips] = useState([]);
  const [trip, setTrip] = useState(null);
  const [items, setItems] = useState([]);
  const [favs, setFavs] = useState([]);
  const [err, setErr] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [del, setDel] = useState(null);
  const [route, setRoute] = useState(null);
  const [guess, setGuess] = useState(null); // location found from the trip name when nothing else is pinned
  const [f, setF] = useState({ title: '', date: '', time: '', place: '', notes: '' });
  const [editing, setEditing] = useState(null);

  useEffect(() => { listTrips().then(setTrips).catch((e) => setErr(errMsg(e))); listFavorites().then(setFavs).catch(() => {}); }, []);
  const load = useCallback(async () => {
    if (!tripId) return;
    setLoading(true); setErr(''); setRoute(null);
    try { const [t, i] = await Promise.all([getTrip(tripId), listItems(tripId)]); setTrip(t); setItems(i); } catch (e) { setErr(errMsg(e)); } finally { setLoading(false); }
  }, [tripId]);
  useEffect(() => { load(); }, [load]);

  const placeOptions = useMemo(() => [...(trip?.destinations || []).map((d) => ({ ...d, src: 'Trip' })), ...favs.map((x) => ({ name: x.name, lat: x.lat, lon: x.lon, category: x.category, address: x.address, src: 'Favorite' }))], [trip, favs]);
  const stops = items.filter((i) => i.place?.lat != null);
  const destMarkers = (trip?.destinations || []).filter((d) => d.lat != null)
    .map((d, i) => ({ id: `dest-${d._id || i}`, name: d.name, lat: d.lat, lon: d.lon, category: d.category, kind: 'destination' }));
  const stopMarkers = stops.map((i, n) => ({ id: i._id, name: `${n + 1}. ${i.title}`, lat: i.place.lat, lon: i.place.lon, category: i.place.category, kind: 'stop' }));
  const markers = [...destMarkers, ...stopMarkers, ...(guess && !destMarkers.length && !stopMarkers.length ? [guess] : [])];

  // Nothing pinned yet: find the trip name on the map (e.g. a trip called "Ozamiz City").
  const pinned = destMarkers.length + stopMarkers.length;
  useEffect(() => {
    setGuess(null);
    if (!trip || pinned) return undefined;
    let live = true;
    searchDestinations(trip.name, { limit: 1 })
      .then((r) => { if (live && r[0]) setGuess({ id: 'guess', name: r[0].name, lat: r[0].lat, lon: r[0].lon, category: r[0].category, kind: 'destination' }); })
      .catch(() => {});
    return () => { live = false; };
  }, [trip?._id, trip?.name, pinned]); // eslint-disable-line

  const openForm = () => { setEditing(null); setF({ title: '', date: toInput(trip.startDate), time: '', place: '', notes: '' }); setOpen(true); };

const openEdit = (it) => {
  const i = placeOptions.findIndex((p) => p.name === it.place?.name && p.lat === it.place?.lat);
  setF({
    title: it.title,
    date: toInput(it.date),
    time: it.time || '',
    place: it.place?.name ? (i >= 0 ? String(i) : 'keep') : '',
    notes: it.notes || '',
  });
  setEditing(it);
  setOpen(true);
};

const submit = async (e) => {
  e.preventDefault();
  if (!f.title.trim()) return toast.error('Give this activity a title');
  const p = f.place !== '' && f.place !== 'keep' ? placeOptions[+f.place] : undefined;
  const place = p
    ? { name: p.name, lat: p.lat, lon: p.lon, category: p.category, address: p.address }
    : editing && f.place === '' ? {} : undefined; // {} clears the place, undefined leaves it alone
  try {
    if (editing) {
      await updateItem(editing._id, { title: f.title.trim(), date: f.date, time: f.time, notes: f.notes, ...(place !== undefined && { place }) });
      toast.success('Activity updated');
    } else {
      await createItem({ trip: tripId, title: f.title.trim(), date: f.date, time: f.time || undefined, notes: f.notes, order: items.length, place });
      toast.success('Added to itinerary');
    }
    setOpen(false); load();
  } catch (x) { toast.error(errMsg(x)); }
};
  const toggle = async (it) => { try { const u = await updateItem(it._id, { visited: !it.visited }); setItems((l) => l.map((x) => (x._id === u._id ? u : x))); } catch (e) { toast.error(errMsg(e)); } };
  const confirmDel = async () => { try { await deleteItem(del._id); setItems((l) => l.filter((x) => x._id !== del._id)); toast.success('Removed from itinerary'); } catch (e) { toast.error(errMsg(e)); } setDel(null); };
  const showRoute = async () => {
    try { setRoute(await getRoute(stops.map((s) => s.place))); } catch (e) { toast.error(errMsg(e)); }
  };

  if (!tripId) return (
    <>
      <PageHeader title="Itinerary" subtitle="Choose a trip to plan day by day." />
      {err ? <ErrorState message={err} /> : trips.length === 0 ? <EmptyState icon={CalendarDays} title="No trips to plan" text="Create a trip first, then come back to build its itinerary." action={<button className="btn-primary" onClick={() => nav('/trips')}>Go to trips</button>} /> : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{trips.map((t) => <button key={t._id} onClick={() => nav(`/itinerary/${t._id}`)} className="card p-5 text-left hover:border-sea"><div className="font-display text-lg font-bold">{t.name}</div><div className="text-sm text-muted">{fmtDate(t.startDate)} – {fmtDate(t.endDate)}</div></button>)}</div>
      )}
    </>
  );

  if (err) return <ErrorState message={err} onRetry={load} />;
  if (loading || !trip) return <Skeleton className="h-96" />;

  return (
    <>
      <Link to="/itinerary" className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-sea"><ArrowLeft size={16} /> Back to itineraries</Link>
      <PageHeader title={trip.name} subtitle={`${fmtDate(trip.startDate)} – ${fmtDate(trip.endDate)}`}>
        <select className="input !w-auto" value={tripId} onChange={(e) => nav(`/itinerary/${e.target.value}`)} aria-label="Switch trip">{trips.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
        <button className="btn-primary" onClick={openForm}><Plus size={16} /> Add activity</button>
      </PageHeader>
      <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
        <div>
          {items.length === 0 ? <EmptyState icon={CalendarDays} title="Nothing scheduled" text="Add activities with a date, time, and place." action={<button className="btn-primary" onClick={openForm}>Add the first activity</button>} /> : <ItineraryTimeline items={items} onToggle={toggle} onDelete={setDel} onEdit={openEdit} />}
        </div>
        <div className="space-y-4">
          <div className="card overflow-hidden p-2">
            <DestinationMap
              key={markers.map((m) => m.id).join('|') || 'empty'}
              markers={markers}
              center={markers[0] ? [markers[0].lat, markers[0].lon] : [12.8, 122]}
              zoom={markers.length ? (stopMarkers.length ? 15 : 12) : 5}
              bounds={markers.length > 1 ? markers.map((m) => [m.lat, m.lon]) : undefined}
              path={route?.path} className="h-[320px]" linkPopups={false}
            />
          </div>
          {markers.length > 0 && <p className="px-1 text-xs text-muted">Teal pins: trip destinations. Red pins: your activities.{guess && !pinned ? ` Showing ${guess.name}, found from the trip name.` : ''}</p>}
          {stops.length >= 2 && <button className="btn-ghost w-full" onClick={showRoute}><RouteIcon size={16} /> Route between {stops.length} stops</button>}
          {route && <div className="rounded-xl bg-sea/10 p-3 text-sm font-semibold">{fmtDist(route.distanceKm, units)} · {fmtDur(route.durationMin)} driving time</div>}
          {(trip.destinations[0] || guess) && <WeatherCard lat={(trip.destinations[0] || guess).lat} lon={(trip.destinations[0] || guess).lon} days={5} />}
        </div>
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title={editing ? 'Edit activity' : 'Add activity'}>
        <form onSubmit={submit} className="space-y-4" noValidate>
          <div><label className="label" htmlFor="it">Title</label><input id="it" className="input" value={f.title} onChange={(e) => setF({ ...f, title: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="label" htmlFor="idt">Date</label><input id="idt" type="date" className="input" min={toInput(trip.startDate)} max={toInput(trip.endDate)} value={f.date} onChange={(e) => setF({ ...f, date: e.target.value })} required /></div>
            <div><label className="label" htmlFor="itm">Time</label><input id="itm" type="time" className="input" value={f.time} onChange={(e) => setF({ ...f, time: e.target.value })} /></div>
          </div>
          <div><label className="label" htmlFor="ipl">Place</label>
            <select id="ipl" className="input" value={f.place} onChange={(e) => setF({ ...f, place: e.target.value })}><option value="">No place</option>{editing?.place?.name && f.place === 'keep' && <option value="keep">Keep current: {editing.place.name}</option>}{placeOptions.map((p, i) => <option key={i} value={i}>{p.name} ({p.src})</option>)}</select></div>
          <div><label className="label" htmlFor="ino">Notes</label><textarea id="ino" rows={3} className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
          <div className="flex justify-end gap-2">
            <button type="button" className="btn-ghost" onClick={() => setOpen(false)}>Cancel</button>
            <button className="btn-primary">{editing ? 'Save changes' : 'Add activity'}</button></div>
        </form>
      </Modal>
      <ConfirmDialog open={!!del} title="Remove activity?" message={`“${del?.title}” will be removed from this itinerary.`} confirmLabel="Remove" onConfirm={confirmDel} onCancel={() => setDel(null)} />
    </>
  );
}