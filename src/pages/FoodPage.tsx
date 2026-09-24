import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import { supabase } from "../supabaseClient";
import "./FoodPage.css";

type Food = {
  id: number;
  listingId?: string;
  image: string;
  type: string;
  name: string;
  location: string;
  price: string;
  tripPrice: number;
  overview: string;
  timings: string;
  busyTime: string;
  bestFor: string;
};

type ProviderListing = {
  id: string;
  name: string;
  description: string | null;
  address: string;
  price: number | null;
  price_unit: string | null;
  amenities: string[] | null;
  opening_hours: string | null;
  listing_images: { storage_path: string; sort_order: number }[];
};

const foods: Food[] = [
  {
    id: 201,
    image:
      "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80",
    type: "RESTAURANT & SWEETS",
    name: "Manohar Dairy & Restaurant",
    location: "M.P. Nagar, Bhopal",
    price: "₹500 for two (estimate)",
    tripPrice: 500,
    overview:
      "A popular Bhopal restaurant known for North Indian food, snacks, sweets and a lively family dining atmosphere.",
    timings: "Usually open from morning until late evening",
    busyTime: "Busy on weekends and around dinner time",
    bestFor: "Family meals, sweets and local snacks",
  },
  {
    id: 202,
    image:
      "https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&w=1200&q=80",
    type: "CAFÉ",
    name: "Indian Coffee House",
    location: "New Market, TT Nagar, Bhopal",
    price: "₹300 for two (estimate)",
    tripPrice: 300,
    overview:
      "A classic café-style stop for coffee, simple Indian dishes and relaxed conversations near New Market.",
    timings: "Usually daytime to evening",
    busyTime: "Often busy during lunch and evening tea time",
    bestFor: "Coffee, quick meals and students",
  },
  {
    id: 203,
    image:
      "https://images.unsplash.com/photo-1571934811356-5cc061b6821f?auto=format&fit=crop&w=1200&q=80",
    type: "TEA & SNACKS",
    name: "Jamal Bhai Tea Shop",
    location: "Bhopal Old City",
    price: "₹100 for two (estimate)",
    tripPrice: 100,
    overview:
      "A simple local tea stop for chai and snacks while exploring the streets of old Bhopal.",
    timings: "Best visited in the morning or evening",
    busyTime: "Can be crowded during evening tea time",
    bestFor: "Chai, snacks and a quick local break",
  },
  {
    id: 204,
    image:
      "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1200&q=80",
    type: "STREET FOOD",
    name: "Shahpura Street Food",
    location: "Shahpura, Bhopal",
    price: "₹250 for two (estimate)",
    tripPrice: 250,
    overview:
      "An evening food area with casual local snacks, fast food and small stalls for travellers.",
    timings: "Mostly active from evening onwards",
    busyTime: "Most crowded on Friday, Saturday and Sunday evenings",
    bestFor: "Street food and casual evening outings",
  },
];

export default function FoodPage() {
  const { city } = useParams();
  const { addItem } = useTrip();
  const [providerFoods, setProviderFoods] = useState<Food[]>([]);
  const [loadingProviderFoods, setLoadingProviderFoods] = useState(true);
  const [providerError, setProviderError] = useState("");

  const [selectedFood, setSelectedFood] = useState<Food | null>(null);
  const [reportingFood, setReportingFood] = useState<Food | null>(null);
  const [reportMessage, setReportMessage] = useState("");
  const [message, setMessage] = useState("");

  const cityName = city
    ? city.charAt(0).toUpperCase() + city.slice(1)
    : "Bhopal";

  function addFoodToTrip(food: Food) {
    addItem({
      id: food.id,
      category: "FOOD",
      name: food.name,
      detail: food.price,
      price: food.tripPrice,
      emoji: "🍽️",
    });
  }
  useEffect(() => {
    async function loadProviderFoods() {
      setLoadingProviderFoods(true);
      setProviderError("");

      const { data, error } = await supabase
        .from("listings")
        .select(
          "id, name, description, address, price, price_unit, amenities, opening_hours, listing_images(storage_path, sort_order)"
        )
        .eq("category", "FOOD")
        .eq("status", "approved")
        .ilike("address", `%${cityName}%`)
        .order("created_at", { ascending: false });

      if (error) {
        setProviderError("Live provider food listings could not be loaded yet.");
        setLoadingProviderFoods(false);
        return;
      }

      const formattedFoods: Food[] = ((data || []) as ProviderListing[]).map(
        (listing, index) => {
          const firstImage = [...(listing.listing_images || [])].sort(
            (a, b) => a.sort_order - b.sort_order
          )[0];

          const image = firstImage
            ? supabase.storage
              .from("listing-images")
              .getPublicUrl(firstImage.storage_path).data.publicUrl
            : "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?auto=format&fit=crop&w=1200&q=80";

          return {
            id: 20000 + index,
            listingId: listing.id,
            image,
            type: "LOCAL FOOD",
            name: listing.name,
            location: listing.address,
            price:
              listing.price === null
                ? "Price on request"
                : `₹${Number(listing.price).toLocaleString("en-IN")} ${listing.price_unit || ""
                }`,
            tripPrice: Number(listing.price || 0),
            overview:
              listing.description ||
              "A verified local food listing submitted by a TRAAR provider.",
            timings:
              listing.opening_hours || "Please confirm timings with the restaurant",
            busyTime:
              "Contact the restaurant for live availability and busy hours.",
            bestFor:
              listing.amenities?.length
                ? listing.amenities.join(" • ")
                : "Local food and travellers",
          };
        }
      );

      setProviderFoods(formattedFoods);
      setLoadingProviderFoods(false);
    }

    loadProviderFoods();
  }, [cityName]);

  const allFoods = [...providerFoods, ...foods];

  async function submitReport() {
    if (!reportingFood || !reportMessage.trim()) {
      setMessage("Please write the issue before sending the report.");
      return;
    }

    const { error } = await supabase.from("user_reports").insert({
      listing_id: reportingFood.listingId || null,
      report_type: "Food listing issue",
      message: `${reportingFood.name} (${reportingFood.location}): ${reportMessage.trim()}`,
      status: "open",
    });

    if (error) {
      setMessage(error.message);
      return;
    }

    setReportingFood(null);
    setReportMessage("");
    setMessage("Thank you. Your report has been sent.");
  }

  return (
    <main className="food-page">
      <section className="food-header">
        <p className="food-label">TASTE THE CITY</p>
        <h1>Food in {cityName}</h1>
        <p>Popular restaurants, cafés, tea spots and local food streets.</p>
      </section>

      {message && <p className="food-page-message">{message}</p>}
            {loadingProviderFoods && (
        <p className="food-page-message">Loading live local food listings...</p>
      )}

      {providerError && (
        <p className="food-page-message">{providerError}</p>
      )}

      <section className="food-grid">
        {allFoods.map((food) => (
          <article className="food-card" key={food.id}>
            <img
              className="food-image"
              src={food.image}
              alt={`Representative image for ${food.name}`}
            />

            <div className="food-info">
              <p className="food-type">{food.type}</p>
              <h2>{food.name}</h2>
              <p className="food-location">📍 {food.location}</p>

              <div className="food-footer">
                <strong>{food.price}</strong>

                <div className="food-actions">
                  <div className="food-secondary-actions">
                    <button
                      className="food-details-button"
                      onClick={() => setSelectedFood(food)}
                    >
                      View details
                    </button>

                    <button
                      className="food-report-button"
                      onClick={() => {
                        setMessage("");
                        setReportingFood(food);
                      }}
                    >
                      Report issue
                    </button>
                  </div>

                  <button
                    className="food-trip-button"
                    onClick={() => addFoodToTrip(food)}
                  >
                    Add to My Trip →
                  </button>
                </div>
              </div>
            </div>
          </article>
        ))}
      </section>

      {selectedFood && (
        <div
          className="food-details-backdrop"
          onClick={() => setSelectedFood(null)}
        >
          <section
            className="food-details-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="food-modal-close"
              onClick={() => setSelectedFood(null)}
              aria-label="Close details"
            >
              ×
            </button>

            <img
              src={selectedFood.image}
              alt={`Representative image for ${selectedFood.name}`}
            />

            <div className="food-modal-content">
              <p className="food-type">{selectedFood.type}</p>
              <h2>{selectedFood.name}</h2>
              <p className="food-location">📍 {selectedFood.location}</p>
              <p className="food-overview">{selectedFood.overview}</p>

              <div className="food-details-grid">
                <div>
                  <small>BEST TIME</small>
                  <strong>{selectedFood.timings}</strong>
                </div>
                <div>
                  <small>BUSY HOURS</small>
                  <strong>{selectedFood.busyTime}</strong>
                </div>
                <div>
                  <small>BEST FOR</small>
                  <strong>{selectedFood.bestFor}</strong>
                </div>
              </div>

              <div className="food-details-bottom">
                <strong>{selectedFood.price}</strong>

                <div className="food-details-actions">
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                      `${selectedFood.name}, ${selectedFood.location}`
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Directions ↗
                  </a>

                  <button
                    onClick={() => {
                      addFoodToTrip(selectedFood);
                      setSelectedFood(null);
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

      {reportingFood && (
        <div
          className="food-report-backdrop"
          onClick={() => setReportingFood(null)}
        >
          <section
            className="food-report-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="food-modal-close"
              onClick={() => setReportingFood(null)}
            >
              ×
            </button>

            <p>REPORT AN ISSUE</p>
            <h2>{reportingFood.name}</h2>

            <textarea
              rows={4}
              value={reportMessage}
              onChange={(event) => setReportMessage(event.target.value)}
              placeholder="For example: incorrect price, closed place or wrong location."
            />

            <button className="food-send-report" onClick={submitReport}>
              Send report
            </button>
          </section>
        </div>
      )}
    </main>
  );
}