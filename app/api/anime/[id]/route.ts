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
  description: string | null;
  coverImage: {
    extraLarge: string | null;
    large: string | null;
  };
  bannerImage: string | null;
  episodes: number | null;
  duration: number | null;
  status: string | null;
  genres: string[];
  averageScore: number | null;
  popularity: number | null;
  season: string | null;
  seasonYear: number | null;
  format: string | null;
  relations: {
    edges: Array<{
      relationType: string | null;
      node: {
        id: number | null;
        format: string | null;
        status: string | null;
      } | null;
    } | null> | null;
  } | null;
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
        english
        romaji
        native
      }
      description(asHtml: false)
      coverImage {
        extraLarge
        large
      }
      bannerImage
      episodes
      duration
      status
      genres
      averageScore
      popularity
      season
      seasonYear
      format
      relations {
        edges {
          relationType
          node {
            id
            format
            status
          }
        }
      }
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

    const relationEdges = media.relations?.edges?.filter(
      (edge): edge is NonNullable<typeof edge> => Boolean(edge),
    ) ?? [];

    const sequelEdges = relationEdges.filter(
      (edge) =>
        edge.relationType === "SEQUEL" &&
        edge.node?.format === "TV",
    );

    let franchiseStatus: Anime["franchiseStatus"] = "CONCLUDED";

    if (sequelEdges.length) {
      const releasing = sequelEdges.find((edge) => edge.node?.status === "RELEASING");
      const upcoming = sequelEdges.find((edge) => edge.node?.status === "NOT_YET_RELEASED");

      if (releasing) {
        franchiseStatus = "ONGOING";
      } else if (upcoming) {
        franchiseStatus = "RETURNING";
      } else {
        franchiseStatus = "ONGOING";
      }
    }

    const hasPrequel = relationEdges.some(
      (edge) => edge.relationType === "PREQUEL" && edge.node?.format === "TV",
    );

    const transformed: Anime = {
      id: media.id,
      title:
        media.title.english ||
        media.title.romaji ||
        media.title.native ||
        "Unknown Title",
      description: cleanDescription(media.description || ""),
      poster,
      banner: media.bannerImage || null,
      episodes: media.episodes ?? undefined,
      duration: media.duration ?? undefined,
      status: media.status ?? undefined,
      genres: media.genres,
      score: media.averageScore ?? undefined,
      popularity: media.popularity ?? undefined,
      season: media.season ?? undefined,
      seasonYear: media.seasonYear ?? undefined,
      format: media.format ?? undefined,
      franchiseStatus,
      hasPrequel,
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
