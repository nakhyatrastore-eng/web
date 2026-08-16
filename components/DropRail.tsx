'use client';

import { useRef, useState } from 'react';
import type { ProductCardData } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function DropRail({ products }: { products: ProductCardData[] }) {
  const railRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function updateProgress() {
    if (!railRef.current) return;
    const cards = Array.from(
      railRef.current.querySelectorAll<HTMLElement>('[data-drop-card]')
    );
    if (!cards.length) return;
    const railLeft = railRef.current.getBoundingClientRect().left;
    let nearestIndex = 0;
    let nearestDistance = Number.POSITIVE_INFINITY;
    cards.forEach((card, index) => {
      const distance = Math.abs(card.getBoundingClientRect().left - railLeft);
      if (distance < nearestDistance) {
        nearestIndex = index;
        nearestDistance = distance;
      }
    });
    setActiveIndex(nearestIndex);
  }

  return (
    <div>
      <div
        ref={railRef}
        className="catalogue-lead__rail drop-rail"
        aria-roledescription="carousel"
        aria-label="Drop 01 phone cases"
        onScroll={() => {
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          frameRef.current = requestAnimationFrame(updateProgress);
        }}
      >
        {products.map((product, index) => (
          <div key={product.id} data-drop-card className="catalogue-lead__card">
            <ProductCard product={product} priority={index < 2} />
          </div>
        ))}
      </div>
      <div className="drop-rail__status md:hidden" aria-live="polite">
        <span>{String(activeIndex + 1).padStart(2, '0')} / {String(products.length).padStart(2, '0')}</span>
        <span className="drop-rail__track" aria-hidden="true"><span style={{ width: `${((activeIndex + 1) / products.length) * 100}%` }} /></span>
        <span>Swipe the drop →</span>
      </div>
    </div>
  );
}
