import { useCallback, useRef, useState } from "react";

import { fetchAnime, type AnimeFilters, type AnimeItem } from "@/lib/anilist";

type SpinResult = {
  picked: AnimeItem;
  pickedIndex: number;
} | null;

function applyFilterList(list: AnimeItem[], filters: Record<string, unknown>) {
  return list.filter((anime) => {
    return (
      (!filters.genre || anime.genres.includes(String(filters.genre))) &&
      (!filters.completedOnly || anime.status === "FINISHED")
    );
  });
}

export function useSpinEngine() {
  const [animeList, setAnimeList] = useState<AnimeItem[]>([]);
  const [filteredList, setFilteredList] = useState<AnimeItem[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<AnimeItem | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadAnime = useCallback(async (filters: AnimeFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const list = await fetchAnime(filters);
      const filtered = applyFilterList(list, filters);
      setAnimeList(list);
      setFilteredList(filtered);
    } catch {
      setAnimeList([]);
      setFilteredList([]);
      setError("Unable to load anime. Try again later.");
    } finally {
      setIsLoading(false);
      setHasLoaded(true);
    }
  }, []);

  const applyFilters = useCallback((filters: Record<string, unknown>) => {
    const filtered = applyFilterList(animeList, filters);
    setFilteredList(filtered);
    return filtered;
  }, [animeList]);

  const weightedSelect = useCallback((list: AnimeItem[]) => {
    if (list.length === 0) return null;

    const weights = list.map((item) => {
      const popularity = item.popularity ?? 0;
      const score = item.score ?? 0;
      return 1 + (popularity * 0.5 + score * 0.3);
    });

    const sum = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * sum;
    for (let i = 0; i < list.length; i++) {
      r -= weights[i];
      if (r <= 0) return list[i];
    }
    return list[list.length - 1];
  }, []);

  const spin = useCallback((filters: Record<string, unknown>): SpinResult => {
    setIsSpinning(true);

    const filtered = applyFilterList(animeList, filters);
    setFilteredList(filtered);

    if (filtered.length === 0) {
      setSelectedAnime(null);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => setIsSpinning(false), 1800);
      return null;
    }

    const picked = weightedSelect(filtered);
    if (!picked) {
      setSelectedAnime(null);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => setIsSpinning(false), 1800);
      return null;
    }

    const pickedIndex = filtered.findIndex((anime) => anime.id === picked.id);
    setSelectedAnime(picked);
    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => setIsSpinning(false), 1800);

    return { picked, pickedIndex: Math.max(0, pickedIndex) };
  }, [animeList, weightedSelect]);

  return {
    animeList,
    filteredList,
    selectedAnime,
    isSpinning,
    isLoading,
    hasLoaded,
    error,
    loadAnime,
    applyFilters,
    spin,
  };
}
