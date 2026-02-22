import { useEffect, useMemo, useRef, useState } from "react";

import { buildAnimeFilters, fetchAnime } from "@/lib/anilist";
import { type Anime, type Filters } from "@/types/anime";

const animeQueryCache = new Map<string, Anime[]>();

function getFilterCacheKey(filters: Record<string, string | number | boolean>) {
  const entries = Object.entries(filters).sort(([a], [b]) => a.localeCompare(b));
  if (entries.length === 0) return "__all__";
  return entries.map(([key, value]) => `${key}:${String(value)}`).join("|");
}

export function useAnimeQuery(filters: Filters, debounceMs = 0) {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const normalizedFilters = useMemo(() => buildAnimeFilters(filters), [filters]);
  const cacheKey = useMemo(() => getFilterCacheKey(normalizedFilters), [normalizedFilters]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const cached = animeQueryCache.get(cacheKey);
    if (cached) {
      setAnimeList(cached);
      setError(null);
      setIsLoading(false);
      return () => {
        cancelled = true;
      };
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const list = await fetchAnime(normalizedFilters);
        if (cancelled || !mountedRef.current) return;
        animeQueryCache.set(cacheKey, list);
        setAnimeList(list);
      } catch {
        if (cancelled || !mountedRef.current) return;
        setAnimeList([]);
        setError("Unable to load anime. Try again later.");
      } finally {
        if (cancelled || !mountedRef.current) return;
        setIsLoading(false);
      }
    }, debounceMs);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [cacheKey, debounceMs, normalizedFilters]);

  return {
    animeList,
    isLoading,
    error,
  };
}

