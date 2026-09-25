import { individualTariff } from './pricing.ts';
export type BudgetItem = { price: number; category: string; quantity?: number; unit?: string; priceKnown?: boolean };
export function itemPaise(item: BudgetItem, persons: number, nights: number) {
  if (item.priceKnown === false) return 0;
  const tariff = individualTariff(item.category, item.price, item.unit || '');
  const base = Math.round(tariff.price! * 100);
  const multiplier = /person|meal|ticket|entry/i.test(tariff.unit) ? persons : 1;
  return base * multiplier * (item.quantity || 1) * (item.category === 'STAY' ? nights : 1);
}
