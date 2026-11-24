import { Navigate, Outlet } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { useAuth } from '../context/AuthContext.jsx';

export default function AuthLayout() {
  const { user, loading } = useAuth();
  if (!loading && user) return <Navigate to="/" replace />;
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="relative hidden overflow-hidden bg-deep p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="flex items-center gap-2 text-2xl font-bold font-display"><Compass /> Wanderly</div>
        <div>
          <h2 className="max-w-md text-5xl font-bold leading-tight">Pick a place. Plan the days. Go.</h2>
          <p className="mt-4 max-w-md text-white/80">Search anywhere on the map, find what's worth seeing nearby, check the weather, and turn it all into a trip.</p>
        </div>
        <svg className="absolute -right-16 -top-16 opacity-20" width="420" height="420" viewBox="0 0 420 420" fill="none" stroke="white" aria-hidden="true">
          {[60, 110, 160, 210].map((r) => <circle key={r} cx="210" cy="210" r={r} strokeWidth="1.5" />)}
          <path d="M210 0v420M0 210h420" strokeWidth="1.5" />
        </svg>
      </div>
      <div className="grid place-items-center p-6"><Outlet /></div>
    </div>
  );
}
