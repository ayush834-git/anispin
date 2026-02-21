"use client";

import Image from "next/image";

import { type Anime } from "@/types/anime";

type TrailerSectionProps = {
  anime: Pick<Anime, "title" | "trailer">;
};

export function TrailerSection({ anime }: TrailerSectionProps) {
  const hasTrailer =
    anime?.trailer &&
    anime.trailer.id &&
    anime.trailer.site &&
    anime.trailer.site.toLowerCase() === "youtube";

  if (!hasTrailer) {
    return null;
  }

  const trailerId = anime.trailer!.id;
  const trailerUrl = `https://www.youtube.com/watch?v=${trailerId}`;
  const thumbnailUrl = `https://img.youtube.com/vi/${trailerId}/hqdefault.jpg`;

  return (
    <div className="mt-6">
      <h3 className="mb-2 text-lg font-semibold text-white">Trailer</h3>
      <div
        className="group relative w-full max-w-[480px] cursor-pointer"
        onClick={() => window.open(trailerUrl, "_blank", "noopener,noreferrer")}
        role="button"
        tabIndex={0}
        aria-label={`Watch trailer for ${anime.title}`}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            window.open(trailerUrl, "_blank", "noopener,noreferrer");
          }
        }}
      >
        <Image
          src={thumbnailUrl}
          alt="Trailer thumbnail"
          width={480}
          height={270}
          className="w-full rounded-md object-cover"
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
          <span className="text-3xl font-bold text-white">{"\u25B6"}</span>
        </div>
      </div>
    </div>
  );
}
