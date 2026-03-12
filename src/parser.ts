export type Tier = 'beginner' | 'intermediate' | 'advanced'

export interface Race {
  name: string
  tier: Tier
  track: string
  duration: string
  imageUrl: string
  times: Date[]
}

export interface CommunityEvent {
  name: string
  imageUrl: string
  url: string
  host: string
  game: string
}

export interface RaceData {
  lmuDailies: Race[]
  rfactorDailies: Race[]
  communityEvents: CommunityEvent[]
}

function parseTier(text: string): Tier {
  const t = text.trim().toLowerCase()
  if (t.includes('intermediate')) return 'intermediate'
  if (t.includes('advanced')) return 'advanced'
  return 'beginner'
}

function parseTimeString(text: string): Date | null {
  // Format: "12 Mar at 8:20am" or "13 Mar at 1:00pm"
  const match = text.match(/(\d+)\s+(\w+)\s+at\s+(\d+):(\d+)(am|pm)/i)
  if (!match) return null

  const [, day, month, hourStr, minute, ampm] = match
  const monthMap: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  }

  let hour = parseInt(hourStr)
  if (ampm.toLowerCase() === 'pm' && hour !== 12) hour += 12
  if (ampm.toLowerCase() === 'am' && hour === 12) hour = 0

  const now = new Date()
  const date = new Date(now.getFullYear(), monthMap[month] ?? now.getMonth(), parseInt(day), hour, parseInt(minute))
  return date
}

function parseRaceCards(container: Element): Race[] {
  const races: Race[] = []
  const cards = container.querySelectorAll('.scheduled-race-card')

  for (const card of cards) {
    const tierEl = card.querySelector('.tier-badge')
    const tier = parseTier(tierEl?.textContent ?? 'beginner')

    const nameEl = card.querySelector('.race-info h4')
    const name = nameEl?.textContent?.trim() ?? 'Unknown'

    const imgEl = card.querySelector('.event-image img') as HTMLImageElement | null
    const imageUrl = imgEl?.getAttribute('src') ?? ''

    // Extract track and duration from race-header spans
    const headers = card.querySelectorAll('.race-header')
    let duration = ''
    let track = ''

    for (const header of headers) {
      const spans = header.querySelectorAll('span')
      const lastSpan = spans[spans.length - 1]
      const labelText = spans[0]?.textContent ?? ''

      if (labelText.includes('Duration')) {
        duration = lastSpan?.textContent?.trim() ?? ''
      } else if (labelText.includes('Track')) {
        track = lastSpan?.textContent?.trim() ?? ''
      }
    }

    // Extract times
    const timeBadges = card.querySelectorAll('.marquee-content .badge')
    const times: Date[] = []
    for (const badge of timeBadges) {
      const d = parseTimeString(badge.textContent ?? '')
      if (d) times.push(d)
    }

    races.push({ name, tier, track, duration, imageUrl, times })
  }

  return races
}

function parseCommunityEvents(doc: Document): CommunityEvent[] {
  const events: CommunityEvent[] = []
  const cards = doc.querySelectorAll('.community-event-card')

  for (const card of cards) {
    const titleEl = card.querySelector('.card-body h3 a')
    const name = titleEl?.textContent?.trim() ?? 'Unknown'
    const url = titleEl?.getAttribute('href') ?? ''

    const imgEl = card.querySelector('.event-image img') as HTMLImageElement | null
    const imageUrl = imgEl?.getAttribute('src') ?? ''

    const hostEl = card.querySelector('.community a')
    const host = hostEl?.textContent?.trim() ?? ''

    const gameEl = card.querySelector('.badge-platform')
    const game = gameEl?.textContent?.trim() ?? ''

    events.push({ name, imageUrl, url: url.startsWith('/') ? `https://racecontrol.gg${url}` : url, host, game })
  }

  return events
}

export function parseRaceData(html: string): RaceData {
  const parser = new DOMParser()
  const doc = parser.parseFromString(html, 'text/html')

  // There are multiple glide containers with scheduled-race-cards
  // First section = LMU dailies, second = rFactor2 dailies
  const sections = doc.querySelectorAll('.glide[data-glide-config="events.max4"]')

  const lmuDailies = sections[0] ? parseRaceCards(sections[0]) : []
  const rfactorDailies = sections[1] ? parseRaceCards(sections[1]) : []
  const communityEvents = parseCommunityEvents(doc)

  return { lmuDailies, rfactorDailies, communityEvents }
}
