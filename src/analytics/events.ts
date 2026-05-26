export const ANALYTICS_EVENTS = {
  estimate_saved: 'estimate_saved',
  pdf_exported: 'pdf_exported',
  equipment_quantity_changed: 'equipment_quantity_changed',
  markup_changed: 'markup_changed',
  labor_rate_changed: 'labor_rate_changed',
  section_viewed: 'section_viewed',
} as const

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[keyof typeof ANALYTICS_EVENTS]

export type EstimateSavedProps = {
  total: number
  section_count: number
  equipment_line_items: number
}

export type PdfExportedProps = {
  total: number
  line_item_count: number
}

export type EquipmentQuantityChangedProps = {
  model: string
  new_qty: number
  row_total: number
}

export type MarkupChangedProps = {
  field: string
  new_value: number
}

export type LaborRateChangedProps = {
  field: string
  new_value: number
}

export type SectionViewedProps = {
  section_name: string
}

export type EventPropertyMap = {
  estimate_saved: EstimateSavedProps
  pdf_exported: PdfExportedProps
  equipment_quantity_changed: EquipmentQuantityChangedProps
  markup_changed: MarkupChangedProps
  labor_rate_changed: LaborRateChangedProps
  section_viewed: SectionViewedProps
}
