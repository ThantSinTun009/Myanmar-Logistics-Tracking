
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Profile = {
  id: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
};

export default function Profiles() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadProfiles() {
      const client = supabase();

      const { data, error: profileError } = await client
        .from("profiles")
        .select("id, name, email, role, created_at")
        .order("created_at", { ascending: true });

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      setProfiles(data || []);
      setLoading(false);
    }

    loadProfiles();
  }, []);

  const totalUsers = profiles.length;
  const totalDrivers = profiles.filter(
    (profile) => profile.role === "DRIVER"
  ).length;
  const totalTraders = profiles.filter(
    (profile) => profile.role === "TRADER"
  ).length;

  if (loading) {
    return <p>Loading profiles...</p>;
  }

  if (error) {
    return (
      <div className="card">
        <p className="notice">{error}</p>
      </div>
    );
  }

  return (
    <>
      <h1>Profiles</h1>

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <div className="card">
          <p className="eyebrow">Total Users</p>
          <h2>{totalUsers}</h2>
        </div>

        <div className="card">
          <p className="eyebrow">Drivers</p>
          <h2>{totalDrivers}</h2>
        </div>

        <div className="card">
          <p className="eyebrow">Traders</p>
          <h2>{totalTraders}</h2>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {profiles.length === 0 ? (
              <tr>
                <td colSpan={4}>No profiles found.</td>
              </tr>
            ) : (
              profiles.map((profile) => (
                <tr key={profile.id}>
                  <td>{profile.name}</td>
                  <td>{profile.email}</td>
                  <td>
                    <span className="badge">{profile.role}</span>
                  </td>
                  <td>
                    {new Date(profile.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}

