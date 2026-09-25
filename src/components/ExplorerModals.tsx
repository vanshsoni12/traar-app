import TravellerProfile from './TravellerProfile';
import { useState } from 'react';
import { useExplorer } from '../context/ExplorerContext';
import { categories, money, personTotal, type Listing } from '../data/catalog';
import { distanceKm, stayDirections } from '../utils/staySearch';
import { supabase } from '../supabaseClient';
import Modal from './Modal';
import StartingPoint from './StartingPoint';
import { AddToTrip } from './ListingActions';
export function Gallery({ listing, thumbnails = false }: { listing: Listing; thumbnails?: boolean }) {
  const [index, setIndex] = useState(0);
  const images = listing.images;
  return <div className="ex-gallery"><div className="ex-image-wrap">
    {images.length ? <img src={images[index] || images[0]} alt={listing.name} loading="lazy" /> : <div className="ex-no-image">{categories[listing.category].icon}<span>Photo not supplied</span></div>}
    {images.length > 1 && <><button className="prev" aria-label="Previous photo" onClick={() => setIndex((index + images.length - 1) % images.length)}>‹</button><button className="next" aria-label="Next photo" onClick={() => setIndex((index + 1) % images.length)}>›</button></>}
    <span className="ex-photo-tag">{listing.type}</span>
    <span className="ex-data-tag">{listing.approved ? '✓ Provider approved' : 'Destination guide'}</span>
  </div>{images.length > 1 && <div className={thumbnails ? 'ex-thumbnails' : 'ex-dots'}>{images.map((image, i) => <button key={`${image}-${i}`} aria-label={`Photo ${i + 1}`} aria-pressed={index === i} onClick={() => setIndex(i)}>{thumbnails ? <img src={image} alt={`View ${i + 1}`} /> : '●'}</button>)}</div>}</div>;
}
function ReportForm({ listing }: { listing: Listing }) {
  const ex = useExplorer();
  const [type, setType] = useState('Outdated tariff or price mismatch');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  return <form className="ex-report" onSubmit={async (event) => {
    event.preventDefault(); if (!message.trim()) return; setSending(true); setError('');
    try {
      const result = await supabase.from('user_reports').insert({ listing_id: listing.listingId || null, report_type: type, message: `${listing.name} (${listing.location}): ${message.trim()}`, status: 'open' });
      if (result.error) throw result.error;
      ex.notify(`Report submitted for ${listing.name}.`); ex.setReport(null);
    } catch { setError('The report could not be sent. Your text is preserved; please retry.'); } finally { setSending(false); }
  }}><p>Help the administration maintain trustworthy travel information for <b>{listing.name}</b>.</p>
    <label>Issue type<select value={type} onChange={(event) => setType(event.target.value)}>{['Outdated tariff or price mismatch', 'Wrong location', 'Closed or unavailable', 'Safety concern', 'Other'].map((value) => <option key={value}>{value}</option>)}</select></label>
    <label>Correction details<textarea required rows={5} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explain what needs correcting and include a source if available." /></label>
    {error && <p role="alert">{error}</p>}<footer><button type="button" onClick={() => ex.setReport(null)}>Cancel</button><button className="ex-primary" disabled={sending}>{sending ? 'Sending…' : '↗ Submit report'}</button></footer>
  </form>;
}
export default function ExplorerModals() {
  const ex = useExplorer();
  const listing = ex.detail;
  const distance = listing && distanceKm(ex.startingPoint.coordinates, listing.coordinates);
  const ways = ex.ways;
  return <>
    {listing && <Modal title={listing.name} onClose={() => ex.setDetail(null)} wide><Gallery key={listing.key} listing={listing} thumbnails /><div className="ex-modal-content">
      <p className="ex-eyebrow">{listing.type}</p><h2>{listing.name}</h2><p>⌖ {listing.location}</p><h3>{listing.priceLabel}</h3>{listing.priceNote && <p>{listing.priceNote}</p>}{listing.priceSource && <a href={listing.priceSource} target="_blank" rel="noreferrer">Official entry tariff ↗</a>}
      <div className="ex-stat-row"><div><small>RATING</small><b>{listing.rating === null ? 'Not available' : `★ ${listing.rating} / 5`}</b>{listing.reviewCount !== undefined && <span>{listing.reviewCount} reviews</span>}</div><div><small>CHECK-IN / OPENING</small><b>{listing.checkIn || listing.timings || 'Confirm with provider'}</b><span>{listing.checkOut}</span></div><div><small>INFORMATION FRESHNESS</small><b>{listing.verifiedAt ? new Date(listing.verifiedAt).toLocaleDateString() : 'Verification date not supplied'}</b></div></div>
      <div className="ex-contacts">{listing.phone && <a href={`tel:${listing.phone.replace(/[^+\d]/g, '')}`}>☎ {listing.phone}</a>}{listing.email && <a href={`mailto:${listing.email}`}>✉ {listing.email}</a>}</div>
      <div className="ex-callout"><b>Why this recommendation?</b><p>This listing is part of the Bhopal {categories[listing.category].title.toLowerCase()} directory. Compare its location, tariff and available details with your plans.</p></div>
      <h3>OVERVIEW</h3><p>{listing.overview}</p>{listing.bestFor && <p><b>Amenities / best for:</b> {listing.bestFor}</p>}{listing.busyTime && <p><b>Busy periods:</b> {listing.busyTime}</p>}
      <div className="ex-distance"><h3>Distance from your starting point</h3><strong>{distance !== null ? `${distance.toFixed(1)} km` : 'Distance unavailable'}</strong><span>Straight-line estimate</span><p>Based on: {ex.startingPoint.label} → {listing.name}</p><i>Actual road distance may be longer than the straight-line estimate.</i></div>
      <p className="ex-notice">Notice: {listing.approved ? 'This provider listing has been approved for publication.' : 'Destination guide information and estimated prices require direct confirmation.'} Availability and current tariffs must be confirmed with the service.</p>
      <footer><button onClick={() => { ex.setDetail(null); ex.setReport(listing); }}>⚑ Report incorrect info</button><button onClick={() => ex.setDetail(null)}>× Cancel</button><button onClick={() => { ex.setDetail(null); ex.setWays(listing); }}>⌖ Ways to Reach</button><AddToTrip listing={listing} /></footer>
    </div></Modal>}
    {ways && <Modal title="↗ Ways to Reach & Transit Guidance" onClose={() => ex.setWays(null)}><div className="ex-modal-content"><p>From current starting point: <b>{ex.startingPoint.label}</b></p>
      <div className="ex-stat-row"><div><small>DISTANCE</small><b>{distanceKm(ex.startingPoint.coordinates, ways.coordinates)?.toFixed(1) ?? 'Unavailable'}{ways.coordinates && ex.startingPoint.coordinates ? ' km' : ''}</b><span>Straight-line estimate</span></div><div><small>DRIVE TIME</small><b>Check live route</b><span>Traffic dependent</span></div><div><small>ROUTE PATH</small><b>{ex.startingPoint.label} → {ways.name}</b><span>Open Maps to calculate</span></div></div>
      <h3>AVAILABLE TRANSIT MODES</h3>{ways.transport ? Object.entries(ways.transport).map(([mode, info]) => <div className="ex-transit-row" key={mode}><div><b>{mode}</b><p>{money(info.fare)} {mode === 'Bus' || mode === 'Train' ? '/ person' : '/ vehicle'} · estimate</p></div><span>{info.duration}</span></div>) : ['Auto-Rickshaw / Cab', 'City Bus / Transit', 'Walking / Stroll'].map((mode) => <div className="ex-transit-row" key={mode}><b>{mode}</b><span>Check availability and route</span></div>)}
      <p className="ex-notice">Travel times, service availability and fares require current confirmation. No live road routing feed is connected.</p>
      <footer><a className="ex-primary" href={`${stayDirections(ways)}${ex.startingPoint.mode === 'current' ? '' : `&origin=${encodeURIComponent(ex.startingPoint.coordinates ? `${ex.startingPoint.coordinates.latitude},${ex.startingPoint.coordinates.longitude}` : ex.startingPoint.label)}`}`} target="_blank" rel="noreferrer">Open in Google Maps ↗</a><button onClick={() => ex.setWays(null)}>Close</button></footer>
    </div></Modal>}
    {ex.report && <Modal title="⚠ Report Incorrect Information" onClose={() => ex.setReport(null)}><ReportForm key={ex.report.key} listing={ex.report} /></Modal>}
    {ex.modal === 'starting' && <Modal title="Your starting point" onClose={() => ex.setModal(null)} wide><StartingPoint /></Modal>}
    {ex.modal === 'profile' && <TravellerProfile />}
    {ex.modal === 'notifications' && <Modal title="Notifications" onClose={() => ex.setModal(null)}><div className="ex-modal-content">{ex.notifications.length ? ex.notifications.map((notice, i) => <p className="ex-notice" key={i}>{notice}</p>) : <p>You’re all caught up. Trip and report updates will appear here.</p>}</div></Modal>}
    {ex.modal === 'compare' && <Modal title="⚖ Compare Listings" onClose={() => ex.setModal(null)} wide><div className="ex-modal-content"><p>Comparing {ex.comparison.length} of 3 maximum services · prices adjusted for {ex.persons} person(s).</p>{!ex.comparison.length && <p>Select the ⚖ icon on listings to compare them.</p>}<div className="ex-compare">{ex.comparison.map((item) => { const total = personTotal(item, ex.persons); return <article key={item.key}><button className="ex-remove" onClick={() => ex.toggleCompare(item)} aria-label={`Remove ${item.name} from comparison`}>×</button><Gallery listing={item} /><h3>{item.name}</h3><span className="ex-tag">{item.type}</span><dl><dt>Base tariff</dt><dd>{item.priceLabel}</dd><dt>Price / person (shared estimate)</dt><dd>{total === null ? 'Not supplied' : money(total / ex.persons)}</dd><dt>Total for {ex.persons} person(s)</dt><dd>{total === null ? 'Not supplied' : money(total)}</dd><dt>Rating</dt><dd>{item.rating === null ? 'Not supplied' : `★ ${item.rating}`}</dd><dt>Distance (straight-line estimate)</dt><dd>{distanceKm(ex.startingPoint.coordinates, item.coordinates)?.toFixed(1) ?? 'Not supplied'}{item.coordinates ? ' km' : ''}</dd></dl><AddToTrip listing={item} /></article>; })}</div><small>Room/vehicle prices stay flat; explicit per-person tariffs scale by traveller count. Room capacity is not supplied.</small></div></Modal>}
  </>;
}
