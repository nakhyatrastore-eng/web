'use client';

import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { Product, ProductVariant } from './mock-data';

export type CartLine = {
  lineKey: string; // variantId + customImageUrl, so the same variant with a
                    // different custom design is a separate line
  variantId: string;
  quantity: number;
  product: Product;
  variant: ProductVariant;
  customImageUrl?: string;
};

type CartContextValue = {
  lines: CartLine[];
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addToCart: (product: Product, variant: ProductVariant, quantity?: number, customImageUrl?: string) => void;
  removeLine: (lineKey: string) => void;
  updateQuantity: (lineKey: string, quantity: number) => void;
  subtotal: number;
  count: number;
};

const CartContext = createContext<CartContextValue | null>(null);

function makeLineKey(variantId: string, customImageUrl?: string) {
  return customImageUrl ? `${variantId}::${customImageUrl}` : variantId;
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const addToCart = useCallback(
    (product: Product, variant: ProductVariant, quantity = 1, customImageUrl?: string) => {
      const lineKey = makeLineKey(variant.id, customImageUrl);
      setLines((prev) => {
        const existing = prev.find((l) => l.lineKey === lineKey);
        if (existing) {
          return prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity: l.quantity + quantity } : l));
        }
        return [...prev, { lineKey, variantId: variant.id, quantity, product, variant, customImageUrl }];
      });
      setIsOpen(true);
    },
    []
  );

  const removeLine = useCallback((lineKey: string) => {
    setLines((prev) => prev.filter((l) => l.lineKey !== lineKey));
  }, []);

  const updateQuantity = useCallback((lineKey: string, quantity: number) => {
    setLines((prev) =>
      quantity <= 0 ? prev.filter((l) => l.lineKey !== lineKey) : prev.map((l) => (l.lineKey === lineKey ? { ...l, quantity } : l))
    );
  }, []);

  const subtotal = useMemo(() => lines.reduce((sum, l) => sum + parseFloat(l.variant.price.amount) * l.quantity, 0), [lines]);
  const count = useMemo(() => lines.reduce((sum, l) => sum + l.quantity, 0), [lines]);

  return (
    <CartContext.Provider
      value={{
        lines,
        isOpen,
        openCart: () => setIsOpen(true),
        closeCart: () => setIsOpen(false),
        addToCart,
        removeLine,
        updateQuantity,
        subtotal,
        count,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
