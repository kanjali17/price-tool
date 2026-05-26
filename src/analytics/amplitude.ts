import type {
  AnalyticsEventName,
  BaseEventProperties,
  EventPropertiesMap,
  SectionViewId,
  StoredAnalyticsEvent,
} from './events'
const EVENT_LOG_KEY = 'daikin-amp-event-log'
const ESTIMATE_ID_KEY = 'daikin-estimate-analytics-id'
const MAX_LOG_EVENTS = 2000

const APP_VERSION = '1.0.0'

export function roundToHundred(value: number): number {
  return Math.round(value / 100) * 100
}

export function getEstimateId(): string {
  let id = sessionStorage.getItem(ESTIMATE_ID_KEY)
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
    sessionStorage.setItem(ESTIMATE_ID_KEY, id)
  }
  return id
}

/** New estimate session (e.g. after reset). */
export function resetEstimateAnalyticsSession(): void {
  const id = crypto.randomUUID().replace(/-/g, '').slice(0, 8)
  sessionStorage.setItem(ESTIMATE_ID_KEY, id)
  viewedSections.clear()
}

function truncate32(value: string): string {
  return value.length <= 32 ? value : value.slice(0, 32)
}

function appendToEventLog(event: StoredAnalyticsEvent): void {
  try {
    const raw = sessionStorage.getItem(EVENT_LOG_KEY)
    const list: StoredAnalyticsEvent[] = raw ? JSON.parse(raw) : []
    list.push(event)
    if (list.length > MAX_LOG_EVENTS) list.splice(0, list.length - MAX_LOG_EVENTS)
    sessionStorage.setItem(EVENT_LOG_KEY, JSON.stringify(list))
  } catch {
    /* ignore storage errors */
  }
}

function buildBaseProps(totalInstallCost: number): BaseEventProperties {
  return {
    estimate_id: getEstimateId(),
    app_version: APP_VERSION,
    total_at_time_of_event: roundToHundred(totalInstallCost),
  }
}

async function sendToAmplitude(event: StoredAnalyticsEvent): Promise<void> {
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY
  if (!apiKey || import.meta.env.DEV) return

  await fetch('https://api2.amplitude.com/2/httpapi', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      api_key: apiKey,
      events: [
        {
          event_type: event.event_type,
          user_id: getAnonymousUserId(),
          event_properties: event.event_properties,
        },
      ],
    }),
  })
}

function getAnonymousUserId(): string {
  const key = 'daikin-amp-user-id'
  let id = localStorage.getItem(key)
  if (!id) {
    id = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
    localStorage.setItem(key, id)
  }
  return id
}

export function trackEstimateEvent<E extends AnalyticsEventName>(
  eventName: E,
  properties: EventPropertiesMap[E],
  totalInstallCost: number
): void {
  const sanitized: Record<string, string | number> = {}
  for (const [key, val] of Object.entries(properties as Record<string, unknown>)) {
    if (val === undefined) continue
    if (typeof val === 'number') sanitized[key] = Number.isInteger(val) ? val : Math.round(val)
    else if (typeof val === 'string') sanitized[key] = truncate32(val)
  }

  const payload: StoredAnalyticsEvent = {
    event_type: eventName,
    event_properties: {
      ...buildBaseProps(totalInstallCost),
      ...sanitized,
    },
  }

  if (import.meta.env.DEV) {
    console.log('[amp]', eventName, payload.event_properties)
  } else {
    void sendToAmplitude(payload)
  }

  appendToEventLog(payload)
}

const equipmentDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

export function trackEquipmentQuantityChanged(
  props: EventPropertiesMap['equipment_quantity_changed'],
  totalInstallCost: number
): void {
  const key = `${props.section}:${props.model}`
  const existing = equipmentDebounceTimers.get(key)
  if (existing) clearTimeout(existing)
  equipmentDebounceTimers.set(
    key,
    setTimeout(() => {
      equipmentDebounceTimers.delete(key)
      trackEstimateEvent('equipment_quantity_changed', props, totalInstallCost)
    }, 1500)
  )
}

export function equipmentKeyToSection(key: string): 'vrv' | 'other' | null {
  if (key.startsWith('vrv')) return 'vrv'
  if (key.startsWith('other')) return 'other'
  return null
}

const viewedSections = new Set<SectionViewId>()
let sectionObserver: IntersectionObserver | null = null
const sectionTargetMap = new WeakMap<Element, SectionViewId>()

export function registerSectionViewTarget(
  element: Element | null,
  sectionId: SectionViewId,
  totalInstallCost: number
): () => void {
  if (!element) return () => undefined

  if (!sectionObserver) {
    sectionObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting || entry.intersectionRatio <= 0) continue
          const section = sectionTargetMap.get(entry.target)
          if (!section || viewedSections.has(section)) continue
          viewedSections.add(section)
          trackEstimateEvent('section_viewed', { section }, totalInstallCost)
        }
      },
      { threshold: 0.2, rootMargin: '0px' }
    )
  }

  sectionTargetMap.set(element, sectionId)
  sectionObserver.observe(element)

  return () => {
    sectionObserver?.unobserve(element)
    sectionTargetMap.delete(element)
  }
}

export async function fetchAnalyticsEvents(): Promise<StoredAnalyticsEvent[]> {
  const queryUrl = import.meta.env.VITE_AMPLITUDE_QUERY_URL
  if (queryUrl) {
    const res = await fetch(queryUrl)
    if (!res.ok) throw new Error(`Analytics fetch failed (${res.status})`)
    const data = (await res.json()) as StoredAnalyticsEvent[] | { events: StoredAnalyticsEvent[] }
    return Array.isArray(data) ? data : data.events
  }

  const raw = sessionStorage.getItem(EVENT_LOG_KEY)
  if (!raw) return []
  return JSON.parse(raw) as StoredAnalyticsEvent[]
}
