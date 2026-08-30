'use client';

import { useMemo, useState } from 'react';
import type { DeviceModel } from '@/lib/catalog';
import { IconCheck, IconSearch } from './icons';

const PLATFORM_LABELS: Record<string, string> = {
  iOS: 'iPhone',
  Android: 'Android',
};

const BRAND_LABELS: Record<string, string> = {
  Google: 'Google Pixel',
  Samsung: 'Samsung Galaxy',
  Motorola: 'Motorola',
};

const sameText = (a: string, b: string) => a.trim().toLowerCase() === b.trim().toLowerCase();

function sortPlatforms(platforms: string[]) {
  return [...platforms].sort((a, b) => {
    const rank = (value: string) => (sameText(value, 'iOS') ? 0 : sameText(value, 'Android') ? 1 : 2);
    return rank(a) - rank(b);
  });
}

/**
 * The single phone-model selection UI. Used inside the device sheet and on the
 * product page so both surfaces look and behave identically.
 */
export default function PhoneModelChooser({
  models,
  selected,
  onSelect,
  isModelAvailable,
  hint,
  className,
}: {
  models: DeviceModel[];
  selected: DeviceModel | null;
  onSelect: (model: DeviceModel | null) => void;
  isModelAvailable?: (model: DeviceModel) => boolean;
  hint?: string;
  className?: string;
}) {
  const availableModels = useMemo(() => models.filter((model) => model.active), [models]);
  const platforms = useMemo(
    () => sortPlatforms(Array.from(new Set(availableModels.map((model) => model.platform)))),
    [availableModels]
  );
  const [platform, setPlatform] = useState<string | null>(
    selected?.platform ?? platforms[0] ?? null
  );
  const [brand, setBrand] = useState<string | null>(selected?.brand ?? null);
  const [search, setSearch] = useState('');
  const isAndroidPlatform = sameText(platform ?? '', 'Android');

  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          availableModels
            .filter((model) => sameText(model.platform, platform ?? ''))
            .map((model) => model.brand)
        )
      ),
    [availableModels, platform]
  );

  const visibleModels = useMemo(
    () =>
      availableModels.filter(
        (model) =>
          sameText(model.platform, platform ?? '') &&
          (!isAndroidPlatform || !brand || sameText(model.brand, brand)) &&
          (!search || model.model.toLowerCase().includes(search.toLowerCase()))
      ),
    [availableModels, brand, isAndroidPlatform, platform, search]
  );

  function choosePlatform(value: string) {
    setPlatform(value);
    setBrand(null);
    setSearch('');
    onSelect(null);
  }

  function chooseBrand(value: string) {
    setBrand(value);
    setSearch('');
    onSelect(null);
  }

  const showModels = platform && (!isAndroidPlatform || Boolean(brand) || search.trim().length > 0);

  return (
    <div className={className} data-testid="device-picker">
      <div className="flex items-center justify-between gap-4">
        <p className="text-base font-bold text-white">Select your phone</p>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-stock">
            <IconCheck className="h-4 w-4" /> {selected.model}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-ink-3">
        {hint ?? 'Check Settings → About phone if you are unsure of the exact model.'}
      </p>

      <div className="mt-3 flex gap-2">
        {platforms.map((item) => (
          <button
            key={item}
            type="button"
            data-testid="device-platform"
            onClick={() => choosePlatform(item)}
            aria-pressed={sameText(platform ?? '', item)}
            className={`min-h-11 flex-1 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
              sameText(platform ?? '', item)
                ? 'border-accent bg-accent text-black'
                : 'border-line-hi text-ink-2 hover:border-white hover:text-white'
            }`}
          >
            {PLATFORM_LABELS[item] ?? item}
          </button>
        ))}
      </div>

      {platform && isAndroidPlatform ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {brands.map((item) => (
            <button
              key={item}
              type="button"
              data-testid="device-brand"
              onClick={() => chooseBrand(item)}
              aria-pressed={sameText(brand ?? '', item)}
              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                sameText(brand ?? '', item)
                  ? 'border-white bg-white text-black'
                  : 'border-line-hi text-ink-2 hover:border-white hover:text-white'
              }`}
            >
              {BRAND_LABELS[item] ?? item}
            </button>
          ))}
        </div>
      ) : null}

      {showModels ? (
        <div className="mt-4">
          <label className="flex min-h-11 items-center gap-2 rounded-full border border-line-hi bg-bg px-4 transition-colors focus-within:border-accent">
            <IconSearch className="h-4 w-4 shrink-0 text-ink-3" />
            <span className="sr-only">Search phone models</span>
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search your model"
              className="min-h-11 w-full bg-transparent text-sm text-white outline-none placeholder:text-ink-3"
            />
          </label>
          <div className="mt-3 grid max-h-64 grid-cols-1 gap-2 overflow-y-auto pr-1 sm:grid-cols-2">
            {visibleModels.map((model) => {
              const available = isModelAvailable ? isModelAvailable(model) : true;
              const isSelected = selected ? model.handle === selected.handle : false;
              return (
                <button
                  key={model.handle || model.model}
                  type="button"
                  data-testid="device-model"
                  onClick={() => onSelect(model)}
                  disabled={!available}
                  aria-pressed={isSelected}
                  className={`flex min-h-11 items-center justify-between gap-2 rounded-xl border px-4 py-2 text-left text-sm font-semibold transition-colors ${
                    isSelected
                      ? 'border-accent bg-accent text-black'
                      : 'border-line-hi text-ink-2 hover:border-accent hover:text-white'
                  } disabled:cursor-not-allowed disabled:opacity-35`}
                >
                  <span className="truncate">{model.model}</span>
                  {isSelected ? <IconCheck className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })}
          </div>
          {visibleModels.length === 0 ? (
            <p className="mt-3 text-sm text-ink-3">No model matches that search.</p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
