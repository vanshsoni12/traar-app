import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "./App.css";

const destinations = [
  { city: "Bhopal", state: "Madhya Pradesh" },
  { city: "Indore", state: "Madhya Pradesh" },
  { city: "Ujjain", state: "Madhya Pradesh" },
  { city: "Jaipur", state: "Rajasthan" },
  { city: "Udaipur", state: "Rajasthan" },
  { city: "Jaisalmer", state: "Rajasthan" },
  { city: "Goa", state: "Goa" },
  { city: "Agra", state: "Uttar Pradesh" },
  { city: "Varanasi", state: "Uttar Pradesh" },
  { city: "Manali", state: "Himachal Pradesh" },
  { city: "Kochi", state: "Kerala" },
];

const states = [
  "Madhya Pradesh",
  "Rajasthan",
  "Goa",
  "Uttar Pradesh",
  "Himachal Pradesh",
  "Kerala",
];

const destinationImages: Record<string, string> = {
  Bhopal:
    "https://images.unsplash.com/photo-1590050752117-238cb0fb12b1?auto=format&fit=crop&w=900&q=80",
  Indore:
    "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=900&q=80",
  Ujjain:
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80",
  Jaipur:
    "https://images.unsplash.com/photo-1477587458883-47145ed94245?auto=format&fit=crop&w=900&q=80",
  Udaipur:
    "https://images.unsplash.com/photo-1599661046289-e31897846e41?auto=format&fit=crop&w=900&q=80",
  Jaisalmer:
    "https://images.unsplash.com/photo-1526711657229-e7e080ed7aa1?auto=format&fit=crop&w=900&q=80",
  Goa:
    "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=900&q=80",
  Agra:
    "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=900&q=80",
  Varanasi:
    "https://images.unsplash.com/photo-1561361513-2d000a50f0dc?auto=format&fit=crop&w=900&q=80",
  Manali:
    "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80",
  Kochi:
    "https://images.unsplash.com/photo-1602216056096-3b40cc0c9944?auto=format&fit=crop&w=900&q=80",
};

function App() {
  const [state, setState] = useState("Madhya Pradesh");
  const [city, setCity] = useState("Bhopal");
  const [budget, setBudget] = useState("");
  const navigate = useNavigate();

  function handleDestinationChange(value: string) {
    setCity(value);

    const match = destinations.find(
      (item) => item.city.toLowerCase() === value.toLowerCase()
    );

    if (match) setState(match.state);
  }

  function exploreDestination() {
    if (!state.trim() || !city.trim()) {
      alert("Please enter State and Destination.");
      return;
    }

    localStorage.setItem(
      "traar-search",
      JSON.stringify({ state, city, budget })
    );

    navigate(`/destinations/${city.toLowerCase().replace(/\s+/g, "-")}`);
  }

  return (
    <div className="app">
      <header className="navbar">
        <div className="logo">
          TRAAR<span>.</span>
        </div>

        <nav>
          <a href="#discover">Discover</a>
          <a href="#popular">Destinations</a>
        </nav>

        <div className="portal-actions">
          <Link to="/provider/login" className="provider-login-nav">
            Provider Login
          </Link>

          <Link to="/admin/login" className="provider-login-nav">
            Admin Login
          </Link>

          <button className="help-btn">? Help Booth</button>
        </div>
      </header>

      <main>
        <section className="hero" id="discover">
          <div className="hero-content">
            <div className="badge">✦ Travel • Explore • Belong</div>

            <h1>
              Your journey,
              <br />
              <span>your way.</span>
            </h1>

            <p>
              Discover stays, local food, unforgettable places and nearby
              adventures — all while keeping your trip within budget.
            </p>

            <div className="search-box">
              <div className="field">
                <label>State</label>
                <input
                  list="state-options"
                  value={state}
                  onChange={(event) => setState(event.target.value)}
                  placeholder="Type a state"
                  autoComplete="off"
                />

                <datalist id="state-options">
                  {states.map((item) => (
                    <option value={item} key={item} />
                  ))}
                </datalist>
              </div>

              <div className="divider" />

              <div className="field">
                <label>Destination</label>
                <input
                  list="destination-options"
                  value={city}
                  onChange={(event) =>
                    handleDestinationChange(event.target.value)
                  }
                  placeholder="Type a destination"
                  autoComplete="off"
                />

                <datalist id="destination-options">
                  {destinations.map((item) => (
                    <option
                      key={`${item.city}-${item.state}`}
                      value={item.city}
                    />
                  ))}
                </datalist>
              </div>

              <div className="divider" />

              <div className="field budget-field">
                <label>Budget (₹) — optional</label>
                <input
                  type="number"
                  min="0"
                  value={budget}
                  onChange={(event) => setBudget(event.target.value)}
                  placeholder="Example: 10000"
                />
              </div>

              <button className="explore-btn" onClick={exploreDestination}>
                Explore
              </button>
            </div>
          </div>

          <div className="visual">
            <div className="circle circle-one" />
            <div className="circle circle-two" />

            <div className="travel-card main-card">
              <div className="card-icon">🌿</div>
              <p>Discover</p>
              <h3>{city || "Bhopal"}</h3>
              <span>{state || "India"}</span>
            </div>

            <div className="floating-card food-card">
              <span>🍜</span>
              <div>
                <small>Local food</small>
                <strong>Taste the city</strong>
              </div>
            </div>

            <div className="floating-card budget-card">
              <span>₹</span>
              <div>
                <small>Trip budget</small>
                <strong>{budget ? `₹${budget}` : "Plan your budget"}</strong>
              </div>
            </div>
          </div>
        </section>

        <section className="popular-destinations" id="popular">
          <div className="section-heading">
            <div>
              <span>POPULAR IN INDIA</span>
              <h2>Start with a popular destination.</h2>
            </div>
          </div>

          <div className="popular-grid">
            {destinations.map((item) => (
              <button
                key={`${item.city}-${item.state}`}
                className="popular-card"
                onClick={() => {
                  setState(item.state);
                  setCity(item.city);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              >
                <img
                  src={destinationImages[item.city]}
                  alt={`${item.city}, ${item.state}`}
                  className="popular-card-image"
                  loading="lazy"
                />

                <div className="popular-card-content">
                  <strong>{item.city}</strong>
                  <span>{item.state}</span>
                </div>
              </button>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;