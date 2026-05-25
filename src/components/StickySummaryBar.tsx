import { useEstimate } from '../context/EstimateContext'
import { formatCurrency } from '../utils/calculations'

interface StickySummaryBarProps {
  onOpenSummary?: () => void
}

export function StickySummaryBar({ onOpenSummary }: StickySummaryBarProps) {
  const { totals, state } = useEstimate()
  const s = state.summary

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-daikin-navy bg-daikin-navy px-4 py-3 text-white shadow-lg md:left-56 print:hidden">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
        <button
          type="button"
          onClick={onOpenSummary}
          className="text-left transition-opacity hover:opacity-90"
          title="Open Summary section"
        >
          <p className="text-xs text-blue-200">Total install price — click for details</p>
          <p className="text-xl font-bold text-daikin-accent">
            {formatCurrency(totals.totalInstallCost)}
          </p>
        </button>
        <div className="flex gap-6 text-sm">
          <div>
            <span className="text-blue-200">Direct: </span>
            {formatCurrency(totals.directCostsTotal)}
          </div>
          <div>
            <span className="text-blue-200">Job Cost: </span>
            {formatCurrency(totals.jobCost)}
          </div>
          {s.totalCapacityTons > 0 && (
            <div>
              <span className="text-blue-200">$/ton: </span>
              {formatCurrency(totals.totalInstallCost / s.totalCapacityTons)}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
