import { useExplorer } from "../context/ExplorerContext";
import { itemPaise } from "../utils/budget";
import { useSelectedCity } from "../context/CityContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useTrip } from "../context/TripContext";
import "./MyTripPage.css";

export default function MyTripPage() {
  const { city } = useSelectedCity();
  const { items, removeItem, clearTrip, setQuantity, replaceTrip } = useTrip();
  const { persons, setPersons, notify } = useExplorer();
  const [hasCopy, setHasCopy] = useState(() => Boolean(localStorage.getItem("traar-trip-copy")));

  const [nights, setNights] = useState(() => {
    const savedNights = Number(localStorage.getItem("traar-nights"));
    return savedNights > 0 ? savedNights : 1;
  });

  const [budget, setBudget] = useState(() => {
    return Number(localStorage.getItem("traar-budget")) || 0;
  });

  useEffect(() => {
    localStorage.setItem("traar-nights", String(nights));
  }, [nights]);

  useEffect(() => {
    localStorage.setItem("traar-budget", String(budget));
  }, [budget]);

  function itemTotal(item: (typeof items)[number]) {
    return itemPaise(item, persons, nights) / 100;
  }

  const transportTotal = items.filter((item) => item.category === 'TRAVEL' || item.category === 'NEARBY TRIP').reduce((sum, item) => sum + itemTotal(item), 0);
  const totalPaise = items.reduce((sum, item) => sum + itemPaise(item, persons, nights), 0);
  const total = totalPaise / 100;
  const hasBudget = budget > 0;
  const difference = budget - total;

  function exportPlan() {
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

      <section className="trip-header">
        <p>YOUR TRAVEL PLAN</p>
        <h1>▣ My Trip Planner &amp; Budget Engine</h1>
        <span>{items.length} selection(s) · Plan transparently, travel thoughtfully.</span>
        <div className="ex-trip-tools">
          <button onClick={() => { localStorage.setItem("traar-trip-copy", JSON.stringify({ items, nights, budget, persons })); setHasCopy(true); notify("A duplicate snapshot of this trip was saved on this device."); }}>⧉ Duplicate Trip</button>
          {hasCopy && <button onClick={() => { try { const copy = JSON.parse(localStorage.getItem("traar-trip-copy") || "null"); if (!copy || !Array.isArray(copy.items)) return; replaceTrip(copy.items); setNights(copy.nights || 1); setBudget(copy.budget || 0); setPersons(copy.persons || 1); notify("Saved trip copy restored."); } catch { notify("The saved trip copy could not be restored."); } }}>Restore saved copy</button>}
          <button onClick={async () => { const text = `TRAAR trip for ${persons} traveller(s)\n${items.map((item) => `${item.name}: ₹${itemTotal(item)}`).join("\n")}\nEstimated total: ₹${total}`; try { if (navigator.share) await navigator.share({ title: "My TRAAR Trip", text }); else { await navigator.clipboard.writeText(text); notify("Trip summary copied to clipboard."); } } catch { notify("Sharing was cancelled or unavailable. You can export your plan instead."); } }}>⇄ Share Trip</button>
          <button onClick={() => window.print()}>↓ Export Estimate (PDF)</button>
        </div>
        <div className="ex-trip-controls"><label>Travellers: <button disabled={persons <= 1} onClick={() => setPersons(Math.max(1, persons - 1))}>−</button> <b>{persons}</b> <button disabled={persons >= 99} onClick={() => setPersons(Math.min(99, persons + 1))}>+</button></label><label>Budget limit: ₹ <input aria-label="Budget limit" type="number" min="0" step="1" value={budget || ""} onChange={(event) => setBudget(Math.max(0, Number(event.target.value)))} /><button onClick={() => setBudget(Math.max(0, budget - 1000))}>−1k</button><button onClick={() => setBudget(budget + 1000)}>+1k</button></label></div>
      </section>

      {items.length === 0 ? (
        <section className="empty-trip">
          <div>🧳</div>
          <h2>Your trip is empty</h2>
          <p>Add stays, food, places and nearby trips to create your plan.</p>

          <Link to={`/destinations/${city.toLowerCase().replace(/\s+/g, "-")}`} className="explore-button">
            Explore {city} →
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
                <div className="trip-item-emoji">{item.image ? <img src={item.image} alt="" /> : item.emoji}</div>

                <div className="trip-item-info">
                  <p>{item.category}</p>
                  <h2>{item.name}</h2>
                  {item.location && <small>{item.location}</small>}
                  <span>
                    {item.category === "STAY"
                      ? `₹${item.price.toLocaleString(
                          "en-IN"
                        )} per night × ${nights} night(s)`
                      : item.detail}
                  </span>
                </div>

                <div className="trip-item-price">
                  <div className="ex-quantity"><button aria-label={`Decrease ${item.name} quantity`} disabled={(item.quantity || 1) <= 1} onClick={() => setQuantity(item.id, (item.quantity || 1) - 1)}>−</button><span>{item.quantity || 1}</span><button aria-label={`Increase ${item.name} quantity`} onClick={() => setQuantity(item.id, (item.quantity || 1) + 1)}>+</button></div>
                  <strong>{item.priceKnown === false ? "Tariff to confirm" : `₹${itemTotal(item).toLocaleString("en-IN")}`}</strong>
                  <button onClick={() => removeItem(item.id)}>Remove</button>
                </div>
              </article>
            ))}
          </section>

          <section className="trip-transit-link"><div><h2>Plan your next excursion</h2><p>Compare bus, taxi and self-drive fares, then add the transit you need.</p></div><Link className="explore-button" to="/destinations/bhopal/nearby">Explore nearby trips →</Link></section>

          <section className="budget-summary">
            <p>TRIP ESTIMATE</p>
            <h2>Budget Calculation Engine</h2><span className="ex-tag">Integer Paise</span>
            {Object.entries(items.reduce<Record<string, number>>((totals, item) => { totals[item.category] = (totals[item.category] || 0) + itemPaise(item, persons, nights); return totals; }, {})).map(([category, paise]) => <div className="budget-row" key={category}><span>{category}</span><strong>₹{(paise / 100).toLocaleString("en-IN")}</strong></div>)}

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
              <span>Selected transit (included in total)</span>
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

            <div className="budget-row"><span>Internal integer paise</span><strong>{totalPaise} p</strong></div>
            <button className="export-button" onClick={() => window.print()}>↓ Download PDF Estimate</button>
            <p className="ex-muted">Use “Save as PDF” in the print dialog.</p>
            <button className="export-button" onClick={exportPlan}>
              Review & export plan →
            </button>

            <button className="clear-button" onClick={clearTrip}>
              Clear trip
            </button>

            <h3>Transparent Tariff Notes</h3><ol className="ex-tariff-notes"><li>This is an estimate, not a booking confirmation.</li><li>Per-person tariffs scale by travellers. Vehicle and room prices remain flat; confirm room capacity directly.</li><li>Unknown prices are excluded until confirmed. Existing guide and local transport prices are estimates.</li></ol>
          </section>
        </>
      )}
    </main>
  );
}