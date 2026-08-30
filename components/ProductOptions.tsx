'use client';

import { useEffect, useMemo, useState } from 'react';
import type { ProductVariant } from '@/lib/catalog';
import { IconCheck, IconSearch } from './icons';

const DEVICE_STORAGE_KEY = 'nakhyatra-device:v1';

function familyOf(model: string) {
  const value = model.toLowerCase();
  if (value.includes('iphone') || value.includes('apple')) return 'iPhone';
  if (value.includes('samsung') || value.includes('galaxy')) return 'Samsung';
  if (value.includes('oneplus')) return 'OnePlus';
  if (value.includes('nothing')) return 'Nothing';
  if (value.includes('pixel') || value.includes('google')) return 'Pixel';
  if (value.includes('moto') || value.includes('motorola')) return 'Motorola';
  return 'Other';
}

function unique(values: string[]) {
  return Array.from(new Set(values));
}

export default function ProductOptions({
  variants,
  selectedId,
  onChange,
}: {
  variants: ProductVariant[];
  selectedId: string | null;
  onChange: (variant: ProductVariant | null) => void;
}) {
  const deviceOption = useMemo(() => {
    const names = unique(variants.flatMap((variant) => variant.selectedOptions.map((option) => option.name)));
    return names.find((name) => /device|phone|model/i.test(name));
  }, [variants]);
  const selectedVariant = variants.find((variant) => variant.id === selectedId) ?? null;
  const [selections, setSelections] = useState<Record<string, string>>({});
  const [family, setFamily] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const optionNames = useMemo(
    () => unique(variants.flatMap((variant) => variant.selectedOptions.map((option) => option.name))),
    [variants]
  );

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
    const storedDevice = deviceOption ? window.localStorage.getItem(DEVICE_STORAGE_KEY) : null;
    if (storedDevice && variants.some((variant) => variant.selectedOptions.some((option) => option.name === deviceOption && option.value === storedDevice))) {
      defaults[deviceOption!] = storedDevice;
    }
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
      if (storedDevice) setFamily(familyOf(storedDevice));
      if (match && Object.keys(defaults).length === optionNames.length) onChange(match);
    });
    return () => {
      active = false;
    };
    // The available option set is stable for the lifetime of a product page.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deviceOption, optionNames, variants]);

  function select(name: string, value: string) {
    const next = { ...selections, [name]: value };
    const selectedIndex = optionNames.indexOf(name);
    optionNames.slice(selectedIndex + 1).forEach((downstreamName) => {
      delete next[downstreamName];
    });
    setSelections(next);
    if (name === deviceOption) {
      window.localStorage.setItem(DEVICE_STORAGE_KEY, value);
      setFamily(familyOf(value));
    }
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

  const deviceValues = deviceOption
    ? unique(
        variants.flatMap((variant) =>
          variant.selectedOptions.filter((option) => option.name === deviceOption).map((option) => option.value)
        )
      )
    : [];
  const families = unique(deviceValues.map(familyOf));
  const visibleDevices = deviceValues.filter(
    (value) =>
      (!family || familyOf(value) === family) &&
      (!search || value.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="mt-8 space-y-7" data-testid="product-options">
      {deviceOption ? (
        <section className="border border-accent/50 bg-bg">
          <div className="border-b border-line bg-accent/10 p-4">
            <div className="flex items-start justify-between gap-4">
              <div><p className="font-mono text-[10px] uppercase tracking-widest text-accent">Choose your phone</p><p className="mt-1 text-xs text-ink-2">Only models available for this design are listed.</p></div>
              <span className="font-mono text-[9px] uppercase tracking-widest text-verify">{selections[deviceOption] ? 'Fit selected' : 'Required'}</span>
            </div>
          </div>
          <div className="p-4">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-3">1 · Brand family</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {families.map((item) => (
                <button key={item} type="button" data-testid="device-family" onClick={() => { setFamily(item); setSearch(''); }} aria-pressed={family === item} className={`border px-3 py-2 font-mono text-[10px] uppercase tracking-wider ${family === item ? 'border-accent bg-accent text-black' : 'border-line-hi text-ink-2 hover:border-accent hover:text-white'}`}>
                  {item} <span className="opacity-60">{deviceValues.filter((value) => familyOf(value) === item).length}</span>
                </button>
              ))}
            </div>

            {family ? (
              <div className="mt-6">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><p className="font-mono text-[9px] uppercase tracking-widest text-ink-3">2 · Exact model</p><label className="flex items-center gap-2 border border-line-hi px-3 focus-within:border-accent"><IconSearch className="h-3.5 w-3.5 text-ink-3" /><span className="sr-only">Search phone models</span><input type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search model" className="min-h-10 w-full bg-transparent font-mono text-[10px] text-white outline-none placeholder:text-ink-3 sm:w-40" /></label></div>
                <div className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto pr-1 sm:grid-cols-3">
                  {visibleDevices.map((value) => {
                    const available = isValueAvailable(deviceOption, value);
                    const selected = selections[deviceOption] === value;
                    return <button key={value} type="button" data-testid="device-model" onClick={() => select(deviceOption, value)} disabled={!available} aria-pressed={selected} className={`flex min-h-12 items-center justify-between gap-2 border px-3 py-2 text-left font-mono text-[10px] ${selected ? 'border-accent bg-accent text-black' : 'border-line-hi text-ink-2 hover:border-accent hover:text-white'} disabled:cursor-not-allowed disabled:opacity-35`}><span>{value}</span>{selected ? <IconCheck className="h-4 w-4 shrink-0" /> : null}</button>;
                  })}
                </div>
                {visibleDevices.length === 0 ? <p className="mt-4 text-sm text-ink-3">No available model matches that search.</p> : null}
                <a href="mailto:nakhyatrastore@gmail.com?subject=Phone model request" className="mt-4 inline-flex font-mono text-[9px] uppercase tracking-widest text-ink-3 underline decoration-line-hi underline-offset-4 hover:text-accent">Model not listed? Request it</a>
              </div>
            ) : null}
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
                return <button key={value} type="button" onClick={() => select(name, value)} disabled={!available} aria-pressed={selections[name] === value} className={`border px-3 py-3 font-mono text-[10px] ${selections[name] === value ? 'border-accent bg-accent/15 text-white' : 'border-line-hi text-ink-2 hover:border-accent'} disabled:opacity-35`}>{value}</button>;
              })}
            </div>
          </fieldset>
        );
      })}
    </div>
  );
}
