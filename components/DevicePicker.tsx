'use client';

import { useMemo, useState } from 'react';
import type { DeviceModel } from '@/lib/catalog';
import { IconCheck } from './icons';

const BRAND_LABELS: Record<string, string> = {
  Google: 'Google Pixel',
  Samsung: 'Samsung Galaxy',
  Motorola: 'Motorola',
};

const PLATFORM_LABELS: Record<string, string> = {
  iOS: 'iPhone',
  Android: 'Android',
};

export default function DevicePicker({
  models,
  selectedHandle,
  onChange,
}: {
  models: DeviceModel[];
  selectedHandle: string | null;
  onChange: (model: DeviceModel | null) => void;
}) {
  const availableModels = useMemo(
    () => models.filter((model) => model.active),
    [models]
  );
  const platforms = useMemo(
    () => Array.from(new Set(availableModels.map((model) => model.platform))),
    [availableModels]
  );
  const selected =
    availableModels.find((model) => model.handle === selectedHandle) ?? null;
  const [platform, setPlatform] = useState<string | null>(selected?.platform ?? null);
  const [brand, setBrand] = useState<string | null>(selected?.brand ?? null);
  const brands = useMemo(
    () =>
      Array.from(
        new Set(
          availableModels
            .filter((model) => model.platform === platform)
            .map((model) => model.brand)
        )
      ),
    [availableModels, platform]
  );

  const visibleModels = availableModels.filter(
    (model) =>
      model.platform === platform &&
      (platform !== 'Android' || model.brand === brand)
  );

  function choose(model: DeviceModel) {
    onChange(model);
  }

  return (
    <section className="mt-7" data-testid="device-picker">
      <div className="flex items-center justify-between gap-4">
        <h2 className="text-base font-bold text-white">Select your phone</h2>
        {selected ? (
          <span className="inline-flex items-center gap-1 text-xs font-semibold text-stock">
            <IconCheck className="h-4 w-4" /> {selected.model}
          </span>
        ) : null}
      </div>
      <p className="mt-1 text-xs text-ink-3">Check Settings → About if you are unsure of the exact model.</p>

      <div className="mt-3 flex gap-2">
        {platforms.map((item) => (
          <button
            key={item}
            type="button"
            data-testid="device-platform"
            onClick={() => {
              setPlatform(item);
              setBrand(item === 'iOS' ? 'Apple' : null);
              onChange(null);
            }}
            aria-pressed={platform === item}
            className={`min-h-11 flex-1 rounded-full border px-4 py-2 text-sm font-semibold ${
              platform === item
                ? 'border-accent bg-accent text-black'
                : 'border-line-hi text-ink-2 hover:border-white hover:text-white'
            }`}
          >
            {PLATFORM_LABELS[item] ?? item}
          </button>
        ))}
      </div>

      {platform === 'Android' ? (
        <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none">
          {brands.map((item) => (
            <button
              key={item}
              type="button"
              data-testid="device-brand"
              onClick={() => {
                setBrand(item);
                onChange(null);
              }}
              aria-pressed={brand === item}
              className={`min-h-11 shrink-0 rounded-full border px-4 py-2 text-sm font-semibold ${
                brand === item
                  ? 'border-white bg-white text-black'
                  : 'border-line-hi text-ink-2 hover:border-white hover:text-white'
              }`}
            >
              {BRAND_LABELS[item] ?? item}
            </button>
          ))}
        </div>
      ) : null}

      {platform && (platform !== 'Android' || brand) ? (
        <label className="mt-3 block">
          <span className="sr-only">Exact phone model</span>
          <select
            data-testid="device-model"
            value={selected?.handle ?? ''}
            onChange={(event) => {
              const model = availableModels.find((item) => item.handle === event.target.value);
              if (model) choose(model);
            }}
            className="min-h-[52px] w-full appearance-none rounded-2xl border border-line-hi bg-bg px-4 py-3 text-base font-semibold text-white outline-none focus:border-accent"
          >
            <option value="" disabled>Choose exact model</option>
            {visibleModels.map((model) => (
              <option key={model.id} value={model.handle}>{model.model}</option>
            ))}
          </select>
        </label>
      ) : null}
    </section>
  );
}
