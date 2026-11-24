import { useEffect } from 'react';
import { MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { destUrl, prettyCat } from '../utils';

// CARTO Voyager shows English/Latin place names. Without a key we fall back to plain OpenStreetMap.
const CARTO_KEY = import.meta.env.VITE_CARTO_KEY || 'cb1_5ew1_1_924081fc78f424b6065cf0b4';
const TILES = CARTO_KEY
  ? {
      url: `https://basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attributions">CARTO</a>',
    }
  : {
      url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };

const COLORS = { destination: '#0E7C86', attraction: '#F2A93B', stop: '#E4572E' };
const pin = (kind, active) => {
  const s = active ? 32 : 24;
  return L.divIcon({
    className: '', iconSize: [s, s], iconAnchor: [s / 2, s],
    html: `<div style="width:${s}px;height:${s}px;background:${COLORS[kind] || COLORS.destination};border:3px solid #fff;border-radius:50% 50% 50% 0;transform:rotate(-45deg);box-shadow:0 2px 6px rgba(0,0,0,.4)"></div>`,
  });
};

function Controller({ center, zoom, path }) {
  const map = useMap();
  useEffect(() => { if (path?.length > 1) map.fitBounds(path, { padding: [40, 40] }); }, [path, map]);
  useEffect(() => { if (center && !(path?.length > 1)) map.flyTo(center, zoom ?? map.getZoom(), { duration: 0.8 }); }, [center?.[0], center?.[1]]); // eslint-disable-line
  return null;
}

// markers: [{ id, lat, lon, name, category, kind }]
export default function DestinationMap({ markers = [], selectedId, onSelect, center = [12.8, 122], zoom = 5, flyTo, flyZoom, bounds, path, className = 'h-[480px]', linkPopups = true }) {
  return (
    <MapContainer center={center} zoom={zoom} bounds={bounds} boundsOptions={{ padding: [40, 40], maxZoom: 15 }} scrollWheelZoom className={`w-full ${className}`}>
      <TileLayer attribution={TILES.attribution} url={TILES.url} maxZoom={20} />
      <Controller center={flyTo} zoom={flyZoom ?? (zoom === 5 ? 12 : undefined)} path={path} />
      {markers.map((m) => (
        <Marker key={m.id} position={[m.lat, m.lon]} icon={pin(m.kind, m.id === selectedId)} eventHandlers={{ click: () => onSelect?.(m) }}>
          <Popup>
            <strong>{m.name}</strong>
            <div className="text-xs capitalize">{prettyCat(m.category)}</div>
            {linkPopups && m.kind !== 'stop' && <Link to={destUrl(m)} className="text-xs font-semibold text-sea">View details</Link>}
          </Popup>
        </Marker>
      ))}
      {path?.length > 1 && <Polyline positions={path} pathOptions={{ color: '#0E7C86', weight: 5, opacity: 0.85 }} />}
    </MapContainer>
  );
}