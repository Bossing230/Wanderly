import { useState } from 'react';
import { Luggage, Plus } from 'lucide-react';
import TripCard from '../components/TripCard.jsx';
import TripForm from '../components/TripForm.jsx';
import { CardSkeletons, ConfirmDialog, EmptyState, ErrorState, PageHeader, useToast } from '../components/ui.jsx';
import { useTrips } from '../hooks/useTrips';
import { errMsg } from '../services/api';

const TABS = [['all', 'All', {}], ['upcoming', 'Upcoming', { upcoming: 'true' }], ['ongoing', 'Ongoing', { status: 'ongoing' }], ['completed', 'Completed', { status: 'completed' }], ['cancelled', 'Cancelled', { status: 'cancelled' }]];

export default function Trips() {
  const toast = useToast();
  const [tab, setTab] = useState('all');
  const { trips, loading, error, reload, create, update, remove } = useTrips(TABS.find((t) => t[0] === tab)[2]);
  const [form, setForm] = useState({ open: false, trip: null });
  const [del, setDel] = useState(null);

  const save = async (data) => {
    try {
      if (form.trip) { await update(form.trip._id, data); toast.success('Trip updated'); } else { await create(data); toast.success('Trip created'); }
      setForm({ open: false, trip: null });
    } catch (e) { toast.error(errMsg(e)); }
  };
  const confirm = async () => { try { await remove(del._id); toast.success('Trip deleted'); } catch (e) { toast.error(errMsg(e)); } setDel(null); };

  return (
    <>
      <PageHeader title="Trips" subtitle="Plan, track, and look back on your journeys.">
        <button className="btn-primary" onClick={() => setForm({ open: true, trip: null })}><Plus size={16} /> New trip</button>
      </PageHeader>
      <div className="mb-6 flex flex-wrap gap-2" role="tablist">
        {TABS.map(([k, l]) => <button key={k} role="tab" aria-selected={tab === k} onClick={() => setTab(k)} className={`chip ${tab === k ? 'chip-on' : ''}`}>{l}</button>)}
      </div>
      {loading ? <CardSkeletons n={3} /> : error ? <ErrorState message={error} onRetry={reload} /> : trips.length === 0 ? (
        <EmptyState icon={Luggage} title={tab === 'all' ? 'No trips yet' : `No ${tab} trips`} text="Create a trip, add destinations, then build the day-by-day itinerary." action={<button className="btn-primary" onClick={() => setForm({ open: true, trip: null })}>Create a trip</button>} />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{trips.map((t) => <TripCard key={t._id} trip={t} onEdit={(x) => setForm({ open: true, trip: x })} onDelete={setDel} />)}</div>
      )}
      <TripForm open={form.open} trip={form.trip} onClose={() => setForm({ open: false, trip: null })} onSave={save} />
      <ConfirmDialog open={!!del} title="Delete this trip?" message={`“${del?.name}”, its itinerary items, and its history record will be permanently deleted.`} onConfirm={confirm} onCancel={() => setDel(null)} />
    </>
  );
}
