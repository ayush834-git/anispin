import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { buildAnimeFilters, fetchAnime } from "@/lib/anilist";
import { useAnimeQuery } from "@/hooks/useAnimeQuery";
import { type Anime, type Filters } from "@/types/anime";

type SpinResult = {
  picked: Anime;
  pickedIndex: number;
} | null;

const MIN_POOL_SIZE = 15;
const MIN_WHEEL_SLICES = 10;
const MAX_WHEEL_SLICES = 12;

function dedupeById(list: Anime[]) {
  const map = new Map<number, Anime>();
  for (const item of list) {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  }
  return Array.from(map.values());
}

function nextSeed(seed: number) {
  return (seed * 1664525 + 1013904223) >>> 0;
}

function shuffleBySeed<T>(list: T[], initialSeed: number) {
  const copy = [...list];
  let seed = initialSeed;
  for (let i = copy.length - 1; i > 0; i -= 1) {
    seed = nextSeed(seed);
    const randomIndex = seed % (i + 1);
    [copy[i], copy[randomIndex]] = [copy[randomIndex], copy[i]];
  }
  return copy;
}

function buildWheelPool(list: Anime[], seed: number) {
  if (list.length === 0) return [];

  const randomized = shuffleBySeed(list, seed);
  const dynamicCount = MIN_WHEEL_SLICES + (seed % (MAX_WHEEL_SLICES - MIN_WHEEL_SLICES + 1));
  const sliceCount = Math.min(randomized.length, dynamicCount);
  return randomized.slice(0, sliceCount);
}

function seedFromKey(key: string) {
  let hash = 2166136261;
  for (let index = 0; index < key.length; index += 1) {
    hash ^= key.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) || 1;
}

function matchesGenre(anime: Anime, genre?: string) {
  if (!genre) return true;
  return anime.genres.includes(genre);
}

function matchesStatus(anime: Anime, status?: Filters["status"]) {
  if (!status) return true;
  if (status === "AIRING") return anime.status === "RELEASING";
  return anime.status === "FINISHED";
}

function getLengthRange(length?: Filters["length"]) {
  if (!length || length === "ONGOING") return null;

  if (length === "SHORT") return { min: 1, max: 12 };
  if (length === "MEDIUM") return { min: 13, max: 26 };
  if (length === "LONG") return { min: 27, max: 100 };
  if (length === "VERY_LONG") return { min: 101, max: Number.POSITIVE_INFINITY };

  return null;
}

function matchesLength(anime: Anime, length?: Filters["length"], tolerance = 0) {
  if (!length) return true;

  if (length === "ONGOING") {
    return anime.status === "RELEASING";
  }

  const range = getLengthRange(length);
  if (!range) return true;
  if (!anime.episodes) return false;

  const minimum = Math.max(1, range.min - tolerance);
  const maximum = Number.isFinite(range.max) ? range.max + tolerance : range.max;
  if (anime.episodes < minimum) return false;
  if (Number.isFinite(maximum) && anime.episodes > maximum) return false;
  return true;
}

function prioritizeEntryLevel(list: Anime[]) {
  const nonPrequelEntries = list.filter((anime) => !anime.hasPrequel);
  if (nonPrequelEntries.length >= MIN_POOL_SIZE) {
    return nonPrequelEntries;
  }

  const prequelEntries = list.filter((anime) => anime.hasPrequel);
  return [...nonPrequelEntries, ...prequelEntries];
}

export function useSpinEngine(filters: Filters) {
  const queryFilters = useMemo<Filters>(
    () => ({
      genre: filters.genre,
      status: filters.status,
      seasonal: filters.seasonal,
      classic: filters.classic,
    }),
    [filters.classic, filters.genre, filters.seasonal, filters.status],
  );

  const normalizedQueryFilters = useMemo(() => buildAnimeFilters(queryFilters), [queryFilters]);
  const queryFilterKey = useMemo(() => {
    const entries = Object.entries(normalizedQueryFilters).sort(([a], [b]) => a.localeCompare(b));
    if (entries.length === 0) return "__all__";
    return entries.map(([key, value]) => `${key}:${String(value)}`).join("|");
  }, [normalizedQueryFilters]);

  const { animeList, isLoading, error } = useAnimeQuery(queryFilters, 400);
  const [extraPageState, setExtraPageState] = useState<{ key: string; list: Anime[] }>({
    key: "",
    list: [],
  });
  const [selectedAnime, setSelectedAnime] = useState<Anime | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const spinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestedExtraKeysRef = useRef<Set<string>>(new Set());
  const isFetchingExtraRef = useRef(false);

  const extraAnimeList = useMemo(
    () => (extraPageState.key === queryFilterKey ? extraPageState.list : []),
    [extraPageState, queryFilterKey],
  );

  const sourceAnimeList = useMemo(
    () => dedupeById([...animeList, ...extraAnimeList]),
    [animeList, extraAnimeList],
  );

  const strictBaseList = useMemo(
    () =>
      sourceAnimeList.filter(
        (anime) =>
          matchesGenre(anime, filters.genre) &&
          matchesStatus(anime, filters.status) &&
          matchesLength(anime, filters.length),
      ),
    [filters.genre, filters.length, filters.status, sourceAnimeList],
  );

  const relaxedBaseList = useMemo(
    () =>
      sourceAnimeList.filter(
        (anime) =>
          matchesGenre(anime, filters.genre) &&
          matchesStatus(anime, filters.status) &&
          matchesLength(anime, filters.length, 5),
      ),
    [filters.genre, filters.length, filters.status, sourceAnimeList],
  );

  const strictFilteredList = useMemo(
    () => prioritizeEntryLevel(strictBaseList),
    [strictBaseList],
  );

  const relaxedFilteredList = useMemo(
    () => prioritizeEntryLevel(relaxedBaseList),
    [relaxedBaseList],
  );

  const filteredList = useMemo(() => {
    if (strictFilteredList.length >= MIN_POOL_SIZE) {
      return strictFilteredList;
    }
    return relaxedFilteredList;
  }, [relaxedFilteredList, strictFilteredList]);

  useEffect(() => {
    if (isLoading || error || isFetchingExtraRef.current) return;
    if (filteredList.length >= MIN_POOL_SIZE) return;
    if (requestedExtraKeysRef.current.has(queryFilterKey)) return;

    requestedExtraKeysRef.current.add(queryFilterKey);
    isFetchingExtraRef.current = true;
    let cancelled = false;

    void fetchAnime({
      ...normalizedQueryFilters,
      pageStart: 3,
      pages: 1,
    })
      .then((list) => {
        if (cancelled) return;
        setExtraPageState((previous) => {
          if (previous.key !== queryFilterKey) {
            return { key: queryFilterKey, list: dedupeById(list) };
          }

          return { key: queryFilterKey, list: dedupeById([...previous.list, ...list]) };
        });
      })
      .catch((err) => {
        console.error("useSpinEngine: fetchAnime extra page failed", err);
      })
      .finally(() => {
        isFetchingExtraRef.current = false;
      });

    return () => {
      cancelled = true;
    };
  }, [error, filteredList.length, isLoading, normalizedQueryFilters, queryFilterKey]);

  const wheelSeed = useMemo(() => seedFromKey(queryFilterKey), [queryFilterKey]);

  const wheelPool = useMemo(() => {
    return buildWheelPool(filteredList, wheelSeed);
  }, [filteredList, wheelSeed]);

  useEffect(() => {
    return () => {
      if (spinTimerRef.current) {
        clearTimeout(spinTimerRef.current);
      }
    };
  }, []);

  const spin = useCallback(
    (candidateList?: Anime[], spinDurationMs = 2200): SpinResult => {
      const sourceList = candidateList && candidateList.length > 0 ? candidateList : filteredList;
      setIsSpinning(true);

      if (sourceList.length === 0) {
        setSelectedAnime(null);
        setSelectedIndex(null);
        if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
        spinTimerRef.current = setTimeout(() => {
          setIsSpinning(false);
        }, spinDurationMs);
        return null;
      }

      const pickedIndex = Math.floor(Math.random() * sourceList.length);
      const picked = sourceList[pickedIndex];
      setSelectedAnime(picked);
      setSelectedIndex(pickedIndex);

      if (spinTimerRef.current) clearTimeout(spinTimerRef.current);
      spinTimerRef.current = setTimeout(() => {
        setIsSpinning(false);
      }, spinDurationMs);

      return {
        picked,
        pickedIndex,
      };
    },
    [filteredList],
  );

  return useMemo(
    () => ({
      animeList: sourceAnimeList,
      filteredList,
      wheelPool,
      selectedAnime,
      selectedIndex,
      isLoading,
      error,
      isSpinning,
      spin,
    }),
    [
      error,
      filteredList,
      isLoading,
      isSpinning,
      selectedAnime,
      selectedIndex,
      sourceAnimeList,
      spin,
      wheelPool,
    ],
  );
}
