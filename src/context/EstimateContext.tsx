import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
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
import { setAnalyticsEstimateContext, track } from '../analytics/amplitude'
import { ANALYTICS_EVENTS } from '../analytics/events'
import {
  autoFillLineItems,
  calculateTotals,
  countActiveEquipmentLines,
  deriveControlsWiringQuantities,
  parseQuantity,
  type EquipmentLineKey,
} from '../utils/calculations'

const STORAGE_KEY = 'daikin-estimate-current'
const PROJECTS_KEY = 'daikin-estimate-projects'
const ADMIN_KEY = 'daikin-estimate-admin'
const SAVE_DEBOUNCE_MS = 2000

export function createEstimateId(): string {
  return crypto.randomUUID().replace(/-/g, '').slice(0, 8)
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10)
}

export function createInitialState(): EstimateState {
  return {
    estimateId: createEstimateId(),
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
  hasUnsavedChanges: boolean
  saveToLocalStorage: () => void
  activeSection: SectionId
  setActiveSection: (s: SectionId) => void
  updateHeader: (patch: Partial<EstimateState['header']>) => void
  updateLineItems: (key: keyof Pick<EstimateState, 'vrvOutdoor' | 'vrvBranchSelector' | 'vrvIndoor' | 'vrvRefnet' | 'vrvRefrigerant' | 'vrvControllers' | 'otherRtuDoas' | 'otherSkyAir' | 'otherMultiSplit' | 'otherMiniSplit' | 'otherZoning'>, items: LineItem[]) => void
  updateFreeText: (key: keyof Pick<EstimateState, 'otherGeneralEquipment' | 'otherSheetMetal' | 'otherDrawingTime' | 'otherPipingFreeText'>, lines: FreeTextLine[]) => void
  updateState: (patch: Partial<EstimateState>) => void
  logChange: (message: string, previousValue?: string) => void
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
        return {
          ...createInitialState(),
          ...parsed,
          estimateId: parsed.estimateId || createEstimateId(),
          adminRates: admin,
        }
      }
    } catch {
      /* ignore */
    }
    return buildSampleEstimateState({ ...createInitialState(), adminRates: admin })
  })

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const lastSavedRef = useRef('')
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const hydratedRef = useRef(false)
  const equipmentTrackTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const persistState = useCallback((next: EstimateState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    lastSavedRef.current = JSON.stringify(next)
    setHasUnsavedChanges(false)
  }, [])

  const logChange = useCallback((message: string, previousValue?: string) => {
    const entry =
      previousValue !== undefined ? `${message} (was: ${previousValue})` : message
    setState((prev) => ({
      ...prev,
      changeLog: [
        { timestamp: new Date().toISOString(), message: entry },
        ...prev.changeLog.slice(0, 99),
      ],
    }))
  }, [])

  useEffect(() => {
    if (!hydratedRef.current) {
      hydratedRef.current = true
      lastSavedRef.current = JSON.stringify(state)
      return
    }
    const serialized = JSON.stringify(state)
    if (serialized === lastSavedRef.current) return
    setHasUnsavedChanges(true)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      persistState(state)
      saveTimerRef.current = null
    }, SAVE_DEBOUNCE_MS)
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [state, persistState])

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROJECTS_KEY)
      if (raw) setSavedProjects(JSON.parse(raw))
    } catch {
      /* ignore */
    }
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
      for (const item of filled) {
        const prevItem = state[key].find((i) => i.id === item.id)
        if (!prevItem || prevItem.quantity === item.quantity) continue
        const timerKey = `${key}-${item.id}`
        if (equipmentTrackTimers.current[timerKey]) {
          clearTimeout(equipmentTrackTimers.current[timerKey])
        }
        equipmentTrackTimers.current[timerKey] = setTimeout(() => {
          track(ANALYTICS_EVENTS.equipment_quantity_changed, {
            model: item.model.slice(0, 32),
            new_qty: item.quantity || 0,
            row_total: item.equipmentCost * (item.quantity || 0),
          })
          delete equipmentTrackTimers.current[timerKey]
        }, 1500)
      }
      setState((prev) => {
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
    [applyAutoFill, logChange, state]
  )

  const totals = useMemo(() => calculateTotals(state), [state])

  const saveToLocalStorage = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current)
      saveTimerRef.current = null
    }
    persistState(state)
    logChange('Saved estimate to browser storage')
    track(ANALYTICS_EVENTS.estimate_saved, {
      total: totals.totalInstallCost,
      section_count: 6,
      equipment_line_items: countActiveEquipmentLines(state),
    })
  }, [persistState, state, logChange, totals.totalInstallCost])

  useEffect(() => {
    setAnalyticsEstimateContext(state.estimateId, totals.totalInstallCost)
  }, [state.estimateId, totals.totalInstallCost])

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
    [state]
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
    hasUnsavedChanges,
    saveToLocalStorage,
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
