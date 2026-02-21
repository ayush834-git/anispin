export type Anime = {
  id: number;
  title: string;
  description: string;
  poster: string;
  banner?: string | null;
  episodes?: number;
  status?: string;
  genres: string[];
  score?: number;
  popularity?: number;
  season?: string;
  seasonYear?: number;
  format?: string;
};

export type Filters = {
  genre?: string;
  status?: "AIRING" | "FINISHED";
  seasonal?: boolean;
  classic?: boolean;
};
