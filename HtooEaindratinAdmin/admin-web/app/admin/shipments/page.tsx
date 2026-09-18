"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Shipment = {
  id: string;
  tracking_number: string;
  cargo_description: string;
  trader_id: string | null;
  driver_id: string | null;
  route_id: string | null;
  status: string;
  created_at: string;
};

type Profile = {
  id: string;
  name: string;
  role: string;
};

type Route = {
  id: string;
  name: string;
};

type ShipmentRow = Shipment & {
  traderName: string;
  driverName: string;
  routeName: string;
};

export default function Shipments() {
  const [rows, setRows] = useState<ShipmentRow[]>([]);
  const [drivers, setDrivers] = useState<Profile[]>([]);
  const [selectedDrivers, setSelectedDrivers] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(true);
  const [assigningId, setAssigningId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadData() {
    const client = supabase();

    setLoading(true);
    setError("");

    const { data: shipments, error: shipmentError } = await client
      .from("shipments")
      .select(
        "id, tracking_number, cargo_description, trader_id, driver_id, route_id, status, created_at"
      )
      .order("created_at", { ascending: false });

    if (shipmentError) {
      setError(shipmentError.message);
      setLoading(false);
      return;
    }

    const { data: profiles, error: profileError } = await client
      .from("profiles")
      .select("id, name, role");

    if (profileError) {
      setError(profileError.message);
      setLoading(false);
      return;
    }

    const { data: routes, error: routeError } = await client
      .from("routes")
      .select("id, name");

    if (routeError) {
      setError(routeError.message);
      setLoading(false);
      return;
    }

    const profileMap = new Map(
      (profiles || []).map((profile: Profile) => [
        profile.id,
        profile.name,
      ])
    );

    const routeMap = new Map(
      (routes || []).map((route: Route) => [route.id, route.name])
    );

    const driverList = (profiles || []).filter(
      (profile: Profile) => profile.role === "DRIVER"
    );

    const result: ShipmentRow[] = (shipments || []).map(
      (shipment: Shipment) => ({
        ...shipment,
        traderName: shipment.trader_id
          ? profileMap.get(shipment.trader_id) || "Unknown"
          : "Unassigned",
        driverName: shipment.driver_id
          ? profileMap.get(shipment.driver_id) || "Unknown"
          : "Unassigned",
        routeName: shipment.route_id
          ? routeMap.get(shipment.route_id) || "Unknown"
          : "Unassigned",
      })
    );

    setRows(result);
    setDrivers(driverList);

    // Set the current driver as the selected value
    const selections: Record<string, string> = {};

    (shipments || []).forEach((shipment: Shipment) => {
      selections[shipment.id] = shipment.driver_id || "";
    });

    setSelectedDrivers(selections);
    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  async function assignDriver(shipmentId: string) {
    const driverId = selectedDrivers[shipmentId];

    if (!driverId) {
      setError("Please select a driver.");
      return;
    }

    setAssigningId(shipmentId);
    setError("");
    setSuccess("");

    const client = supabase();

    const { error: updateError } = await client
      .from("shipments")
      .update({
        driver_id: driverId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", shipmentId);

    if (updateError) {
      setError(updateError.message);
      setAssigningId(null);
      return;
    }

    setSuccess("Driver assigned successfully.");
    await loadData();
    setAssigningId(null);
  }

  if (loading) {
    return <p>Loading shipments...</p>;
  }

  if (error && rows.length === 0) {
    return (
      <div className="card">
        <p className="notice">{error}</p>
      </div>
    );
  }

  return (
    <>
      <h1>All Shipments</h1>

      {error && (
        <div className="notice" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      {success && (
        <div className="card" style={{ marginBottom: 16 }}>
          {success}
        </div>
      )}

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Tracking</th>
              <th>Cargo</th>
              <th>Trader</th>
              <th>Driver</th>
              <th>Route</th>
              <th>Status</th>
              <th>Assign Driver</th>
            </tr>
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={7}>No shipments found.</td>
              </tr>
            ) : (
              rows.map((shipment) => {
                const isAssigning = assigningId === shipment.id;

                return (
                  <tr key={shipment.id}>
                    <td>
                         <Link href={`/admin/shipments/${shipment.id}`}>
                         {shipment.tracking_number}
                         </Link>
                    </td>

                    <td>{shipment.cargo_description}</td>

                    <td>{shipment.traderName}</td>

                    <td>{shipment.driverName}</td>

                    <td>{shipment.routeName}</td>

                    <td>
                      <span className="badge">{shipment.status}</span>
                    </td>

                    <td>
                      <select
                        className="input"
                        value={selectedDrivers[shipment.id] || ""}
                        onChange={(e) =>
                          setSelectedDrivers((current) => ({
                            ...current,
                            [shipment.id]: e.target.value,
                          }))
                        }
                        disabled={isAssigning}
                      >
                        <option value="">Select driver</option>

                        {drivers.map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name}
                          </option>
                        ))}
                      </select>

                      <button
                        className="btn"
                        style={{ marginTop: 8 }}
                        onClick={() => assignDriver(shipment.id)}
                        disabled={isAssigning}
                      >
                        {isAssigning ? "Assigning..." : "Assign"}
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}