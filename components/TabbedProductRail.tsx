'use client';

import { useMemo, useState } from 'react';
import type { Product } from '@/lib/catalog';
import ProductCard from './ProductCard';

export default function TabbedProductRail({ products }: { products: Product[] }) {
  const tabs = useMemo(() => {
    const themes = Array.from(new Set(products.map((product) => product.theme).filter(Boolean))) as string[];
    return ['All', ...themes.slice(0, 4)];
  }, [products]);
  const [active, setActive] = useState('All');
  const visible = active === 'All' ? products : products.filter((product) => product.theme === active);

  return (
    <div>
      <div className="mb-7 flex gap-2 overflow-x-auto border-b border-line pb-3" role="tablist" aria-label="Filter the new drop by theme">
        {tabs.map((tab) => (
          <button key={tab} type="button" role="tab" aria-selected={active === tab} onClick={() => setActive(tab)} className={`shrink-0 border px-4 py-2 font-mono text-[10px] uppercase tracking-widest ${active === tab ? 'border-accent bg-accent text-black' : 'border-line-hi text-ink-2 hover:border-accent hover:text-white'}`}>
            {tab}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-4 md:gap-5">
        {visible.slice(0, 8).map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </div>
  );
}
