'use client';

import type { DeviceModel } from '@/lib/catalog';
import PhoneModelChooser from './PhoneModelChooser';

export default function DevicePicker({
  models,
  selectedHandle,
  onChange,
}: {
  models: DeviceModel[];
  selectedHandle: string | null;
  onChange: (model: DeviceModel | null) => void;
}) {
  const selected = models.find((model) => model.handle === selectedHandle) ?? null;
  return (
    <PhoneModelChooser
      models={models}
      selected={selected}
      onSelect={onChange}
      className="mt-7"
    />
  );
}
