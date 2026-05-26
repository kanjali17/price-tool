import { useEffect, useRef, useState } from 'react'
import { useEstimate } from '../context/EstimateContext'
import { formatCurrency } from '../utils/calculations'

interface StickySummaryBarProps {
  onOpenSummary?: () => void
}

export function StickySummaryBar({ onOpenSummary }: StickySummaryBarProps) {
  const { totals, state, hasUnsavedChanges } = useEstimate()
  const s = state.summary
  const tonsForMetrics =
    s.totalCapacityTons > 0 ? s.totalCapacityTons : totals.derivedOutdoorTons
  const [pulse, setPulse] = useState(false)
  const prevTotal = useRef(totals.totalInstallCost)

  useEffect(() => {
    if (prevTotal.current !== totals.totalInstallCost) {
      prevTotal.current = totals.totalInstallCost
      setPulse(true)
      const t = setTimeout(() => setPulse(false), 400)
      return () => clearTimeout(t)
    }
  }, [totals.totalInstallCost])

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-daikin-navy bg-daikin-navy px-4 py-3 text-white shadow-lg md:left-56 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onOpenSummary}
          className="text-left transition-opacity hover:opacity-90"
          title="Open Summary section"
        >
          <p className="text-xs text-blue-200">
            Total install price — click for details
            {hasUnsavedChanges && (
              <span className="ml-2 rounded bg-amber-500/30 px-2 py-0.5 text-amber-200">
                Unsaved
              </span>
            )}
          </p>
          <p
            className={`text-xl font-bold text-daikin-accent transition-transform duration-300 ${
              pulse ? 'scale-105' : 'scale-100'
            }`}
          >
            {formatCurrency(totals.totalInstallCost)}
          </p>
        </button>
        {tonsForMetrics > 0 && (
          <div className="text-sm">
            <span className="text-blue-200">$/ton: </span>
            {formatCurrency(totals.totalInstallCost / tonsForMetrics)}
          </div>
        )}
      </div>
    </div>
  )
}
