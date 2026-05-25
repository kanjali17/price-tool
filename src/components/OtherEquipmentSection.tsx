import { useMemo, useState } from 'react'
import { STEEL_PIPE_SIZES } from '../data/equipmentData'
import { useEstimate } from '../context/EstimateContext'
import { matchesEquipmentSearch } from '../utils/equipmentSearch'
import { EquipmentSearchBar } from './EquipmentSearchBar'
import { EquipmentTable, FreeTextTable } from './EquipmentTable'

function countMatches(
  items: { model: string; description: string }[],
  query: string
): number {
  return items.filter((i) => matchesEquipmentSearch(i.model, i.description, query)).length
}

function countLabelMatches(items: { label: string }[], query: string): number {
  return items.filter((i) => matchesEquipmentSearch(i.label, i.label, query)).length
}

export function OtherEquipmentSection() {
  const { state, updateLineItems, updateFreeText, updateState } = useEstimate()
  const [search, setSearch] = useState('')

  const catalogSections = useMemo(
    () => [
      state.otherRtuDoas,
      state.otherSkyAir,
      state.otherMultiSplit,
      state.otherMiniSplit,
      state.otherZoning,
    ],
    [
      state.otherRtuDoas,
      state.otherSkyAir,
      state.otherMultiSplit,
      state.otherMiniSplit,
      state.otherZoning,
    ]
  )

  const freeTextSections = useMemo(
    () => [
      state.otherGeneralEquipment,
      state.otherSheetMetal,
      state.otherDrawingTime,
      state.otherPipingFreeText,
    ],
    [
      state.otherGeneralEquipment,
      state.otherSheetMetal,
      state.otherDrawingTime,
      state.otherPipingFreeText,
    ]
  )

  const totalCount =
    catalogSections.reduce((n, s) => n + s.length, 0) +
    freeTextSections.reduce((n, s) => n + s.length, 0)

  const matchCount = useMemo(() => {
    const q = search.trim()
    if (!q) return 0
    const catalog = catalogSections.reduce((n, s) => n + countMatches(s, q), 0)
    const free = freeTextSections.reduce((n, s) => n + countLabelMatches(s, q), 0)
    return catalog + free
  }, [catalogSections, freeTextSections, search])

  const searching = search.trim().length > 0

  return (
    <div>
      <EquipmentSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search RTU, SkyAir, splits, zoning, custom lines…"
        matchCount={searching ? matchCount : undefined}
        totalCount={searching ? totalCount : undefined}
      />

      {searching && matchCount === 0 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No equipment matches &ldquo;{search.trim()}&rdquo; on this page.
        </p>
      )}

      <EquipmentTable
        title="RTU / DOAS Units"
        items={state.otherRtuDoas}
        onChange={(items) => updateLineItems('otherRtuDoas', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="SkyAir"
        items={state.otherSkyAir}
        onChange={(items) => updateLineItems('otherSkyAir', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="Multi-Split"
        items={state.otherMultiSplit}
        onChange={(items) => updateLineItems('otherMultiSplit', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="Mini Splits"
        items={state.otherMiniSplit}
        onChange={(items) => updateLineItems('otherMiniSplit', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="Daikin Zoning Kits"
        items={state.otherZoning}
        onChange={(items) => updateLineItems('otherZoning', items)}
        searchQuery={search}
      />
      <FreeTextTable
        title="General Equipment"
        lines={state.otherGeneralEquipment}
        onChange={(lines) => updateFreeText('otherGeneralEquipment', lines)}
        searchQuery={search}
      />
      <FreeTextTable
        title="Sheet Metal"
        lines={state.otherSheetMetal}
        onChange={(lines) => updateFreeText('otherSheetMetal', lines)}
        searchQuery={search}
      />
      <FreeTextTable
        title="Drawing Time"
        lines={state.otherDrawingTime}
        onChange={(lines) => updateFreeText('otherDrawingTime', lines)}
        searchQuery={search}
      />
      <FreeTextTable
        title="Piping (Misc)"
        lines={state.otherPipingFreeText}
        onChange={(lines) => updateFreeText('otherPipingFreeText', lines)}
        searchQuery={search}
      />

      {!searching && (
        <div className="mb-6 rounded-lg border bg-white p-4">
          <h3 className="mb-3 font-semibold text-daikin-navy">Pipe Table (Steel/Gas/Copper — ft)</h3>
          <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
            {STEEL_PIPE_SIZES.map((size) => (
              <label key={size} className="flex items-center justify-between gap-2 text-sm">
                <span>{size}</span>
                <input
                  type="number"
                  min={0}
                  className="w-20 rounded border bg-daikin-input px-2 py-1 text-right"
                  value={state.otherPipeTable[size] || ''}
                  onChange={(e) =>
                    updateState({
                      otherPipeTable: {
                        ...state.otherPipeTable,
                        [size]: parseFloat(e.target.value) || 0,
                      },
                    })
                  }
                />
              </label>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
