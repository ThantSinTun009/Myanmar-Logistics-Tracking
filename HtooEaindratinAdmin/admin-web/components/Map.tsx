'use client'

import { useEffect, useState } from 'react'
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
  useMap,
} from 'react-leaflet'

import 'leaflet/dist/leaflet.css'

type Props = {
  lat?: number
  lng?: number
}

function MapUpdater({
  lat,
  lng,
}: {
  lat: number
  lng: number
}) {
  const map = useMap()

  useEffect(() => {
    map.setView([lat, lng], map.getZoom())
  }, [lat, lng, map])

  return null
}

export default function TrackingMap({
  lat = 21.9588,
  lng = 96.0891,
}: Props) {
  const p: [number, number] = [lat, lng]

  const [icon, setIcon] = useState<any>(null)

  useEffect(() => {
    let active = true

    import('leaflet').then(({ default: L }) => {
      if (active) {
        setIcon(
          L.icon({
            iconUrl:
              'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
            iconRetinaUrl:
              'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
            shadowUrl:
              'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
          })
        )
      }
    })

    return () => {
      active = false
    }
  }, [])

  return (
    <div className="map">
      {icon ? (
        <MapContainer
          center={p}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          <MapUpdater lat={lat} lng={lng} />

          <Marker position={p} icon={icon}>
            <Popup>Simulated truck location</Popup>
          </Marker>

          <Polyline
            positions={[
              [16.8409, 96.1735],
              [21.9588, 96.0891],
              [22.0347, 96.4583],
              [23.9714, 97.9073],
            ]}
          />
        </MapContainer>
      ) : (
        <div
          style={{
            display: 'grid',
            placeItems: 'center',
            height: '100%',
            color: '#5d6b82',
          }}
        >
          Loading map...
        </div>
      )}
    </div>
  )
}