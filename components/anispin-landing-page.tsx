"use client";

import Image from "next/image";
import Link from "next/link";
import { animate, stagger } from "animejs";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Flame } from "lucide-react";
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";

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

const LENGTH_OPTIONS: Array<{
  value: NonNullable<Filters["length"]>;
  label: string;
  range: string;
}> = [
  { value: "SHORT", label: "Short", range: "1-12 eps" },
  { value: "MEDIUM", label: "Medium", range: "13-26 eps" },
  { value: "LONG", label: "Long", range: "27-100 eps" },
  { value: "VERY_LONG", label: "Saga", range: "101+ eps" },
];

const WHEEL_SIZE = 1000;
const WHEEL_CENTER = WHEEL_SIZE / 2;
const WHEEL_OUTER_RADIUS = 468;
const WHEEL_INNER_RADIUS = 188;
const WHEEL_FALLBACK_COLORS = ["#FF5E00", "#00F0FF", "#FF007A", "#7B2EFF", "#B4FF00"] as const;
const SPIN_DURATION_MS = 2200;
const PLACEHOLDER_SEGMENTS = Array.from({ length: 8 }, (_, index) => ({
  id: -1 - index,
  title: "Awaiting Data",
  poster: "",
  genres: [],
  description: "",
}));

type WheelSlice = {
  path: string;
  labelX: number;
  labelY: number;
  labelAngle: number;
  fallbackColor: string;
};

function polarToCartesian(cx: number, cy: number, radius: number, angleDeg: number) {
  const radians = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + radius * Math.cos(radians),
    y: cy + radius * Math.sin(radians),
  };
}

function describeSlicePath(
  cx: number,
  cy: number,
  innerRadius: number,
  outerRadius: number,
  startAngle: number,
  endAngle: number,
) {
  const outerStart = polarToCartesian(cx, cy, outerRadius, endAngle);
  const outerEnd = polarToCartesian(cx, cy, outerRadius, startAngle);
  const innerStart = polarToCartesian(cx, cy, innerRadius, startAngle);
  const innerEnd = polarToCartesian(cx, cy, innerRadius, endAngle);
  const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${outerStart.x} ${outerStart.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArcFlag} 0 ${outerEnd.x} ${outerEnd.y}`,
    `L ${innerStart.x} ${innerStart.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 1 ${innerEnd.x} ${innerEnd.y}`,
    "Z",
  ].join(" ");
}

function truncateWheelTitle(title: string) {
  return title.length > 16 ? `${title.slice(0, 16)}...` : title;
}

function formatStatus(status?: string | null) {
  if (!status) return "UNKNOWN";
  if (status === "RELEASING") return "AIRING";
  return status;
}

function getEpisodeDisplay(anime: Pick<Anime, "status" | "episodes">) {
  if (anime.status === "RELEASING" && !anime.episodes) {
    return "Ongoing";
  }

  if (!anime.episodes) {
    return "Unknown";
  }

  return `${anime.episodes} Episodes`;
}

function getCommitmentLabel(episodes?: number | null, status?: string) {
  if (status === "RELEASING") return "Ongoing";
  if (!episodes) return "Unknown";

  if (episodes <= 12) return "Short";
  if (episodes <= 26) return "Medium";
  if (episodes <= 100) return "Long";
  return "Saga";
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
            className="anispin-logo-lockup"
            aria-label="AniSpin logo"
          >
            <Image
              src="/anispin-logo-exact.png"
              alt="AniSpin logo"
              width={1536}
              height={1536}
              className="h-12 w-12 rounded-md object-contain"
              priority
            />
          </div>
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
                      <Link href={`/anime/${anime.id}`} className="block h-full w-full">
                        <Image
                          src={anime.poster}
                          alt={anime.title}
                          width={320}
                          height={460}
                          loading="lazy"
                          className="h-full w-full object-cover"
                        />
                      </Link>
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
  const [activeSliceIndex, setActiveSliceIndex] = useState<number | null>(null);
  const [winnerPulse, setWinnerPulse] = useState(false);
  const [highlightResult, setHighlightResult] = useState(false);
  const wheelId = useId().replace(/:/g, "");
  const {
    filteredList,
    wheelPool,
    selectedAnime,
    isLoading,
    error,
    isSpinning,
    spin,
  } = useSpinEngine(filters);

  const ringRef = useRef<HTMLDivElement | null>(null);
  const pulseRef = useRef<HTMLSpanElement | null>(null);
  const sweepRef = useRef<HTMLSpanElement | null>(null);
  const innerRingRef = useRef<HTMLDivElement | null>(null);
  const coreGlowRef = useRef<HTMLDivElement | null>(null);
  const spinButtonRef = useRef<HTMLDivElement | null>(null);
  const resultRef = useRef<HTMLDivElement | null>(null);
  const wheelRotationRef = useRef(0);
  const spinRafRef = useRef<number | null>(null);
  const previousRotationRef = useRef(0);
  const previousFrameTimeRef = useRef<number | null>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const winnerPulseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const wheelAnime = wheelPool;
  const displaySegments = wheelAnime.length > 0 ? wheelAnime : PLACEHOLDER_SEGMENTS;

  const wheelSlices = useMemo<WheelSlice[]>(() => {
    const sliceCount = displaySegments.length;
    const sliceAngle = 360 / sliceCount;

    return displaySegments.map((_, index) => {
      const startAngle = index * sliceAngle;
      const endAngle = startAngle + sliceAngle;
      const middleAngle = startAngle + sliceAngle / 2;
      const labelPosition = polarToCartesian(
        WHEEL_CENTER,
        WHEEL_CENTER,
        (WHEEL_OUTER_RADIUS + WHEEL_INNER_RADIUS) / 2,
        middleAngle,
      );

      return {
        path: describeSlicePath(
          WHEEL_CENTER,
          WHEEL_CENTER,
          WHEEL_INNER_RADIUS,
          WHEEL_OUTER_RADIUS,
          startAngle,
          endAngle,
        ),
        labelX: labelPosition.x,
        labelY: labelPosition.y,
        labelAngle: middleAngle,
        fallbackColor: WHEEL_FALLBACK_COLORS[index % WHEEL_FALLBACK_COLORS.length],
      };
    });
  }, [displaySegments]);

  const stopSpinFrame = useCallback(() => {
    if (spinRafRef.current !== null) {
      window.cancelAnimationFrame(spinRafRef.current);
      spinRafRef.current = null;
    }

    previousFrameTimeRef.current = null;

    if (ringRef.current) {
      ringRef.current.style.setProperty("--spin-blur", "0px");
      ringRef.current.style.setProperty("--spin-glow-strength", "0.38");
    }
  }, []);

  const startSpinFrame = useCallback(() => {
    if (!ringRef.current) return;

    stopSpinFrame();
    previousRotationRef.current =
      Number(gsap.getProperty(ringRef.current, "rotation")) || wheelRotationRef.current;

    const updateFrame = (time: number) => {
      if (!ringRef.current) {
        stopSpinFrame();
        return;
      }

      const previousTime = previousFrameTimeRef.current ?? time;
      const elapsed = Math.max(16, time - previousTime);
      const currentRotation = Number(gsap.getProperty(ringRef.current, "rotation")) || 0;
      const rotationDelta = Math.abs(currentRotation - previousRotationRef.current);
      const velocity = rotationDelta / (elapsed / 16.67);
      const intensity = Math.min(1, velocity / 18);

      ringRef.current.style.setProperty("--spin-blur", `${(intensity * 2.4).toFixed(2)}px`);
      ringRef.current.style.setProperty(
        "--spin-glow-strength",
        `${(0.38 + intensity * 0.62).toFixed(2)}`,
      );

      previousRotationRef.current = currentRotation;
      previousFrameTimeRef.current = time;
      spinRafRef.current = window.requestAnimationFrame(updateFrame);
    };

    spinRafRef.current = window.requestAnimationFrame(updateFrame);
  }, [stopSpinFrame]);

  useEffect(() => {
    if (ringRef.current) {
      gsap.set(ringRef.current, {
        transformOrigin: "50% 50%",
        rotation: 0,
        force3D: true,
      });
    }
  }, []);

  useEffect(() => {
    const running: Array<{ pause: () => void }> = [];

    if (pulseRef.current) {
      running.push(
        animate(pulseRef.current, {
          scale: [0.88, 1.2],
          opacity: [0.42, 0],
          duration: 1900,
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

    if (innerRingRef.current) {
      running.push(
        animate(innerRingRef.current, {
          rotate: [0, 360],
          duration: 19000,
          ease: "linear",
          loop: true,
        }),
      );
    }

    if (coreGlowRef.current) {
      running.push(
        animate(coreGlowRef.current, {
          scale: [1, 1.04],
          duration: 1200,
          ease: "inOutSine",
          alternate: true,
          loop: true,
        }),
      );
    }

    return () => {
      running.forEach((animation) => animation.pause());
    };
  }, []);

  useEffect(() => {
    return () => {
      stopSpinFrame();

      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
      if (winnerPulseTimerRef.current) clearTimeout(winnerPulseTimerRef.current);
    };
  }, [stopSpinFrame]);

  const onSpinHoverStart = () => {
    if (spinButtonRef.current) {
      animate(spinButtonRef.current, {
        scale: 1.08,
        duration: 210,
        ease: "out(4)",
      });
    }

    if (coreGlowRef.current) {
      animate(coreGlowRef.current, {
        scale: 1.08,
        duration: 210,
        ease: "out(3)",
      });
    }
  };

  const onSpinHoverEnd = () => {
    if (spinButtonRef.current) {
      animate(spinButtonRef.current, {
        scale: 1,
        duration: 200,
        ease: "out(3)",
      });
    }

    if (coreGlowRef.current) {
      animate(coreGlowRef.current, {
        scale: 1,
        duration: 200,
        ease: "out(3)",
      });
    }
  };

  const onSpinClick = () => {
    if (!ringRef.current || wheelAnime.length === 0 || isSpinning || isLoading) return;

    const result = spin(wheelAnime, SPIN_DURATION_MS);
    if (!result) return;

    const sliceCount = wheelAnime.length;
    const sliceAngle = 360 / sliceCount;
    const targetSlice = result.pickedIndex % sliceCount;
    const targetSliceCenter = targetSlice * sliceAngle + sliceAngle / 2;
    const targetNormalized = (270 - targetSliceCenter + 360) % 360;
    const currentNormalized = ((wheelRotationRef.current % 360) + 360) % 360;
    const delta = (targetNormalized - currentNormalized + 360) % 360;
    const nextRotation = wheelRotationRef.current + 360 * 6 + delta;

    setActiveSliceIndex(null);
    setWinnerPulse(false);
    setHighlightResult(false);
    startSpinFrame();

    gsap.timeline({
      onComplete: () => {
        wheelRotationRef.current = nextRotation;
        stopSpinFrame();
        setActiveSliceIndex(targetSlice);
        setWinnerPulse(true);

        if (winnerPulseTimerRef.current) clearTimeout(winnerPulseTimerRef.current);
        winnerPulseTimerRef.current = setTimeout(() => setWinnerPulse(false), 420);

        if (resultRef.current && result.picked) {
          if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
          scrollTimerRef.current = setTimeout(() => {
            resultRef.current?.scrollIntoView({
              behavior: "smooth",
              block: "start",
            });

            setHighlightResult(true);
            if (highlightTimerRef.current) clearTimeout(highlightTimerRef.current);
            highlightTimerRef.current = setTimeout(() => setHighlightResult(false), 1500);
          }, 150);
        }
      },
    })
      .to(
        ringRef.current,
        {
          rotation: nextRotation,
          duration: SPIN_DURATION_MS / 1000,
          ease: "power4.out",
        },
        0
      );
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

            <div className="w-full max-w-3xl rounded-2xl border border-white/10 bg-[#11162A]/60 p-3">
              <p className="text-[11px] font-black uppercase tracking-[0.16em] text-white/70">Length</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                {LENGTH_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={`rounded-full px-3 py-1.5 text-[11px] font-black uppercase tracking-wide ${
                      filters.length === option.value
                        ? "anispin-secondary-button text-white"
                        : "bg-white/10 text-white/85 hover:bg-white/15"
                    }`}
                    onClick={() =>
                      setFilters((prev) => ({
                        ...prev,
                        length: prev.length === option.value ? undefined : option.value,
                      }))
                    }
                  >
                    {option.label}
                    <span className="ml-1 text-white/70">({option.range})</span>
                  </button>
                ))}
              </div>
            </div>

            {error ? <StatusBubble text="Unable to load anime. Try again later." /> : null}
            {isEmpty ? <StatusBubble text="No matches found. Try different filters." /> : null}

            <div className="anispin-wheel-scene relative mt-2 h-[min(76vw,520px)] w-[min(76vw,520px)]">
              <span
                ref={pulseRef}
                className="anispin-wheel-aura pointer-events-none absolute inset-[8%] rounded-full"
                aria-hidden
              />
              <span
                ref={sweepRef}
                className="anispin-wheel-sweep pointer-events-none absolute inset-[4%] rounded-full"
                aria-hidden
              />

              <div className="anispin-wheel-ring absolute inset-0">
                <div
                  ref={ringRef}
                  className={`anispin-wheel-rotor absolute inset-0 ${isSpinning ? "is-spinning" : ""}`}
                  style={
                    {
                      "--spin-blur": "0px",
                      "--spin-glow-strength": "0.38",
                    } as CSSProperties
                  }
                >
                <svg
                  viewBox={`0 0 ${WHEEL_SIZE} ${WHEEL_SIZE}`}
                  className="h-full w-full"
                  aria-label="Anime spin wheel"
                >
                  <defs>
                    <filter id={`${wheelId}-slice-blur`}>
                      <feGaussianBlur stdDeviation="3.2" />
                    </filter>
                    {wheelSlices.map((slice, index) => (
                      <g key={`${wheelId}-defs-${index}`}>
                        <clipPath id={`${wheelId}-clip-${index}`}>
                          <path d={slice.path} />
                        </clipPath>
                        <linearGradient
                          id={`${wheelId}-overlay-${index}`}
                          x1="0%"
                          y1="0%"
                          x2="100%"
                          y2="100%"
                        >
                          <stop offset="0%" stopColor="rgba(5, 7, 15, 0.36)" />
                          <stop offset="58%" stopColor="rgba(5, 7, 15, 0.56)" />
                          <stop offset="100%" stopColor="rgba(5, 7, 15, 0.74)" />
                        </linearGradient>
                      </g>
                    ))}
                  </defs>

                  {displaySegments.map((anime, index) => {
                    const slice = wheelSlices[index];
                    if (!slice) return null;

                    return (
                      <g key={`wheel-slice-${anime.id}-${index}`}>
                        <path d={slice.path} fill={slice.fallbackColor} opacity={0.9} />
                        {anime.poster ? (
                          <image
                            href={anime.poster}
                            x={0}
                            y={0}
                            width={WHEEL_SIZE}
                            height={WHEEL_SIZE}
                            preserveAspectRatio="xMidYMid slice"
                            clipPath={`url(#${wheelId}-clip-${index})`}
                            filter={`url(#${wheelId}-slice-blur)`}
                            opacity={0.92}
                          />
                        ) : null}
                        <path d={slice.path} fill={`url(#${wheelId}-overlay-${index})`} />
                        <path d={slice.path} className="anispin-wheel-slice-border" />
                        <text
                          x={slice.labelX}
                          y={slice.labelY}
                          textAnchor="middle"
                          dominantBaseline="middle"
                          className="anispin-wheel-label"
                          transform={`rotate(${slice.labelAngle + 90} ${slice.labelX} ${slice.labelY})`}
                        >
                          {truncateWheelTitle(anime.title)}
                        </text>
                        {activeSliceIndex === index ? (
                          <path
                            d={slice.path}
                            className={`anispin-wheel-winner ${winnerPulse ? "is-pulsing" : ""}`}
                          />
                        ) : null}
                      </g>
                    );
                  })}
                </svg>

                <div className="anispin-wheel-inner-shadow absolute inset-[9%] rounded-full" />
                <div
                  ref={innerRingRef}
                  className="anispin-wheel-inner-ring absolute inset-[16%] rounded-full"
                />
                <div className="anispin-wheel-reflection pointer-events-none absolute inset-[11%] rounded-full" />
                </div>
              </div>

              <div className="absolute inset-0 flex items-center justify-center">
                <div ref={coreGlowRef} className="anispin-wheel-core-shell relative flex items-center justify-center">
                  <span className="anispin-wheel-core-pulse absolute inset-0 rounded-full" aria-hidden />
                  <div
                    ref={spinButtonRef}
                    onMouseEnter={onSpinHoverStart}
                    onMouseLeave={onSpinHoverEnd}
                    className="will-change-transform"
                  >
                    <Button
                      className="anispin-spin-button h-24 w-24 rounded-full text-xl font-black uppercase tracking-wider text-[#0B0F1A]"
                      onClick={onSpinClick}
                      disabled={isSpinning || isLoading || wheelAnime.length === 0}
                    >
                      {isSpinning ? "Spinning" : "Spin"}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-sm font-bold uppercase tracking-[0.14em] text-[#FF5E00]">
              Let the wheel decide.
            </p>

            <div ref={resultRef} className="w-full max-w-2xl scroll-mt-28">
              {!isSpinning && selectedAnime ? (
                <Link href={`/anime/${selectedAnime.id}`} className="block">
                  <article
                    className={`anispin-result-card relative overflow-hidden rounded-2xl border border-white/10 bg-[#11162A]/92 ${
                      highlightResult ? "anispin-result-highlight" : ""
                    }`}
                  >
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
                          {formatStatus(selectedAnime.status)} | {getEpisodeDisplay(selectedAnime)}
                        </p>
                        <p className="mt-2 text-sm font-semibold text-white/88">
                          Score: {selectedAnime.score ?? "Unknown"} | Popularity: {selectedAnime.popularity ?? "Unknown"}
                        </p>
                        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-white/66">
                          Commitment: {getCommitmentLabel(selectedAnime.episodes, selectedAnime.status)}
                        </p>
                        <p className="mt-2 text-xs font-medium text-white/78">
                          {selectedAnime.genres.join(", ")}
                        </p>
                        <p className="mt-2 text-xs font-semibold text-white/72">
                          Chosen based on your active filters.
                        </p>
                        <p className="mt-3 text-xs font-black uppercase tracking-wide text-[#00F0FF]">
                          View Details
                        </p>
                      </div>
                    </div>
                  </article>
                </Link>
              ) : null}
            </div>
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
                      <Link href={`/anime/${anime.id}`} className="block">
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
                            {anime.score ?? "Unknown"}
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
                      </Link>

                      {isHovered ? (
                        <div
                          ref={(element) => {
                            infoRefs.current[index] = element;
                          }}
                          className="anispin-floating-info absolute left-[72%] top-3 z-40 w-60 rounded-xl p-3 shadow-[0_20px_40px_rgba(0,0,0,0.75)]"
                        >
                          <p className="text-sm font-black uppercase text-white">{anime.title}</p>
                          <p className="mt-1 text-xs font-semibold text-white/82">
                            Rating {anime.score ?? "Unknown"} | {getEpisodeDisplay(anime)}
                          </p>
                          <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-white/66">
                            Commitment: {getCommitmentLabel(anime.episodes, anime.status)}
                          </p>
                          <p className="mt-2 text-xs leading-relaxed text-white/72">
                            {anime.genres.join(", ")}
                          </p>
                          <Link
                            href={`/anime/${anime.id}`}
                            className="anispin-secondary-button mt-3 inline-flex h-8 items-center rounded-full px-3 text-[11px] font-black uppercase text-white"
                          >
                            View Details
                          </Link>
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
                    <Link key={`${id}-top-${anime.id}`} href={`/anime/${anime.id}`} className="block">
                      <div className="flex items-center gap-2.5">
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
                          <p className="text-[11px] font-semibold text-[#00F0FF]">{anime.score ?? "Unknown"}</p>
                        </div>
                      </div>
                    </Link>
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
    </main>
  );
}
