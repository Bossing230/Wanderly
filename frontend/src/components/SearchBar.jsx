import { useEffect, useRef, useState } from 'react';
import { Loader2, MapPin, Search } from 'lucide-react';
import { searchDestinations } from '../services/destinationService';

// Debounced search with suggestions. onSelect(place) fires when a suggestion is picked; onSubmit(query) on Enter.
export default function SearchBar({ onSelect, onSubmit, placeholder = 'Search cities, landmarks, beaches…', initial = '', suggest = true, autoFocus }) {
  const [q, setQ] = useState(initial);
  const [items, setItems] = useState([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const box = useRef(null);
  const skip = useRef(false);

  useEffect(() => { setQ(initial); }, [initial]);
  useEffect(() => {
    if (!suggest || skip.current || q.trim().length < 3) { skip.current = false; setItems([]); return; }
    const t = setTimeout(async () => {
      setBusy(true);
      try { setItems(await searchDestinations(q.trim(), { limit: 5 })); setOpen(true); } catch { setItems([]); } finally { setBusy(false); }
    }, 600);
    return () => clearTimeout(t);
  }, [q, suggest]);
  useEffect(() => {
    const h = (e) => !box.current?.contains(e.target) && setOpen(false);
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const pick = (d) => { skip.current = true; setQ(d.name); setOpen(false); onSelect?.(d); };
  return (
    <div ref={box} className="relative w-full">
      <form onSubmit={(e) => { e.preventDefault(); setOpen(false); if (q.trim().length >= 2) onSubmit?.(q.trim()); }} role="search">
        <Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input pl-11 pr-10" value={q} onChange={(e) => setQ(e.target.value)} placeholder={placeholder} autoFocus={autoFocus} aria-label={placeholder} />
        {busy && <Loader2 size={16} className="absolute right-3.5 top-1/2 -translate-y-1/2 animate-spin text-muted" />}
      </form>
      {open && items.length > 0 && (
        <ul className="card absolute z-[1200] mt-2 w-full overflow-hidden shadow-xl" role="listbox">
          {items.map((d) => (
            <li key={d.externalId}>
              <button type="button" onClick={() => pick(d)} className="flex w-full items-start gap-2 px-3.5 py-2.5 text-left text-sm hover:bg-sea/10">
                <MapPin size={16} className="mt-0.5 shrink-0 text-sea" />
                <span><span className="font-semibold">{d.name}</span><span className="block line-clamp-1 text-xs text-muted">{d.displayName}</span></span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
