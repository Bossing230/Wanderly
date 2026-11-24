import { useEffect, useState } from 'react';
import { LogOut } from 'lucide-react';
import { PageHeader, useToast } from '../components/ui.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { errMsg } from '../services/api';
import PasswordInput from '../components/PasswordInput.jsx';

const S = ({ title, children, onSubmit }) => <form onSubmit={onSubmit} className="card space-y-4 p-6"><h2 className="text-lg font-bold">{title}</h2>{children}</form>;

export default function Settings() {
  const { user, updateProfile, changePassword, logout } = useAuth();
  const toast = useToast();
  const [p, setP] = useState({ name: '', email: '' });
  const [pref, setPref] = useState({});
  const [pw, setPw] = useState({ currentPassword: '', newPassword: '', confirm: '' });
  useEffect(() => { if (user) { setP({ name: user.name, email: user.email }); setPref(user.preferences || {}); } }, [user]);

  const saveProfile = async (e) => { e.preventDefault(); try { await updateProfile({ ...p }); toast.success('Profile saved'); } catch (x) { toast.error(errMsg(x)); } };
  const savePrefs = async (e) => { e.preventDefault(); try { await updateProfile({ preferences: { ...pref, defaultBudget: +pref.defaultBudget || 0 } }); toast.success('Preferences saved'); } catch (x) { toast.error(errMsg(x)); } };
  const savePw = async (e) => {
    e.preventDefault();
    if (pw.newPassword !== pw.confirm) return toast.error('New passwords do not match');
    try { await changePassword(pw.currentPassword, pw.newPassword); setPw({ currentPassword: '', newPassword: '', confirm: '' }); toast.success('Password updated'); } catch (x) { toast.error(errMsg(x)); }
  };

  return (
    <>
      <PageHeader title="Settings" subtitle="Your profile, preferences, and security." />
      <div className="grid max-w-3xl gap-6">
        <S title="Profile" onSubmit={saveProfile}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="sn">Name</label><input id="sn" className="input" value={p.name} onChange={(e) => setP({ ...p, name: e.target.value })} required /></div>
            <div><label className="label" htmlFor="se">Email</label><input id="se" type="email" className="input" value={p.email} onChange={(e) => setP({ ...p, email: e.target.value })} required /></div>
          </div>
          <button className="btn-primary">Save profile</button>
        </S>
        <S title="Display and travel preferences" onSubmit={savePrefs}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className="label" htmlFor="th">Theme</label><select id="th" className="input" value={pref.theme || 'light'} onChange={(e) => setPref({ ...pref, theme: e.target.value })}><option value="light">Light</option><option value="dark">Dark</option></select></div>
            <div><label className="label" htmlFor="un">Units</label><select id="un" className="input" value={pref.units || 'metric'} onChange={(e) => setPref({ ...pref, units: e.target.value })}><option value="metric">Metric (km, °C)</option><option value="imperial">Imperial (mi, °F)</option></select></div>
            <div><label className="label" htmlFor="tm">Default travel mode</label><select id="tm" className="input" value={pref.defaultTravelMode || 'driving-car'} onChange={(e) => setPref({ ...pref, defaultTravelMode: e.target.value })}><option value="driving-car">Driving</option><option value="cycling-regular">Cycling</option><option value="foot-walking">Walking</option></select></div>
            <div><label className="label" htmlFor="db">Default trip budget</label><input id="db" type="number" min="0" className="input" value={pref.defaultBudget ?? 0} onChange={(e) => setPref({ ...pref, defaultBudget: e.target.value })} /></div>
          </div>
          <button className="btn-primary">Save preferences</button>
        </S>
        <S title="Change password" onSubmit={savePw}>
          <div className="grid gap-4 sm:grid-cols-3">
            {[['currentPassword', 'Current password'], ['newPassword', 'New password'], ['confirm', 'Confirm new password']].map(([k, l]) => (
              <div key={k}><label className="label" htmlFor={k}>{l}</label>
              <PasswordInput id={k} value={pw[k]} onChange={(e) => setPw({ ...pw, [k]: e.target.value })} /></div>
            ))}
          </div>
          <button className="btn-primary">Update password</button>
        </S>
        <div className="card flex items-center justify-between p-6"><div><h2 className="text-lg font-bold">Log out</h2><p className="text-sm text-muted">End this session on this device.</p></div><button className="btn-ghost" onClick={logout}><LogOut size={16} /> Log out</button></div>
      </div>
    </>
  );
}
