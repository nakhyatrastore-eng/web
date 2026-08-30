'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { Product, ProductVariant } from '@/lib/catalog';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';
import { useUploadThing } from '@/lib/uploadthing';
import { IconArrowRight, IconCheck } from './icons';
import ProductOptions from './ProductOptions';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 8 * 1024 * 1024;

function validateFile(file: File | null) {
  if (!file) return 'Choose an image to print.';
  if (!ALLOWED_TYPES.includes(file.type)) return 'Use a JPG, PNG, or WebP image.';
  if (file.size > MAX_FILE_SIZE) return 'The image must be smaller than 8 MB.';
  return null;
}

function isCase(product: Product) {
  return product.productType.toLowerCase().includes('case');
}

export default function CustomOrderStudio({ products }: { products: Product[] }) {
  const { addToCart } = useCart();
  const [productId, setProductId] = useState(products[0]?.id ?? '');
  const product = products.find((item) => item.id === productId) ?? products[0];
  const [variantIds, setVariantIds] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [zoom, setZoom] = useState(100);
  const [positionX, setPositionX] = useState(50);
  const [positionY, setPositionY] = useState(50);
  const [dimensions, setDimensions] = useState<{ width: number; height: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const previewRef = useRef<string | null>(null);
  const { startUpload, isUploading } = useUploadThing('artworkUploader');

  const variant: ProductVariant | null = useMemo(() => {
    if (!product) return null;
    const selected = variantIds[product.id];
    if (selected) return product.variants.find((item) => item.id === selected) ?? null;
    return product.variants.length === 1 ? product.variants[0] : null;
  }, [product, variantIds]);

  useEffect(
    () => () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    },
    []
  );

  if (!product) return null;
  const phoneCase = isCase(product);

  async function chooseFile(selected: File | null) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const validation = validateFile(selected);
    setFile(selected);
    setError(validation);
    setSuccess(false);
    setDimensions(null);
    if (!selected || validation) {
      setPreviewUrl(null);
      previewRef.current = null;
      return;
    }
    const url = URL.createObjectURL(selected);
    previewRef.current = url;
    setPreviewUrl(url);
    try {
      const bitmap = await createImageBitmap(selected);
      setDimensions({ width: bitmap.width, height: bitmap.height });
      if (bitmap.width < 1200 || bitmap.height < 1200) {
        setError('This image is low resolution. Use at least 1200 × 1200 px for a sharper print.');
      }
      bitmap.close();
    } catch {
      setError('That image could not be read. Try exporting it again as JPG or PNG.');
    }
  }

  async function addCustomOrder() {
    const validation = validateFile(file);
    if (validation || !file) {
      setError(validation ?? 'Choose an image to print.');
      return;
    }
    if (!variant) {
      setError(phoneCase ? 'Choose your exact phone model first.' : 'Choose a product option first.');
      return;
    }
    if (!variant.availableForSale) {
      setError('That selection is currently unavailable.');
      return;
    }
    setError(null);
    setSuccess(false);
    try {
      const uploadedFiles = await startUpload([file]);
      const uploaded = uploadedFiles?.[0];
      if (!uploaded?.ufsUrl) throw new Error('The artwork upload did not finish.');
      const added = await addToCart(variant, 1, [
        { key: 'Artwork URL', value: uploaded.ufsUrl },
        { key: 'Artwork file', value: file.name.slice(0, 120) },
        { key: 'Print crop', value: `zoom:${zoom}%; x:${positionX}%; y:${positionY}%` },
        ...(note.trim() ? [{ key: 'Print note', value: note.trim().slice(0, 160) }] : []),
      ]);
      if (!added) throw new Error('The custom item could not be added to the cart.');
      setSuccess(true);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : 'The artwork could not be uploaded. Please try again.');
    }
  }

  return (
    <main>
      <header className="border-b border-line bg-surface"><div className="page-shell py-12 md:py-20"><p className="eyebrow">Create your own</p><h1 className="mt-5 max-w-5xl font-display text-[clamp(3rem,8vw,7rem)] font-black uppercase leading-[.8] tracking-[-.06em] text-white">Your image, printed on metal.</h1><p className="mt-6 max-w-2xl text-base leading-relaxed text-ink-2">Choose a real Shopify product, frame your artwork, and attach the production crop directly to the order.</p></div></header>

      <div className="page-shell grid gap-8 py-10 lg:grid-cols-[1.05fr_.95fr] lg:py-16">
        <section className="lg:sticky lg:top-24 lg:self-start">
          <div className={`relative mx-auto overflow-hidden border border-accent/60 bg-surface shadow-[14px_14px_0_rgb(124_58_237_/_0.7)] ${phoneCase ? 'aspect-[9/18] max-w-[390px] rounded-[36px]' : 'aspect-[4/5] max-w-[620px]'}`}>
            {previewUrl ? (
              // Blob URLs are local browser state and cannot be optimized by next/image.
              // eslint-disable-next-line @next/next/no-img-element
              <img src={previewUrl} alt="Live crop preview of your artwork" className="h-full w-full object-cover" style={{ objectPosition: `${positionX}% ${positionY}%`, transform: `scale(${zoom / 100})` }} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center p-8 text-center"><p className="font-display text-3xl font-bold uppercase text-white">Your artwork appears here.</p><p className="mt-3 max-w-sm text-sm text-ink-3">Upload a square or portrait image, then adjust the crop without sending the file anywhere until you add it to cart.</p></div>
            )}
            {phoneCase ? <><div className="pointer-events-none absolute left-5 top-5 h-24 w-20 rounded-2xl border-4 border-black/80 bg-black/35" /><div className="pointer-events-none absolute inset-0 rounded-[34px] border-[10px] border-black/70" /></> : <div className="pointer-events-none absolute inset-3 border border-white/20" />}
          </div>
          <div className="mt-6 grid gap-4 border border-line bg-surface p-5">
            {[['Zoom', zoom, setZoom, 100, 180], ['Horizontal position', positionX, setPositionX, 0, 100], ['Vertical position', positionY, setPositionY, 0, 100]].map(([label, value, setter, min, max]) => <label key={String(label)} className="grid grid-cols-[1fr_auto] gap-3 font-mono text-[9px] uppercase tracking-widest text-ink-3"><span>{String(label)}</span><span className="text-white">{Number(value)}%</span><input type="range" min={Number(min)} max={Number(max)} value={Number(value)} onChange={(event) => (setter as React.Dispatch<React.SetStateAction<number>>)(Number(event.target.value))} className="col-span-2 accent-[#ff6600]" /></label>)}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-ink-3">The screen preview records your preferred crop; colour and final print placement are checked during production.</p>
        </section>

        <section className="border border-line bg-bg p-5 md:p-7">
          <fieldset><legend className="font-mono text-[10px] uppercase tracking-widest text-ink-3">1 · Choose what to print</legend><div className="mt-3 grid grid-cols-2 gap-2">{products.map((item) => <button key={item.id} type="button" onClick={() => { setProductId(item.id); setError(null); setSuccess(false); }} aria-pressed={item.id === product.id} className={`border px-3 py-4 text-left ${item.id === product.id ? 'border-accent bg-accent/10 text-white' : 'border-line-hi text-ink-2 hover:border-accent'}`}><span className="block font-display text-base font-bold uppercase">{item.productType || item.title}</span><span className="mt-1 block font-mono text-[9px] text-ink-3">From {formatMoney(item.price, item.currency)}</span></button>)}</div></fieldset>

          {product.variants.length > 1 ? <ProductOptions variants={product.variants} deviceModels={product.deviceModels} selectedId={variant?.id ?? null} onChange={(item) => setVariantIds((current) => ({ ...current, [product.id]: item?.id ?? '' }))} /> : null}

          <div className="mt-7"><label htmlFor="artwork" className="font-mono text-[10px] uppercase tracking-widest text-ink-3">{product.variants.length > 1 ? '3' : '2'} · Upload artwork</label><label htmlFor="artwork" className="mt-3 flex min-h-36 cursor-pointer flex-col items-center justify-center border border-dashed border-line-hi px-5 py-7 text-center hover:border-accent"><span className="font-display text-lg font-bold uppercase text-white">{file ? file.name : 'Choose an image'}</span><span className="mt-2 text-xs text-ink-3">JPG, PNG, or WebP · up to 8 MB · 1200px minimum recommended</span>{dimensions ? <span className="mt-2 font-mono text-[9px] text-verify">{dimensions.width} × {dimensions.height}px</span> : null}</label><input id="artwork" type="file" accept={ALLOWED_TYPES.join(',')} className="sr-only" onChange={(event) => chooseFile(event.target.files?.[0] ?? null)} /></div>

          <div className="mt-7"><label htmlFor="print-note" className="font-mono text-[10px] uppercase tracking-widest text-ink-3">Optional production note</label><textarea id="print-note" value={note} maxLength={160} rows={3} onChange={(event) => setNote(event.target.value)} placeholder="Example: keep the full face inside the safe area." className="mt-3 w-full resize-none border border-line-hi bg-surface px-4 py-3 text-sm text-white outline-none placeholder:text-ink-3 focus:border-accent" /><p className="mt-1 text-right font-mono text-[9px] text-ink-3">{note.length}/160</p></div>

          {error ? <p role="alert" className="mt-5 border border-urgent/50 bg-urgent/10 p-3 text-sm text-rose-200">{error}</p> : null}
          {success ? <p role="status" className="mt-5 flex items-center gap-2 border border-verify/50 bg-verify/10 p-3 text-sm text-cyan-100"><IconCheck className="h-4 w-4" />Artwork attached to your Shopify cart.</p> : null}

          <div className="mt-7 border-t border-line pt-6"><div className="mb-4 flex items-start justify-between gap-4"><div><p className="font-display text-base font-bold uppercase text-white">{product.title}</p><p className="mt-1 font-mono text-[9px] text-ink-3">{variant?.title !== 'Default Title' ? variant?.title ?? 'Choose an option' : 'Made to order'}</p></div><span className="font-mono text-xl font-bold text-white">{formatMoney(variant?.price ?? product.price, product.currency)}</span></div><button type="button" data-testid="custom-add-to-cart" onClick={addCustomOrder} disabled={isUploading || !variant?.availableForSale} className="button-primary liquid-button w-full justify-between disabled:cursor-not-allowed disabled:opacity-40"><span className="liquid-fill" aria-hidden="true" /><span className="liquid-label">{isUploading ? 'Uploading artwork…' : !variant ? 'Choose an option first' : 'Upload & add to cart'}</span><IconArrowRight className="liquid-label h-4 w-4" /></button><p className="mt-3 text-xs leading-relaxed text-ink-3">The upload URL, original filename, crop values, and note are saved as Shopify cart-line attributes for production.</p></div>
        </section>
      </div>
    </main>
  );
}
