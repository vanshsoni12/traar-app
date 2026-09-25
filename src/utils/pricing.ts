const pairUnit = /for\s+(?:two|2)\b|(?:two|2)\s*(?:persons?|people)\b/i;
export function individualTariff(category: string, price: number | null, unit: string) {
  const converted = category === 'FOOD' && pairUnit.test(unit);
  return { price: converted && price !== null ? Math.round(price * 50) / 100 : price, unit: converted ? 'per person' : unit, converted };
}
export function normalizeSavedTariff<T extends { category: string; price: number | null; unit?: string; detail?: string; priceLabel?: string }>(item: T): T {
  const tariff = individualTariff(item.category, item.price, item.unit || item.detail || item.priceLabel || '');
  if (!tariff.converted) return item;
  const label = tariff.price === null ? 'Price on request' : `₹${tariff.price.toLocaleString('en-IN')} per person (estimate)`;
  return { ...item, price: tariff.price, unit: tariff.unit,
    ...(item.detail !== undefined ? { detail: label } : {}),
    ...(item.priceLabel !== undefined ? { priceLabel: label } : {}) };
}
export function entryPriceLabel(price: number | null, unit: string) {
  return price === null ? 'Entry fee: confirm with venue' : price === 0 ? 'Free entry' : `Entry fee: ₹${price.toLocaleString('en-IN')} ${unit || 'per entry'}`;
}
export function normalizeProviderTariff<T extends { category: string; price: number | null; price_unit: string | null }>(row: T): T {
  const tariff = individualTariff(row.category, row.price, row.price_unit || '');
  return tariff.converted ? { ...row, price: tariff.price, price_unit: `${tariff.unit} (estimate)` } : row;
}
