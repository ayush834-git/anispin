export type Anime = {
  id: number;
  title: string;
  poster: string;
  banner?: string | null;
  episodes?: number | null;
  status?: string | null;
  genres: string[];
  score?: number | null;
  popularity?: number | null;
};

export type Filters = {
  genre?: string;
  status?: "AIRING" | "FINISHED";
  seasonal?: boolean;
  classic?: boolean;
};

