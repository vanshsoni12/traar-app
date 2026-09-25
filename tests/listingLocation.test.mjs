import test from 'node:test';
import assert from 'node:assert/strict';
import { formatListingAddress, parseListingAddress } from '../src/utils/listingLocation.ts';

test('provider location survives saving and reopening with a multi-part street address', () => {
  const address = formatListingAddress(' 12 Lake Road, Shamla Hills ', ' Bhopal ', 'Madhya Pradesh');
  assert.equal(address, '12 Lake Road, Shamla Hills, Bhopal, Madhya Pradesh');
  assert.deepEqual(parseListingAddress(address), { address: '12 Lake Road, Shamla Hills', city: 'Bhopal', state: 'Madhya Pradesh' });
});

test('providers can enter destinations beyond the suggestions', () => {
  const address = formatListingAddress('Beach Road', 'Varkala', 'Kerala');
  assert.deepEqual(parseListingAddress(address), { address: 'Beach Road', city: 'Varkala', state: 'Kerala' });
});

test('city and state are not appended twice when already in the address', () => {
  assert.equal(formatListingAddress('Lake Road, bhopal, madhya pradesh', 'Bhopal', 'Madhya Pradesh'), 'Lake Road, Bhopal, Madhya Pradesh');
  assert.equal(formatListingAddress('Lake Road, Bhopal', 'Bhopal', 'Madhya Pradesh'), 'Lake Road, Bhopal, Madhya Pradesh');
});

test('legacy known destinations are recovered without discarding unknown addresses', () => {
  assert.deepEqual(parseListingAddress('M.P. Nagar, Bhopal'), { address: 'M.P. Nagar', city: 'Bhopal', state: 'Madhya Pradesh' });
  assert.deepEqual(parseListingAddress('42 Market Street'), { address: '42 Market Street', city: '', state: '' });
});
