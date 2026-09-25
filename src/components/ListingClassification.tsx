import { stayTypes } from '../utils/staySearch';

export default function ListingClassification({ category, type, diet, onTypeChange, onDietChange }: {
  category: string; type: string; diet: string;
  onTypeChange: (value: string) => void; onDietChange: (value: string) => void;
}) {
  return <>
    <label>Listing type (optional)
      {category === 'STAY' ? <select value={type} onChange={(event) => onTypeChange(event.target.value)}>
        <option value="">Not supplied</option>
        {type && !stayTypes.some((value) => value === type) && <option>{type}</option>}
        {stayTypes.map((value) => <option key={value}>{value}</option>)}
      </select> : <input value={type} onChange={(event) => onTypeChange(event.target.value)} placeholder={category === 'FOOD' ? 'Restaurant, Café, Street food…' : category === 'PLACE' ? 'Museum, Lake, Heritage…' : 'Day trip, Heritage excursion…'} />}
    </label>
    {category === 'FOOD' && <label>Diet classification (optional)
      <select value={diet} onChange={(event) => onDietChange(event.target.value)}>
        <option value="">Not supplied</option>
        {diet && !['Veg', 'Non-Veg', 'Vegan'].includes(diet) && <option>{diet}</option>}
        <option>Veg</option><option>Non-Veg</option><option>Vegan</option>
      </select>
      <small>Only select a classification you can confirm for your service.</small>
    </label>}
  </>;
}
