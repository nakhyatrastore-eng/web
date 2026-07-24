'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { Product } from '@/lib/mock-data';
import { useCart } from '@/lib/cart-context';
import Customizer from './Customizer';

export default function ProductDetail({ product }: { product: Product }) {
  const [variant, setVariant] = useState(product.variants[0]);
  const [customImageUrl, setCustomImageUrl] = useState<string | null>(null);
  const { addToCart } = useCart();

  const isCustomizable = product.tags.includes('customizable');
  const readyToAdd = !isCustomizable || Boolean(customImageUrl);

  function handleAddToCart() {
    addToCart(product, variant, 1, customImageUrl ?? undefined);
  }

  return (
    <main className="max-w-[1180px] mx-auto px-6 py-16">
      <div className="grid md:grid-cols-2 gap-12">
        <div className="aspect-[4/5] bg-bg2 border border-border relative overflow-hidden">
          {product.images[0] && (
            <Image
              src={product.images[0].url}
              alt={product.images[0].altText ?? product.title}
              fill
              className="object-cover"
            />
          )}
        </div>

        <div>
          <div className="eyebrow mb-3">{product.productType}</div>
          <h1 className="text-[clamp(28px,4vw,44px)] font-extrabold tracking-tight mb-4">{product.title}</h1>

          <div className="flex items-center gap-3 font-mono text-xl mb-6">
            <span>₹{variant.price.amount}</span>
            {product.compareAtPrice && <span className="text-ink3 line-through text-base">₹{product.compareAtPrice}</span>}
          </div>

          <p className="text-ink2 mb-8">{product.description}</p>

          {product.variants.length > 1 && (
            <div className="mb-8 space-y-6">
              {/* Option Groups */}
              {Array.from(new Set(product.variants.flatMap(v => v.selectedOptions.map(o => o.name)))).map((optionName) => {
                const values = Array.from(new Set(
                  product.variants
                    .filter(v => {
                      // If it's the first option, show all values. 
                      // Otherwise, only show values compatible with currently selected previous options.
                      const optionIndex = v.selectedOptions.findIndex(o => o.name === optionName);
                      if (optionIndex === 0) return true;
                      return v.selectedOptions.slice(0, optionIndex).every((prevOpt, idx) => 
                        variant.selectedOptions[idx].value === prevOpt.value
                      );
                    })
                    .map(v => v.selectedOptions.find(o => o.name === optionName)?.value)
                )).filter(Boolean) as string[];

                return (
                  <div key={optionName}>
                    <div className="kicker mb-3">{optionName}</div>
                    <div className="flex flex-wrap gap-2">
                      {values.map((val) => {
                        const isSelected = variant.selectedOptions.find(o => o.name === optionName)?.value === val;
                        return (
                          <button
                            key={val}
                            onClick={() => {
                              const newVariant = product.variants.find(v => 
                                v.selectedOptions.find(o => o.name === optionName)?.value === val &&
                                v.selectedOptions.every(o => o.name === optionName || variant.selectedOptions.find(vo => vo.name === o.name)?.value === o.value)
                              ) || product.variants.find(v => v.selectedOptions.find(o => o.name === optionName)?.value === val);
                              if (newVariant) setVariant(newVariant);
                            }}
                            className={`border px-4 py-2 text-sm ${
                              isSelected ? 'border-accent text-accent' : 'border-border text-ink2'
                            }`}
                          >
                            {val}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <button
            onClick={handleAddToCart}
            disabled={!variant.availableForSale || !readyToAdd}
            className="w-full md:w-auto bg-accent hover:bg-accent-h disabled:opacity-40 disabled:cursor-not-allowed text-ink px-10 py-4 kicker tracking-widest"
          >
            {!variant.availableForSale
              ? 'Sold Out'
              : isCustomizable && !customImageUrl
              ? 'Upload a Design First'
              : 'Add to Cart'}
          </button>
        </div>
      </div>

      {isCustomizable && (
        <div className="mt-16">
          <Customizer productType={product.productType} onDesignChange={setCustomImageUrl} />
        </div>
      )}
    </main>
  );
}
