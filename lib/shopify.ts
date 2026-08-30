import { cache } from 'react';
import type {
  Collection,
  CollectionWithProducts,
  DeviceModel,
  Product,
  ProductCardData,
  ProductImage,
  ProductMedia,
  ProductVariant,
  ShopifyCart,
} from './catalog';

export const SHOPIFY_API_VERSION = '2026-07';
const DEFAULT_REVALIDATE_SECONDS = 60;

const IMAGE_FIELDS = /* GraphQL */ `
  fragment ImageFields on Image {
    url
    altText
    width
    height
  }
`;

const PRODUCT_FIELDS = /* GraphQL */ `
  ${IMAGE_FIELDS}
  fragment ProductFields on Product {
    id
    handle
    title
    description
    productType
    vendor
    tags
    availableForSale
    updatedAt
    seo {
      title
      description
    }
    options {
      name
      optionValues {
        name
      }
    }
    images(first: 12) {
      nodes {
        ...ImageFields
      }
    }
    media(first: 12) {
      nodes {
        mediaContentType
        alt
        ... on MediaImage {
          id
          image {
            ...ImageFields
          }
        }
        ... on Video {
          id
          previewImage {
            ...ImageFields
          }
          sources {
            url
            mimeType
            format
            width
            height
          }
        }
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 250) {
      nodes {
        id
        sku
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        image {
          ...ImageFields
        }
      }
    }
    rating: metafield(namespace: "reviews", key: "rating") {
      value
    }
    ratingCount: metafield(namespace: "reviews", key: "rating_count") {
      value
    }
    theme: metafield(namespace: "custom", key: "theme") {
      value
    }
    pairedProducts: metafield(namespace: "custom", key: "pairs_with") {
      references(first: 4) {
        nodes {
          ... on Product {
            handle
          }
        }
      }
    }
    deviceInventory: metafield(namespace: "custom", key: "device_inventory") {
      references(first: 50) {
        nodes {
          ... on Metaobject {
            id
            handle
            model: field(key: "model") {
              value
            }
            family: field(key: "family") {
              value
            }
            brand: field(key: "brand") {
              value
            }
            platform: field(key: "platform") {
              value
            }
            active: field(key: "active") {
              value
            }
            sortOrder: field(key: "sort_order") {
              value
            }
          }
        }
      }
    }
    legacyTheme: metafield(namespace: "art", key: "theme") {
      value
    }
    legacyPairedProduct: metafield(namespace: "art", key: "pairs_with") {
      value
    }
  }
`;

const COLLECTION_PRODUCT_FIELDS = /* GraphQL */ `
  ${IMAGE_FIELDS}
  fragment CollectionProductFields on Product {
    id
    handle
    title
    productType
    vendor
    tags
    availableForSale
    updatedAt
    images(first: 2) {
      nodes {
        ...ImageFields
      }
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    compareAtPriceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
    variants(first: 20) {
      nodes {
        id
        sku
        title
        availableForSale
        selectedOptions {
          name
          value
        }
        price {
          amount
          currencyCode
        }
        compareAtPrice {
          amount
          currencyCode
        }
        image {
          ...ImageFields
        }
      }
    }
    rating: metafield(namespace: "reviews", key: "rating") {
      value
    }
    ratingCount: metafield(namespace: "reviews", key: "rating_count") {
      value
    }
    theme: metafield(namespace: "custom", key: "theme") {
      value
    }
    pairedProducts: metafield(namespace: "custom", key: "pairs_with") {
      references(first: 1) {
        nodes {
          ... on Product {
            handle
          }
        }
      }
    }
    legacyTheme: metafield(namespace: "art", key: "theme") {
      value
    }
    legacyPairedProduct: metafield(namespace: "art", key: "pairs_with") {
      value
    }
  }
`;

const PRODUCTS_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query Products($after: String) {
    products(first: 100, after: $after, sortKey: CREATED_AT, reverse: true) {
      nodes {
        ...ProductFields
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCT_BY_HANDLE_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      ...ProductFields
    }
  }
`;

const COLLECTIONS_QUERY = /* GraphQL */ `
  ${IMAGE_FIELDS}
  query Collections($after: String) {
    collections(first: 100, after: $after, sortKey: TITLE) {
      nodes {
        id
        handle
        title
        description
        updatedAt
        image {
          ...ImageFields
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const COLLECTION_BY_HANDLE_QUERY = /* GraphQL */ `
  ${COLLECTION_PRODUCT_FIELDS}
  query CollectionByHandle($handle: String!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      updatedAt
      image {
        url
        altText
        width
        height
      }
      products(first: 100, after: $after, sortKey: COLLECTION_DEFAULT) {
        nodes {
          ...CollectionProductFields
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

const COLLECTION_DEVICE_MODELS_QUERY = /* GraphQL */ `
  query CollectionDeviceModels($handle: String!) {
    collection(handle: $handle) {
      products(first: 1, sortKey: COLLECTION_DEFAULT) {
        nodes {
          deviceInventory: metafield(namespace: "custom", key: "device_inventory") {
            references(first: 50) {
              nodes {
                ... on Metaobject {
                  id
                  handle
                  model: field(key: "model") { value }
                  family: field(key: "family") { value }
                  brand: field(key: "brand") { value }
                  platform: field(key: "platform") { value }
                  active: field(key: "active") { value }
                  sortOrder: field(key: "sort_order") { value }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const SEARCH_QUERY = /* GraphQL */ `
  ${PRODUCT_FIELDS}
  query SearchProducts($query: String!) {
    predictiveSearch(
      query: $query
      limit: 8
      limitScope: EACH
      types: [PRODUCT, COLLECTION, QUERY]
      unavailableProducts: HIDE
    ) {
      products {
        ...ProductFields
      }
      collections {
        id
        handle
        title
        description
        updatedAt
        image {
          url
          altText
          width
          height
        }
      }
      queries {
        text
        styledText
      }
    }
  }
`;

const VARIANT_CART_REQUIREMENTS_QUERY = /* GraphQL */ `
  query VariantCartRequirements($id: ID!) {
    node(id: $id) {
      ... on ProductVariant {
        id
        product {
          productType
          deviceInventory: metafield(namespace: "custom", key: "device_inventory") {
            references(first: 50) {
              nodes {
                ... on Metaobject {
                  id
                  handle
                  model: field(key: "model") { value }
                  family: field(key: "family") { value }
                  brand: field(key: "brand") { value }
                  platform: field(key: "platform") { value }
                  active: field(key: "active") { value }
                  sortOrder: field(key: "sort_order") { value }
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_FIELDS = /* GraphQL */ `
  ${IMAGE_FIELDS}
  fragment CartFields on Cart {
    id
    checkoutUrl
    totalQuantity
    cost {
      subtotalAmount {
        amount
        currencyCode
      }
      totalAmount {
        amount
        currencyCode
      }
    }
    lines(first: 100) {
      nodes {
        id
        quantity
        attributes {
          key
          value
        }
        cost {
          totalAmount {
            amount
            currencyCode
          }
        }
        merchandise {
          ... on ProductVariant {
            id
            title
            availableForSale
            selectedOptions {
              name
              value
            }
            price {
              amount
              currencyCode
            }
            compareAtPrice {
              amount
              currencyCode
            }
            image {
              ...ImageFields
            }
            product {
              handle
              title
              productType
              featuredImage {
                ...ImageFields
              }
            }
          }
        }
      }
    }
  }
`;

const CART_QUERY = /* GraphQL */ `
  ${CART_FIELDS}
  query Cart($id: ID!) {
    cart(id: $id) {
      ...CartFields
    }
  }
`;

const CART_CREATE_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartCreate($lines: [CartLineInput!]) {
    cartCreate(input: { lines: $lines, buyerIdentity: { countryCode: IN } }) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
      }
    }
  }
`;

const CART_LINES_ADD_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
      }
    }
  }
`;

const CART_LINES_UPDATE_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesUpdate($cartId: ID!, $lines: [CartLineUpdateInput!]!) {
    cartLinesUpdate(cartId: $cartId, lines: $lines) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
      }
    }
  }
`;

const CART_LINES_REMOVE_MUTATION = /* GraphQL */ `
  ${CART_FIELDS}
  mutation CartLinesRemove($cartId: ID!, $lineIds: [ID!]!) {
    cartLinesRemove(cartId: $cartId, lineIds: $lineIds) {
      cart {
        ...CartFields
      }
      userErrors {
        field
        message
      }
      warnings {
        code
        message
      }
    }
  }
`;

type GraphQLError = { message: string };
type GraphQLResponse<T> = { data?: T; errors?: GraphQLError[] };
type MetafieldValue = { value: string } | null;
type ProductReferenceMetafield = {
  references: { nodes: { handle: string }[] };
} | null;
type MetaobjectField = { value: string } | null;
type DeviceMetaobject = {
  id: string;
  handle: string;
  model: MetaobjectField;
  family: MetaobjectField;
  brand: MetaobjectField;
  platform: MetaobjectField;
  active: MetaobjectField;
  sortOrder: MetaobjectField;
};
type DeviceReferenceMetafield = {
  references: { nodes: DeviceMetaobject[] };
} | null;

type ShopifyProduct = Omit<
  Product,
  | 'price'
  | 'currency'
  | 'compareAtPrice'
  | 'images'
  | 'media'
  | 'options'
  | 'variants'
  | 'deviceModels'
  | 'rating'
  | 'theme'
  | 'pairedHandle'
  | 'totalInventory'
> & {
  images: { nodes: ProductImage[] };
  media: { nodes: ShopifyMedia[] };
  options: { name: string; optionValues: { name: string }[] }[];
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { nodes: ProductVariant[] };
  rating: MetafieldValue;
  ratingCount: MetafieldValue;
  theme: MetafieldValue;
  pairedProducts: ProductReferenceMetafield;
  deviceInventory: DeviceReferenceMetafield;
  legacyTheme: MetafieldValue;
  legacyPairedProduct: MetafieldValue;
};

type ShopifyCardProduct = Omit<
  ProductCardData,
  | 'price'
  | 'currency'
  | 'compareAtPrice'
  | 'images'
  | 'variants'
  | 'deviceModels'
  | 'rating'
  | 'theme'
  | 'pairedHandle'
> & {
  images: { nodes: ProductImage[] };
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  variants: { nodes: ProductVariant[] };
  rating: MetafieldValue;
  ratingCount: MetafieldValue;
  theme: MetafieldValue;
  pairedProducts: ProductReferenceMetafield;
  legacyTheme: MetafieldValue;
  legacyPairedProduct: MetafieldValue;
};

type ShopifyMedia = {
  id: string;
  mediaContentType: 'IMAGE' | 'VIDEO' | string;
  alt: string | null;
  image?: ProductImage;
  previewImage?: ProductImage | null;
  sources?: {
    url: string;
    mimeType: string;
    format: string;
    width: number | null;
    height: number | null;
  }[];
};

type PageInfo = { hasNextPage: boolean; endCursor: string | null };
type ShopifyCartPayload = Omit<ShopifyCart, 'lines'> & {
  lines: { nodes: ShopifyCart['lines'] };
};
type CartInputLine = {
  merchandiseId: string;
  quantity: number;
  attributes?: { key: string; value: string }[];
};
type CartUpdateLine = {
  id: string;
  quantity?: number;
  merchandiseId?: string;
  attributes?: { key: string; value: string }[];
};

export class ShopifyConfigurationError extends Error {}
export class ShopifyUserError extends Error {}

export function isShopifyConfigured() {
  return Boolean(
    process.env.SHOPIFY_STORE_DOMAIN?.trim() &&
      process.env.SHOPIFY_STOREFRONT_TOKEN?.trim()
  );
}

function getShopifyConfig() {
  const rawDomain = process.env.SHOPIFY_STORE_DOMAIN?.trim();
  const storefrontToken = process.env.SHOPIFY_STOREFRONT_TOKEN?.trim();

  if (!rawDomain || !storefrontToken) {
    throw new ShopifyConfigurationError(
      'Shopify is not configured. Set SHOPIFY_STORE_DOMAIN and SHOPIFY_STOREFRONT_TOKEN.'
    );
  }

  const domain = rawDomain.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  return { domain, storefrontToken };
}

async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  revalidate = DEFAULT_REVALIDATE_SECONDS
): Promise<T> {
  const { domain, storefrontToken } = getShopifyConfig();
  const response = await fetch(
    `https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': storefrontToken,
      },
      body: JSON.stringify({ query, variables }),
      cache: revalidate === 0 ? 'no-store' : undefined,
      next: revalidate === 0 ? undefined : { revalidate },
    }
  );

  const payload = (await response.json()) as GraphQLResponse<T>;
  if (!response.ok || payload.errors?.length || !payload.data) {
    const detail =
      payload.errors?.map((error) => error.message).join('; ') ||
      `HTTP ${response.status}`;
    throw new Error(`Shopify Storefront API request failed: ${detail}`);
  }

  return payload.data;
}

function parseRating(rating: MetafieldValue, count: MetafieldValue) {
  if (!rating?.value || !count?.value) return null;
  try {
    const parsed = JSON.parse(rating.value) as {
      value?: string | number;
      scale_max?: string | number;
    };
    const value = Number(parsed.value);
    const scale = Number(parsed.scale_max ?? 5);
    const ratingCount = Number(count.value);
    return value > 0 && scale > 0 && ratingCount > 0
      ? { value, count: ratingCount, scale }
      : null;
  } catch {
    const value = Number(rating.value);
    const ratingCount = Number(count.value);
    return value > 0 && ratingCount > 0
      ? { value, count: ratingCount, scale: 5 }
      : null;
  }
}

function mapMedia(media: ShopifyMedia[]): ProductMedia[] {
  const mapped: ProductMedia[] = [];
  for (const item of media) {
    if (item.mediaContentType === 'IMAGE' && item.image) {
      mapped.push({ kind: 'image', id: item.id, alt: item.alt, image: item.image });
      continue;
    }
    if (item.mediaContentType === 'VIDEO' && item.sources?.length) {
      mapped.push({
        kind: 'video',
        id: item.id,
        alt: item.alt,
        previewImage: item.previewImage ?? null,
        sources: item.sources,
      });
    }
  }
  return mapped;
}

function tagValue(tags: string[], prefixes: string[]) {
  for (const tag of tags) {
    const lower = tag.toLowerCase();
    const prefix = prefixes.find((candidate) => lower.startsWith(candidate));
    if (prefix) return tag.slice(prefix.length).trim() || null;
  }
  return null;
}

function mapDeviceModels(
  metafield: DeviceReferenceMetafield
): DeviceModel[] {
  return (metafield?.references.nodes ?? [])
    .map((entry) => ({
      id: entry.id,
      handle: entry.handle,
      model: entry.model?.value?.trim() ?? '',
      family: entry.family?.value?.trim() ?? '',
      brand:
        entry.brand?.value?.trim() || entry.family?.value?.trim() || 'Other',
      platform: entry.platform?.value?.trim() ?? '',
      active: entry.active?.value !== 'false',
      sortOrder: Number(entry.sortOrder?.value ?? Number.MAX_SAFE_INTEGER),
    }))
    .filter((entry) => entry.model)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.model.localeCompare(b.model));
}

function mapProduct(product: ShopifyProduct): Product {
  const price = product.priceRange.minVariantPrice;
  const compareAtPrice = Number(product.compareAtPriceRange.minVariantPrice.amount);
  const numericPrice = Number(price.amount);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    description: product.description,
    productType: product.productType,
    vendor: product.vendor,
    tags: product.tags,
    availableForSale: product.availableForSale,
    totalInventory: null,
    updatedAt: product.updatedAt,
    seo: product.seo,
    price: numericPrice,
    currency: price.currencyCode,
    compareAtPrice:
      Number.isFinite(compareAtPrice) && compareAtPrice > numericPrice
        ? compareAtPrice
        : undefined,
    images: product.images.nodes,
    media: mapMedia(product.media.nodes),
    options: product.options.map((option) => ({
      name: option.name,
      values: option.optionValues.map((value) => value.name),
    })),
    variants: product.variants.nodes,
    deviceModels: mapDeviceModels(product.deviceInventory),
    rating: parseRating(product.rating, product.ratingCount),
    theme:
      product.theme?.value ??
      product.legacyTheme?.value ??
      tagValue(product.tags, ['theme:', 'theme-']),
    pairedHandle:
      product.pairedProducts?.references.nodes[0]?.handle ??
      product.legacyPairedProduct?.value ??
      tagValue(product.tags, ['pairs:', 'pair:', 'pairs-']),
  };
}

function mapProductCard(product: ShopifyCardProduct): ProductCardData {
  const price = product.priceRange.minVariantPrice;
  const numericPrice = Number(price.amount);
  const compareAtPrice = Number(product.compareAtPriceRange.minVariantPrice.amount);
  return {
    id: product.id,
    handle: product.handle,
    title: product.title,
    productType: product.productType,
    vendor: product.vendor,
    tags: product.tags,
    availableForSale: product.availableForSale,
    updatedAt: product.updatedAt,
    price: numericPrice,
    currency: price.currencyCode,
    compareAtPrice:
      Number.isFinite(compareAtPrice) && compareAtPrice > numericPrice
        ? compareAtPrice
        : undefined,
    images: product.images.nodes,
    variants: product.variants.nodes,
    deviceModels: [],
    rating: parseRating(product.rating, product.ratingCount),
    theme:
      product.theme?.value ??
      product.legacyTheme?.value ??
      tagValue(product.tags, ['theme:', 'theme-']),
    pairedHandle:
      product.pairedProducts?.references.nodes[0]?.handle ??
      product.legacyPairedProduct?.value ??
      tagValue(product.tags, ['pairs:', 'pair:', 'pairs-']),
  };
}

function mapCart(cart: ShopifyCartPayload): ShopifyCart {
  return { ...cart, lines: cart.lines.nodes };
}

function assertMutation<T extends { cart: ShopifyCartPayload | null; userErrors: { message: string }[] }>(
  payload: T
) {
  if (payload.userErrors.length) {
    throw new ShopifyUserError(
      payload.userErrors.map((error) => error.message).join('; ')
    );
  }
  if (!payload.cart) throw new ShopifyUserError('Shopify did not return a cart.');
  return mapCart(payload.cart);
}

export const getAllProducts = cache(async (): Promise<Product[]> => {
  const products: Product[] = [];
  let after: string | null = null;
  do {
    const data: {
      products: { nodes: ShopifyProduct[]; pageInfo: PageInfo };
    } = await shopifyFetch(PRODUCTS_QUERY, { after });
    products.push(...data.products.nodes.map(mapProduct));
    after = data.products.pageInfo.hasNextPage
      ? data.products.pageInfo.endCursor
      : null;
  } while (after);
  return products;
});

export const getProductByHandle = cache(
  async (handle: string): Promise<Product | null> => {
    const data = await shopifyFetch<{ product: ShopifyProduct | null }>(
      PRODUCT_BY_HANDLE_QUERY,
      { handle }
    );
    return data.product ? mapProduct(data.product) : null;
  }
);

export const getAllCollections = cache(async (): Promise<Collection[]> => {
  const collections: Collection[] = [];
  let after: string | null = null;
  do {
    const data: {
      collections: { nodes: Collection[]; pageInfo: PageInfo };
    } = await shopifyFetch(COLLECTIONS_QUERY, { after });
    collections.push(...data.collections.nodes);
    after = data.collections.pageInfo.hasNextPage
      ? data.collections.pageInfo.endCursor
      : null;
  } while (after);
  return collections;
});

export const getCollectionByHandle = cache(
  async (handle: string): Promise<CollectionWithProducts | null> => {
    let collection: (Collection & { products: { nodes: ShopifyCardProduct[]; pageInfo: PageInfo } }) | null = null;
    const products: ProductCardData[] = [];
    let after: string | null = null;
    do {
      const data: {
        collection: (Collection & {
          products: { nodes: ShopifyCardProduct[]; pageInfo: PageInfo };
        }) | null;
      } = await shopifyFetch(COLLECTION_BY_HANDLE_QUERY, { handle, after });
      if (!data.collection) return null;
      collection = data.collection;
      products.push(...collection.products.nodes.map(mapProductCard));
      after = collection.products.pageInfo.hasNextPage
        ? collection.products.pageInfo.endCursor
        : null;
    } while (after);

    return collection ? { ...collection, products } : null;
  }
);

export const getCollectionDeviceModels = cache(async (handle: string) => {
  const data = await shopifyFetch<{
    collection: {
      products: { nodes: { deviceInventory: DeviceReferenceMetafield }[] };
    } | null;
  }>(COLLECTION_DEVICE_MODELS_QUERY, { handle });
  return mapDeviceModels(data.collection?.products.nodes[0]?.deviceInventory ?? null);
});

export async function searchStorefront(query: string) {
  const data = await shopifyFetch<{
    predictiveSearch: {
      products: ShopifyProduct[];
      collections: Collection[];
      queries: { text: string; styledText: string }[];
    };
  }>(SEARCH_QUERY, { query }, 60);
  return {
    products: data.predictiveSearch.products.map(mapProduct),
    collections: data.predictiveSearch.collections,
    queries: data.predictiveSearch.queries,
  };
}

export async function getVariantCartRequirements(id: string) {
  const data = await shopifyFetch<{
    node: {
      id: string;
      product: {
        productType: string;
        deviceInventory: DeviceReferenceMetafield;
      };
    } | null;
  }>(VARIANT_CART_REQUIREMENTS_QUERY, { id }, 60);
  if (!data.node) return null;
  return {
    productType: data.node.product.productType,
    deviceModels: mapDeviceModels(data.node.product.deviceInventory),
  };
}

export async function getCart(id: string): Promise<ShopifyCart | null> {
  const data = await shopifyFetch<{ cart: ShopifyCartPayload | null }>(
    CART_QUERY,
    { id },
    0
  );
  return data.cart ? mapCart(data.cart) : null;
}

export async function createCart(lines: CartInputLine[]) {
  const data = await shopifyFetch<{
    cartCreate: {
      cart: ShopifyCartPayload | null;
      userErrors: { message: string }[];
    };
  }>(CART_CREATE_MUTATION, { lines }, 0);
  return assertMutation(data.cartCreate);
}

export async function addCartLines(cartId: string, lines: CartInputLine[]) {
  const data = await shopifyFetch<{
    cartLinesAdd: {
      cart: ShopifyCartPayload | null;
      userErrors: { message: string }[];
    };
  }>(CART_LINES_ADD_MUTATION, { cartId, lines }, 0);
  return assertMutation(data.cartLinesAdd);
}

export async function updateCartLines(
  cartId: string,
  lines: CartUpdateLine[]
) {
  const data = await shopifyFetch<{
    cartLinesUpdate: {
      cart: ShopifyCartPayload | null;
      userErrors: { message: string }[];
    };
  }>(CART_LINES_UPDATE_MUTATION, { cartId, lines }, 0);
  return assertMutation(data.cartLinesUpdate);
}

export async function removeCartLines(cartId: string, lineIds: string[]) {
  const data = await shopifyFetch<{
    cartLinesRemove: {
      cart: ShopifyCartPayload | null;
      userErrors: { message: string }[];
    };
  }>(CART_LINES_REMOVE_MUTATION, { cartId, lineIds }, 0);
  return assertMutation(data.cartLinesRemove);
}
