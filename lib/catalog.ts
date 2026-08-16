export type Money = {
  amount: string;
  currencyCode: string;
};

export type ProductImage = {
  url: string;
  altText: string | null;
  width: number | null;
  height: number | null;
};

export type ProductVideoSource = {
  url: string;
  mimeType: string;
  format: string;
  width: number | null;
  height: number | null;
};

export type ProductMedia =
  | {
      kind: 'image';
      id: string;
      alt: string | null;
      image: ProductImage;
    }
  | {
      kind: 'video';
      id: string;
      alt: string | null;
      previewImage: ProductImage | null;
      sources: ProductVideoSource[];
    };

export type ProductVariant = {
  id: string;
  sku: string | null;
  title: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: Money;
  compareAtPrice: Money | null;
  image: ProductImage | null;
};

export type ProductRating = {
  value: number;
  count: number;
  scale: number;
};

export type DeviceModel = {
  id: string;
  handle: string;
  model: string;
  family: string;
  brand: string;
  platform: string;
  active: boolean;
  sortOrder: number;
};

export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  vendor: string;
  tags: string[];
  availableForSale: boolean;
  totalInventory: number | null;
  updatedAt: string;
  seo: { title: string | null; description: string | null };
  price: number;
  currency: string;
  compareAtPrice?: number;
  images: ProductImage[];
  media: ProductMedia[];
  options: { name: string; values: string[] }[];
  variants: ProductVariant[];
  deviceModels: DeviceModel[];
  rating: ProductRating | null;
  theme: string | null;
  pairedHandle: string | null;
};

export type ProductCardData = Pick<
  Product,
  | 'id'
  | 'handle'
  | 'title'
  | 'productType'
  | 'vendor'
  | 'tags'
  | 'availableForSale'
  | 'updatedAt'
  | 'price'
  | 'currency'
  | 'compareAtPrice'
  | 'images'
  | 'variants'
  | 'deviceModels'
  | 'rating'
  | 'theme'
  | 'pairedHandle'
>;

export type Collection = {
  id: string;
  handle: string;
  title: string;
  description: string;
  updatedAt: string;
  image: ProductImage | null;
};

export type CollectionWithProducts = Collection & {
  products: ProductCardData[];
};

export type CartIssue = {
  lineId: string;
  merchandiseId: string;
  productTitle: string;
  message: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  attributes: { key: string; value: string }[];
  cost: { totalAmount: Money };
  merchandise: ProductVariant & {
    product: Pick<Product, 'handle' | 'title' | 'productType'> & {
      featuredImage: ProductImage | null;
    };
  };
};

export type ShopifyCart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: {
    subtotalAmount: Money;
    totalAmount: Money;
  };
  lines: CartLine[];
};

export type StorefrontCart = ShopifyCart | null;
