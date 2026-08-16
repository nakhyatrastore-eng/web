'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { track } from '@vercel/analytics';
import Link from 'next/link';
import { useCart } from '@/lib/cart-context';
import { redirectToCheckout } from '@/lib/checkout';
import type { Product, ProductCardData, ProductVariant } from '@/lib/catalog';
import { formatMoney } from '@/lib/format';
import { IconArrowRight, IconMinus, IconPlus } from './icons';
import ProductCard from './ProductCard';
import ProductMediaGallery from './ProductMediaGallery';
import ProductOptions from './ProductOptions';
import RecentlyViewed from './RecentlyViewed';
import { useShoppingAssistant } from './ShoppingAssistant';

function detailRows(product: Product, isPhoneCase: boolean) {
  return [
    {
      title: 'Description',
      body:
        product.description ||
        `A distinctive ${product.productType || (isPhoneCase ? 'phone case' : 'metal wall print')} selected for the Nakhyatra catalogue.`,
    },
    {
      title: isPhoneCase ? 'Phone compatibility' : 'Size & finish',
      body: isPhoneCase
        ? 'Choose the exact model shown in your phone settings. The case is made for that selection.'
        : 'Choose the size shown above. The option selected here is the size sent for fulfilment.',
    },
    {
      title: 'Materials',
      body: isPhoneCase
        ? 'The design is printed onto a glass-finish artwork panel with a protective bumper. Cut-outs follow the exact model selected before checkout.'
        : 'The artwork is produced on a rigid metal print surface. Check the product description and images for the finish and mounting supplied with this design.',
    },
    {
      title: 'Delivery',
      body: isPhoneCase
        ? 'After checkout, this design is printed for the selected phone through our production partner. Processing normally takes 3–6 business days before dispatch.'
        : 'After checkout, the selected artwork and size are prepared through our production partner. Processing normally takes 4–7 business days before dispatch.',
    },
    {
      title: 'Returns & replacements',
      body: 'Report a print defect, transit damage, or a wrong item within 7 days of delivery. Products made for a selected model or size cannot be returned for a change of mind.',
    },
    {
      title: 'Product & seller information',
      body: isPhoneCase
        ? 'Generic name: printed phone case. Net quantity: 1 unit. Marketed by Nakhyatra Store, Nakhyatra Office, Flat No. 1, Bongara, Guwahati, Kamrup Metro, Assam 781015. Customer care: nakhyatrastore@gmail.com, +91 93953 34322. The manufacturer or packer and country of origin for the compatible blank are printed on the product packaging; contact us before ordering if you need the current batch details.'
        : 'Generic name: aluminium metal wall print. Net quantity: 1 unit. Available sizes: 20.3 × 30.5 cm (8 × 12 in) and 30.5 × 40.6 cm (12 × 16 in). Artwork by Everanta, offered by Nakhyatra with permission. Marketed by Nakhyatra Store, Nakhyatra Office, Flat No. 1, Bongara, Guwahati, Kamrup Metro, Assam 781015. Customer care: nakhyatrastore@gmail.com, +91 93953 34322. Manufacturer or packer and country of origin are shown on the product packaging.',
    },
  ];
}

export default function ProductDetail({
  product,
  related,
}: {
  product: Product;
  related: ProductCardData[];
}) {
  const { addToCart, isLoading } = useCart();
  const { getCompatibleDevice, openDevicePicker, openQuickAdd } = useShoppingAssistant();
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(() => {
    const available = product.variants.filter((variant) => variant.availableForSale);
    return product.variants.length === 1 || available.length === 1 ? available[0]?.id ?? product.variants[0]?.id ?? null : null;
  });
  const [quantity, setQuantity] = useState(1);
  const [action, setAction] = useState<'cart' | 'buy' | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDock, setShowDock] = useState(false);
  const buyBoxRef = useRef<HTMLDivElement>(null);
  const variant: ProductVariant | null = selectedVariantId
    ? product.variants.find((item) => item.id === selectedVariantId) ?? null
    : null;
  const isPhoneCase = product.productType.toLowerCase().includes('case');
  const selectedDevice = isPhoneCase ? getCompatibleDevice(product.deviceModels) : null;
  const currentPrice = variant?.price ?? {
    amount: String(product.price),
    currencyCode: product.currency,
  };
  const hasDeviceInventory = !isPhoneCase || product.deviceModels.length > 0;
  const canBuy =
    Boolean(variant?.availableForSale) &&
    product.availableForSale &&
    hasDeviceInventory &&
    (!isPhoneCase || Boolean(selectedDevice));

  const chooseDevice = useCallback(() => {
    openDevicePicker(product.deviceModels, {
      title: selectedDevice ? 'Change your phone' : 'Choose your phone',
      onSelect: (model) => {
        setError(null);
        track('Phone Model Selected', {
          product: product.handle,
          platform: model.platform,
          brand: model.brand,
        });
      },
    });
  }, [openDevicePicker, product.deviceModels, product.handle, selectedDevice]);

  useEffect(() => {
    track('View Product', {
      product: product.handle,
      category: isPhoneCase ? 'Phone Case' : 'Metal Wall Print',
    });
  }, [isPhoneCase, product.handle]);

  useEffect(() => {
    if (!buyBoxRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowDock(!entry.isIntersecting),
      { threshold: 0.05 }
    );
    observer.observe(buyBoxRef.current);
    return () => observer.disconnect();
  }, []);

  async function handleAdd(buyNow = false) {
    if (isPhoneCase && !hasDeviceInventory) {
      setError('Compatibility inventory is not configured for this case yet.');
      return;
    }
    if (isPhoneCase && !selectedDevice) {
      setError('Choose your exact phone model first.');
      return;
    }
    if (!variant) {
      setError('Choose an available product option first.');
      return;
    }
    if (!variant.availableForSale) {
      setError('That selection is currently unavailable.');
      return;
    }
    setAction(buyNow ? 'buy' : 'cart');
    setError(null);
    const attributes = selectedDevice
      ? [
          { key: 'Phone Brand', value: selectedDevice.brand },
          { key: 'Phone Model', value: selectedDevice.model },
        ]
      : [];
    const added = await addToCart(variant, quantity, attributes);
    if (added) {
      track('Add to Cart', {
        product: product.handle,
        category: isPhoneCase ? 'Phone Case' : 'Metal Poster',
        quantity,
      });
    }
    if (added && buyNow) {
      try {
        await redirectToCheckout(() => {
          track('Begin Checkout', {
            items: quantity,
            value: Number(currentPrice.amount) * quantity,
            currency: currentPrice.currencyCode,
            source: 'Buy Now',
          });
        });
        return;
      } catch (checkoutError) {
        setError(checkoutError instanceof Error ? checkoutError.message : 'Checkout is unavailable right now.');
      }
    } else if (!added) {
      setError('The item could not be added. Check its availability and try again.');
    }
    setAction(null);
  }

  function handleDockAction() {
    if (isPhoneCase && !selectedDevice) {
      chooseDevice();
      return;
    }
    if (!variant) {
      openQuickAdd(product);
      return;
    }
    void handleAdd(false);
  }

  function handlePrimaryAction() {
    if (isPhoneCase && !selectedDevice) {
      chooseDevice();
      return;
    }
    if (!variant) {
      openQuickAdd(product);
      return;
    }
    void handleAdd(false);
  }

  return (
    <main>
      <div className="page-shell py-5 md:py-12">
        <nav aria-label="Breadcrumb" className="mb-5 hidden flex-wrap items-center gap-2 text-xs text-ink-3 md:flex">
          <Link href="/" className="hover:text-white">Home</Link><span>/</span><Link href={isPhoneCase ? '/collections/phone-cases' : '/collections/poster-wall'} className="hover:text-white">{isPhoneCase ? 'Phone cases' : 'Metal wall prints'}</Link><span>/</span><span className="text-ink-2">{product.title}</span>
        </nav>

        <div className="grid items-start gap-7 lg:grid-cols-12 lg:gap-14">
          <section className="lg:col-span-7" aria-label="Product media">
            <ProductMediaGallery product={product} />
          </section>

          <section className="lg:sticky lg:top-24 lg:col-span-5">
            <div ref={buyBoxRef} className="py-1 lg:py-3">
              <p className="home-kicker">{product.productType || 'Phone case'}</p>
              <h1 className="mt-3 font-display text-[clamp(2.7rem,5vw,4.8rem)] font-black leading-[.9] tracking-[-.055em] text-white">{product.title}</h1>
              <div className="mt-5 flex flex-wrap items-center gap-x-4 gap-y-2">
                <span className="font-mono text-2xl font-bold tabular-nums text-white">{formatMoney(currentPrice)}</span>
                {variant?.compareAtPrice && Number(variant.compareAtPrice.amount) > Number(variant.price.amount) ? <span className="inline-flex items-center gap-2 text-xs text-ink-3"><span>MRP</span><s className="font-mono text-sm">{formatMoney(variant.compareAtPrice)}</s></span> : null}
                {product.rating ? <a href="#reviews" className="ml-auto font-mono text-[10px] text-ink-2 hover:text-white"><span className="text-rating">★ {product.rating.value.toFixed(1)}</span> · {product.rating.count} reviews</a> : null}
              </div>
              <p className="mt-2 text-xs text-ink-3">Selling price includes applicable taxes. Shipping, if any, is confirmed at checkout.</p>

              {!isPhoneCase ? <p className="mt-4 rounded-xl border border-accent/35 bg-accent/10 p-3 text-xs font-semibold text-white">Artwork by {product.vendor || 'Everanta'} · Offered by Nakhyatra with permission</p> : null}

              {isPhoneCase && product.deviceModels.length ? (
                <button type="button" data-testid="device-picker" onClick={chooseDevice} className="mt-7 flex min-h-[72px] w-full items-center justify-between gap-4 rounded-2xl border border-line-hi bg-surface p-4 text-left hover:border-accent">
                  <span><span className="block text-xs font-bold uppercase tracking-wider text-accent">My phone</span><span className="mt-1 block text-base font-bold text-white">{selectedDevice?.model ?? 'Choose exact model'}</span></span>
                  <span className="text-xs font-bold text-ink-2">{selectedDevice ? 'Change' : 'Select'} →</span>
                </button>
              ) : null}

              {isPhoneCase && !product.deviceModels.length ? (
                <p role="alert" className="mt-7 border border-urgent/50 bg-urgent/10 p-3 text-sm text-rose-200">
                  This case is not connected to sellable blank-case inventory yet.
                </p>
              ) : null}

              {product.variants.length > 1 ? <ProductOptions variants={product.variants} selectedId={selectedVariantId} onChange={(item) => { setSelectedVariantId(item?.id ?? null); setError(null); }} /> : null}

              <div className="mt-6 grid gap-2 rounded-2xl border border-line bg-surface p-4 text-xs text-ink-2">
                <p><strong className="text-white">Made for your selection.</strong> {isPhoneCase ? selectedDevice ? `This order will be prepared for ${selectedDevice.model}.` : 'Choose the exact phone model before adding to cart.' : variant ? `This order will be prepared in ${variant.title}.` : 'Choose a size before adding to cart.'}</p>
                <p>Typical processing: {isPhoneCase ? '3–6' : '4–7'} business days. Transit follows after dispatch.</p>
                <p>Damage, print defect, or wrong item? <Link href="/policies/returns" className="font-semibold text-white underline underline-offset-4">Contact us within 7 days.</Link></p>
              </div>

              <div className="mt-6 grid grid-cols-[104px_1fr] gap-3">
                <div className="flex items-center rounded-full border border-line-hi">
                  <button type="button" onClick={() => setQuantity((value) => Math.max(1, value - 1))} aria-label="Decrease quantity" className="flex h-full flex-1 items-center justify-center text-ink-2 hover:text-white"><IconMinus className="h-3 w-3" /></button>
                  <span className="w-8 text-center font-mono text-xs text-white">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((value) => Math.min(20, value + 1))} aria-label="Increase quantity" className="flex h-full flex-1 items-center justify-center text-ink-2 hover:text-white"><IconPlus className="h-3 w-3" /></button>
                </div>
                <button type="button" data-testid="add-to-cart" onClick={handlePrimaryAction} disabled={isLoading || !product.availableForSale || !hasDeviceInventory} className="button-primary liquid-button w-full justify-between disabled:cursor-not-allowed disabled:opacity-40">
                  <span className="liquid-fill" aria-hidden="true" />
                  <span className="liquid-label">{action === 'cart' ? 'Adding…' : isPhoneCase && !selectedDevice ? 'Choose your phone model' : !variant ? 'Choose an option' : canBuy ? `Add to cart — ${formatMoney(Number(currentPrice.amount) * quantity, currentPrice.currencyCode)}` : 'Unavailable'}</span>
                  <IconArrowRight className="liquid-label h-4 w-4" />
                </button>
              </div>
              <button type="button" onClick={() => handleAdd(true)} disabled={!canBuy || isLoading} className="button-ghost mt-3 w-full disabled:cursor-not-allowed disabled:opacity-40">{action === 'buy' ? 'Opening checkout…' : 'Buy now'}</button>
              {error ? <p role="alert" className="mt-4 border border-urgent/50 bg-urgent/10 p-3 text-sm text-rose-200">{error}</p> : null}
            </div>
          </section>
        </div>
      </div>

      <section className="section-space" data-reveal>
        <div className="page-shell grid gap-8 lg:grid-cols-[.75fr_1.25fr]">
          <div><p className="home-kicker">Product details</p><h2 className="mt-3 font-display text-4xl font-black tracking-[-.05em] text-white md:text-5xl">Before you order.</h2></div>
          <div className="border-t border-line">{detailRows(product, isPhoneCase).map((row) => <details key={row.title} className="group border-b border-line"><summary className="flex cursor-pointer list-none items-center justify-between py-5 text-base font-bold text-white"><span>{row.title}</span><span className="text-xl text-accent transition-transform group-open:rotate-45">+</span></summary><p className="max-w-3xl pb-6 text-sm leading-relaxed text-ink-2 md:text-base">{row.body}</p></details>)}</div>
        </div>
      </section>

      {product.rating ? <section id="reviews" className="section-space bg-surface" data-reveal><div className="page-shell"><p className="home-kicker">Customer rating</p><p className="mt-3 text-4xl font-black text-rating">★ {product.rating.value.toFixed(1)}</p><p className="mt-2 text-sm text-ink-2">{product.rating.count} customer {product.rating.count === 1 ? 'review' : 'reviews'}</p></div></section> : null}

      {related.length ? <section className="section-space" data-reveal><div className="page-shell"><p className="home-kicker">More designs</p><h2 className="mt-3 font-display text-4xl font-black tracking-[-.05em] text-white md:text-5xl">You may also like.</h2><div className="-mx-[var(--pad)] mt-7 flex snap-x gap-3 overflow-x-auto px-[var(--pad)] pb-3 scrollbar-none md:mx-0 md:grid md:grid-cols-4 md:px-0">{related.slice(0, 4).map((item) => <div key={item.id} className="w-[72vw] shrink-0 snap-start md:w-auto"><ProductCard product={item} /></div>)}</div></div></section> : null}

      <RecentlyViewed current={{ handle: product.handle, title: product.title, price: formatMoney(currentPrice), image: product.images[0] ?? null }} />

      {showDock ? (
        <div className="fixed bottom-[68px] left-0 right-0 z-[64] border-t border-accent/40 bg-bg/95 px-3 py-2 backdrop-blur-2xl md:hidden">
          <div className="grid grid-cols-[1fr_auto] items-center gap-3"><div className="min-w-0"><p className="truncate font-mono text-[9px] uppercase tracking-widest text-ink-3">{selectedDevice?.model ?? variant?.title ?? (isPhoneCase ? 'Phone model required' : 'Size required')}</p><p className="mt-1 font-mono text-sm font-bold text-white">{formatMoney(currentPrice)}</p></div><button type="button" onClick={handleDockAction} disabled={isLoading || !product.availableForSale || !hasDeviceInventory} className="button-primary liquid-button !min-h-12 px-4 disabled:opacity-40"><span className="liquid-fill" aria-hidden="true" /><span className="liquid-label">{isPhoneCase && !selectedDevice ? 'Choose model' : !variant ? 'Choose size' : 'Add to cart'}</span></button></div>
        </div>
      ) : null}
    </main>
  );
}
