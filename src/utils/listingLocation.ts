export const listingStates = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
  'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
  'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
  'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
  'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands',
  'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 'Delhi',
  'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry',
];
export const suggestedDestinations = [
  ['Bhopal', 'Madhya Pradesh'], ['Indore', 'Madhya Pradesh'], ['Ujjain', 'Madhya Pradesh'],
  ['Jaipur', 'Rajasthan'], ['Udaipur', 'Rajasthan'], ['Jaisalmer', 'Rajasthan'],
  ['Goa', 'Goa'], ['Agra', 'Uttar Pradesh'], ['Varanasi', 'Uttar Pradesh'],
  ['Manali', 'Himachal Pradesh'], ['Kochi', 'Kerala'],
];
const normalized = (value: string) => value.trim().toLowerCase();

// Keep location in the existing address column so provider submission needs no migration.
export function formatListingAddress(address: string, city: string, state: string): string {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  for (const suffix of [state, city]) {
    if (parts.length && normalized(parts[parts.length - 1]) === normalized(suffix)) parts.pop();
  }
  return [...parts, city.trim(), state.trim()].filter(Boolean).join(', ');
}
export function parseListingAddress(address: string) {
  const parts = address.split(',').map(part => part.trim()).filter(Boolean);
  const state = listingStates.find(value => normalized(value) === normalized(parts.at(-1) || ''));
  if (state && parts.length >= 2) {
    return { state, city: parts.at(-2)!, address: parts.slice(0, -2).join(', ') };
  }
  const destination = suggestedDestinations.find(([city]) => normalized(city) === normalized(parts.at(-1) || ''));
  if (destination) return { state: destination[1], city: destination[0], address: parts.slice(0, -1).join(', ') };
  return { state: '', city: '', address };
}
