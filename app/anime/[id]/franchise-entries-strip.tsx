"use client";

import Image from "next/image";
import Link from "next/link";
import {
  type PointerEvent,
  type WheelEvent,
  useRef,
} from "react";

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
  const isDraggingRef = useRef(false);
  const startXRef = useRef(0);
  const startScrollLeftRef = useRef(0);

  function onWheelHorizontal(event: WheelEvent<HTMLDivElement>) {
    if (!scrollRef.current) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    scrollRef.current.scrollLeft += event.deltaY;
  }

  function scrollByAmount(delta: number) {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({ left: delta, behavior: "smooth" });
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!scrollRef.current || event.button !== 0) return;
    isDraggingRef.current = true;
    startXRef.current = event.clientX;
    startScrollLeftRef.current = scrollRef.current.scrollLeft;
    scrollRef.current.setPointerCapture(event.pointerId);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (!scrollRef.current || !isDraggingRef.current) return;
    event.preventDefault();
    const deltaX = event.clientX - startXRef.current;
    scrollRef.current.scrollLeft = startScrollLeftRef.current - deltaX;
  }

  function onPointerEnd(event: PointerEvent<HTMLDivElement>) {
    if (!scrollRef.current || !isDraggingRef.current) return;
    isDraggingRef.current = false;
    scrollRef.current.releasePointerCapture(event.pointerId);
  }

  if (!entries.length) return null;

  return (
    <div className="space-y-3 border-t border-white/10 pt-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-black uppercase tracking-[0.14em] text-white/70">
          Franchise Entries
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => scrollByAmount(-260)}
            className="rounded-full border border-white/20 bg-[#11162A]/85 px-2.5 py-1 text-xs font-black text-white/85 transition hover:border-[#00F0FF]/60"
            aria-label="Scroll franchise entries left"
          >
            {"\u2039"}
          </button>
          <button
            type="button"
            onClick={() => scrollByAmount(260)}
            className="rounded-full border border-white/20 bg-[#11162A]/85 px-2.5 py-1 text-xs font-black text-white/85 transition hover:border-[#00F0FF]/60"
            aria-label="Scroll franchise entries right"
          >
            {"\u203A"}
          </button>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="w-full cursor-grab overflow-x-auto overflow-y-hidden pb-2 select-none active:cursor-grabbing"
        onWheel={onWheelHorizontal}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
      >
        <div className="flex min-w-max gap-6 pr-2">
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
