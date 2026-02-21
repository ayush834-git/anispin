import { NextResponse } from "next/server";
import { gql, request } from "graphql-request";

import { type Anime } from "@/types/anime";

const endpoint = "https://graphql.anilist.co";

type AniListMedia = {
  id: number;
  title: {
    romaji: string | null;
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
        genre: $genre
        status: $status
        season: $season
        seasonYear: $seasonYear
        startDate_lesser: $yearLessThan
        sort: POPULARITY_DESC
      ) {
        id
        title {
          romaji
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

  const variables = {
    page: 1,
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
    const data = await request<AniListResponse>(endpoint, query, variables);

    const transformed: Anime[] = (data.Page?.media ?? []).flatMap((media) => {
      const poster = media.coverImage.extraLarge || media.coverImage.large;
      if (!poster) return [];

      return [
        {
          id: media.id,
          title: media.title.romaji || "Unknown Title",
          poster,
          banner: media.bannerImage || null,
          episodes: media.episodes,
          status: media.status,
          genres: media.genres,
          score: media.averageScore,
          popularity: media.popularity,
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
