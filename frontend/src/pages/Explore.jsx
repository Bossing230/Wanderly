import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Compass, SearchX } from 'lucide-react';
import SearchBar from '../components/SearchBar.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import DestinationCard from '../components/DestinationCard.jsx';
import AddToTripModal from '../components/AddToTripModal.jsx';
import { CardSkeletons, EmptyState, ErrorState, PageHeader, useToast } from '../components/ui.jsx';
import { useDestinations, useFavorites } from '../hooks/useDestinations';
import { getRecent } from '../services/destinationService';
import { errMsg } from '../services/api';
import { CATS, destId, matchesCategory, destUrl } from '../utils';
import { useNavigate } from 'react-router-dom';

export default function Explore() {
  const [sp, setSp] = useSearchParams();
  const nav = useNavigate();
  const q = sp.get('q') || '';
  const toast = useToast();
  const { results, loading, error, searched, search } = useDestinations();
  const { ids, toggle } = useFavorites();
  const [category, setCategory] = useState('all');
  const [sort, setSort] = useState('relevance');
  const [country, setCountry] = useState('');
  const [shown, setShown] = useState(8);
  const [recent, setRecent] = useState([]);
  const [tripPlace, setTripPlace] = useState(null);
  const cc = country.length === 2 ? country : '';

  useEffect(() => { if (q) { setShown(8); search(q, { limit: 24, country: cc || undefined }); } }, [q, cc, search]);
  useEffect(() => { if (!q) getRecent().then(setRecent).catch(() => {}); }, [q]);

  const visible = useMemo(() => {
    const l = results.filter((d) => matchesCategory(d, category));
    return sort === 'name' ? [...l].sort((a, b) => a.name.localeCompare(b.name)) : l;
  }, [results, category, sort]);

  const fav = async (d) => { try { toast.success((await toggle(d)) ? `Saved ${d.name}` : `Removed ${d.name}`); } catch (e) { toast.error(errMsg(e)); } };

  return (
    <>
      <PageHeader title="Explore destinations" subtitle="Search any city, landmark, or address in the world." />
      <div className="mb-4"><SearchBar initial={q} autoFocus onSubmit={(v) => setSp({ q: v })} onSelect={(d) => nav(destUrl(d))} /></div>
      <div className="mb-6"><FilterPanel categories={CATS} category={category} setCategory={setCategory} sort={sort} setSort={setSort} country={country} setCountry={setCountry} /></div>

      {loading ? <CardSkeletons /> : error ? <ErrorState message={error} onRetry={() => search(q, { limit: 24 })} /> :
        !q ? (
          <EmptyState icon={Compass} title="Start with a place name" text="Try a city, a beach, or a landmark. Pick a suggestion to open it directly."
            action={recent.length ? <div className="flex flex-wrap justify-center gap-2">{recent.slice(0, 6).map((r, i) => <button key={i} className="chip" onClick={() => setSp({ q: r.query })}>{r.query}</button>)}</div> : null} />
        ) : searched && visible.length === 0 ? (
          <EmptyState icon={SearchX} title="No matches" text={results.length ? 'Nothing fits this category. Try "all".' : 'Check the spelling or try a broader place name.'} />
        ) : (
          <>
            <p className="mb-3 text-sm text-muted">{visible.length} result{visible.length !== 1 && 's'} for “{q}”</p>
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {visible.slice(0, shown).map((d) => <DestinationCard key={d.externalId} d={d} isFav={ids.has(destId(d))} onFav={fav} onAdd={setTripPlace} />)}
            </div>
            {shown < visible.length && <div className="mt-6 text-center"><button className="btn-ghost" onClick={() => setShown((s) => s + 8)}>Show more</button></div>}
          </>
        )}
      <AddToTripModal open={!!tripPlace} place={tripPlace} onClose={() => setTripPlace(null)} />
    </>
  );
}
