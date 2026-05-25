import { getSectionMeta } from '../data/sectionGuide'
import type { SectionId } from '../types'

interface SectionBannerProps {
  sectionId: SectionId
  onNext?: () => void
  nextLabel?: string
}

export function SectionBanner({ sectionId, onNext, nextLabel }: SectionBannerProps) {
  const meta = getSectionMeta(sectionId)
  if (!meta || sectionId === 'admin' || sectionId === 'project') return null

  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
      <p className="text-sm text-slate-600">{meta.hint}</p>
      {onNext && nextLabel && (
        <button
          type="button"
          onClick={onNext}
          className="shrink-0 rounded-lg bg-daikin-navy px-4 py-2 text-sm font-medium text-white hover:bg-daikin-slate"
        >
          {nextLabel} →
        </button>
      )}
    </div>
  )
}
