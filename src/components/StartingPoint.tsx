import { useState } from 'react';
import { cityCentre, useExplorer } from '../context/ExplorerContext';
import { coordinatesFrom } from '../utils/staySearch';
export default function StartingPoint() {
  const { startingPoint, setStartingPoint } = useExplorer();
  const [manual, setManual] = useState(startingPoint.mode === 'manual');
  const [label, setLabel] = useState('');
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');
  const [status, setStatus] = useState('');
  const [locating, setLocating] = useState(false);
  function locate() {
    setManual(false); setStatus('');
    if (!navigator.geolocation) { setStatus('Location is unavailable. Select the city centre or enter a starting point.'); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition((position) => {
      setStartingPoint({ mode: 'current', label: 'My current location', coordinates: coordinatesFrom(position.coords.latitude, position.coords.longitude) }); setLocating(false);
    }, () => { setStatus('Location could not be accessed. Allow access and retry, or continue with the city centre.'); setLocating(false); }, { timeout: 10000, maximumAge: 300000 });
  }
  return <section className="ex-starting"><div className="ex-section-title"><strong>CHOOSE HOW DISTANCE SHOULD BE CALCULATED</strong><span className="ex-tag">Optional</span></div>
    <div className="ex-toggle-row">
      <button aria-pressed={startingPoint.mode === 'city' && !manual} onClick={() => { setStartingPoint(cityCentre); setManual(false); }}>{startingPoint.mode === 'city' && !manual ? '✓ ' : ''}Use selected city centre</button>
      <button aria-pressed={startingPoint.mode === 'current' && !manual} disabled={locating} onClick={locate}>{locating ? 'Finding location…' : '◎ Use my current location'}</button>
      <button aria-pressed={manual} onClick={() => setManual(true)}>⌖ Enter a starting point manually</button>
    </div>
    {manual && <form className="ex-manual" onSubmit={(event) => { event.preventDefault(); const coordinates = coordinatesFrom(latitude, longitude); if ((latitude || longitude) && !coordinates) { setStatus('Enter valid latitude and longitude, or leave both blank.'); return; } setStartingPoint({ mode: 'manual', label: label.trim(), coordinates }); setStatus('Starting point updated.'); }}>
      <label>Starting address<input required value={label} onChange={(event) => setLabel(event.target.value)} placeholder="Street address or landmark" /></label>
      <label>Latitude (optional)<input type="number" min="-90" max="90" step="any" value={latitude} onChange={(event) => setLatitude(event.target.value)} /></label>
      <label>Longitude (optional)<input type="number" min="-180" max="180" step="any" value={longitude} onChange={(event) => setLongitude(event.target.value)} /></label>
      <button className="ex-primary">Use starting point</button><small>Coordinates enable distance estimates. An address alone can be used in Google Maps.</small>
    </form>}
    <p role="status">{status}</p><small><i>Location permission is optional. You can continue browsing without sharing your location.</i></small>
    <div className="ex-starting-footer"><span>⌖ Active distance starting point: <b>{startingPoint.label}</b></span><button onClick={() => { setStartingPoint(cityCentre); setManual(false); }}>Reset to City Centre</button></div>
  </section>;
}
