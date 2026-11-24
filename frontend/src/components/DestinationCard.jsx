import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Heart, Landmark, MapPin, Mountain, Plus, Trees, Waves } from 'lucide-react';
import { Badge } from './ui.jsx';
import { usePlaceImage } from '../hooks/usePlaceImage';
import { addrText, destUrl, prettyCat } from '../utils';

const GRADIENTS = [
  'from-sea to-deep', 'from-sun to-coral', 'from-deep to-ink', 'from-coral to-sun', 'from-sea to-sun',
];
const pickIcon = (cat = '') => {
  if (/beach|bay|water|coast|island/.test(cat)) return Waves;
  if (/park|garden|forest|nature|natural/.test(cat)) return Trees;
  if (/museum|monument|memorial|castle|historic|heritage|church|sights/.test(cat)) return Landmark;
  if (/peak|volcano|mountain|viewpoint|waterfall/.test(cat)) return Mountain;
  if (/city|town|village|municipality|administrative|suburb/.test(cat)) return Building2;
  return MapPin;
};
const hash = (s = '') => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

function Cover({ d }) {
  const img = usePlaceImage(d);
  const [broken, setBroken] = useState(false);
  const [loaded, setLoaded] = useState(false);

  if (img === undefined) return <div className="absolute inset-0 animate-pulse bg-line" />;
  if (!img || broken) {
    const Icon = pickIcon(d.category);
    return (
      <div className={`absolute inset-0 grid place-items-center bg-gradient-to-br ${GRADIENTS[hash(d.name) % GRADIENTS.length]}`}>
        <Icon size={44} className="text-white/80" aria-hidden="true" />
      </div>
    );
  }
  return (
    <>
      {!loaded && <div className="absolute inset-0 animate-pulse bg-line" />}
      <img
        src={img.url} alt={d.name} loading="lazy" onLoad={() => setLoaded(true)} onError={() => setBroken(true)}
        className={`h-full w-full object-cover transition duration-500 group-hover:scale-105 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
      <a href={img.link} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}
                className="absolute bottom-1.5 left-2 max-w-[85%] truncate rounded bg-black/55 px-1.5 py-0.5 text-[10px] text-white hover:bg-black/75">
        Photo: Wikipedia
      </a>
    </>
  );
}

export default function DestinationCard({ d, isFav, onFav, onAdd, onSelect, active }) {
  return (
    <article className={`card group overflow-hidden transition hover:-translate-y-0.5 hover:shadow-lg ${active ? 'ring-2 ring-sea' : ''}`}>
        <div className="relative h-48 overflow-hidden bg-sea/10">
        <Cover d={d} />
        {onFav && (
          <button onClick={() => onFav(d)} aria-label={isFav ? 'Remove from favorites' : 'Add to favorites'} aria-pressed={isFav}
            className="absolute right-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-surface shadow">
            <Heart size={18} className={isFav ? 'fill-coral text-coral' : 'text-muted'} />
          </button>
        )}
      </div>
      <div className="p-4">
        <div className="mb-1 flex items-start justify-between gap-2">
          <h3 className="line-clamp-1 text-lg font-bold">{d.name}</h3><Badge>{prettyCat(d.category)}</Badge>
        </div>
        {d.localName && <p className="line-clamp-1 text-xs text-muted">{d.localName}</p>}
        <p className="line-clamp-2 min-h-[2.5rem] text-sm text-muted">{addrText(d) || `${(+d.lat).toFixed(3)}, ${(+d.lon).toFixed(3)}`}</p>
        <div className="mt-3 flex gap-2">
          {onSelect ? <button className="btn-ghost flex-1 py-2" onClick={() => onSelect(d)}>Show on map</button> : null}
          <Link to={destUrl(d)} className="btn-primary flex-1 py-2">Details</Link>
          {onAdd && <button className="btn-ghost px-3 py-2" onClick={() => onAdd(d)} aria-label="Add to trip"><Plus size={18} /></button>}
        </div>
      </div>
    </article>
  );
}