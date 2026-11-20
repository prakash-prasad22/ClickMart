// Loads the Google Maps JS API once. Requires NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
// with "Maps JavaScript API" + "Geocoding API" enabled.
let loader = null;

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
export const hasMapsKey = () => !!MAPS_KEY && !MAPS_KEY.startsWith('<');

export function loadGoogleMaps() {
  if (typeof window === 'undefined') return Promise.reject(new Error('No window'));
  if (window.google?.maps?.Map) return Promise.resolve(window.google.maps);
  if (!hasMapsKey()) return Promise.reject(new Error('Google Maps API key is not configured'));
  if (loader) return loader;

  loader = new Promise((resolve, reject) => {
    const cb = `__cmMapsReady${Date.now()}`;
    window[cb] = () => {
      resolve(window.google.maps);
      delete window[cb];
    };
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}&v=weekly&loading=async&callback=${cb}`;
    s.async = true;
    s.onerror = () => {
      loader = null;
      reject(new Error('Could not load Google Maps'));
    };
    document.head.appendChild(s);
  });
  return loader;
}

/** Convert a Geocoder result into our address fields. */
export function parseGeocode(result) {
  const get = (type, short = false) => {
    const c = result.address_components.find((x) => x.types.includes(type));
    return c ? (short ? c.short_name : c.long_name) : '';
  };
  const area = [get('premise'), get('sublocality_level_2'), get('sublocality_level_1') || get('neighborhood')].filter(Boolean).join(', ');
  return {
    line2: area || [get('street_number'), get('route')].filter(Boolean).join(' '),
    city: get('locality') || get('administrative_area_level_2'),
    state: get('administrative_area_level_1'),
    pincode: get('postal_code'),
    country: get('country') || 'India',
    formattedAddress: result.formatted_address,
  };
}
