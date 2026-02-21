import { NextResponse } from "next/server";
import { gql, request } from "graphql-request";
import { z } from "zod";

const endpoint = "https://graphql.anilist.co";

const mediaStatusSchema = z.enum([
  "FINISHED",
  "RELEASING",
  "NOT_YET_RELEASED",
  "CANCELLED",
  "HIATUS",
]);

const mediaSeasonSchema = z.enum(["WINTER", "SPRING", "SUMMER", "FALL"]);

type AniListMedia = {
  id: number;
  title: {
    romaji: string | null;
    english: string | null;
  };
  coverImage: {
    large: string | null;
    extraLarge: string | null;
    color: string | null;
  };
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
          english
        }
        coverImage {
          large
          extraLarge
          color
        }
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

  const rawStatus = searchParams.get("status") ?? undefined;
  const status = rawStatus && mediaStatusSchema.safeParse(rawStatus).success
    ? rawStatus
    : undefined;

  const rawSeason = searchParams.get("season") ?? undefined;
  const season = rawSeason && mediaSeasonSchema.safeParse(rawSeason).success
    ? rawSeason
    : undefined;

  const seasonYearParam = searchParams.get("seasonYear");
  const seasonYear = seasonYearParam ? Number(seasonYearParam) : undefined;

  const yearLessThanParam = searchParams.get("yearLessThan");
  const yearLessThanRaw = yearLessThanParam ? Number(yearLessThanParam) : undefined;
  const yearLessThan = typeof yearLessThanRaw === "number" && Number.isFinite(yearLessThanRaw)
    ? yearLessThanRaw * 10000 + 101
    : undefined;

  const variables = {
    page: 1,
    perPage: 50,
    genre,
    status,
    season,
    seasonYear: Number.isFinite(seasonYear) ? seasonYear : undefined,
    yearLessThan,
  };

  try {
    const data = await request<AniListResponse>(endpoint, query, variables);
    const media = data.Page?.media ?? [];

    const transformed = media.map((anime) => ({
      id: anime.id,
      title: anime.title.english || anime.title.romaji || "Unknown Title",
      poster: anime.coverImage.extraLarge || anime.coverImage.large || null,
      dominantColor: anime.coverImage.color,
      episodes: anime.episodes,
      status: anime.status,
      genres: anime.genres,
      score: anime.averageScore,
      popularity: anime.popularity,
    }));

    return NextResponse.json(transformed, {
      status: 200,
      headers: {
        "Cache-Control": "public, max-age=0, s-maxage=3600",
      },
    });
  } catch {
    return NextResponse.json({ error: "AniList request failed" }, { status: 500 });
  }
}
