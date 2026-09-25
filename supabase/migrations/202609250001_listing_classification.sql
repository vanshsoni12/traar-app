-- Optional classifications for traveller filters; existing records stay unknown.
ALTER TABLE public.listings
  ADD COLUMN IF NOT EXISTS stay_type text,
  ADD COLUMN IF NOT EXISTS food_type text,
  ADD COLUMN IF NOT EXISTS place_type text,
  ADD COLUMN IF NOT EXISTS travel_type text,
  ADD COLUMN IF NOT EXISTS diet text;
NOTIFY pgrst, 'reload schema';
