export type ProductImage = { url: string; altText: string | null; width: number; height: number };
export type ProductVariant = {
  id: string;
  title: string;
  availableForSale: boolean;
  selectedOptions: { name: string; value: string }[];
  price: { amount: string };
};
export type Product = {
  id: string;
  handle: string;
  title: string;
  description: string;
  productType: string;
  tags: string[];
  price: number;
  currency: string;
  compareAtPrice?: number;
  images: ProductImage[];
  variants: ProductVariant[];
  collectionHandle: string;
};
export type Collection = { handle: string; title: string; description: string };

export const MOCK_COLLECTIONS: Collection[] = [
  { handle: 'poster-wall', title: 'Poster Wall', description: 'Metal-print wall art, built to last.' },
  { handle: 'phone-cases', title: 'Phone Cases', description: 'Original prints, precision-fit for your phone.' },
];

const img = (seed: string): ProductImage => ({
  url: `https://placehold.co/900x1100/171717/f7f5f0?text=${encodeURIComponent(seed)}`,
  altText: seed,
  width: 900,
  height: 1100,
});

export const MOCK_PRODUCTS: Product[] = [
  {
    id: 'gid://mock/1',
    handle: 'metal-poster-sheets',
    title: 'Metal Poster Sheets',
    description: 'High-quality metal poster sheets. Durable and stylish.',
    productType: 'Poster',
    tags: ['metal-poster'],
    price: 1499,
    currency: 'INR',
    images: [img('Metal Poster Sheets')],
    variants: [{ id: 'gid://mock/1/v1', title: '12x18in', availableForSale: true, selectedOptions: [{ name: 'Size', value: '12x18in' }], price: { amount: '1499' } }],
    collectionHandle: 'poster-wall',
  },
  {
    id: 'gid://mock/2',
    handle: 'premium-phone-case',
    title: 'Premium Phone Case',
    description: 'Impact-resistant, precision-fit phone case for Android and iPhone.',
    productType: 'Phone Case',
    tags: ['phone-case'],
    price: 599,
    currency: 'INR',
    images: [img('Premium Phone Case')],
    variants: [
      { id: 'gid://mock/2/v1', title: 'iPhone / 13', availableForSale: true, selectedOptions: [{ name: 'Brand', value: 'iPhone' }, { name: 'Model', value: '13' }], price: { amount: '599' } },
      { id: 'gid://mock/2/v2', title: 'iPhone / 15', availableForSale: true, selectedOptions: [{ name: 'Brand', value: 'iPhone' }, { name: 'Model', value: '15' }], price: { amount: '599' } },
      { id: 'gid://mock/2/v3', title: 'Samsung / S24', availableForSale: true, selectedOptions: [{ name: 'Brand', value: 'Samsung' }, { name: 'Model', value: 'S24' }], price: { amount: '599' } },
    ],
    collectionHandle: 'phone-cases',
  },
];
