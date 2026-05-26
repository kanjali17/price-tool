import type {
  AdminRates,
  CalculatedTotals,
  EstimateState,
  FreeTextLine,
  InsulationThickness,
  LineItem,
  MarkupMode,
  PipeFootageEntry,
  WiringLineItem,
} from '../types'

export function sumLineItems(items: LineItem[]) {
  return items.reduce(
    (acc, item) => {
      const q = item.quantity || 0
      acc.equipment += item.equipmentCost * q
      acc.smHours += item.sheetMetalHours * q
      acc.smMatls += item.sheetMetalMaterials * q
      acc.pfHours += item.pipingHours * q
      acc.pfMatls += item.pipingMaterials * q
      return acc
    },
    { equipment: 0, smHours: 0, smMatls: 0, pfHours: 0, pfMatls: 0 }
  )
}

export function sumFreeTextLines(lines: FreeTextLine[]) {
  return lines.reduce(
    (acc, line) => {
      const q = line.quantity || 0
      acc.equipment += line.equipmentCost * q
      acc.smHours += line.sheetMetalHours * q
      acc.smMatls += line.sheetMetalMaterials * q
      acc.pfHours += line.pipingHours * q
      acc.pfMatls += line.pipingMaterials * q
      return acc
    },
    { equipment: 0, smHours: 0, smMatls: 0, pfHours: 0, pfMatls: 0 }
  )
}

function getInsulPriceKey(thickness: InsulationThickness): 'insulHalf' | 'insulThreeQuarter' | 'insulOne' {
  if (thickness === '1/2"') return 'insulHalf'
  if (thickness === '3/4"') return 'insulThreeQuarter'
  return 'insulOne'
}

function getInsulOnlyKey(thickness: InsulationThickness): 'half' | 'threeQuarter' | 'one' {
  if (thickness === '1/2"') return 'half'
  if (thickness === '3/4"') return 'threeQuarter'
  return 'one'
}

export function calcPipingFromFootage(
  footage: PipeFootageEntry[],
  admin: AdminRates,
  insulationThickness: InsulationThickness
): { cost: number; hours: number; insulationCost: number } {
  const insulKey = getInsulPriceKey(insulationThickness)
  const insulOnlyKey = getInsulOnlyKey(insulationThickness)
  let cost = 0
  let hours = 0
  let insulationCost = 0

  for (const entry of footage) {
    if (!entry.footage) continue
    const pricing = admin.copperAcrPricing[entry.size]
    const hrsPerFt = admin.pipingHoursPerFt[entry.size] ?? 0.2
    const insul = admin.insulationPricing[entry.size]

    if (pricing) {
      const pricePerFt = pricing[insulKey] ?? pricing.copper
      cost += entry.footage * pricePerFt
    }
    hours += entry.footage * hrsPerFt
    if (insul) {
      insulationCost += entry.footage * insul[insulOnlyKey]
    }
  }

  return { cost, hours, insulationCost }
}

export function calcControls(
  wiring: WiringLineItem[],
  engineeringHours: number,
  engineeringCost: number,
  materialCost: number,
  controlsRate: number
) {
  let laborHours = engineeringHours
  let materials = engineeringCost + materialCost

  for (const w of wiring) {
    const q = w.quantity || 0
    laborHours += w.hoursPerEa * q
    materials += w.materialsPerEa * q
  }

  const labor = laborHours * controlsRate
  return { labor, materials, total: labor + materials }
}

export function applyMarkup(base: number, percent: number, mode: MarkupMode): number {
  if (base <= 0) return 0
  if (mode === 'markup') return base * (1 + percent / 100)
  const gm = percent / 100
  if (gm >= 1) return base
  return base / (1 - gm)
}

/** Normalize model text for lookup (Excel uses spaces around dashes). */
export function normalizeModelKey(model: string): string {
  return model.replace(/\s*-\s*/g, ' - ').replace(/\s+/g, ' ').trim()
}

export function autoFillOutdoorUnit(item: LineItem, admin: AdminRates): LineItem {
  const key = item.cfmSize || normalizeModelKey(item.model)
  const lookup = admin.outdoorUnitHours[key]
  if (!lookup || !item.quantity) return item
  // Excel VRV Equipment: I=(Set+Pipe)*Qty, J=Qty*(PipeMatls+ISOPads); no SM columns for outdoor
  return {
    ...item,
    sheetMetalHours: 0,
    sheetMetalMaterials: 0,
    pipingHours: lookup.setHours + lookup.pipeHours,
    pipingMaterials: lookup.pipeMatls + lookup.isoPads,
  }
}

export function autoFillBranchSelector(item: LineItem, admin: AdminRates): LineItem {
  const key = item.category || ''
  const lookup = admin.branchSelectorHours[key]
  if (!lookup || !item.quantity) return item
  return {
    ...item,
    sheetMetalHours: 0,
    sheetMetalMaterials: 0,
    pipingHours: lookup.setHangHrs + lookup.pipeHrs,
    pipingMaterials: lookup.matls,
  }
}

export function autoFillFcu(item: LineItem, admin: AdminRates): LineItem {
  const key = item.cfmSize || '07 - 15'
  const lookup = admin.fcuHoursBySize[key]
  if (!lookup || !item.quantity) return item
  const ductedAdj = admin.fcuDuctedAdjustments
  if (item.isDucted) {
    const smHrs = (lookup.ductedSmHrs ?? lookup.shopSmHrs + lookup.fieldSmHrs + lookup.airDevices) - ductedAdj.smHrs
    const smMatls = (lookup.ductedSmMatls ?? lookup.smMatls) - ductedAdj.smMatls
    return {
      ...item,
      sheetMetalHours: smHrs,
      sheetMetalMaterials: smMatls,
      pipingHours: lookup.ductedPipeHrs ?? lookup.pipeHrs,
      pipingMaterials: lookup.ductedPipeMatls ?? lookup.pipeMatls,
    }
  }
  return {
    ...item,
    sheetMetalHours: 0,
    sheetMetalMaterials: 0,
    pipingHours: lookup.pipeHrs + lookup.setHangPfHrs,
    pipingMaterials: lookup.pipeMatls + lookup.pfMatls,
  }
}

export function autoFillRefrigerant(item: LineItem, admin: AdminRates): LineItem {
  if (!item.quantity || item.model !== 'R410A') return item
  const lbs = item.quantity
  const hrs = Math.max(admin.refrigerantHrsMin, lbs * 0.1)
  const matls = lbs * admin.refrigerantPerLb
  return {
    ...item,
    sheetMetalHours: 0,
    sheetMetalMaterials: 0,
    pipingHours: hrs,
    pipingMaterials: matls,
  }
}

/** Mirror Excel Controls Wiring qty formulas from VRV / other equipment counts. */
export function deriveControlsWiringQuantities(
  state: EstimateState,
  wiring: WiringLineItem[]
): WiringLineItem[] {
  const sumQty = (items: LineItem[]) => items.reduce((s, i) => s + (i.quantity || 0), 0)

  let bsQty = 0
  for (const item of state.vrvBranchSelector) {
    const q = item.quantity || 0
    if (!q) continue
    const m = item.model.toUpperCase()
    if (m.includes('BSQ36') || m.includes('BSQ60') || m.includes('BSQ96')) bsQty += q
    else if (m.includes('BS4Q') || m.includes('BSV4') || m.includes('BSF4')) bsQty += q * 4
    else if (m.includes('BS6Q') || m.includes('BSV6') || m.includes('BSF6')) bsQty += q * 6
    else if (m.includes('BS8Q') || m.includes('BSV8') || m.includes('BSF8')) bsQty += q * 8
    else if (m.includes('BS10Q')) bsQty += q * 10
    else if (m.includes('BS12Q')) bsQty += q * 12
    else bsQty += q
  }

  const itouchQty = state.vrvControllers.reduce((s, i) => {
    const m = i.model.toUpperCase()
    if (
      m.includes('BRC1E73') ||
      m.includes('BRC2A71') ||
      m.includes('DCS601') ||
      m.includes('DCM601') ||
      m.includes('I TOUCH')
    ) {
      return s + (i.quantity || 0)
    }
    return s
  }, 0)

  const smallCondQty =
    sumQty(state.vrvOutdoor.filter((i) => /RXTQ|RXYMQ/i.test(i.model))) +
    sumQty(state.otherSkyAir.filter((i) => /RZR|RZQ|2MXS|3MXS/i.test(i.model))) +
    sumQty(state.otherMultiSplit)

  const qtyById: Record<string, number> = {
    'w-fcu': sumQty(state.vrvIndoor),
    'w-bs': bsQty,
    'w-cond': sumQty(state.vrvOutdoor),
    'w-cond-small': smallCondQty,
    'w-mini': sumQty(state.otherMiniSplit),
    'w-dzk': sumQty(state.otherZoning),
    'w-itouch': itouchQty,
    'w-doas': sumQty(state.otherRtuDoas.filter((i) => /DOAS/i.test(i.model))),
    'w-rtu': sumQty(state.otherRtuDoas.filter((i) => /RTU/i.test(i.model))),
  }

  return wiring.map((w) => ({
    ...w,
    quantity: Math.max(0, qtyById[w.id] ?? w.quantity),
  }))
}

export function autoFillRefnet(item: LineItem, admin: AdminRates): LineItem {
  const key = item.category || ''
  const lookup = admin.refnetHours[key]
  if (!lookup || !item.quantity) return item
  return {
    ...item,
    pipingHours: lookup.copperHrs,
    pipingMaterials: lookup.matls,
  }
}

export function autoFillRtuDoas(item: LineItem, admin: AdminRates): LineItem {
  const key = item.category || ''
  const lookup = admin.rtuDoasHours[key]
  if (!lookup || !item.quantity) return item
  return {
    ...item,
    sheetMetalHours: lookup.smHrs,
    pipingHours: lookup.pfHrs,
    pipingMaterials: lookup.curbMatls,
  }
}

const EQUIPMENT_LINE_KEYS = [
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

export type EquipmentLineKey = (typeof EQUIPMENT_LINE_KEYS)[number]

export function autoFillLineItems(
  key: EquipmentLineKey,
  items: LineItem[],
  admin: AdminRates
): LineItem[] {
  return items.map((item) => {
    switch (key) {
      case 'vrvOutdoor':
        return autoFillOutdoorUnit(item, admin)
      case 'vrvBranchSelector':
        return autoFillBranchSelector(item, admin)
      case 'vrvIndoor':
        return autoFillFcu(item, admin)
      case 'vrvRefnet':
        return autoFillRefnet(item, admin)
      case 'vrvRefrigerant':
        return autoFillRefrigerant(item, admin)
      case 'otherRtuDoas':
        return autoFillRtuDoas(item, admin)
      default:
        return item
    }
  })
}

export function applyAllEquipmentAutoFill(state: EstimateState): EstimateState {
  const admin = state.adminRates
  const filled = { ...state } as EstimateState
  for (const key of EQUIPMENT_LINE_KEYS) {
    filled[key] = autoFillLineItems(key, filled[key], admin)
  }
  filled.controlsWiring = deriveControlsWiringQuantities(filled, filled.controlsWiring)
  return filled
}

/** Rated tons from outdoor model text (max MBH in name ÷ 12). */
export function parseOutdoorUnitTons(model: string): number {
  const rangeMatch = model.match(/(\d+)\s*-\s*(\d+)/)
  if (rangeMatch) {
    const max = Math.max(parseInt(rangeMatch[1], 10), parseInt(rangeMatch[2], 10))
    return max / 12
  }
  const nums = model.match(/\d+/g)
  if (!nums?.length) return 0
  const max = Math.max(...nums.map((n) => parseInt(n, 10)))
  return max >= 12 ? max / 12 : 0
}

export function sumOutdoorUnitTonnage(state: EstimateState): number {
  const sections = [
    state.vrvOutdoor,
    state.otherSkyAir,
    state.otherMultiSplit,
    state.otherMiniSplit,
  ]
  let total = 0
  for (const section of sections) {
    for (const item of section) {
      const q = item.quantity || 0
      if (q > 0) total += parseOutdoorUnitTons(item.model) * q
    }
  }
  return Math.round(total * 100) / 100
}


export function calculateTotals(state: EstimateState): CalculatedTotals {
  const rate = state.adminRates.laborRates.sheetMetalPipingRate
  const controlsRate = state.adminRates.laborRates.controlsRate

  const allEquipmentSections = [
    state.vrvOutdoor,
    state.vrvBranchSelector,
    state.vrvIndoor,
    state.vrvRefnet,
    state.vrvRefrigerant,
    state.vrvControllers,
    state.otherRtuDoas,
    state.otherSkyAir,
    state.otherMultiSplit,
    state.otherMiniSplit,
    state.otherZoning,
  ]

  let equipmentCost = 0
  let sheetMetalHours = 0
  let sheetMetalMaterials = 0
  let pipingHours = 0
  let pipingMaterials = 0

  for (const section of allEquipmentSections) {
    const s = sumLineItems(section)
    equipmentCost += s.equipment
    sheetMetalHours += s.smHours
    sheetMetalMaterials += s.smMatls
    pipingHours += s.pfHours
    pipingMaterials += s.pfMatls
  }

  const freeTextSections = [
    state.otherGeneralEquipment,
    state.otherSheetMetal,
    state.otherDrawingTime,
    state.otherPipingFreeText,
  ]
  for (const section of freeTextSections) {
    const s = sumFreeTextLines(section)
    equipmentCost += s.equipment
    sheetMetalHours += s.smHours
    sheetMetalMaterials += s.smMatls
    pipingHours += s.pfHours
    pipingMaterials += s.pfMatls
  }

  const pipingCalc = calcPipingFromFootage(
    state.pipingFootage,
    state.adminRates,
    state.pipingSettings.insulationThickness
  )
  pipingMaterials += pipingCalc.cost
  pipingHours += pipingCalc.hours

  const condensateFactor =
    state.condensateDrainsMaterial === 'COPPER'
      ? state.adminRates.condensateCopperFactor
      : state.adminRates.condensatePvcFactor
  if (state.condensateDrains > 0) {
    pipingHours += state.condensateDrains * state.adminRates.condensateHrsPerItem
    pipingMaterials +=
      state.condensateDrains *
      state.adminRates.condensateStdFt *
      state.adminRates.condensateMatlPerFt *
      (condensateFactor / 100)
  }
  if (state.condensatePumps > 0) {
    pipingHours += state.condensatePumps * state.adminRates.condensatePumpHrs
    pipingMaterials += state.condensatePumps * state.adminRates.condensatePumpMatls
  }

  const pfConsumableRate = state.pipingSettings.reflok
    ? state.adminRates.consumablesPfReflokPercent
    : state.pipingSettings.brazed
      ? state.adminRates.consumablesPfBrazedPercent
      : state.adminRates.consumablesPfReflokPercent

  const smConsumables = sheetMetalMaterials * state.adminRates.consumablesSmPercent
  const pfConsumables = pipingMaterials * pfConsumableRate
  const smMatlsWithConsumables = sheetMetalMaterials + smConsumables
  const pfMatlsWithConsumables = pipingMaterials + pfConsumables

  const sheetMetalLabor = sheetMetalHours * rate
  const pipingLabor = pipingHours * rate - (state.pipingSettings.reflok ? state.pipingSettings.reflokLaborDiscount : 0)

  const controls = calcControls(
    state.controlsWiring,
    state.controlsEngineeringHours,
    state.controlsEngineeringCost,
    state.controlsMaterialCost,
    controlsRate
  )

  const insulationCost =
    pipingCalc.insulationCost +
    (pipingCalc.hours * state.adminRates.laborRates.insulationRate) / 8

  const tax = state.summary.salesTaxPercent / 100
  const materialsSubtotal = smMatlsWithConsumables + pfMatlsWithConsumables
  const salesTaxAmount = (equipmentCost + materialsSubtotal) * tax
  const derivedOutdoorTons = sumOutdoorUnitTonnage(state)
  const equipmentWithTax = equipmentCost * (1 + tax)
  const smMatlsWithTax = smMatlsWithConsumables * (1 + tax)
  const pfMatlsWithTax = pfMatlsWithConsumables * (1 + tax)

  const directCostsTotal =
    equipmentWithTax + smMatlsWithTax + pfMatlsWithTax + sheetMetalLabor + pipingLabor

  const subcontractorsTotal = state.subcontractors.reduce((s, l) => s + (l.amount || 0), 0)
  const miscBase = state.miscCosts.reduce((s, l) => s + (l.amount || 0), 0)
  const miscCustom = state.miscCustom.reduce((s, l) => s + (l.amount || 0), 0)
  const pmPercent = state.summary.projectManagementPercent / 100
  const pmAmount = (sheetMetalLabor + pipingLabor + controls.labor) * pmPercent
  const miscTotal = miscBase + miscCustom + pmAmount

  const jobCost = directCostsTotal + controls.total + subcontractorsTotal + miscTotal + insulationCost

  const eoAmount = jobCost * (state.summary.errorsOmissionsPercent / 100)
  const contingencyAmount = jobCost * (state.summary.contingencyPercent / 100)
  const engineeringAmount = jobCost * (state.summary.engineeringPercent / 100)
  const mode = state.summary.markupMode
  const markedEquipment = applyMarkup(equipmentWithTax, state.summary.equipmentMarkup, mode)
  const markedMaterial = applyMarkup(smMatlsWithTax + pfMatlsWithTax, state.summary.materialMarkup, mode)
  const markedLabor = applyMarkup(sheetMetalLabor + pipingLabor + controls.labor, state.summary.laborMarkup, mode)
  const markedSub = applyMarkup(subcontractorsTotal, state.summary.subcontractorMarkup, mode)
  const markedMisc = applyMarkup(miscTotal, state.summary.miscMarkup, mode)
  const markedEo = applyMarkup(eoAmount + contingencyAmount + engineeringAmount, state.summary.eoMarkup, mode)

  const totalInstallCost = markedEquipment + markedMaterial + markedLabor + markedSub + markedMisc + markedEo

  return {
    equipmentCost,
    materialsSubtotal,
    salesTaxAmount,
    derivedOutdoorTons,
    sheetMetalMaterials: smMatlsWithConsumables,
    pipingMaterials: pfMatlsWithConsumables,
    sheetMetalHours,
    pipingHours,
    sheetMetalLabor,
    pipingLabor,
    controlsLabor: controls.labor,
    controlsMaterials: controls.materials,
    controlsTotal: controls.total,
    pipingSectionCost: pipingCalc.cost,
    pipingSectionHours: pipingCalc.hours,
    insulationCost,
    directCostsTotal,
    subcontractorsTotal,
    miscTotal,
    jobCost,
    markedUpPrice: totalInstallCost,
    totalInstallCost,
    smConsumables,
    pfConsumables,
  }
}


export function countActiveEquipmentLines(state: EstimateState): number {
  const sections = [
    state.vrvOutdoor,
    state.vrvBranchSelector,
    state.vrvIndoor,
    state.vrvRefnet,
    state.vrvRefrigerant,
    state.vrvControllers,
    state.otherRtuDoas,
    state.otherSkyAir,
    state.otherMultiSplit,
    state.otherMiniSplit,
    state.otherZoning,
  ]
  return sections.reduce((n, sec) => n + sec.filter((i) => (i.quantity || 0) > 0).length, 0)
}

/** Parse quantity input — rejects negatives (returns 0). */
export function parseQuantity(value: string): number {
  const n = parseFloat(value)
  if (Number.isNaN(n) || n < 0) return 0
  return n
}

export function formatCurrency(n: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(n)
}

export function formatNumber(n: number, decimals = 2): string {
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })
}
