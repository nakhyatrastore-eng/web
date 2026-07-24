import { notFound } from 'next/navigation';
import { getAllCollections, getProductsByCollection } from '@/lib/shopify';
import ProductCard from '@/components/ProductCard';

export async function generateStaticParams() {
  const collections = await getAllCollections();
  return collections.map((c) => ({ handle: c.handle }));
}

export default async function CollectionPage({ params }: { params: { handle: string } }) {
  const collections = await getAllCollections();
  const collection = collections.find((c) => c.handle === params.handle);
  if (!collection) notFound();

  const products = await getProductsByCollection(params.handle);

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-16">
      <div className="eyebrow mb-2">{products.length} Piece{products.length !== 1 ? 's' : ''}</div>
      <h1 className="text-[clamp(32px,5vw,56px)] font-extrabold tracking-tight mb-2">{collection.title}</h1>
      <p className="text-ink2 max-w-xl mb-10">{collection.description}</p>

      {products.length === 0 ? (
        <p className="text-ink3">No products here yet.</p>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </main>
  );
}
