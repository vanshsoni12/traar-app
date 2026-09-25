import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { supabase } from "../supabaseClient";
import "./StaysPage.css";
import {
  coordinatesFrom, distanceKm, filterAndSortStays, matchesStay, numericValue,
  stayDirections, stayTypeFrom, stayTypes, suggestionLabel,
  type Coordinates, type SearchableStay, type StaySort,
} from "../utils/staySearch";

type Stay = SearchableStay & {
  id: number;
  listingId?: string;
  emoji: string;
  type: string;
  name: string;
  location: string;
  price: string;
  tripPrice: number;
  image: string;
  overview: string;
  checkIn: string;
  checkOut: string;
  busyTime: string;
  bestFor: string;
};

type ProviderListing = {
  id: string;
  category: string;
  stay_type?: string | null;
  rating?: number | null;
  latitude?: number | null;
  longitude?: number | null;
  name: string;
  description: string | null;
  address: string;
  price: number | null;
  price_unit: string | null;
  amenities: string[] | null;
  opening_hours: string | null;
  status: string;
  listing_images: { storage_path: string; sort_order: number }[];
};

const stays: Stay[] = [
  {
    id: 101,
    stayType: "Hotel",
    rating: null,
    coordinates: null,
    emoji: "🏰",
    type: "HERITAGE HOTEL",
    name: "Jehan Numa Palace",
    location: "Shamla Hills, Bhopal",
    price: "₹8,000 / night (estimate)",
    tripPrice: 8000,
    numericPrice: 8000,
    image:
      "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80",
    overview:
      "A premium heritage-style stay near Bhopal’s hills, suitable for travellers looking for a peaceful and comfortable hotel experience.",
    checkIn: "Check-in after 2:00 PM",
    checkOut: "Check-out before 12:00 PM",
    busyTime: "Usually busiest on Friday evening, Saturday and Sunday.",
    bestFor: "Couples, families and heritage travellers",
  },
  {
    id: 102,
    stayType: "Hotel",
    rating: null,
    coordinates: null,
    emoji: "🌅",
    type: "LUXURY HOTEL",
    name: "Noor-Us-Sabah Palace",
    location: "VIP Road, Kohefiza, Bhopal",
    price: "₹6,000 / night (estimate)",
    tripPrice: 6000,
    numericPrice: 6000,
    image:
      "https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&w=1200&q=80",
    overview:
      "A scenic luxury stay close to Upper Lake and VIP Road, designed for travellers who want comfortable rooms and a relaxed city break.",
    checkIn: "Check-in after 2:00 PM",
    checkOut: "Check-out before 12:00 PM",
    busyTime: "Weekends and holiday evenings can be busy.",
    bestFor: "Families, business visitors and lake-view stays",
  },
  {
    id: 103,
    stayType: "Hotel",
    rating: null,
    coordinates: null,
    emoji: "🏨",
    type: "BUSINESS HOTEL",
    name: "Golden Tulip Bhopal",
    location: "M.P. Nagar Zone 1, Bhopal",
    price: "₹4,000 / night (estimate)",
    tripPrice: 4000,
    numericPrice: 4000,
    image:
      "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?auto=format&fit=crop&w=1200&q=80",
    overview:
      "A practical city stay around the commercial area of M.P. Nagar, useful for business trips, short city visits and easy local access.",
    checkIn: "Check-in after 2:00 PM",
    checkOut: "Check-out before 12:00 PM",
    busyTime: "Most active on weekday mornings and evenings.",
    bestFor: "Business travellers and short city visits",
  },
  {
    id: 104,
    stayType: "Hotel",
    rating: null,
    coordinates: null,
    emoji: "🛏️",
    type: "HOTEL",
    name: "Hotel Amer Palace",
    location: "M.P. Nagar Zone 1, Bhopal",
    price: "₹2,500 / night (estimate)",
    tripPrice: 2500,
    numericPrice: 2500,
    image:
      "https://images.unsplash.com/photo-1568084680786-a84f91d1153c?auto=format&fit=crop&w=1200&q=80",
    overview:
      "A budget-friendly hotel option near M.P. Nagar for travellers who want a convenient base for exploring Bhopal.",
    checkIn: "Check-in after 1:00 PM",
    checkOut: "Check-out before 11:00 AM",
    busyTime: "Can be busier during weekends and local events.",
    bestFor: "Students, solo travellers and budget trips",
  },
];

export default function StaysPage() {
  const { city } = useParams();
  const { addItem } = useTrip();
  const [providerStays, setProviderStays] = useState<Stay[]>([]);
  const [loadingProviderStays, setLoadingProviderStays] = useState(true);
  const [providerError, setProviderError] = useState("");
  const [query, setQuery] = useState("");
  const [stayType, setStayType] = useState("all");
  const [sort, setSort] = useState<StaySort>("recommended");
  const [travellerLocation, setTravellerLocation] = useState<Coordinates | null>(null);
  const [locating, setLocating] = useState(false);
  const [locationError, setLocationError] = useState("");

  function requestLocation() {
    if (locating) return;
    setLocationError("");
    if (!navigator.geolocation) {
      setLocationError("Location is unavailable in this browser. You can still search or use another sort.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setTravellerLocation(coordinatesFrom(position.coords.latitude, position.coords.longitude));
        setLocating(false);
      },
      (error) => {
        setLocationError(error.code === 1
          ? "Location access was denied. Allow location in your browser and retry, or choose another sort."
          : "Your location could not be found. Retry or choose another sort.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 },
    );
  }

  function changeSort(value: StaySort) {
    setSort(value);
    if (value === "nearest" && !travellerLocation) requestLocation();
  }

  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [reportingStay, setReportingStay] = useState<Stay | null>(null);
  const [reportType, setReportType] = useState("Incorrect information");
  const [reportMessage, setReportMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [message, setMessage] = useState("");

  const cityName = city
    ? city.split("-").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ")
    : "Bhopal";

  function openReport(stay: Stay) {
    setMessage("");
    setReportType("Incorrect information");
    setReportMessage("");
    setReportingStay(stay);
  }
  useEffect(() => {
    let cancelled = false;
    async function loadProviderStays() {
      setLoadingProviderStays(true);
      setProviderError("");
      setProviderStays([]);

      const { data, error } = await supabase
        .from("listings")
        .select(
          "*, listing_images(storage_path, sort_order)"
        )
        .eq("category", "STAY")
        .eq("status", "approved")
        .ilike("address", `%${cityName}%`)
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        setProviderError("Live provider stays could not be loaded yet.");
        setLoadingProviderStays(false);
        return;
      }

      const formattedStays: Stay[] = ((data || []) as ProviderListing[]).map(
        (listing, index) => {
          const firstImage = [...(listing.listing_images || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          )[0];

          const imageUrl = firstImage
            ? supabase.storage
                .from("listing-images")
                .getPublicUrl(firstImage.storage_path).data.publicUrl
            : "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1200&q=80";

          const amount = numericValue(listing.price);
          const numericPrice = amount !== null && amount >= 0 ? amount : null;
          const rating = numericValue(listing.rating);
          const stayType = stayTypeFrom(listing.stay_type) ?? stayTypeFrom(listing.category);
          return {
            stayType,
            numericPrice,
            rating: rating !== null && rating >= 0 && rating <= 5 ? rating : null,
            coordinates: coordinatesFrom(listing.latitude, listing.longitude),
            id: 10000 + index,
            listingId: listing.id,
            emoji: "🏨",
            type: stayType?.toUpperCase() || "LOCAL STAY",
            name: listing.name,
            location: listing.address,
            price:
              numericPrice === null
                ? "Price on request"
                : `₹${numericPrice.toLocaleString("en-IN")} ${
                    listing.price_unit || ""
                  }`,
            tripPrice: Number(listing.price || 0),
            image: imageUrl,
            overview:
              listing.description ||
              "A verified local stay listed by a TRAAR provider.",
            checkIn: "Please confirm directly with the property",
            checkOut: "Please confirm directly with the property",
            busyTime:
              "Contact the property for current availability and busy periods.",
            bestFor:
              listing.amenities?.length
                ? listing.amenities.join(" • ")
                : "Local travellers and visitors",
          };
        }
      );

      setProviderStays(formattedStays);
      setLoadingProviderStays(false);
    }

    loadProviderStays();
    return () => { cancelled = true; };
  }, [cityName]);

  const allStays = [...providerStays, ...(cityName.toLowerCase() === "bhopal" ? stays : [])];
  const filteredStays = filterAndSortStays(allStays, query, stayType, sort, travellerLocation);
  const suggestions = allStays.filter((stay) => matchesStay(stay, query) &&
    (stayType === "all" || stay.stayType === stayType)).slice(0, 12);

  async function submitReport() {
    if (!reportingStay) return;

    if (!reportMessage.trim()) {
      setMessage("Please explain the problem before submitting.");
      return;
    }

    setSubmittingReport(true);
    setMessage("");

    const { error } = await supabase.from("user_reports").insert({
      listing_id: reportingStay.listingId || null,
      report_type: `${reportType} — ${reportingStay.name}`,
      message: `Stay: ${reportingStay.name}\nLocation: ${reportingStay.location}\n\nReport: ${reportMessage.trim()}`,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      setSubmittingReport(false);
      return;
    }

    setSubmittingReport(false);
    setReportingStay(null);
    setMessage("Thank you. Your report was sent to the TRAAR administrators.");
  }

  return (
    <main className="stays-page">
      <section className="stays-header">
        <p className="stays-label">FIND YOUR STAY</p>
        <h1>Stays in {cityName}</h1>
        <p>Hotels and comfortable places to stay during your trip.</p>
      </section>

      {message && !reportingStay && (
        <p className="stay-report-success">{message}</p>
      )}
            {loadingProviderStays && (
        <p className="stay-report-success">Loading live local stays...</p>
      )}

      {providerError && (
        <p className="stay-report-error">{providerError}</p>
      )}

      <section className="stay-search-controls" aria-label="Find a stay">
        <div className="stay-search-field">
          <label htmlFor="stay-search">Search stays</label>
          <div className="stay-search-input">
            <input id="stay-search" type="search" list="stay-suggestions"
              value={query} onChange={(event) => setQuery(event.target.value)}
              placeholder="Stay name, area or address" autoComplete="off" />
            <button type="button" onClick={() => setQuery("")} disabled={!query}>Clear search</button>
          </div>
          <datalist id="stay-suggestions">
            {suggestions.map((stay) => <option key={stay.id} value={suggestionLabel(stay)} />)}
          </datalist>
        </div>
        <div>
          <label htmlFor="stay-type">Stay type</label>
          <select id="stay-type" value={stayType} onChange={(event) => setStayType(event.target.value)}>
            <option value="all">All types</option>
            {stayTypes.map((type) => <option key={type} value={type}>{type}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="stay-sort">Sort by</label>
          <select id="stay-sort" value={sort} onChange={(event) => changeSort(event.target.value as StaySort)}>
            <option value="recommended">Recommended/default</option>
            <option value="nearest">Nearest first</option>
            <option value="price">Price: low to high</option>
            <option value="rating">Rating: highest first</option>
          </select>
        </div>
      </section>
      <div className="stay-search-status" role="status">
        <p>{filteredStays.length} stay{filteredStays.length === 1 ? "" : "s"} found{loadingProviderStays ? " · Loading more stays…" : ""}</p>
        {sort === "nearest" && <>
          {locating && <p>Finding your location…</p>}
          {locationError && <p>{locationError} <button type="button" onClick={requestLocation} disabled={locating}>Retry location</button></p>}
          {travellerLocation && <p>Sorted by straight-line distance. Stays without a location appear last.</p>}
          {!loadingProviderStays && !filteredStays.some((stay) => stay.coordinates) &&
            <p>Locations are not available for these stays, so their distance order is unchanged.</p>}
        </>}
        {sort === "rating" && !loadingProviderStays && !filteredStays.some((stay) => stay.rating !== null) &&
          <p>Ratings are not available for these stays, so their order is unchanged.</p>}
      </div>
      {!loadingProviderStays && filteredStays.length === 0 && (
        <div className="stay-search-empty">
          <h2>No stays found</h2>
          <p>Try another name, area or stay type.</p>
          {(query || stayType !== "all") && <button type="button" onClick={() => { setQuery(""); setStayType("all"); }}>Reset search and type</button>}
        </div>
      )}
      <section className="stays-grid" aria-label="Stay listings" aria-busy={loadingProviderStays}>
       {filteredStays.map((stay) => (
          <article className="stay-card" key={stay.id}>
            <img
              className="stay-image"
              src={stay.image}
              alt={`Representative image for ${stay.name}`}
            />

            <div className="stay-info">
              <p className="stay-type">{stay.type}</p>
              <h2>{stay.name}</h2>
              <p className="stay-location">📍 {stay.location}</p>

              {stay.rating !== null && <p className="stay-sort-detail">★ {stay.rating} / 5</p>}
              {sort === "nearest" && travellerLocation && stay.coordinates &&
                <p className="stay-sort-detail">{distanceKm(travellerLocation, stay.coordinates)?.toFixed(1)} km away · straight-line</p>}
              <div className="stay-footer">
                <strong>{stay.price}</strong>

                <div className="stay-actions">
                  <div className="stay-secondary-actions">
                    <button
                      className="stay-details-button"
                      onClick={() => setSelectedStay(stay)}
                    >
                      View details
                    </button>

                    <button
                      className="stay-report-button"
                      onClick={() => openReport(stay)}
                    >
                      Report issue
                    </button>
                  </div>

                  <button
                    className="stay-trip-button"
                    onClick={() =>
                      addItem({
                        id: stay.id,
                        category: "STAY",
                        name: stay.name,
                        detail: "1 night",
                        price: stay.tripPrice,
                        emoji: stay.emoji,
                      })
                    }
                  >
                    Add to My Trip →
                  </button>
                </div>
                </div>
              </div>
          </article>
        ))}
      </section>

      {selectedStay && (
        <div
          className="stay-details-backdrop"
          onClick={() => setSelectedStay(null)}
        >
          <section
            className="stay-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="stay-details-close"
              onClick={() => setSelectedStay(null)}
            >
              ×
            </button>

            <img
              src={selectedStay.image}
              alt={`Representative image for ${selectedStay.name}`}
            />

            <div className="stay-details-content">
              <p>{selectedStay.type}</p>
              <h2>{selectedStay.name}</h2>
              <span>📍 {selectedStay.location}</span>

              <h3>Overview</h3>
              <p>{selectedStay.overview}</p>

              <div className="stay-detail-grid">
                <article>
                  <small>CHECK-IN</small>
                  <strong>{selectedStay.checkIn}</strong>
                </article>

                <article>
                  <small>CHECK-OUT</small>
                  <strong>{selectedStay.checkOut}</strong>
                </article>

                <article>
                  <small>BUSY PERIOD</small>
                  <strong>{selectedStay.busyTime}</strong>
                </article>

                <article>
                  <small>BEST FOR</small>
                  <strong>{selectedStay.bestFor}</strong>
                </article>
              </div>

              <div className="stay-details-bottom">
                <strong>{selectedStay.price}</strong>

                <div className="stay-details-actions">
                  <a
                    href={stayDirections(selectedStay)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    📍 Way to reach
                  </a>

                  <button
                    onClick={() => {
                      addItem({
                        id: selectedStay.id,
                        category: "STAY",
                        name: selectedStay.name,
                        detail: "1 night",
                        price: selectedStay.tripPrice,
                        emoji: selectedStay.emoji,
                      });

                      setSelectedStay(null);
                    }}
                  >
                    Add to My Trip →
                  </button>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {reportingStay && (
        <div
          className="stay-report-backdrop"
          onClick={() => setReportingStay(null)}
        >
          <section
            className="stay-report-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="stay-report-close"
              onClick={() => setReportingStay(null)}
            >
              ×
            </button>

            <p>REPORT A PROBLEM</p>
            <h2>{reportingStay.name}</h2>
            <span>Help us keep TRAAR stay information accurate.</span>

            <label>
              Report type
              <select
                value={reportType}
                onChange={(event) => setReportType(event.target.value)}
              >
                <option>Incorrect information</option>
                <option>Wrong location</option>
                <option>Closed or unavailable</option>
                <option>Safety concern</option>
                <option>Other</option>
              </select>
            </label>

            <label>
              Explain the issue
              <textarea
                rows={4}
                value={reportMessage}
                onChange={(event) => setReportMessage(event.target.value)}
                placeholder="Example: The price shown is no longer correct."
              />
            </label>

            {message && <p className="stay-report-error">{message}</p>}

            <button
              className="stay-report-submit"
              onClick={submitReport}
              disabled={submittingReport}
            >
              {submittingReport ? "Sending..." : "Send report"}
            </button>
          </section>
        </div>
      )}
    </main>
  );
}