import { individualTariff, entryPriceLabel } from '../utils/pricing';
import { stays, foods, places, nearbyTrips } from './sampleListings';
import { supabase } from '../supabaseClient';
import { propertyCoordinates, numericValue, stayTypeFrom, type Coordinates } from '../utils/staySearch';
export type Category = 'STAY' | 'FOOD' | 'PLACE' | 'TRAVEL';
export type Transit = { fare: number; duration: string; operator: string; first: string; last: string; boarding: string; arrival: string };
export type Listing = {
  key: string; id: number; listingId?: string; category: Category; type: string;
  name: string; location: string; price: number | null; priceLabel: string; unit: string;
  images: string[]; overview: string; coordinates: Coordinates | null;
  rating: number | null; reviewCount?: number; approved: boolean; verifiedAt?: string;
  priceSource?: string; priceNote?: string; phone?: string; email?: string; checkIn?: string; checkOut?: string;
  timings?: string; busyTime?: string; bestFor?: string; diet?: string;
  transport?: Record<string, Transit>; referenceDistance?: string;
};
export const categories: Record<Category, { title: string; slug: string; icon: string; subtitle: string }> = {
  STAY: { title: 'Stays', slug: 'stays', icon: '▤', subtitle: 'Hotels, hostels, guesthouses and places to feel at home.' },
  FOOD: { title: 'Food & Dining', slug: 'food', icon: '♨', subtitle: 'Restaurants, cafés and local flavours worth discovering.' },
  PLACE: { title: 'Places to Visit', slug: 'places', icon: '⌖', subtitle: 'Lakes, heritage, culture and a little room to wander.' },
  TRAVEL: { title: 'Nearby Trips', slug: 'nearby', icon: '↗', subtitle: 'Excursions, day circuits and transparent transport estimates.' },
};
type RawSample = { id: number; name: string; type?: string; tag?: string; fee?: string; priceSource?: string; location: string; image: string; overview: string; price?: string; tripPrice?: number; checkIn?: string; checkOut?: string; timings?: string; busyTime?: string; bestFor?: string; transport?: Record<string, Transit>; distance?: string };
function samples(rows: RawSample[], category: Category): Listing[] {
  return rows.map((row) => ({ ...row, key: `${category}:${row.id}`, category,
    type: category === 'STAY' ? stayTypeFrom(row.type) || row.type || 'Stay' : row.type || row.tag || 'Local service',
    images: [row.image], price: row.tripPrice ?? null, priceLabel: row.price || (category === 'PLACE' ? entryPriceLabel(row.tripPrice ?? null, 'per person') : 'Select a transit mode'),
    priceNote: category === 'PLACE' ? row.fee : undefined,
    unit: category === 'STAY' ? 'per room/night' : 'per person',
    coordinates: null, rating: null, approved: false, referenceDistance: row.distance,
  }));
}
export const sampleCatalog = [...samples(stays, 'STAY'), ...samples(foods, 'FOOD'), ...samples(places, 'PLACE'), ...samples(nearbyTrips, 'TRAVEL')];
function stableId(value: string) {
  let hash = 2166136261;
  for (const character of value) hash = Math.imul(hash ^ character.charCodeAt(0), 16777619);
  return (hash >>> 0) + 100000;
}
export async function loadCatalog(): Promise<Listing[]> {
  const { data, error } = await supabase.from('listings').select('*, listing_images(storage_path, sort_order)').eq('status', 'approved').ilike('address', '%Bhopal%').order('created_at', { ascending: false });
  if (error) throw error;
  return (data || []).filter((row) => row.category in categories).map((row) => {
    const rawPrice = numericValue(row.price);
    const tariff = individualTariff(row.category, rawPrice !== null && rawPrice >= 0 ? rawPrice : null, row.price_unit || (row.category === 'PLACE' ? 'per entry' : ''));
    const price = tariff.price;
    const rating = numericValue(row.rating);
    const images = [...(row.listing_images || [])].sort((a, b) => a.sort_order - b.sort_order).map((image) => supabase.storage.from('listing-images').getPublicUrl(image.storage_path).data.publicUrl);
    return {
      key: `provider:${row.id}`, id: stableId(row.id), listingId: row.id, category: row.category,
      type: row.category === 'STAY' ? stayTypeFrom(row.stay_type) || row.stay_type || 'Stay' : row.category === 'FOOD' ? row.food_type || 'Food' : row.category === 'PLACE' ? row.place_type || 'Place' : row.travel_type || 'Travel',
      name: row.name, location: row.address, overview: row.description || 'Contact the provider for more information.',
      price: price !== null && price >= 0 ? price : null,
      priceLabel: row.category === 'PLACE' ? entryPriceLabel(price, tariff.unit) : price !== null ? `₹${price.toLocaleString('en-IN')} ${tariff.unit}${tariff.converted ? ' (estimate)' : ''}` : 'Price on request',
      unit: tariff.unit, images, coordinates: propertyCoordinates(row.latitude, row.longitude, row.coordinate_source),
      rating: rating !== null && rating >= 0 && rating <= 5 ? rating : null,
      reviewCount: row.review_count, approved: true, verifiedAt: row.verified_at,
      phone: row.contact_phone, email: row.contact_email, checkIn: row.check_in, checkOut: row.check_out,
      timings: row.opening_hours, bestFor: row.amenities?.join(' • '), diet: row.diet,
    };
  });
}
export const money = (value: number) => `₹${value.toLocaleString('en-IN', { maximumFractionDigits: 2 })}`;
export function personTotal(listing: Listing, persons: number): number | null {
  if (listing.price === null) return null;
  const tariff = individualTariff(listing.category, listing.price, listing.unit);
  return /person|meal|ticket|entry/i.test(tariff.unit) ? tariff.price! * persons : tariff.price;
}
