import test from 'node:test';
import assert from 'node:assert/strict';
import { coordinatesFrom, distanceKm, filterAndSortStays, numericValue, stayDirections, stayTypeFrom, suggestionLabel } from '../src/utils/staySearch.ts';

const origin = { latitude: 0, longitude: 0 };
const makeStay = (name, fields = {}) => ({ name, location: 'Lake Road, Bhopal', stayType: 'Hotel', numericPrice: null, rating: null, coordinates: null, ...fields });
const stays = [
  makeStay('Unknown'),
  makeStay('Budget', { numericPrice: 100, rating: 3, coordinates: { latitude: 0, longitude: 2 } }),
  makeStay('Premium', { numericPrice: 900, rating: 4.8, coordinates: { latitude: 0, longitude: 1 } }),
  makeStay('Hostel', { stayType: 'Hostel', numericPrice: 0, rating: 0, coordinates: origin }),
];
const names = (results) => results.map((stay) => stay.name);

test('search, explicit type and numeric sort combine without mutating source order', () => {
  assert.deepEqual(names(filterAndSortStays(stays, ' LAKE road ', 'Hotel', 'price', origin)), ['Budget', 'Premium', 'Unknown']);
  assert.deepEqual(names(stays), ['Unknown', 'Budget', 'Premium', 'Hostel']);
  assert.deepEqual(names(filterAndSortStays(stays, 'premium', 'Hostel', 'price', origin)), []);
  assert.deepEqual(names(filterAndSortStays(stays, suggestionLabel(stays[2]), 'all', 'recommended', null)), ['Premium']);
});

test('price, rating and distance sort unknowns last and preserve real zeros', () => {
  assert.deepEqual(names(filterAndSortStays(stays, '', 'all', 'price', null)), ['Hostel', 'Budget', 'Premium', 'Unknown']);
  assert.deepEqual(names(filterAndSortStays(stays, '', 'all', 'rating', null)), ['Premium', 'Budget', 'Hostel', 'Unknown']);
  assert.deepEqual(names(filterAndSortStays(stays, '', 'all', 'nearest', origin)), ['Hostel', 'Premium', 'Budget', 'Unknown']);
  assert.deepEqual(filterAndSortStays(stays, '', 'all', 'nearest', null), stays);
  assert.deepEqual(filterAndSortStays(stays, '', 'all', 'recommended', origin), stays);
});

test('missing, malformed and out-of-range values stay unknown', () => {
  for (const value of [null, undefined, '', ' ', NaN, Infinity, '₹200', false]) assert.equal(numericValue(value), null);
  assert.equal(numericValue('200'), 200);
  assert.equal(numericValue(0), 0);
  assert.equal(coordinatesFrom(null, 0), null);
  assert.equal(coordinatesFrom(91, 0), null);
  assert.equal(coordinatesFrom(0, 181), null);
  assert.deepEqual(coordinatesFrom('0', '0'), origin);
  assert.equal(stayTypeFrom('STAY'), null);
  assert.equal(stayTypeFrom('Palace Hotel on Lake Road'), null);
  assert.equal(stayTypeFrom('HERITAGE HOTEL'), 'Hotel');
  for (const label of ['Hotel', 'Hostel', 'Dormitory', 'Guesthouse', 'Homestay', 'Resort']) assert.equal(stayTypeFrom(label.toUpperCase()), label);
});

test('Haversine distance handles identical points and known equatorial separation', () => {
  assert.equal(distanceKm(origin, origin), 0);
  assert.ok(Math.abs(distanceKm(origin, { latitude: 0, longitude: 1 }) - 111.195) < 0.01);
  assert.equal(distanceKm(origin, null), null);
});

test('directions prefer coordinates and omit the traveller origin', () => {
  const coordinateUrl = new URL(stayDirections(stays[3]));
  assert.equal(coordinateUrl.pathname, '/maps/dir/');
  assert.equal(coordinateUrl.searchParams.get('destination'), '0,0');
  assert.equal(coordinateUrl.searchParams.has('origin'), false);
  const addressUrl = new URL(stayDirections(makeStay('A & B Stay')));
  assert.equal(addressUrl.searchParams.get('destination'), 'A & B Stay, Lake Road, Bhopal');
  assert.equal(addressUrl.searchParams.get('api'), '1');
});
