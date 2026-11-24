import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Modal, useToast } from './ui.jsx';
import { listTrips, addTripDestination } from '../services/tripService';
import { errMsg } from '../services/api';
import { toPlace } from '../utils';

export default function AddToTripModal({ open, place, onClose }) {
  const toast = useToast();
  const [trips, setTrips] = useState(null);
  const [sel, setSel] = useState('');
  useEffect(() => {
    if (!open) return;
    setTrips(null);
    listTrips().then((t) => { const a = t.filter((x) => ['planned', 'ongoing'].includes(x.status)); setTrips(a); setSel(a[0]?._id || ''); }).catch((e) => { toast.error(errMsg(e)); setTrips([]); });
  }, [open]); // eslint-disable-line
  const add = async () => {
    try { await addTripDestination(sel, toPlace(place)); toast.success(`Added ${place.name} to your trip`); onClose(); }
    catch (e) { toast.error(errMsg(e)); }
  };
  return (
    <Modal open={open} onClose={onClose} title={`Add ${place?.name || ''} to a trip`}>
      {!trips ? <p className="text-sm text-muted">Loading your trips…</p> : trips.length === 0 ? (
        <p className="text-sm text-muted">You have no planned trips yet. <Link to="/trips" className="font-semibold text-sea" onClick={onClose}>Create one</Link> first.</p>
      ) : (
        <>
          <label className="label" htmlFor="trip-sel">Trip</label>
          <select id="trip-sel" className="input mb-5" value={sel} onChange={(e) => setSel(e.target.value)}>{trips.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}</select>
          <div className="flex justify-end gap-2"><button className="btn-ghost" onClick={onClose}>Cancel</button><button className="btn-primary" onClick={add}>Add to trip</button></div>
        </>
      )}
    </Modal>
  );
}
