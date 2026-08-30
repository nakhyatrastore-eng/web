'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { ProductImage } from '@/lib/catalog';

type RecentItem = { handle: string; title: string; price: string; image: ProductImage | null };
const STORAGE_KEY = 'nakhyatra-recent:v1';

export default function RecentlyViewed({ current }: { current: RecentItem }) {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    let active = true;
    let previous: RecentItem[] = [];
    try {
      const parsed = JSON.parse(window.localStorage.getItem(STORAGE_KEY) ?? '[]');
      if (Array.isArray(parsed)) previous = parsed;
    } catch {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    const others = previous.filter((item) => item.handle !== current.handle).slice(0, 3);
    queueMicrotask(() => {
      if (active) setItems(others);
    });
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify([current, ...others].slice(0, 4)));
    return () => {
      active = false;
    };
  }, [current]);

  if (!items.length) return null;
  return (
    <section className="section-space bg-surface">
      <div className="page-shell"><p className="eyebrow">Your trail</p><h2 className="display-heading mt-4">Recently viewed.</h2><div className="mt-8 grid gap-3 sm:grid-cols-3">{items.map((item) => <Link key={item.handle} href={`/products/${item.handle}`} className="group grid grid-cols-[88px_1fr] gap-4 border border-line bg-bg p-2 hover:border-accent"><div className="relative aspect-[4/5] overflow-hidden bg-surface-hi">{item.image ? <Image src={item.image.url} alt={item.image.altText ?? item.title} fill sizes="88px" className="object-cover" /> : null}</div><div className="self-center"><h3 className="font-display text-base font-bold uppercase text-white group-hover:text-accent">{item.title}</h3><p className="mt-2 font-mono text-[10px] text-ink-3">{item.price}</p></div></Link>)}</div></div>
    </section>
  );
}
