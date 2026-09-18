"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../lib/supabase";
import Link from "next/link";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();

    setError("");
    setLoading(true);

    const client = supabase();

    // 1. Authenticate with Supabase Auth
    const { data: authData, error: authError } =
      await client.auth.signInWithPassword({
        email,
        password,
      });

    if (authError || !authData.user) {
      setError(authError?.message || "Invalid email or password.");
      setLoading(false);
      return;
    }

    // 2. Get the user's role from profiles
    const { data: profile, error: profileError } = await client
      .from("profiles")
      .select("role")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      setError("Could not load your user profile.");
      await client.auth.signOut();
      setLoading(false);
      return;
    }

    // 3. Send the user to the correct dashboard
    if (profile.role === "ADMIN") {
      router.push("/admin");
    } else if (profile.role === "TRADER") {
      router.push("/trader");
    } else if (profile.role === "DRIVER") {
      router.push("/driver");
    } else {
      setError("Your account does not have a valid role.");
      await client.auth.signOut();
    }

    setLoading(false);
  }

  return (
    <main className="login">
      <div className="login-panel">
        <div className="login-hero">
          <div className="brand-mark logo-lg">ML</div>

          <p className="eyebrow">Myanmar Logistics Suite</p>

          <h1>Move cargo with confidence.</h1>

          <p className="hero-copy">
            Track vehicles, manage routes, and alert stakeholders before
            delays disrupt delivery schedules.
          </p>

          <ul className="feature-list">
            <li>Real-time shipment visibility</li>
            <li>Route risk monitoring</li>
            <li>Trader coordination</li>
          </ul>
        </div>

        <form className="card login-card" onSubmit={submit}>
          <div className="card-header compact">
            <div>
              <p className="eyebrow">Welcome back</p>
              <h2>Sign in</h2>
            </div>

            <span className="badge">Live</span>
          </div>

          {error && <div className="notice">{error}</div>}

          <label>
            Email
            <input
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              type="email"
              placeholder="you@example.com"
            />
          </label>

          <label>
            Password
            <input
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              type="password"
              placeholder="Your password"
            />
          </label>

          <button className="btn" style={{ width: "100%" }} disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p>Don't have an account?{" "} <Link href="/signup">Sign up</Link></p>
        </form>
      </div>
    </main>
  );
}