"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import { AnimeCard } from "@/components/anime-card";
import { fetchAnime } from "@/lib/anilist";
import { type Anime } from "@/types/anime";

type CategoryConfig = {
  key: string;
  title: string;
  query: Record<string, string | number | boolean | undefined>;
  localFilter?: (anime: Anime) => boolean;
};

type CategorySection = {
  key: string;
  title: string;
  animeList: Anime[];
};

const CARDS_PER_CATEGORY = 18;

const CATEGORY_CONFIGS: CategoryConfig[] = [
  {
    key: "beginner-friendly",
    title: "\u{1F525} Beginner Friendly",
    query: {},
    localFilter: (anime) => {
      const episodes = anime.episodes ?? Number.POSITIVE_INFINITY;
      const score = anime.score ?? 0;
      return episodes <= 26 && score >= 75 && !anime.hasPrequel;
    },
  },
  {
    key: "action",
    title: "\u2694\uFE0F Action",
    query: { genre: "Action" },
  },
  {
    key: "romance",
    title: "\u{1F496} Romance",
    query: { genre: "Romance" },
  },
  {
    key: "slice-of-life",
    title: "\u{1F33F} Slice of Life",
    query: { genre: "Slice of Life" },
  },
  {
    key: "psychological",
    title: "\u{1F9E0} Psychological",
    query: { genre: "Psychological" },
  },
  {
    key: "fantasy",
    title: "\u2728 Fantasy",
    query: { genre: "Fantasy" },
  },
  {
    key: "comedy",
    title: "\u{1F602} Comedy",
    query: { genre: "Comedy" },
  },
];

let browseCache: CategorySection[] | null = null;
let browsePromise: Promise<CategorySection[]> | null = null;

function buildCategoryList(rawList: Anime[], config: CategoryConfig) {
  const dedupedById = new Map<number, Anime>();

  for (const anime of rawList) {
    if (anime.episodes == null) continue;
    if (!dedupedById.has(anime.id)) {
      dedupedById.set(anime.id, anime);
    }
  }

  const deduped = Array.from(dedupedById.values());
  const filtered = config.localFilter ? deduped.filter(config.localFilter) : deduped;

  return filtered.slice(0, CARDS_PER_CATEGORY);
}

async function fetchCategory(config: CategoryConfig): Promise<CategorySection> {
  const [pageOne, pageTwo] = await Promise.all([
    fetchAnime({
      ...config.query,
      pageStart: 1,
      pages: 1,
    }),
    fetchAnime({
      ...config.query,
      pageStart: 2,
      pages: 1,
    }),
  ]);

  const merged = buildCategoryList([...pageOne, ...pageTwo], config);

  return {
    key: config.key,
    title: config.title,
    animeList: merged,
  };
}

async function loadBrowseCategories() {
  if (browseCache) return browseCache;
  if (browsePromise) return browsePromise;

  browsePromise = Promise.all(CATEGORY_CONFIGS.map((config) => fetchCategory(config)))
    .then((sections) => {
      browseCache = sections;
      return sections;
    })
    .finally(() => {
      browsePromise = null;
    });

  return browsePromise;
}

export default function BrowsePage() {
  const [sections, setSections] = useState<CategorySection[]>(() => browseCache ?? []);
  const [isLoading, setIsLoading] = useState<boolean>(() => !browseCache);
  const [error, setError] = useState<string | null>(null);
  const displaySections: CategorySection[] = isLoading
    ? CATEGORY_CONFIGS.map((config) => ({
        key: config.key,
        title: config.title,
        animeList: [],
      }))
    : sections;

  useEffect(() => {
    let cancelled = false;

    if (browseCache) {
      return () => {
        cancelled = true;
      };
    }

    void loadBrowseCategories()
      .then((nextSections) => {
        if (cancelled) return;
        setSections(nextSections);
      })
      .catch(() => {
        if (cancelled) return;
        setSections([]);
        setError("Unable to load browse categories. Try again later.");
      })
      .finally(() => {
        if (cancelled) return;
        setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="anispin-page min-h-screen text-white/92">
      <div className="mx-auto w-full max-w-[1600px] px-3 pb-14 pt-10 md:px-5">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.14em] text-[#00F0FF]">
              AniSpin Discovery
            </p>
            <h1 className="anispin-display text-5xl text-white md:text-6xl">Browse Anime</h1>
          </div>
          <Link
            href="/"
            className="anispin-secondary-button inline-flex h-10 items-center rounded-full px-5 text-xs font-black uppercase tracking-wide text-white"
          >
            Back to Spin
          </Link>
        </div>

        {error ? (
          <div className="mt-8 rounded-xl border border-[#FF5E00]/40 bg-[#11162A]/92 px-4 py-3 text-sm font-semibold text-white/90">
            {error}
          </div>
        ) : null}

        {displaySections.map((section) => (
          <div key={section.key} className="mt-10">
            <h2 className="mb-4 text-2xl font-semibold">{section.title}</h2>

            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-4 min-w-max pb-2">
                {isLoading
                  ? Array.from({ length: 8 }).map((_, index) => (
                      <div
                        key={`${section.key}-skeleton-${index}`}
                        className="h-[260px] w-[170px] shrink-0 animate-pulse rounded-xl border border-white/10 bg-[#11162A]"
                      />
                    ))
                  : section.animeList.map((anime, index) => (
                      <AnimeCard key={anime.id} anime={anime} index={index} />
                    ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </main>
  );
}
