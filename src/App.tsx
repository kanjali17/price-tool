import { registerSectionViewTarget } from './analytics/amplitude'
import type { SectionViewId } from './analytics/events'
import { HelpIconButton, HelpTutorial, useHelpTutorialAutoOpen } from './components/HelpTutorial'
import { AdminSettings } from './components/AdminSettings'
import { ControlsSection } from './components/ControlsSection'
import { GettingStarted } from './components/GettingStarted'
import { OtherEquipmentSection } from './components/OtherEquipmentSection'
import { PipingSection } from './components/PipingSection'
import { ProjectHeader } from './components/ProjectHeader'
import { ProjectTools } from './components/ProjectTools'
import { SectionBanner } from './components/SectionBanner'
import { StickySummaryBar } from './components/StickySummaryBar'
import { SummarySection } from './components/SummarySection'
import { VrvSection } from './components/VrvSection'
import { SECTION_META, WORKFLOW_SECTIONS } from './data/sectionGuide'
import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'
import { EstimateProvider, useEstimate } from './context/EstimateContext'
import type { SectionId } from './types'

const NAV = SECTION_META

const helpBtnClass =
  'flex items-center gap-2 rounded-full border border-blue-300/40 bg-daikin-slate/80 px-3 py-1.5 text-sm text-blue-100 transition-colors hover:bg-daikin-accent hover:text-daikin-navy'

const helpBtnClassLight =
  'flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-sm text-daikin-navy shadow-sm transition-colors hover:bg-daikin-input'

function SectionViewShell({
  sectionId,
  children,
}: {
  sectionId: SectionViewId
  children: ReactNode
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { totals } = useEstimate()

  useEffect(() => {
    return registerSectionViewTarget(ref.current, sectionId, totals.totalInstallCost)
  }, [sectionId, totals.totalInstallCost])

  return <div ref={ref}>{children}</div>
}

function nextWorkflowSection(current: SectionId): SectionId | null {
  const idx = WORKFLOW_SECTIONS.findIndex((s) => s.id === current)
  if (idx < 0 || idx >= WORKFLOW_SECTIONS.length - 1) return null
  return WORKFLOW_SECTIONS[idx + 1].id
}

function AppContent() {
  const { activeSection, setActiveSection } = useEstimate()
  const [helpOpen, setHelpOpen] = useState(false)
  const openHelp = useCallback(() => setHelpOpen(true), [])

  useHelpTutorialAutoOpen(openHelp)

  const next = nextWorkflowSection(activeSection)
  const nextMeta = next ? WORKFLOW_SECTIONS.find((s) => s.id === next) : null

  return (
    <div className="flex min-h-screen bg-slate-100">
      <aside className="fixed left-0 top-0 z-40 flex h-full w-56 flex-col bg-daikin-navy text-white shadow-xl md:w-56">
        <div className="border-b border-daikin-slate px-4 py-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h1 className="text-lg font-bold leading-tight">Daikin Install</h1>
              <p className="text-xs text-blue-200">Cost Estimator 2026</p>
            </div>
            <HelpIconButton onClick={openHelp} className={`${helpBtnClass} hidden md:flex`}>
              <span>Help</span>
            </HelpIconButton>
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {NAV.map((item) => {
            const isActive = activeSection === item.id
            const isWorkflow = item.step > 0
            return (
              <button
                key={item.id}
                type="button"
                className={`flex w-full gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                  isActive
                    ? 'bg-daikin-accent font-semibold text-daikin-navy'
                    : 'text-blue-100 hover:bg-daikin-slate'
                }`}
                onClick={() => setActiveSection(item.id)}
              >
                {isWorkflow ? (
                  <span
                    className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      isActive ? 'bg-daikin-navy text-white' : 'bg-daikin-slate text-blue-200'
                    }`}
                  >
                    {item.step}
                  </span>
                ) : (
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center text-xs opacity-60">
                    ⚙
                  </span>
                )}
                <span className="block leading-tight">{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      <main className="ml-0 flex-1 pb-24 md:ml-56">
        <header className="flex items-center justify-between gap-4 border-b bg-white px-4 py-4 shadow-sm md:px-8">
          <h2 className="text-xl font-semibold text-daikin-navy">
            {NAV.find((n) => n.id === activeSection)?.label}
          </h2>
          <HelpIconButton onClick={openHelp} className={`md:hidden ${helpBtnClassLight}`}>
            <span>Help</span>
          </HelpIconButton>
        </header>

        <div className="p-4 md:p-8">
          {activeSection === 'project' && (
            <>
              <p className="mb-4 text-sm text-slate-600">
                {SECTION_META.find((s) => s.id === 'project')?.hint}
              </p>
              <ProjectHeader />
              <ProjectTools />
              <GettingStarted onGoTo={setActiveSection} />
            </>
          )}

          {activeSection !== 'project' && activeSection !== 'admin' && (
            <SectionBanner
              sectionId={activeSection}
              onNext={next ? () => setActiveSection(next) : undefined}
              nextLabel={nextMeta ? `Next: ${nextMeta.label}` : undefined}
            />
          )}

          {activeSection === 'vrv' && (
            <SectionViewShell sectionId="vrv">
              <VrvSection />
            </SectionViewShell>
          )}
          {activeSection === 'other' && (
            <SectionViewShell sectionId="other">
              <OtherEquipmentSection />
            </SectionViewShell>
          )}
          {activeSection === 'piping' && (
            <SectionViewShell sectionId="piping">
              <PipingSection />
            </SectionViewShell>
          )}
          {activeSection === 'controls' && (
            <SectionViewShell sectionId="controls">
              <ControlsSection />
            </SectionViewShell>
          )}
          {activeSection === 'summary' && (
            <SectionViewShell sectionId="summary">
              <SummarySection />
            </SectionViewShell>
          )}
          {activeSection === 'admin' && (
            <SectionViewShell sectionId="admin">
              <AdminSettings />
            </SectionViewShell>
          )}
        </div>
      </main>

      <StickySummaryBar onOpenSummary={() => setActiveSection('summary')} />

      <HelpTutorial open={helpOpen} onOpenChange={setHelpOpen} onNavigate={setActiveSection} />
    </div>
  )
}

export default function App() {
  return (
    <EstimateProvider>
      <AppContent />
    </EstimateProvider>
  )
}
