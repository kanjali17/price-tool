import type { EstimateState, LineItem, ProjectHeader } from '../types'

export type HeaderFieldKey = keyof ProjectHeader

export const REQUIRED_HEADER_FIELDS: { key: HeaderFieldKey; label: string }[] = [
  { key: 'projectName', label: 'Project name' },
  { key: 'location', label: 'Location' },
  { key: 'date', label: 'Date' },
  { key: 'estimatedBy', label: 'Estimated by' },
]

export type ValidationScope = 'header' | 'complete'

export interface ValidationResult {
  isValid: boolean
  headerErrors: Partial<Record<HeaderFieldKey, string>>
  /** Human-readable list for alerts and banners */
  messages: string[]
  needsEquipment: boolean
}

const EQUIPMENT_ARRAY_KEYS = [
  'vrvOutdoor',
  'vrvBranchSelector',
  'vrvIndoor',
  'vrvRefnet',
  'vrvRefrigerant',
  'vrvControllers',
  'otherRtuDoas',
  'otherSkyAir',
  'otherMultiSplit',
  'otherMiniSplit',
  'otherZoning',
] as const

function countEquipmentQuantity(state: EstimateState): number {
  let n = 0
  for (const key of EQUIPMENT_ARRAY_KEYS) {
    const items = state[key] as LineItem[]
    n += items.reduce((s, i) => s + (i.quantity > 0 ? 1 : 0), 0)
  }
  return n
}

export function validateEstimate(
  state: EstimateState,
  scope: ValidationScope = 'header'
): ValidationResult {
  const headerErrors: Partial<Record<HeaderFieldKey, string>> = {}

  for (const { key, label } of REQUIRED_HEADER_FIELDS) {
    const value = state.header[key]
    if (typeof value !== 'string' || !value.trim()) {
      headerErrors[key] = `${label} is required`
    }
  }

  const messages = Object.values(headerErrors)
  const equipmentLines = countEquipmentQuantity(state)
  const needsEquipment = scope === 'complete' && equipmentLines === 0

  if (needsEquipment) {
    messages.push('Enter quantity on at least one equipment line')
  }

  return {
    isValid: messages.length === 0,
    headerErrors,
    messages,
    needsEquipment,
  }
}

export function firstSectionForValidation(result: ValidationResult): 'project' | 'vrv' {
  if (Object.keys(result.headerErrors).length > 0) return 'project'
  if (result.needsEquipment) return 'vrv'
  return 'project'
}
