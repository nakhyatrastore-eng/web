'use client';

import { useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import Image from 'next/image';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { redirectToCheckout } from '@/lib/checkout';
import { formatMoney } from '@/lib/format';
import type { CartIssue, DeviceModel } from '@/lib/catalog';
import { useShoppingAssistant } from './ShoppingAssistant';
import { IconArrowRight, IconMinus, IconPlus, IconX } from './icons';

const FOCUSABLE =
  'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])';

export default function CartDrawer() {
  const {
    cart,
    isOpen,
    isLoading,
    error,
    issues,
    clearError,
    closeCart,
    removeLine,
    updateQuantity,
    repairLine,
  } = useCart();
  const { openDevicePicker } = useShoppingAssistant();
  const panelRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const pointerStart = useRef<number | null>(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [repairingLineId, setRepairingLineId] = useState<string | null>(null);
  const lines = cart?.lines ?? [];
  const issuesByLine = new Map(issues.map((issue) => [issue.lineId, issue]));

  useEffect(() => {
    if (!isOpen) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeCart();
        return;
      }
      if (event.key !== 'Tab' || !panelRef.current) return;
      const focusable = Array.from(
        panelRef.current.querySelectorAll<HTMLElement>(FOCUSABLE)
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
      restoreFocusRef.current?.focus();
    };
  }, [closeCart, isOpen]);

  async function checkout() {
    if (issues.length) {
      setCheckoutError('Choose a valid phone model for every case before checkout.');
      return;
    }
    setCheckoutLoading(true);
    setCheckoutError(null);
    try {
      await redirectToCheckout(() => {
        track('Begin Checkout', {
          items: cart?.totalQuantity ?? 0,
          value: Number(cart?.cost.subtotalAmount.amount ?? 0),
          currency: cart?.cost.subtotalAmount.currencyCode ?? 'INR',
          source: 'Cart',
        });
      });
    } catch (checkoutFailure) {
      setCheckoutError(
        checkoutFailure instanceof Error
          ? checkoutFailure.message
          : 'Checkout is unavailable right now. Please try again.'
      );
      setCheckoutLoading(false);
    }
  }

  async function chooseModel(issue: CartIssue) {
    setRepairingLineId(issue.lineId);
    setCheckoutError(null);
    try {
      const response = await fetch(`/api/compatibility?variantId=${encodeURIComponent(issue.merchandiseId)}`, { cache: 'no-store' });
      const payload = (await response.json()) as { models?: DeviceModel[]; error?: string };
      if (!response.ok || !payload.models?.length) {
        throw new Error(payload.error || 'Phone compatibility could not be loaded.');
      }
      openDevicePicker(payload.models, {
        title: `Choose a phone for ${issue.productTitle}`,
        onSelect: (device) => {
          void repairLine(issue.lineId, issue.merchandiseId, [
            { key: 'Phone Brand', value: device.brand },
            { key: 'Phone Model', value: device.model },
          ]);
        },
      });
    } catch (repairError) {
      setCheckoutError(repairError instanceof Error ? repairError.message : 'Phone compatibility could not be loaded.');
    } finally {
      setRepairingLineId(null);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex justify-end"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cart-title"
    >
      <button
        type="button"
        className="absolute inset-0 h-full w-full bg-black/75 backdrop-blur-sm"
        onClick={closeCart}
        aria-label="Close cart"
      />

      <div
        ref={panelRef}
        className="drawer-enter relative flex h-full w-full max-w-[460px] flex-col border-l border-line bg-bg shadow-[-32px_0_80px_rgba(0,0,0,.45)]"
        onPointerDown={(event) => {
          if (event.pointerType === 'touch') pointerStart.current = event.clientX;
        }}
        onPointerUp={(event) => {
          if (
            event.pointerType === 'touch' &&
            pointerStart.current !== null &&
            event.clientX - pointerStart.current > 80
          ) {
            closeCart();
          }
          pointerStart.current = null;
        }}
      >
        <div className="flex items-center justify-between border-b border-line px-5 py-4">
          <div>
            <h2 id="cart-title" className="font-display text-xl font-extrabold uppercase text-white">
              Your cart
            </h2>
            <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-ink-3">
              {cart?.totalQuantity ?? 0} {(cart?.totalQuantity ?? 0) === 1 ? 'item' : 'items'}
            </p>
          </div>
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeCart}
            aria-label="Close cart"
            className="tap-target flex items-center justify-center text-ink-2 hover:text-white"
          >
            <IconX className="h-5 w-5" />
          </button>
        </div>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-start justify-center px-8">
            <p className="home-kicker">Your cart is empty</p>
            <p className="mt-2 font-display text-4xl font-black leading-none tracking-[-.05em] text-white">
              Start with a design.
            </p>
            <div className="mt-7 flex flex-wrap gap-2">
              <Link href="/collections/phone-cases" onClick={closeCart} className="button-primary">Phone cases</Link>
              <Link href="/collections/poster-wall" onClick={closeCart} className="button-ghost">Metal posters</Link>
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-2">
              <ul>
                {lines.map((line) => {
                  const image = line.merchandise.image ?? line.merchandise.product.featuredImage;
                  const isPhoneCase = line.merchandise.product.productType.toLowerCase().includes('case');
                  const hasPhoneModel = line.attributes.some((item) => item.key === 'Phone Model' && item.value.trim());
                  const hasPhoneBrand = line.attributes.some((item) => item.key === 'Phone Brand' && item.value.trim());
                  const lineIssue = issuesByLine.get(line.id);
                  return (
                    <li key={line.id} className="grid grid-cols-[88px_1fr] gap-4 border-b border-line py-5">
                      <Link
                        href={`/products/${line.merchandise.product.handle}`}
                        onClick={closeCart}
                        className="relative aspect-[4/5] overflow-hidden bg-surface"
                      >
                        {image ? (
                          <Image
                            src={image.url}
                            alt={image.altText ?? line.merchandise.product.title}
                            fill
                            sizes="88px"
                            className="object-cover"
                          />
                        ) : null}
                      </Link>
                      <div className="min-w-0">
                        <Link
                          href={`/products/${line.merchandise.product.handle}`}
                          onClick={closeCart}
                          className="font-display text-base font-bold uppercase leading-tight text-white hover:text-accent"
                        >
                          {line.merchandise.product.title}
                        </Link>
                        {line.merchandise.title !== 'Default Title' ? (
                          <p className="mt-1 font-mono text-[10px] text-ink-3">
                            {line.merchandise.title}
                          </p>
                        ) : null}
                        {line.attributes
                          .filter(
                            (item) =>
                              !item.key.startsWith('_') && item.key !== 'Artwork URL'
                          )
                          .map((item) => (
                            <p key={item.key} className="mt-1 font-mono text-[10px] text-ink-2">
                              <span className="text-ink-3">{item.key}:</span> {item.value}
                            </p>
                          ))}
                        {line.attributes.some((item) => item.key === 'Artwork URL') ? (
                          <p className="mt-2 font-mono text-[9px] uppercase tracking-wider text-verify">
                            Custom artwork attached
                          </p>
                        ) : null}
                        {isPhoneCase && (lineIssue || !hasPhoneModel || !hasPhoneBrand) ? (
                          <div role="alert" className="mt-2 rounded-xl border border-urgent/50 bg-urgent/10 p-3 text-xs text-rose-200">
                            <p>{lineIssue?.message ?? 'Choose the exact phone model for this case before checkout.'}</p>
                            <button type="button" onClick={() => chooseModel(lineIssue ?? { lineId: line.id, merchandiseId: line.merchandise.id, productTitle: line.merchandise.product.title, message: '' })} disabled={repairingLineId === line.id || isLoading} className="mt-2 rounded-full border border-rose-200/40 px-3 text-[11px] font-bold text-white hover:border-white disabled:opacity-40">
                              {repairingLineId === line.id ? 'Loading models…' : 'Choose model'}
                            </button>
                          </div>
                        ) : null}
                        <p className="mt-3 font-mono text-sm font-bold text-white">
                          {formatMoney(line.cost.totalAmount)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-4">
                          <div className="flex items-center border border-line-hi">
                            <button
                              type="button"
                              onClick={() => updateQuantity(line.id, line.quantity - 1)}
                              disabled={isLoading}
                              aria-label={`Decrease quantity of ${line.merchandise.product.title}`}
                              className="tap-compact flex h-9 w-9 items-center justify-center text-ink-2 hover:text-white disabled:opacity-40"
                            >
                              <IconMinus className="h-3 w-3" />
                            </button>
                            <span className="w-8 text-center font-mono text-xs text-white">
                              {line.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => updateQuantity(line.id, line.quantity + 1)}
                              disabled={isLoading || line.quantity >= 20}
                              aria-label={`Increase quantity of ${line.merchandise.product.title}`}
                              className="tap-compact flex h-9 w-9 items-center justify-center text-ink-2 hover:text-white disabled:opacity-40"
                            >
                              <IconPlus className="h-3 w-3" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeLine(line.id)}
                            disabled={isLoading}
                            className="font-mono text-[10px] uppercase tracking-widest text-ink-3 hover:text-urgent disabled:opacity-40"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>

            </div>

            <div className="border-t border-line bg-surface p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]">
              <div className="mb-4 flex items-center justify-between">
                <span className="font-mono text-xs uppercase tracking-widest text-ink-2">Subtotal</span>
                <span className="font-mono text-xl font-bold tabular-nums text-white">
                  {cart ? formatMoney(cart.cost.subtotalAmount) : '—'}
                </span>
              </div>
              <p className="mb-4 text-xs text-ink-3">Shipping charges and available payment methods are confirmed at checkout.</p>
              {error || checkoutError ? (
                <div role="alert" className="mb-4 border border-urgent/50 bg-urgent/10 p-3 text-sm text-rose-200">
                  <span>{checkoutError ?? error}</span>
                  {error ? (
                    <button type="button" onClick={clearError} className="ml-2 underline">
                      Dismiss
                    </button>
                  ) : null}
                </div>
              ) : null}
              <button
                type="button"
                disabled={checkoutLoading || isLoading || issues.length > 0}
                onClick={checkout}
                className="button-primary liquid-button w-full justify-between"
              >
                <span className="liquid-fill" aria-hidden="true" />
                <span className="liquid-label">
                  {checkoutLoading ? 'Opening secure checkout…' : issues.length ? 'Choose phone model first' : 'Checkout securely'}
                </span>
                <IconArrowRight className="liquid-label h-4 w-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
