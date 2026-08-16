'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import type { CartIssue, ProductVariant, ShopifyCart } from './catalog';

type CartContextValue = {
  cart: ShopifyCart | null;
  isOpen: boolean;
  isLoading: boolean;
  error: string | null;
  issues: CartIssue[];
  openCart: () => void;
  closeCart: () => void;
  clearError: () => void;
  addToCart: (
    variant: ProductVariant,
    quantity?: number,
    attributes?: { key: string; value: string }[]
  ) => Promise<boolean>;
  addManyToCart: (
    items: { variant: ProductVariant; quantity?: number; attributes?: { key: string; value: string }[] }[]
  ) => Promise<boolean>;
  removeLine: (lineId: string) => Promise<void>;
  updateQuantity: (lineId: string, quantity: number) => Promise<void>;
  repairLine: (
    lineId: string,
    merchandiseId: string,
    attributes: { key: string; value: string }[]
  ) => Promise<boolean>;
  count: number;
};

type CartResponse = { cart: ShopifyCart | null; issues?: CartIssue[]; error?: string };
const CartContext = createContext<CartContextValue | null>(null);

async function cartRequest(body?: Record<string, unknown>) {
  const response = await fetch('/api/cart', {
    method: body ? 'POST' : 'GET',
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const payload = (await response.json()) as CartResponse;
  if (!response.ok) {
    throw new Error(payload.error || 'The cart could not be updated.');
  }
  return { cart: payload.cart, issues: payload.issues ?? [] };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<ShopifyCart | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [issues, setIssues] = useState<CartIssue[]>([]);

  useEffect(() => {
    let active = true;
    cartRequest()
      .then((next) => {
        if (active) {
          setCart(next.cart);
          setIssues(next.issues);
        }
      })
      .catch(() => {
        if (active) setError('Your saved cart could not be refreshed.');
      })
      .finally(() => {
        if (active) setIsLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const mutate = useCallback(async (body: Record<string, unknown>) => {
    setIsLoading(true);
    setError(null);
    try {
      const next = await cartRequest(body);
      setCart(next.cart);
      setIssues(next.issues);
      return true;
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : 'The cart could not be updated.'
      );
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const addToCart = useCallback(
    async (
      variant: ProductVariant,
      quantity = 1,
      attributes: { key: string; value: string }[] = []
    ) => {
      const success = await mutate({
        action: 'add',
        merchandiseId: variant.id,
        quantity,
        attributes,
      });
      if (success) setIsOpen(true);
      return success;
    },
    [mutate]
  );

  const addManyToCart = useCallback(
    async (
      items: { variant: ProductVariant; quantity?: number; attributes?: { key: string; value: string }[] }[]
    ) => {
      const success = await mutate({
        action: 'addMany',
        lines: items.map((item) => ({
          merchandiseId: item.variant.id,
          quantity: item.quantity ?? 1,
          attributes: item.attributes ?? [],
        })),
      });
      if (success) setIsOpen(true);
      return success;
    },
    [mutate]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      await mutate({ action: 'remove', lineId });
    },
    [mutate]
  );

  const updateQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      await mutate({ action: 'update', lineId, quantity });
    },
    [mutate]
  );

  const repairLine = useCallback(
    async (
      lineId: string,
      merchandiseId: string,
      attributes: { key: string; value: string }[]
    ) => mutate({ action: 'repair', lineId, merchandiseId, attributes }),
    [mutate]
  );

  const value = useMemo<CartContextValue>(
    () => ({
      cart,
      isOpen,
      isLoading,
      error,
      issues,
      openCart: () => setIsOpen(true),
      closeCart: () => setIsOpen(false),
      clearError: () => setError(null),
      addToCart,
      addManyToCart,
      removeLine,
      updateQuantity,
      repairLine,
      count: cart?.totalQuantity ?? 0,
    }),
    [addManyToCart, addToCart, cart, error, isLoading, isOpen, issues, removeLine, repairLine, updateQuantity]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
}
