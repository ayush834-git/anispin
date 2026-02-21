"use client";

import Image from "next/image";
import { animate, stagger } from "animejs";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Clapperboard, Flame, Star, Tv } from "lucide-react";
import { type WheelEvent, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

import { GenreDropdown } from "@/components/GenreDropdown";
import { Button } from "@/components/ui/button";
import { useAnimeQuery } from "@/hooks/useAnimeQuery";
import { useSpinEngine } from "@/hooks/useSpinEngine";
import { type Anime, type Filters } from "@/types/anime";

const HERO_POSTER_LAYOUT = [
  { top: "2%", left: "6%", rotate: -6, z: 16 },
  { top: "7%", left: "31%", rotate: 5, z: 18 },
  { top: "16%", left: "56%", rotate: -4, z: 14 },
  { top: "34%", left: "3%", rotate: 6, z: 19 },
  { top: "36%", left: "28%", rotate: -3, z: 17 },
  { top: "44%", left: "53%", rotate: 4, z: 13 },
  { top: "62%", left: "14%", rotate: -5, z: 15 },
  { top: "64%", left: "44%", rotate: 3, z: 12 },
] as const;

const FEATURE_STRIP = [
  {
    title: "Genre Filters",
    subtitle: "Tune the battlefield by vibe before you spin.",
  },
  {
    title: "Completed Only",
    subtitle: "No cliffhanger traps. Finished arcs only.",
  },
  {
    title: "Streaming Filter",
    subtitle: "If it is not available, it is not selected.",
  },
  {
    title: "Episode Length",
    subtitle: "Lock 12-ep sprints or long saga marathons.",
  },
] as const;

function formatStatus(status?: string | null) {
  if (!status) return "UNKNOWN";
  if (status === "RELEASING") return "AIRING";
  return status;
}

function StatusBubble({ text }: { text: string }) {
  return (
    <div className="rounded-full border border-[#00F0FF]/45 bg-[#11162A]/90 px-4 py-2 text-xs font-bold text-white/90">
      {text}
    </div>
  );
}

function AnimeGridSkeleton({ count = 10 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-3.5 xl:grid-cols-5">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={`skeleton-${index}`}
          className="h-[250px] animate-pulse rounded-xl border border-white/10 bg-[#11162A]"
        />
      ))}
    </div>
  );
}

function ChaosHeader() {
  const logoRef = useRef<HTMLDivElement | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setIsScrolled(window.scrollY > 8);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const onLogoHover = () => {
    if (!logoRef.current) return;
    animate(logoRef.current, {
      rotate: [0, 10, -7, 0],
      duration: 520,
      ease: "out(4)",
    });
  };

  const links = [
    { id: "home", label: "Home" },
    { id: "spin-reactor", label: "Spin" },
    { id: "trending", label: "Trending" },
    { id: "top-airing", label: "Top Airing" },
    { id: "completed", label: "Completed" },
  ] as const;

  return (
    <header className={`anispin-header sticky top-0 z-50 h-[72px] ${isScrolled ? "is-scrolled" : ""}`}>
      <div className="mx-auto flex h-full w-full max-w-[1600px] items-center justify-between gap-3 px-3 md:px-5">
        <button
          type="button"
          className="group flex items-center gap-2"
          onMouseEnter={onLogoHover}
        >
          <div
            ref={logoRef}
            className="anispin-logo-badge flex size-11 items-center justify-center rounded-full text-lg font-black text-white"
            aria-label="AniSpin logo"
          >
            AS
          </div>
          <span className="anispin-display text-3xl text-white">AniSpin</span>
        </button>

        <nav className="hidden items-center gap-1 text-[15px] font-semibold md:flex">
          {links.map((item, index) => (
            <a
              key={item.id}
              href={`#${item.id}`}
              aria-current={index === 0 ? "page" : undefined}
              className={`anispin-nav-link rounded-md px-2.5 py-1.5 transition-colors hover:bg-white/10 ${index === 0 ? "anispin-nav-link-active" : ""}`}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <Button className="anispin-login-button h-10 rounded-full px-6 text-sm font-bold text-white">
          Login
        </Button>
      </div>
    </header>
  );
}

function ChaosHeroSection({
  animeList,
  isLoading,
  error,
}: {
  animeList: Anime[];
  isLoading: boolean;
  error: string | null;
}) {
  const sectionRef = useRef<HTMLElement | null>(null);
  const collageRef = useRef<HTMLDivElement | null>(null);
  const posterRefs = useRef<Array<HTMLDivElement | null>>([]);
  const ctaWrapRef = useRef<HTMLDivElement | null>(null);
  const ctaPulseRef = useRef<HTMLSpanElement | null>(null);

  const heroAnime = useMemo(() => animeList.slice(0, HERO_POSTER_LAYOUT.length), [animeList]);

  useEffect(() => {
    const running: Array<{ pause: () => void }> = [];

    if (ctaPulseRef.current) {
      running.push(
        animate(ctaPulseRef.current, {
          scale: [1, 1.35],
          opacity: [0.45, 0],
          duration: 1350,
          ease: "out(4)",
          loop: true,
        }),
      );
    }

    posterRefs.current.forEach((poster, index) => {
      if (!poster) return;
      const baseRotate = HERO_POSTER_LAYOUT[index]?.rotate ?? 0;
      running.push(
        animate(poster, {
          translateY: [-8, 11],
          rotate: [baseRotate - 1.3, baseRotate + 1.3],
          duration: 2200 + index * 190,
          loop: true,
          alternate: true,
          ease: "inOutSine",
        }),
      );
    });

    return () => {
      running.forEach((animation) => animation.pause());
    };
  }, [heroAnime.length]);

  useLayoutEffect(() => {
    gsap.registerPlugin(ScrollTrigger);

    const ctx = gsap.context(() => {
      if (!collageRef.current) return;
      gsap.to(collageRef.current, {
        y: 72,
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top top",
          end: "bottom top",
          scrub: 1,
        },
      });
    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const onCtaHoverStart = () => {
    if (!ctaWrapRef.current) return;
    animate(ctaWrapRef.current, {
      scale: 1.08,
      duration: 220,
      ease: "out(4)",
    });
  };

  const onCtaHoverEnd = () => {
    if (!ctaWrapRef.current) return;
    animate(ctaWrapRef.current, {
      scale: 1,
      duration: 220,
      ease: "out(3)",
    });
  };

  return (
    <section id="home" ref={sectionRef} className="relative overflow-hidden py-12 md:py-20">
      <div className="anispin-hero-ghosts" aria-hidden>
        <span className="anispin-hero-ghost anispin-hero-ghost-a" />
        <span className="anispin-hero-ghost anispin-hero-ghost-b" />
        <span className="anispin-hero-ghost anispin-hero-ghost-c" />
      </div>
      <div className="relative z-10 mx-auto w-full max-w-[1600px] px-3 md:px-5">
        <div className="grid grid-cols-12 gap-3 md:gap-4">
          <div className="col-span-12 flex flex-col justify-center gap-5 lg:col-span-7">
            <h1 className="anispin-display anispin-hero-title text-white">
              Stop Scrolling.
              <br />
              Let Fate Pick.
            </h1>
            <p className="max-w-xl text-lg font-semibold text-white/84 md:text-xl">
              A decision engine for anime addicts.
            </p>
            <div className="pt-2">
              <div
                ref={ctaWrapRef}
                className="relative inline-block will-change-transform"
                onMouseEnter={onCtaHoverStart}
                onMouseLeave={onCtaHoverEnd}
              >
                <span
                  ref={ctaPulseRef}
                  className="pointer-events-none absolute inset-0 rounded-full bg-[#00F0FF]/45 blur-xl"
                  aria-hidden
                />
                <a href="#spin-reactor">
                  <Button className="anispin-main-cta relative z-10 h-14 rounded-full px-10 text-base font-black uppercase tracking-wide text-white md:h-16 md:text-lg">
                    Spin The Wheel
                  </Button>
                </a>
              </div>
            </div>
            {error ? <StatusBubble text="Unable to load anime. Try again later." /> : null}
            {!isLoading && !error && heroAnime.length === 0 ? (
              <StatusBubble text="No matches found. Try different filters." />
            ) : null}
          </div>

          <div className="col-span-12 lg:col-span-5">
            <div ref={collageRef} className="relative h-[520px] w-full md:h-[620px]">
              {isLoading
                ? HERO_POSTER_LAYOUT.map((layout, index) => (
                    <div
                      key={`hero-skeleton-${index}`}
                      className="anispin-collage-poster absolute h-[180px] w-[128px] animate-pulse rounded-xl bg-[#11162A] md:h-[210px] md:w-[148px]"
                      style={{
                        top: layout.top,
                        left: layout.left,
                        rotate: `${layout.rotate}deg`,
                        zIndex: layout.z,
                      }}
                    />
                  ))
                : heroAnime.map((anime, index) => (
                    <div
                      key={anime.id}
                      ref={(element) => {
                        posterRefs.current[index] = element;
                      }}
                      className="anispin-collage-poster absolute h-[180px] w-[128px] overflow-hidden rounded-xl md:h-[210px] md:w-[148px]"
                      style={{
                        top: HERO_POSTER_LAYOUT[index]?.top,
                        left: HERO_POSTER_LAYOUT[index]?.left,
                        rotate: `${HERO_POSTER_LAYOUT[index]?.rotate ?? 0}deg`,
                        zIndex: HERO_POSTER_LAYOUT[index]?.z ?? 1,
                      }}
                    >
                      <Image
                        src={anime.poster}
                        alt={anime.title}
                        width={320}
                        height={460}
                        loading="lazy"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function SpinReactorSection() {
  const [filters, setFilters] = useState<Filters>({});
  const {
    filteredList,
    selectedAnime,
    isLoading,
    error,
    isSpinning,
    spin,
  } = useSpinEngine(filters);

  const ringRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLSpanElement | null>(null);
  const sweepRef = useRef<HTMLSpanElement | null>(null);
  const spinButtonRef = useRef<HTMLDivElement | null>(null);
  const wheelRotationRef = useRef(0);

  useEffect(() => {
    const running: Array<{ pause: () => void }> = [];

    if (pulseRef.current) {
      running.push(
        animate(pulseRef.current, {
          scale: [0.9, 1.26],
          opacity: [0.5, 0],
          duration: 1600,
          ease: "out(4)",
          loop: true,
        }),
      );
    }

    if (sweepRef.current) {
      running.push(
        animate(sweepRef.current, {
          rotate: [0, 360],
          duration: 5000,
          ease: "linear",
          loop: true,
        }),
      );
    }

    return () => {
      running.forEach((animation) => animation.pause());
    };
  }, []);

  const onSpinHoverStart = () => {
    if (!spinButtonRef.current) return;
    animate(spinButtonRef.current, {
      scale: 1.07,
      duration: 220,
      ease: "out(4)",
    });
  };

  const onSpinHoverEnd = () => {
    if (!spinButtonRef.current) return;
    animate(spinButtonRef.current, {
      scale: 1,
      duration: 200,
      ease: "out(3)",
    });
  };

  const onSpinClick = () => {
    const result = spin();
    if (!result || !ringRef.current) return;

    const sliceCount = 10;
    const sliceAngle = 360 / sliceCount;
    const targetSlice = result.pickedIndex % sliceCount;
    const targetSliceCenter = targetSlice * sliceAngle + sliceAngle / 2;
    const targetNormalized = (270 - targetSliceCenter + 360) % 360;
    const currentNormalized = ((wheelRotationRef.current % 360) + 360) % 360;
    const delta = (targetNormalized - currentNormalized + 360) % 360;
    const nextRotation = wheelRotationRef.current + 360 * 5 + delta;

    gsap.to(ringRef.current, {
      rotation: nextRotation,
      duration: 1.8,
      ease: "power3.inOut",
      onComplete: () => {
        wheelRotationRef.current = nextRotation;
      },
    });
  };

  const isEmpty = !isLoading && !error && filteredList.length === 0;

  return (
    <section id="spin-reactor" className="py-12 md:py-20">
      <div className="mx-auto w-full max-w-[1400px] px-3 md:px-5">
        <div className="anispin-reactor-panel relative overflow-hidden rounded-[28px] p-5 md:p-10">
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-6">
            <h2 className="anispin-display text-5xl text-white md:text-7xl">
              Ritual Machine Online
            </h2>
            <p className="text-base font-bold uppercase tracking-wide text-white/84 md:text-lg">
              Too many choices? Spin.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-2">
              <GenreDropdown selectedGenre={filters.genre} setFilters={setFilters} />

              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                  filters.status === "AIRING" ? "anispin-secondary-button text-white" : "bg-white/10 text-white/85 hover:bg-white/15"
                }`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status === "AIRING" ? undefined : "AIRING",
                  }))
                }
              >
                Airing
              </button>

              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                  filters.status === "FINISHED" ? "anispin-secondary-button text-white" : "bg-white/10 text-white/85 hover:bg-white/15"
                }`}
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    status: prev.status === "FINISHED" ? undefined : "FINISHED",
                  }))
                }
              >
                Completed
              </button>

              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                  filters.seasonal ? "anispin-secondary-button text-white" : "bg-white/10 text-white/85 hover:bg-white/15"
                }`}
                onClick={() => setFilters((prev) => ({ ...prev, seasonal: !prev.seasonal }))}
              >
                Seasonal
              </button>

              <button
                type="button"
                className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                  filters.classic ? "anispin-secondary-button text-white" : "bg-white/10 text-white/85 hover:bg-white/15"
                }`}
                onClick={() => setFilters((prev) => ({ ...prev, classic: !prev.classic }))}
              >
                Classic
              </button>
            </div>

            {error ? <StatusBubble text="Unable to load anime. Try again later." /> : null}
            {isEmpty ? <StatusBubble text="No matches found. Try different filters." /> : null}

            <div className="relative mt-2 h-[min(76vw,520px)] w-[min(76vw,520px)]">
              <span
                ref={pulseRef}
                className="pointer-events-none absolute inset-[10%] rounded-full border border-[#00F0FF]/55"
                aria-hidden
              />
              <span
                ref={sweepRef}
                className="anispin-reactor-sweep pointer-events-none absolute inset-[7%] rounded-full"
                aria-hidden
              />
              <div
                ref={ringRef}
                className="anispin-reactor-outer absolute inset-0 rounded-full"
              />
              <div className="anispin-reactor-dotted absolute inset-[16%] rounded-full" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div
                  ref={spinButtonRef}
                  onMouseEnter={onSpinHoverStart}
                  onMouseLeave={onSpinHoverEnd}
                  className="will-change-transform"
                >
                  <Button
                    className="anispin-spin-button h-24 w-24 rounded-full text-xl font-black uppercase tracking-wider text-[#0B0F1A]"
                    onClick={onSpinClick}
                    disabled={isSpinning || isLoading || filteredList.length === 0}
                  >
                    {isSpinning ? "Spinning" : "Spin"}
                  </Button>
                </div>
              </div>
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#FF5E00]">
              Let the wheel decide.
            </p>

            {!isSpinning && selectedAnime ? (
              <article className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-white/10 bg-[#11162A]/92">
                {selectedAnime.banner ? (
                  <Image
                    src={selectedAnime.banner}
                    alt="banner"
                    fill
                    className="object-cover opacity-35"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-[#FF5E00]/35 via-[#0F1220] to-[#00F0FF]/28" />
                )}
                <div className="relative flex items-start gap-4 p-4">
                  <Image
                    src={selectedAnime.poster}
                    alt={selectedAnime.title}
                    width={300}
                    height={420}
                    loading="lazy"
                    className="h-32 w-24 rounded-lg object-cover"
                  />
                  <div className="min-w-0">
                    <p className="anispin-display text-3xl text-white">{selectedAnime.title}</p>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/80">
                      {formatStatus(selectedAnime.status)} | {selectedAnime.episodes ?? "?"} EPS
                    </p>
                    <p className="mt-2 text-sm font-semibold text-white/88">
                      Score: {selectedAnime.score ?? "N/A"} | Popularity: {selectedAnime.popularity ?? "N/A"}
                    </p>
                    <p className="mt-2 text-xs font-medium text-white/78">
                      {selectedAnime.genres.join(", ")}
                    </p>
                  </div>
                </div>
              </article>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}

function AnimeCollectionSection({
  id,
  title,
  animeList,
  isLoading,
  error,
  showTopTen,
}: {
  id: string;
  title: string;
  animeList: Anime[];
  isLoading: boolean;
  error: string | null;
  showTopTen?: boolean;
}) {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const gridRef = useRef<HTMLDivElement | null>(null);
  const infoRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    if (!gridRef.current || animeList.length === 0) return;
    const cards = gridRef.current.querySelectorAll(".anispin-grid-card");
    const gridAnim = animate(cards, {
      opacity: [0, 1],
      translateY: [24, 0],
      delay: stagger(45),
      duration: 520,
      ease: "out(3)",
    });
    return () => {
      gridAnim.pause();
    };
  }, [animeList]);

  useEffect(() => {
    if (hoveredIndex === null) return;
    const infoPanel = infoRefs.current[hoveredIndex];
    if (!infoPanel) return;
    animate(infoPanel, {
      opacity: [0, 1],
      translateX: [-18, 0],
      duration: 230,
      ease: "out(3)",
    });
  }, [hoveredIndex]);

  const topTen = useMemo(() => animeList.slice(0, 10), [animeList]);
  const renderedList = useMemo(() => animeList.slice(0, 15), [animeList]);

  return (
    <section id={id} className="py-12 md:py-16">
      <div className="mx-auto w-full max-w-[1600px] px-3 md:px-5">
        <div className="mb-4 flex items-center gap-3">
          <Flame className="size-7 text-[#FF5E00]" />
          <h2 className="anispin-display text-5xl text-white md:text-6xl">{title}</h2>
        </div>

        {error ? (
          <StatusBubble text="Unable to load anime. Try again later." />
        ) : isLoading ? (
          <AnimeGridSkeleton />
        ) : renderedList.length === 0 ? (
          <StatusBubble text="No matches found. Try different filters." />
        ) : (
          <div className="flex items-start gap-4">
            <div className="min-w-0 flex-1 lg:-ml-4">
              <div
                ref={gridRef}
                className="grid grid-cols-2 gap-3 md:grid-cols-4 lg:gap-3.5 xl:grid-cols-5"
              >
                {renderedList.map((anime, index) => {
                  const isHovered = hoveredIndex === index;
                  return (
                    <article
                      key={`${id}-${anime.id}`}
                      className="anispin-grid-card group relative rounded-xl p-1.5 will-change-transform hover:z-30 hover:border-[#00F0FF]/65"
                      style={{ rotate: `${index % 2 === 0 ? -2 : 2}deg` }}
                      onMouseEnter={() => setHoveredIndex(index)}
                      onMouseLeave={() => setHoveredIndex(null)}
                    >
                      <div className="anispin-poster-media relative overflow-visible rounded-lg">
                        <Image
                          src={anime.poster}
                          alt={anime.title}
                          width={300}
                          height={420}
                          loading="lazy"
                          className="h-[200px] w-full rounded-lg object-cover md:h-[210px]"
                        />

                        <span className="absolute left-2 top-2 rounded-md bg-[#0B0F1A]/78 px-2 py-0.5 text-[11px] font-bold text-[#00F0FF]">
                          {anime.score ?? "N/A"}
                        </span>
                        <span className="absolute right-2 top-2 rounded-md bg-[#0B0F1A]/78 px-2 py-0.5 text-[11px] font-bold text-[#FF5E00]">
                          {formatStatus(anime.status)}
                        </span>
                        <span className="absolute bottom-2 left-2 text-2xl font-black text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      </div>

                      <h3 className="mt-2 truncate px-1 text-sm font-black uppercase text-white">
                        {anime.title}
                      </h3>

                      {isHovered ? (
                        <div
                          ref={(element) => {
                            infoRefs.current[index] = element;
                          }}
                          className="anispin-floating-info absolute left-[72%] top-3 z-40 w-60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.75)]"
                        >
                          <p className="text-sm font-black uppercase text-white">{anime.title}</p>
                          <p className="mt-1 text-xs font-semibold text-white/82">
                            Rating {anime.score ?? "N/A"} | {anime.episodes ?? "?"} EPS
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-white/72">
                            {anime.genres.join(", ")}
                          </p>
                          <Button className="anispin-secondary-button mt-3 h-8 rounded-full px-3 text-[11px] font-black uppercase text-white">
                            Watch Now
                          </Button>
                        </div>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </div>

            {showTopTen ? (
              <aside className="anispin-ranking-panel hidden w-[300px] shrink-0 rounded-xl p-3 lg:block">
                <h3 className="anispin-display mb-3 text-4xl text-white">Top 10</h3>
                <div className="space-y-2.5">
                  {topTen.map((anime, index) => (
                    <div key={`${id}-top-${anime.id}`} className="flex items-center gap-2.5">
                      <span className="w-10 text-3xl font-black text-[#FF5E00]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                      <Image
                        src={anime.poster}
                        alt={`${anime.title} thumbnail`}
                        width={90}
                        height={120}
                        loading="lazy"
                        className="h-12 w-9 rounded-md object-cover"
                      />
                      <div className="min-w-0">
                        <p className="truncate text-xs font-bold uppercase text-white">{anime.title}</p>
                        <p className="text-[11px] font-semibold text-[#00F0FF]">{anime.score ?? "N/A"}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </aside>
            ) : null}
          </div>
        )}
      </div>
    </section>
  );
}

function FeatureStripSection() {
  const scrollerRef = useRef<HTMLDivElement | null>(null);

  const onWheelHorizontal = (event: WheelEvent<HTMLDivElement>) => {
    if (!scrollerRef.current) return;
    if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
    event.preventDefault();
    scrollerRef.current.scrollLeft += event.deltaY;
  };

  return (
    <section className="overflow-hidden py-12 md:py-20">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col justify-center px-3 md:px-5">
        <div className="mb-5 flex items-center gap-3">
          <Star className="size-6 text-[#00F0FF]" />
          <h2 className="anispin-display text-5xl text-white md:text-6xl">
            Filter The Chaos
          </h2>
        </div>

        <div
          ref={scrollerRef}
          className="anispin-horizontal-scroll overflow-x-auto overflow-y-hidden pb-3"
          onWheel={onWheelHorizontal}
        >
          <div className="flex w-max gap-4 pr-8">
            {FEATURE_STRIP.map((item, index) => (
              <article
                key={item.title}
                className="anispin-feature-card flex h-[56vh] w-[80vw] max-w-[460px] shrink-0 flex-col justify-between rounded-2xl p-6 shadow-[0_20px_35px_rgba(0,0,0,0.6)] md:w-[58vw] lg:w-[32vw]"
                style={{ rotate: `${index % 2 === 0 ? -3 : 3}deg` }}
              >
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#00F0FF]">
                  Chaos Control {String(index + 1).padStart(2, "0")}
                </p>
                <h3 className="anispin-display text-5xl text-white md:text-6xl">
                  {item.title}
                </h3>
                <p className="max-w-sm text-base font-semibold text-white/88">
                  {item.subtitle}
                </p>
              </article>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function SectionHeader() {
  return (
    <section className="py-10">
      <div className="mx-auto w-full max-w-[1600px] px-3 md:px-5">
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-white/10 bg-[#11162A]/90 p-4">
          <Tv className="size-5 text-[#00F0FF]" />
          <Clapperboard className="size-5 text-[#FF5E00]" />
          <p className="text-sm font-black uppercase tracking-[0.16em] text-white/88">
            Live AniList Data Layer Active
          </p>
        </div>
      </div>
    </section>
  );
}

export function AniSpinLandingPage() {
  const trendingFilters = useMemo<Filters>(() => ({}), []);
  const airingFilters = useMemo<Filters>(() => ({ status: "AIRING" }), []);
  const completedFilters = useMemo<Filters>(() => ({ status: "FINISHED" }), []);

  const trendingQuery = useAnimeQuery(trendingFilters);
  const airingQuery = useAnimeQuery(airingFilters);
  const completedQuery = useAnimeQuery(completedFilters);

  return (
    <main className="anispin-page text-white/92">
      <ChaosHeader />
      <SectionHeader />
      <ChaosHeroSection
        animeList={trendingQuery.animeList}
        isLoading={trendingQuery.isLoading}
        error={trendingQuery.error}
      />
      <SpinReactorSection />
      <AnimeCollectionSection
        id="trending"
        title="Trending"
        animeList={trendingQuery.animeList}
        isLoading={trendingQuery.isLoading}
        error={trendingQuery.error}
        showTopTen
      />
      <AnimeCollectionSection
        id="top-airing"
        title="Top Airing"
        animeList={airingQuery.animeList}
        isLoading={airingQuery.isLoading}
        error={airingQuery.error}
      />
      <AnimeCollectionSection
        id="completed"
        title="Completed"
        animeList={completedQuery.animeList}
        isLoading={completedQuery.isLoading}
        error={completedQuery.error}
      />
      <FeatureStripSection />
    </main>
  );
}
