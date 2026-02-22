"use client";

import Image from "next/image";
import Link from "next/link";
import { type WheelEvent, useRef } from "react";

type FranchiseEntry = {
  id: number;
  title: string;
  poster: string;
  seasonYear?: number;
  episodes?: number;
};

type FranchiseEntriesStripProps = {
  entries: FranchiseEntry[];
};

export function FranchiseEntriesStrip({ entries }: FranchiseEntriesStripProps) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  function onWheelHorizontal(event: WheelEvent<HTMLDivElement>) {
    if (!scrollerRef.current) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    scrollerRef.current.scrollLeft += event.deltaY;
  }

  function scrollByCards(direction: "left" | "right") {
    if (!scrollerRef.current) return;
    const delta = direction === "left" ? -260 : 260;
    scrollerRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }

  if (!entries.length) return null;

  return (
    <div className="mt-10">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="text-xl font-semibold text-white">Franchise Entries</h3>
        <div className="hidden items-center gap-2 md:flex">
          <button
            type="button"
            onClick={() => scrollByCards("left")}
            aria-label="Scroll franchise entries left"
            className="rounded-full border border-white/20 bg-[#11162A] px-2.5 py-1 text-sm font-black text-white/90 transition hover:border-[#00F0FF]/60"
          >
            {"\u2039"}
          </button>
          <button
            type="button"
            onClick={() => scrollByCards("right")}
            aria-label="Scroll franchise entries right"
            className="rounded-full border border-white/20 bg-[#11162A] px-2.5 py-1 text-sm font-black text-white/90 transition hover:border-[#00F0FF]/60"
          >
            {"\u203A"}
          </button>
        </div>
      </div>

      <div
        ref={scrollerRef}
        onWheel={onWheelHorizontal}
        data-lenis-prevent
        data-lenis-prevent-wheel
        className="scrollbar-hide touch-pan-x w-full overflow-x-auto overflow-y-hidden pb-3"
      >
        <div className="flex min-w-max gap-4 pb-2">
          {entries.map((item) => (
            <Link
              key={item.id}
              href={`/anime/${item.id}`}
              className="w-[220px] flex-shrink-0 rounded-xl bg-neutral-900 p-4 sm:w-[240px]"
            >
              <Image
                src={item.poster}
                alt={item.title}
                width={240}
                height={300}
                className="h-[300px] w-full rounded-md object-cover"
                loading="lazy"
              />

              <h4 className="mt-3 line-clamp-2 text-sm font-semibold text-white">
                {item.title}
              </h4>

              <p className="mt-1 text-xs text-neutral-400">{item.seasonYear || "\u2014"}</p>

              {item.episodes ? (
                <p className="text-xs text-neutral-400">{item.episodes} Episodes</p>
              ) : null}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
