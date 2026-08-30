import { cookies, headers } from 'next/headers';
import { NextResponse } from 'next/server';
import {
  addCartLines,
  createCart,
  getCart,
  getVariantCartRequirements,
  removeCartLines,
  ShopifyUserError,
  updateCartLines,
} from '@/lib/shopify';
import { getCartIssues } from '@/lib/cart-validation';

const CART_COOKIE = 'nakhyatra_cart';
const CART_MAX_AGE = 60 * 60 * 24 * 30;

type Attribute = { key: string; value: string };
type AddLine = {
  merchandiseId: string;
  quantity: number;
  attributes?: Attribute[];
};
type CartAction =
  | ({ action: 'add' } & AddLine)
  | { action: 'addMany'; lines: AddLine[] }
  | { action: 'update'; lineId: string; quantity: number }
  | { action: 'repair'; lineId: string; merchandiseId: string; attributes: Attribute[] }
  | { action: 'remove'; lineId: string }
  | { action: 'clear' };

function errorResponse(message: string, status = 400) {
  return NextResponse.json(
    { cart: null, error: message },
    { status, headers: { 'Cache-Control': 'no-store' } }
  );
}

function isShopifyId(value: unknown, type: 'CartLine' | 'ProductVariant') {
  return (
    typeof value === 'string' &&
    value.startsWith(`gid://shopify/${type}/`) &&
    value.length <= 300
  );
}

function isArtworkUrl(value: string) {
  try {
    const url = new URL(value);
    return (
      url.protocol === 'https:' &&
      (url.hostname === 'utfs.io' || url.hostname.endsWith('.ufs.sh'))
    );
  } catch {
    return false;
  }
}

function validAttributes(value: unknown): value is Attribute[] {
  if (value === undefined) return true;
  if (!Array.isArray(value) || value.length > 8) return false;
  return value.every((item) => {
    if (!item || typeof item !== 'object') return false;
    const attribute = item as Partial<Attribute>;
    if (
      typeof attribute.key !== 'string' ||
      typeof attribute.value !== 'string' ||
      attribute.key.length < 1 ||
      attribute.key.length > 64 ||
      attribute.value.length < 1 ||
      attribute.value.length > 255
    ) {
      return false;
    }
    return attribute.key !== 'Artwork URL' || isArtworkUrl(attribute.value);
  });
}

async function validateSellableLines(lines: AddLine[]) {
  const requirements = await Promise.all(
    lines.map((line) => getVariantCartRequirements(line.merchandiseId))
  );

  for (let index = 0; index < lines.length; index += 1) {
    const requirement = requirements[index];
    if (!requirement?.productType.toLowerCase().includes('case')) continue;
    const attributes = new Map(
      (lines[index].attributes ?? []).map((attribute) => [attribute.key, attribute.value.trim()])
    );
    const brand = attributes.get('Phone Brand');
    const model = attributes.get('Phone Model');
    if (!brand || !model) {
      return 'Choose the exact phone model before adding this case to your cart.';
    }
    const validModel = requirement.deviceModels.some(
      (device) => device.active && device.brand === brand && device.model === model
    );
    if (!validModel) {
      return 'That phone model is not currently available for this case. Please choose again.';
    }
  }
  return null;
}

function parseAction(value: unknown): CartAction | null {
  if (!value || typeof value !== 'object') return null;
  const action = value as Record<string, unknown>;
  if (
    action.action === 'repair' &&
    isShopifyId(action.lineId, 'CartLine') &&
    isShopifyId(action.merchandiseId, 'ProductVariant') &&
    validAttributes(action.attributes)
  ) {
    return action as CartAction;
  }
  if (
    action.action === 'add' &&
    isShopifyId(action.merchandiseId, 'ProductVariant') &&
    Number.isInteger(action.quantity) &&
    Number(action.quantity) > 0 &&
    Number(action.quantity) <= 20 &&
    validAttributes(action.attributes)
  ) {
    return action as CartAction;
  }
  if (
    action.action === 'addMany' &&
    Array.isArray(action.lines) &&
    action.lines.length > 0 &&
    action.lines.length <= 10 &&
    action.lines.every(
      (line) =>
        line &&
        typeof line === 'object' &&
        isShopifyId((line as Record<string, unknown>).merchandiseId, 'ProductVariant') &&
        Number.isInteger((line as Record<string, unknown>).quantity) &&
        Number((line as Record<string, unknown>).quantity) > 0 &&
        Number((line as Record<string, unknown>).quantity) <= 20 &&
        validAttributes((line as Record<string, unknown>).attributes)
    )
  ) {
    return action as CartAction;
  }
  if (
    action.action === 'update' &&
    isShopifyId(action.lineId, 'CartLine') &&
    Number.isInteger(action.quantity) &&
    Number(action.quantity) >= 0 &&
    Number(action.quantity) <= 20
  ) {
    return action as CartAction;
  }
  if (
    action.action === 'remove' &&
    isShopifyId(action.lineId, 'CartLine')
  ) {
    return action as CartAction;
  }
  return action.action === 'clear' ? { action: 'clear' } : null;
}

async function hasSameOrigin(request: Request) {
  const origin = request.headers.get('origin');
  if (!origin) return true;
  try {
    const headerStore = await headers();
    const permitted = new Set(
      [
        new URL(request.url).host,
        headerStore.get('host'),
        headerStore.get('x-forwarded-host'),
        process.env.NEXT_PUBLIC_SITE_URL
          ? new URL(process.env.NEXT_PUBLIC_SITE_URL).host
          : null,
      ].filter((host): host is string => Boolean(host))
    );
    return permitted.has(new URL(origin).host);
  } catch {
    return false;
  }
}

function setCartCookie(response: NextResponse, cartId: string) {
  response.cookies.set(CART_COOKIE, cartId, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: CART_MAX_AGE,
  });
}

function clearCartCookie(response: NextResponse) {
  response.cookies.set(CART_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function GET() {
  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;
  if (!cartId) {
    return NextResponse.json(
      { cart: null, issues: [] },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  }

  try {
    const cart = await getCart(cartId);
    const issues = await getCartIssues(cart);
    const response = NextResponse.json(
      { cart, issues },
      { headers: { 'Cache-Control': 'no-store' } }
    );
    if (!cart) clearCartCookie(response);
    return response;
  } catch {
    return errorResponse('Your cart could not be refreshed.', 503);
  }
}

export async function POST(request: Request) {
  if (!(await hasSameOrigin(request))) {
    return errorResponse('This cart request is not allowed.', 403);
  }

  let action: CartAction | null = null;
  try {
    action = parseAction(await request.json());
  } catch {
    return errorResponse('The cart request is not valid.');
  }
  if (!action) return errorResponse('The cart request is not valid.');

  const cookieStore = await cookies();
  const cartId = cookieStore.get(CART_COOKIE)?.value;

  try {
    if (action.action === 'clear') {
      const response = NextResponse.json(
        { cart: null, issues: [] },
        { headers: { 'Cache-Control': 'no-store' } }
      );
      clearCartCookie(response);
      return response;
    }

    if (action.action === 'add' || action.action === 'addMany') {
      const lines = action.action === 'addMany'
        ? action.lines
        : [{
            merchandiseId: action.merchandiseId,
            quantity: action.quantity,
            attributes: action.attributes,
          }];
      const validationError = await validateSellableLines(lines);
      if (validationError) return errorResponse(validationError, 422);
      let cart;
      if (cartId) {
        const existingCart = await getCart(cartId);
        cart = existingCart
          ? await addCartLines(cartId, lines)
          : await createCart(lines);
      } else {
        cart = await createCart(lines);
      }
      const response = NextResponse.json(
        { cart, issues: await getCartIssues(cart) },
        { headers: { 'Cache-Control': 'no-store' } }
      );
      setCartCookie(response, cart.id);
      return response;
    }

    if (!cartId) return errorResponse('Your cart has expired. Please add the item again.', 409);
    if (action.action === 'repair') {
      const existingCart = await getCart(cartId);
      const line = existingCart?.lines.find((item) => item.id === action.lineId);
      if (!line || line.merchandise.id !== action.merchandiseId) {
        return errorResponse('That cart item is no longer available to update.', 409);
      }
      const validationError = await validateSellableLines([{
        merchandiseId: action.merchandiseId,
        quantity: line.quantity,
        attributes: action.attributes,
      }]);
      if (validationError) return errorResponse(validationError, 422);
      const repairedCart = await updateCartLines(cartId, [{
        id: action.lineId,
        quantity: line.quantity,
        merchandiseId: action.merchandiseId,
        attributes: action.attributes,
      }]);
      return NextResponse.json(
        { cart: repairedCart, issues: await getCartIssues(repairedCart) },
        { headers: { 'Cache-Control': 'no-store' } }
      );
    }
    const cart =
      action.action === 'remove' || action.quantity === 0
        ? await removeCartLines(cartId, [action.lineId])
        : await updateCartLines(cartId, [
            { id: action.lineId, quantity: action.quantity },
          ]);
    return NextResponse.json(
      { cart, issues: await getCartIssues(cart) },
      { headers: { 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    const message =
      error instanceof ShopifyUserError
        ? error.message
        : 'The cart could not be updated. Please try again.';
    return errorResponse(message, error instanceof ShopifyUserError ? 422 : 503);
  }
}

export async function DELETE(request: Request) {
  if (!(await hasSameOrigin(request))) {
    return errorResponse('This cart request is not allowed.', 403);
  }
  const response = NextResponse.json(
    { cart: null },
    { headers: { 'Cache-Control': 'no-store' } }
  );
  clearCartCookie(response);
  return response;
}
