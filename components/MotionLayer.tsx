'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';

export default function MotionLayer() {
  const pathname = usePathname();

  useEffect(() => {
    document.documentElement.classList.add('motion-ready');
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return () => undefined;
    }
    let observer: IntersectionObserver | null = null;
    const timer = window.setTimeout(() => {
      const elements = document.querySelectorAll<HTMLElement>('[data-reveal]');
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-visible');
            observer?.unobserve(entry.target);
          }
        },
        { threshold: 0.12, rootMargin: '0px 0px -5% 0px' }
      );
      elements.forEach((element) => observer?.observe(element));
    }, 250);
    return () => {
      window.clearTimeout(timer);
      observer?.disconnect();
    };
  }, [pathname]);

  return null;
}
