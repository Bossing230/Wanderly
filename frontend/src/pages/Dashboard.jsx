import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Legend } from 'recharts';
import { CalendarCheck, CheckCircle2, Heart, MapPinned, Plane, Search } from 'lucide-react';
import { getStats, listTrips } from '../services/tripService';
import { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { EmptyState, ErrorState, PageHeader, Skeleton } from '../components/ui.jsx';
import { fmtDate } from '../utils';

const COLORS = ['#0E7C86', '#F2A93B', '#E4572E', '#5BB3B8', '#10262B', '#9BCFD2'];

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [err, setErr] = useState('');
  const load = () => { setErr(''); Promise.all([getStats(), listTrips({ upcoming: 'true' })]).then(([s, t]) => { setStats(s); setUpcoming(t.slice(0, 4)); }).catch((e) => setErr(errMsg(e))); };
  useEffect(load, []);

  if (err) return <ErrorState message={err} onRetry={load} />;
  if (!stats) return <div className="space-y-4"><Skeleton className="h-10 w-72" /><div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">{[1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-72" /></div>;

  const cards = [
    ['Saved destinations', stats.savedDestinations, MapPinned], ['Favorite places', stats.favorites, Heart],
    ['Upcoming trips', stats.upcomingTrips, Plane], ['Completed trips', stats.completedTrips, CheckCircle2], ['Planned stops', stats.plannedDestinations, CalendarCheck],
  ];
  return (
    <>
      <PageHeader title={`Hi ${user?.name?.split(' ')[0] || 'there'}, where to next?`} subtitle="Your travel plans at a glance.">
        <Link to="/explore" className="btn-primary"><Search size={16} /> Explore places</Link>
        <Link to="/trips" className="btn-ghost">Plan a trip</Link>
      </PageHeader>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        {cards.map(([label, v, Icon]) => (
          <div key={label} className="card p-5"><Icon className="mb-3 text-sea" size={22} /><div className="font-display text-3xl font-bold">{v}</div><div className="text-sm text-muted">{label}</div></div>
        ))}
      </div>
      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <section className="card p-5"><h2 className="mb-4 text-lg font-bold">Favorites by category</h2>
          {stats.categoryBreakdown.length ? (
            <ResponsiveContainer width="100%" height={260}><PieChart><Pie data={stats.categoryBreakdown} dataKey="value" nameKey="name" innerRadius={55} outerRadius={90} paddingAngle={2}>
              {stats.categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip /><Legend /></PieChart></ResponsiveContainer>
          ) : <EmptyState title="No favorites yet" text="Save places from Explore to see them grouped here." />}
        </section>
        <section className="card p-5"><h2 className="mb-4 text-lg font-bold">Trips by month</h2>
          {stats.tripsByMonth.length ? (
            <ResponsiveContainer width="100%" height={260}><BarChart data={stats.tripsByMonth}><CartesianGrid strokeDasharray="3 3" stroke="var(--line)" /><XAxis dataKey="month" stroke="var(--muted)" /><YAxis allowDecimals={false} stroke="var(--muted)" /><Tooltip /><Bar dataKey="count" name="Trips" fill="#0E7C86" radius={[6, 6, 0, 0]} /></BarChart></ResponsiveContainer>
          ) : <EmptyState title="No trips yet" text="Create a trip and your travel activity shows up here." />}
        </section>
        <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Upcoming trips</h2>
          {upcoming.length ? <ul className="divide-y divide-line">{upcoming.map((t) => <li key={t._id}><Link to={`/itinerary/${t._id}`} className="flex justify-between py-3 hover:text-sea"><span className="font-semibold">{t.name}</span><span className="text-sm text-muted">{fmtDate(t.startDate)}</span></Link></li>)}</ul>
            : <p className="text-sm text-muted">Nothing planned. <Link className="font-semibold text-sea" to="/trips">Start a trip</Link>.</p>}
        </section>
        <section className="card p-5"><h2 className="mb-3 text-lg font-bold">Recently explored</h2>
          {stats.recentlyExplored.length ? <div className="flex flex-wrap gap-2">{stats.recentlyExplored.map((r, i) => <Link key={i} className="chip" to={`/explore?q=${encodeURIComponent(r.query)}`}>{r.query}</Link>)}</div>
            : <p className="text-sm text-muted">Your searches will appear here.</p>}
        </section>
      </div>
    </>
  );
}
