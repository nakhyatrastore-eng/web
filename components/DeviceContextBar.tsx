'use client';

import { useEffect } from 'react';
import type { DeviceModel } from '@/lib/catalog';
import { useShoppingAssistant } from './ShoppingAssistant';
import { IconCheck } from './icons';

const PROMPT_STORAGE_KEY = 'nakhyatra-device-prompted:v1';

export default function DeviceContextBar({ models }: { models: DeviceModel[] }) {
  const { deviceLoaded, getCompatibleDevice, openDevicePicker } = useShoppingAssistant();
  const device = getCompatibleDevice(models);

  useEffect(() => {
    if (!deviceLoaded || device || !models.length || window.localStorage.getItem(PROMPT_STORAGE_KEY)) return;
    window.localStorage.setItem(PROMPT_STORAGE_KEY, 'true');
    const timeout = window.setTimeout(() => {
      openDevicePicker(models, { title: 'Set your phone once' });
    }, 650);
    return () => window.clearTimeout(timeout);
  }, [device, deviceLoaded, models, openDevicePicker]);

  return (
    <div className="device-context-bar border-b border-line bg-bg/95 backdrop-blur-xl">
      <div className="page-shell flex min-h-16 items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="font-mono text-[9px] uppercase tracking-[0.14em] text-ink-3">My phone</p>
          <p className="mt-1 truncate text-sm font-bold text-white">
            {device ? device.model : 'Choose once. We will remember the fit.'}
          </p>
        </div>
        <button
          type="button"
          data-testid="my-phone-trigger"
          onClick={() => openDevicePicker(models, { title: device ? 'Change your phone' : 'Set your phone once' })}
          className={`shrink-0 rounded-full border px-4 text-xs font-bold ${device ? 'border-stock/45 bg-stock/10 text-stock' : 'border-accent bg-accent text-black'}`}
        >
          {device ? <span className="inline-flex items-center gap-1"><IconCheck className="h-4 w-4" /> Change</span> : 'Choose phone'}
        </button>
      </div>
    </div>
  );
}
