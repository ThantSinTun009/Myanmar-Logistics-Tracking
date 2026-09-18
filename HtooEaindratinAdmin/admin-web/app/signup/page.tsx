
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { supabase } from "../../lib/supabase";

export default function Signup() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"TRADER" | "DRIVER">("TRADER");

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setMessage("");
    setLoading(true);

    const client = supabase();

    // 1. Create Supabase Auth account
    const { data: authData, error: authError } =
      await client.auth.signUp({
        email,
        password,
      });

    if (authError || !authData.user) {
      setError(authError?.message || "Could not create account.");
      setLoading(false);
      return;
    }

    // 2. Create profile
    const { error: profileError } = await client
      .from("profiles")
      .insert({
        id: authData.user.id,
        name,
        email,
        role,
      });

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    setMessage("Account created successfully. Redirecting to login...");

    setTimeout(() => {
      router.push("/login");
    }, 1000);

    setLoading(false);
  }

  return (
    <main className="login">
      <div className="login-panel">

        <div className="login-hero">
          <div className="brand-mark logo-lg">ML</div>

          <p className="eyebrow">Myanmar Logistics Suite</p>

          <h1>Join the logistics network.</h1>

          <p className="hero-copy">
            Create your account to manage shipments, coordinate deliveries,
            and stay connected throughout the transportation process.
          </p>

          <ul className="feature-list">
            <li>Shipment visibility</li>
            <li>Route coordination</li>
            <li>Real-time tracking</li>
          </ul>
        </div>

        <form
          className="card login-card"
          onSubmit={submit}
        >
          <div className="card-header compact">
            <div>
              <p className="eyebrow">New account</p>
              <h2>Sign up</h2>
            </div>

            <span className="badge">Register</span>
          </div>

          {error && (
            <div className="notice">
              {error}
            </div>
          )}

          {message && (
            <div className="notice">
              {message}
            </div>
          )}

          <label>
            Name
            <input
              className="input"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              required
            />
          </label>

          <label>
            Email
            <input
              className="input"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </label>

          <label>
            Password
            <input
              className="input"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Create a password"
              minLength={6}
              required
            />
          </label>

          <label>
            Account type
            <select
              className="input"
              value={role}
              onChange={(e) =>
                setRole(e.target.value as "TRADER" | "DRIVER")
              }
            >
              <option value="TRADER">Trader</option>
              <option value="DRIVER">Driver</option>
            </select>
          </label>

          <button
            className="btn"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Creating account..." : "Create account"}
          </button>

          <p>
            Already have an account?{" "}
            <Link href="/login">Sign in</Link>
          </p>
        </form>

      </div>
    </main>
  );
}

