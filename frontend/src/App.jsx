import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './context/AuthContext.jsx';
import MainLayout from './layouts/MainLayout.jsx';
import AuthLayout from './layouts/AuthLayout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Explore from './pages/Explore.jsx';
import DestinationDetails from './pages/DestinationDetails.jsx';
import MapExplorer from './pages/MapExplorer.jsx';
import Favorites from './pages/Favorites.jsx';
import Trips from './pages/Trips.jsx';
import Itinerary from './pages/Itinerary.jsx';
import RoutePlanner from './pages/RoutePlanner.jsx';
import TravelHistory from './pages/TravelHistory.jsx';
import Settings from './pages/Settings.jsx';

function Protected({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="grid h-screen place-items-center"><Spinner /></div>;
  return user ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route element={<AuthLayout />}><Route path="/login" element={<Login />} /></Route>
      <Route element={<Protected><MainLayout /></Protected>}>
        <Route index element={<Dashboard />} />
        <Route path="explore" element={<Explore />} />
        <Route path="destination" element={<DestinationDetails />} />
        <Route path="map" element={<MapExplorer />} />
        <Route path="favorites" element={<Favorites />} />
        <Route path="trips" element={<Trips />} />
        <Route path="itinerary" element={<Itinerary />} />
        <Route path="itinerary/:tripId" element={<Itinerary />} />
        <Route path="routes" element={<RoutePlanner />} />
        <Route path="history" element={<TravelHistory />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
