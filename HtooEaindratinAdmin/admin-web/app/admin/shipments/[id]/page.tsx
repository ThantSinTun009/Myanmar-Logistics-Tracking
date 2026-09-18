"use client";

import dynamic from "next/dynamic";
import { use, useEffect, useState } from "react";
import { supabase } from "../../../../lib/supabase";

const TrackingMap = dynamic(() => import("../../../../components/Map"), {
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
  cargo_description: string;
  trader_id: string | null;
  driver_id: string | null;
  route_id: string | null;
  origin: string;
  destination: string;
  status: string;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
};

type Profile = {
  id: string;
  name: string;
};

type Route = {
  id: string;
  name: string;
};

type ShipmentEvent = {
  id: string;
  shipment_id: string;
  status: string;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  created_by: string | null;
  created_at: string;
};

type Document = {
  id: string;
  shipment_id: string;
  driver_id: string | null;
  file_name: string;
  file_url: string;
  document_type: string;
  created_at: string;
};

export default function Detail({
  params,
}: {
  params: Promise<{ id: string }>;
})  {
  const { id } = use(params);
  const [shipment, setShipment] = useState<Shipment | null>(null);
  const [events, setEvents] = useState<ShipmentEvent[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [route, setRoute] = useState<Route | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [documents, setDocuments] = useState<Document[]>([]);

  useEffect(() => {
    async function loadShipment() {
      const client = supabase();

      setLoading(true);
      setError("");

      // Get shipment
      const { data: shipmentData, error: shipmentError } = await client
        .from("shipments")
        .select("*")
        .eq("id", id)
        .single();

      if (shipmentError) {
        setError(shipmentError.message);
        setLoading(false);
        return;
      }

      // Get shipment events
      const { data: eventData, error: eventError } = await client
        .from("shipment_events")
        .select("*")
        .eq("shipment_id", id)
        .order("created_at", { ascending: true });

      if (eventError) {
        setError(eventError.message);
        setLoading(false);
        return;
      }
      //get documents
      const { data: documentData, error: documentError } = await client
      .from("documents")
     .select("id, shipment_id, driver_id, file_name, file_url, document_type, created_at")
     .eq("shipment_id", id)
      .order("created_at", { ascending: false });

      if (documentError) {
         setError(documentError.message);
        setLoading(false);
       return;
      }
      
      // Get profiles
      const { data: profileData, error: profileError } = await client
        .from("profiles")
        .select("id, name");

      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      // Get route
      let routeData: Route | null = null;

      if (shipmentData.route_id) {
        const { data, error: routeError } = await client
          .from("routes")
          .select("id, name")
          .eq("id", shipmentData.route_id)
          .single();

        if (routeError) {
          setError(routeError.message);
          setLoading(false);
          return;
        }

        routeData = data;
      }

      setShipment(shipmentData);
      setEvents(eventData || []);
      setDocuments(documentData || []);
      setProfiles(profileData || []);
      setRoute(routeData);
      setLoading(false);
    }

    loadShipment();
  }, [id]);

  useEffect(() => {
    const client = supabase();
  
    const channel = client
      .channel(`shipment-location-${id}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "shipments",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          setShipment((current) => {
            if (!current) return current;
  
            return {
              ...current,
              latitude: payload.new.latitude,
              longitude: payload.new.longitude,
              status: payload.new.status,
              updated_at: payload.new.updated_at,
            };
          });
        }
      )
      .subscribe();
  
    return () => {
      client.removeChannel(channel);
    };
  }, [id]);

  if (loading) {
    return <p>Loading shipment...</p>;
  }

  if (error) {
    return (
      <div className="card">
        <p className="notice">{error}</p>
      </div>
    );
  }

  if (!shipment) {
    return <p>Shipment not found.</p>;
  }

  const trader = profiles.find(
    (profile) => profile.id === shipment.trader_id
  );

  const driver = profiles.find(
    (profile) => profile.id === shipment.driver_id
  );

  const hasLocation =
    shipment.latitude !== null && shipment.longitude !== null;

    async function viewDocument(filePath: string) {
      const client = supabase();
    
      const { data, error } = await client.storage
        .from("shipment-documents")
        .createSignedUrl(filePath, 60 * 5);
    
      if (error) {
        setError(error.message);
        return;
      }
    
      window.open(data.signedUrl, "_blank");
    }
    return (
      <>
        <h1>{shipment.tracking_number}</h1>
    
        {/* Shipment Information */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Shipment Information</h2>
    
          <p>
            <b>Cargo:</b> {shipment.cargo_description}
          </p>
    
          <p>
            <b>Route:</b> {shipment.origin} → {shipment.destination}
          </p>
    
          <p>
            <b>Route name:</b> {route?.name || "Unassigned"}
          </p>
    
          <p>
            <b>Trader:</b> {trader?.name || "Unassigned"}
          </p>
    
          <p>
            <b>Driver:</b> {driver?.name || "Unassigned"}
          </p>
    
          <p>
            <b>Status:</b>{" "}
            <span className="badge">{shipment.status}</span>
          </p>
        </div>
    
        {/* Current Location */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Current Location</h2>
    
          {hasLocation ? (
            <>
              <TrackingMap
                lat={shipment.latitude as number}
                lng={shipment.longitude as number}
              />
    
              <small className="muted">
                Latitude: {shipment.latitude?.toFixed(4)} | Longitude:{" "}
                {shipment.longitude?.toFixed(4)}
              </small>
            </>
          ) : (
            <div className="notice">
              Current location is not available.
            </div>
          )}
        </div>
    
        {/* Timeline */}
        <div className="card" style={{ marginBottom: 16 }}>
          <h2>Timeline</h2>
    
          {events.length === 0 ? (
            <p className="muted">No shipment events yet.</p>
          ) : (
            <div className="timeline">
              {events.map((event) => {
                const creator = profiles.find(
                  (profile) => profile.id === event.created_by
                );
    
                return (
                  <div className="event" key={event.id}>
                    <b>{event.status}</b>
    
                    <div className="muted">
                      {new Date(event.created_at).toLocaleString()}
                    </div>
    
                    {event.description && (
                      <div>{event.description}</div>
                    )}
    
                    {creator && (
                      <small className="muted">
                        Created by: {creator.name}
                      </small>
                    )}
    
                    {event.latitude !== null &&
                      event.longitude !== null && (
                        <small className="muted">
                          Location: {event.latitude.toFixed(4)},{" "}
                          {event.longitude.toFixed(4)}
                        </small>
                      )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
    
        {/* Documents */}
        <div className="card">
          <h2>Documents</h2>
    
          {documents.length === 0 ? (
            <p className="muted">
              No documents uploaded for this shipment.
            </p>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>File Name</th>
                  <th>Type</th>
                  <th>Uploaded</th>
                  <th>Action</th>
                </tr>
              </thead>
    
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id}>
                    <td>{document.file_name}</td>
    
                    <td>
                      <span className="badge">
                        {document.document_type}
                      </span>
                    </td>
    
                    <td>
                      {new Date(
                        document.created_at
                      ).toLocaleString()}
                    </td>
    
                    <td>
                      <button
                        className="btn"
                        onClick={() =>
                          viewDocument(document.file_url)
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </>
    );
}