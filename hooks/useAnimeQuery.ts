import { useEffect, useMemo, useRef, useState } from "react";

import { buildAnimeFilters, fetchAnime } from "@/lib/anilist";
import { type Anime, type Filters } from "@/types/anime";

export function useAnimeQuery(filters: Filters, debounceMs = 0) {
  const [animeList, setAnimeList] = useState<Anime[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const normalizedFilters = useMemo(() => buildAnimeFilters(filters), [filters]);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(async () => {
      setIsLoading(true);
      setError(null);

      try {
        const list = await fetchAnime(normalizedFilters);
        if (cancelled || !mountedRef.current) return;
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
  }, [debounceMs, normalizedFilters]);

  return {
    animeList,
    isLoading,
    error,
  };
}

