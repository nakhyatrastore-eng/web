'use client';

import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardData } from '@/lib/catalog';
import { formatMoney } from '@/lib/format';
import { useShoppingAssistant } from './ShoppingAssistant';
import { IconPlus } from './icons';

export default function ProductCard({
  product,
  priority = false,
}: {
  product: ProductCardData;
  priority?: boolean;
}) {
  const { savedDevice, openQuickAdd } = useShoppingAssistant();
  const primary = product.images[0];
  const phoneCase = product.productType.toLowerCase().includes('case');
  const hasVariablePrice = new Set(product.variants.map((variant) => variant.price.amount)).size > 1;
  const onSale = product.variants.some(
    (variant) => variant.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount)
  );

  return (
    <article className="group min-w-0">
      <Link
        href={`/products/${product.handle}`}
        className="block min-w-0"
        data-testid="product-card"
        data-cursor="View"
      >
        <div className="relative aspect-[4/5] overflow-hidden rounded-[1.5rem] bg-surface-hi">
          {primary ? (
            <Image
              src={primary.url}
              alt={primary.altText ?? product.title}
              fill
              loading={priority ? 'eager' : 'lazy'}
              fetchPriority={priority ? 'high' : 'auto'}
              sizes="(max-width: 640px) 58vw, (max-width: 1024px) 33vw, 20vw"
              className="object-cover transition-transform duration-smooth ease-smooth group-hover:scale-[1.035]"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center text-xs text-ink-3">
              Image unavailable
            </div>
          )}

          {onSale ? (
            <span className="absolute left-3 top-3 rounded-full bg-black/80 px-3 py-1.5 text-[11px] font-semibold text-white backdrop-blur">
              Sale
            </span>
          ) : null}

          {!product.availableForSale ? (
            <span className="absolute inset-x-3 bottom-3 rounded-full bg-black/80 px-3 py-2 text-center text-xs font-semibold text-white backdrop-blur">
              Unavailable
            </span>
          ) : null}
        </div>

        <div className="px-1 pt-4">
          <div className="flex flex-col items-start gap-1 sm:flex-row sm:justify-between sm:gap-3">
            <h3 className="line-clamp-2 min-h-[2.4rem] min-w-0 font-display text-base font-bold leading-tight tracking-[-0.025em] text-white transition-colors group-hover:text-accent md:text-lg">
              {product.title}
            </h3>
            <span className="shrink-0 text-sm font-bold tabular-nums text-white">
              {hasVariablePrice ? 'From ' : ''}{formatMoney(product.price, product.currency)}
            </span>
          </div>
          {product.compareAtPrice ? (
            <s className="mt-1 block text-xs text-ink-3">
              {formatMoney(product.compareAtPrice, product.currency)}
            </s>
          ) : null}
        </div>
      </Link>

      <button
        type="button"
        data-testid="quick-add"
        onClick={() => openQuickAdd(product)}
        disabled={!product.availableForSale}
        className="mt-3 flex min-h-11 w-full items-center justify-between rounded-full border border-line-hi px-4 text-xs font-bold text-ink-2 transition-colors hover:border-accent hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        <span>{phoneCase && savedDevice ? `Add for ${savedDevice.model}` : phoneCase ? 'Choose phone + add' : product.variants.length > 1 ? 'Choose size + add' : 'Quick add'}</span>
        <IconPlus className="h-4 w-4" />
      </button>
    </article>
  );
}
