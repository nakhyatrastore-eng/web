import Link from 'next/link';
import Image from 'next/image';
import type { Product } from '@/lib/mock-data';

export default function ProductCard({ product }: { product: Product }) {
  const img = product.images[0];
  return (
    <Link href={`/products/${product.handle}`} className="group block">
      <div className="relative aspect-[4/5] bg-bg2 border border-border overflow-hidden">
        {img && (
          <Image
            src={img.url}
            alt={img.altText ?? product.title}
            fill
            className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
          />
        )}
        {product.compareAtPrice && (
          <span className="absolute top-3 left-3 bg-accent text-ink text-[11px] font-mono uppercase tracking-wider px-2 py-1">
            Sale
          </span>
        )}
      </div>
      <div className="mt-3">
        <h3 className="text-sm">{product.title}</h3>
        <div className="mt-1 flex items-center gap-2 font-mono text-sm">
          <span>₹{product.price}</span>
          {product.compareAtPrice && (
            <span className="text-ink3 line-through">₹{product.compareAtPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
}
