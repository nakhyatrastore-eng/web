import type { Metadata } from 'next';
import { notFound, redirect } from 'next/navigation';
import CatalogueEmpty from '@/components/CatalogueEmpty';
import ProductCard from '@/components/ProductCard';
import type { Product } from '@/lib/catalog';
import { getAllProducts, isShopifyConfigured } from '@/lib/shopify';

const THEMES: Record<string, { title: string; description: string }> = {
  cyberpunk: { title: 'Cyberpunk', description: 'Night signals, neon systems, and future-city linework.' },
  jdm: { title: 'JDM', description: 'After-dark machines, velocity, and Japanese street culture.' },
  samurai: { title: 'Samurai', description: 'Steel, ink, discipline, and original warrior studies.' },
  anime: { title: 'Anime', description: 'Original high-energy illustration without counterfeit character art.' },
  space: { title: 'Space', description: 'Deep orbit, impossible machinery, and quiet cosmic scale.' },
  'dark-minimal': { title: 'Dark minimal', description: 'Restrained marks, negative space, and black-on-black texture.' },
  abstract: { title: 'Abstract', description: 'Form, interference, geometry, and controlled noise.' },
};

type Props = { params: Promise<{ handle: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  const theme = THEMES[handle];
  return theme ? { title: theme.title, description: theme.description, alternates: { canonical: `/themes/${handle}` }, robots: { index: false, follow: true } } : {};
}

export default async function ThemePage({ params }: Props) {
  const { handle } = await params;
  const theme = THEMES[handle];
  if (!theme) notFound();
  let products: Product[] = [];
  if (isShopifyConfigured()) {
    try {
      products = (await getAllProducts()).filter((product) => {
        const value = product.theme?.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        return value === handle || product.tags.some((tag) => tag.toLowerCase() === `theme:${handle}`);
      });
    } catch {
      throw new Error('This theme could not be loaded from Shopify.');
    }
  }
  if (!products.length) redirect('/collections/phone-cases');

  return (
    <main>
      <header className="border-b border-line bg-surface"><div className="page-shell py-14 md:py-24"><p className="eyebrow">Theme collection</p><h1 className="mt-5 font-display text-[clamp(3.5rem,10vw,9rem)] font-black uppercase leading-[.78] tracking-[-.07em] text-white">{theme.title}</h1><p className="mt-7 max-w-2xl text-lg leading-relaxed text-ink-2">{theme.description}</p></div></header>
      <section className="page-shell py-10 md:py-16">{products.length ? <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">{products.map((product) => <ProductCard key={product.id} product={product} />)}</div> : <CatalogueEmpty title={`No ${theme.title} designs are published yet.`} body="Tag a Shopify product with this theme and publish it to Headless; it will appear here automatically." />}</section>
    </main>
  );
}
