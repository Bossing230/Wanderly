import { NavLink } from 'react-router-dom';
import { Compass, CalendarDays, Heart, History, LayoutDashboard, Map, Route, Search, Settings, Luggage, X } from 'lucide-react';

const LINKS = [
  ['/', 'Dashboard', LayoutDashboard], ['/explore', 'Explore', Search], ['/map', 'Map', Map], ['/favorites', 'Favorites', Heart],
  ['/trips', 'Trips', Luggage], ['/itinerary', 'Itinerary', CalendarDays], ['/routes', 'Routes', Route],
  ['/history', 'Travel history', History], ['/settings', 'Settings', Settings],
];

export default function Sidebar({ collapsed, mobileOpen, onClose }) {
  return (
    <>
      {mobileOpen && <div className="fixed inset-0 z-30 bg-black/40 lg:hidden" onClick={onClose} />}
      <aside className={`fixed inset-y-0 left-0 z-40 flex flex-col bg-deep text-white transition-transform lg:translate-x-0 ${collapsed ? 'lg:w-[76px]' : 'lg:w-64'} w-64 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex h-16 items-center justify-between px-5">
          <span className="flex items-center gap-2 font-display text-xl font-bold"><Compass className="shrink-0" />{!collapsed && 'Wanderly'}</span>
          <button className="lg:hidden" onClick={onClose} aria-label="Close menu"><X /></button>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-2" aria-label="Main">
          {LINKS.map(([to, label, Icon]) => (
            <NavLink key={to} to={to} end={to === '/'} onClick={onClose} title={label}
              className={({ isActive }) => `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${isActive ? 'bg-white text-deep' : 'text-white/80 hover:bg-white/10'}`}>
              <Icon size={20} className="shrink-0" />{!collapsed && label}
            </NavLink>
          ))}
        </nav>
      </aside>
    </>
  );
}
