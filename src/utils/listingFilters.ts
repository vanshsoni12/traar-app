import { distanceKm, type Coordinates } from './staySearch.ts';

export type FilterableListing = {
  name: string; location: string; type: string; diet?: string; referenceDistance?: string;
  price: number | null; rating: number | null; coordinates: Coordinates | null;
};
export type ListingFilters = { query: string; type: string; diet: string; range: string; sort: string };
export function filterListings<T extends FilterableListing>(source: T[], filters: ListingFilters, origin: Coordinates | null, allowReferenceDistances = false): T[] {
  const getDistance = (item: T) => {
    const measured = distanceKm(origin, item.coordinates);
    if (measured !== null || !allowReferenceDistances) return measured;
    const match = item.referenceDistance?.match(/^(\d+(?:\.\d+)?)\s*km\s+away$/i);
    return match ? Number(match[1]) : null;
  };
  const results = source.filter((item) => {
    const distance = getDistance(item);
    const matchesRange = filters.range === 'all' || (filters.range === 'unknown' ? distance === null : distance !== null && (
      filters.range === 'near' ? distance < 50 : filters.range === 'medium' ? distance >= 50 && distance < 100 :
      filters.range === 'far' ? distance >= 100 && distance < 200 : distance >= 200));
    return `${item.name} — ${item.location}`.toLowerCase().includes(filters.query.trim().toLowerCase()) &&
      (filters.type === 'all' || item.type.toLowerCase() === filters.type.toLowerCase()) &&
      (filters.diet === 'all' || (filters.diet === 'unknown' ? !item.diet : item.diet?.toLowerCase() === filters.diet.toLowerCase())) && matchesRange;
  });
  if (filters.sort === 'recommended') return results;
  const value = (item: T) => filters.sort === 'price' ? item.price : filters.sort === 'rating' ? item.rating : getDistance(item);
  return results.sort((a, b) => {
    const left = value(a), right = value(b);
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return filters.sort === 'rating' ? right - left : left - right;
  });
}
