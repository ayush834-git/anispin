"use client";

import Image from "next/image";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { type Anime } from "@/types/anime";

type AnimeCardProps = {
  anime: Anime;
  index?: number;
  className?: string;
};

function formatStatus(status?: string | null) {
  if (!status) return "UNKNOWN";
  if (status === "RELEASING") return "AIRING";
  return status;
}

export function AnimeCard({ anime, index = 0, className }: AnimeCardProps) {
  return (
    <article
      className={cn(
        "anispin-grid-card group relative w-[170px] shrink-0 rounded-xl p-1.5 will-change-transform hover:z-30 hover:border-[#00F0FF]/65 md:w-[180px]",
        className,
      )}
      style={{ rotate: `${index % 2 === 0 ? -2 : 2}deg` }}
    >
      <Link href={`/anime/${anime.id}`} className="block">
        <div className="anispin-poster-media relative overflow-visible rounded-lg">
          <Image
            src={anime.poster}
            alt={anime.title}
            width={300}
            height={420}
            loading="lazy"
            className="h-[220px] w-[170px] rounded-lg object-cover md:h-[230px] md:w-[180px]"
          />

          <span className="absolute left-2 top-2 rounded-md bg-[#0B0F1A]/78 px-2 py-0.5 text-[11px] font-bold text-[#00F0FF]">
            {anime.score ?? "Unknown"}
          </span>
          <span className="absolute right-2 top-2 rounded-md bg-[#0B0F1A]/78 px-2 py-0.5 text-[11px] font-bold text-[#FF5E00]">
            {formatStatus(anime.status)}
          </span>
        </div>

        <h3 className="mt-2 truncate px-1 text-sm font-black uppercase text-white">{anime.title}</h3>
      </Link>
    </article>
  );
}
