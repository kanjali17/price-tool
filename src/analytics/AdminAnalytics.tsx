import { useEffect, useRef, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { ANALYTICS_EVENTS } from './events'

const CHART_COLORS = ['#F59E0B', '#243044', '#1A2535', '#0F1923', '#F59E0B', '#243044', '#1A2535', '#0F1923']

type AmplitudeEventRow = {
  event_type: string
  event_properties?: Record<string, string | number | boolean>
}

type AnalyticsCache = {
  savedCount: number
  pdfCount: number
  avgTotal: number
  topModel: string
  equipmentBars: { model: string; count: number }[]
  valueBuckets: { range: string; count: number }[]
  sectionBars: { section: string; count: number }[]
  pdfExportPct: number
  commonRangeLabel: string
}

function bucketEstimateValue(total: number): string {
  if (total < 100_000) return 'under $100k'
  if (total < 250_000) return '$100–250k'
  if (total < 500_000) return '$250–500k'
  return '$500k+'
}

function processEvents(rows: AmplitudeEventRow[]): AnalyticsCache {
  let savedCount = 0
  let pdfCount = 0
  let totalSum = 0
  const modelCounts: Record<string, number> = {}
  const buckets: Record<string, number> = {
    'under $100k': 0,
    '$100–250k': 0,
    '$250–500k': 0,
    '$500k+': 0,
  }
  const sectionCounts: Record<string, number> = {}

  for (const row of rows) {
    const props = row.event_properties ?? {}
    if (row.event_type === ANALYTICS_EVENTS.estimate_saved) {
      savedCount++
      const t = Number(props.total) || 0
      totalSum += t
      const label = bucketEstimateValue(t)
      buckets[label] = (buckets[label] ?? 0) + 1
    }
    if (row.event_type === ANALYTICS_EVENTS.pdf_exported) pdfCount++
    if (row.event_type === ANALYTICS_EVENTS.equipment_quantity_changed) {
      const qty = Number(props.new_qty) || 0
      if (qty > 0) {
        const model = String(props.model ?? 'unknown').slice(0, 32)
        modelCounts[model] = (modelCounts[model] ?? 0) + 1
      }
    }
    if (row.event_type === ANALYTICS_EVENTS.section_viewed) {
      const name = String(props.section_name ?? 'unknown').slice(0, 32)
      sectionCounts[name] = (sectionCounts[name] ?? 0) + 1
    }
  }

  const equipmentSorted = Object.entries(modelCounts)
    .map(([model, count]) => ({ model, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 8)

  const sectionSorted = Object.entries(sectionCounts)
    .map(([section, count]) => ({ section, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6)

  const topModel = equipmentSorted[0]?.model ?? '—'
  const avgTotal = savedCount > 0 ? Math.round(totalSum / savedCount) : 0
  const pdfExportPct = savedCount > 0 ? Math.round((pdfCount / savedCount) * 100) : 0

  let commonRangeLabel = '—'
  let maxBucket = 0
  for (const [range, count] of Object.entries(buckets)) {
    if (count > maxBucket) {
      maxBucket = count
      commonRangeLabel = range
    }
  }

  return {
    savedCount,
    pdfCount,
    avgTotal,
    topModel,
    equipmentBars: equipmentSorted,
    valueBuckets: Object.entries(buckets).map(([range, count]) => ({ range, count })),
    sectionBars: sectionSorted,
    pdfExportPct,
    commonRangeLabel,
  }
}

async function fetchAmplitudeEvents(apiKey: string, secretKey: string): Promise<AmplitudeEventRow[]> {
  const end = new Date()
  const start = new Date(end.getTime() - 90 * 24 * 60 * 60 * 1000)
  const url = new URL('https://amplitude.com/api/2/events/segmentation')
  url.searchParams.set('e', JSON.stringify({ event_type: ANALYTICS_EVENTS.estimate_saved }))
  url.searchParams.set('start', start.toISOString().slice(0, 10))
  url.searchParams.set('end', end.toISOString().slice(0, 10))

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Basic ${btoa(`${apiKey}:${secretKey}`)}`,
    },
  })
  if (!res.ok) return []
  const data = (await res.json()) as { data?: AmplitudeEventRow[] }
  return data.data ?? []
}

interface AdminAnalyticsProps {
  active: boolean
}

export function AdminAnalytics({ active }: AdminAnalyticsProps) {
  const cacheRef = useRef<AnalyticsCache | null>(null)
  const fetchStartedRef = useRef(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [, bump] = useState(0)

  useEffect(() => {
    if (!active || cacheRef.current || fetchStartedRef.current) return
    fetchStartedRef.current = true
    setLoading(true)

    const apiKey = import.meta.env.VITE_AMPLITUDE_API_KEY as string | undefined
    const secretKey = import.meta.env.VITE_AMPLITUDE_SECRET_KEY as string | undefined

    if (!apiKey || !secretKey) {
      cacheRef.current = processEvents([])
      setLoading(false)
      bump((n) => n + 1)
      return
    }

    fetchAmplitudeEvents(apiKey, secretKey)
      .then((rows) => {
        cacheRef.current = processEvents(rows)
        setError(null)
      })
      .catch(() => {
        cacheRef.current = processEvents([])
        setError('Could not load analytics data.')
      })
      .finally(() => {
        setLoading(false)
        bump((n) => n + 1)
      })
  }, [active])

  if (!active) return null

  if (loading) {
    return (
      <div className="space-y-4" aria-busy="true">
        <div className="h-20 animate-pulse rounded-lg bg-[#1A2535]" />
        <div className="h-48 animate-pulse rounded-lg bg-[#243044]" />
        <div className="h-48 animate-pulse rounded-lg bg-[#243044]" />
      </div>
    )
  }

  const data = cacheRef.current ?? processEvents([])

  if (
    data.savedCount === 0 &&
    data.pdfCount === 0 &&
    data.equipmentBars.length === 0 &&
    !error
  ) {
    return <p className="text-sm text-slate-400">No analytics data yet.</p>
  }

  return (
    <div className="space-y-6 text-slate-200">
      {error && <p className="text-sm text-amber-400">{error}</p>}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: 'Estimates saved', value: String(data.savedCount) },
          { label: 'PDF exports', value: String(data.pdfCount) },
          { label: 'Avg estimate value', value: `$${data.avgTotal.toLocaleString()}` },
          { label: 'Top outdoor model', value: data.topModel },
        ].map((card) => (
          <div key={card.label} className="rounded-lg bg-[#1A2535] p-4">
            <p className="text-xs text-slate-400">{card.label}</p>
            <p className="mt-1 text-lg font-semibold text-[#F59E0B]">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg bg-[#0F1923] p-4 text-sm leading-relaxed text-slate-300">
        <p>Most common estimate range: {data.commonRangeLabel}</p>
        <p>Most frequently selected model: {data.topModel}</p>
        <p>PDF exported in {data.pdfExportPct}% of saved estimates</p>
      </div>

      {data.equipmentBars.length > 0 && (
        <div className="rounded-lg bg-[#1A2535] p-4">
          <h4 className="mb-3 text-sm font-semibold text-[#F59E0B]">Equipment frequency</h4>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={data.equipmentBars} layout="vertical" margin={{ left: 8, right: 8 }}>
              <CartesianGrid stroke="#243044" horizontal={false} />
              <XAxis type="number" stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="model" width={120} stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid #243044' }} />
              <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                {data.equipmentBars.map((_, i) => (
                  <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.valueBuckets.some((b) => b.count > 0) && (
        <div className="rounded-lg bg-[#1A2535] p-4">
          <h4 className="mb-3 text-sm font-semibold text-[#F59E0B]">Estimate value distribution</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.valueBuckets}>
              <CartesianGrid stroke="#243044" vertical={false} />
              <XAxis dataKey="range" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid #243044' }} />
              <Bar dataKey="count" fill="#F59E0B" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {data.sectionBars.length > 0 && (
        <div className="rounded-lg bg-[#1A2535] p-4">
          <h4 className="mb-3 text-sm font-semibold text-[#F59E0B]">Section engagement</h4>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.sectionBars}>
              <CartesianGrid stroke="#243044" vertical={false} />
              <XAxis dataKey="section" stroke="#94a3b8" tick={{ fontSize: 10 }} />
              <YAxis stroke="#94a3b8" tick={{ fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#0F1923', border: '1px solid #243044' }} />
              <Bar dataKey="count" fill="#243044" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}
