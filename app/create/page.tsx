import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import CustomOrderStudio from '@/components/CustomOrderStudio';
import { getProductByHandle, isShopifyConfigured } from '@/lib/shopify';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Create your own',
  description: 'Upload, crop, and order your own artwork on a Nakhyatra metal-backed phone case or wall poster.',
  alternates: { canonical: '/create' },
  robots: { index: false, follow: true },
};

export default async function CreatePage() {
  if (!isShopifyConfigured()) {
    redirect('/collections/phone-cases');
  }
  const caseHandle = process.env.SHOPIFY_CUSTOM_CASE_HANDLE ?? 'create-your-own-metal-phone-case';
  const posterHandle = process.env.SHOPIFY_CUSTOM_POSTER_HANDLE ?? 'create-your-own-a4-metal-poster';
  let products;
  try {
    products = (await Promise.all([getProductByHandle(caseHandle), getProductByHandle(posterHandle)])).filter((product) => product !== null);
  } catch {
    throw new Error('The custom products could not be loaded from Shopify.');
  }
  if (!products.length) {
    redirect('/collections/phone-cases');
  }
  return <CustomOrderStudio products={products} />;
}
