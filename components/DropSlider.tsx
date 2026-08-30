'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { DropSlide } from '@/lib/drops';
import { IconArrowRight } from './icons';

const AUTOPLAY_MS = 5000;

/**
 * Hero banner slider — Flipkart/Amazon style: one full-width slide at a
 * time, auto-rotating (pauses on hover/focus, respects reduced motion),
 * swipeable on mobile, arrows + dots everywhere.
 * Content comes from lib/drops.ts so new drops are one file edit.
 */
export default function DropSlider({ slides }: { slides: DropSlide[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const [paused, setPaused] = useState(false);

  const step = useCallback(() => {
    const track = trackRef.current;
    if (!track) return 0;
    const first = track.firstElementChild as HTMLElement | null;
    if (!first) return 0;
    const gap = parseFloat(getComputedStyle(track).columnGap || '0') || 0;
    return first.offsetWidth + gap;
  }, []);

  // Track the active slide while the user swipes/scrolls.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const stepSize = step();
        if (!stepSize) return;
        setActive(Math.min(slides.length - 1, Math.max(0, Math.round(track.scrollLeft / stepSize))));
      });
    };
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      cancelAnimationFrame(frame);
    };
  }, [slides.length, step]);

  const goTo = useCallback(
    (index: number) => {
      const track = trackRef.current;
      if (!track) return;
      const clamped = (index + slides.length) % slides.length;
      track.scrollTo({ left: clamped * step(), behavior: 'smooth' });
      setActive(clamped);
    },
    [slides.length, step]
  );

  // Autoplay: advance one slide, reset whenever the slide or pause state changes.
  useEffect(() => {
    if (paused || slides.length < 2) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const timer = window.setTimeout(() => goTo(active + 1), AUTOPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [active, paused, goTo, slides.length]);

  if (!slides.length) return null;

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Featured drops"
      className="relative"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
    >
      <div
        ref={trackRef}
        className="scrollbar-none flex snap-x snap-mandatory overflow-x-auto"
        onTouchStart={() => setPaused(true)}
      >
        {slides.map((slide, index) => (
          <div
            key={slide.src}
            role="group"
            aria-roledescription="slide"
            aria-label={`${index + 1} of ${slides.length}`}
            className="relative w-full shrink-0 snap-center"
          >
            <Link
              href={slide.href}
              aria-label={slide.alt}
              className="group relative block aspect-[4/3] w-full overflow-hidden bg-surface sm:aspect-[16/9] lg:aspect-[21/9]"
            >
              <Image
                src={slide.src}
                alt=""
                fill
                loading={index === 0 ? 'eager' : 'lazy'}
                priority={index === 0}
                sizes="100vw"
                className="object-cover"
                style={slide.focus ? { objectPosition: slide.focus } : undefined}
              />
              {/* legibility scrim for the CTA */}
              <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/60 to-transparent" />
              <span className="absolute bottom-5 right-5 inline-flex items-center gap-1.5 rounded-full bg-accent px-5 py-2.5 text-[11px] font-bold uppercase tracking-wider text-black shadow-lg transition-transform group-hover:-translate-y-0.5 md:bottom-8 md:right-10">
                Shop the drop <IconArrowRight className="h-3.5 w-3.5" />
              </span>
            </Link>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={() => goTo(active - 1)}
        aria-label="Previous slide"
        className="absolute left-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 md:flex"
      >
        <IconArrowRight className="h-4 w-4 rotate-180" />
      </button>
      <button
        type="button"
        onClick={() => goTo(active + 1)}
        aria-label="Next slide"
        className="absolute right-3 top-1/2 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur transition-colors hover:bg-black/70 md:flex"
      >
        <IconArrowRight className="h-4 w-4" />
      </button>

      <div className="absolute inset-x-0 bottom-4 flex items-center justify-center gap-2">
        {slides.map((slide, index) => (
          <button
            key={slide.src}
            type="button"
            aria-selected={index === active}
            aria-label={`Go to slide ${index + 1}`}
            onClick={() => goTo(index)}
            className={`h-2 rounded-full transition-all ${index === active ? 'w-7 bg-white' : 'w-2 bg-white/45 hover:bg-white/75'}`}
          />
        ))}
      </div>
    </section>
  );
}
