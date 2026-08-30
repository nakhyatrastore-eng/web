import type { MetadataRoute } from 'next';
import { getAllCollections, getAllProducts, isShopifyConfigured } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nakhyatra.store';
  const staticRoutes = [
    '',
    '/track',
    '/policies/shipping',
    '/policies/returns',
    '/policies/privacy',
    '/policies/terms',
    '/policies/contact',
  ].map((path) => ({
    url: `${siteUrl}${path}`,
    changeFrequency: path === '' ? ('daily' as const) : ('monthly' as const),
    priority: path === '' ? 1 : 0.5,
  }));

  if (!isShopifyConfigured()) return staticRoutes;

  try {
    const [products, collections] = await Promise.all([
      getAllProducts(),
      getAllCollections(),
    ]);
    return [
      ...staticRoutes,
      ...products.map((product) => ({
        url: `${siteUrl}/products/${product.handle}`,
        lastModified: new Date(product.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      })),
      ...collections.filter((collection) => ['phone-cases', 'poster-wall'].includes(collection.handle)).map((collection) => ({
        url: `${siteUrl}/collections/${collection.handle}`,
        lastModified: new Date(collection.updatedAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      })),
    ];
  } catch {
    return staticRoutes;
  }
}
