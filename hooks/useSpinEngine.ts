import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useAnimeQuery } from "@/hooks/useAnimeQuery";
import { type Anime, type Filters } from "@/types/anime";

type SpinResult = {
  picked: Anime;
  pickedIndex: number;
} | null;

function matchesGenre(anime: Anime, genre?: string) {
  if (!genre) return true;
  return anime.genres.includes(genre);
}

function matchesStatus(anime: Anime, status?: Filters["status"]) {
  if (!status) return true;
  if (status === "AIRING") return anime.status === "RELEASING";
  return anime.status === "FINISHED";
}

function matchesLength(anime: Anime, length?: Filters["length"]) {
  if (!length) return true;

  if (length === "ONGOING") {
    return anime.status === "RELEASING";
  }

  if (!anime.episodes) return false;

  if (length === "SHORT") return anime.episodes <= 12;
  if (length === "MEDIUM") return anime.episodes >= 13 && anime.episodes <= 26;
  if (length === "LONG") return anime.episodes >= 27 && anime.episodes <= 100;
  if (length === "VERY_LONG") return anime.episodes > 100;

  return true;
}

export function useSpinEngine(filters: Filters) {
  const queryFilters = useMemo<Filters>(() => ({
    genre: filters.genre,
    status: filters.status,
    seasonal: filters.seasonal,
    classic: filters.classic,
  }), [filters.classic, filters.genre, filters.seasonal, filters.status]);

  const { animeList, isLoading, error } = useAnimeQuery(queryFilters, 400);
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filteredList = useMemo(
    () =>
      animeList.filter(
        (anime) =>
          matchesGenre(anime, filters.genre) &&
          matchesStatus(anime, filters.status) &&
          matchesLength(anime, filters.length),
      ),
    [animeList, filters.genre, filters.length, filters.status],
  );

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

  const spin = useCallback((candidateList?: Anime[], spinDurationMs = 2200): SpinResult => {
    const sourceList = candidateList && candidateList.length > 0 ? candidateList : filteredList;
    setIsSpinning(true);

    if (sourceList.length === 0) {
      setSelectedAnime(null);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => setIsSpinning(false), spinDurationMs);
      return null;
    }

    const picked = weightedSelect(sourceList);
    if (!picked) {
      setSelectedAnime(null);
      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => setIsSpinning(false), spinDurationMs);
      return null;
    }

    const pickedIndex = sourceList.findIndex((anime) => anime.id === picked.id);
    setSelectedAnime(picked);

    if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
    spinTimerRef.current = setTimeout(() => setIsSpinning(false), spinDurationMs);

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
