import { itemPaise } from '../utils/budget';
import './NearbyDirectory.css';
import { filterListings } from '../utils/listingFilters';
import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useExplorer } from '../context/ExplorerContext';
import { useTrip } from '../context/TripContext';
import { categories, money, type Category, type Listing } from '../data/catalog';
import { distanceKm, stayTypes } from '../utils/staySearch';
import { Gallery } from '../components/ExplorerModals';
import { AddToTrip, SaveButtons } from '../components/ListingActions';
export function TripWidget() {
  const { items, removeItem, clearTrip } = useTrip(); const { persons } = useExplorer();
  const nights = Math.max(1, Number(localStorage.getItem('traar-nights')) || 1);
  return <aside className="ex-trip-widget"><div className="ex-section-title"><h3>▣ Trip Planner <span className="ex-tag">{items.length}</span></h3><button disabled={!items.length} onClick={clearTrip}>Clear all</button></div><p>{persons} traveller(s)</p>{!items.length && <p className="ex-muted">Add your favourite stops to start planning.</p>}{items.map((item) => <div className="ex-mini-item" key={item.id}>{item.image ? <img src={item.image} alt="" /> : <span>{item.emoji}</span>}<div><b>{item.name}</b><small>{item.category} · {item.quantity || 1} unit(s)</small><strong>{item.priceKnown === false ? 'Tariff to confirm' : money(itemPaise(item, persons, nights) / 100)}</strong></div><button onClick={() => removeItem(item.id)} aria-label={`Remove ${item.name}`}>×</button></div>)}<Link className="ex-primary" to="/my-trip">Open trip & budget →</Link></aside>;
}
function TransitModeIcon({ mode }: { mode: string }) {
  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {mode === 'Bus' || mode === 'Train' ? <><rect x="5" y="3" width="14" height="16" rx="3" /><path d="M5 11h14M12 3v8M8 19v2m8-2v2" /><circle cx="8.5" cy="15" r=".7" /><circle cx="15.5" cy="15" r=".7" /></> : mode === 'Self-drive' ? <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="2" /><path d="M3 10h7m4 0h7m-9 4v7" /></> : <><path d="m5 9 2-5h10l2 5M4 9h16v9H4ZM6 18v2m12-2v2M7 13h2m6 0h2" /></>}
  </svg>;
}
function TransitPanel({ listing }: { listing: Listing }) {
  const [mode, setMode] = useState(Object.keys(listing.transport || {})[0]);
  const { items, addItem } = useTrip(); const { notify } = useExplorer();
  if (!listing.transport || !mode) return null;
  const info = listing.transport[mode];
  const modeIndex = Object.keys(listing.transport).indexOf(mode);
  const id = listing.id * 10 + modeIndex;
  const added = items.some((item) => item.id === id);
  return <div className="ex-transit-panel"><small>PUBLIC TRANSIT OPTIONS · ESTIMATES</small><div className="ex-toggle-row">{Object.keys(listing.transport).map((value) => <button aria-pressed={value === mode} key={value} onClick={() => setMode(value)}><TransitModeIcon mode={value} /><span>{value}</span></button>)}</div><div className="ex-section-title"><b>{mode} Transit</b><span className="ex-tag">{info.duration}</span></div><h3>{money(info.fare)} <small>{mode === 'Bus' || mode === 'Train' ? '/ person' : '/ vehicle'}</small></h3><dl>{Object.entries({ Operator: info.operator, 'First departure': info.first, 'Last departure': info.last, 'Boarding point': info.boarding, 'Arrival point': info.arrival }).map(([label, value]) => <div key={label}><dt>{label}</dt><dd title={value}>{value}</dd></div>)}</dl><button className="ex-primary" disabled={added} onClick={() => { addItem({ id, category: 'TRAVEL', name: listing.name, detail: `${mode} • ${info.duration}`, price: info.fare, emoji: '↗', image: listing.images[0], location: listing.location, unit: mode === 'Bus' || mode === 'Train' ? 'per person' : 'per vehicle' }); notify(`${mode} leg to ${listing.name} added.`); }}>{added ? `✓ Added ${mode} Leg` : `+ Add ${mode} Leg to Trip`}</button></div>;
}
export function ListingCard({ listing }: { listing: Listing }) {
  const ex = useExplorer(); const distance = distanceKm(ex.startingPoint.coordinates, listing.coordinates);
  return <article className={`ex-listing-card ${listing.transport ? 'ex-transit-card' : ''}`}><div className="ex-card-main"><div className="ex-card-visual"><Gallery listing={listing} /><SaveButtons listing={listing} /></div><div className="ex-card-body"><div className="ex-section-title"><span className="ex-tag">{listing.type}</span>{listing.diet && <span className="ex-tag">{listing.diet}</span>}</div><h2>{listing.name}</h2><p className="ex-muted">⌖ {listing.location}</p><div className="ex-section-title"><strong>{listing.priceLabel}</strong>{listing.rating !== null && <span>★ {listing.rating}</span>}</div>{listing.priceSource && <a className="ex-tariff-source" href={listing.priceSource} target="_blank" rel="noreferrer">Official entry tariff ↗</a>}{distance !== null && <p className="ex-muted">{distance.toFixed(1)} km · straight-line estimate</p>}{listing.referenceDistance && <small>{listing.referenceDistance} · existing guide estimate</small>}<div className="ex-card-actions"><button onClick={() => ex.setDetail(listing)}>View details</button><button onClick={() => ex.setWays(listing)}>⌖ Ways</button><button onClick={() => ex.setReport(listing)}>⚑ Report</button>{!listing.transport && <AddToTrip listing={listing} />}</div></div></div>{listing.transport && <TransitPanel listing={listing} />}</article>;
}
export default function DirectoryPage({ category, favourites = false }: { category?: Category; favourites?: boolean }) {
  const ex = useExplorer(); const { city } = useParams();
  const [type, setType] = useState('all'); const [diet, setDiet] = useState('all'); const [range, setRange] = useState('all'); const [sort, setSort] = useState('recommended');
  const meta = category ? categories[category] : { title: favourites ? 'Saved Favourites' : 'Search Bhopal', icon: favourites ? '♥' : '⌕', subtitle: favourites ? 'Quickly access your shortlisted stays, food spots, attractions and excursion trips.' : 'Find your next stay, meal or adventure across the directory.' };
  const source = (favourites ? ex.favourites.map((item) => ex.catalog.find((current) => current.key === item.key) || item) : ex.catalog).filter((item) => !category || item.category === category);
  const types = category === 'STAY' ? [...stayTypes] : [...new Set(source.map((item) => item.type))];
  const match = (item: Listing) => `${item.name} — ${item.location}`.toLowerCase().includes(ex.query.trim().toLowerCase());
  const filtered = filterListings(source, { query: ex.query, type, diet, range, sort }, ex.startingPoint.coordinates, category === 'TRAVEL' && ex.startingPoint.mode === 'city');
  if (city && city.toLowerCase() !== 'bhopal') return <main className="ex-page"><h1>{city} is coming soon</h1><p>Bhopal is currently available.</p><Link className="ex-primary" to="/destinations/bhopal">Explore Bhopal →</Link></main>;
  if (category === 'TRAVEL') return <main className="ex-page nearby-directory">
    <nav className="ex-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link> › <Link to="/destinations/bhopal">Bhopal</Link> › <span>Nearby Trips</span></nav>
    <div className="nearby-heading"><span className="nearby-heading-icon" aria-hidden="true">↗</span><div><h1>Nearby Trips from Bhopal</h1><p>Day trips, heritage circuits and excursions with transparent transit estimates.</p></div></div>
    <section className="nearby-tariff-note"><span aria-hidden="true">ⓘ</span><div><h2>Transparent Transit Tariffs</h2><p>Bus and train fares are per person. Taxis and self-drive charge per vehicle. Only the transit you add is included in your trip.</p></div></section>
    <section className="nearby-filter-bar" aria-label="Nearby trip filters"><div className="nearby-distance"><strong>DISTANCE</strong>{[['all','All Distances'],['near','< 50 km'],['medium','50–100 km'],['far','100–200 km'],['remote','200+ km']].map(([value, label]) => <button key={value} aria-pressed={range === value} onClick={() => setRange(value)}>{label}</button>)}</div><label className="nearby-search"><span className="sr-only">Search nearby trips</span><input type="search" value={ex.query} onChange={(event) => ex.setQuery(event.target.value)} placeholder="Search Bhopal excursions…" /></label>
      <label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All types</option>{types.map((value) => <option key={value}>{value}</option>)}</select></label>
      <label>Sort<select value={sort} onChange={(event) => setSort(event.target.value)}><option value="recommended">Recommended</option><option value="nearest">Nearest first</option><option value="price">Price: low to high</option><option value="rating">Highest rated</option></select></label>
      <button className="nearby-reset" onClick={() => { ex.setQuery(''); setRange('all'); setType('all'); setSort('recommended'); }}>Reset</button>
    </section>
    {(range !== 'all' || sort === 'nearest') && <p className="ex-muted">{ex.startingPoint.mode === 'city' ? 'Guide distances are estimates from Bhopal; supplied coordinates use straight-line distance.' : `Distances use ${ex.startingPoint.label}. Trips without coordinates are excluded from ranges.`} <button onClick={() => ex.setModal('starting')}>Change starting point</button></p>}
    <div className="ex-directory-layout"><div><div className="nearby-results"><p role="status">Showing <strong>{filtered.length}</strong> nearby destinations{ex.loading ? ' · Loading…' : ''}</p><span>Excursions &amp; Day Circuits</span></div>
      {ex.loadError && <p className="ex-notice">{ex.loadError}</p>}
      {!filtered.length && <div className="ex-empty"><h2>No nearby trips match</h2><p>Try another distance or reset your filters.</p></div>}
      <section className="ex-listing-grid nearby-trip-list">{filtered.map((listing) => <ListingCard key={listing.key} listing={listing} />)}</section>
    </div><TripWidget /></div>
  </main>;
  return <main className="ex-page"><nav className="ex-breadcrumb" aria-label="Breadcrumb"><Link to="/">Home</Link> › <Link to="/destinations/bhopal">Bhopal</Link> › <span>{meta.title}</span></nav><div className="ex-page-heading"><div><p className="ex-eyebrow">EXPLORE BHOPAL</p><h1>{meta.icon} {meta.title}</h1><p>{meta.subtitle}</p></div></div>
    <div className="ex-directory-layout"><div><section className="ex-filters" aria-label="Listing filters"><label className="ex-search-label">Search<input list="directory-suggestions" value={ex.query} onChange={(event) => ex.setQuery(event.target.value)} placeholder="Name, area or full address" type="search" /></label><datalist id="directory-suggestions">{source.filter(match).slice(0, 12).map((item) => <option key={item.key} value={`${item.name} — ${item.location}`} />)}</datalist><label>Type<select value={type} onChange={(event) => setType(event.target.value)}><option value="all">All Types</option>{types.map((type) => <option key={type}>{type}</option>)}</select></label>{category === 'FOOD' && <label>Diet<select value={diet} onChange={(event) => setDiet(event.target.value)}><option value="all">All Dining</option><option>Veg</option><option>Non-Veg</option><option>Vegan</option></select></label>}<label>Distance<select value={range} onChange={(event) => setRange(event.target.value)}><option value="all">All distances</option><option value="near">&lt; 50 km</option><option value="medium">50–100 km</option><option value="far">100–200 km</option><option value="remote">200+ km</option></select></label><label>Sort by<select value={sort} onChange={(event) => { setSort(event.target.value); if (event.target.value === 'nearest' && !ex.startingPoint.coordinates) ex.setModal('starting'); }}><option value="recommended">Recommended</option><option value="nearest">Nearest first</option><option value="price">Price: low to high</option><option value="rating">Rating: highest first</option></select></label></section>
      <div className="ex-filter-status"><span>ACTIVE: {type === 'all' ? 'All types' : type}{ex.query ? ` · “${ex.query}”` : ''}{range !== 'all' ? ' · Distance filter' : ''}{diet !== 'all' ? ` · ${diet}` : ''}</span><button onClick={() => { ex.setQuery(''); setType('all'); setDiet('all'); setRange('all'); setSort('recommended'); }}>↺ Reset filters</button>{ex.query && <button onClick={() => ex.setQuery('')}>× Clear search</button>}</div>

      <p role="status">Showing {filtered.length} {category === 'STAY' ? 'accommodations' : category === 'FOOD' ? 'culinary spots' : category === 'PLACE' ? 'tourist spots' : 'listings'}{ex.loading ? ' · Loading live listings…' : ''}</p>{ex.loadError && <p className="ex-notice">{ex.loadError}</p>}
      {(range !== 'all' || sort === 'nearest') && <p className="ex-muted">Distances use {ex.startingPoint.label}. Listings without coordinates {range !== 'all' ? 'are excluded from distance filters' : 'appear last'}. <button onClick={() => ex.setModal('starting')}>Change starting point</button></p>}
      {sort === 'rating' && !filtered.some((item) => item.rating !== null) && <p className="ex-notice">Ratings are not available for these listings; their order is unchanged.</p>}
      {!filtered.length && <div className="ex-empty"><h2>{category === 'STAY' ? 'No stays found' : favourites ? 'No saved favourites match' : 'No listings found'}</h2><p>Try another search or reset the filters.</p></div>}
      <section className="ex-listing-grid">{filtered.map((listing) => <ListingCard key={listing.key} listing={listing} />)}</section></div><TripWidget /></div>
  </main>;
}
