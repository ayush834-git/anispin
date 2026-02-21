import Image from "next/image";
import Link from "next/link";

import { type Anime } from "@/types/anime";

async function getAnime(id: string): Promise<Anime> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "http://localhost:3000";

  const res = await fetch(`${baseUrl}/api/anime/${id}`, {
    next: { revalidate: 3600 },
  });

  if (!res.ok) throw new Error("Failed to fetch anime");
  return res.json() as Promise<Anime>;
}

function getPopularityTier(popularity?: number) {
  if (!popularity) return "Unknown";
  if (popularity < 5000) return "Hidden Gem";
  if (popularity < 20000) return "Niche Pick";
  if (popularity < 60000) return "Popular";
  if (popularity < 150000) return "Very Popular";
  return "Mainstream Hit";
}

function getEpisodeDisplay(anime: Pick<Anime, "status" | "episodes">) {
  if (anime.status === "RELEASING" && !anime.episodes) {
    return "Ongoing";
  }

  if (!anime.episodes) {
    return "Unknown";
  }

  return `${anime.episodes} Episodes`;
}

function getSeasonStatusLabel(status?: string) {
  if (status === "FINISHED") return "Season Finished";
  if (status === "RELEASING") return "Currently Airing";
  if (status === "NOT_YET_RELEASED") return "Upcoming Season";
  return "Season Status Unknown";
}

function getFranchiseIndicator(franchiseStatus?: Anime["franchiseStatus"]) {
  if (franchiseStatus === "ONGOING") {
    return {
      label: "\uD83D\uDD01 Franchise Ongoing",
      className: "border-[#00B8D8]/45 bg-[#00B8D8]/12 text-[#BDEFFF]",
    };
  }

  if (franchiseStatus === "RETURNING") {
    return {
      label: "\uD83D\uDD52 New Season Announced",
      className: "border-[#FFB648]/45 bg-[#FFB648]/14 text-[#FFE3B6]",
    };
  }

  return {
    label: "\u2714 Story Concluded",
    className: "border-[#3BC97D]/45 bg-[#3BC97D]/14 text-[#C6F9DD]",
  };
}

function getSeasonEntryLabel(anime: Anime) {
  if (anime.hasPrequel) return "Season Entry";
  if (anime.format === "TV") return "TV Series";
  return anime.format ?? "Unknown Format";
}

function getRuntimeLabel(anime: Anime) {
  if (!anime.episodes || !anime.duration) {
    return "Total Runtime: Unknown";
  }

  const totalMinutes = anime.episodes * anime.duration;
  const totalHours = (totalMinutes / 60).toFixed(1);
  return `Total Runtime: ~${totalHours} Hours`;
}

export default async function AnimeDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let anime: Anime | null = null;
  try {
    anime = await getAnime(id);
  } catch {
    return (
      <main className="min-h-screen bg-[#0B0F1A] px-4 py-12 text-white">
        <div className="mx-auto w-full max-w-4xl">
          <p className="rounded-xl border border-white/10 bg-[#11162A]/90 p-4 text-sm font-bold">
            Unable to load anime. Try again later.
          </p>
          <Link
            href="/"
            className="mt-4 inline-flex rounded-full border border-white/20 px-4 py-2 text-xs font-black uppercase tracking-wide text-white/90 hover:border-[#00F0FF]/60"
          >
            Back to Home
          </Link>
        </div>
      </main>
    );
  }

  const description = anime.description?.trim() || "No description available.";
  const score10 = typeof anime.score === "number" ? (anime.score / 10).toFixed(1) : null;
  const popularityTier = getPopularityTier(anime.popularity);
  const seasonLabel = anime.season
    ? `${anime.season}${anime.seasonYear ? ` ${anime.seasonYear}` : ""}`
    : anime.seasonYear
      ? String(anime.seasonYear)
      : "Unknown";
  const episodeDisplay = getEpisodeDisplay(anime);
  const seasonStatusLabel = getSeasonStatusLabel(anime.status);
  const franchiseBadge = getFranchiseIndicator(anime.franchiseStatus);
  const seasonEntryLabel = getSeasonEntryLabel(anime);
  const runtimeLabel = getRuntimeLabel(anime);

  return (
    <main className="min-h-screen bg-[#0B0F1A] text-white">
      <section className="relative h-[40vh] min-h-[280px] w-full overflow-hidden">
        {anime.banner ? (
          <Image
            src={anime.banner}
            alt={`${anime.title} banner`}
            fill
            className="object-cover"
            priority
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#FF5E00]/40 via-[#0F1220] to-[#00F0FF]/30" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F1A] via-[#0B0F1A]/55 to-transparent" />
        <div className="absolute inset-0 flex items-end justify-center px-4 pb-8">
          <h1 className="anispin-display text-center text-5xl text-white md:text-7xl">{anime.title}</h1>
        </div>
      </section>

      <section className="px-4 py-10">
        <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[280px_1fr]">
          <div className="relative mx-auto w-[240px] md:mx-0 md:w-[280px]">
            <Image
              src={anime.poster}
              alt={anime.title}
              width={300}
              height={420}
              className="h-auto w-full rounded-xl border border-white/10 object-cover shadow-[0_20px_40px_rgba(0,0,0,0.55)]"
              priority
            />
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <h2 className="anispin-display text-4xl md:text-5xl">{anime.title}</h2>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <span className="rounded-full border border-white/20 bg-[#11162A] px-3 py-1.5 text-white/95">
                  {score10 ? (
                    <>
                      {"\u2B50"} {score10} / 10
                    </>
                  ) : (
                    "Not rated"
                  )}
                </span>
                <span className="rounded-full border border-white/20 bg-[#11162A]/90 px-3 py-1.5 text-white/88">
                  {seasonStatusLabel}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold uppercase tracking-wide">
                <span className={`rounded-full border px-3 py-1.5 ${franchiseBadge.className}`}>
                  {franchiseBadge.label}
                </span>
              </div>
            </div>

            <div className="space-y-2 text-sm font-semibold text-white/90">
              <p>{seasonEntryLabel}</p>
              <p>{seasonLabel}</p>
            </div>

            <div className="space-y-1 border-t border-white/10 pt-4">
              <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">This Season</p>
              <p className="text-base font-semibold text-white/92">{episodeDisplay}</p>
              <p className="text-sm font-semibold text-white/76">{runtimeLabel}</p>
            </div>

            <div className="space-y-2">
              <span className="inline-flex rounded-full border border-[#FF5E00]/45 bg-[#FF5E00]/12 px-3 py-1.5 text-xs font-black uppercase tracking-wide text-[#FFD3B8]">
                {popularityTier}
              </span>
              {anime.popularity ? (
                <p className="text-xs font-semibold text-white/58">
                  Added by {anime.popularity.toLocaleString()} users
                </p>
              ) : null}
            </div>

            <div className="flex flex-wrap gap-2">
              {anime.genres.map((genre) => (
                <span
                  key={genre}
                  className="rounded-full border border-white/15 bg-[#11162A] px-3 py-1 text-xs font-bold uppercase tracking-wide text-white/90"
                >
                  {genre}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div className="mx-auto mt-10 w-full max-w-6xl border-t border-white/10 pt-8">
          <article className="rounded-2xl bg-[#11162A]/56 p-6 md:p-7">
            <h3 className="mb-4 text-sm font-black uppercase tracking-[0.14em] text-white/85">Description</h3>
            <p className="text-[15px] leading-8 text-white/88">{description}</p>
          </article>
        </div>
      </section>
    </main>
  );
}
