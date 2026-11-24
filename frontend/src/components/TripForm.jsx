import { useEffect, useState } from 'react';
import { Modal } from './ui.jsx';
import { toInput } from '../utils';
import { useAuth } from '../context/AuthContext.jsx';

const blank = (budget) => ({ name: '', description: '', startDate: '', endDate: '', budget: budget || '', status: 'planned', notes: '' });

export default function TripForm({ open, trip, onClose, onSave }) {
  const { user } = useAuth();
  const [f, setF] = useState(blank());
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    if (open) { setErrs({}); setF(trip ? { ...trip, startDate: toInput(trip.startDate), endDate: toInput(trip.endDate), budget: trip.budget || '' } : blank(user?.preferences?.defaultBudget)); }
  }, [open, trip, user]);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (!f.name.trim()) x.name = 'Give your trip a name';
    if (!f.startDate) x.startDate = 'Choose a start date';
    if (!f.endDate) x.endDate = 'Choose an end date';
    if (f.startDate && f.endDate && f.endDate < f.startDate) x.endDate = 'End date must be on or after the start date';
    if (f.budget !== '' && +f.budget < 0) x.budget = 'Budget cannot be negative';
    setErrs(x);
    if (Object.keys(x).length) return;
    setBusy(true);
    try { await onSave({ name: f.name.trim(), description: f.description, startDate: f.startDate, endDate: f.endDate, budget: +f.budget || 0, status: f.status, notes: f.notes }); }
    finally { setBusy(false); }
  };
  const Err = ({ k }) => (errs[k] ? <p className="mt-1 text-xs text-coral" role="alert">{errs[k]}</p> : null);

  return (
    <Modal open={open} onClose={onClose} title={trip ? 'Edit trip' : 'New trip'} wide>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-2" noValidate>
        <div className="sm:col-span-2"><label className="label" htmlFor="tn">Trip name</label><input id="tn" className="input" value={f.name} onChange={set('name')} /><Err k="name" /></div>
        <div><label className="label" htmlFor="sd">Start date</label><input id="sd" type="date" className="input" value={f.startDate} onChange={set('startDate')} /><Err k="startDate" /></div>
        <div><label className="label" htmlFor="ed">End date</label><input id="ed" type="date" className="input" value={f.endDate} min={f.startDate} onChange={set('endDate')} /><Err k="endDate" /></div>
        <div><label className="label" htmlFor="bg">Budget</label><input id="bg" type="number" min="0" className="input" value={f.budget} onChange={set('budget')} /><Err k="budget" /></div>
        <div><label className="label" htmlFor="st">Status</label>
          <select id="st" className="input" value={f.status} onChange={set('status')}>{['planned', 'ongoing', 'completed', 'cancelled'].map((s) => <option key={s} value={s} className="capitalize">{s}</option>)}</select></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="ds">Description</label><textarea id="ds" rows={2} className="input" value={f.description || ''} onChange={set('description')} /></div>
        <div className="sm:col-span-2"><label className="label" htmlFor="nt">Notes</label><textarea id="nt" rows={3} className="input" value={f.notes || ''} onChange={set('notes')} /></div>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" disabled={busy}>{busy ? 'Saving…' : trip ? 'Save changes' : 'Create trip'}</button>
        </div>
      </form>
    </Modal>
  );
}
