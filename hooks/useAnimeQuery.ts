import { useEffect, useMemo, useRef, useState } from "react";

import { buildAnimeFilters, fetchAnime } from "@/lib/anilist";
import { type Anime, type Filters } from "@/types/anime";

type CacheEntry = { value: Anime[]; ts: number };

const MAX_CACHE_SIZE = 200;
const CACHE_TTL_MS = 1000 * 60 * 5;

const animeQueryCache = new Map<string, CacheEntry>();

function setCacheEntry(key: string, list: Anime[]) {
  if (animeQueryCache.has(key)) {
    animeQueryCache.delete(key);
  }
  animeQueryCache.set(key, { value: list, ts: Date.now() });

  while (animeQueryCache.size > MAX_CACHE_SIZE) {
    const oldestKey = animeQueryCache.keys().next().value;
    if (!oldestKey) break;
    animeQueryCache.delete(oldestKey);
  }
}

function getCacheEntry(key: string, ttlMs = CACHE_TTL_MS): Anime[] | undefined {
  const entry = animeQueryCache.get(key);
  if (!entry) return undefined;

  if (Date.now() - entry.ts > ttlMs) {
    animeQueryCache.delete(key);
    return undefined;
  }

  animeQueryCache.delete(key);
  animeQueryCache.set(key, entry);
  return entry.value;
}

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
    const cached = getCacheEntry(cacheKey);
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
        setCacheEntry(cacheKey, list);
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

