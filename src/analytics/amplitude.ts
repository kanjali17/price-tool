import * as amplitude from '@amplitude/analytics-browser'

import type { AnalyticsEventName, EventPropertyMap } from './events'

const DEVICE_ID_KEY = 'daikin-amplitude-device-id'
const MAX_PROP_LEN = 32

let initialized = false
let estimateId = ''
let totalAtTimeOfEvent = 0

function getDeviceId(): string {
  try {
    let id = localStorage.getItem(DEVICE_ID_KEY)
    if (!id) {
      id = crypto.randomUUID().replace(/-/g, '').slice(0, 16)
      localStorage.setItem(DEVICE_ID_KEY, id)
    }
    return id.slice(0, MAX_PROP_LEN)
  } catch {
    return 'unknown'
  }
}

function roundTotal(total: number): number {
  return Math.round(total / 100) * 100
}

function trimProps<T extends Record<string, string | number | boolean>>(
  props: T
): Record<string, string | number | boolean> {
  const out: Record<string, string | number | boolean> = {}
  for (const [k, v] of Object.entries(props)) {
    if (typeof v === 'string' && v.length > MAX_PROP_LEN) {
      out[k] = v.slice(0, MAX_PROP_LEN)
    } else {
      out[k] = v
    }
  }
  return out
}

export function initAmplitude(): void {
  if (initialized) return
  const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY as string | undefined
  if (!apiKey || import.meta.env.DEV) {
    initialized = true
    return
  }
  amplitude.init(apiKey, {
    autocapture: false,
    flushIntervalMillis: 30000,
    flushQueueSize: 10,
    userId: getDeviceId(),
  })
  initialized = true
}

export function setAnalyticsEstimateContext(id: string, total: number): void {
  estimateId = id.slice(0, 8)
  totalAtTimeOfEvent = roundTotal(total)
}

export function track<E extends AnalyticsEventName>(
  eventName: E,
  properties: EventPropertyMap[E]
): void {
  const base = {
    estimate_id: estimateId,
    app_version: '1.0.0',
    total_at_time_of_event: totalAtTimeOfEvent,
  }
  const payload = trimProps({ ...properties } as Record<string, string | number | boolean>)

  if (import.meta.env.DEV) {
    console.log('[amplitude mock]', eventName, { ...base, ...payload })
    return
  }

  if (!initialized) initAmplitude()
  void amplitude.track(eventName, { ...base, ...payload })
}
