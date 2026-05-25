import { WORKFLOW_SECTIONS } from '../data/sectionGuide'
import type { SectionId } from '../types'

interface GettingStartedProps {
  onGoTo: (section: SectionId) => void
}

export function GettingStarted({ onGoTo }: GettingStartedProps) {
  const steps = WORKFLOW_SECTIONS.filter((s) => s.id !== 'project')

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-sm text-slate-600">
        Use the numbered steps in the sidebar (or below). Open <strong>Help</strong> for the full
        guide — blue cells are qty and equipment $.
      </p>
      <ol className="mt-4 grid gap-2 sm:grid-cols-2">
        {steps.map((s) => (
          <li key={s.id}>
            <button
              type="button"
              onClick={() => onGoTo(s.id)}
              className="flex w-full items-center gap-3 rounded-lg border border-slate-100 px-3 py-2.5 text-left text-sm transition-colors hover:border-daikin-navy/30 hover:bg-slate-50"
            >
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-daikin-navy text-xs font-bold text-white">
                {s.step}
              </span>
              <span className="font-medium text-daikin-navy">{s.label}</span>
            </button>
          </li>
        ))}
      </ol>
    </div>
  )
}
