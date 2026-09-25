import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useExplorer } from '../context/ExplorerContext';
import { useTrip } from '../context/TripContext';
import NavigationMenu from './NavigationMenu';
export default function TravellerHeader({ showMenu = true }: { showMenu?: boolean }) {
  const ex = useExplorer(); const { items } = useTrip(); const navigate = useNavigate(); const { pathname } = useLocation();
  const segment = pathname.split('/').pop();
  const placeholder = segment === 'stays' ? 'hotels, hostels, guesthouses…' : segment === 'food' ? 'restaurants, food, dishes…' : segment === 'places' ? 'lakes, heritage, attractions…' : segment === 'nearby' ? 'excursions & nearby…' : 'stays, food, places…';
  const portal = pathname.startsWith('/provider') ? 'provider' : pathname.startsWith('/admin') ? 'admin' : 'traveller';
  return <header className="traveller-topbar">
    {showMenu && <NavigationMenu city="Bhopal" />}<Link className="ex-wordmark" to="/">TRAAR<span>PLAN • EXPLORE</span></Link>
    <label className="ex-city"><span className="sr-only">Selected destination</span><select value="bhopal" onChange={() => {}}><option value="bhopal">⌖ Bhopal, MP</option>{['Indore', 'Ujjain', 'Jaipur', 'Udaipur', 'Jaisalmer', 'Goa', 'Agra', 'Varanasi', 'Manali', 'Kochi'].map((city) => <option disabled key={city}>{city} · Coming Soon</option>)}</select></label>
    <button className="ex-from" onClick={() => ex.setModal('starting')}>⌖ From: <b>{ex.startingPoint.label}</b></button>
    <form className="ex-global-search" role="search" onSubmit={(event) => { event.preventDefault(); if (!['stays', 'food', 'places', 'nearby'].includes(segment || '')) navigate('/search'); }}><span>⌕</span><input aria-label="Search TRAAR" value={ex.query} onChange={(event) => ex.setQuery(event.target.value)} placeholder={`Search Bhopal ${placeholder}`} /><button aria-label="Search" type="submit">→</button></form>
    <label><span className="sr-only">Portal</span><select aria-label="Choose portal" value={portal} onChange={(event) => navigate(event.target.value === 'provider' ? '/provider/login' : event.target.value === 'admin' ? '/admin/login' : '/')}><option value="traveller">♙ Traveller</option><option value="provider">Provider Portal</option><option value="admin">Administrator</option></select></label>
    <div className="ex-top-icons"><button aria-label={`Compare ${ex.comparison.length} listings`} onClick={() => ex.setModal('compare')}>⚖<sup>{ex.comparison.length}</sup></button><button aria-label="Notifications" onClick={() => { ex.setReadCount(ex.notifications.length); ex.setModal('notifications'); }}><svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" aria-hidden="true"><path d="M5 9a7 7 0 0 1 14 0v6l2 3H3l2-3Z"/><path d="M9 21h6"/></svg>{ex.notifications.length > ex.readCount && <i className="ex-dot" />}</button><Link to="/my-trip" aria-label={`My trip, ${items.length} items`}>▣<sup>{items.length}</sup></Link><button className="ex-avatar" aria-label="User profile" onClick={() => ex.setModal('profile')}>TR</button></div>
  </header>;
}
