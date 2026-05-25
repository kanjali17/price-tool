import type { EstimateState, FreeTextLine, LineItem } from '../types'
import { applyAllEquipmentAutoFill } from '../utils/calculations'

function patchLineItems(
  items: LineItem[],
  patches: Record<string, { quantity: number; equipmentCost?: number }>
): LineItem[] {
  return items.map((item) => {
    const p = patches[item.model]
    if (!p) return item
    return {
      ...item,
      quantity: p.quantity,
      equipmentCost: p.equipmentCost ?? item.equipmentCost,
    }
  })
}

function patchFreeText(
  lines: FreeTextLine[],
  byLabel: Record<string, { quantity: number; equipmentCost?: number }>
): FreeTextLine[] {
  return lines.map((line) => {
    const p = byLabel[line.label]
    if (!p) return line
    return {
      ...line,
      quantity: p.quantity,
      equipmentCost: p.equipmentCost ?? line.equipmentCost,
    }
  })
}

/** Plausible demo job — office VRV retrofit with mixed equipment. */
export function buildSampleEstimateState(base: EstimateState): EstimateState {
  let s: EstimateState = {
    ...base,
    header: {
      projectName: 'Riverside Medical Office — VRV',
      location: 'Austin, TX',
      architectEngineer: 'Henderson & Cole MEP',
      date: base.header.date,
      estimateNo: 'EST-2026-0142',
      estimatedBy: 'J. Martinez',
    },
    vrvOutdoor: patchLineItems(base.vrvOutdoor, {
      'RELQ72 - 120': { quantity: 1, equipmentCost: 78500 },
      'REYQ192 - 336': { quantity: 1, equipmentCost: 142000 },
    }),
    vrvBranchSelector: patchLineItems(base.vrvBranchSelector, {
      'BSQ60TVJ/BSVQ60': { quantity: 2, equipmentCost: 4200 },
      'BS4Q54TVJ/BSV4Q36': { quantity: 1, equipmentCost: 6800 },
    }),
    vrvIndoor: patchLineItems(base.vrvIndoor, {
      'FXAQ07 - 15': { quantity: 8, equipmentCost: 1180 },
      'FXAQ18 - 24': { quantity: 4, equipmentCost: 1650 },
      'FXDQ18 - 24': { quantity: 6, equipmentCost: 2100 },
      'FXFQ30 - 36': { quantity: 3, equipmentCost: 2890 },
      'FXMQ42 - 48': { quantity: 2, equipmentCost: 4200 },
    }),
    vrvRefnet: patchLineItems(base.vrvRefnet, {
      KHRP25: { quantity: 10, equipmentCost: 185 },
      KHRP26: { quantity: 4, equipmentCost: 165 },
    }),
    vrvRefrigerant: patchLineItems(base.vrvRefrigerant, {
      R410A: { quantity: 520 },
    }),
    vrvControllers: patchLineItems(base.vrvControllers, {
      'DCS601C71': { quantity: 1, equipmentCost: 2400 },
      'BACNet Interface': { quantity: 1, equipmentCost: 890 },
    }),
    otherRtuDoas: patchLineItems(base.otherRtuDoas, {
      'RTU/DOAS 24-3600cfm': { quantity: 1, equipmentCost: 28500 },
    }),
    otherSkyAir: patchLineItems(base.otherSkyAir, {
      'RZR/RZQ18-30': { quantity: 1, equipmentCost: 6200 },
      'FAQ07-24': { quantity: 2, equipmentCost: 980 },
    }),
    otherGeneralEquipment: patchFreeText(base.otherGeneralEquipment, {
      'ERV/OAP Units': { quantity: 2, equipmentCost: 4500 },
    }),
    otherDrawingTime: patchFreeText(base.otherDrawingTime, {
      'Daikin Systems (hrs)': { quantity: 24 },
      'RTU/DOAS (hrs)': { quantity: 8 },
    }),
    pipingFootage: base.pipingFootage.map((e) => {
      const footageBySize: Record<string, number> = {
        '1/4"': 145,
        '3/8"': 320,
        '1/2"': 185,
        '5/8"': 90,
        '3/4"': 120,
        '7/8"': 95,
        '1-1/8"': 60,
        '1-3/8"': 40,
      }
      return { ...e, footage: footageBySize[e.size] ?? e.footage }
    }),
    otherPipeTable: {
      ...base.otherPipeTable,
      '1"': 45,
      '1-1/4"': 30,
    },
    condensateDrains: 12,
    condensatePumps: 3,
    controlsEngineeringHours: 32,
    controlsEngineeringCost: 4800,
    controlsMaterialCost: 6200,
    subcontractors: base.subcontractors.map((sub) => {
      const amounts: Record<string, number> = {
        Insulation: 18500,
        Electrical: 9200,
        'Temperature Controls': 0,
        'Testing and Balancing': 4500,
        Hoisting: 2800,
      }
      return { ...sub, amount: amounts[sub.label] ?? sub.amount }
    }),
    miscCosts: base.miscCosts.map((m) => {
      if (m.label === 'Travel Expense') return { ...m, amount: 3500 }
      if (m.label === 'Supervision') return { ...m, amount: 4200 }
      if (m.label === 'Project Management') return { ...m, amount: 5 }
      if (m.label === 'Startup') return { ...m, amount: 2800 }
      return m
    }),
    summary: {
      ...base.summary,
      totalCapacityTons: 168,
      conditionedSqFt: 42000,
      contingencyPercent: 3,
      engineeringPercent: 2,
    },
  }

  s = applyAllEquipmentAutoFill(s)
  return s
}
