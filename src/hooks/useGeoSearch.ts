import { useState, useRef } from 'react';
import { geoSearchApi } from '@/lib/api';
import type { GeoResult } from '@/types';

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
        const res = await geoSearchApi(q);
        setResults(res.results);
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
