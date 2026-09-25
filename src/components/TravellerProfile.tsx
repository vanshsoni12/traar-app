import { Link, useLocation } from 'react-router-dom';
import { useExplorer } from '../context/ExplorerContext';
import { useTrip } from '../context/TripContext';
import { useSelectedCity } from '../context/CityContext';
import { suggestedDestinations } from '../utils/listingLocation';
import Modal from './Modal';
import './TravellerProfile.css';

function ProfileIcon({ kind }: { kind: 'person' | 'heart' | 'trip' | 'pin' | 'compass' }) {
  const paths = {
    person: <><circle cx="12" cy="8" r="3.5" /><path d="M5 21v-2a7 7 0 0 1 14 0v2" /></>,
    heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z" />,
    trip: <><rect x="4" y="7" width="16" height="14" rx="3" /><path d="M9 7V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v3M8 11v6m8-6v6" /></>,
    pin: <><path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" /><circle cx="12" cy="10" r="2.5" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z" /></>,
  };
  return <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[kind]}</svg>;
}

export default function TravellerProfile() {
  const ex = useExplorer();
  const { items } = useTrip();
  const { city } = useSelectedCity();
  const { pathname } = useLocation();
  const routeCity = pathname.match(/^\/destinations\/([^/]+)/)?.[1]?.replace(/-/g, ' ');
  const selectedCity = routeCity || city;
  const destination = suggestedDestinations.find(([name]) => name.toLowerCase() === selectedCity.toLowerCase());
  const cityName = destination?.[0] || selectedCity;
  const close = () => ex.setModal(null);

  return <Modal title="Your profile" className="traveller-profile-modal" onClose={close}>
    <div className="traveller-profile">
      <section className="profile-identity" aria-label="Traveller profile">
        <div className="profile-avatar"><ProfileIcon kind="person" /></div>
        <div><span className="profile-kicker">EXPLORE AT YOUR OWN PACE</span><h3>Traveller</h3><p>Your places. Your plans. Your journey.</p></div>
        <span className="profile-role">Traveller</span>
      </section>

      <section className="profile-saved" aria-label="Your saved plans">
        <Link to="/favourites" onClick={() => { ex.setQuery(''); close(); }} className="profile-stat">
          <span className="profile-stat-top"><ProfileIcon kind="heart" /><span aria-hidden="true">↗</span></span>
          <strong>{ex.favourites.length}</strong><span>Saved favourites</span>
          <small>{ex.favourites.length ? 'Revisit your favourite finds' : 'Keep places you love close'}</small>
        </Link>
        <Link to="/my-trip" onClick={close} className="profile-stat">
          <span className="profile-stat-top"><ProfileIcon kind="trip" /><span aria-hidden="true">↗</span></span>
          <strong>{items.length}</strong><span>Trip selections</span>
          <small>{items.length ? 'Pick up where you left off' : 'Your next adventure starts here'}</small>
        </Link>
      </section>

      <section className="profile-preferences" aria-labelledby="profile-preferences-title">
        <h3 id="profile-preferences-title">Your travel details</h3>
        <div className="profile-detail-row">
          <span className="profile-detail-icon"><ProfileIcon kind="pin" /></span>
          <div><span>Selected destination</span><strong>{cityName}</strong>{destination && <small>{destination[1]}</small>}</div>
          <Link to="/" onClick={close}>Explore <span aria-hidden="true">↗</span></Link>
        </div>
        <div className="profile-detail-row">
          <span className="profile-detail-icon"><ProfileIcon kind="compass" /></span>
          <div><span>Starting point</span><strong>{ex.startingPoint.label}</strong><small>Used for distance estimates</small></div>
          <button type="button" onClick={() => ex.setModal('starting')}>Change</button>
        </div>
      </section>
      <footer className="profile-footer"><p>Your trip and favourites are saved on this device.</p><button type="button" className="ex-primary" onClick={close}>Done <span aria-hidden="true">✓</span></button></footer>
    </div>
  </Modal>;
}
