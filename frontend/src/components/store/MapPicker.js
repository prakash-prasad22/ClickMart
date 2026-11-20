'use client';

import { useEffect, useRef, useState } from 'react';
import { LocateFixed, Search, MapPinOff, MapPin } from 'lucide-react';
import { loadGoogleMaps, parseGeocode, hasMapsKey } from '@/lib/google-maps';
import { Spinner } from '@/components/ui';

const PATNA = { lat: 25.5941, lng: 85.1376 };

/**
 * Pin-drop delivery location picker.
 * - Search an area / landmark (Geocoding API, restricted to India)
 * - Drag the map; the pin stays centred, like delivery apps
 * - "Use my location" via the browser Geolocation API
 * Calls onChange({ location, ...parsedAddress }) after every move.
 */
export default function MapPicker({ value, onChange, center = PATNA }) {
  const mapEl = useRef(null);
  const mapRef = useRef(null);
  const geocoderRef = useRef(null);
  const [status, setStatus] = useState(hasMapsKey() ? 'loading' : 'nokey');
  const [query, setQuery] = useState('');
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [label, setLabel] = useState(value?.formattedAddress || '');
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    if (!hasMapsKey()) return undefined;
    let cancelled = false;
    loadGoogleMaps()
      .then(async (maps) => {
        if (cancelled || !mapEl.current) return;
        const start = value?.location?.lat ? value.location : center;
        const map = new maps.Map(mapEl.current, {
          center: start,
          zoom: 16,
          disableDefaultUI: true,
          zoomControl: true,
          clickableIcons: false,
          gestureHandling: 'greedy',
          styles: [
            { featureType: 'poi.business', stylers: [{ visibility: 'off' }] },
            { elementType: 'geometry', stylers: [{ saturation: -30 }] },
          ],
        });
        mapRef.current = map;
        geocoderRef.current = new maps.Geocoder();

        map.addListener('dragstart', () => setDragging(true));
        map.addListener('idle', () => {
          setDragging(false);
          const c = map.getCenter();
          reverse({ lat: c.lat(), lng: c.lng() });
        });
        setStatus('ready');
      })
      .catch(() => !cancelled && setStatus('error'));
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reverse = (location) => {
    geocoderRef.current?.geocode({ location }, (results, st) => {
      if (st === 'OK' && results?.[0]) {
        const parsed = parseGeocode(results[0]);
        setLabel(parsed.formattedAddress);
        onChangeRef.current?.({ location, ...parsed });
      } else {
        onChangeRef.current?.({ location });
      }
    });
  };

  const search = (e) => {
    e.preventDefault();
    if (!query.trim() || !geocoderRef.current) return;
    setBusy(true);
    geocoderRef.current.geocode({ address: query, componentRestrictions: { country: 'IN' } }, (results, st) => {
      setBusy(false);
      if (st === 'OK' && results?.[0]) {
        mapRef.current.panTo(results[0].geometry.location);
        mapRef.current.setZoom(17);
      }
    });
  };

  const locate = () => {
    if (!navigator.geolocation) return;
    setBusy(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false);
        mapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        mapRef.current?.setZoom(18);
      },
      () => setBusy(false),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (status === 'nokey' || status === 'error') {
    return (
      <div className="flex items-center gap-3 rounded-2xl border border-dashed border-line bg-surface-alt/50 p-4 text-sm text-muted">
        <MapPinOff size={18} className="shrink-0" />
        {status === 'nokey'
          ? 'Map pin-drop will appear here once NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is set. You can still enter the address below.'
          : 'Couldn’t load the map right now. Please enter your address below.'}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-line">
      <form onSubmit={search} className="flex items-center gap-2 border-b border-line bg-surface p-2">
        <Search size={16} className="ml-2 text-muted" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search area, street or landmark" className="h-9 flex-1 bg-transparent text-sm outline-none" />
        {busy && <Spinner size={16} className="text-muted" />}
        <button type="button" onClick={locate} className="btn btn-outline btn-sm h-8 px-3 text-xs">
          <LocateFixed size={14} /> My location
        </button>
      </form>
      <div className="relative h-64 bg-surface-alt">
        <div ref={mapEl} className="absolute inset-0" />
        {status === 'loading' && <div className="absolute inset-0 flex items-center justify-center"><Spinner className="text-muted" /></div>}
        {status === 'ready' && (
          <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-full">
            <MapPin size={38} className={`fill-primary text-white drop-shadow-lg transition-transform duration-300 ${dragging ? '-translate-y-2' : ''}`} strokeWidth={1.5} />
            <span className={`mx-auto block h-1.5 w-3 rounded-full bg-ink/30 transition-all duration-300 ${dragging ? 'scale-150 opacity-40' : ''}`} />
          </div>
        )}
      </div>
      {label && <p className="flex items-start gap-2 border-t border-line bg-surface px-4 py-3 text-xs text-ink-soft"><MapPin size={14} className="mt-0.5 shrink-0 text-primary" />{label}</p>}
    </div>
  );
}
