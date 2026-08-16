import { formatMoney, FREE_SHIPPING_THRESHOLD } from '@/lib/format';

export default function FreeShippingProgress({ subtotal }: { subtotal: number }) {
  const remaining = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const progress = Math.min(100, (subtotal / FREE_SHIPPING_THRESHOLD) * 100);
  const unlocked = remaining === 0;

  return (
    <div className="border-b border-line bg-surface px-5 py-4">
      <div className="flex items-center justify-between gap-3 font-mono text-[10px] uppercase tracking-[0.14em]">
        <span className={unlocked ? 'text-verify' : 'text-ink-2'}>
          {unlocked
            ? 'Free shipping unlocked'
            : `${formatMoney(remaining)} away from free shipping`}
        </span>
        <span className="text-ink-3">{Math.round(progress)}%</span>
      </div>
      <div className="mt-3 h-[3px] overflow-hidden bg-surface-3" aria-hidden="true">
        <div
          className={`h-full transition-[width,background-color] duration-fast ease-smooth ${
            unlocked ? 'bg-verify' : 'bg-accent'
          }`}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}
