import { useEffect, useState } from 'react';
import { CloudRain, Droplets, Wind } from 'lucide-react';
import { getWeather } from '../services/destinationService';
import { errMsg } from '../services/api';
import { useAuth } from '../context/AuthContext.jsx';
import { ErrorState, Skeleton } from './ui.jsx';
import { fmtTemp } from '../utils';

export default function WeatherCard({ lat, lon, days = 7 }) {
  const { units } = useAuth();
  const [w, setW] = useState(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    setW(null); setErr('');
    getWeather(lat, lon).then(setW).catch((e) => setErr(errMsg(e)));
  }, [lat, lon]);
  if (err) return <ErrorState message={`Weather unavailable: ${err}`} />;
  if (!w) return <Skeleton className="h-56" />;
  const c = w.current;
  return (
    <section className="card p-5" aria-label="Weather forecast">
      <div className="flex items-center justify-between">
        <div><div className="font-display text-5xl font-bold">{fmtTemp(c.temp, units)}</div><div className="text-muted">{c.condition} right now</div></div>
        <div className="space-y-1 text-sm text-muted">
          <div className="flex items-center gap-2"><Wind size={16} /> {c.wind} km/h</div>
          <div className="flex items-center gap-2"><CloudRain size={16} /> {c.precipitation} mm</div>
          <div className="flex items-center gap-2"><Droplets size={16} /> {c.humidity}%</div>
        </div>
      </div>
      <p className="mt-3 rounded-xl bg-sea/10 px-3 py-2 text-sm">{w.summary}</p>
      <ul className="mt-4 divide-y divide-line text-sm">
        {w.daily.slice(0, days).map((d) => (
          <li key={d.date} className="flex items-center gap-3 py-2">
            <span className="w-24 font-medium">{new Date(d.date + 'T00:00').toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}</span>
            <span className="flex-1 text-muted">{d.condition}</span>
            <span className="w-12 text-right text-muted">{d.rainChance ?? 0}%</span>
            <span className="w-24 text-right font-semibold">{fmtTemp(d.tempMax, units)} / {fmtTemp(d.tempMin, units)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
