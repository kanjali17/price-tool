import { useEffect, type ReactNode } from 'react'
import type { SectionId } from '../types'

const HELP_DISMISS_KEY = 'daikin-estimator-help-seen'

interface HelpTutorialProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onNavigate?: (section: SectionId) => void
}

const WORKFLOW_STEPS: { section: SectionId; title: string; body: string }[] = [
  {
    section: 'project',
    title: '1. Project Info',
    body:
      'Fill in project name, location, architect/engineer, date, estimate number, and who prepared the estimate. These appear on every section and on exported PDFs. Use Save Project to store multiple bids on this computer.',
  },
  {
    section: 'vrv',
    title: '2. VRV Equipment',
    body:
      'For each Daikin model, enter Quantity and Equipment $ (your equipment quote). Blue cells are yours to edit. Sheet metal and piping hours/materials calculate automatically from admin install standards when qty is greater than zero. Use Quick entry to paste model numbers and quantities (one per line, e.g. "RELQ72 - 120 2").',
  },
  {
    section: 'other',
    title: '3. Other Equipment',
    body:
      'Add RTU/DOAS, SkyAir, multi-splits, mini-splits, zoning kits, and misc line items. Enter quantity and equipment cost on catalog rows. Expand General Equipment, Sheet Metal, Drawing Time, or Piping sections for custom lines where you enter qty, dollars, and hours as needed.',
  },
  {
    section: 'piping',
    title: '4. Piping & Insulation',
    body:
      'Set Brazed, ACR pipe type (copper/aluminum), and insulation thickness to match the job. Enter pipe footage by size for line sets and ACR. Add condensate drain runs and pump counts. If using RefLok, check the box and enter any labor discount. Totals feed the summary automatically.',
  },
  {
    section: 'controls',
    title: '5. Controls & Wiring',
    body:
      'Wiring quantities usually match your equipment counts. Click Sync wiring qty from equipment after changing VRV quantities, or edit counts manually. Enter engineering/PM hours and material costs for panels and transformers. Labor uses the controls rate from Admin ($85/hr default).',
  },
  {
    section: 'summary',
    title: '6. Summary / Estimate',
    body:
      'Review direct costs (equipment with sales tax, materials, labor), subcontractors, and misc costs. Set E&O, contingency, and engineering percentages, then markup or gross margin by category. Enter total tons and conditioned square footage for $/ton and $/sq.ft metrics. Export PDF or print when ready.',
  },
  {
    section: 'admin',
    title: '7. Admin Settings (owner only)',
    body:
      'Password-protected panel for install hours, material allowances, pipe pricing, and labor rates. Changes save locally and apply to new quantity entries. Default password: daikin2026 — change this in code before production deployment if needed.',
  },
]

export function useHelpTutorialAutoOpen(onOpen: () => void) {
  useEffect(() => {
    if (localStorage.getItem(HELP_DISMISS_KEY) === '1') return
    const timer = window.setTimeout(onOpen, 800)
    return () => window.clearTimeout(timer)
  }, [onOpen])
}

export function HelpIconButton({
  onClick,
  className = '',
  children,
}: {
  onClick: () => void
  className?: string
  children?: ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={className}
      aria-label="Open help and tutorial"
      title="How to use this estimator"
    >
      <HelpIcon className="h-5 w-5 shrink-0" />
      {children}
    </button>
  )
}

export function HelpTutorial({ open, onOpenChange, onNavigate }: HelpTutorialProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onOpenChange(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onOpenChange])

  const dismissAutoOpen = () => {
    localStorage.setItem(HELP_DISMISS_KEY, '1')
    onOpenChange(false)
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4 print:hidden"
      role="dialog"
      aria-modal="true"
      aria-labelledby="help-tutorial-title"
      onClick={() => onOpenChange(false)}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4 border-b bg-daikin-navy px-6 py-4 text-white">
          <div>
            <h2 id="help-tutorial-title" className="text-xl font-bold">
              How to use the Install Cost Estimator
            </h2>
            <p className="mt-1 text-sm text-blue-200">
              Step-by-step guide for building a Daikin install estimate.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1 text-blue-200 hover:bg-white/10 hover:text-white"
            aria-label="Close help"
          >
            <CloseIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="overflow-y-auto px-6 py-5">
          <section className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4">
            <h3 className="font-semibold text-amber-900">Quick start (5 minutes)</h3>
            <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm text-amber-950">
              <li>Enter project info and save the project name.</li>
              <li>Add VRV equipment quantities and equipment dollars.</li>
              <li>Enter pipe footage and controls (sync wiring qty if needed).</li>
              <li>Open Summary — adjust tax, subs, misc, and markup.</li>
              <li>Watch the running total at the bottom; export PDF when done.</li>
            </ol>
          </section>

          <section className="mb-6">
            <h3 className="mb-2 font-semibold text-daikin-navy">Color guide</h3>
            <ul className="grid gap-2 text-sm sm:grid-cols-2">
              <li className="flex items-center gap-2 rounded border bg-daikin-input/50 px-3 py-2">
                <span className="h-4 w-8 rounded border border-blue-300 bg-daikin-input" />
                Blue — you type quantities and costs
              </li>
              <li className="flex items-center gap-2 rounded border bg-slate-50 px-3 py-2">
                <span className="h-4 w-8 rounded bg-slate-100" />
                Gray — hours and materials (calculated)
              </li>
              <li className="flex items-center gap-2 rounded border bg-daikin-subtotal px-3 py-2">
                <span className="h-4 w-8 rounded bg-daikin-subtotal" />
                Green — section subtotals
              </li>
              <li className="flex items-center gap-2 rounded border bg-amber-100 px-3 py-2">
                <span className="h-4 w-8 rounded bg-amber-200" />
                Amber — total install price
              </li>
            </ul>
          </section>

          <section className="mb-6">
            <h3 className="mb-3 font-semibold text-daikin-navy">Workflow by section</h3>
            <div className="space-y-3">
              {WORKFLOW_STEPS.map((step) => (
                <div
                  key={step.section}
                  className="rounded-lg border border-slate-200 bg-slate-50/80 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h4 className="font-medium text-daikin-navy">{step.title}</h4>
                    {onNavigate && (
                      <button
                        type="button"
                        className="text-sm font-medium text-daikin-navy underline hover:text-daikin-accent"
                        onClick={() => {
                          onNavigate(step.section)
                          onOpenChange(false)
                        }}
                      >
                        Go to section →
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{step.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mb-4">
            <h3 className="mb-2 font-semibold text-daikin-navy">Editing tips</h3>
            <ul className="list-disc space-y-1 pl-5 text-sm text-slate-600">
              <li>
                <strong>Click any blue number</strong> to edit quantity or dollars — press Enter or
                click away to save.
              </li>
              <li>
                <strong>Auto-save</strong> keeps your work in the browser; use Save Project for named
                copies.
              </li>
              <li>
                <strong>Duplicate Project</strong> copies the estimate with a new name for revisions.
              </li>
              <li>Rows with qty = 0 stay visible but grayed out so you can scan the full catalog.</li>
              <li>
                The <strong>sticky bar</strong> at the bottom shows the running total install cost on
                every page.
              </li>
            </ul>
          </section>

          <section className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
            <p>
              <strong>Data stays on your computer.</strong> No server upload. Clear browser data or use
              Reset to start fresh. For company install rates, use Admin Settings (owner password).
            </p>
          </section>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t bg-slate-50 px-6 py-4">
          <button
            type="button"
            onClick={dismissAutoOpen}
            className="text-sm text-slate-500 hover:text-slate-800"
          >
            Don&apos;t show automatically on startup
          </button>
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="rounded-lg bg-daikin-navy px-5 py-2 text-sm font-semibold text-white hover:bg-daikin-slate"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  )
}

function HelpIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
      <path
        d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.5c-.8.5-1.5 1.2-1.5 2.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="12" cy="17" r="1" fill="currentColor" />
    </svg>
  )
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  )
}
