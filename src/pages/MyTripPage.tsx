import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import "./MyTripPage.css";

type TransportMode = "Walk" | "Bus" | "Auto" | "Cab";

const transportPrices: Record<TransportMode, number> = {
  Walk: 0,
  Bus: 15,
  Auto: 80,
  Cab: 180,
};

export default function MyTripPage() {
  const { items, removeItem, clearTrip } = useTrip();

  const [nights, setNights] = useState(() => {
    const savedNights = Number(localStorage.getItem("traar-nights"));
    return savedNights > 0 ? savedNights : 1;
  });

  const [budget, setBudget] = useState(() => {
    return Number(localStorage.getItem("traar-budget")) || 0;
  });

 const [routeOrder, setRouteOrder] = useState<number[]>(() => {
    const savedRoute = localStorage.getItem("traar-route-order");
    return savedRoute ? JSON.parse(savedRoute) : [];
  });

  const [transportPerLeg, setTransportPerLeg] = useState<
    Record<string, TransportMode>
  >(() => {
    const savedTransport = localStorage.getItem("traar-route-transport");
    return savedTransport ? JSON.parse(savedTransport) : {};
  });

  useEffect(() => {
    localStorage.setItem("traar-nights", String(nights));
  }, [nights]);

  useEffect(() => {
    localStorage.setItem("traar-budget", String(budget));
  }, [budget]);

  useEffect(() => {
    const itemIds = items.map((item) => item.id);

    setRouteOrder((current) => {
      const remaining = current.filter((id) => itemIds.includes(id));
      const newIds = itemIds.filter((id) => !remaining.includes(id));
      return [...remaining, ...newIds];
    });
  }, [items]);

  useEffect(() => {
    localStorage.setItem("traar-route-order", JSON.stringify(routeOrder));
  }, [routeOrder]);

  useEffect(() => {
    localStorage.setItem(
      "traar-route-transport",
      JSON.stringify(transportPerLeg)
    );
  }, [transportPerLeg]);

  function itemTotal(item: (typeof items)[number]) {
    return item.category === "STAY" ? item.price * nights : item.price;
  }

  const routeItems = useMemo(() => {
    return routeOrder
      .map((id) => items.find((item) => item.id === id))
      .filter(Boolean) as (typeof items)[number][];
  }, [routeOrder, items]);

  const selectionsTotal = items.reduce(
    (sum, item) => sum + itemTotal(item),
    0
  );

  const transportTotal = routeItems.slice(0, -1).reduce((sum, item) => {
    const mode = transportPerLeg[item.id] || "Bus";
    return sum + transportPrices[mode];
  }, 0);

  const total = selectionsTotal + transportTotal;
  const hasBudget = budget > 0;
  const difference = budget - total;

  function moveStop(index: number, direction: "up" | "down") {
    const nextIndex = direction === "up" ? index - 1 : index + 1;

    if (nextIndex < 0 || nextIndex >= routeOrder.length) return;

    setRouteOrder((current) => {
      const next = [...current];
      [next[index], next[nextIndex]] = [next[nextIndex], next[index]];
      return next;
    });
  }

  function updateTransport(itemId: number, mode: TransportMode) {
    setTransportPerLeg((current) => ({
      ...current,
      [itemId]: mode,
    }));
  }

  function openRouteInMaps() {
    if (routeItems.length === 0) return;

    const names = routeItems.map((item) => `${item.name}, Bhopal`);

    const origin = encodeURIComponent(names[0]);
    const destination = encodeURIComponent(names[names.length - 1]);
    const waypoints =
      names.length > 2
        ? `&waypoints=${encodeURIComponent(names.slice(1, -1).join("|"))}`
        : "";

    const mapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}${waypoints}&travelmode=transit`;

    window.open(mapsUrl, "_blank", "noopener,noreferrer");
  }

  function exportPlan() {
    const routeText =
      routeItems.length > 0
        ? routeItems
            .map((item, index) => {
              const transport =
                index < routeItems.length - 1
                  ? ` → ${transportPerLeg[item.id] || "Bus"} (₹${
                      transportPrices[transportPerLeg[item.id] || "Bus"]
                    })`
                  : "";
              return `${index + 1}. ${item.name}${transport}`;
            })
            .join("\n")
        : "No route stops added yet.";

    const planText = [
      "TRAAR - My Trip Plan",
      "",
      `Stay duration: ${nights} night(s)`,
      hasBudget ? `Trip budget: ₹${budget}` : "Trip budget: Not set",
      "",
      "Selected places:",
      ...items.map(
        (item) =>
          `${item.category}: ${item.name} | ${item.detail} | ₹${itemTotal(
            item
          )}`
      ),
      "",
      "Suggested route:",
      routeText,
      "",
      `Transport estimate: ₹${transportTotal}`,
      `Estimated total: ₹${total}`,
      "",
      "This is an estimate, not a booking confirmation.",
    ].join("\n");

    const file = new Blob([planText], { type: "text/plain" });
    const url = URL.createObjectURL(file);
    const link = document.createElement("a");

    link.href = url;
    link.download = "my-traar-trip.txt";
    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <main className="trip-page">
      <Link to="/destinations/bhopal" className="trip-back">
        ← Continue exploring
      </Link>

      <section className="trip-header">
        <p>YOUR TRAVEL PLAN</p>
        <h1>My Trip</h1>
        <span>{items.length} selection(s)</span>
      </section>

      {items.length === 0 ? (
        <section className="empty-trip">
          <div>🧳</div>
          <h2>Your trip is empty</h2>
          <p>Add stays, food, places and nearby trips to create your plan.</p>

          <Link to="/destinations/bhopal" className="explore-button">
            Explore Bhopal →
          </Link>
        </section>
      ) : (
        <>
          <section className="nights-control">
            <div>
              <p>STAY DURATION</p>
              <h2>How many nights?</h2>
            </div>

            <div className="nights-buttons">
              <button
                onClick={() => setNights((current) => Math.max(1, current - 1))}
              >
                −
              </button>

              <strong>
                {nights} night{nights > 1 ? "s" : ""}
              </strong>

              <button onClick={() => setNights((current) => current + 1)}>
                +
              </button>
            </div>
          </section>

          <section className="trip-items">
            {items.map((item) => (
              <article className="trip-item" key={item.id}>
                <div className="trip-item-emoji">{item.emoji}</div>

                <div className="trip-item-info">
                  <p>{item.category}</p>
                  <h2>{item.name}</h2>
                  <span>
                    {item.category === "STAY"
                      ? `₹${item.price.toLocaleString(
                          "en-IN"
                        )} per night × ${nights} night(s)`
                      : item.detail}
                  </span>
                </div>

                <div className="trip-item-price">
                  <strong>₹{itemTotal(item).toLocaleString("en-IN")}</strong>
                  <button onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </article>
            ))}
          </section>

          <section className="route-planner">
            <div className="route-heading">
              <div>
                <p>ROUTE PLANNER</p>
                <h2>Arrange your journey</h2>
                <span>Move stops and choose transport between them.</span>
              </div>

              <button className="maps-button" onClick={openRouteInMaps}>
                Open route in Maps →
              </button>
            </div>

            <div className="route-list">
              {routeItems.map((item, index) => {
                const isLast = index === routeItems.length - 1;
                const selectedTransport = transportPerLeg[item.id] || "Bus";

                return (
                  <div className="route-stop" key={item.id}>
                    <div className="route-number">{index + 1}</div>

                    <div className="route-stop-name">
                      <strong>{item.name}</strong>
                      <span>{item.category}</span>
                    </div>

                    <div className="route-order-buttons">
                      <button
                        disabled={index === 0}
                        onClick={() => moveStop(index, "up")}
                      >
                        ↑
                      </button>

                      <button
                        disabled={isLast}
                        onClick={() => moveStop(index, "down")}
                      >
                        ↓
                      </button>
                    </div>

                    {!isLast && (
                      <label className="transport-select">
                        <span>To next stop</span>
                        <select
                          value={selectedTransport}
                          onChange={(event) =>
                            updateTransport(
                              item.id,
                              event.target.value as TransportMode
                            )
                          }
                        >
                          <option value="Walk">Walk — ₹0</option>
                          <option value="Bus">Bus — ₹15</option>
                          <option value="Auto">Auto — ₹80</option>
                          <option value="Cab">Cab — ₹180</option>
                        </select>
                      </label>
                    )}
                  </div>
                );
              })}
            </div>

            <p className="route-total">
              Local transport estimate: ₹{transportTotal.toLocaleString("en-IN")}
            </p>
          </section>

          <section className="budget-summary">
            <p>TRIP ESTIMATE</p>
            <h2>Budget summary</h2>

            <label className="budget-input">
              <span>Your trip budget (optional)</span>
              <input
                type="number"
                min="0"
                placeholder="Example: 10000"
                value={budget || ""}
                onChange={(event) => setBudget(Number(event.target.value))}
              />
            </label>

            <div className="budget-row">
              <span>Selections</span>
              <strong>{items.length}</strong>
            </div>

            <div className="budget-row">
              <span>Stay duration</span>
              <strong>{nights} night(s)</strong>
            </div>

            <div className="budget-row">
              <span>Transport estimate</span>
              <strong>₹{transportTotal.toLocaleString("en-IN")}</strong>
            </div>

            <div className="budget-row total-row">
              <span>Estimated total</span>
              <strong>₹{total.toLocaleString("en-IN")}</strong>
            </div>

            {hasBudget && (
              <div
                className={`budget-status ${
                  difference >= 0 ? "within-budget" : "over-budget"
                }`}
              >
                {difference >= 0
                  ? `₹${difference.toLocaleString("en-IN")} left in your budget`
                  : `₹${Math.abs(difference).toLocaleString(
                      "en-IN"
                    )} over budget`}
              </div>
            )}

            <button className="export-button" onClick={exportPlan}>
              Review & export plan →
            </button>

            <button className="clear-button" onClick={clearTrip}>
              Clear trip
            </button>

            <small>This is an estimate, not a booking confirmation.</small>
          </section>
        </>
      )}
    </main>
  );
}