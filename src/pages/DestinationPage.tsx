import "./DestinationPage.css";
import { Link, useParams } from "react-router-dom";
import { useTrip } from "../context/TripContext";

type SavedSearch = {
  state?: string;
  city?: string;
  budget?: string;
  travellers?: string;
};

function formatCity(value: string) {
  return value
    .split("-")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

function DestinationPage() {
  const { items } = useTrip();
  const { city: cityFromUrl } = useParams();

  const savedSearch: SavedSearch = JSON.parse(
    localStorage.getItem("traar-search") || "{}"
  );

  const city = formatCity(cityFromUrl || "bhopal");
  const state = city === "Bhopal" ? "Madhya Pradesh" : savedSearch.state || "";
  const budget = savedSearch.budget?.trim() || "";
  const travellers = savedSearch.travellers || "1";
  const cityPath = city.toLowerCase().replace(/\s+/g, "-");

  if ((cityFromUrl || 'bhopal').toLowerCase() !== 'bhopal') return <main className="destination-page"><h1>{formatCity(cityFromUrl || '')} is coming soon</h1><p>Bhopal is currently available.</p><Link to="/destinations/bhopal">Explore Bhopal</Link></main>;

  return (
    <div className="destination-page">
      <header className="destination-nav">
        <div className="destination-brand">
          <Link to="/" className="destination-logo">
            <img src="/PHOTO-2026-09-25-02-23-39.jpg" alt="TRAAR" style={{ width: "150px", height: "auto", display: "block" }} />
          </Link>
        </div>

        <Link to="/my-trip" className="my-trip-button">
          My Trip <span>{items.length}</span>
        </Link>
      </header>

      <section className="destination-hero">
        <div>
          <p className="destination-label">
            EXPLORE {state.toUpperCase()}
          </p>

          <h1>{city}</h1>

          <p className="destination-subtitle">
            Discover stays, local food, places and nearby experiences in{" "}
            {city}. Your plan is for {travellers} traveller
            {travellers === "1" ? "" : "s"}.
            {budget
              ? ` Your current budget is ₹${budget}.`
              : " You can add a budget later."}
          </p>
        </div>

        <div className="destination-badge">
          <span>📍</span>
          <div>
            <small>Your selected destination</small>
            <strong>
              {city}, {state}
            </strong>
          </div>
        </div>
      </section>

      <section className="explore-section">
        <div className="explore-heading">
          <p>BUILD YOUR JOURNEY</p>
          <h2>What would you like to explore?</h2>
        </div>

        <div className="destination-grid">
          <Link
            to={`/destinations/${cityPath}/stays`}
            className="destination-card stays-card"
          >
            <span className="card-number">01</span>
            <div className="big-icon">🏨</div>
            <h3>Stays</h3>
            <p>Hotels, hostels, PGs, dormitories and local stays.</p>
            <span className="card-link">Explore stays →</span>
          </Link>

          <Link
            to={`/destinations/${cityPath}/food`}
            className="destination-card food-card2"
          >
            <span className="card-number">02</span>
            <div className="big-icon">🍜</div>
            <h3>Food</h3>
            <p>Restaurants, cafés, dhabas and famous local dishes.</p>
            <span className="card-link">Explore food →</span>
          </Link>

          <Link
            to={`/destinations/${cityPath}/places`}
            className="destination-card places-card"
          >
            <span className="card-number">03</span>
            <div className="big-icon">📍</div>
            <h3>Places</h3>
            <p>Popular attractions, heritage spots and hidden gems.</p>
            <span className="card-link">Explore places →</span>
          </Link>

          <Link
            to={`/destinations/${cityPath}/nearby`}
            className="destination-card nearby-card"
          >
            <span className="card-number">04</span>
            <div className="big-icon">🚌</div>
            <h3>Nearby</h3>
            <p>Nearby destinations, routes and transport choices.</p>
            <span className="card-link">Explore nearby →</span>
          </Link>
        </div>
      </section>
    </div>
  );
}

export default DestinationPage;