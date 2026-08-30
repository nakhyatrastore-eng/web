import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import BundleBuilder from '@/components/BundleBuilder';
import CatalogueEmpty from '@/components/CatalogueEmpty';
import type { ProductCardData } from '@/lib/catalog';
import { getCollectionByHandle, isShopifyConfigured } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Build a poster set',
  description: 'Choose three real Nakhyatra metal posters and add the set to one Shopify cart.',
  alternates: { canonical: '/bundle' },
  robots: { index: false, follow: true },
};

export default async function BundlePage() {
  let products: ProductCardData[] = [];
  if (isShopifyConfigured()) {
    try {
      products = ((await getCollectionByHandle('poster-wall'))?.products ?? []).filter(
        (product) => !product.tags.some((tag) => tag.toLowerCase() === 'custom')
      );
    } catch {
      throw new Error('The poster collection could not be loaded from Shopify.');
    }
  }
  if (products.length < 3) redirect('/collections/poster-wall');
  return (
    <main>
      <header className="border-b border-line bg-surface"><div className="page-shell py-12 md:py-20"><p className="eyebrow">Poster set builder</p><h1 className="mt-5 max-w-5xl font-display text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[.8] tracking-[-.06em] text-white">Three pieces. One wall.</h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2">Pick three available posters, review the live total, and add the complete set to Shopify.</p></div></header>
      {products.length ? <BundleBuilder products={products} /> : <div className="page-shell py-12"><CatalogueEmpty title="Publish posters to activate the set builder." body="The builder uses products from the Shopify “poster-wall” collection and will appear automatically when the collection has available items." /></div>}
    </main>
  );
}
