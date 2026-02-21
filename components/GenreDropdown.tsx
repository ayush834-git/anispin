"use client";

import { type Dispatch, type SetStateAction } from "react";

import { type Filters } from "@/types/anime";

const GENRE_OPTIONS = ["Action", "Comedy", "Fantasy", "Romance", "Sci-Fi"] as const;

type GenreDropdownProps = {
  selectedGenre?: string;
  setFilters: Dispatch<SetStateAction<Filters>>;
};

export function GenreDropdown({ selectedGenre, setFilters }: GenreDropdownProps) {
  return (
    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-wide text-white/80">
      Genre
      <select
        value={selectedGenre ?? ""}
        className="rounded-full border border-white/15 bg-[#11162A] px-3 py-1.5 text-xs font-bold text-white outline-none transition-colors hover:border-[#00F0FF]/60"
        onChange={(event) => {
          const selected = event.target.value || undefined;
          setFilters((prev) => ({ ...prev, genre: selected }));
        }}
      >
        <option value="">All</option>
        {GENRE_OPTIONS.map((genre) => (
          <option key={genre} value={genre}>
            {genre}
          </option>
        ))}
      </select>
    </label>
  );
}

