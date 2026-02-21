"use client";

import Image from "next/image";
import Link from "next/link";
import { type WheelEvent, useRef } from "react";

type FranchiseEntry = {
  id: number;
  title: string;
  poster: string;
  seasonYear?: number;
  statusLabel: string;
  episodesLabel: string;
};

type FranchiseEntriesStripProps = {
  entries: FranchiseEntry[];
};

export function FranchiseEntriesStrip({ entries }: FranchiseEntriesStripProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);

  function onWheelHorizontal(event: WheelEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    scrollRef.current.scrollLeft += event.deltaY;
  }

  if (!entries.length) return null;

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">
        Franchise Entries
      </p>
      <div
        ref={scrollRef}
        className="w-full overflow-x-auto overflow-y-hidden pb-2"
        onWheel={onWheelHorizontal}
      >
        <div className="flex min-w-max gap-6">
          {entries.map((entry) => (
            <Link
              key={entry.id}
              href={`/anime/${entry.id}`}
              className="group w-[240px] flex-shrink-0 rounded-xl border border-white/12 bg-[#11162A]/70 p-2 transition hover:border-[#00F0FF]/55"
            >
              <div className="flex gap-3">
                <Image
                  src={entry.poster}
                  alt={entry.title}
                  width={88}
                  height={124}
                  className="h-[124px] w-[88px] rounded-lg object-cover"
                  loading="lazy"
                />
                <div className="min-w-0 space-y-1.5 text-xs font-semibold text-white/80">
                  <p className="line-clamp-2 text-sm font-black uppercase tracking-wide text-white/94">
                    {entry.title}
                  </p>
                  <p>{entry.seasonYear ?? "Year Unknown"}</p>
                  <p>{entry.statusLabel}</p>
                  <p>{entry.episodesLabel}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
