import { type Anime, type Filters } from "@/types/anime";

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month <= 2 || month === 12) return "WINTER";
  if (month <= 5) return "SPRING";
  if (month <= 8) return "SUMMER";
  return "FALL";
}

export function buildAnimeFilters(filters: Filters): Record<string, string | number | boolean> {
  const queryFilters: Record<string, string | number | boolean> = {};

  if (filters.genre) {
    queryFilters.genre = filters.genre;
  }

  if (filters.status) {
    queryFilters.status = filters.status;
  }

  if (filters.seasonal) {
    queryFilters.seasonal = true;
    queryFilters.season = getCurrentSeason();
    queryFilters.seasonYear = new Date().getFullYear();
  }

  if (filters.classic) {
    queryFilters.classic = true;
    queryFilters.yearLessThan = 2010;
  }

  return queryFilters;
}

export async function fetchAnime(
  filters: Record<string, string | number | boolean | undefined>,
): Promise<Anime[]> {
  const query = new URLSearchParams(
    Object.entries(filters).reduce<Record<string, string>>((acc, [key, value]) => {
      if (value === undefined || value === null || value === "") return acc;
      acc[key] = String(value);
      return acc;
    }, {}),
  ).toString();

  const res = await fetch(`/api/anime?${query}`);
  if (!res.ok) throw new Error("Failed to fetch anime");
  return res.json() as Promise<Anime[]>;
}
