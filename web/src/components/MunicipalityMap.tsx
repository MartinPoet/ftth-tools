'use client'

import 'leaflet/dist/leaflet.css'
import React, { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, GeoJSON } from 'react-leaflet'
import type { FeatureCollection, Geometry } from 'geojson'
import L from 'leaflet'

// Workaround: leaflets Default icon holds a private `_getIconUrl` we need to delete.
// We cast to this interface instead of `any`.
interface IconDefaultPrototype {
  _getIconUrl?: () => string
}

delete (L.Icon.Default.prototype as IconDefaultPrototype)._getIconUrl

L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/leaflet/marker-icon-2x.png',
  iconUrl: '/leaflet/marker-icon.png',
  shadowUrl: '/leaflet/marker-shadow.png',
})

interface MapProps {
  lat: number
  lng: number
  gkz: string
}

export default function MunicipalityMap({ lat, lng, gkz }: MapProps) {
  const [boundary, setBoundary] = useState<FeatureCollection<Geometry> | null>(null)

  useEffect(() => {
    fetch(`/geom/${gkz}.geojson`)
      .then(res => {
        if (!res.ok) throw new Error('Grenzdaten nicht gefunden')
        return res.json() as Promise<FeatureCollection<Geometry>>
      })
      .then(setBoundary)
      .catch(err => {
        console.error(err)
        setBoundary(null)
      })
  }, [gkz])

  return (
    <MapContainer center={[lat, lng]} zoom={12} className="h-full w-full rounded-lg">
      <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

      {boundary && (
        <GeoJSON data={boundary} style={{ color: '#10B981', weight: 2 }} />
      )}

      <Marker position={[lat, lng]}>
        <Popup>Hier befindet sich die Gemeinde</Popup>
      </Marker>
    </MapContainer>
  )
}
