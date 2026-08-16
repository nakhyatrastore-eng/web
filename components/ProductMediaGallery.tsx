'use client';

import { useMemo, useRef, useState } from 'react';
import Image from 'next/image';
import type { Product, ProductMedia } from '@/lib/catalog';

function mediaFor(product: Product): ProductMedia[] {
  if (product.media.length) return product.media;
  return product.images.map((image, index) => ({
    kind: 'image' as const,
    id: `${product.id}-image-${index}`,
    alt: image.altText,
    image,
  }));
}

export default function ProductMediaGallery({ product }: { product: Product }) {
  const media = useMemo(() => mediaFor(product), [product]);
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function updateActive() {
    if (!trackRef.current) return;
    const slides = Array.from(
      trackRef.current.querySelectorAll<HTMLElement>('[data-media-slide]')
    );
    if (!slides.length) return;
    const trackLeft = trackRef.current.getBoundingClientRect().left;
    let nearest = 0;
    let distance = Number.POSITIVE_INFINITY;
    slides.forEach((slide, index) => {
      const nextDistance = Math.abs(slide.getBoundingClientRect().left - trackLeft);
      if (nextDistance < distance) {
        nearest = index;
        distance = nextDistance;
      }
    });
    setActiveIndex(nearest);
  }

  function show(index: number) {
    const slide = trackRef.current?.querySelectorAll<HTMLElement>('[data-media-slide]')[index];
    slide?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'start' });
    setActiveIndex(index);
  }

  if (!media.length) {
    return <div className="flex aspect-[4/5] items-center justify-center rounded-[1.75rem] bg-surface-hi px-8 text-center font-mono text-[10px] uppercase tracking-widest text-ink-3">Product media unavailable</div>;
  }

  return (
    <section aria-label="Product media" className="product-media">
      <div
        ref={trackRef}
        className="product-media__track"
        aria-roledescription="carousel"
        aria-label={`${product.title} media`}
        onScroll={() => {
          if (frameRef.current) cancelAnimationFrame(frameRef.current);
          frameRef.current = requestAnimationFrame(updateActive);
        }}
      >
        {media.map((item, index) => (
          <div key={item.id} data-media-slide className="product-media__slide" aria-label={`${index + 1} of ${media.length}`}>
            {item.kind === 'image' ? (
              <Image
                src={item.image.url}
                alt={item.alt ?? product.title}
                fill
                loading={index === 0 ? 'eager' : 'lazy'}
                fetchPriority={index === 0 ? 'high' : 'low'}
                sizes="(max-width: 1024px) 100vw, 58vw"
                className="object-cover"
              />
            ) : (
              <video controls muted playsInline preload="metadata" poster={item.previewImage?.url} className="h-full w-full object-cover" aria-label={item.alt ?? `${product.title} video`}>
                {item.sources.map((source) => <source key={source.url} src={source.url} type={source.mimeType} />)}
              </video>
            )}
          </div>
        ))}
      </div>

      {media.length > 1 ? (
        <>
          <div className="product-media__counter" aria-live="polite">{activeIndex + 1} / {media.length}</div>
          <div className="product-media__thumbs" aria-label="Choose product media">
            {media.map((item, index) => {
              const preview = item.kind === 'image' ? item.image : item.previewImage;
              return (
                <button key={item.id} type="button" onClick={() => show(index)} aria-label={`View ${item.kind} ${index + 1}`} aria-pressed={activeIndex === index} className={activeIndex === index ? 'is-active' : ''}>
                  {preview ? <Image src={preview.url} alt="" fill sizes="110px" className="object-cover" /> : null}
                  {item.kind === 'video' ? <span>Play</span> : null}
                </button>
              );
            })}
          </div>
        </>
      ) : null}
    </section>
  );
}
