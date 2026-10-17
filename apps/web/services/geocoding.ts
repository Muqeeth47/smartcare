/**
 * Geocoding service — wraps OpenStreetMap Nominatim (search and reverse lookup)
 */

import type { GeoCoordinates } from '@smartcare/types';

const NOMINATIM_BASE = 'https://nominatim.openstreetmap.org';

export async function geocodeLocation(query: string): Promise<GeoCoordinates | null> {
  try {
    const url = `${NOMINATIM_BASE}/search?format=json&q=${encodeURIComponent(query)}&limit=1&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data?.length) return null;
    const r = data[0];
    return {
      lat: parseFloat(r.lat),
      lng: parseFloat(r.lon),
      bbox: r.boundingbox,
      displayName: r.display_name,
      country: r.address?.country,
      state: r.address?.state,
      city: r.address?.city || r.address?.town || r.address?.village,
    };
  } catch {
    return null;
  }
}

export async function reverseGeocode(lat: number, lng: number): Promise<GeoCoordinates | null> {
  try {
    const url = `${NOMINATIM_BASE}/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`;
    const res = await fetch(url, { headers: { 'Accept-Language': 'en' } });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      lat, lng,
      displayName: data.display_name,
      country: data.address?.country,
      state: data.address?.state,
      city: data.address?.city || data.address?.town || data.address?.village,
    };
  } catch {
    return null;
  }
}

