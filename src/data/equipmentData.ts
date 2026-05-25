export interface EquipmentCatalogItem {
  model: string
  description: string
  tooltip?: string
  category?: string
  cfmSize?: string
  isDucted?: boolean
}

import {
  excelBranch,
  excelControllers,
  excelIndoor,
  excelOutdoor,
  excelRefnet,
  excelRefrigerant,
} from './vrvFromExcel'

const outdoor = excelOutdoor
const branchSelector = excelBranch

const indoor = excelIndoor
const refnet = excelRefnet
const refrigerant = excelRefrigerant
const controllers = excelControllers

const rtuDoas: EquipmentCatalogItem[] = [
  { model: 'RTU/DOAS 0-1200cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '0-1200 cfm' },
  { model: 'RTU/DOAS 12-2400cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '12-2400 cfm' },
  { model: 'RTU/DOAS 24-3600cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '24-3600 cfm' },
  { model: 'RTU/DOAS 36-4800cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '36-4800 cfm' },
  { model: 'RTU/DOAS 48-6000cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '48-6000 cfm' },
  { model: 'RTU/DOAS 60-7500cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '60-7500 cfm' },
  { model: 'RTU/DOAS 75-10000cfm', description: 'Roof Mounted Equipment, Curb, Roof Cutting & Accessories', category: '75-10000 cfm' },
  { model: 'OA DUCTWORK', description: 'Outside Air Ductwork to FCUs' },
]

const skyAir: EquipmentCatalogItem[] = [
  { model: 'RZR/RZQ18-30', description: 'SkyAir Heat Pump/Cooling Only (208-230V/1ph)', cfmSize: 'RZR/RZQ18-30/2MXS/3MXS' },
  { model: 'RZR/RZQ36-42', description: 'SkyAir Heat Pump/Cooling Only (208-230V/1ph)', cfmSize: 'RZR/RZQ36-42/4MXS' },
  { model: 'FAQ07-24', description: 'SkyAir Wall Mounted Unit', cfmSize: '07-15' },
  { model: 'FHQ12-36', description: 'SkyAir Ceiling Suspended Unit', cfmSize: '30-36' },
  { model: 'FTQ/FBQ12', description: 'SkyAir Vert or Horz AHU (Ducted)', cfmSize: '07-15', isDucted: true },
  { model: 'FTQ/FBQ18-24', description: 'SkyAir Vert or Horz AHU (Ducted)', cfmSize: '18-24', isDucted: true },
  { model: 'FTQ/FBQ30-36', description: 'SkyAir Vert or Horz AHU (Ducted)', cfmSize: '30-36', isDucted: true },
]

const multiSplit: EquipmentCatalogItem[] = [
  { model: '2MXS18', description: 'Multi Split Heat Pump - 2 Zone (208-230V/1ph)', cfmSize: 'RZR/RZQ18-30/2MXS/3MXS' },
  { model: '3MXS24', description: 'Multi Split Heat Pump - 3 Zone', cfmSize: 'RZR/RZQ18-30/2MXS/3MXS' },
  { model: '4MXS32', description: 'Multi Split Heat Pump - 4 Zone', cfmSize: 'RZR/RZQ36-42/4MXS' },
  { model: 'RMXS48', description: 'Multi Split Heat Pump - Up to 8 Zone', cfmSize: 'RXTQ/RXYMQ/RMXS' },
  { model: 'BPMKS04', description: 'Multi Split 1-2 Port BPU' },
  { model: 'BPMKS06', description: 'Multi Split 1-3 Port BPU' },
]

const miniSplit: EquipmentCatalogItem[] = [
  { model: 'R__09-24', description: 'Mini Splits', cfmSize: 'R__09-24 (Mini)' },
  { model: 'FFQ09-18', description: 'Multi Split 2x2 Cassette', cfmSize: '07-15' },
  { model: 'CTXS07-12/FTXS15-24', description: 'Multi Split Indoor Wall Unit', cfmSize: '07-15' },
  { model: 'FDXS09-12/CDXS15-24', description: 'Multi Split Indoor Slim Duct Unit', cfmSize: '07-15', isDucted: true },
]

const zoning: EquipmentCatalogItem[] = [
  { model: 'DZK030E4', description: 'Daikin Zoning Kit - 2 to 4 Zones (FXMQ/FBQ 18-30)' },
  { model: 'DZK030E5', description: 'Daikin Zoning Kit - 2 to 5 Zones (FXMQ/FBQ 18-30)' },
  { model: 'DZK048E4', description: 'Daikin Zoning Kit - 2 to 4 Zones (FXMQ/FBQ 36-48)' },
  { model: 'DZK048E6', description: 'Daikin Zoning Kit - 2 to 6 Zones (FXMQ/FBQ 36-48)' },
  { model: 'DZK-MTS-1', description: 'Daikin Zoning Kit - Main Thermostat' },
  { model: 'DZK-ZTS-1', description: 'Daikin Zoning Kit - Wireless Thermostat' },
  { model: 'DZK-CM-1', description: 'Daikin Zoning Kit - Changeover Master Unit' },
]

export const LINE_SET_SIZES = ['1/4"', '3/8"', '1/2"', '5/8"']
export const ACR_SIZES = ['3/4"', '7/8"', '1-1/8"', '1-3/8"', '1-5/8"']
export const STEEL_PIPE_SIZES = ['1/2"', '3/4"', '1"', '1-1/4"', '1-1/2"', '2"', '2-1/2"', '3"', '4"', '5"', '6"', '8"']

export const GENERAL_EQUIPMENT_LABELS = [
  'Equipment (general)', 'RTU', 'RTU Curbs', 'AHU', 'ERV/OAP Units', 'Pool AHU',
  'Pool Accessories', 'Unit Heaters', 'Finned Tube Radiation', 'Boilers', 'Pumps', 'Chillers',
]

export const SHEET_METAL_LABELS = [
  'Ductwork (System 1)', 'Ductwork (System 2)', 'Ductwork (System 3)', 'Kitchen Exhaust',
  'Dryer Vents', 'Air Devices', 'Fire Dampers', 'Flues', 'EFs', 'Louvers', 'Plenums', 'Modifications',
]

export const DRAWING_TIME_LABELS = ['Daikin Systems (hrs)', 'RTU/DOAS (hrs)', 'Other Systems (hrs)']

export const PIPING_FREE_TEXT_LABELS = [
  'Pool Piping', 'Chilled Water', 'Heating Water', 'Gas Piping', 'Pipe Hole Cutting/Sleeves',
  'Duct Hole Cutting/Sleeves', 'Sleeves', 'Caulking', 'Grouting', 'Misc Steel', 'ID',
  'Concrete Pads', 'Cleaning', 'Glycol', 'Refrigerant', 'Recovery', 'Water Treatment',
  'Pipe Isolation', 'Equipment Isolation', 'Seismic Bracing', 'Anchors', 'Guides',
  'Pitch Pockets', 'Access Doors', 'Rails/Misc Curbs', 'Roof Pipe/Duct Supports',
  'Floor/Deck Cutting', 'Drain Boxes', 'Demo Pipe', 'Demo AC', 'Demo Boiler Room',
]

export const equipmentCatalog = {
  vrvOutdoor: outdoor,
  vrvBranchSelector: branchSelector,
  vrvIndoor: indoor,
  vrvRefnet: refnet,
  vrvRefrigerant: refrigerant,
  vrvControllers: controllers,
  otherRtuDoas: rtuDoas,
  otherSkyAir: skyAir,
  otherMultiSplit: multiSplit,
  otherMiniSplit: miniSplit,
  otherZoning: zoning,
}

export function catalogToLineItems(
  catalog: EquipmentCatalogItem[],
  prefix: string
): import('../types').LineItem[] {
  return catalog.map((item, i) => ({
    id: `${prefix}-${i}`,
    model: item.model,
    description: item.description,
    quantity: 0,
    equipmentCost: 0,
    sheetMetalHours: 0,
    sheetMetalMaterials: 0,
    pipingHours: 0,
    pipingMaterials: 0,
    tooltip: item.tooltip,
    category: item.category,
    cfmSize: item.cfmSize,
    isDucted: item.isDucted,
  }))
}

export function labelsToFreeTextLines(labels: string[], prefix: string): import('../types').FreeTextLine[] {
  return labels.map((label, i) => ({
    id: `${prefix}-${i}`,
    label,
    quantity: 0,
    equipmentCost: 0,
    sheetMetalHours: 0,
    sheetMetalMaterials: 0,
    pipingHours: 0,
    pipingMaterials: 0,
  }))
}
