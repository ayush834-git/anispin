export type Anime = {
  id: number;
  title: string;
  description: string;
  poster: string;
  banner?: string | null;
  episodes?: number;
  duration?: number;
  status?: string;
  genres: string[];
  score?: number;
  popularity?: number;
  season?: string;
  seasonYear?: number;
  format?: string;
  franchiseStatus?: "ONGOING" | "RETURNING" | "CONCLUDED";
  hasPrequel?: boolean;
};

export type Filters = {
  genre?: string;
  status?: "AIRING" | "FINISHED";
  seasonal?: boolean;
  classic?: boolean;
  length?: "SHORT" | "MEDIUM" | "LONG" | "VERY_LONG" | "ONGOING";
};
