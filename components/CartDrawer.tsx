'use client';

import { useState } from 'react';
import { useCart } from '@/lib/cart-context';
import { createCheckout } from '@/lib/shopify';

export default function CartDrawer() {
  const { lines, isOpen, closeCart, updateQuantity, subtotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCheckout() {
    setLoading(true);
    setError(null);
    try {
      const url = await createCheckout(
        lines.map((l) => ({
          merchandiseId: l.variantId,
          quantity: l.quantity,
          attributes: l.customImageUrl ? [{ key: 'Custom Design', value: l.customImageUrl }] : undefined,
        }))
      );
      window.location.href = url; // hand off to Shopify's hosted checkout (Razorpay runs there)
    } catch (e: any) {
      setError(e.message ?? 'Could not start checkout.');
      setLoading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/60" onClick={closeCart} />
      <div className="relative w-full max-w-md bg-bg border-l border-border h-full flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-border">
          <span className="eyebrow">Your Cart</span>
          <button onClick={closeCart} className="text-ink2 hover:text-ink text-xl leading-none">×</button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6">
          {lines.length === 0 && <p className="text-ink2 text-sm">Your cart is empty.</p>}
          {lines.map((line) => (
            <div key={line.lineKey} className="flex gap-4">
              <div className="w-20 h-24 bg-bg2 border border-border flex-shrink-0 overflow-hidden">
                {line.customImageUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={line.customImageUrl} alt="Custom design" className="w-full h-full object-cover" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm">{line.product.title}</p>
                <p className="text-ink3 text-xs mt-1">{line.variant.title}</p>
                {line.customImageUrl && <p className="text-accent text-xs mt-1">Custom design</p>}
                <div className="flex items-center gap-3 mt-2">
                  <button
                    className="w-6 h-6 border border-border hover:border-accent"
                    onClick={() => updateQuantity(line.lineKey, line.quantity - 1)}
                  >
                    −
                  </button>
                  <span className="font-mono text-sm">{line.quantity}</span>
                  <button
                    className="w-6 h-6 border border-border hover:border-accent"
                    onClick={() => updateQuantity(line.lineKey, line.quantity + 1)}
                  >
                    +
                  </button>
                </div>
              </div>
              <div className="font-mono text-sm">
                ₹{(parseFloat(line.variant.price.amount) * line.quantity).toFixed(0)}
              </div>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border">
          <div className="flex justify-between font-mono text-sm mb-4">
            <span className="text-ink2">Subtotal</span>
            <span>₹{subtotal.toFixed(0)}</span>
          </div>
          {error && <p className="text-accent text-xs mb-3">{error}</p>}
          <button
            disabled={lines.length === 0 || loading}
            onClick={handleCheckout}
            className="w-full bg-accent hover:bg-accent-h disabled:opacity-40 disabled:cursor-not-allowed text-ink py-3 kicker tracking-widest"
          >
            {loading ? 'Redirecting…' : 'Checkout'}
          </button>
        </div>
      </div>
    </div>
  );
}
