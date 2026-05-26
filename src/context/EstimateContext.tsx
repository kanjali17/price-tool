import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  ACR_SIZES,
  DRAWING_TIME_LABELS,
  GENERAL_EQUIPMENT_LABELS,
  LINE_SET_SIZES,
  PIPING_FREE_TEXT_LABELS,
  SHEET_METAL_LABELS,
  STEEL_PIPE_SIZES,
  catalogToLineItems,
  equipmentCatalog,
  labelsToFreeTextLines,
} from '../data/equipmentData'
import { defaultAdminRates, defaultWiringItems } from '../data/laborRates'
import type {
  EstimateState,
  FreeTextLine,
  LineItem,
  SavedProject,
  SectionId,
} from '../types'
import { buildSampleEstimateState } from '../data/sampleEstimate'
import {
  firstSectionForValidation,
  validateEstimate,
  type ValidationResult,
  type ValidationScope,
} from '../utils/validation'
import {
  equipmentKeyToSection,
  resetEstimateAnalyticsSession,
  trackEquipmentQuantityChanged,
  trackEstimateEvent,
} from '../analytics/amplitude'
import type { ValidationScopeProp } from '../analytics/events'
import {
  autoFillLineItems,
  calculateTotals,
  deriveControlsWiringQuantities,
  parseQuantity,
  type EquipmentLineKey,
} from '../utils/calculations'

const STORAGE_KEY = 'daikin-estimate-current'
const PROJECTS_KEY = 'daikin-estimate-projects'
const ADMIN_KEY = 'daikin-estimate-admin'

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createInitialState(): EstimateState {
  return {
    header: {
      projectName: '',
      location: '',
      architectEngineer: '',
      date: todayISO(),
      estimateNo: '',
      estimatedBy: '',
    },
    vrvOutdoor: catalogToLineItems(equipmentCatalog.vrvOutdoor, 'outdoor'),
    vrvBranchSelector: catalogToLineItems(equipmentCatalog.vrvBranchSelector, 'bs'),
    vrvIndoor: catalogToLineItems(equipmentCatalog.vrvIndoor, 'indoor'),
    vrvRefnet: catalogToLineItems(equipmentCatalog.vrvRefnet, 'refnet'),
    vrvRefrigerant: catalogToLineItems(equipmentCatalog.vrvRefrigerant, 'ref'),
    vrvControllers: catalogToLineItems(equipmentCatalog.vrvControllers, 'ctrl'),
    otherRtuDoas: catalogToLineItems(equipmentCatalog.otherRtuDoas, 'rtu'),
    otherSkyAir: catalogToLineItems(equipmentCatalog.otherSkyAir, 'sky'),
    otherMultiSplit: catalogToLineItems(equipmentCatalog.otherMultiSplit, 'multi'),
    otherMiniSplit: catalogToLineItems(equipmentCatalog.otherMiniSplit, 'mini'),
    otherZoning: catalogToLineItems(equipmentCatalog.otherZoning, 'zk'),
    otherGeneralEquipment: labelsToFreeTextLines(GENERAL_EQUIPMENT_LABELS, 'ge'),
    otherSheetMetal: labelsToFreeTextLines(SHEET_METAL_LABELS, 'sm'),
    otherDrawingTime: labelsToFreeTextLines(DRAWING_TIME_LABELS, 'dt'),
    otherPipingFreeText: labelsToFreeTextLines(PIPING_FREE_TEXT_LABELS, 'pf'),
    otherPipeTable: Object.fromEntries(STEEL_PIPE_SIZES.map((s) => [s, 0])),
    pipingFootage: [
      ...LINE_SET_SIZES.map((size) => ({ size, footage: 0, type: 'lineSet' as const })),
      ...ACR_SIZES.map((size) => ({ size, footage: 0, type: 'acr' as const })),
    ],
    pipingSettings: {
      brazed: true,
      acrPipe: 'COPPER',
      insulationThickness: '3/4"',
      reflok: false,
      reflokLaborDiscount: 0,
    },
    condensateDrains: 0,
    condensateDrainsMaterial: 'COPPER',
    condensatePumps: 0,
    controlsWiring: defaultWiringItems.map((w) => ({
      id: w.id,
      label: w.label,
      quantity: 0,
      hoursPerEa: w.hoursPerEa,
      materialsPerEa: w.materialsPerEa,
    })),
    controlsEngineeringHours: 0,
    controlsEngineeringCost: 0,
    controlsMaterialCost: 0,
    subcontractors: [
      { id: 'sub-1', label: 'Insulation', amount: 0 },
      { id: 'sub-2', label: 'Electrical', amount: 0 },
      { id: 'sub-3', label: 'Temperature Controls', amount: 0 },
      { id: 'sub-4', label: 'Testing and Balancing', amount: 0 },
      { id: 'sub-5', label: 'Hoisting', amount: 0 },
      { id: 'sub-6', label: 'Custom Line 1', amount: 0 },
      { id: 'sub-7', label: 'Custom Line 2', amount: 0 },
    ],
    miscCosts: [
      { id: 'misc-1', label: 'Travel Expense', amount: 0 },
      { id: 'misc-2', label: 'Supervision', amount: 0 },
      { id: 'misc-3', label: 'Project Management', amount: 0, isPercentOfLabor: true },
      { id: 'misc-4', label: 'Startup', amount: 0 },
      { id: 'misc-5', label: 'First Year Service', amount: 0 },
    ],
    miscCustom: [
      { label: 'Custom Line 1', amount: 0 },
      { label: 'Custom Line 2', amount: 0 },
    ],
    summary: {
      salesTaxPercent: 8.5,
      projectManagementPercent: 5,
      errorsOmissionsPercent: 0,
      contingencyPercent: 0,
      engineeringPercent: 0,
      markupMode: 'markup',
      equipmentMarkup: 10,
      materialMarkup: 10,
      laborMarkup: 0,
      subcontractorMarkup: 10,
      miscMarkup: 10,
      eoMarkup: 10,
      totalCapacityTons: 0,
      conditionedSqFt: 0,
    },
    adminRates: defaultAdminRates,
    changeLog: [],
  }
}

function loadAdminRates(): typeof defaultAdminRates {
  try {
    const raw = localStorage.getItem(ADMIN_KEY)
    if (raw) return { ...defaultAdminRates, ...JSON.parse(raw) }
  } catch {
    /* ignore */
  }
  return defaultAdminRates
}

interface EstimateContextValue {
  state: EstimateState
  totals: ReturnType<typeof calculateTotals>
  activeSection: SectionId
  setActiveSection: (s: SectionId) => void
  updateHeader: (patch: Partial<EstimateState['header']>) => void
  updateLineItems: (key: keyof Pick<EstimateState, 'vrvOutdoor' | 'vrvBranchSelector' | 'vrvIndoor' | 'vrvRefnet' | 'vrvRefrigerant' | 'vrvControllers' | 'otherRtuDoas' | 'otherSkyAir' | 'otherMultiSplit' | 'otherMiniSplit' | 'otherZoning'>, items: LineItem[]) => void
  updateFreeText: (key: keyof Pick<EstimateState, 'otherGeneralEquipment' | 'otherSheetMetal' | 'otherDrawingTime' | 'otherPipingFreeText'>, lines: FreeTextLine[]) => void
  updateState: (patch: Partial<EstimateState>) => void
  logChange: (message: string) => void
  savedProjects: SavedProject[]
  saveProject: (name: string) => void
  loadProject: (id: string) => void
  duplicateProject: () => void
  deleteProject: (id: string) => void
  bulkPopulate: (text: string, section: 'vrvOutdoor' | 'vrvIndoor') => void
  resetEstimate: () => void
  loadSampleEstimate: () => void
  validation: ValidationResult
  showValidation: boolean
  validateAndProceed: (scope: ValidationScope, action: () => void) => boolean
}

const EstimateContext = createContext<EstimateContextValue | null>(null)

export function EstimateProvider({ children }: { children: ReactNode }) {
  const [activeSection, setActiveSection] = useState<SectionId>('vrv')
  const [savedProjects, setSavedProjects] = useState<SavedProject[]>([])
  const [showValidation, setShowValidation] = useState(false)
  const [validationScope, setValidationScope] = useState<ValidationScope | null>(null)

  const [state, setState] = useState<EstimateState>(() => {
    const admin = loadAdminRates()
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as EstimateState
        return { ...createInitialState(), ...parsed, adminRates: admin }
      }
    } catch {
      /* ignore */
    }
    return buildSampleEstimateState({ ...createInitialState(), adminRates: admin })
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  }, [state])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_KEY)
      if (raw) setSavedProjects(JSON.parse(raw))
    } catch {
      /* ignore */
    }
  }, [])

  const logChange = useCallback((message: string) => {
    setState((prev) => ({
      ...prev,
      changeLog: [
        { timestamp: new Date().toISOString(), message },
        ...prev.changeLog.slice(0, 99),
      ],
    }))
  }, [])

  const applyAutoFill = useCallback(
    (key: EquipmentLineKey, items: LineItem[]): LineItem[] =>
      autoFillLineItems(key, items, state.adminRates),
    [state.adminRates]
  )

  const updateLineItems = useCallback(
    (
      key: keyof Pick<
        EstimateState,
        | 'vrvOutdoor'
        | 'vrvBranchSelector'
        | 'vrvIndoor'
        | 'vrvRefnet'
        | 'vrvRefrigerant'
        | 'vrvControllers'
        | 'otherRtuDoas'
        | 'otherSkyAir'
        | 'otherMultiSplit'
        | 'otherMiniSplit'
        | 'otherZoning'
      >,
      items: LineItem[]
    ) => {
      const filled = applyAutoFill(key as EquipmentLineKey, items)
      const section = equipmentKeyToSection(key)
      setState((prev) => {
        if (section) {
          const prevItems = prev[key] as LineItem[]
          const nextState = { ...prev, [key]: filled }
          const nextTotals = calculateTotals(nextState)
          for (const item of filled) {
            const old = prevItems.find((i) => i.id === item.id)
            if (!old || old.quantity === item.quantity) continue
            trackEquipmentQuantityChanged(
              {
                model: item.model,
                new_qty: Math.round(item.quantity),
                old_qty: Math.round(old.quantity),
                section,
              },
              nextTotals.totalInstallCost
            )
          }
        }
        const next = { ...prev, [key]: filled }
        const equipmentKeys = [
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
        ]
        if (equipmentKeys.includes(key)) {
          next.controlsWiring = deriveControlsWiringQuantities(next, next.controlsWiring)
        }
        return next
      })
      logChange(`Updated ${key}`)
    },
    [applyAutoFill, logChange]
  )

  const totals = useMemo(() => calculateTotals(state), [state])
  const validation = useMemo(
    () => validateEstimate(state, validationScope ?? 'header'),
    [state, validationScope]
  )

  useEffect(() => {
    if (!showValidation || !validationScope) return
    if (validateEstimate(state, validationScope).isValid) {
      setShowValidation(false)
      setValidationScope(null)
    }
  }, [state, showValidation, validationScope])

  const validateAndProceed = useCallback(
    (scope: ValidationScope, action: () => void) => {
      const result = validateEstimate(state, scope)
      if (!result.isValid) {
        trackEstimateEvent(
          'validation_failed',
          {
            scope: scope as ValidationScopeProp,
            issue_count: result.messages.length,
          },
          totals.totalInstallCost
        )
        setValidationScope(scope)
        setShowValidation(true)
        setActiveSection(firstSectionForValidation(result))
        return false
      }
      setShowValidation(false)
      setValidationScope(null)
      action()
      return true
    },
    [state, totals.totalInstallCost]
  )

  const saveProject = useCallback(
    (name: string) => {
      validateAndProceed('header', () => {
        const project: SavedProject = {
          id: crypto.randomUUID(),
          name: name.trim() || state.header.projectName.trim(),
          savedAt: new Date().toISOString(),
          state,
        }
        const next = [...savedProjects, project]
        setSavedProjects(next)
        localStorage.setItem(PROJECTS_KEY, JSON.stringify(next))
        logChange(`Saved project: ${project.name}`)
        trackEstimateEvent('estimate_saved', {}, calculateTotals(state).totalInstallCost)
      })
    },
    [state, savedProjects, logChange, validateAndProceed]
  )

  const loadProject = useCallback(
    (id: string) => {
      const p = savedProjects.find((x) => x.id === id)
      if (p) {
        setState({ ...p.state, adminRates: state.adminRates })
        logChange(`Loaded project: ${p.name}`)
      }
    },
    [savedProjects, state.adminRates, logChange]
  )

  const duplicateProject = useCallback(() => {
    setState((prev) => ({
      ...prev,
      header: {
        ...prev.header,
        projectName: `${prev.header.projectName} (Copy)`,
        estimateNo: '',
        date: todayISO(),
      },
    }))
    logChange('Duplicated project')
  }, [logChange])

  const deleteProject = useCallback((id: string) => {
    setSavedProjects((prev) => {
      const next = prev.filter((p) => p.id !== id)
      localStorage.setItem(PROJECTS_KEY, JSON.stringify(next))
      return next
    })
  }, [])

  const bulkPopulate = useCallback(
    (text: string, section: 'vrvOutdoor' | 'vrvIndoor') => {
      const lines = text.split('\n').filter(Boolean)
      setState((prev) => {
        const items = [...prev[section]]
        for (const line of lines) {
          const parts = line.trim().split(/[\s,]+/)
          const model = parts[0]
          const qty =
            parts.length > 1 && parts[1] !== '' ? parseQuantity(parts[1]) : 1
          const norm = model.toLowerCase().replace(/\s+/g, '')
          const idx = items.findIndex(
            (i) =>
              i.model.toLowerCase().replace(/\s+/g, '').includes(norm) ||
              norm.includes(i.model.toLowerCase().replace(/\s+/g, ''))
          )
          if (idx >= 0) {
            items[idx] = { ...items[idx], quantity: qty }
          }
        }
        const filled = applyAutoFill(section, items)
        return { ...prev, [section]: filled }
      })
      logChange(`Bulk populated ${section}`)
    },
    [applyAutoFill, logChange]
  )

  const resetEstimate = useCallback(() => {
    resetEstimateAnalyticsSession()
    setState({ ...createInitialState(), adminRates: state.adminRates })
    logChange('Reset estimate')
  }, [state.adminRates, logChange])

  const loadSampleEstimate = useCallback(() => {
    setState(buildSampleEstimateState({ ...createInitialState(), adminRates: state.adminRates }))
    logChange('Loaded sample estimate')
  }, [state.adminRates, logChange])

  const value: EstimateContextValue = {
    state,
    totals,
    activeSection,
    setActiveSection,
    updateHeader: (patch) => setState((p) => ({ ...p, header: { ...p.header, ...patch } })),
    updateLineItems,
    updateFreeText: (key, lines) => {
      setState((p) => ({ ...p, [key]: lines }))
      logChange(`Updated ${key}`)
    },
    updateState: (patch) => {
      setState((p) => ({ ...p, ...patch }))
      if (patch.adminRates) localStorage.setItem(ADMIN_KEY, JSON.stringify(patch.adminRates))
    },
    logChange,
    savedProjects,
    saveProject,
    loadProject,
    duplicateProject,
    deleteProject,
    bulkPopulate,
    resetEstimate,
    loadSampleEstimate,
    validation,
    showValidation,
    validateAndProceed,
  }

  return <EstimateContext.Provider value={value}>{children}</EstimateContext.Provider>
}

export function useEstimate() {
  const ctx = useContext(EstimateContext)
  if (!ctx) throw new Error('useEstimate must be used within EstimateProvider')
  return ctx
}
