import type { Metadata } from 'next';
import CatalogueEmpty from '@/components/CatalogueEmpty';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/catalog';
import { finalizeSmallDrop, prioritizeSmallDropCandidates } from '@/lib/small-drop';
import { getCollectionByHandle, getProductByHandle, isShopifyConfigured } from '@/lib/shopify';

export const metadata: Metadata = {
  title: 'Artifact Chamber — The Small Drop',
  description: 'Touch, bend, and acquire a tightly curated drop of Nakhyatra phone cases and metal wall art.',
};

async function getSmallDrop(): Promise<Product[]> {
  if (!isShopifyConfigured()) return [];

  try {
    const [cases, prints] = await Promise.all([
      getCollectionByHandle('phone-cases'),
      getCollectionByHandle('poster-wall'),
    ]);
    const candidates = prioritizeSmallDropCandidates(
      cases?.products ?? [],
      prints?.products ?? [],
    );
    const products = await Promise.all(
      candidates.map((product) => getProductByHandle(product.handle)),
    );
    return finalizeSmallDrop(products);
  } catch (error) {
    console.error('Small Drop catalogue load failed:', error);
    return [];
  }
}

export default async function HomePage() {
  const products = await getSmallDrop();

  if (!products.length) {
    return (
      <main className="page-shell py-20">
        <CatalogueEmpty title="The Small Drop is being arranged." body="Please check back in a moment." />
      </main>
    );
  }

  return (
    <main className="page-shell py-12 md:py-20">
      <section className="mx-auto max-w-7xl px-5 md:px-8" aria-labelledby="home-catalogue-title">
        <div className="mb-10 max-w-2xl">
          <p className="home-kicker">The current edit</p>
          <h1 id="home-catalogue-title" className="mt-3 text-4xl font-semibold tracking-[-0.04em] md:text-6xl">Objects with a point of view.</h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-ink-2 md:text-lg">Explore the latest Nakhyatra phone cases and wall pieces in a calm, browse-first layout.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 md:gap-x-6 lg:grid-cols-4">
          {products.map((product, index) => (
            <ProductCard key={product.id} product={product} priority={index < 4} />
          ))}
        </div>
      </section>
    </main>
  );
}

