import { useTrip } from '../context/TripContext';
import { useExplorer } from '../context/ExplorerContext';
import { categories, type Listing } from '../data/catalog';
export function AddToTrip({ listing, label = '+ Add to trip' }: { listing: Listing; label?: string }) {
  const { items, addItem } = useTrip();
  const { notify } = useExplorer();
  const added = items.some((item) => item.id === listing.id);
  return <button className="ex-primary" disabled={added} onClick={() => {
    addItem({ id: listing.id, category: listing.category, name: listing.name, detail: listing.unit, price: listing.price ?? 0, priceKnown: listing.price !== null, emoji: categories[listing.category].icon, image: listing.images[0], location: listing.location, unit: listing.unit, quantity: 1 });
    notify(`${listing.name} added to your trip.`);
  }}>{added ? '✓ In trip' : label}</button>;
}
export function SaveButtons({ listing }: { listing: Listing }) {
  const ex = useExplorer();
  const saved = ex.favourites.some((item) => item.key === listing.key);
  const compared = ex.comparison.some((item) => item.key === listing.key);
  return <div className="ex-save"><button className={saved ? 'saved' : ''} aria-label={`${saved ? 'Remove' : 'Save'} ${listing.name} ${saved ? 'from' : 'to'} favourites`} aria-pressed={saved} onClick={() => ex.toggleFavourite(listing)}>{saved ? '♥' : '♡'}</button><button aria-label={`Compare ${listing.name}`} aria-pressed={compared} onClick={() => ex.toggleCompare(listing)}>{compared ? '✓' : '⚖'}</button></div>;
}
