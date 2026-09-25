# Traveller website update

Bhopal is the available destination. Other homepage destinations are Coming Soon, including direct links to their directory routes. The global city selector reflects availability. Existing provider/admin authentication and database moderation operations are retained.

## Implemented

- Persistent navigation, contextual global search, portal navigation, dynamic comparison/trip badges, session notifications, traveller profile, expanded sidebar.
- Shared starting point: city reference, optional device location, or manual address with optional coordinates. Current location is never requested automatically.
- Direct category directories with combined name/address search, autocomplete, type/diet/distance filters, sort, reset, real result counts and persistent trip widget.
- Saved favourite snapshots, up to three compared listings, reusable galleries/detail/report/directions dialogs, and nearby transport selection. Per-mode trip additions remain distinct and indicate added state.
- Trip quantities, traveller count, integer-paise calculations, traveller-sensitive price units, flat vehicle pricing, budget adjustments, snapshot duplication/restoration, share/text export and print-to-PDF.
- Provider status filters and preview; photo import/upload, removal, cover order, file previews and sectioned registration. Uploaded image URLs are imported as files into the existing storage flow, not inserted into an unsupported database URL column.
- Expanded help contacts, transit guidance and FAQ accordions. Existing help submission is retained.

## Data and asset limits

This repository does not provide verification evidence for every sample listing, a licensed scenic Bhopal hero photo, a rating/review feed, live travel times, fare updates or provider analytics. The interface does not invent them. The home hero is an illustrated brand panel, not a photo falsely attributed to Manua Bhan Ki Tekri. Samples say Destination guide; database-approved listings say Provider approved. These labels do not claim government tariff/GPS verification. No arbitrary listing counts, VS identity, monthly growth percentage or verification dates are displayed.

Provider rows can supply optional `stay_type`, `food_type`, `place_type`, `diet`, `rating` (0–5), `review_count`, `verified_at`, `contact_email`, `check_in` and `check_out`. Their schema and data sources must be established before these can be populated through registration. Missing values are shown as unavailable. The existing core listing fields and media/document storage remain in use. No schema change or database migration was applied.

Coordinates use the existing latitude/longitude fields. The Bhopal reference is 23.250 N, 77.420 E from the district website, an approximate city reference rather than a property location. Manual addresses without coordinates can route through Google Maps but cannot calculate local straight-line distances. Samples have no invented coordinates. Existing nearby guide distances and transit prices are labelled estimates; coordinate distance filters exclude entries with no coordinates.

Trip prices without a tariff remain pending and are excluded from the numeric total. Room/vehicle capacity is not known; the UI discloses this. PDF export uses the browser's Print → Save as PDF. Notifications are local session activity, not an unimplemented server push feed. The profile is a local Traveller profile; portal selection does not grant permissions or replace authentication.

## Sources checked

- Bhopal reference coordinates: https://bhopal.nic.in/en/demography/
- District emergency contacts: https://bhopal.nic.in/en/helpline/
- Tourism helpline and operating hours: https://www.mptourism.com/sitemap.php
- Bhopal season and transit hubs: https://www.mptourism.com/destination-bhopal.php
- Google Maps directions: https://developers.google.com/maps/documentation/urls/get-started#directions-action

The requested municipal number 155304 could not be confirmed from an accessible official source during this update; the fifth card uses unified emergency response 112. MP Tourism is not labelled 24/7 because its official support hours are limited. Local transit guidance does not claim unverified official fares.

## Filter completion update

Provider creation and editing now capture category-specific listing types and food diet. Apply `supabase/migrations/202609250001_listing_classification.sql` to the existing database before saving these classifications. This migration is prepared locally; it has not been applied to the hosted database. It adds nullable fields without assigning unverified classifications to existing records.

All active directories share tested filtering logic. Diet and distance have explicit unknown-data options. Distance ranges, nearest sorting, diet choices and rating sorting are unavailable when the source data cannot support them. Sample guide distances are not substituted for distances from a traveller's starting point.

City reference coordinates are excluded from property distances and Maps destinations; provider creation no longer offers a city-centre placeholder. Android now declares coarse and fine location permissions. Device permission behavior still needs device verification.

## Appearance adjustment

At the user's request, the traveller redesign and all its features are retained. The extra filter-availability notices from the filter follow-up are collapsed under “About filter availability”, and the new provider classification fields are under “Additional listing details”. The provider city-centre reference is viewable without overwriting property coordinates. This keeps the earlier page layout while retaining the later functionality fixes.

## Restored opening-conversation appearance

The user identified the desired UI as the version present before the first “check the changes” request. The original traveller redesign, directory controls, provider onboarding and all original feature screens are retained. Later classification controls, filter-availability panels and styling adjustments have been removed from the visible UI. Classification utilities and the migration remain in the repository, but provider classification entry is not currently exposed. Tested directory filtering, reference-coordinate exclusion, coordinate validation and Android location permissions remain.

## Pricing and nearby-trip layout

Food estimates are now per person (previous paired estimates are divided by two). Existing saved trips, restored snapshots, favourites and provider/admin views normalize legacy paired tariffs. Per-entry place tickets scale with traveller count. Unknown prices remain unknown and are excluded from totals.

Van Vihar walking entry is listed as ₹25 per Indian visitor, with foreign visitor and activity exclusions explained. Source checked: https://vanviharnationalpark.org/tourist/gate-charges (published tariff effective 01.11.2024). Other unsupplied sample entry fees remain “confirm with venue”; supplied provider prices are displayed.

Nearby trips use the supplied reference layout with a desktop sidebar, contextual header, distance filters, right-hand transit options and trip summary. On small screens these stack. Guide distances are usable only for the Bhopal city starting point and remain labelled as estimates. No unsupported train service or verification badge has been added.

The Arrange your journey panel and its automatic inter-stop transport charges have been removed. Only transit explicitly added to the trip is counted, once, in the total. The trip page links to Nearby Trips for fare selection.
