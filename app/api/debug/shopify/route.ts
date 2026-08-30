import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    return NextResponse.json({
      status: 'missing_env',
      domain: domain ?? 'MISSING',
      token: token ? 'SET' : 'MISSING',
      message: 'Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in Vercel env vars',
    });
  }

  try {
    const res = await fetch(`https://${domain}/api/2026-04/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({
        query: `{ shop { name } }`,
      }),
    });

    const text = await res.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }

    return NextResponse.json({
      status: res.status,
      ok: res.ok,
      domain,
      tokenPrefix: token.substring(0, 6) + '...',
      data,
    });
  } catch (err: any) {
    return NextResponse.json({
      status: 'fetch_error',
      domain,
      error: err.message,
    });
  }
}
