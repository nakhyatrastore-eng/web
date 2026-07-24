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
    handle: 'zf-custom-portrait-iphone-15-case',
    title: 'ZF Custom Portrait iPhone 15 Case',
    description: 'A premium iPhone 15 case featuring a bold red background, iconic ZF branding, and a stylized portrait design. Durable, stylish, and unique.',
    productType: 'Phone Case',
    tags: ['iPhone 15', 'Phone Case', 'Custom Design', 'ZF Branding', 'Red'],
    price: 1499,
    currency: 'INR',
    images: [{ url: 'https://files.manuscdn.com/user_upload_by_module/session_file/310519663851902176/EolYFHJNDfAqavdW.png', altText: 'ZF Custom Portrait iPhone 15 Case', width: 1086, height: 1448 }],
    variants: [
      { id: 'gid://mock/2/v1', title: 'iPhone / 15', availableForSale: true, selectedOptions: [{ name: 'Brand', value: 'iPhone' }, { name: 'Model', value: '15' }], price: { amount: '1499' } },
    ],
    collectionHandle: 'phone-cases',
  },
];
