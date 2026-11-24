import { useEffect, useState } from 'react';
import { getPlaceImage } from '../services/destinationService';
import { addrText } from '../utils';

const done = new Map();    // key -> photo, or null when the place truly has none
const pending = new Map(); // key -> in-flight request, so repeated cards share one lookup

// Returns undefined while loading, null when there is no photo, or { url, title, link, credit }.
export function usePlaceImage(d) {
  const key = `${d.name}|${(+d.lat).toFixed(3)}|${(+d.lon).toFixed(3)}`;
  const [img, setImg] = useState(done.has(key) ? done.get(key) : undefined);

  useEffect(() => {
    if (done.has(key)) { setImg(done.get(key)); return undefined; }
    let live = true;
    if (!pending.has(key)) {
            const parts = addrText(d).split(',').map((x) => x.trim());
      const hint = parts[1];
      const country = parts.length > 1 ? parts[parts.length - 1] : '';
      pending.set(key, getPlaceImage(d, hint, country).catch(() => ({ unavailable: true })).then((v) => {
        if (!v?.unavailable) done.set(key, v); // failures are not remembered, so the next visit tries again
        pending.delete(key);
        return v;
      }));
    }
    pending.get(key).then((v) => live && setImg(v?.unavailable ? null : v));
    return () => { live = false; };
  }, [key]); // eslint-disable-line

  return img;
}