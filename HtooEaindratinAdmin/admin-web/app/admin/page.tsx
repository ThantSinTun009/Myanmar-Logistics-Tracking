"use client";

import dynamic from "next/dynamic";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const TrackingMap = dynamic(() => import("../../components/Map"), {
  ssr: false,
  loading: () => (
    <div className="map">
      <div
        style={{
          display: "grid",
          placeItems: "center",
          height: "100%",
          color: "#5d6b82",
        }}
      >
        Loading map...
      </div>
    </div>
  ),
});

type Shipment = {
  id: string;
  tracking_number: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
};

export default function Admin() {
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadDashboard() {
      const client = supabase();

      const {
        data: { user },
      } = await client.auth.getUser();

      if (!user) {
        setError("You are not authenticated.");
        setLoading(false);
        return;
      }

      const { data, error: shipmentError } = await client
        .from("shipments")
        .select(
          "id, tracking_number, status, latitude, longitude"
        );

      if (shipmentError) {
        setError(shipmentError.message);
        setLoading(false);
        return;
      }

      setShipments(data || []);
      setLoading(false);
    }

    loadDashboard();
  }, []);

  if (loading) {
    return <p>Loading dashboard...</p>;
  }

  if (error) {
    return (
      <div className="card">
        <p className="notice">{error}</p>
      </div>
    );
  }

  const total = shipments.length;

  const active = shipments.filter(
    (shipment) => shipment.status !== "DELIVERED"
  ).length;

  const delayed = shipments.filter(
    (shipment) => shipment.status === "DELAYED"
  ).length;

  const delivered = shipments.filter(
    (shipment) => shipment.status === "DELIVERED"
  ).length;

  const shipmentWithLocation = shipments.find(
    (shipment) =>
      shipment.latitude !== null &&
      shipment.longitude !== null
  );

  const latitude = shipmentWithLocation?.latitude ?? 21.9588;
  const longitude = shipmentWithLocation?.longitude ?? 96.0891;

  return (
    <>
      <div className="top">
        <div className="page-header">
          <div>
            <p className="eyebrow">Operations overview</p>
            <h1 className="page-title">Admin Dashboard</h1>
          </div>

          <span className="badge">Live</span>
        </div>
      </div>

      <div className="grid grid4">
        <div className="card stat-card">
          <div className="label-row">
            <span className="muted">Total shipments</span>
          </div>

          <div className="stat">{total}</div>
        </div>

        <div className="card stat-card">
          <div className="label-row">
            <span className="muted">Active</span>
          </div>

          <div className="stat">{active}</div>
        </div>

        <div className="card stat-card">
          <div className="label-row">
            <span className="muted">Delayed</span>
          </div>

          <div className="stat">{delayed}</div>
        </div>

        <div className="card stat-card">
          <div className="label-row">
            <span className="muted">Delivered</span>
          </div>

          <div className="stat">{delivered}</div>
        </div>
      </div>

      <div className="grid grid2" style={{ marginTop: 16 }}>
        <div className="card map-card">
          <div className="card-header">
            <h2>Live Map</h2>

            <span className="badge warning">Updated</span>
          </div>

          <TrackingMap lat={latitude} lng={longitude} />
        </div>

        <div className="card">
          <div className="card-header">
            <h2>Demo flow</h2>

            <span className="badge high">Flow</span>
          </div>

          <ol className="flow-list">
            <li>Trader creates shipment</li>
            <li>Driver updates shipment status</li>
            <li>Admin closes route</li>
            <li>Affected users receive a warning</li>
            <li>Driver queues a checkpoint update offline</li>
            <li>Reconnect and synchronize</li>
            <li>Deliver shipment</li>
          </ol>
        </div>
      </div>
    </>
  );
}