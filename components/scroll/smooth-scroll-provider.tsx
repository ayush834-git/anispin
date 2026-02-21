"use client";

import Lenis from "lenis";
import { useEffect } from "react";

import { usePrefersReducedMotion } from "@/hooks/use-prefers-reduced-motion";

type SmoothScrollProviderProps = {
  children: React.ReactNode;
};

export function SmoothScrollProvider({ children }: SmoothScrollProviderProps) {
  const prefersReducedMotion = usePrefersReducedMotion();

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.05,
      smoothWheel: true,
      syncTouch: false,
      autoRaf: false,
      wheelMultiplier: 0.95,
      touchMultiplier: 1.0,
    });

    let cleanupScrollTrigger: (() => void) | undefined;
    let isCancelled = false;

    void (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);

      if (isCancelled) {
        return;
      }

      const scroller = document.documentElement;
      gsap.registerPlugin(ScrollTrigger);

      const onLenisScroll = () => ScrollTrigger.update();
      const onRefresh = () => lenis.resize();

      ScrollTrigger.scrollerProxy(scroller, {
        scrollTop(value) {
          if (typeof value === "number") {
            lenis.scrollTo(value, { immediate: true, force: true });
          }
          return lenis.scroll;
        },
        getBoundingClientRect() {
          return {
            top: 0,
            left: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };
        },
        pinType: "transform",
      });

      ScrollTrigger.defaults({ scroller });
      lenis.on("scroll", onLenisScroll);
      ScrollTrigger.addEventListener("refresh", onRefresh);
      ScrollTrigger.refresh();

      cleanupScrollTrigger = () => {
        lenis.off("scroll", onLenisScroll);
        ScrollTrigger.removeEventListener("refresh", onRefresh);
        ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
        ScrollTrigger.clearScrollMemory();
        ScrollTrigger.defaults({});
      };
    })();

    let rafId = 0;
    const raf = (time: number) => {
      lenis.raf(time);
      rafId = window.requestAnimationFrame(raf);
    };

    rafId = window.requestAnimationFrame(raf);

    return () => {
      isCancelled = true;
      cleanupScrollTrigger?.();
      window.cancelAnimationFrame(rafId);
      lenis.destroy();
    };
  }, [prefersReducedMotion]);

  return children;
}
