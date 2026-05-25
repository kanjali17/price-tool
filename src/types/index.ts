export type SectionId =
  | 'project'
  | 'vrv'
  | 'other'
  | 'piping'
  | 'controls'
  | 'summary'
  | 'admin'

export type InsulationThickness = '1/2"' | '3/4"' | '1"'
export type PipeMaterial = 'COPPER' | 'ALUMINUM'
export type MarkupMode = 'markup' | 'grossMargin'

export interface ProjectHeader {
  projectName: string
  location: string
  architectEngineer: string
  date: string
  estimateNo: string
  estimatedBy: string
}

export interface LineItem {
  id: string
  model: string
  description: string
  quantity: number
  equipmentCost: number
  sheetMetalHours: number
  sheetMetalMaterials: number
  pipingHours: number
  pipingMaterials: number
  tooltip?: string
  category?: string
  isDucted?: boolean
  cfmSize?: string
}

export interface FreeTextLine {
  id: string
  label: string
  quantity: number
  equipmentCost: number
  sheetMetalHours: number
  sheetMetalMaterials: number
  pipingHours: number
  pipingMaterials: number
}

export interface PipeFootageEntry {
  size: string
  footage: number
  type: 'lineSet' | 'acr'
}

export interface WiringLineItem {
  id: string
  label: string
  quantity: number
  hoursPerEa: number
  materialsPerEa: number
}

export interface SubcontractorLine {
  id: string
  label: string
  amount: number
}

export interface MiscCostLine {
  id: string
  label: string
  amount: number
  isPercentOfLabor?: boolean
}

export interface PipingSettings {
  brazed: boolean
  acrPipe: PipeMaterial
  insulationThickness: InsulationThickness
  reflok: boolean
  reflokLaborDiscount: number
}

export interface SummarySettings {
  salesTaxPercent: number
  projectManagementPercent: number
  errorsOmissionsPercent: number
  contingencyPercent: number
  engineeringPercent: number
  markupMode: MarkupMode
  equipmentMarkup: number
  materialMarkup: number
  laborMarkup: number
  subcontractorMarkup: number
  miscMarkup: number
  eoMarkup: number
  totalCapacityTons: number
  conditionedSqFt: number
}

export interface LaborRates {
  sheetMetalPipingRate: number
  controlsRate: number
  insulationRate: number
  insulationFtPerDay: number
}

export interface AdminRates {
  laborRates: LaborRates
  outdoorUnitHours: Record<string, { setHours: number; pipeHours: number; pipeMatls: number; isoPads: number }>
  branchSelectorHours: Record<string, { setHangHrs: number; pipeHrs: number; matls: number }>
  fcuHoursBySize: Record<string, {
    cfm: number
    pipeHrs: number
    pipeMatls: number
    shopSmHrs: number
    fieldSmHrs: number
    airDevices: number
    smMatls: number
    setHangSmHrs: number
    setHangPfHrs: number
    pfMatls: number
    ductedSmHrs?: number
    ductedSmMatls?: number
    ductedPipeHrs?: number
    ductedPipeMatls?: number
  }>
  fcuDuctedAdjustments: { smHrs: number; smMatls: number }
  refnetHours: Record<string, { copperHrs: number; matls: number }>
  rtuDoasHours: Record<string, { smHrs: number; pfHrs: number; curbMatls: number }>
  consumablesSmPercent: number
  consumablesPfBrazedPercent: number
  consumablesPfReflokPercent: number
  refrigerantHrsMin: number
  refrigerantPerLb: number
  condensateStdFt: number
  condensateCopperFactor: number
  condensatePvcFactor: number
  condensateHrsPerItem: number
  condensateMatlPerFt: number
  condensatePumpHrs: number
  condensatePumpMatls: number
  copperAcrPricing: Record<string, { copper: number; insulHalf: number; insulThreeQuarter: number; insulOne: number }>
  pipingHoursPerFt: Record<string, number>
  insulationPricing: Record<string, { half: number; threeQuarter: number; one: number }>
}

export interface ChangeLogEntry {
  timestamp: string
  message: string
}

export interface SavedProject {
  id: string
  name: string
  savedAt: string
  state: EstimateState
}

export interface EstimateState {
  header: ProjectHeader
  vrvOutdoor: LineItem[]
  vrvBranchSelector: LineItem[]
  vrvIndoor: LineItem[]
  vrvRefnet: LineItem[]
  vrvRefrigerant: LineItem[]
  vrvControllers: LineItem[]
  otherRtuDoas: LineItem[]
  otherSkyAir: LineItem[]
  otherMultiSplit: LineItem[]
  otherMiniSplit: LineItem[]
  otherZoning: LineItem[]
  otherGeneralEquipment: FreeTextLine[]
  otherSheetMetal: FreeTextLine[]
  otherDrawingTime: FreeTextLine[]
  otherPipingFreeText: FreeTextLine[]
  otherPipeTable: Record<string, number>
  pipingFootage: PipeFootageEntry[]
  pipingSettings: PipingSettings
  condensateDrains: number
  condensateDrainsMaterial: 'COPPER' | 'PVC'
  condensatePumps: number
  controlsWiring: WiringLineItem[]
  controlsEngineeringHours: number
  controlsEngineeringCost: number
  controlsMaterialCost: number
  subcontractors: SubcontractorLine[]
  miscCosts: MiscCostLine[]
  miscCustom: { label: string; amount: number }[]
  summary: SummarySettings
  adminRates: AdminRates
  changeLog: ChangeLogEntry[]
}

export interface CalculatedTotals {
  equipmentCost: number
  sheetMetalMaterials: number
  pipingMaterials: number
  sheetMetalHours: number
  pipingHours: number
  sheetMetalLabor: number
  pipingLabor: number
  controlsLabor: number
  controlsMaterials: number
  controlsTotal: number
  pipingSectionCost: number
  pipingSectionHours: number
  insulationCost: number
  directCostsTotal: number
  subcontractorsTotal: number
  miscTotal: number
  jobCost: number
  markedUpPrice: number
  totalInstallCost: number
  smConsumables: number
  pfConsumables: number
}
