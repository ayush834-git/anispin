import { NextResponse } from "next/server";
import { gql, request } from "graphql-request";

import { type Anime } from "@/types/anime";

const endpoint = "https://graphql.anilist.co";

type AniListMedia = {
  id: number;
  title: {
    romaji: string | null;
  };
  description: string | null;
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
  Media: AniListMedia | null;
};

function cleanDescription(text: string) {
  return text.replace(/<[^>]*>?/gm, "");
}

const query = gql`
  query ($id: Int) {
    Media(id: $id, type: ANIME) {
      id
      title {
        romaji
      }
      description(asHtml: false)
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
`;

export async function GET(
  _req: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const animeId = Number(id);

  if (!Number.isInteger(animeId) || animeId <= 0) {
    return NextResponse.json({ error: "Invalid anime id" }, { status: 400 });
  }

  try {
    const data = await request<AniListResponse>(endpoint, query, { id: animeId });
    const media = data.Media;

    if (!media) {
      return NextResponse.json({ error: "Anime not found" }, { status: 404 });
    }

    const poster = media.coverImage.extraLarge || media.coverImage.large;
    if (!poster) {
      return NextResponse.json({ error: "Poster not available" }, { status: 404 });
    }

    const transformed: Anime = {
      id: media.id,
      title: media.title.romaji || "Unknown Title",
      description: cleanDescription(media.description || ""),
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
    };

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

