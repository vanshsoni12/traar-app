import test from 'node:test';
import assert from 'node:assert/strict';
import { itemPaise } from '../src/utils/budget.ts';
test('money totals use integer paise and correct person/vehicle/room multipliers', () => {
  assert.equal(itemPaise({ category: 'FOOD', price: 0.1, unit: 'per person', quantity: 3 }, 3, 1), 90);
  assert.equal(itemPaise({ category: 'TRAVEL', price: 1600, unit: 'per vehicle' }, 4, 2), 160000);
  assert.equal(itemPaise({ category: 'STAY', price: 2500, unit: 'per room/night' }, 4, 2), 500000);
  assert.equal(itemPaise({ category: 'FOOD', price: 500, unit: 'for two' }, 3, 1), 75000);
  assert.equal(itemPaise({ category: 'PLACE', price: 0, unit: 'per person' }, 4, 1), 0);
});
