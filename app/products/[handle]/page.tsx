import { notFound } from 'next/navigation';
import { getProductByHandle } from '@/lib/shopify';
import ProductDetail from '@/components/ProductDetail';

export const dynamic = 'force-dynamic';

export default async function ProductPage({ params }: { params: { handle: string } }) {
  const product = await getProductByHandle(params.handle);
  if (!product) notFound();

  return <ProductDetail product={product} />;
}
