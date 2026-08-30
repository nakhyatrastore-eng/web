'use client';

import type { ProductCardData } from '@/lib/catalog';
import { useShoppingAssistant } from './ShoppingAssistant';
import { IconArrowRight } from './icons';

export default function QuickAddTrigger({
  product,
  label,
}: {
  product: ProductCardData;
  label: string;
}) {
  const { openQuickAdd } = useShoppingAssistant();
  return (
    <button type="button" onClick={() => openQuickAdd(product)} disabled={!product.availableForSale} className="button-primary liquid-button w-full justify-between disabled:opacity-40 sm:w-auto">
      <span className="liquid-fill" aria-hidden="true" />
      <span className="liquid-label">{label}</span>
      <IconArrowRight className="liquid-label h-4 w-4" />
    </button>
  );
}
