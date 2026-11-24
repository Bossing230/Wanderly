import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Menu, PanelLeft, Search } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function Navbar({ onMenu, onCollapse }) {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [q, setQ] = useState('');
  const submit = (e) => { e.preventDefault(); if (q.trim().length >= 2) { nav(`/explore?q=${encodeURIComponent(q.trim())}`); setQ(''); } };
  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-line bg-surface/90 px-4 backdrop-blur sm:px-6">
      <button className="lg:hidden" onClick={onMenu} aria-label="Open menu"><Menu /></button>
      <button className="hidden lg:block text-muted hover:text-ink" onClick={onCollapse} aria-label="Collapse sidebar"><PanelLeft /></button>
      <form onSubmit={submit} className="relative max-w-md flex-1" role="search">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input className="input pl-10" placeholder="Where to next?" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search destinations" />
      </form>
      <div className="ml-auto flex items-center gap-3">
        <span className="hidden text-sm font-medium sm:block">{user?.name}</span>
        <button className="btn-ghost px-3" onClick={logout} aria-label="Log out"><LogOut size={18} /></button>
      </div>
    </header>
  );
}
