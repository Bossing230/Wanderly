import { Link } from 'react-router-dom';
import { CalendarDays, MapPin, Pencil, Trash2, Wallet } from 'lucide-react';
import { Badge } from './ui.jsx';
import { fmtDate } from '../utils';

const TONE = { planned: 'sea', ongoing: 'sun', completed: 'muted', cancelled: 'coral' };

export default function TripCard({ trip, onEdit, onDelete }) {
  const days = Math.max(1, Math.round((new Date(trip.endDate) - new Date(trip.startDate)) / 864e5) + 1);
  return (
    <article className="card flex flex-col p-5">
      <div className="mb-2 flex items-start justify-between gap-2">
        <h3 className="text-xl font-bold">{trip.name}</h3><Badge tone={TONE[trip.status]}>{trip.status}</Badge>
      </div>
      {trip.description && <p className="mb-3 line-clamp-2 text-sm text-muted">{trip.description}</p>}
      <ul className="space-y-1.5 text-sm text-muted">
        <li className="flex items-center gap-2"><CalendarDays size={16} />{fmtDate(trip.startDate)} – {fmtDate(trip.endDate)} ({days} day{days > 1 ? 's' : ''})</li>
        <li className="flex items-center gap-2"><MapPin size={16} />{trip.destinations.length ? trip.destinations.map((d) => d.name).join(', ') : 'No destinations yet'}</li>
        {trip.budget > 0 && <li className="flex items-center gap-2"><Wallet size={16} />{trip.budget.toLocaleString()}</li>}
      </ul>
      <div className="mt-4 flex gap-2 pt-1">
        <Link to={`/itinerary/${trip._id}`} className="btn-primary flex-1 py-2">Plan itinerary</Link>
        <button className="btn-ghost px-3 py-2" onClick={() => onEdit(trip)} aria-label={`Edit ${trip.name}`}><Pencil size={16} /></button>
        <button className="btn-ghost px-3 py-2 hover:!border-coral hover:!text-coral" onClick={() => onDelete(trip)} aria-label={`Delete ${trip.name}`}><Trash2 size={16} /></button>
      </div>
    </article>
  );
}
