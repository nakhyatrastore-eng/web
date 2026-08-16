'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductImage } from '@/lib/catalog';
import { IconArrowRight, IconSearch, IconX } from './icons';

type SearchResults = {
  products: {
    id: string;
    handle: string;
    title: string;
    productType: string;
    image: ProductImage | null;
    price: string;
  }[];
  collections: { id: string; handle: string; title: string }[];
  queries: string[];
};

const EMPTY_RESULTS: SearchResults = { products: [], collections: [], queries: [] };

export default function SearchDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResults>(EMPTY_RESULTS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestRef = useRef<AbortController | null>(null);
  const panelRef = useRef<HTMLElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    inputRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        onClose();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(panelRef.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input, [tabindex]:not([tabindex="-1"])'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [onClose, open]);

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      requestRef.current?.abort();
    },
    []
  );

  function updateQuery(value: string) {
    setQuery(value);
    setError(null);
    if (timerRef.current) clearTimeout(timerRef.current);
    requestRef.current?.abort();
    if (value.trim().length < 2) {
      setResults(EMPTY_RESULTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    timerRef.current = setTimeout(async () => {
      const controller = new AbortController();
      requestRef.current = controller;
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(value.trim())}`, {
          signal: controller.signal,
        });
        const payload = (await response.json()) as SearchResults & { error?: string };
        if (!response.ok) throw new Error(payload.error || 'Search failed.');
        setResults(payload);
        track(payload.products.length || payload.collections.length ? 'Search Results' : 'Search No Results', {
          query: value.trim().slice(0, 80),
          products: payload.products.length,
          collections: payload.collections.length,
        });
      } catch (searchError) {
        if (searchError instanceof DOMException && searchError.name === 'AbortError') return;
        setError('Search is unavailable right now.');
        setResults(EMPTY_RESULTS);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
  }

  if (!open) return null;
  const hasResults = results.products.length > 0 || results.collections.length > 0;

  return (
    <div className="fixed inset-0 z-[85]" role="dialog" aria-modal="true" aria-label="Search the store">
      <button type="button" onClick={onClose} className="absolute inset-0 bg-black/75" aria-label="Close search" />
      <section ref={panelRef} className="drawer-enter relative border-b border-accent/40 bg-bg shadow-[0_32px_80px_rgba(0,0,0,.6)]">
        <div className="page-shell py-5 md:py-7">
          <div className="flex items-center gap-3 border-b-2 border-line-hi focus-within:border-accent">
            <IconSearch className="h-5 w-5 shrink-0 text-accent" />
            <label htmlFor="store-search" className="sr-only">Search designs, themes, or phone models</label>
            <input
              id="store-search"
              ref={inputRef}
              type="search"
              value={query}
              onChange={(event) => updateQuery(event.target.value)}
              placeholder="Search designs, themes, or phone models"
              autoComplete="off"
              className="min-w-0 flex-1 bg-transparent py-4 font-display text-xl font-bold uppercase text-white outline-none placeholder:text-ink-3 md:text-3xl"
            />
            <button type="button" onClick={onClose} aria-label="Close search" className="tap-target flex items-center justify-center text-ink-2 hover:text-white">
              <IconX className="h-5 w-5" />
            </button>
          </div>

          <div className="min-h-20 pt-5" aria-live="polite">
            {query.length < 2 ? (
              <div className="flex flex-wrap gap-2">
                {['Phone cases', 'Metal posters', 'Arctic Frequency', 'Red Mindset'].map((term) => (
                  <button key={term} type="button" onClick={() => updateQuery(term)} className="border border-line-hi px-3 py-2 font-mono text-[10px] uppercase tracking-wider text-ink-2 hover:border-accent hover:text-white">
                    {term}
                  </button>
                ))}
              </div>
            ) : loading ? (
              <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">Searching the catalogue…</p>
            ) : error ? (
              <p role="alert" className="text-sm text-rose-200">{error}</p>
            ) : hasResults ? (
              <div className="grid gap-7 md:grid-cols-[1fr_260px]">
                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                  {results.products.map((product) => (
                    <Link key={product.id} href={`/products/${product.handle}`} onClick={onClose} className="group grid grid-cols-[64px_1fr] gap-3 border border-line bg-surface p-2 hover:border-accent md:grid-cols-1">
                      <div className="relative aspect-[4/5] overflow-hidden bg-surface-hi">
                        {product.image ? <Image src={product.image.url} alt={product.image.altText ?? product.title} fill sizes="(max-width: 768px) 64px, 220px" className="object-cover transition-transform duration-smooth ease-smooth group-hover:scale-105" /> : null}
                      </div>
                      <div className="min-w-0 p-1">
                        <p className="truncate font-display text-sm font-bold uppercase text-white">{product.title}</p>
                        <p className="mt-1 font-mono text-[10px] text-accent">{product.price}</p>
                      </div>
                    </Link>
                  ))}
                </div>
                <div>
                  <p className="font-mono text-[10px] uppercase tracking-widest text-ink-3">Collections</p>
                  <div className="mt-3 grid gap-1">
                    {results.collections.map((collection) => (
                      <Link key={collection.id} href={`/collections/${collection.handle}`} onClick={onClose} className="flex items-center justify-between border-b border-line py-3 text-sm font-semibold uppercase text-ink-2 hover:text-white">
                        {collection.title}<IconArrowRight className="h-4 w-4 text-accent" />
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <p className="font-display text-lg font-bold uppercase text-white">No match for “{query}”</p>
                <p className="mt-1 text-sm text-ink-3">Try an artwork name, theme, or exact phone model.</p>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
