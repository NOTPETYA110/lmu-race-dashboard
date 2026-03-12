import { useState, useEffect, useCallback } from 'react'
import { parseRaceData, type RaceData } from '../parser'

const PROXY_URL = '/api/races'
const REFRESH_INTERVAL = 60_000

export function useRaceData() {
  const [data, setData] = useState<RaceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)

  const fetchData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const res = await fetch(PROXY_URL)
      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const html = await res.text()
      const parsed = parseRaceData(html)
      setData(parsed)
      setLastUpdated(new Date())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to fetch')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    const id = setInterval(fetchData, REFRESH_INTERVAL)
    return () => clearInterval(id)
  }, [fetchData])

  return { data, loading, error, lastUpdated, refresh: fetchData }
}
