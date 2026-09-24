import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { supabase } from "../supabaseClient";
import "./PlacesPage.css";

type Place = {
  id: number;
  image: string;
  tag: string;
  name: string;
  location: string;
  fee: string;
  overview: string;
  timings: string;
  busyTime: string;
  bestFor: string;
};

const places: Place[] = [
  {
    id: 301,
    image:
      "https://images.unsplash.com/photo-1609947017136-9daf32a5eb16?auto=format&fit=crop&w=1200&q=80",
    tag: "LAKE & BOAT CLUB",
    name: "Upper Lake (Bhojtal)",
    location: "Bada Talab, Bhopal",
    fee: "Boating available",
    overview:
      "Bhopal’s well-known lakefront, ideal for relaxed views, boating and a peaceful evening near the water.",
    timings: "Best in the morning or near sunset",
    busyTime: "Busy on weekends and public holidays",
    bestFor: "Lake views, boating and photography",
  },
  {
    id: 302,
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    tag: "HERITAGE",
    name: "Taj-ul-Masajid",
    location: "Kohefiza, Bhopal",
    fee: "Historic mosque",
    overview:
      "A landmark mosque in Bhopal known for its grand architecture and historic importance.",
    timings: "Visit during permitted daytime hours",
    busyTime: "More active on Fridays and prayer times",
    bestFor: "Architecture, heritage and respectful sightseeing",
  },
  {
    id: 303,
    image:
      "https://images.unsplash.com/photo-1577083552431-6e5fd01988f7?auto=format&fit=crop&w=1200&q=80",
    tag: "HERITAGE",
    name: "Gauhar Mahal",
    location: "VIP Road, Bhopal",
    fee: "Historic palace",
    overview:
      "A restored heritage building near Upper Lake that reflects Bhopal’s royal and cultural history.",
    timings: "Usually best explored in daylight",
    busyTime: "Can be busy during cultural events",
    bestFor: "Heritage walks and photography",
  },
  {
    id: 304,
    image:
      "https://images.unsplash.com/photo-1535338454770-8be927b5a00b?auto=format&fit=crop&w=1200&q=80",
    tag: "NATURE & WILDLIFE",
    name: "Van Vihar National Park",
    location: "Shyamla Hills, Bhopal",
    fee: "Entry ticket required",
    overview:
      "A green wildlife park beside the lake, suitable for a calm nature-focused outing in the city.",
    timings: "Daytime visit; check seasonal opening hours",
    busyTime: "Usually busy on Saturday and Sunday mornings",
    bestFor: "Nature, wildlife and family visits",
  },
  {
    id: 305,
    image:
      "https://images.unsplash.com/photo-1564399579883-451a5d44ec08?auto=format&fit=crop&w=1200&q=80",
    tag: "MUSEUM",
    name: "Museum of Mankind",
    location: "Shyamla Hills, Bhopal",
    fee: "Entry ticket required",
    overview:
      "An open-air museum that introduces visitors to Indian communities, traditions and cultural heritage.",
    timings: "Usually open during daytime",
    busyTime: "Weekends and school holiday afternoons",
    bestFor: "Culture, learning and family visits",
  },
];

export default function PlacesPage() {
  const { city } = useParams();
  const { addItem } = useTrip();

  const [selectedPlace, setSelectedPlace] = useState<Place | null>(null);
  const [reportingPlace, setReportingPlace] = useState<Place | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [message, setMessage] = useState("");

  const cityName = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : "Bhopal";

  function addPlaceToTrip(place: Place) {
    addItem({
      id: place.id,
      category: "PLACE",
      name: place.name,
      detail: place.location,
      price: 0,
      emoji: "📍",
    });
  }

  async function submitReport() {
    if (!reportingPlace || !reportMessage.trim()) {
      setMessage("Please write the issue before sending the report.");
      return;
    }

    const { error } = await supabase.from("user_reports").insert({
      listing_id: null,
      report_type: "Place listing issue",
      message: `${reportingPlace.name} (${reportingPlace.location}): ${reportMessage.trim()}`,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setReportingPlace(null);
    setReportMessage("");
    setMessage("Thank you. Your report has been sent.");
  }

  return (
    <main className="places-page">
      <section className="places-header">
        <p className="places-label">EXPLORE THE CITY</p>
        <h1>Places to visit in {cityName}</h1>
        <p>Discover lakes, heritage sites, museums and nature spots.</p>
      </section>

      {message && <p className="places-page-message">{message}</p>}

      <section className="places-grid">
        {places.map((place) => (
          <article className="place-card" key={place.id}>
            <img
              className="place-image"
              src={place.image}
              alt={`Representative image for ${place.name}`}
            />

            <div className="place-info">
              <p className="place-tag">{place.tag}</p>
              <h2>{place.name}</h2>
              <p className="place-location">📍 {place.location}</p>

              <div className="place-footer">
                <strong>{place.fee}</strong>

                <div className="place-actions">
                  <div className="place-secondary-actions">
                    <button
                      className="place-details-button"
                      onClick={() => setSelectedPlace(place)}
                    >
                      View details
                    </button>

                    <button
                      className="place-report-button"
                      onClick={() => {
                        setMessage("");
                        setReportingPlace(place);
                      }}
                    >
                      Report issue
                    </button>
                  </div>

                  <button
                    className="place-trip-button"
                    onClick={() => addPlaceToTrip(place)}
                  >
                    Add to My Trip →
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {selectedPlace && (
        <div
          className="place-details-backdrop"
          onClick={() => setSelectedPlace(null)}
        >
          <section
            className="place-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="place-modal-close"
              onClick={() => setSelectedPlace(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <img
              src={selectedPlace.image}
              alt={`Representative image for ${selectedPlace.name}`}
            />

            <div className="place-modal-content">
              <p className="place-tag">{selectedPlace.tag}</p>
              <h2>{selectedPlace.name}</h2>
              <p className="place-location">📍 {selectedPlace.location}</p>
              <p className="place-overview">{selectedPlace.overview}</p>

              <div className="place-details-grid">
                <div>
                  <small>BEST TIME</small>
                  <strong>{selectedPlace.timings}</strong>
                </div>
                <div>
                  <small>BUSY HOURS</small>
                  <strong>{selectedPlace.busyTime}</strong>
                </div>
                <div>
                  <small>BEST FOR</small>
                  <strong>{selectedPlace.bestFor}</strong>
                </div>
              </div>

              <div className="place-details-bottom">
                <strong>{selectedPlace.fee}</strong>

                <div className="place-details-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedPlace.name}, ${selectedPlace.location}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions ↗
                  </a>

                  <button
                    onClick={() => {
                      addPlaceToTrip(selectedPlace);
                      setSelectedPlace(null);
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

      {reportingPlace && (
        <div
          className="place-report-backdrop"
          onClick={() => setReportingPlace(null)}
        >
          <section
            className="place-report-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="place-modal-close"
              onClick={() => setReportingPlace(null)}
            >
              ×
            </button>

            <p>REPORT AN ISSUE</p>
            <h2>{reportingPlace.name}</h2>

            <textarea
              rows={4}
              value={reportMessage}
              onChange={(event) => setReportMessage(event.target.value)}
              placeholder="For example: incorrect timing, closed place or wrong location."
            />

            <button className="place-send-report" onClick={submitReport}>
              Send report
            </button>
          </section>
        </div>
      )}
    </main>
  );
}