import { useState, useEffect } from 'react'
import { useRaceData } from './hooks/useRaceData'
import type { Race, Tier } from './parser'
import { formatDistanceToNowStrict, differenceInSeconds, format } from 'date-fns'
import { de } from 'date-fns/locale'

const TIER_CONFIG: Record<Tier, { label: string; rank: string; color: string; glow: string }> = {
  beginner: { label: 'Beginner', rank: 'Bronze', color: 'text-bronze', glow: 'glow-bronze' },
  intermediate: { label: 'Intermediate', rank: 'Silver', color: 'text-silver', glow: 'glow-silver' },
  advanced: { label: 'Advanced', rank: 'Gold+', color: 'text-gold', glow: 'glow-gold' },
}

type Filter = Tier | 'all'

function getNextTime(times: Date[]): Date | null {
  const now = new Date()
  return times.find(t => t > now) ?? null
}

function getNextRaceAcrossAll(races: Race[]): { race: Race; time: Date } | null {
  const now = new Date()
  let best: { race: Race; time: Date } | null = null

  for (const race of races) {
    const next = race.times.find(t => t > now)
    if (next && (!best || next < best.time)) {
      best = { race, time: next }
    }
  }
  return best
}

function Countdown({ target }: { target: Date }) {
  const [now, setNow] = useState(new Date())

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = differenceInSeconds(target, now)
  if (diff <= 0) return <span className="text-neon font-bold">LIVE</span>

  const h = Math.floor(diff / 3600)
  const m = Math.floor((diff % 3600) / 60)
  const s = diff % 60

  return (
    <span className="countdown-live font-mono font-bold text-neon">
      {h > 0 && `${h}h `}{String(m).padStart(2, '0')}m {String(s).padStart(2, '0')}s
    </span>
  )
}

function RaceCard({ race }: { race: Race }) {
  const config = TIER_CONFIG[race.tier]
  const now = new Date()
  const upcomingTimes = race.times.filter(t => t > now).slice(0, 4)
  const nextTime = upcomingTimes[0]

  return (
    <div className={`bg-card rounded-xl border border-card-border overflow-hidden ${config.glow} transition-all hover:scale-[1.02]`}>
      {race.imageUrl && (
        <div className="relative aspect-[2/3] max-h-48 overflow-hidden">
          <img src={race.imageUrl} alt={race.name} className="w-full h-full object-cover" />
          <div className="absolute top-2 left-2">
            <span className={`px-2 py-1 rounded text-xs font-bold uppercase bg-black/70 ${config.color}`}>
              {config.rank}
            </span>
          </div>
        </div>
      )}

      <div className="p-4">
        <h3 className="text-lg font-bold text-white mb-2">{race.name}</h3>

        <div className="flex justify-between text-sm text-text-dim mb-1">
          <span>Track</span>
          <span className="text-text font-medium">{race.track}</span>
        </div>

        <div className="flex justify-between text-sm text-text-dim mb-3">
          <span>Duration</span>
          <span className="text-text font-medium">{race.duration}</span>
        </div>

        {nextTime && (
          <div className="mb-3 p-2 rounded-lg bg-black/30 text-center">
            <div className="text-xs text-text-dim uppercase mb-1">Next Race</div>
            <Countdown target={nextTime} />
          </div>
        )}

        <div className="space-y-1">
          {upcomingTimes.map((t, i) => (
            <div key={i} className="flex justify-between text-xs">
              <span className="text-text-dim">{format(t, 'HH:mm', { locale: de })}</span>
              <span className="text-text-dim">
                {formatDistanceToNowStrict(t, { locale: de, addSuffix: true })}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function CommunityEventCard({ event }: { event: { name: string; imageUrl: string; url: string; host: string; game: string } }) {
  return (
    <a
      href={event.url}
      target="_blank"
      rel="noopener noreferrer"
      className="bg-card rounded-xl border border-card-border overflow-hidden transition-all hover:scale-[1.02] hover:border-neon/30 block"
    >
      {event.imageUrl && (
        <div className="aspect-video overflow-hidden">
          <img src={event.imageUrl} alt={event.name} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-4">
        <h3 className="text-sm font-bold text-white mb-1">{event.name}</h3>
        <div className="flex items-center gap-2 text-xs text-text-dim">
          {event.game && <span className="px-1.5 py-0.5 rounded bg-black/40 text-neon">{event.game}</span>}
          {event.host && <span>{event.host}</span>}
        </div>
      </div>
    </a>
  )
}

export default function App() {
  const { data, loading, error, lastUpdated, refresh } = useRaceData()
  const [filter, setFilter] = useState<Filter>('all')

  const filters: { key: Filter; label: string; color: string }[] = [
    { key: 'all', label: 'All', color: 'text-neon' },
    { key: 'beginner', label: 'Bronze', color: 'text-bronze' },
    { key: 'intermediate', label: 'Silver', color: 'text-silver' },
    { key: 'advanced', label: 'Gold+', color: 'text-gold' },
  ]

  const filteredRaces = data?.lmuDailies.filter(r => filter === 'all' || r.tier === filter) ?? []
  const nextRace = data ? getNextRaceAcrossAll(
    filter === 'all' ? data.lmuDailies : data.lmuDailies.filter(r => r.tier === filter)
  ) : null

  return (
    <div className="min-h-screen bg-bg">
      {/* Header */}
      <header className="border-b border-card-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-white">
              <span className="text-neon">LMU</span> Race Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-text-dim hidden sm:inline">
                Updated {format(lastUpdated, 'HH:mm:ss')}
              </span>
            )}
            <button
              onClick={refresh}
              disabled={loading}
              className="px-3 py-1.5 rounded-lg bg-neon/10 text-neon text-sm font-medium hover:bg-neon/20 transition-colors disabled:opacity-50 border border-neon/20"
            >
              {loading ? 'Loading...' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Error */}
        {error && (
          <div className="bg-danger/10 border border-danger/30 rounded-lg p-4 text-danger text-center">
            Failed to load: {error}
          </div>
        )}

        {/* Countdown Banner */}
        {nextRace && (
          <div className="bg-card rounded-xl border border-neon/20 p-6 text-center">
            <div className="text-xs text-text-dim uppercase tracking-wider mb-2">Next Race</div>
            <div className="text-2xl md:text-4xl mb-2">
              <Countdown target={nextRace.time} />
            </div>
            <div className="flex items-center justify-center gap-3 text-sm">
              <span className={`font-bold ${TIER_CONFIG[nextRace.race.tier].color}`}>
                {TIER_CONFIG[nextRace.race.tier].rank}
              </span>
              <span className="text-white font-medium">{nextRace.race.name}</span>
              <span className="text-text-dim">@ {nextRace.race.track}</span>
              <span className="text-text-dim">{format(nextRace.time, 'HH:mm')}</span>
            </div>
          </div>
        )}

        {/* Filter Bar */}
        <div className="flex gap-2 flex-wrap">
          {filters.map(f => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all border ${
                filter === f.key
                  ? `${f.color} bg-white/10 border-current`
                  : 'text-text-dim bg-card border-card-border hover:border-text-dim'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Loading Skeleton */}
        {loading && !data && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="bg-card rounded-xl border border-card-border h-80 animate-pulse" />
            ))}
          </div>
        )}

        {/* LMU Daily Races */}
        {filteredRaces.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              <span className="text-neon">LMU</span> Daily Races
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRaces.map((race, i) => (
                <RaceCard key={`lmu-${i}`} race={race} />
              ))}
            </div>
          </section>
        )}

        {/* rFactor2 Daily Races */}
        {data && data.rfactorDailies.length > 0 && filter === 'all' && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              <span className="text-text-dim">rFactor2</span> Daily Races
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {data.rfactorDailies.map((race, i) => (
                <RaceCard key={`rf-${i}`} race={race} />
              ))}
            </div>
          </section>
        )}

        {/* Community Events */}
        {data && data.communityEvents.length > 0 && (
          <section>
            <h2 className="text-lg font-bold text-white mb-4">
              Community Events
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.communityEvents.map((event, i) => (
                <CommunityEventCard key={`ev-${i}`} event={event} />
              ))}
            </div>
          </section>
        )}

        {/* Footer */}
        <footer className="text-center text-xs text-text-dim py-8 border-t border-card-border">
          Data sourced from <a href="https://racecontrol.gg" target="_blank" rel="noopener noreferrer" className="text-neon hover:underline">RaceControl.gg</a>
          {' '} &middot; Auto-refresh every 60s
        </footer>
      </main>
    </div>
  )
}
