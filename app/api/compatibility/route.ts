import { NextResponse } from 'next/server';
import { getVariantCartRequirements } from '@/lib/shopify';

export async function GET(request: Request) {
  const variantId = new URL(request.url).searchParams.get('variantId');
  if (
    !variantId?.startsWith('gid://shopify/ProductVariant/') ||
    variantId.length > 300
  ) {
    return NextResponse.json(
      { models: [], error: 'The product selection is not valid.' },
      { status: 400, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const requirement = await getVariantCartRequirements(variantId);
    if (!requirement?.productType.toLowerCase().includes('case')) {
      return NextResponse.json(
        { models: [], error: 'Compatibility is not available for this item.' },
        { status: 404, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    return NextResponse.json(
      { models: requirement.deviceModels.filter((model) => model.active) },
      { headers: { 'Cache-Control': 'private, max-age=60' } }
    );
  } catch {
    return NextResponse.json(
      { models: [], error: 'Phone compatibility could not be loaded.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
