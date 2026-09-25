export function backFallback(pathname: string, city = 'bhopal'): string {
  const parts = pathname.split('/').filter(Boolean);
  if (parts[0] === 'destinations') return parts.length > 2 ? `/destinations/${parts[1]}` : '/';
  if (parts[0] === 'provider') return parts.length > 1 && parts[1] !== 'login' ? '/provider' : '/';
  if (['my-trip', 'favourites', 'search'].includes(parts[0])) return `/destinations/${encodeURIComponent(city.trim().toLowerCase().replace(/\s+/g, '-'))}`;
  return '/';
}
