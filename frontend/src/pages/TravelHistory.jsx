import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { History, MapPin, Search } from 'lucide-react';
import { Badge, CardSkeletons, EmptyState, ErrorState, PageHeader } from '../components/ui.jsx';
import { getHistory } from '../services/tripService';
import { errMsg } from '../services/api';
import { fmtDate } from '../utils';

export default function TravelHistory() {
  const [q, setQ] = useState('');
  const [data, setData] = useState(null);
  const [err, setErr] = useState('');
  const load = () => { setErr(''); getHistory({ q }).then(setData).catch((e) => setErr(errMsg(e))); };
  useEffect(() => { const t = setTimeout(load, 300); return () => clearTimeout(t); }, [q]); // eslint-disable-line

  return (
    <>
      <PageHeader title="Travel history" subtitle="Trips you have completed and the places you visited." />
      {err ? <ErrorState message={err} onRetry={load} /> : !data ? <CardSkeletons n={3} /> : (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-3">
            {[['Trips completed', data.stats.trips], ['Places visited', data.stats.placesVisited], ['Total budget spent', data.stats.totalSpent.toLocaleString()]].map(([l, v]) => (
              <div key={l} className="card p-5"><div className="font-display text-3xl font-bold">{v}</div><div className="text-sm text-muted">{l}</div></div>
            ))}
          </div>
          {data.items.length > 0 && (
            <section className="card mb-6 p-5"><h2 className="mb-3 text-lg font-bold">Places visited per trip</h2>
              <ResponsiveContainer width="100%" height={220}><BarChart data={data.items.map((h) => ({ name: h.tripName, places: h.visitedPlaces.length }))}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="name" stroke="var(--muted)" /><YAxis allowDecimals={false} stroke="var(--muted)" /><Tooltip /><Bar dataKey="places" fill="#0E7C86" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
            </section>
          )}
          <div className="relative mb-4 max-w-md"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input className="input pl-11" placeholder="Search past trips" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search past trips" /></div>
          {data.items.length === 0 ? (
            <EmptyState icon={History} title={q ? 'No past trips match' : 'No completed trips yet'} text="When you mark a trip as completed, its summary and visited places appear here." action={<Link to="/trips" className="btn-primary">Go to trips</Link>} />
          ) : (
            <div className="space-y-4">
              {data.items.map((h) => (
                <article key={h._id} className="card p-5">
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <h3 className="text-xl font-bold">{h.tripName}</h3>
                      {h.status === 'cancelled' && <Badge tone="coral">cancelled</Badge>}
                      {h.status !== 'completed' && h.status !== 'cancelled' && <Badge tone="sun">in progress</Badge>}
                    </div>
                    <span className="text-sm text-muted">{fmtDate(h.startDate)} – {fmtDate(h.endDate)}</span>
                  </div>
                  {h.summary && <p className="mt-1 text-sm text-muted">{h.summary}</p>}
                  {h.visitedPlaces.length > 0 && <div className="mt-3 flex flex-wrap gap-2">{h.visitedPlaces.map((p, i) => <span key={i} className="chip flex items-center gap-1"><MapPin size={14} />{p.name}</span>)}</div>}
                  {h.status === 'cancelled' && h.plannedStops.length > 0 && (
                    <div className="mt-3">
                      <div className="mb-1 text-xs font-semibold text-muted">Planned stops</div>
                      <div className="flex flex-wrap gap-2">{h.plannedStops.map((p, i) => <span key={i} className="chip flex items-center gap-1 opacity-70"><MapPin size={14} />{p.name}</span>)}</div>
                    </div>
                  )}
                  {h.notes && <p className="mt-3 rounded-xl bg-sea/10 p-3 text-sm">{h.notes}</p>}
                </article>
              ))}
            </div>
          )}
        </>
      )}
    </>
  );
}
