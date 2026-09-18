
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Route = {
  id: string;
  name: string;
  origin: string;
  destination: string;
  status: string;
  description: string | null;
  updated_at: string;
};

type Shipment = {
  id: string;
  trader_id: string | null;
  driver_id: string | null;
  route_id: string;
  status: string;
};

export default function Routes() {
  const [rows, setRows] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function loadRoutes() {
    const client = supabase();

    const { data, error } = await client
      .from("routes")
      .select("*")
      .order("name");

    if (error) {
      setError(error.message);
      return;
    }

    setRows(data || []);
  }

  useEffect(() => {
    async function load() {
      setLoading(true);
      await loadRoutes();
      setLoading(false);
    }

    load();
  }, []);

  async function toggleRoute(route: Route) {
    setError("");
    setProcessingId(route.id);

    const client = supabase();

    try {
      /*
       * OPEN → CLOSED
       *
       * Closing a route:
       * 1. Close the route.
       * 2. Find affected shipments.
       * 3. Mark them DELAYED.
       * 4. Create shipment timeline events.
       * 5. Create alerts for trader and driver.
       */

      if (route.status === "OPEN") {
        // 1. Close the route
        const { error: routeError } = await client
          .from("routes")
          .update({
            status: "CLOSED",
            updated_at: new Date().toISOString(),
          })
          .eq("id", route.id);

        if (routeError) {
          throw new Error(`Could not close route: ${routeError.message}`);
        }

        // 2. Find affected shipments
        const { data: shipments, error: shipmentError } = await client
          .from("shipments")
          .select("id, trader_id, driver_id, route_id, status")
          .eq("route_id", route.id)
          .neq("status", "DELIVERED");

        if (shipmentError) {
          throw new Error(
            `Could not find affected shipments: ${shipmentError.message}`
          );
        }

        const affectedShipments = (shipments || []) as Shipment[];

        // 3. Mark affected shipments as DELAYED
        for (const shipment of affectedShipments) {
          const { error: updateError } = await client
            .from("shipments")
            .update({
              status: "DELAYED",
              updated_at: new Date().toISOString(),
            })
            .eq("id", shipment.id);

          if (updateError) {
            throw new Error(
              `Could not update shipment ${shipment.id}: ${updateError.message}`
            );
          }

          // 4. Create shipment timeline event
          const { error: eventError } = await client
            .from("shipment_events")
            .insert({
              shipment_id: shipment.id,
              status: "DELAYED",
              description: `Shipment delayed because route "${route.name}" was closed.`,
              created_by: (await client.auth.getUser()).data.user?.id,
            });

          if (eventError) {
            throw new Error(
              `Could not create shipment event: ${eventError.message}`
            );
          }

          // 5. Create alert for trader
          if (shipment.trader_id) {
            const { error: traderAlertError } = await client
              .from("alerts")
              .insert({
                route_id: route.id,
                shipment_id: shipment.id,
                recipient_id: shipment.trader_id,
                message: `Route "${route.name}" has been closed. Your shipment may be delayed.`,
                severity: "HIGH",
                is_read: false,
              });

            if (traderAlertError) {
              throw new Error(
                `Could not create trader alert: ${traderAlertError.message}`
              );
            }
          }

          // Create alert for driver
          if (shipment.driver_id) {
            const { error: driverAlertError } = await client
              .from("alerts")
              .insert({
                route_id: route.id,
                shipment_id: shipment.id,
                recipient_id: shipment.driver_id,
                message: `Route "${route.name}" has been closed. Your shipment may be delayed.`,
                severity: "HIGH",
                is_read: false,
              });

            if (driverAlertError) {
              throw new Error(
                `Could not create driver alert: ${driverAlertError.message}`
              );
            }
          }
        }
      } else {
        // CLOSED → OPEN
        const { error: routeError } = await client
          .from("routes")
          .update({
            status: "OPEN",
            updated_at: new Date().toISOString(),
          })
          .eq("id", route.id);

        if (routeError) {
          throw new Error(`Could not reopen route: ${routeError.message}`);
        }
      }

      await loadRoutes();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setProcessingId(null);
    }
  }

  const totalRoutes = rows.length;

  const openRoutes = rows.filter(
    (route) => route.status === "OPEN"
  ).length;

  const closedRoutes = rows.filter(
    (route) => route.status === "CLOSED"
  ).length;

  if (loading) {
    return <p>Loading routes...</p>;
  }

  return (
    <>
      <h1>Route Management</h1>

      {error && (
        <div className="notice" style={{ marginBottom: 16 }}>
          {error}
        </div>
      )}

      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <div className="card">
          <p className="eyebrow">Total Routes</p>
          <h2>{totalRoutes}</h2>
        </div>

        <div className="card">
          <p className="eyebrow">Open Routes</p>
          <h2>{openRoutes}</h2>
        </div>

        <div className="card">
          <p className="eyebrow">Closed Routes</p>
          <h2>{closedRoutes}</h2>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead>
            <tr>
              <th>Route</th>
              <th>Origin</th>
              <th>Destination</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>

          <tbody>
            {rows.map((route) => {
              const isProcessing = processingId === route.id;

              return (
                <tr key={route.id}>
                  <td>{route.name}</td>

                  <td>{route.origin}</td>

                  <td>{route.destination}</td>

                  <td>
                    <span
                      className={
                        "badge " +
                        (route.status === "CLOSED" ? "high" : "")
                      }
                    >
                      {route.status}
                    </span>
                  </td>

                  <td>
                    <button
                      className={
                        "btn " +
                        (route.status === "OPEN"
                          ? "danger"
                          : "secondary")
                      }
                      onClick={() => toggleRoute(route)}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? "Processing..."
                        : route.status === "OPEN"
                          ? "Close route"
                          : "Open route"}
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </>
  );
}

