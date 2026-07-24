import Link from 'next/link';
import { getAllCollections, getProductsByCollection } from '@/lib/shopify';
import ProductCard from '@/components/ProductCard';

export default async function HomePage() {
  const collections = await getAllCollections();
  const previews = await Promise.all(
    collections.map(async (c) => ({ collection: c, products: (await getProductsByCollection(c.handle)).slice(0, 4) }))
  );

  return (
    <main>
      <section className="border-b border-border py-20 md:py-28 bg-[radial-gradient(60%_90%_at_85%_10%,rgba(211,67,23,.14),transparent_60%)]">
        <div className="max-w-[1180px] mx-auto px-6">
          <div className="kicker mb-4">Original Art · Everyday Objects</div>
          <h1 className="text-[clamp(42px,7vw,88px)] font-extrabold tracking-tighter leading-[0.95] mb-5">
            ART THAT<br /><span className="text-accent">SURVIVES</span> YOU.
          </h1>
          <p className="max-w-xl text-ink2 text-lg">
            Steel-printed wall art and precision phone cases. Built to outlast the trend that inspired them.
          </p>
          <div className="mt-6 flex gap-3">
            <Link href="/collections/poster-wall" className="bg-accent hover:bg-accent-h px-6 py-3 kicker tracking-widest">
              Shop Poster Wall
            </Link>
            <Link href="/collections/phone-cases" className="border border-border hover:border-accent px-6 py-3 kicker tracking-widest">
              Shop Phone Cases
            </Link>
          </div>
        </div>
      </section>

      {previews.map(({ collection, products }) => (
        <section key={collection.handle} className="border-b border-border py-16">
          <div className="max-w-[1180px] mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <div>
                <div className="eyebrow mb-2">{collection.title}</div>
                <h2 className="text-3xl font-extrabold tracking-tight">{collection.description}</h2>
              </div>
              <Link href={`/collections/${collection.handle}`} className="kicker hover:text-accent">
                View all →
              </Link>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        </section>
      ))}
    </main>
  );
}
