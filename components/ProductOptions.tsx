'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { DeviceModel, ProductVariant } from '@/lib/catalog';
import { useShoppingAssistant } from './ShoppingAssistant';
import PhoneModelChooser from './PhoneModelChooser';

function unique(values: string[]) {
  return Array.from(new Set(values));
}

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

export default function ProductOptions({
  variants,
  deviceModels,
  selectedId,
  onChange,
}: {
  variants: ProductVariant[];
  deviceModels: DeviceModel[];
  selectedId: string | null;
  onChange: (variant: ProductVariant | null) => void;
}) {
  const { savedDevice, rememberDevice } = useShoppingAssistant();
  const deviceOption = useMemo(() => {
    const names = unique(variants.flatMap((variant) => variant.selectedOptions.map((option) => option.name)));
    return names.find((name) => /device|phone|model/i.test(name));
  }, [variants]);
  const selectedVariant = variants.find((variant) => variant.id === selectedId) ?? null;
  const [selections, setSelections] = useState<Record<string, string>>({});

  const optionNames = useMemo(
    () => unique(variants.flatMap((variant) => variant.selectedOptions.map((option) => option.name))),
    [variants]
  );

  // Option value that corresponds to a metaobject model (names may differ in case/spacing).
  const optionValueForModel = useMemo(() => {
    if (!deviceOption) return () => null;
    const values = unique(
      variants.flatMap((variant) =>
        variant.selectedOptions.filter((option) => option.name === deviceOption).map((option) => option.value)
      )
    );
    return (model: DeviceModel) => values.find((value) => sameText(value, model.model)) ?? null;
  }, [deviceOption, variants]);

  useEffect(() => {
    let active = true;
    const defaults: Record<string, string> = {};
    for (const name of optionNames) {
      const values = unique(
        variants.flatMap((variant) =>
          variant.selectedOptions.filter((option) => option.name === name).map((option) => option.value)
        )
      );
      if (values.length === 1) defaults[name] = values[0];
    }
    const savedOptionValue =
      deviceOption && savedDevice ? optionValueForModel(savedDevice) : null;
    if (deviceOption && savedOptionValue) defaults[deviceOption] = savedOptionValue;
    if (selectedVariant) {
      selectedVariant.selectedOptions.forEach((option) => {
        defaults[option.name] = option.value;
      });
    }
    const match = variants.find((variant) =>
      variant.selectedOptions.every((option) => !defaults[option.name] || defaults[option.name] === option.value)
    );
    queueMicrotask(() => {
      if (!active) return;
      setSelections(defaults);
      if (match && Object.keys(defaults).length === optionNames.length) onChange(match);
    });
    return () => {
      active = false;
    };
    // The available option set is stable for the lifetime of a product page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceOption, optionNames, variants]);

  // Keep the option grid in sync when the phone is changed from "My phone" / quick add.
  const syncedDeviceRef = useRef<DeviceModel | null>(null);
  useEffect(() => {
    if (!deviceOption || !savedDevice) return;
    if (syncedDeviceRef.current === savedDevice) return;
    syncedDeviceRef.current = savedDevice;
    const optionValue = optionValueForModel(savedDevice);
    if (!optionValue || selections[deviceOption] === optionValue) return;
    const next = { ...selections, [deviceOption]: optionValue };
    setSelections(next);
    const match = variants.find((variant) =>
      variant.selectedOptions.every((option) => next[option.name] === option.value)
    );
    onChange(match ?? null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [savedDevice]);

  function select(name: string, value: string) {
    const next = { ...selections, [name]: value };
    const selectedIndex = optionNames.indexOf(name);
    optionNames.slice(selectedIndex + 1).forEach((downstreamName) => {
      delete next[downstreamName];
    });
    setSelections(next);
    const match = variants.find((variant) =>
      variant.selectedOptions.every((option) => next[option.name] === option.value)
    );
    onChange(match ?? null);
  }

  function isValueAvailable(name: string, value: string) {
    const candidateIndex = optionNames.indexOf(name);
    return variants.some(
      (variant) =>
        variant.availableForSale &&
        variant.selectedOptions.every((option) => {
          if (option.name === name) return option.value === value;
          const optionIndex = optionNames.indexOf(option.name);
          return optionIndex >= candidateIndex || !selections[option.name] || selections[option.name] === option.value;
        })
    );
  }

  const selectedDeviceModel = useMemo(() => {
    if (!deviceOption) return null;
    const value = selections[deviceOption];
    if (!value) return null;
    return deviceModels.find((model) => sameText(model.model, value)) ?? null;
  }, [deviceModels, deviceOption, selections]);

  function handleDeviceSelect(model: DeviceModel | null) {
    if (!deviceOption) return;
    if (!model) {
      // Platform/brand reset inside the chooser clears the exact-model choice.
      const next = { ...selections };
      delete next[deviceOption];
      setSelections(next);
      onChange(null);
      return;
    }
    rememberDevice(model);
    const value = optionValueForModel(model);
    if (value) select(deviceOption, value);
  }

  return (
    <div className="mt-8 space-y-7" data-testid="product-options">
      {deviceOption ? (
        <section className="overflow-hidden rounded-2xl border border-line-hi bg-surface">
          <div className="border-b border-line bg-accent/10 p-4">
            <div className="flex items-center justify-between gap-4">
              <p className="font-mono text-[10px] font-bold uppercase tracking-widest text-accent">Choose your phone</p>
              <span className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 font-mono text-[9px] uppercase tracking-widest ${selections[deviceOption] ? 'border-stock/50 text-stock' : 'border-line-hi text-ink-3'}`}>
                {selections[deviceOption] ? 'Fit selected' : 'Required'}
              </span>
            </div>
            <p className="mt-1 text-xs text-ink-2">Only models stocked for this design are listed.</p>
          </div>
          <div className="p-4">
            {deviceModels.length ? (
              <PhoneModelChooser
                models={deviceModels}
                selected={selectedDeviceModel}
                onSelect={handleDeviceSelect}
                isModelAvailable={(model) => {
                  const value = optionValueForModel(model);
                  return Boolean(value) && isValueAvailable(deviceOption, value as string);
                }}
              />
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {unique(variants.flatMap((variant) => variant.selectedOptions.filter((option) => option.name === deviceOption).map((option) => option.value))).map((value) => (
                  <button key={value} type="button" data-testid="device-model" onClick={() => select(deviceOption, value)} disabled={!isValueAvailable(deviceOption, value)} aria-pressed={selections[deviceOption] === value} className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left text-sm font-semibold ${selections[deviceOption] === value ? 'border-accent bg-accent text-black' : 'border-line-hi text-ink-2 hover:border-accent hover:text-white'} disabled:cursor-not-allowed disabled:opacity-35`}>
                    <span className="truncate">{value}</span>
                  </button>
                ))}
              </div>
            )}
            <a href="mailto:nakhyatrastore@gmail.com?subject=Phone model request" className="mt-4 inline-flex font-mono text-[9px] uppercase tracking-widest text-ink-3 underline decoration-line-hi underline-offset-4 hover:text-accent">Model not listed? Request it</a>
          </div>
        </section>
      ) : null}

      {optionNames.filter((name) => name !== deviceOption && name !== 'Title').map((name) => {
        const values = unique(variants.flatMap((variant) => variant.selectedOptions.filter((option) => option.name === name).map((option) => option.value)));
        return (
          <fieldset key={name}>
            <legend className="flex w-full items-center justify-between font-mono text-[10px] uppercase tracking-widest text-ink-3"><span>Choose {name}</span><span className="text-white">{selections[name] ?? 'Required'}</span></legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {values.map((value) => {
                const available = isValueAvailable(name, value);
                return <button key={value} type="button" onClick={() => select(name, value)} disabled={!available} aria-pressed={selections[name] === value} className={`rounded-xl border px-3 py-3 text-sm font-semibold transition-colors ${selections[name] === value ? 'border-accent bg-accent/15 text-white' : 'border-line-hi text-ink-2 hover:border-accent'} disabled:opacity-35`}>{value}</button>;
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
