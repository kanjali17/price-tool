import type { SectionId } from '../types'

export interface SectionMeta {
  id: SectionId
  label: string
  step: number
  /** One-line context shown at top of workflow sections (not on Project Info). */
  hint: string
}

export const SECTION_META: SectionMeta[] = [
  {
    id: 'project',
    label: 'Project Info',
    step: 1,
    hint: 'Project details and saved copies. Work auto-saves in this browser.',
  },
  {
    id: 'vrv',
    label: 'VRV Equipment',
    step: 2,
    hint: 'Enter qty and equipment $ per model; labor and materials calculate from install standards.',
  },
  {
    id: 'other',
    label: 'Other Equipment',
    step: 3,
    hint: 'RTU, SkyAir, splits, and optional custom lines below the catalog tables.',
  },
  {
    id: 'piping',
    label: 'Piping & Insulation',
    step: 4,
    hint: 'Job settings, then line-set and ACR footage by size.',
  },
  {
    id: 'controls',
    label: 'Controls & Wiring',
    step: 5,
    hint: 'Wiring counts sync from equipment; use Sync after qty changes.',
  },
  {
    id: 'summary',
    label: 'Summary / Estimate',
    step: 6,
    hint: 'Subs, misc, markup, and export.',
  },
  {
    id: 'admin',
    label: 'Admin Settings',
    step: 0,
    hint: 'Install hours, pipe pricing, and labor rates.',
  },
]

export const WORKFLOW_SECTIONS = SECTION_META.filter((s) => s.step > 0).sort((a, b) => a.step - b.step)

export function getSectionMeta(id: SectionId): SectionMeta | undefined {
  return SECTION_META.find((s) => s.id === id)
}
