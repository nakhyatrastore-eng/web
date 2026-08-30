import { NextResponse } from 'next/server';
import { formatMoney } from '@/lib/format';
import { searchStorefront } from '@/lib/shopify';

export async function GET(request: Request) {
  const query = new URL(request.url).searchParams.get('q')?.trim() ?? '';
  if (query.length < 2 || query.length > 80) {
    return NextResponse.json(
      { products: [], collections: [], queries: [] },
      { headers: { 'Cache-Control': 'private, max-age=30' } }
    );
  }

  try {
    const results = await searchStorefront(query);
    return NextResponse.json(
      {
        products: results.products.map((product) => ({
          id: product.id,
          handle: product.handle,
          title: product.title,
          productType: product.productType,
          image: product.images[0] ?? null,
          price: formatMoney(product.price, product.currency),
        })),
        collections: results.collections.map((collection) => ({
          id: collection.id,
          handle: collection.handle,
          title: collection.title,
        })),
        queries: results.queries.map((item) => item.text),
      },
      { headers: { 'Cache-Control': 'private, max-age=60' } }
    );
  } catch {
    return NextResponse.json(
      { error: 'Search is unavailable right now.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
