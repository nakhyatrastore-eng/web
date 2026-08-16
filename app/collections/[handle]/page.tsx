import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import CatalogueEmpty from '@/components/CatalogueEmpty';
import ProductCard from '@/components/ProductCard';
import DeviceContextBar from '@/components/DeviceContextBar';
import type { DeviceModel } from '@/lib/catalog';
import {
  getCollectionByHandle,
  getCollectionDeviceModels,
  isShopifyConfigured,
} from '@/lib/shopify';

type Props = {
  params: Promise<{ handle: string }>;
};

const collectionCopy: Record<string, { title: string; description: string; eyebrow: string; intro: string; points: string[] }> = {
  'phone-cases': {
    title: 'Phone Cases for iPhone & Android',
    description: 'Shop bold glass-finish phone cases. Choose your design, then select the exact iPhone or Android model before checkout.',
    eyebrow: 'Designed to fit the phone you use',
    intro: 'Start with the artwork. Then choose your platform, brand, and exact phone model so your order is made for the right device.',
    points: ['Exact-model selection', 'Printed to order', '7-day issue support'],
  },
  'poster-wall': {
    title: 'Metal Wall Prints & Posters',
    description: 'Shop bold metal wall prints in sizes made for bedrooms, studios, offices, and gaming spaces.',
    eyebrow: 'Artwork with more presence',
    intro: 'Choose a design and size for your space. Each order is coordinated with our production partner and checked against your selected option.',
    points: ['Two real size options', 'Display-ready finish', '7-day issue support'],
  },
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured()) return { title: handle.replaceAll('-', ' ') };
  try {
    const collection = await getCollectionByHandle(handle);
    if (!collection) return {};
    const copy = collectionCopy[handle];
    return {
      title: copy?.title ?? collection.title,
      description: copy?.description ?? (collection.description || `Shop ${collection.title} from Nakhyatra.`),
      alternates: { canonical: `/collections/${handle}` },
      openGraph: {
        title: `${copy?.title ?? collection.title} | Nakhyatra`,
        description: copy?.description ?? collection.description,
        url: `/collections/${handle}`,
      },
      twitter: {
        card: 'summary_large_image',
        title: `${copy?.title ?? collection.title} | Nakhyatra`,
        description: copy?.description ?? collection.description,
        images: ['/og.png'],
      },
    };
  } catch {
    return { title: handle.replaceAll('-', ' ') };
  }
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  if (!isShopifyConfigured()) {
    return <main className="page-shell py-16"><CatalogueEmpty /></main>;
  }
  let collection;
  let deviceModels: DeviceModel[] = [];
  try {
    [collection, deviceModels] = await Promise.all([
      getCollectionByHandle(handle),
      handle === 'phone-cases' ? getCollectionDeviceModels(handle) : Promise.resolve([]),
    ]);
  } catch {
    throw new Error('The Shopify collection could not be loaded.');
  }
  if (!collection) notFound();
  const copy = collectionCopy[handle];
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nakhyatra.store';
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: copy?.title ?? collection.title,
    itemListElement: collection.products.map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      url: `${siteUrl}/products/${product.handle}`,
    })),
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd).replace(/</g, '\\u003c') }} />
      <header className="border-b border-line">
        <div className="page-shell py-10 md:py-16">
          <p className="home-kicker">{copy?.eyebrow ?? `${collection.products.length} designs`}</p>
          <h1 className="mt-3 font-display text-[clamp(3rem,8vw,6.5rem)] font-black leading-[.86] tracking-[-.065em] text-white">{collection.title}</h1>
          <p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2 md:text-lg">{copy?.intro ?? collection.description}</p>
          {copy ? <div className="mt-7 flex flex-wrap gap-2">{copy.points.map((point) => <span key={point} className="rounded-full border border-line-hi px-3 py-2 text-xs font-semibold text-ink-2">{point}</span>)}</div> : null}
        </div>
      </header>

      {deviceModels.length ? <DeviceContextBar models={deviceModels} /> : null}

      <div className="page-shell py-6 md:py-10">
        {collection.products.length ? (
          <div className="grid grid-cols-2 gap-x-3 gap-y-8 md:grid-cols-3 md:gap-5 lg:grid-cols-4">{collection.products.map((product, index) => <ProductCard key={product.id} product={product} priority={index < 4} />)}</div>
        ) : (
          <CatalogueEmpty title={`The ${collection.title} collection is ready.`} />
        )}
      </div>
    </main>
  );
}
