"use client";

type WatchSearchButtonProps = {
  title: string;
};

export function WatchSearchButton({ title }: WatchSearchButtonProps) {
  function handleOpenSearch() {
    const url = `https://www.google.com/search?q=watch+${encodeURIComponent(title)}+online`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <button
      type="button"
      onClick={handleOpenSearch}
      className="inline-flex rounded-full border border-[#00F0FF]/45 bg-[#11162A] px-4 py-2 text-xs font-black uppercase tracking-wide text-[#D7FBFF] transition hover:border-[#00F0FF]/80 hover:bg-[#00F0FF]/12"
    >
      🔍 Search Streaming Platforms
    </button>
  );
}
