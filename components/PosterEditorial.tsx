import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardData } from '@/lib/catalog';
import { formatMoney } from '@/lib/format';
import QuickAddTrigger from './QuickAddTrigger';

export default function PosterEditorial({ product }: { product: ProductCardData }) {
  const image = product.images[1] ?? product.images[0];
  const sizes = product.variants
    .filter((variant) => variant.availableForSale)
    .map((variant) => variant.title)
    .filter((title) => title !== 'Default Title');

  return (
    <section className="poster-editorial section-space">
      <div className="page-shell poster-editorial__grid">
        <Link href={`/products/${product.handle}`} className="poster-editorial__image" aria-label={`View ${product.title}`}>
          {image ? (
            <Image src={image.url} alt={image.altText ?? product.title} fill sizes="(max-width: 900px) 100vw, 62vw" className="object-cover transition-transform duration-smooth hover:scale-[1.02]" />
          ) : null}
          <span className="poster-editorial__badge">The wall drop</span>
        </Link>

        <div className="poster-editorial__copy">
          <p className="home-kicker text-accent">Red Mindset · Drop 01</p>
          <h2>{product.title.replace(/\s+Metal Poster$/i, '')}</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-2">
            A rigid metal wall print for bedrooms, studios and gaming spaces—shown with the magnetic mounting supplied for this design.
          </p>
          <p className="mt-4 text-sm font-semibold text-white">
            Artwork by {product.vendor || 'Everanta'} · Offered by Nakhyatra with permission
          </p>
          <div className="mt-6 grid grid-cols-2 gap-2 text-xs text-ink-2">
            <span className="rounded-2xl border border-line-hi p-3">Metal print</span>
            <span className="rounded-2xl border border-line-hi p-3">Magnetic mounting</span>
            <span className="rounded-2xl border border-line-hi p-3">4–7 day processing</span>
            <span className="rounded-2xl border border-line-hi p-3">7-day issue support</span>
          </div>
          {sizes.length ? <p className="mt-5 text-xs text-ink-3">Available sizes: {sizes.join(' · ')}</p> : null}
          <p className="mt-2 font-mono text-2xl font-bold text-white">From {formatMoney(product.price, product.currency)}</p>
          <div className="mt-6 flex flex-col gap-2 sm:flex-row">
            <QuickAddTrigger product={product} label="Choose size + add" />
            <Link href={`/products/${product.handle}`} className="button-ghost">See every detail</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
