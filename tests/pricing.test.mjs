import test from 'node:test';
import assert from 'node:assert/strict';
import { individualTariff, normalizeSavedTariff, normalizeProviderTariff, entryPriceLabel } from '../src/utils/pricing.ts';
import { itemPaise } from '../src/utils/budget.ts';

test('paired food prices convert to per person without changing room or vehicle prices', () => {
  assert.deepEqual(individualTariff('FOOD', 500, 'for two'), { price: 250, unit: 'per person', converted: true });
  assert.equal(individualTariff('FOOD', 300, 'for 2 people').price, 150);
  assert.equal(individualTariff('STAY', 500, 'room for two').price, 500);
  assert.equal(individualTariff('TRAVEL', 1200, 'per vehicle').price, 1200);
  assert.equal(individualTariff('FOOD', null, 'for two').price, null);
});

test('saved favourites and trip snapshots migrate once and have no stale paired labels', () => {
  const saved = { category: 'FOOD', price: 500, unit: 'for two', priceLabel: '₹500 for two (estimate)', detail: 'for two', quantity: 1 };
  const migrated = normalizeSavedTariff(saved);
  assert.equal(migrated.price, 250);
  assert.equal(migrated.unit, 'per person');
  assert.equal(/for two/.test(migrated.priceLabel + migrated.detail), false);
  assert.deepEqual(normalizeSavedTariff(migrated), migrated);
  assert.equal(itemPaise(migrated, 3, 1), 75000);
  assert.equal(normalizeProviderTariff({ category: 'FOOD', price: 500, price_unit: 'for two' }).price, 250);
});

test('place entry prices distinguish unknown, free and paid entries and scale correctly', () => {
  assert.equal(entryPriceLabel(null, ''), 'Entry fee: confirm with venue');
  assert.equal(entryPriceLabel(0, 'per entry'), 'Free entry');
  assert.equal(entryPriceLabel(25, 'per entry'), 'Entry fee: ₹25 per entry');
  assert.equal(itemPaise({ price: 25, category: 'PLACE', unit: 'per entry' }, 3, 1), 7500);
  assert.equal(itemPaise({ price: 25, category: 'PLACE', unit: 'per entry', priceKnown: false }, 3, 1), 0);
});

test('explicit transit totals have no hidden between-stop charges', () => {
  const items = [
    { category: 'FOOD', price: 250, unit: 'per person' },
    { category: 'TRAVEL', price: 65, unit: 'per person' },
    { category: 'TRAVEL', price: 1500, unit: 'per vehicle' },
  ];
  assert.equal(items.reduce((sum, item) => sum + itemPaise(item, 2, 1), 0), 213000);
});
