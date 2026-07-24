// Shopify Storefront API client.
// Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN in Vercel env vars.
// Without these, the site runs on mock data automatically.

import { MOCK_COLLECTIONS, MOCK_PRODUCTS, type Product, type Collection } from './mock-data';

// Strip protocol if user accidentally included it (e.g. "https://store.myshopify.com")
const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN?.replace(/^https?:\/\//, '');
const TOKEN = process.env.SHOPIFY_STOREFRONT_TOKEN;
const API_VERSION = '2024-10';

const HAS_SHOPIFY = Boolean(DOMAIN && TOKEN);

async function shopifyFetch<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`https://${DOMAIN}/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN as string,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });

  if (!res.ok) {
    throw new Error(`Shopify Storefront API error: ${res.status}`);
  }

  const json = await res.json();
  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data as T;
}

// ---- Public API used by pages/components ----

export async function getAllProducts(): Promise<Product[]> {
  if (!HAS_SHOPIFY) return MOCK_PRODUCTS;

  try {
    const query = /* GraphQL */ `
      query AllProducts {
        products(first: 100) {
          edges {
            node {
              id
              handle
              title
              description
              productType
              tags
              priceRange { minVariantPrice { amount currencyCode } }
              compareAtPriceRange { minVariantPrice { amount currencyCode } }
              images(first: 5) { edges { node { url altText width height } } }
              variants(first: 25) {
                edges { node { id title availableForSale selectedOptions { name value } price { amount } } }
              }
            }
          }
        }
      }
    `;
    const data = await shopifyFetch<{ products: { edges: { node: any }[] } }>(query);
    return data.products.edges.map(({ node }) => mapProduct(node));
  } catch {
    return MOCK_PRODUCTS;
  }
}

export async function getProductByHandle(handle: string): Promise<Product | null> {
  if (!HAS_SHOPIFY) {
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  }

  try {
    const query = /* GraphQL */ `
      query ProductByHandle($handle: String!) {
        product(handle: $handle) {
          id
          handle
          title
          description
          productType
          tags
          priceRange { minVariantPrice { amount currencyCode } }
          compareAtPriceRange { minVariantPrice { amount currencyCode } }
          images(first: 8) { edges { node { url altText width height } } }
          variants(first: 25) {
            edges { node { id title availableForSale selectedOptions { name value } price { amount } } }
          }
        }
      }
    `;
    const data = await shopifyFetch<{ product: any }>(query, { handle });
    return data.product ? mapProduct(data.product) : null;
  } catch {
    return MOCK_PRODUCTS.find((p) => p.handle === handle) ?? null;
  }
}

export async function getProductsByCollection(handle: string): Promise<Product[]> {
  if (!HAS_SHOPIFY) {
    return MOCK_PRODUCTS.filter((p) => p.collectionHandle === handle);
  }

  try {
    const query = /* GraphQL */ `
      query CollectionProducts($handle: String!) {
        collection(handle: $handle) {
          products(first: 100) {
            edges {
              node {
                id
                handle
                title
                description
                productType
                tags
                priceRange { minVariantPrice { amount currencyCode } }
                compareAtPriceRange { minVariantPrice { amount currencyCode } }
                images(first: 5) { edges { node { url altText width height } } }
                variants(first: 25) {
                  edges { node { id title availableForSale selectedOptions { name value } price { amount } } }
                }
              }
            }
          }
        }
      }
    `;
    const data = await shopifyFetch<{ collection: { products: { edges: { node: any }[] } } | null }>(query, { handle });
    if (!data.collection) return [];
    return data.collection.products.edges.map(({ node }) => mapProduct(node));
  } catch {
    return MOCK_PRODUCTS.filter((p) => p.collectionHandle === handle);
  }
}

export function getAllCollections(): Collection[] {
  return MOCK_COLLECTIONS;
}

export async function createCheckout(
  lines: {
    merchandiseId: string;
    quantity: number;
    attributes?: { key: string; value: string }[];
  }[]
): Promise<string> {
  if (!HAS_SHOPIFY) {
    throw new Error('Connect a Shopify store (.env.local) to enable checkout.');
  }

  const query = /* GraphQL */ `
    mutation CartCreate($lines: [CartLineInput!]!) {
      cartCreate(input: { lines: $lines }) {
        cart { checkoutUrl }
        userErrors { message }
      }
    }
  `;
  const data = await shopifyFetch<{ cartCreate: { cart: { checkoutUrl: string } | null; userErrors: any[] } }>(
    query,
    { lines }
  );
  if (data.cartCreate.userErrors.length) {
    throw new Error(data.cartCreate.userErrors.map((e) => e.message).join(', '));
  }
  return data.cartCreate.cart!.checkoutUrl;
}

function mapProduct(node: any): Product {
  return {
    id: node.id,
    handle: node.handle,
    title: node.title,
    description: node.description,
    productType: node.productType,
    tags: node.tags ?? [],
    price: parseFloat(node.priceRange.minVariantPrice.amount),
    currency: node.priceRange.minVariantPrice.currencyCode,
    compareAtPrice: node.compareAtPriceRange?.minVariantPrice?.amount
      ? parseFloat(node.compareAtPriceRange.minVariantPrice.amount)
      : undefined,
    images: node.images.edges.map((e: any) => e.node),
    variants: node.variants.edges.map((e: any) => e.node),
    collectionHandle: '',
  };
}

export { HAS_SHOPIFY };
