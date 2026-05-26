/** Analytics section ids for section_viewed (max 32 chars, snake_case). */
export type SectionViewId = 'vrv' | 'other' | 'piping' | 'controls' | 'summary' | 'admin'

export const SECTION_VIEW_LABELS: Record<SectionViewId, string> = {
  vrv: 'VRV Equipment',
  other: 'Other Equipment',
  piping: 'Piping & Insulation',
  controls: 'Controls & Wiring',
  summary: 'Summary',
  admin: 'Admin',
}

export const SECTION_VIEW_ORDER: SectionViewId[] = [
  'vrv',
  'other',
  'piping',
  'controls',
  'summary',
  'admin',
]

export type ValidationScopeProp = 'header' | 'equipment' | 'piping' | 'controls' | 'complete'

export type AnalyticsEventName =
  | 'estimate_saved'
  | 'pdf_exported'
  | 'equipment_quantity_changed'
  | 'section_viewed'
  | 'validation_failed'

export interface EstimateSavedProps {
  /** Intentionally empty — base props only. */
}

export interface PdfExportedProps {
  /** Intentionally empty — base props only. */
}

export interface EquipmentQuantityChangedProps {
  model: string
  new_qty: number
  old_qty: number
  section: 'vrv' | 'other'
}

export interface SectionViewedProps {
  section: SectionViewId
}

export interface ValidationFailedProps {
  scope: ValidationScopeProp
  issue_count: number
}

export type EventPropertiesMap = {
  estimate_saved: EstimateSavedProps
  pdf_exported: PdfExportedProps
  equipment_quantity_changed: EquipmentQuantityChangedProps
  section_viewed: SectionViewedProps
  validation_failed: ValidationFailedProps
}

export interface BaseEventProperties {
  estimate_id: string
  app_version: string
  total_at_time_of_event: number
}

export type StoredAnalyticsEvent = {
  event_type: AnalyticsEventName
  event_properties: BaseEventProperties & Record<string, string | number>
}
