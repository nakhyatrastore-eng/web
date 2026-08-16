import type { Product, ProductCardData } from './catalog';

export const SMALL_DROP_LIMIT = 5;
const CASE_TARGET = 4;
const PRINT_TARGET = 1;
const CANDIDATE_MULTIPLIER = 3;

function uniqueByHandle<T extends { handle: string }>(items: readonly T[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.handle)) return false;
    seen.add(item.handle);
    return true;
  });
}

/**
 * Shopify collection order is the merchandising control. We reserve the first
 * four positions for cases and one for metal, then keep enough ordered backups
 * to heal the drop when an item is deleted, unpublished, or missing imagery.
 */
export function prioritizeSmallDropCandidates(
  cases: readonly ProductCardData[],
  prints: readonly ProductCardData[],
) {
  const priority = [
    ...cases.slice(0, CASE_TARGET),
    ...prints.slice(0, PRINT_TARGET),
    ...cases.slice(CASE_TARGET),
    ...prints.slice(PRINT_TARGET),
  ];

  return uniqueByHandle(priority).slice(0, SMALL_DROP_LIMIT * CANDIDATE_MULTIPLIER);
}

/** Keep sellable work first, while retaining sold-out art as a fallback. */
export function finalizeSmallDrop(products: readonly (Product | null)[]) {
  const valid = uniqueByHandle(
    products.filter(
      (product): product is Product => product !== null && product.images.length > 0,
    ),
  );

  return [
    ...valid.filter((product) => product.availableForSale),
    ...valid.filter((product) => !product.availableForSale),
  ].slice(0, SMALL_DROP_LIMIT);
}
