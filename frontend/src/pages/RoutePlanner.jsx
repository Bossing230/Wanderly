import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import RoutePanel from '../components/RoutePanel.jsx';
import DestinationMap from '../components/DestinationMap.jsx';
import { PageHeader } from '../components/ui.jsx';

export default function RoutePlanner() {
  const [sp] = useSearchParams();
  const pre = (p) => (sp.get(`${p}Lat`) ? { name: sp.get(`${p}Name`) || 'Selected place', lat: +sp.get(`${p}Lat`), lon: +sp.get(`${p}Lon`) } : null);
  const [stops, setStops] = useState([pre('from'), pre('to')]);
  const [route, setRoute] = useState(null);
  const markers = stops.map((s, i) => s && { id: `s${i}`, ...s, kind: 'stop' }).filter(Boolean);
  const first = markers[0];
  return (
    <>
      <PageHeader title="Route planner" subtitle="Pick a start, a destination, and any stops in between." />
      <div className="grid gap-6 lg:grid-cols-[380px_1fr]">
        <RoutePanel stops={stops} setStops={(s) => { setStops(s); setRoute(null); }} onRoute={setRoute} />
        <DestinationMap markers={markers} path={route?.path} flyTo={first && [first.lat, first.lon]} className="h-[600px]" linkPopups={false} />
      </div>
    </>
  );
}
