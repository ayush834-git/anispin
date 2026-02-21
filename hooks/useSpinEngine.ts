import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAnimeQuery } from "@/hooks/useAnimeQuery";
import { type Anime, type Filters } from "@/types/anime";

type SpinResult = {
  picked: Anime;
  pickedIndex: number;
} | null;

export function useSpinEngine(filters: Filters) {
  const { animeList, isLoading, error } = useAnimeQuery(filters, 400);
  const [filteredList, setFilteredList] = useState<Anime[]>([]);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setFilteredList(animeList);
  }, [animeList]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  const weightedSelect = useCallback((list: Anime[]) => {
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

  const spin = useCallback((): SpinResult => {
    setIsSpinning(true);

    if (filteredList.length === 0) {
      setSelectedAnime(null);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => setIsSpinning(false), 1800);
      return null;
    }

    const picked = weightedSelect(filteredList);
    if (!picked) {
      setSelectedAnime(null);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => setIsSpinning(false), 1800);
      return null;
    }

    const pickedIndex = filteredList.findIndex((anime) => anime.id === picked.id);
    setSelectedAnime(picked);

    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => setIsSpinning(false), 1800);

    return {
      picked,
      pickedIndex: Math.max(0, pickedIndex),
    };
  }, [filteredList, weightedSelect]);

  return useMemo(() => ({
    animeList,
    filteredList,
    selectedAnime,
    isLoading,
    error,
    isSpinning,
    spin,
  }), [animeList, filteredList, selectedAnime, isLoading, error, isSpinning, spin]);
}

