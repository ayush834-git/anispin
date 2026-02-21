export type AnimeItem = {
  id: number;
  title: string;
  poster: string | null;
  dominantColor: string | null;
  episodes: number | null;
  status: string | null;
  genres: string[];
  score: number | null;
  popularity: number | null;
};

export type AnimeFilters = Record<string, string | number | boolean | undefined>;

export async function fetchAnime(filters: AnimeFilters): Promise<AnimeItem[]> {
  const params = new URLSearchParams(
    Object.entries(filters)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => [key, String(value)]),
  ).toString();

  const res = await fetch(`/api/anime?${params}`);
  if (!res.ok) {
    throw new Error("Failed to fetch anime");
  }

  return res.json() as Promise<AnimeItem[]>;
}

