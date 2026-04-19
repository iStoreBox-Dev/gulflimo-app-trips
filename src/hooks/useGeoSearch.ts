import { useState, useRef } from 'react';
import { geoSearchApi } from '@/lib/api';
import type { GeoResult } from '@/types';

const MAPBOX_TOKEN = process.env.EXPO_PUBLIC_MAPBOX_TOKEN || process.env.MAPBOX_TOKEN;
const USE_NOMINATIM = true; // prefer OpenStreetMap Nominatim (free)

export function useGeoSearch() {
  const [results, setResults] = useState<GeoResult[]>([]);
  const [loading, setLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const search = (q: string) => {
    if (timerRef.current) clearTimeout(timerRef.current);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    timerRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        if (USE_NOMINATIM) {
          const url = `https://nominatim.openstreetmap.org/search?format=json&limit=5&q=${encodeURIComponent(
            q
          )}`;
          const r = await fetch(url, {
            headers: {
              'Accept-Language': 'en',
            },
          });
          const json = await r.json();
          const mapped: GeoResult[] = (json || []).map((f: any) => ({
            display_name: f.display_name,
            lat: String(f.lat),
            lon: String(f.lon),
          }));
          setResults(mapped);
        } else if (MAPBOX_TOKEN) {
          const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
            q
          )}.json?access_token=${MAPBOX_TOKEN}&autocomplete=true&limit=5`;
          const r = await fetch(url);
          const json = await r.json();
          const mapped: GeoResult[] = (json.features || []).map((f: any) => ({
            display_name: f.place_name,
            lat: String(f.center[1]),
            lon: String(f.center[0]),
          }));
          setResults(mapped);
        } else {
          const res = await geoSearchApi(q);
          setResults(res.results);
        }
      } catch {
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const clear = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setResults([]);
  };

  return { results, loading, search, clear };
}
