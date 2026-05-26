import { useCallback, useEffect, useRef, useState, type CSSProperties } from 'react'
import {
  fetchAnalyticsEvents,
  roundToHundred,
} from './amplitude'
import {
  SECTION_VIEW_LABELS,
  SECTION_VIEW_ORDER,
  type SectionViewId,
  type StoredAnalyticsEvent,
} from './events'

type ValueBucket = 'under_100k' | '100k_250k' | '250k_500k' | 'over_500k'

const VALUE_BUCKET_LABELS: Record<ValueBucket, string> = {
  under_100k: 'Under $100k',
  '100k_250k': '$100k–$250k',
  '250k_500k': '$250k–$500k',
  over_500k: 'Over $500k',
}

const VALUE_BUCKET_ORDER: ValueBucket[] = [
  'under_100k',
  '100k_250k',
  '250k_500k',
  'over_500k',
]

function bucketTotal(total: number): ValueBucket {
  if (total < 100_000) return 'under_100k'
  if (total < 250_000) return '100k_250k'
  if (total < 500_000) return '250k_500k'
  return 'over_500k'
}

function truncateLabel(text: string, max = 20): string {
  return text.length <= max ? text : `${text.slice(0, max - 1)}…`
}

function sortDescByCount<T extends { count: number }>(items: T[]): T[] {
  return [...items].sort((a, b) => b.count - a.count)
}

function dedupeEquipmentByEstimate(events: StoredAnalyticsEvent[]): StoredAnalyticsEvent[] {
  const seen = new Set<string>()
  const out: StoredAnalyticsEvent[] = []
  for (const e of events) {
    if (e.event_type !== 'equipment_quantity_changed') continue
    const model = String(e.event_properties.model ?? '')
    const estimateId = String(e.event_properties.estimate_id ?? '')
    const newQty = Number(e.event_properties.new_qty ?? 0)
    if (newQty <= 0 || !model || !estimateId) continue
    const key = `${estimateId}:${model}`
    if (seen.has(key)) continue
    seen.add(key)
    out.push(e)
  }
  return out
}

function countEquipmentByModel(events: StoredAnalyticsEvent[]): { model: string; count: number }[] {
  const counts = new Map<string, number>()
  for (const e of dedupeEquipmentByEstimate(events)) {
    const model = String(e.event_properties.model ?? '')
    counts.set(model, (counts.get(model) ?? 0) + 1)
  }
  return sortDescByCount(
    [...counts.entries()].map(([model, count]) => ({ model, count }))
  )
}

function bucketSavedEstimates(events: StoredAnalyticsEvent[]): Record<ValueBucket, number> {
  const buckets: Record<ValueBucket, number> = {
    under_100k: 0,
    '100k_250k': 0,
    '250k_500k': 0,
    over_500k: 0,
  }
  for (const e of events) {
    if (e.event_type !== 'estimate_saved') continue
    const total = Number(e.event_properties.total_at_time_of_event ?? 0)
    buckets[bucketTotal(total)] += 1
  }
  return buckets
}

function countSectionViews(events: StoredAnalyticsEvent[]): Record<SectionViewId, number> {
  const counts = Object.fromEntries(
    SECTION_VIEW_ORDER.map((s) => [s, 0])
  ) as Record<SectionViewId, number>
  for (const e of events) {
    if (e.event_type !== 'section_viewed') continue
    const section = e.event_properties.section as SectionViewId
    if (section in counts) counts[section] += 1
  }
  return counts
}

interface AnalyticsCache {
  events: StoredAnalyticsEvent[]
  estimatesSaved: number
  pdfsExported: number
  avgEstimateTotal: number
  topModel: string
  topModelCount: number
  equipmentTop8: { model: string; count: number; label: string }[]
  valueBuckets: Record<ValueBucket, number>
  sectionCounts: Record<SectionViewId, number>
  lowestSection: SectionViewId
  uniqueEstimatesWithEquipment: number
  pdfExportPct: number
  dominantBucket: ValueBucket
  dominantBucketCount: number
}

function buildCache(events: StoredAnalyticsEvent[]): AnalyticsCache {
  const estimatesSaved = events.filter((e) => e.event_type === 'estimate_saved').length
  const pdfsExported = events.filter((e) => e.event_type === 'pdf_exported').length
  const savedTotals = events
    .filter((e) => e.event_type === 'estimate_saved')
    .map((e) => Number(e.event_properties.total_at_time_of_event ?? 0))
  const avgEstimateTotal =
    savedTotals.length > 0
      ? roundToHundred(savedTotals.reduce((a, b) => a + b, 0) / savedTotals.length)
      : 0

  const equipmentRanked = countEquipmentByModel(events)
  const topModel = equipmentRanked[0]?.model ?? '—'
  const topModelCount = equipmentRanked[0]?.count ?? 0

  const equipmentTop8 = equipmentRanked.slice(0, 8).map((row) => ({
    ...row,
    label: truncateLabel(row.model),
  }))

  const valueBuckets = bucketSavedEstimates(events)
  const sectionCounts = countSectionViews(events)

  let lowestSection: SectionViewId = SECTION_VIEW_ORDER[0]
  let lowestCount = sectionCounts[lowestSection]
  for (const s of SECTION_VIEW_ORDER) {
    if (sectionCounts[s] < lowestCount) {
      lowestSection = s
      lowestCount = sectionCounts[s]
    }
  }

  const estimateIds = new Set(
    dedupeEquipmentByEstimate(events).map((e) => String(e.event_properties.estimate_id))
  )
  const uniqueEstimatesWithEquipment = estimateIds.size

  const pdfExportPct =
    estimatesSaved > 0 ? Math.round((pdfsExported / estimatesSaved) * 100) : 0

  let dominantBucket: ValueBucket = 'under_100k'
  let dominantBucketCount = 0
  for (const b of VALUE_BUCKET_ORDER) {
    if (valueBuckets[b] > dominantBucketCount) {
      dominantBucket = b
      dominantBucketCount = valueBuckets[b]
    }
  }

  return {
    events,
    estimatesSaved,
    pdfsExported,
    avgEstimateTotal,
    topModel,
    topModelCount,
    equipmentTop8,
    valueBuckets,
    sectionCounts,
    lowestSection,
    uniqueEstimatesWithEquipment,
    pdfExportPct,
    dominantBucket,
    dominantBucketCount,
  }
}

function formatMoney(n: number): string {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `$${Math.round(n / 1000)}k`
  return `$${n}`
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div
      className="flex-1 min-w-[10rem] rounded-lg px-4 py-3"
      style={{ backgroundColor: '#1A2535' }}
    >
      <div className="text-2xl font-semibold text-amber-400">{value}</div>
      <div className="mt-1 text-xs text-slate-400">{label}</div>
    </div>
  )
}

function ChartSkeleton({ height }: { height: number }) {
  return (
    <div
      className="w-full rounded-lg bg-slate-700/40"
      style={{ height, backgroundColor: '#1A2535' }}
      aria-hidden
    />
  )
}

interface AdminAnalyticsProps {
  active: boolean
}

export function AdminAnalytics({ active }: AdminAnalyticsProps) {
  const cacheRef = useRef<AnalyticsCache | null>(null)
  const fetchedRef = useRef(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const events = await fetchAnalyticsEvents()
      cacheRef.current = buildCache(events)
      fetchedRef.current = true
      setError(null)
      setReady(true)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load analytics')
      cacheRef.current = null
      setReady(false)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (!active) return
    if (fetchedRef.current) {
      if (cacheRef.current) {
        setLoading(false)
        setReady(true)
      }
      return
    }
    void load()
  }, [active, load])

  if (!active) return null

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex flex-wrap gap-3">
          {[1, 2, 3, 4].map((i) => (
            <ChartSkeleton key={i} height={72} />
          ))}
        </div>
        <ChartSkeleton height={220} />
        <ChartSkeleton height={180} />
        <ChartSkeleton height={200} />
        <ChartSkeleton height={64} />
      </div>
    )
  }

  if (error) {
    return (
      <div
        className="rounded-lg border border-red-800/50 p-6 text-center"
        style={{ backgroundColor: '#1A2535' }}
      >
        <p className="text-sm text-red-300">{error}</p>
        <button
          type="button"
          className="mt-4 rounded bg-amber-500 px-4 py-2 text-sm font-medium text-daikin-navy"
          onClick={() => {
            fetchedRef.current = false
            void load()
          }}
        >
          Retry
        </button>
      </div>
    )
  }

  const cache = cacheRef.current
  if (!ready || !cache) return null

  const equipmentMax = cache.equipmentTop8[0]?.count ?? 1
  const valueMax = Math.max(...VALUE_BUCKET_ORDER.map((b) => cache.valueBuckets[b]), 1)
  const sectionMax = Math.max(...SECTION_VIEW_ORDER.map((s) => cache.sectionCounts[s]), 1)

  const modelPct =
    cache.uniqueEstimatesWithEquipment > 0
      ? Math.round((cache.topModelCount / cache.uniqueEstimatesWithEquipment) * 100)
      : 0

  const pdfInterpretation =
    cache.pdfExportPct >= 50
      ? 'high means estimates are being finalized'
      : 'low may indicate friction in the export flow'

  const insights =
    cache.estimatesSaved < 5
      ? ['Not enough data yet — insights will appear after at least 5 estimates have been saved.']
      : [
          `The most common estimate size is ${VALUE_BUCKET_LABELS[cache.dominantBucket]} — ${cache.dominantBucketCount} of ${cache.estimatesSaved} estimates fall in this range.`,
          `The most frequently specified model is ${cache.topModel}, appearing in ${modelPct}% of all estimates.`,
          `PDF export rate is ${cache.pdfExportPct}% — ${pdfInterpretation}.`,
        ]

  return (
    <div className="space-y-8 text-slate-200">
      <div className="flex flex-wrap gap-3">
        <SummaryCard label="Estimates saved" value={String(cache.estimatesSaved)} />
        <SummaryCard
          label="PDFs exported"
          value={`${cache.pdfsExported} (${cache.pdfExportPct}%)`}
        />
        <SummaryCard label="Avg estimate total" value={formatMoney(cache.avgEstimateTotal)} />
        <SummaryCard label="Most specified model" value={truncateLabel(cache.topModel, 32)} />
      </div>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Equipment frequency (top 8)</h3>
        <div className="space-y-2 rounded-lg p-4" style={{ backgroundColor: '#1A2535' }}>
          {cache.equipmentTop8.length === 0 ? (
            <p className="text-sm text-slate-500">No equipment selections recorded yet.</p>
          ) : (
            cache.equipmentTop8.map((row) => (
              <div key={row.model} className="flex items-center gap-3 text-xs">
                <span className="w-28 shrink-0 text-slate-400" title={row.model}>
                  {row.label}
                </span>
                <div className="flex-1 h-5 rounded bg-slate-800">
                  <div
                    className="h-5 rounded bg-amber-500"
                    style={{
                      width: `${Math.max(4, (row.count / equipmentMax) * 100)}%`,
                    }}
                  />
                </div>
                <span className="w-8 text-right text-amber-400">{row.count}</span>
              </div>
            ))
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Estimate value distribution</h3>
        <div
          className="flex items-end justify-between gap-2 rounded-lg px-4 pb-4 pt-8"
          style={{ backgroundColor: '#1A2535', minHeight: 180 }}
        >
          {VALUE_BUCKET_ORDER.map((bucket) => {
            const count = cache.valueBuckets[bucket]
            const heightPct = valueMax > 0 ? (count / valueMax) * 100 : 0
            return (
              <div key={bucket} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-xs text-amber-400">{count}</span>
                <div className="flex h-24 w-full items-end justify-center">
                  <div
                    className="w-full max-w-[4rem] rounded-t bg-amber-500/90"
                    style={{
                      height: `${count === 0 ? 2 : Math.max(8, heightPct)}%`,
                      minHeight: count === 0 ? 2 : 8,
                    }}
                  />
                </div>
                <span className="text-center text-[10px] leading-tight text-slate-500">
                  {VALUE_BUCKET_LABELS[bucket]}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-3 text-sm font-semibold text-slate-300">Section engagement</h3>
        <div
          className="flex items-end justify-between gap-2 rounded-lg px-4 pb-4 pt-6"
          style={{ backgroundColor: '#1A2535', minHeight: 200 }}
        >
          {SECTION_VIEW_ORDER.map((sectionId) => {
            const count = cache.sectionCounts[sectionId]
            const heightPct = sectionMax > 0 ? (count / sectionMax) * 100 : 0
            const isLowest = sectionId === cache.lowestSection
            const barStyle: CSSProperties = {
              height: `${count === 0 ? 4 : Math.max(12, heightPct)}%`,
              minHeight: count === 0 ? 4 : 12,
              backgroundColor: isLowest ? '#7f1d1d' : 'rgb(245 158 11 / 0.9)',
            }
            return (
              <div key={sectionId} className="flex flex-1 flex-col items-center gap-2">
                <div className="flex h-32 w-full items-end justify-center">
                  <div className="w-full max-w-[2.5rem] rounded-t" style={barStyle} />
                </div>
                <span className="text-center text-[9px] leading-tight text-slate-500">
                  {SECTION_VIEW_LABELS[sectionId]}
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section
        className="rounded-lg p-4 text-sm leading-relaxed text-slate-300"
        style={{ backgroundColor: '#1A2535' }}
      >
        {insights.map((sentence, i) => (
          <p key={i} className={i > 0 ? 'mt-2' : undefined}>
            {sentence}
          </p>
        ))}
      </section>
    </div>
  )
}
