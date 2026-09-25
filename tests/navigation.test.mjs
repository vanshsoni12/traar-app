import test from 'node:test';
import assert from 'node:assert/strict';
import { backFallback } from '../src/utils/navigation.ts';

test('direct directory links return to their destination, then home', () => {
  for (const category of ['stays', 'food', 'places', 'nearby']) {
    assert.equal(backFallback(`/destinations/bhopal/${category}`), '/destinations/bhopal');
  }
  assert.equal(backFallback('/destinations/bhopal'), '/');
});

test('direct provider forms return to the dashboard rather than leaving the app', () => {
  assert.equal(backFallback('/provider/services/new'), '/provider');
  assert.equal(backFallback('/provider/documents'), '/provider');
  assert.equal(backFallback('/provider'), '/');
  assert.equal(backFallback('/provider/login'), '/');
  assert.equal(backFallback('/admin/login'), '/');
});

test('traveller tools return to the selected destination without history', () => {
  for (const path of ['/my-trip', '/favourites', '/search']) {
    assert.equal(backFallback(path), '/destinations/bhopal');
  }
  assert.equal(backFallback('/help'), '/');
  assert.equal(backFallback('/'), '/');
});
