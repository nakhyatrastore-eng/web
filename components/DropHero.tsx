import Image from 'next/image';
import Link from 'next/link';
import type { ProductCardData } from '@/lib/catalog';
import { IconArrowRight, IconCheck, IconShield } from './icons';

export default function DropHero({
  cases,
  poster,
}: {
  cases: ProductCardData[];
  poster: ProductCardData | null;
}) {
  const visuals = [
    ...cases.slice(0, 3).map((product) => ({ product, kind: 'case' as const })),
    ...(poster ? [{ product: poster, kind: 'poster' as const }] : []),
  ].filter((item) => item.product.images[0]);

  return (
    <section className="drop-hero">
      <div className="page-shell drop-hero__inner">
        <div className="drop-hero__copy">
          <p className="home-kicker text-accent">Drop 01 · Five cases + one wall print</p>
          <h1>Designs that don&apos;t blend in.</h1>
          <p className="drop-hero__body">
            A focused first drop for the phone you carry and the space you live in.
            Choose the design, then lock in your exact model or print size.
          </p>
          <div className="home-hero__actions">
            <Link href="/collections/phone-cases" className="button-primary">
              Shop the five cases <IconArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/collections/poster-wall" className="button-ghost">
              Meet Red Mindset
            </Link>
          </div>
          <div className="home-hero__proof" aria-label="Why shop Nakhyatra">
            <span><IconCheck className="h-4 w-4 text-verify" /> Exact-model ordering</span>
            <span><IconCheck className="h-4 w-4 text-verify" /> Tracked dispatch</span>
            <span><IconShield className="h-4 w-4 text-verify" /> 7-day issue support</span>
          </div>
        </div>

        {visuals.length ? (
          <div className="drop-hero__stage" aria-label="Products in Drop 01">
            <div className="drop-hero__stamp" aria-hidden="true">01</div>
            {visuals.map(({ product, kind }, index) => (
              <Link
                key={product.id}
                href={`/products/${product.handle}`}
                className={`drop-hero__art drop-hero__art--${index + 1} ${kind === 'poster' ? 'is-poster' : ''}`}
                aria-label={`View ${product.title}`}
              >
                <Image
                  src={product.images[0].url}
                  alt={product.images[0].altText ?? product.title}
                  fill
                  priority={index === 0}
                  fetchPriority={index === 0 ? 'high' : 'auto'}
                  sizes="(max-width: 767px) 44vw, 24vw"
                  className="object-cover"
                />
              </Link>
            ))}
            <p className="drop-hero__stage-label">Carry it. Live with it.</p>
          </div>
        ) : null}
      </div>
    </section>
  );
}
