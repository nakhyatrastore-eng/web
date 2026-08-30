import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { getCart } from '@/lib/shopify';
import { getCartIssues } from '@/lib/cart-validation';

const CART_COOKIE = 'nakhyatra_cart';

function isAllowedCheckout(checkoutUrl: string) {
  try {
    const url = new URL(checkoutUrl);
    const configuredCheckout = (
      process.env.SHOPIFY_CHECKOUT_DOMAIN ?? 'checkout.nakhyatra.store'
    )
      .replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    const storeDomain = process.env.SHOPIFY_STORE_DOMAIN
      ?.replace(/^https?:\/\//, '')
      .replace(/\/.*$/, '');
    return (
      url.protocol === 'https:' &&
      (url.hostname === configuredCheckout || url.hostname === storeDomain)
    );
  } catch {
    return false;
  }
}

export async function POST() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  if (!cartId) {
    return NextResponse.json(
      { error: 'Your cart is empty.' },
      { status: 409, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const cart = await getCart(cartId);
    const [selectionIssue] = await getCartIssues(cart);
    if (selectionIssue) {
      return NextResponse.json(
        { error: `${selectionIssue.productTitle}: ${selectionIssue.message}` },
        { status: 422, headers: { 'Cache-Control': 'no-store' } }
      );
    }
    if (!cart?.checkoutUrl || !isAllowedCheckout(cart.checkoutUrl)) {
      throw new Error('Shopify returned an unexpected checkout domain.');
    }
    return NextResponse.json(
      { url: cart.checkoutUrl },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.error('Checkout handoff failed:', error);
    return NextResponse.json(
      { error: 'Checkout is unavailable right now. Please try again.' },
      { status: 503, headers: { 'Cache-Control': 'no-store' } }
    );
  }
}
