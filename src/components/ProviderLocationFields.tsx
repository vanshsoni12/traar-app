import { useId } from 'react';
import { listingStates, suggestedDestinations } from '../utils/listingLocation';

export default function ProviderLocationFields({ state, city, onStateChange, onCityChange }: {
  state: string; city: string; onStateChange: (value: string) => void; onCityChange: (value: string) => void;
}) {
  const suggestionsId = useId();
  return <div className="add-listing-two-columns provider-edit-two-columns">
    <label>State / Union Territory *
      <select required value={state} onChange={(event) => { onStateChange(event.target.value); onCityChange(''); }}>
        <option value="">Select state</option>
        {listingStates.map(value => <option key={value}>{value}</option>)}
      </select>
    </label>
    <label>City / Destination *
      <input required list={suggestionsId} value={city} onChange={(event) => onCityChange(event.target.value)} placeholder="Enter city or destination" autoComplete="address-level2" />
      <datalist id={suggestionsId}>{suggestedDestinations.filter(([, region]) => region === state).map(([name]) => <option key={name} value={name} />)}</datalist>
    </label>
  </div>;
}
