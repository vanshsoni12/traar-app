import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "./ProviderLoginPage.css";

export default function ProviderLoginPage() {
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setLoading(true);

    if (isSignUp) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });

      if (error) {
        setMessage(error.message);
      } else if (data.session) {
        await supabase.rpc("become_provider");
        navigate("/provider");
      } else {
        setMessage(
          "Account created. Check your email, confirm it, then log in."
        );
        setIsSignUp(false);
      }
    } else {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setMessage(error.message);
      } else {
        await supabase.rpc("become_provider");
        navigate("/provider");
      }
    }

    setLoading(false);
  }

  return (
    <main className="provider-login-page">
      <div className="provider-login-logo">
        <img src={`${import.meta.env.BASE_URL}PHOTO-2026-09-25-02-23-39.jpg`} alt="TRAAR" style={{ width: "150px", height: "auto", display: "block" }} />
      </div>

      <section className="provider-login-card">
        <p className="provider-login-label">PROVIDER PORTAL</p>
        <h1>{isSignUp ? "Create provider account" : "Provider login"}</h1>
        <p>
          {isSignUp
            ? "List your Bhopal service and submit it for review."
            : "Manage your listings, photos and verification documents."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignUp && (
            <label>
              Full name
              <input
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Your full name"
              />
            </label>
          )}

          <label>
            Email address
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@example.com"
            />
          </label>

          <label>
            Password
            <input
              required
              type="password"
              minLength={6}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Minimum 6 characters"
            />
          </label>

          {message && <p className="provider-login-message">{message}</p>}

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isSignUp
                ? "Create provider account →"
                : "Log in →"}
          </button>
        </form>

        <button
          type="button"
          className="provider-login-switch"
          onClick={() => {
            setIsSignUp(!isSignUp);
            setMessage("");
          }}
        >
          {isSignUp
            ? "Already have an account? Log in"
            : "New provider? Create an account"}
        </button>
      </section>
    </main>
  );
}
