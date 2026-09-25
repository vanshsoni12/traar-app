export function classificationFields(category: string, type: string, diet: string) {
  const field = { STAY: 'stay_type', FOOD: 'food_type', PLACE: 'place_type', TRAVEL: 'travel_type' }[category];
  return { ...(field ? { [field]: type.trim() || null } : {}), ...(category === 'FOOD' ? { diet: diet || null } : {}) };
}
