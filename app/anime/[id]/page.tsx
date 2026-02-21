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

function formatStatus(status?: string) {
  if (!status) return "UNKNOWN";
  if (status === "RELEASING") return "AIRING";
  return status;
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

          <div className="space-y-5">
            <div className="space-y-2">
              <h2 className="anispin-display text-4xl md:text-5xl">{anime.title}</h2>
              <div className="flex flex-wrap gap-2 text-xs font-bold uppercase tracking-wide">
                <span className="rounded-full border border-white/20 bg-[#11162A] px-3 py-1.5">
                  ⭐ {anime.score ?? "N/A"}
                </span>
                <span className="rounded-full border border-white/20 bg-[#11162A] px-3 py-1.5">
                  📊 {anime.popularity ?? "N/A"}
                </span>
                <span className="rounded-full border border-[#00F0FF]/50 bg-[#11162A] px-3 py-1.5">
                  📺 {formatStatus(anime.status)}
                </span>
                <span className="rounded-full border border-[#FF5E00]/50 bg-[#11162A] px-3 py-1.5">
                  🎬 {anime.format ?? "N/A"}
                </span>
              </div>
            </div>

            <div className="grid gap-2 text-sm font-semibold text-white/90 sm:grid-cols-2">
              <p>Format: {anime.format ?? "N/A"}</p>
              <p>Season: {anime.season ?? "N/A"} {anime.seasonYear ?? ""}</p>
              <p>Episodes: {anime.episodes ?? "N/A"}</p>
              <p>Status: {formatStatus(anime.status)}</p>
              <p>Score: {anime.score ?? "N/A"}</p>
              <p>Popularity: {anime.popularity ?? "N/A"}</p>
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

        <div className="mx-auto mt-8 w-full max-w-6xl rounded-xl border border-white/10 bg-[#11162A]/70 p-5">
          <h3 className="mb-3 text-sm font-black uppercase tracking-[0.14em] text-white/85">Description</h3>
          <p className="text-sm leading-relaxed text-white/88">{description}</p>
        </div>
      </section>
    </main>
  );
}

