import { useState, type FormEvent } from "react";
import { supabase } from "../supabaseClient";
import "./HelpBoothPage.css";

type HelpCategory =
  | "General travel question"
  | "Lost item or document"
  | "Trip or listing issue"
  | "Safety concern"
  | "Other";

const faqs = [
  { question: "How to select a destination", answer: "Bhopal is currently available. Choose Explore Bhopal on the home page; other destinations are coming soon." },
  { question: "How to use category pages", answer: "Choose Stays, Food, Places or Nearby Trips to open listings directly. Use Details, Ways, Save or Add to trip on a listing." },
  { question: "How filters work", answer: "Search, type, diet and distance filters work together. Reset filters clears your choices. Distance filters need listing coordinates; unknown distances are not included." },
  {
    question: "How do I add something to My Trip?",
    answer: "Open Stays, Food, Places or Nearby Trips and select Add to My Trip.",
  },
  {
    question: "How do I report incorrect information?",
    answer: "Use the Report issue button on the relevant stay, food or place card.",
  },
  {
    question: "How can I find directions?",
    answer: "Open View details for a listing, then choose Directions.",
  },
];

export default function HelpBoothPage() {

  const [category, setCategory] = useState<HelpCategory>(
    "General travel question"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [showFaqs, setShowFaqs] = useState(true);

  function callNumber(number: string) {
    window.location.href = `tel:${number}`;
  }

  function openRequest(nextCategory: HelpCategory) {
    setCategory(nextCategory);
    setStatusMessage("");

    window.setTimeout(() => {
      document
        .getElementById("help-request-form")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }

  function openNearbyHelp() {
    window.open(
      "https://www.google.com/maps/search/?api=1&query=police+station+or+hospital+near+me",
      "_blank",
      "noreferrer"
    );
  }

  async function submitHelpRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!name.trim() || !message.trim()) {
      setStatusMessage("Please enter your name and explain how we can help.");
      return;
    }

    setSubmitting(true);
    setStatusMessage("");

    const { error } = await supabase.from("help_requests").insert({
      name: name.trim(),
      email: email.trim() || null,
      phone: phone.trim() || null,
      category,
      message: message.trim(),
    });

    if (error) {
      setStatusMessage(error.message);
      setSubmitting(false);
      return;
    }

    setName("");
    setEmail("");
    setPhone("");
    setMessage("");
    setSubmitting(false);
    setStatusMessage(
      "Thank you. Your help request has been sent to the TRAAR team."
    );
  }

  return (
    <main className="help-page">
      <header className="help-header">

        <div>
          <p>TRAAR SUPPORT</p>
          <h1>Help Booth</h1>
          <span>Travel assistance whenever you need it.</span>
        </div>
      </header>

      <section className="emergency-card">
        <div>
          <p>EMERGENCY SUPPORT</p>
          <h2>Need urgent help?</h2>
          <span>Call India’s unified emergency response number.</span>
        </div>

        <button onClick={() => callNumber("112")}>Call 112</button>
      </section>

      <section className="help-section"><h2>Emergency &amp; Tourism Helplines</h2><p>Official district and tourism contact numbers. Tourism support has limited hours.</p><div className="help-grid">{[["Police Emergency Response", "100", "Police assistance; dial 112 for unified emergency response."], ["Medical Ambulance & Emergency", "108", "Emergency ambulance assistance."], ["Women Helpline", "1090", "Women’s safety assistance."], ["MP Tourism Official Helpline", "18002337777", "Mon–Fri 10am–6pm; Saturdays and holidays 10am–2pm; Sundays closed."], ["Unified Emergency Response", "112", "For urgent police, fire or medical assistance."]].map(([title, number, description]) => <article className="help-card" key={number}><h3>{title}</h3><p>{description}</p><strong>{number}</strong><button onClick={() => callNumber(number)}>☎ Call</button></article>)}</div><p className="ex-muted">Sources: <a href="https://bhopal.nic.in/en/helpline/" target="_blank" rel="noreferrer">Bhopal district</a> · <a href="https://www.mptourism.com/sitemap.php" target="_blank" rel="noreferrer">MP Tourism</a></p></section>
      <section className="help-section"><h2>Local Public Transport Advice</h2><div className="help-grid">{[["City Bus Network", "Check current routes and service times with the operator before travelling.", "Keep change ready and confirm your stop with the conductor."], ["Airport Taxis", "Ask for the current fare at the official airport taxi desk before boarding.", "Keep your receipt and confirm whether tolls and parking are included."], ["Railway Cloakrooms & Retiring Rooms", "Confirm availability, eligibility and tariffs through the railway’s official channels.", "Carry your journey ticket and identification."]].map(([title, description, tip]) => <article className="help-card" key={title}><span className="ex-tag">TRANSIT GUIDANCE</span><h3>{title}</h3><p>{description}</p><p><b>Official tariff:</b> Confirm with operator; no live fare feed connected.</p><p><b>Traveller tip:</b> {tip}</p></article>)}</div></section>
      <section className="help-section">
        <div className="help-section-heading">
          <p>QUICK ASSISTANCE</p>
          <h2>How can we help?</h2>
        </div>

        <div className="help-grid">
          <article className="help-card">
            <span>👮</span>
            <h3>Police Help</h3>
            <p>Contact police assistance during an emergency.</p>
            <button onClick={() => callNumber("112")}>Call 112</button>
          </article>

          <article className="help-card">
            <span>🏥</span>
            <h3>Medical Help</h3>
            <p>Request emergency ambulance assistance.</p>
            <button onClick={() => callNumber("108")}>Call 108</button>
          </article>

          <article className="help-card">
            <span>🧳</span>
            <h3>Lost &amp; Found</h3>
            <p>Tell TRAAR about a lost bag, document or item.</p>
            <button onClick={() => openRequest("Lost item or document")}>
              Report item
            </button>
          </article>

          <article className="help-card">
            <span>⚠️</span>
            <h3>Report a problem</h3>
            <p>Report a concern about your trip or a listing.</p>
            <button onClick={() => openRequest("Trip or listing issue")}>
              Send report
            </button>
          </article>

          <article className="help-card">
            <span>📍</span>
            <h3>Nearby Help</h3>
            <p>Find nearby police stations and hospitals.</p>
            <button onClick={openNearbyHelp}>Find nearby</button>
          </article>

          <article className="help-card">
            <span>❓</span>
            <h3>Travel Questions</h3>
            <p>Find simple answers about using TRAAR.</p>
            <button onClick={() => setShowFaqs((current) => !current)}>
              {showFaqs ? "Hide FAQs" : "View FAQs"}
            </button>
          </article>
        </div>
      </section>

      {showFaqs && (
        <section className="help-faq-section">
          <p>COMMON QUESTIONS</p>
          {faqs.map((faq) => (
            <details key={faq.question}><summary>{faq.question}</summary><p>{faq.answer}</p></details>
          ))}
        </section>
      )}

      <section className="tourist-help">
        <div>
          <p>TOURISM ASSISTANCE</p>
          <h2>Tourist Helpline</h2>
          <span>For destination and tourism-related assistance.</span>
        </div>

        <button onClick={() => callNumber("1363")}>
          ☎ Call Tourist Helpline
        </button>
      </section>

      <section className="help-request-section" id="help-request-form">
        <div>
          <p>CONTACT TRAAR</p>
          <h2>Send a help request</h2>
          <span>
            Tell us your concern. The TRAAR support team can review your request.
          </span>
        </div>

        <form onSubmit={submitHelpRequest}>
          <label>
            Your name *
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Your name"
              required
            />
          </label>

          <div className="help-form-columns">
            <label>
              Email
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@example.com"
              />
            </label>

            <label>
              Phone
              <input
                type="tel"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="9876543210"
              />
            </label>
          </div>

          <label>
            Help category
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as HelpCategory)
              }
            >
              <option>General travel question</option>
              <option>Lost item or document</option>
              <option>Trip or listing issue</option>
              <option>Safety concern</option>
              <option>Other</option>
            </select>
          </label>

          <label>
            How can we help? *
            <textarea
              rows={5}
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Describe the problem or question."
              required
            />
          </label>

          {statusMessage && (
            <p className="help-status-message">{statusMessage}</p>
          )}

          <button type="submit" disabled={submitting}>
            {submitting ? "Sending..." : "Send help request →"}
          </button>
        </form>
      </section>
    </main>
  );
}