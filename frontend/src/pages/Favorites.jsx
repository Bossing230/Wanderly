import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Search } from 'lucide-react';
import DestinationCard from '../components/DestinationCard.jsx';
import AddToTripModal from '../components/AddToTripModal.jsx';
import FilterPanel from '../components/FilterPanel.jsx';
import { CardSkeletons, ConfirmDialog, EmptyState, ErrorState, Modal, PageHeader, useToast } from '../components/ui.jsx';
import { useFavorites } from '../hooks/useDestinations';
import { removeFavorite, updateFavorite } from '../services/favoriteService';
import { errMsg } from '../services/api';
import { prettyCat } from '../utils';

export default function Favorites() {
  const toast = useToast();
  const { favorites, setFavorites, loading, error, reload } = useFavorites();
  const [q, setQ] = useState('');
  const [cat, setCat] = useState('all');
  const [col, setCol] = useState('all');
  const [del, setDel] = useState(null);
  const [edit, setEdit] = useState(null);
  const [tripPlace, setTripPlace] = useState(null);

  const cats = useMemo(() => ['all', ...new Set(favorites.map((f) => f.category))], [favorites]);
  const cols = useMemo(() => ['all', ...new Set(favorites.map((f) => f.collectionName))], [favorites]);
  const list = favorites.filter((f) => (cat === 'all' || f.category === cat) && (col === 'all' || f.collectionName === col) && f.name.toLowerCase().includes(q.toLowerCase()));

  const confirmDelete = async () => {
    try { await removeFavorite(del._id); setFavorites((l) => l.filter((x) => x._id !== del._id)); toast.success(`Removed ${del.name}`); } catch (e) { toast.error(errMsg(e)); }
    setDel(null);
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    try { const u = await updateFavorite(edit._id, { collectionName: edit.collectionName.trim() || 'Default', notes: edit.notes }); setFavorites((l) => l.map((x) => (x._id === u._id ? u : x))); toast.success('Favorite updated'); setEdit(null); }
    catch (x) { toast.error(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="Favorites" subtitle="Places you saved, organized into collections." />
      {loading ? <CardSkeletons n={3} /> : error ? <ErrorState message={error} onRetry={reload} /> : favorites.length === 0 ? (
        <EmptyState icon={Heart} title="No favorites yet" text="Tap the heart on any destination to keep it here." action={<Link to="/explore" className="btn-primary">Explore places</Link>} />
      ) : (
        <>
          <div className="mb-4 flex flex-wrap gap-3">
            <div className="relative min-w-[220px] flex-1"><Search size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted" /><input className="input pl-11" placeholder="Search favorites" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search favorites" /></div>
            <select className="input !w-auto" value={col} onChange={(e) => setCol(e.target.value)} aria-label="Collection">{cols.map((c) => <option key={c} value={c}>{c === 'all' ? 'All collections' : c}</option>)}</select>
          </div>
          <div className="mb-6"><FilterPanel categories={cats} category={cat} setCategory={setCat} /></div>
          {list.length === 0 ? <EmptyState title="No matches" text="Adjust your search or filters." /> : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((f) => (
                <div key={f._id}>
                  <DestinationCard d={f} isFav onFav={() => setDel(f)} onAdd={setTripPlace} />
                  <div className="mt-2 flex items-center justify-between px-1 text-xs text-muted">
                    <span>{f.collectionName} · {prettyCat(f.category)}</span>
                    <button className="font-semibold text-sea" onClick={() => setEdit({ ...f })}>Edit collection & notes</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
      <ConfirmDialog open={!!del} title="Remove favorite?" message={`“${del?.name}” will be removed from your favorites. Trips that include it are not affected.`} confirmLabel="Remove" onConfirm={confirmDelete} onCancel={() => setDel(null)} />
      <Modal open={!!edit} onClose={() => setEdit(null)} title="Edit favorite">
        {edit && (
          <form onSubmit={saveEdit} className="space-y-4">
            <div><label className="label" htmlFor="col">Collection</label><input id="col" list="cols" className="input" value={edit.collectionName} onChange={(e) => setEdit({ ...edit, collectionName: e.target.value })} /><datalist id="cols">{cols.filter((c) => c !== 'all').map((c) => <option key={c} value={c} />)}</datalist></div>
            <div><label className="label" htmlFor="fn">Notes</label><textarea id="fn" rows={4} className="input" value={edit.notes || ''} onChange={(e) => setEdit({ ...edit, notes: e.target.value })} /></div>
            <div className="flex justify-end gap-2"><button type="button" className="btn-ghost" onClick={() => setEdit(null)}>Cancel</button><button className="btn-primary">Save changes</button></div>
          </form>
        )}
      </Modal>
      <AddToTripModal open={!!tripPlace} place={tripPlace} onClose={() => setTripPlace(null)} />
    </>
  );
}
