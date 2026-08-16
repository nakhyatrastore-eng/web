'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import type { ProductCardData } from '@/lib/catalog';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';
import { IconArrowRight, IconCheck, IconX } from './icons';

export default function BundleBuilder({ products }: { products: ProductCardData[] }) {
  const { addManyToCart } = useCart();
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const selected = products.filter((product) => selectedIds.includes(product.id));
  const total = useMemo(
    () =>
      selected.reduce((sum, product) => {
        const variant = product.variants.find((item) => item.availableForSale);
        return sum + Number(variant?.price.amount ?? product.price);
      }, 0),
    [selected]
  );

  function toggle(product: ProductCardData) {
    setError(null);
    setSelectedIds((current) =>
      current.includes(product.id)
        ? current.filter((id) => id !== product.id)
        : current.length < 3
          ? [...current, product.id]
          : current
    );
  }

  async function addSet() {
    if (selected.length !== 3) {
      setError('Choose exactly three available posters first.');
      return;
    }
    setAdding(true);
    setError(null);
    const variants = selected
      .map((product) => product.variants.find((item) => item.availableForSale))
      .filter((variant) => variant !== undefined);
    if (variants.length !== 3 || !(await addManyToCart(variants.map((variant) => ({ variant }))))) {
      setError('The poster set could not be added. Check availability and try again.');
      setAdding(false);
      return;
    }
    setAdding(false);
  }

  return (
    <div className="page-shell grid gap-8 py-10 lg:grid-cols-[1fr_360px] lg:py-16">
      <section>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {products.map((product) => {
            const active = selectedIds.includes(product.id);
            const image = product.images[0];
            const available = product.variants.some((variant) => variant.availableForSale);
            return (
              <button key={product.id} type="button" data-testid="bundle-product" onClick={() => toggle(product)} disabled={!available} aria-pressed={active} className={`group overflow-hidden border text-left transition-[border-color,transform] duration-primary ease-primary ${active ? 'border-accent bg-accent/10' : 'border-line bg-surface hover:-translate-y-1 hover:border-accent'} disabled:cursor-not-allowed disabled:opacity-40`}>
                <div className="relative aspect-[4/5] overflow-hidden bg-bg">{image ? <Image src={image.url} alt={image.altText ?? product.title} fill sizes="(max-width: 768px) 50vw, 33vw" className="object-cover transition-transform duration-smooth ease-smooth group-hover:scale-105" /> : null}<span className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full border ${active ? 'border-accent bg-accent text-black' : 'border-line-hi bg-black/70 text-white'}`}>{active ? <IconCheck className="h-4 w-4" /> : selectedIds.length + 1}</span></div>
                <div className="p-4"><h2 className="font-display text-lg font-bold uppercase leading-none text-white">{product.title}</h2><p className="mt-3 font-mono text-[10px] text-ink-2">{formatMoney(product.price, product.currency)}</p></div>
              </button>
            );
          })}
        </div>
      </section>

      <aside className="lg:sticky lg:top-24 lg:self-start">
        <div className="border border-accent bg-surface p-5">
          <p className="eyebrow">Your three</p>
          <div className="mt-5 grid gap-2">
            {[0, 1, 2].map((slot) => {
              const product = selected[slot];
              return <div key={slot} className="flex min-h-16 items-center gap-3 border border-line bg-bg p-2">{product?.images[0] ? <div className="relative h-12 w-10 shrink-0 overflow-hidden"><Image src={product.images[0].url} alt="" fill sizes="40px" className="object-cover" /></div> : <span className="flex h-12 w-10 shrink-0 items-center justify-center border border-dashed border-line-hi font-mono text-[9px] text-ink-3">0{slot + 1}</span>}<span className="min-w-0 flex-1 truncate font-display text-sm font-bold uppercase text-white">{product?.title ?? 'Choose a poster'}</span>{product ? <button type="button" onClick={() => toggle(product)} aria-label={`Remove ${product.title}`} className="tap-compact text-ink-3 hover:text-white"><IconX className="h-4 w-4" /></button> : null}</div>;
            })}
          </div>
          <div className="mt-5 flex items-center justify-between border-t border-line pt-5"><span className="font-mono text-[10px] uppercase tracking-widest text-ink-3">Shopify subtotal</span><span className="font-mono text-xl font-bold text-white">{formatMoney(total)}</span></div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">If the 2+1 automatic discount is enabled in Shopify, the qualifying reduction appears in cart or checkout. This builder never fabricates a discount.</p>
          {error ? <p role="alert" className="mt-4 border border-urgent/50 bg-urgent/10 p-3 text-sm text-rose-200">{error}</p> : null}
          <button type="button" data-testid="bundle-add" onClick={addSet} disabled={adding || selected.length !== 3} className="button-primary liquid-button mt-5 w-full justify-between disabled:cursor-not-allowed disabled:opacity-40"><span className="liquid-fill" aria-hidden="true" /><span className="liquid-label">{adding ? 'Adding the set…' : selected.length === 3 ? 'Add all three' : `${3 - selected.length} slots remaining`}</span><IconArrowRight className="liquid-label h-4 w-4" /></button>
        </div>
      </aside>
    </div>
  );
}
