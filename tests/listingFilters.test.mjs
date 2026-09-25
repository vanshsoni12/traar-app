import test from 'node:test';
import assert from 'node:assert/strict';
import { filterListings } from '../src/utils/listingFilters.ts';
import { propertyCoordinates } from '../src/utils/staySearch.ts';
import { classificationFields } from '../src/utils/listingClassification.ts';

const origin = { latitude: 0, longitude: 0 };
const defaults = { query: '', type: 'all', diet: 'all', range: 'all', sort: 'recommended' };
const listing = (name, fields = {}) => ({ name, location: 'Bhopal', type: 'Museum', price: null, rating: null, coordinates: null, ...fields });

test('active directory combines food search, type, diet and price sorting', () => {
  const rows = [listing('Unknown'), listing('Cafe A', { type: 'Café', diet: 'Veg', price: 300 }), listing('Cafe B', { type: 'Café', diet: 'Veg', price: 100 }), listing('Cafe C', { type: 'Café', diet: 'Non-Veg', price: 50 })];
  assert.deepEqual(filterListings(rows, { ...defaults, query: ' bhopal ', type: 'café', diet: 'veg', sort: 'price' }, origin).map(x => x.name), ['Cafe B', 'Cafe A']);
  assert.equal(rows[1].name, 'Cafe A');
  assert.deepEqual(filterListings(rows, { ...defaults, diet: 'unknown' }, origin).map(x => x.name), ['Unknown']);
});

test('places and nearby distance ranges use coordinates and keep unknowns explicit', () => {
  const rows = [listing('Unknown'), listing('Near', { coordinates: origin }), listing('Medium', { coordinates: { latitude: 0, longitude: 0.6 } }), listing('Far', { coordinates: { latitude: 0, longitude: 1.2 } }), listing('Remote', { coordinates: { latitude: 0, longitude: 2 } })];
  for (const [range, name] of [['near', 'Near'], ['medium', 'Medium'], ['far', 'Far'], ['remote', 'Remote'], ['unknown', 'Unknown']]) {
    assert.deepEqual(filterListings(rows, { ...defaults, range }, origin).map(x => x.name), [name]);
  }
  assert.equal(filterListings(rows, { ...defaults, range: 'unknown' }, null).length, rows.length);
  assert.deepEqual(filterListings(rows, { ...defaults, sort: 'nearest' }, origin).map(x => x.name), ['Near', 'Medium', 'Far', 'Remote', 'Unknown']);
});

test('rating sort keeps genuine zero ratings ahead of missing ratings', () => {
  const rows = [listing('Unknown'), listing('Zero', { rating: 0 }), listing('Rated', { rating: 4 })];
  assert.deepEqual(filterListings(rows, { ...defaults, sort: 'rating' }, origin).map(x => x.name), ['Rated', 'Zero', 'Unknown']);
});

test('city references cannot supply property distances or coordinate directions', () => {
  assert.equal(propertyCoordinates(23.25, 77.42, 'Bhopal city reference only — property coordinates require confirmation'), null);
  assert.deepEqual(propertyCoordinates(23.25, 77.42, 'Provider entered coordinates'), { latitude: 23.25, longitude: 77.42 });
  assert.equal(propertyCoordinates(100, 77.42, null), null);
});

test('classification writes use the correct category fields and allow clearing', () => {
  assert.deepEqual(classificationFields('FOOD', ' Café ', 'Veg'), { food_type: 'Café', diet: 'Veg' });
  assert.deepEqual(classificationFields('STAY', 'Hostel', ''), { stay_type: 'Hostel' });
  assert.deepEqual(classificationFields('PLACE', 'Museum', ''), { place_type: 'Museum' });
  assert.deepEqual(classificationFields('TRAVEL', 'Day trip', ''), { travel_type: 'Day trip' });
  assert.deepEqual(classificationFields('FOOD', '', ''), { food_type: null, diet: null });
});

test('guide distances are used only when explicitly allowed for the city reference', () => {
  const rows = [listing('Sanchi', { referenceDistance: '46.2 km away' }), listing('Unknown', { referenceDistance: 'Local service' })];
  assert.deepEqual(filterListings(rows, { ...defaults, range: 'near' }, origin, true).map(x => x.name), ['Sanchi']);
  assert.deepEqual(filterListings(rows, { ...defaults, range: 'near' }, origin, false), []);
});
