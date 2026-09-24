import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { supabase } from "../supabaseClient";
import "./StaysPage.css";

type Stay = {
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
    emoji: "🏰",
    type: "HERITAGE HOTEL",
    name: "Jehan Numa Palace",
    location: "Shamla Hills, Bhopal",
    price: "₹8,000 / night (estimate)",
    tripPrice: 8000,
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
    emoji: "🌅",
    type: "LUXURY HOTEL",
    name: "Noor-Us-Sabah Palace",
    location: "VIP Road, Kohefiza, Bhopal",
    price: "₹6,000 / night (estimate)",
    tripPrice: 6000,
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
    emoji: "🏨",
    type: "BUSINESS HOTEL",
    name: "Golden Tulip Bhopal",
    location: "M.P. Nagar Zone 1, Bhopal",
    price: "₹4,000 / night (estimate)",
    tripPrice: 4000,
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
    emoji: "🛏️",
    type: "HOTEL",
    name: "Hotel Amer Palace",
    location: "M.P. Nagar Zone 1, Bhopal",
    price: "₹2,500 / night (estimate)",
    tripPrice: 2500,
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

  const [selectedStay, setSelectedStay] = useState<Stay | null>(null);
  const [reportingStay, setReportingStay] = useState<Stay | null>(null);
  const [reportType, setReportType] = useState("Incorrect information");
  const [reportMessage, setReportMessage] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [message, setMessage] = useState("");

  const cityName = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : "Bhopal";

  function openReport(stay: Stay) {
    setMessage("");
    setReportType("Incorrect information");
    setReportMessage("");
    setReportingStay(stay);
  }
    useEffect(() => {
    async function loadProviderStays() {
      setLoadingProviderStays(true);
      setProviderError("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, category, name, description, address, price, price_unit, amenities, opening_hours, status, listing_images(storage_path, sort_order)"
        )
        .eq("category", "STAY")
        .eq("status", "approved")
        .ilike("address", `%${cityName}%`)
        .order("created_at", { ascending: false });

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

          return {
            id: 10000 + index,
            listingId: listing.id,
            emoji: "🏨",
            type: listing.category === "STAY" ? "LOCAL STAY" : listing.category,
            name: listing.name,
            location: listing.address,
            price:
              listing.price === null
                ? "Price on request"
                : `₹${Number(listing.price).toLocaleString("en-IN")} ${
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
  }, [cityName]);

  const allStays = [...providerStays, ...stays];

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

      <section className="stays-grid">
       {allStays.map((stay) => (
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
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedStay.name}, ${selectedStay.location}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions ↗
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