import { NextResponse } from "next/server";
import { gql, request } from "graphql-request";

import { type Anime } from "@/types/anime";

const endpoint = "https://graphql.anilist.co";

type AniListMedia = {
  id: number;
  title: {
    english: string | null;
    romaji: string | null;
    native: string | null;
  };
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  bannerImage: string | null;
  episodes: number | null;
  status: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  season: string | null;
  seasonYear: number | null;
  format: string | null;
};

type AniListResponse = {
  Page: {
    media: AniListMedia[];
  };
};

function getCurrentSeason() {
  const month = new Date().getMonth() + 1;
  if (month <= 2 || month === 12) return "WINTER";
  if (month <= 5) return "SPRING";
  if (month <= 8) return "SUMMER";
  return "FALL";
}

const query = gql`
  query (
    $page: Int
    $perPage: Int
    $genre: String
    $status: MediaStatus
    $season: MediaSeason
    $seasonYear: Int
    $yearLessThan: FuzzyDateInt
  ) {
    Page(page: $page, perPage: $perPage) {
      media(
        type: ANIME
        format: TV
        genre: $genre
        status: $status
        season: $season
        seasonYear: $seasonYear
        startDate_lesser: $yearLessThan
        sort: POPULARITY_DESC
      ) {
        id
        title {
          english
          romaji
          native
        }
        coverImage {
          extraLarge
          large
        }
        bannerImage
        episodes
        status
        genres
        averageScore
        popularity
        season
        seasonYear
        format
      }
    }
  }
`;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const genre = searchParams.get("genre") ?? undefined;
  const seasonal = searchParams.get("seasonal") === "true";
  const classic = searchParams.get("classic") === "true";

  const rawStatus = searchParams.get("status");
  const status =
    rawStatus === "AIRING"
      ? "RELEASING"
      : rawStatus === "FINISHED"
        ? "FINISHED"
        : undefined;

  let season = searchParams.get("season") ?? undefined;
  let seasonYear = searchParams.get("seasonYear")
    ? Number(searchParams.get("seasonYear"))
    : undefined;

  if (seasonal) {
    season = getCurrentSeason();
    seasonYear = new Date().getFullYear();
  }

  const yearLessThanParam = searchParams.get("yearLessThan");
  const yearLessThanValue = yearLessThanParam ? Number(yearLessThanParam) : undefined;
  const yearThreshold = classic ? 2010 : yearLessThanValue;
  const yearLessThan =
    typeof yearThreshold === "number" && Number.isFinite(yearThreshold)
      ? yearThreshold * 10000 + 101
      : undefined;

  const pageStartParam = Number(searchParams.get("pageStart") ?? 1);
  const pagesParam = Number(searchParams.get("pages") ?? 2);
  const pageStart =
    Number.isFinite(pageStartParam) && pageStartParam > 0 ? Math.floor(pageStartParam) : 1;
  const pages =
    Number.isFinite(pagesParam) && pagesParam > 0
      ? Math.min(3, Math.floor(pagesParam))
      : 2;

  const baseVariables = {
    perPage: 50,
    genre,
    status,
    season,
    seasonYear:
      typeof seasonYear === "number" && Number.isFinite(seasonYear)
        ? seasonYear
        : undefined,
    yearLessThan,
  };

  try {
    const pageRequests = Array.from({ length: pages }, (_, index) =>
      request<AniListResponse>(endpoint, query, {
        ...baseVariables,
        page: pageStart + index,
      }),
    );
    const pageData = await Promise.all(pageRequests);

    const mediaById = new Map<number, AniListMedia>();
    for (const response of pageData) {
      for (const media of response.Page?.media ?? []) {
        if (!mediaById.has(media.id)) {
          mediaById.set(media.id, media);
        }
      }
    }

    const transformed: Anime[] = Array.from(mediaById.values()).flatMap((media) => {
      const poster = media.coverImage.extraLarge || media.coverImage.large;
      if (!poster) return [];

      return [
        {
          id: media.id,
          title:
            media.title.english ||
            media.title.romaji ||
            media.title.native ||
            "Unknown Title",
          description: "",
          poster,
          banner: media.bannerImage || null,
          episodes: media.episodes ?? undefined,
          status: media.status ?? undefined,
          genres: media.genres,
          score: media.averageScore ?? undefined,
          popularity: media.popularity ?? undefined,
          season: media.season ?? undefined,
          seasonYear: media.seasonYear ?? undefined,
          format: media.format ?? undefined,
        },
      ];
    });

    return NextResponse.json(transformed, {
      status: 200,
      headers: {
        "Cache-Control": "s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "AniList request failed" }, { status: 500 });
  }
}
