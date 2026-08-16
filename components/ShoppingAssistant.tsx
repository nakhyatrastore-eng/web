'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { track } from '@vercel/analytics';
import type { DeviceModel, ProductCardData, ProductVariant } from '@/lib/catalog';
import { useCart } from '@/lib/cart-context';
import { formatMoney } from '@/lib/format';
import DevicePicker from './DevicePicker';
import { IconArrowRight, IconCheck, IconX } from './icons';

const DEVICE_STORAGE_KEY = 'nakhyatra-device:v3';
const FOCUSABLE =
  'a[href], button:not([disabled]), input, select, [tabindex]:not([tabindex="-1"])';

type DeviceRequest = {
  kind: 'device';
  models: DeviceModel[];
  title: string;
  onSelect?: (device: DeviceModel) => void;
};

type QuickAddRequest = {
  kind: 'quick-add';
  product: ProductCardData;
};

type SheetRequest = DeviceRequest | QuickAddRequest;

type ShoppingAssistantValue = {
  savedDevice: DeviceModel | null;
  getCompatibleDevice: (models: DeviceModel[]) => DeviceModel | null;
  openDevicePicker: (
    models: DeviceModel[],
    options?: { title?: string; onSelect?: (device: DeviceModel) => void }
  ) => void;
  openQuickAdd: (product: ProductCardData) => void;
};

const ShoppingAssistantContext = createContext<ShoppingAssistantValue | null>(null);

function activeModels(models: DeviceModel[]) {
  return models.filter((model) => model.active);
}

function isPhoneCase(product: ProductCardData) {
  return product.productType.toLowerCase().includes('case');
}

export function ShoppingAssistantProvider({ children }: { children: React.ReactNode }) {
  const { addToCart, isLoading } = useCart();
  const [savedDevice, setSavedDevice] = useState<DeviceModel | null>(null);
  const [sheet, setSheet] = useState<SheetRequest | null>(null);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [quickModels, setQuickModels] = useState<DeviceModel[]>([]);
  const [compatibilityLoading, setCompatibilityLoading] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const restoreFocusRef = useRef<HTMLElement | null>(null);
  const compatibilityRequestRef = useRef(0);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      try {
        const stored = window.localStorage.getItem(DEVICE_STORAGE_KEY);
        if (stored) setSavedDevice(JSON.parse(stored) as DeviceModel);
      } catch {
        window.localStorage.removeItem(DEVICE_STORAGE_KEY);
      }
    });
    return () => window.cancelAnimationFrame(frame);
  }, []);

  const rememberDevice = useCallback((device: DeviceModel) => {
    setSavedDevice(device);
    window.localStorage.setItem(DEVICE_STORAGE_KEY, JSON.stringify(device));
  }, []);

  const forgetDevice = useCallback(() => {
    setSavedDevice(null);
    window.localStorage.removeItem(DEVICE_STORAGE_KEY);
  }, []);

  const getCompatibleDevice = useCallback(
    (models: DeviceModel[]) => {
      if (!savedDevice) return null;
      return activeModels(models).find(
        (model) =>
          model.handle === savedDevice.handle ||
          (model.brand === savedDevice.brand && model.model === savedDevice.model)
      ) ?? null;
    },
    [savedDevice]
  );

  const openDevicePicker = useCallback(
    (
      models: DeviceModel[],
      options?: { title?: string; onSelect?: (device: DeviceModel) => void }
    ) => {
      setSheetError(null);
      setSheet({
        kind: 'device',
        models: activeModels(models),
        title: options?.title ?? 'Choose your phone',
        onSelect: options?.onSelect,
      });
    },
    []
  );

  const openQuickAdd = useCallback((product: ProductCardData) => {
    const available = product.variants.filter((variant) => variant.availableForSale);
    const localModels = activeModels(product.deviceModels);
    setSelectedVariantId(available.length === 1 ? available[0].id : null);
    setQuickModels(localModels);
    setCompatibilityLoading(false);
    setSheetError(null);
    setSheet({ kind: 'quick-add', product });

    if (!isPhoneCase(product) || localModels.length || !available[0]) return;
    const requestId = ++compatibilityRequestRef.current;
    setCompatibilityLoading(true);
    void fetch(`/api/compatibility?variantId=${encodeURIComponent(available[0].id)}`)
      .then(async (response) => {
        const payload = await response.json() as { models?: DeviceModel[]; error?: string };
        if (!response.ok) throw new Error(payload.error ?? 'Compatibility could not be loaded.');
        return activeModels(payload.models ?? []);
      })
      .then((models) => {
        if (compatibilityRequestRef.current !== requestId) return;
        setQuickModels(models);
        setCompatibilityLoading(false);
      })
      .catch((error: unknown) => {
        if (compatibilityRequestRef.current !== requestId) return;
        setCompatibilityLoading(false);
        setSheetError(error instanceof Error ? error.message : 'Compatibility could not be loaded.');
      });
  }, []);

  const closeSheet = useCallback(() => {
    compatibilityRequestRef.current += 1;
    setSheet(null);
    setCompatibilityLoading(false);
    setSheetError(null);
  }, []);

  useEffect(() => {
    if (!sheet) return;
    restoreFocusRef.current = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeRef.current?.focus();

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        closeSheet();
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
  }, [closeSheet, sheet]);

  const quickProduct = sheet?.kind === 'quick-add' ? sheet.product : null;
  const quickDevice = quickProduct ? getCompatibleDevice(quickModels) : null;
  const selectedVariant: ProductVariant | null = quickProduct && selectedVariantId
    ? quickProduct.variants.find((variant) => variant.id === selectedVariantId) ?? null
    : null;

  async function addQuickProduct() {
    if (!quickProduct) return;
    const phoneCase = isPhoneCase(quickProduct);
    const variant = selectedVariant ?? (
      phoneCase
        ? quickProduct.variants.find((item) => item.availableForSale) ?? null
        : null
    );
    if (phoneCase && !quickDevice) {
      setSheetError('Choose your exact phone model first.');
      return;
    }
    if (!variant?.availableForSale) {
      setSheetError('Choose an available option first.');
      return;
    }
    const attributes = quickDevice
      ? [
          { key: 'Phone Brand', value: quickDevice.brand },
          { key: 'Phone Model', value: quickDevice.model },
        ]
      : [];
    const added = await addToCart(variant, 1, attributes);
    if (added) {
      track('Quick Add', {
        product: quickProduct.handle,
        category: phoneCase ? 'Phone Case' : 'Metal Wall Print',
      });
      closeSheet();
    } else {
      setSheetError('This item could not be added. Please try again.');
    }
  }

  const value = useMemo<ShoppingAssistantValue>(
    () => ({ savedDevice, getCompatibleDevice, openDevicePicker, openQuickAdd }),
    [getCompatibleDevice, openDevicePicker, openQuickAdd, savedDevice]
  );

  return (
    <ShoppingAssistantContext.Provider value={value}>
      {children}
      {sheet ? (
        <div className="fixed inset-0 z-[95] flex items-end justify-center md:items-center" role="dialog" aria-modal="true" aria-labelledby="shopping-sheet-title">
          <button type="button" aria-label="Close chooser" onClick={closeSheet} className="absolute inset-0 h-full w-full bg-black/80 backdrop-blur-sm" />
          <div ref={panelRef} data-testid="shopping-sheet" className="sheet-enter relative max-h-[88svh] w-full overflow-y-auto rounded-t-[2rem] border border-line bg-bg px-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] pt-5 shadow-2xl md:max-w-xl md:rounded-[2rem] md:p-7">
            <div className="flex items-start justify-between gap-5">
              <div>
                <p className="home-kicker">{sheet.kind === 'quick-add' ? 'Quick add' : 'Saved fit'}</p>
                <h2 id="shopping-sheet-title" className="mt-2 font-display text-3xl font-black leading-none tracking-[-.045em] text-white">
                  {sheet.kind === 'quick-add' ? sheet.product.title : sheet.title}
                </h2>
              </div>
              <button ref={closeRef} type="button" onClick={closeSheet} aria-label="Close chooser" className="tap-target flex shrink-0 items-center justify-center rounded-full border border-line-hi text-ink-2 hover:border-white hover:text-white">
                <IconX className="h-5 w-5" />
              </button>
            </div>

            {sheet.kind === 'device' ? (
              <DevicePicker
                models={sheet.models}
                selectedHandle={getCompatibleDevice(sheet.models)?.handle ?? null}
                onChange={(device) => {
                  if (!device) return;
                  rememberDevice(device);
                  sheet.onSelect?.(device);
                  closeSheet();
                }}
              />
            ) : isPhoneCase(sheet.product) ? (
              <>
                {compatibilityLoading ? (
                  <div className="mt-7 rounded-2xl border border-line bg-surface p-5 text-sm text-ink-2" role="status">
                    Checking compatible phone models…
                  </div>
                ) : quickDevice ? (
                  <div className="mt-6 flex items-center justify-between gap-4 rounded-2xl border border-accent/45 bg-accent/10 p-4">
                    <div>
                      <p className="inline-flex items-center gap-1 text-xs font-bold text-stock"><IconCheck className="h-4 w-4" /> My phone</p>
                      <p className="mt-1 font-display text-lg font-bold text-white">{quickDevice.model}</p>
                    </div>
                    <button type="button" onClick={forgetDevice} className="rounded-full border border-line-hi px-4 text-xs font-bold text-white hover:border-accent">Change</button>
                  </div>
                ) : (
                  <DevicePicker
                    models={quickModels}
                    selectedHandle={null}
                    onChange={(device) => {
                      if (!device) return;
                      rememberDevice(device);
                      setSheetError(null);
                    }}
                  />
                )}
              </>
            ) : (
              <fieldset className="mt-7">
                <legend className="text-sm font-bold text-white">Choose size</legend>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  {sheet.product.variants.filter((variant) => variant.availableForSale).map((variant) => (
                    <button key={variant.id} type="button" onClick={() => { setSelectedVariantId(variant.id); setSheetError(null); }} aria-pressed={selectedVariantId === variant.id} className={`rounded-2xl border p-4 text-left ${selectedVariantId === variant.id ? 'border-accent bg-accent/10 text-white' : 'border-line-hi text-ink-2 hover:border-white'}`}>
                      <span className="block text-sm font-bold">{variant.title}</span>
                      <span className="mt-1 block font-mono text-xs">{formatMoney(variant.price)}</span>
                    </button>
                  ))}
                </div>
              </fieldset>
            )}

            {sheet.kind === 'quick-add' ? (
              <button type="button" onClick={addQuickProduct} disabled={isLoading || compatibilityLoading || !sheet.product.availableForSale} className="button-primary liquid-button mt-6 w-full justify-between disabled:opacity-40">
                <span className="liquid-fill" aria-hidden="true" />
                <span className="liquid-label">{isLoading ? 'Adding…' : compatibilityLoading ? 'Checking fit…' : selectedVariant ? `Add — ${formatMoney(selectedVariant.price)}` : isPhoneCase(sheet.product) && quickDevice ? `Add for ${quickDevice.model}` : isPhoneCase(sheet.product) ? 'Choose phone model' : 'Choose size'}</span>
                <IconArrowRight className="liquid-label h-4 w-4" />
              </button>
            ) : null}
            {sheetError ? <p role="alert" className="mt-4 rounded-xl border border-urgent/50 bg-urgent/10 p-3 text-sm text-rose-200">{sheetError}</p> : null}
          </div>
        </div>
      ) : null}
    </ShoppingAssistantContext.Provider>
  );
}

export function useShoppingAssistant() {
  const context = useContext(ShoppingAssistantContext);
  if (!context) throw new Error('useShoppingAssistant must be used within ShoppingAssistantProvider');
  return context;
}
