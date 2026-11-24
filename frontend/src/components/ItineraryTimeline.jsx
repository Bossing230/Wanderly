import { CheckCircle2, Circle, MapPin, Pencil, Trash2 } from 'lucide-react';
import { fmtDate } from '../utils';

export default function ItineraryTimeline({ items, onToggle, onDelete, onEdit }) {
  const days = items.reduce((m, it) => { const k = it.date.slice(0, 10); (m[k] = m[k] || []).push(it); return m; }, {});
  return (
    <div className="space-y-6">
      {Object.keys(days).sort().map((day, idx) => (
        <section key={day} aria-label={fmtDate(day)}>
          <h3 className="mb-3 text-lg font-bold">Day {idx + 1} <span className="font-sans text-sm font-medium text-muted">{fmtDate(day)}</span></h3>
          <ol className="relative ml-3 space-y-3 border-l-2 border-line pl-6">
            {days[day].map((it) => (
              <li key={it._id} className="card relative p-4">
                <span className="absolute -left-[33px] top-5 h-3 w-3 rounded-full border-2 border-surface bg-sea" />
                <div className="flex items-start gap-3">
                  <button onClick={() => onToggle(it)} aria-label={it.visited ? 'Mark as not visited' : 'Mark as visited'} className="mt-0.5">
                    {it.visited ? <CheckCircle2 className="text-sea" /> : <Circle className="text-muted" />}
                  </button>
                  <div className="flex-1">
                    <div className={`font-semibold ${it.visited ? 'line-through opacity-60' : ''}`}>{it.time && <span className="mr-2 text-sea">{it.time}</span>}{it.title}</div>
                    {it.place?.name && <div className="mt-0.5 flex items-center gap-1 text-sm text-muted"><MapPin size={14} />{it.place.name}</div>}
                    {it.notes && <p className="mt-1 text-sm text-muted">{it.notes}</p>}
                  </div>
                  <div className="flex items-center gap-3">
                    {onEdit && <button onClick={() => onEdit(it)} aria-label={`Edit ${it.title}`} className="text-muted hover:text-sea"><Pencil size={18} /></button>}
                    <button onClick={() => onDelete(it)} aria-label={`Remove ${it.title}`} className="text-muted hover:text-coral"><Trash2 size={18} /></button>
                  </div>
                </div>
              </li>
            ))}
          </ol>
        </section>
      ))}
    </div>
  );
}