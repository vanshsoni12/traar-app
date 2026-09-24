import { useState } from "react";
import { useParams } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import "./NearbyTripsPage.css";

type TransportMode = "Bus" | "Taxi" | "Self-drive";

type TransportInfo = {
  fare: number;
  duration: string;
  operator: string;
  first: string;
  last: string;
  boarding: string;
  arrival: string;
};

type NearbyTrip = {
  id: number;
  image: string;
  type: string;
  name: string;
  location: string;
  distance: string;
  overview: string;
  timings: string;
  busyTime: string;
  transport: Record<TransportMode, TransportInfo>;
};

const nearbyTrips: NearbyTrip[] = [
  {
    id: 401,
    image:
      "https://images.unsplash.com/photo-1591017403286-fd8493524e1e?auto=format&fit=crop&w=1200&q=80",
    type: "UNESCO HERITAGE",
    name: "Sanchi Buddhist Complex",
    location: "Sanchi, Raisen",
    distance: "46.2 km away",
    overview:
      "World-renowned Buddhist monuments and the Great Stupa, with historic gateways and peaceful open surroundings.",
    timings: "Best in the morning or late afternoon",
    busyTime: "Weekends and public holidays",
    transport: {
      Bus: {
        fare: 65,
        duration: "1 hr 15 mins",
        operator: "BCLL & MP Intercity State Express",
        first: "06:00 AM",
        last: "08:30 PM",
        boarding: "ISBT Hoshangabad Road, Bhopal",
        arrival: "Sanchi Bus Stand (NH46)",
      },
      Taxi: {
        fare: 1600,
        duration: "1 hr 05 mins",
        operator: "Private taxi / cab",
        first: "Available all day",
        last: "Available all day",
        boarding: "Your selected pickup location",
        arrival: "Sanchi Buddhist Complex",
      },
      "Self-drive": {
        fare: 550,
        duration: "1 hr 10 mins",
        operator: "Personal vehicle",
        first: "Flexible",
        last: "Flexible",
        boarding: "Your selected starting point",
        arrival: "Sanchi Buddhist Complex parking",
      },
    },
  },
  {
    id: 402,
    image:
      "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1200&q=80",
    type: "PREHISTORIC HERITAGE",
    name: "Bhimbetka Rock Shelters",
    location: "Raisen district",
    distance: "46 km away",
    overview:
      "A UNESCO heritage area with prehistoric rock shelters and ancient cave paintings.",
    timings: "Daytime visit recommended",
    busyTime: "Weekends and school holidays",
    transport: {
      Bus: {
        fare: 150,
        duration: "1 hr 30 mins",
        operator: "Bus + local transport",
        first: "06:30 AM",
        last: "07:30 PM",
        boarding: "ISBT Hoshangabad Road, Bhopal",
        arrival: "Bhimbetka access road",
      },
      Taxi: {
        fare: 1800,
        duration: "1 hr 10 mins",
        operator: "Private taxi / cab",
        first: "Available all day",
        last: "Available all day",
        boarding: "Your selected pickup location",
        arrival: "Bhimbetka Rock Shelters",
      },
      "Self-drive": {
        fare: 600,
        duration: "1 hr 15 mins",
        operator: "Personal vehicle",
        first: "Flexible",
        last: "Flexible",
        boarding: "Your selected starting point",
        arrival: "Bhimbetka parking",
      },
    },
  },
  {
    id: 403,
    image:
      "https://images.unsplash.com/photo-1564507592333-c60657eea523?auto=format&fit=crop&w=1200&q=80",
    type: "TEMPLE & HISTORY",
    name: "Bhojpur Temple",
    location: "Bhojpur, Raisen",
    distance: "28 km away",
    overview:
      "A historic Shiva temple with remarkable stone architecture and a calm hill-side setting.",
    timings: "Best visited during daylight",
    busyTime: "Weekends and religious festivals",
    transport: {
      Bus: {
        fare: 90,
        duration: "55 mins",
        operator: "Local bus + short auto ride",
        first: "07:00 AM",
        last: "07:00 PM",
        boarding: "Bhopal bus stand",
        arrival: "Bhojpur Temple road",
      },
      Taxi: {
        fare: 1100,
        duration: "45 mins",
        operator: "Private taxi / cab",
        first: "Available all day",
        last: "Available all day",
        boarding: "Your selected pickup location",
        arrival: "Bhojpur Temple",
      },
      "Self-drive": {
        fare: 400,
        duration: "50 mins",
        operator: "Personal vehicle",
        first: "Flexible",
        last: "Flexible",
        boarding: "Your selected starting point",
        arrival: "Bhojpur Temple parking",
      },
    },
  },
  {
    id: 404,
    image:
      "https://images.unsplash.com/photo-1577083552431-6e5fd01988f7?auto=format&fit=crop&w=1200&q=80",
    type: "HERITAGE",
    name: "Islamnagar Fort",
    location: "Berasia Road, Bhopal",
    distance: "11 km away",
    overview:
      "A nearby historical fort complex for a short heritage outing from Bhopal.",
    timings: "Daytime visit recommended",
    busyTime: "Usually busier on Sunday afternoons",
    transport: {
      Bus: {
        fare: 40,
        duration: "35 mins",
        operator: "City bus / local transport",
        first: "07:00 AM",
        last: "08:00 PM",
        boarding: "Central Bhopal",
        arrival: "Islamnagar Fort stop",
      },
      Taxi: {
        fare: 450,
        duration: "25 mins",
        operator: "Auto-rickshaw / taxi",
        first: "Available all day",
        last: "Available all day",
        boarding: "Your selected pickup location",
        arrival: "Islamnagar Fort",
      },
      "Self-drive": {
        fare: 180,
        duration: "25 mins",
        operator: "Personal vehicle",
        first: "Flexible",
        last: "Flexible",
        boarding: "Your selected starting point",
        arrival: "Islamnagar Fort parking",
      },
    },
  },
];

export default function NearbyTripsPage() {
  const { city } = useParams();
  const { addItem } = useTrip();

  const [selectedModes, setSelectedModes] = useState<
    Record<number, TransportMode>
  >({});
  const [addedTrips, setAddedTrips] = useState<Record<number, boolean>>({});
  const [selectedTrip, setSelectedTrip] = useState<NearbyTrip | null>(null);

  const cityName = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : "Bhopal";

  function getMode(tripId: number): TransportMode {
    return selectedModes[tripId] || "Bus";
  }

  function addTripToMyTrip(trip: NearbyTrip) {
    const mode = getMode(trip.id);
    const transport = trip.transport[mode];

    addItem({
      id: trip.id,
      category: "NEARBY TRIP",
      name: trip.name,
      detail: `${mode} • ${transport.duration}`,
      price: transport.fare,
      emoji: mode === "Bus" ? "🚌" : mode === "Taxi" ? "🚕" : "🚗",
    });

    setAddedTrips((current) => ({
      ...current,
      [trip.id]: true,
    }));
  }

  return (
    <main className="nearby-page">
      <section className="nearby-header">
        <p className="nearby-label">DAY TRIPS FROM {cityName.toUpperCase()}</p>
        <h1>Nearby Trips from {cityName}</h1>
        <p>Compare public transport, taxi and self-drive options.</p>
      </section>

      <section className="nearby-grid">
        {nearbyTrips.map((trip) => {
          const selectedMode = getMode(trip.id);
          const selectedTransport = trip.transport[selectedMode];

          return (
            <article className="nearby-card" key={trip.id}>
              <section className="nearby-trip-main">
                <div className="nearby-photo-wrap">
                  <img
                    className="nearby-image"
                    src={trip.image}
                    alt={`Representative image for ${trip.name}`}
                  />
                  <span>{trip.distance}</span>
                </div>

                <div className="nearby-info">
                  <p className="nearby-type">{trip.type}</p>
                  <h2>{trip.name}</h2>
                  <p className="nearby-location">📍 {trip.location}</p>
                  <p className="nearby-overview">{trip.overview}</p>

                  <div className="nearby-card-actions">
                    <button
                      className="nearby-details-button"
                      onClick={() => setSelectedTrip(trip)}
                    >
                      View details
                    </button>

                    <button
                      className="nearby-trip-button"
                      onClick={() => addTripToMyTrip(trip)}
                    >
                      {addedTrips[trip.id]
                        ? `✓ Added ${selectedMode} leg`
                        : "Add to My Trip →"}
                    </button>
                  </div>
                </div>
              </section>

              <aside className="nearby-transport-panel">
                <div className="nearby-transport-heading">
                  <strong>PUBLIC TRANSIT OPTIONS</strong>
                  <span>Click icon to view</span>
                </div>

                <div className="nearby-transport-tabs">
                  {(Object.keys(trip.transport) as TransportMode[]).map(
                    (mode) => (
                      <button
                        key={mode}
                        className={selectedMode === mode ? "active" : ""}
                        onClick={() =>
                          setSelectedModes((current) => ({
                            ...current,
                            [trip.id]: mode,
                          }))
                        }
                      >
                        <span>
                          {mode === "Bus"
                            ? "🚌"
                            : mode === "Taxi"
                            ? "🚕"
                            : "🚗"}
                        </span>
                        {mode}
                      </button>
                    )
                  )}
                </div>

                <div className="nearby-transit-detail">
                  <div className="nearby-transit-title">
                    <strong>{selectedMode} Transit</strong>
                    <span>{selectedTransport.duration}</span>
                  </div>

                  <p>
                    <small>Fare per person</small>
                    <b>₹{selectedTransport.fare.toLocaleString("en-IN")}</b>
                    {selectedMode === "Bus" && <em> / person</em>}
                  </p>

                  <div className="nearby-transit-rows">
                    <span>
                      Operator <b>{selectedTransport.operator}</b>
                    </span>
                    <span>
                      First departure <b>{selectedTransport.first}</b>
                    </span>
                    <span>
                      Last departure <b>{selectedTransport.last}</b>
                    </span>
                    <span>
                      Boarding point <b>{selectedTransport.boarding}</b>
                    </span>
                    <span>
                      Arrival point <b>{selectedTransport.arrival}</b>
                    </span>
                  </div>
                </div>

                <button
                  className="nearby-add-leg-button"
                  onClick={() => addTripToMyTrip(trip)}
                >
                  {addedTrips[trip.id]
                    ? `✓ Added ${selectedMode} Leg`
                    : `Add ${selectedMode} Leg`}
                </button>
              </aside>
            </article>
          );
        })}
      </section>

      {selectedTrip && (
        <div
          className="nearby-details-backdrop"
          onClick={() => setSelectedTrip(null)}
        >
          <section
            className="nearby-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="nearby-modal-close"
              onClick={() => setSelectedTrip(null)}
            >
              ×
            </button>

            <img
              src={selectedTrip.image}
              alt={`Representative image for ${selectedTrip.name}`}
            />

            <div className="nearby-modal-content">
              <p className="nearby-type">{selectedTrip.type}</p>
              <h2>{selectedTrip.name}</h2>
              <p className="nearby-location">📍 {selectedTrip.location}</p>
              <p className="nearby-overview">{selectedTrip.overview}</p>

              <div className="nearby-details-grid">
                <div>
                  <small>DISTANCE</small>
                  <strong>{selectedTrip.distance}</strong>
                </div>
                <div>
                  <small>BEST TIME</small>
                  <strong>{selectedTrip.timings}</strong>
                </div>
                <div>
                  <small>BUSY TIME</small>
                  <strong>{selectedTrip.busyTime}</strong>
                </div>
              </div>

              <div className="nearby-details-bottom">
                <div className="nearby-details-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedTrip.name}, ${selectedTrip.location}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions ↗
                  </a>

                  <button
                    onClick={() => {
                      addTripToMyTrip(selectedTrip);
                      setSelectedTrip(null);
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
    </main>
  );
}