export type Anime = {
  id: number;
  title: string;
  description: string;
  poster: string;
  banner?: string | null;
  trailer?: {
    id: string;
    site: string;
    thumbnail?: string | null;
  } | null;
  episodes?: number;
  status?: string;
  genres: string[];
  score?: number;
  popularity?: number;
  season?: string;
  seasonYear?: number;
  format?: string;
  relations?: {
    edges: Array<{
      relationType?: string;
      node: {
        id: number;
        title: string;
        poster: string;
        episodes?: number;
        status?: string;
        seasonYear?: number;
        format?: string;
      };
    }>;
  };
};

export type Filters = {
  genre?: string;
  status?: "AIRING" | "FINISHED";
  seasonal?: boolean;
  classic?: boolean;
  length?: "SHORT" | "MEDIUM" | "LONG" | "VERY_LONG" | "ONGOING";
};
