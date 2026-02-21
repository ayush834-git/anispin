import Image from "next/image";
import Link from "next/link";

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
  if (!entries.length) return null;

  return (
    <div className="mt-10">
      <h3 className="mb-4 text-xl font-semibold text-white">Franchise Entries</h3>

      <div className="scrollbar-hide touch-pan-x w-full overflow-x-auto overflow-y-hidden pb-3">
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
