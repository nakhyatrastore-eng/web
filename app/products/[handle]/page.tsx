import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import ProductDetail from '@/components/ProductDetail';
import { getCollectionByHandle, getProductByHandle, isShopifyConfigured } from '@/lib/shopify';

type Props = { params: Promise<{ handle: string }> };

function cleanSeoTitle(value: string) {
  return value.replace(/\s*(?:[—|\-]\s*)?Nakhyatra\s*$/i, '').trim();
}

function cleanSeoDescription(value: string, fallback: string) {
  const text = value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  const selected = text.length >= 45 && text.length <= 180 ? text : fallback;
  return selected.length > 160 ? `${selected.slice(0, 157).trimEnd()}…` : selected;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { handle } = await params;
  if (!isShopifyConfigured()) return {};
  const product = await getProductByHandle(handle);
  if (!product) return {};
  const isPhoneCase = product.productType.toLowerCase().includes('case');
  const title = cleanSeoTitle(product.seo.title || product.title);
  const fallback = isPhoneCase
    ? `${product.title} glass-finish phone case for supported iPhone and Android models. Choose your exact phone before checkout.`
    : `${product.title} metal wall print in available sizes. Choose the option that fits your space.`;
  const description = cleanSeoDescription(product.seo.description || product.description, fallback);
  const image = product.images[0];
  return {
    title,
    description,
    alternates: { canonical: `/products/${product.handle}` },
    openGraph: {
      type: 'website',
      title,
      description,
      url: `/products/${product.handle}`,
      images: image ? [{ url: image.url, width: image.width ?? undefined, height: image.height ?? undefined, alt: image.altText ?? product.title }] : undefined,
    },
    twitter: { card: 'summary_large_image', title, description, images: image ? [image.url] : undefined },
  };
}

export default async function ProductPage({ params }: Props) {
  const { handle } = await params;
  if (!isShopifyConfigured()) notFound();
  const product = await getProductByHandle(handle);
  if (!product) notFound();
  const isPhoneCase = product.productType.toLowerCase().includes('case');
  const collectionHandle = isPhoneCase ? 'phone-cases' : 'poster-wall';
  const collection = await getCollectionByHandle(collectionHandle);
  const related = (collection?.products ?? []).filter((candidate) => {
    if (candidate.id === product.id) return false;
    if (product.pairedHandle && candidate.handle === product.pairedHandle) return true;
    if (product.theme && candidate.theme === product.theme) return true;
    return candidate.productType === product.productType;
  }).slice(0, 4);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://nakhyatra.store';
  const productUrl = `${siteUrl}/products/${product.handle}`;
  const productJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description,
    image: product.images.map((image) => image.url),
    brand: { '@type': 'Brand', name: product.vendor || 'Nakhyatra' },
    url: productUrl,
    offers: product.variants.map((variant) => ({
      '@type': 'Offer',
      url: productUrl,
      priceCurrency: variant.price.currencyCode,
      price: variant.price.amount,
      availability: variant.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      itemCondition: 'https://schema.org/NewCondition',
      sku: variant.sku ?? variant.id,
      name: variant.title,
      shippingDetails: {
        '@type': 'OfferShippingDetails',
        shippingDestination: { '@type': 'DefinedRegion', addressCountry: 'IN' },
        deliveryTime: {
          '@type': 'ShippingDeliveryTime',
          handlingTime: { '@type': 'QuantitativeValue', minValue: isPhoneCase ? 3 : 4, maxValue: isPhoneCase ? 6 : 7, unitCode: 'DAY' },
          transitTime: { '@type': 'QuantitativeValue', minValue: 3, maxValue: 8, unitCode: 'DAY' },
        },
      },
    })),
    ...(product.rating ? { aggregateRating: { '@type': 'AggregateRating', ratingValue: product.rating.value, bestRating: product.rating.scale, ratingCount: product.rating.count } } : {}),
  };
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: siteUrl },
      { '@type': 'ListItem', position: 2, name: isPhoneCase ? 'Phone cases' : 'Metal wall prints', item: `${siteUrl}/collections/${collectionHandle}` },
      { '@type': 'ListItem', position: 3, name: product.title, item: productUrl },
    ],
  };
  Object.assign(productJsonLd, {
    seller: { '@id': `${siteUrl}/#store` },
  });

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, '\\u003c') }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd).replace(/</g, '\\u003c') }} />
      <ProductDetail product={product} related={related} />
    </>
  );
}
