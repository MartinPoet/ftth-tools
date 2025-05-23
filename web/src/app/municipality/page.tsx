'use client'

import React, { useState } from 'react'
import dynamic from 'next/dynamic'
import SidebarLayout from '@/components/SidebarLayout'

const MunicipalityMap = dynamic(
  () => import('@/components/MunicipalityMap'),
  { ssr: false }
)

interface Municipality {
  GKZ: string
  Gemeindename: string
  Bundesland: string
}

interface ContactInfo {
  buergermeister: string | null
  telefon: string | null
  fax: string | null
  email: string | null
  homepage: string | null
}

export default function MunicipalityPage() {
  const [query, setQuery] = useState<string>('')
  const [result, setResult] = useState<Municipality | Municipality[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState<boolean>(false)

  // Stats-State: count, homes, sdu, mdu
  const [stats, setStats] = useState<{
    count: number
    homes: number
    sdu: number
    mdu: number
  } | null>(null)
  const [statsLoading, setStatsLoading] = useState<boolean>(false)

  // Coord-State für die Karte
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)

  // Kontakt-Info (Bgm, Telefon, E-Mail, Homepage)
  const [contact, setContact] = useState<ContactInfo | null>(null)

  // Gemeinde suchen
  const handleSearch = async () => {
    setLoading(true)
    setError(null)
    setResult(null)
    setStats(null)
    setCoords(null)
    setContact(null)
    try {
      const res = await fetch(`/api/municipality?gkz=${encodeURIComponent(query)}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Fehler: ${res.status}`)
      }
      const data = (await res.json()) as Municipality | { results: Municipality[] }
      setResult('results' in data ? data.results : data)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setLoading(false)
    }
  }

  // Address-Stats, Geo-Daten und Kontakt-Info laden
  const loadStats = async () => {
    if (!result || Array.isArray(result)) return
    setStatsLoading(true)
    setError(null)
    try {
      // Stats laden
      const res = await fetch(`/api/address?gkz=${result.GKZ}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || `Fehler: ${res.status}`)
      }
      const statData = (await res.json()) as {
        count: number
        homes: number
        sdu: number
        mdu: number
      }
      setStats(statData)

      // Geo-Koordinaten und Kontakt-Info laden
      const geoRes = await fetch(`/api/municipality/details?gkz=${result.GKZ}`)
      if (geoRes.ok) {
        const geo = (await geoRes.json()) as {
          lat: number
          lng: number
          buergermeister: string | null
          telefon: string | null
          fax: string | null
          email: string | null
          homepage: string | null
        }
        setCoords({ lat: geo.lat, lng: geo.lng })
        setContact({
          buergermeister: geo.buergermeister,
          telefon: geo.telefon,
          fax: geo.fax,
          email: geo.email,
          homepage: geo.homepage
        })
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Unbekannter Fehler')
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <SidebarLayout>
      <h1 className="text-2xl font-bold mb-4">Gemeinde-Suche</h1>

      {/* Suchformular */}
      <div className="flex space-x-2 mb-6">
        <input
          type="text"
          placeholder="GKZ oder Name eingeben"
          value={query}
          onChange={e => setQuery(e.target.value)}
          className="border px-3 py-2 rounded flex-grow"
        />
        <button
          onClick={handleSearch}
          disabled={loading || !query}
          className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700 disabled:opacity-50"
        >
          {loading ? 'Suche…' : 'Suchen'}
        </button>
      </div>

      {/* Fehlermeldung */}
      {error && <p className="text-red-600 mb-4">{error}</p>}

      {/* Suchergebnis */}
      {result && (
        Array.isArray(result) ? (
          <div className="space-y-4">
            {result.map(item => (
              <div key={item.GKZ} className="bg-white shadow rounded p-4">
                <h2 className="text-xl font-semibold mb-2">{item.Gemeindename}</h2>
                <p>GKZ: {item.GKZ}</p>
                <p>Bundesland: {item.Bundesland}</p>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Einzelansicht */}
            <div className="bg-white shadow rounded p-4">
              <h2 className="text-xl font-semibold mb-2">{result.Gemeindename}</h2>
              <table className="w-full table-auto mb-4">
                <tbody>
                  <tr>
                    <th className="text-left p-1">GKZ</th>
                    <td className="p-1">{result.GKZ}</td>
                  </tr>
                  <tr>
                    <th className="text-left p-1">Bundesland</th>
                    <td className="p-1">{result.Bundesland}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Button zum Laden der Statistik */}
            <button
              onClick={loadStats}
              disabled={statsLoading}
              className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {statsLoading ? 'Lade…' : 'Statistiken & Karte anzeigen'}
            </button>

            {/* Stats + Kontakt + Karte in einer Box */}
            {stats && coords && contact && (
              <div className="mt-6 bg-white shadow rounded p-4">
                <div className="flex flex-col md:flex-row md:space-x-6">
                  {/* Linke Spalte: Kontakt & Stats */}
                  <div className="md:w-1/3 space-y-2">
                    {contact.buergermeister && (
                      <p>
                        Bürgermeister: <strong>{contact.buergermeister}</strong>
                      </p>
                    )}
                    {contact.telefon && (
                      <p>
                        Telefon:{' '}
                        <a href={`tel:${contact.telefon}`} className="underline">
                          {contact.telefon}
                        </a>
                      </p>
                    )}
                    {contact.email && (
                      <p>
                        E-Mail:{' '}
                        <a href={`mailto:${contact.email}`} className="underline">
                          {contact.email}
                        </a>
                      </p>
                    )}
                    {contact.homepage && (
                      <p>
                        Homepage:{' '}
                        <a
                          href={contact.homepage}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="underline"
                        >
                          {contact.homepage}
                        </a>
                      </p>
                    )}
                    <hr className="my-2" />
                    <p>
                      Anzahl Adressen:{' '}
                      <strong>{stats.count.toLocaleString()}</strong>
                    </p>
                    <p>
                      Homes:{' '}
                      <strong>{stats.homes.toLocaleString()}</strong>
                    </p>
                    <p>
                      SDU:{' '}
                      <strong>{stats.sdu.toLocaleString()}</strong>
                    </p>
                    <p>
                      MDU:{' '}
                      <strong>{stats.mdu.toLocaleString()}</strong>
                    </p>
                  </div>

                  {/* Karte rechts, quadratisch */}
                  <div className="md:w-2/3 w-full aspect-square">
                    <MunicipalityMap
                      lat={coords.lat}
                      lng={coords.lng}
                      gkz={result.GKZ}
                    />
                  </div>
                </div>
              </div>
            )}
          </>
        )
      )}
    </SidebarLayout>
  )
}
