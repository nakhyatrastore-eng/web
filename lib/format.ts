import type { Money } from './catalog';

export const FREE_SHIPPING_THRESHOLD = 999;

export function formatMoney(money: Money | number, currency = 'INR') {
  const amount = typeof money === 'number' ? money : Number(money.amount);
  const currencyCode = typeof money === 'number' ? currency : money.currencyCode;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currencyCode,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount);
}
