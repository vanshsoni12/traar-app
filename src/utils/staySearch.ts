export const stayTypes = ["Hotel", "Hostel", "Dormitory", "Guesthouse", "Homestay", "Resort"] as const;
export type StayType = typeof stayTypes[number];
export type StaySort = "recommended" | "nearest" | "price" | "rating";
export type Coordinates = { latitude: number; longitude: number };
export type SearchableStay = {
  name: string;
  location: string;
  stayType: StayType | null;
  numericPrice: number | null;
  rating: number | null;
  coordinates: Coordinates | null;
};

export function numericValue(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && !value.trim()) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function coordinatesFrom(latitude: unknown, longitude: unknown): Coordinates | null {
  const lat = numericValue(latitude), lon = numericValue(longitude);
  return lat !== null && lon !== null && Math.abs(lat) <= 90 && Math.abs(lon) <= 180
    ? { latitude: lat, longitude: lon } : null;
}

// Map explicit category labels only; never infer a category from a property's name.
export function stayTypeFrom(value: unknown): StayType | null {
  if (typeof value !== "string") return null;
  const label = value.trim().toLowerCase();
  if (["heritage hotel", "luxury hotel", "business hotel"].includes(label)) return "Hotel";
  return stayTypes.find((type) => type.toLowerCase() === label) ?? null;
}

export function distanceKm(origin: Coordinates | null, destination: Coordinates | null): number | null {
  if (!origin || !destination) return null;
  const radians = (degrees: number) => degrees * Math.PI / 180;
  const a = Math.sin(radians(destination.latitude - origin.latitude) / 2) ** 2 +
    Math.cos(radians(origin.latitude)) * Math.cos(radians(destination.latitude)) *
    Math.sin(radians(destination.longitude - origin.longitude) / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export function suggestionLabel(stay: Pick<SearchableStay, "name" | "location">): string {
  return `${stay.name} — ${stay.location}`;
}

export function matchesStay(stay: Pick<SearchableStay, "name" | "location">, query: string): boolean {
  return suggestionLabel(stay).toLocaleLowerCase().includes(query.trim().toLocaleLowerCase());
}

export function filterAndSortStays<T extends SearchableStay>(
  stays: T[], query: string, type: string, sort: StaySort, origin: Coordinates | null,
): T[] {
  const results = stays.filter((stay) => matchesStay(stay, query) && (type === "all" || stay.stayType === type));
  if (sort === "recommended") return results;
  const value = (stay: T) => sort === "nearest" ? distanceKm(origin, stay.coordinates)
    : sort === "price" ? stay.numericPrice : stay.rating;
  return results.sort((a, b) => {
    const left = value(a), right = value(b);
    if (left === null) return right === null ? 0 : 1;
    if (right === null) return -1;
    return sort === "rating" ? right - left : left - right;
  });
}

export function stayDirections(stay: Pick<SearchableStay, "name" | "location" | "coordinates">): string {
  const destination = stay.coordinates
    ? `${stay.coordinates.latitude},${stay.coordinates.longitude}`
    : `${stay.name}, ${stay.location}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
}

// City references are not a property's location and must not drive routing.
export function propertyCoordinates(latitude: unknown, longitude: unknown, source: unknown): Coordinates | null {
  if (typeof source === 'string' && /reference only/i.test(source)) return null;
  return coordinatesFrom(latitude, longitude);
}
