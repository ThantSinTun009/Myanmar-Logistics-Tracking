
"use client";

import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";

type Alert = {
  id: string;
  route_id: string | null;
  shipment_id: string | null;
  recipient_id: string | null;
  message: string;
  severity: string;
  is_read: boolean;
  created_at: string;
};

type Route = {
  id: string;
  name: string;
};

type AlertRow = Alert & {
  routeName: string;
};

export default function Alerts() {
  const [rows, setRows] = useState<AlertRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadAlerts() {
      const client = supabase();

      setLoading(true);
      setError("");

      // Get alerts
      const { data: alerts, error: alertError } = await client
        .from("alerts")
        .select("*")
        .order("created_at", { ascending: false });

      if (alertError) {
        setError(alertError.message);
        setLoading(false);
        return;
      }

      // Get routes
      const { data: routes, error: routeError } = await client
        .from("routes")
        .select("id, name");

      if (routeError) {
        setError(routeError.message);
        setLoading(false);
        return;
      }

      // Match route IDs with route names
      const routeMap = new Map(
        (routes || []).map((route: Route) => [route.id, route.name])
      );

      const result: AlertRow[] = (alerts || []).map((alert: Alert) => ({
        ...alert,
        routeName: alert.route_id
          ? routeMap.get(alert.route_id) || "Unknown route"
          : "Shipment alert",
      }));

      setRows(result);
      setLoading(false);
    }

    loadAlerts();
  }, []);

  const totalAlerts = rows.length;

  const unreadAlerts = rows.filter(
    (alert) => !alert.is_read
  ).length;

  const readAlerts = rows.filter(
    (alert) => alert.is_read
  ).length;

  if (loading) {
    return <p>Loading alerts...</p>;
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
      <h1>Alerts</h1>

      {/* Alert summary */}
      <div
        className="grid"
        style={{
          gridTemplateColumns: "repeat(3, 1fr)",
          marginBottom: 24,
        }}
      >
        <div className="card">
          <p className="eyebrow">Total Alerts</p>
          <h2>{totalAlerts}</h2>
        </div>

        <div className="card">
          <p className="eyebrow">Unread</p>
          <h2>{unreadAlerts}</h2>
        </div>

        <div className="card">
          <p className="eyebrow">Read</p>
          <h2>{readAlerts}</h2>
        </div>
      </div>

      {/* Alert list */}
      <div className="grid">
        {rows.length === 0 ? (
          <div className="card">
            No alerts yet. Close a route from Route Management to generate
            one.
          </div>
        ) : (
          rows.map((alert) => (
            <div className="card" key={alert.id}>
              <div className="row">
                <span
                  className={
                    "badge " +
                    (alert.severity === "HIGH"
                      ? "high"
                      : alert.severity === "WARNING"
                        ? "warning"
                        : "")
                  }
                >
                  {alert.severity}
                </span>

                <span
                  className={
                    "badge " +
                    (alert.is_read ? "secondary" : "high")
                  }
                >
                  {alert.is_read ? "Read" : "Unread"}
                </span>

                <span className="muted">
                  {new Date(alert.created_at).toLocaleString()}
                </span>
              </div>

              <p>{alert.message}</p>

              <small className="muted">{alert.routeName}</small>
            </div>
          ))
        )}
      </div>
    </>
  );
}

