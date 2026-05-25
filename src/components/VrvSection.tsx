import { useMemo, useState } from 'react'
import { useEstimate } from '../context/EstimateContext'
import { matchesEquipmentSearch } from '../utils/equipmentSearch'
import { EquipmentSearchBar } from './EquipmentSearchBar'
import { EquipmentTable } from './EquipmentTable'

function countMatches(
  items: { model: string; description: string }[],
  query: string
): number {
  return items.filter((i) => matchesEquipmentSearch(i.model, i.description, query)).length
}

export function VrvSection() {
  const { state, updateLineItems, bulkPopulate } = useEstimate()
  const [search, setSearch] = useState('')

  const catalogSections = useMemo(
    () => [
      state.vrvOutdoor,
      state.vrvBranchSelector,
      state.vrvIndoor,
      state.vrvRefnet,
      state.vrvRefrigerant,
      state.vrvControllers,
    ],
    [
      state.vrvOutdoor,
      state.vrvBranchSelector,
      state.vrvIndoor,
      state.vrvRefnet,
      state.vrvRefrigerant,
      state.vrvControllers,
    ]
  )

  const totalCount = catalogSections.reduce((n, s) => n + s.length, 0)
  const matchCount = useMemo(() => {
    const q = search.trim()
    if (!q) return 0
    return catalogSections.reduce((n, s) => n + countMatches(s, q), 0)
  }, [catalogSections, search])

  const searching = search.trim().length > 0

  return (
    <div>
      <EquipmentSearchBar
        value={search}
        onChange={setSearch}
        placeholder="Search VRV models (e.g. RELQ, FXAQ, KHRP)…"
        matchCount={searching ? matchCount : undefined}
        totalCount={searching ? totalCount : undefined}
      />

      {searching && matchCount === 0 && (
        <p className="mb-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          No VRV models match &ldquo;{search.trim()}&rdquo;. Try fewer characters or check spelling
          (spaces and dashes are ignored).
        </p>
      )}

      <EquipmentTable
        title="VRV Outdoor Units"
        items={state.vrvOutdoor}
        onChange={(items) => updateLineItems('vrvOutdoor', items)}
        showBulkEntry={!searching}
        onBulkEntry={(text) => bulkPopulate(text, 'vrvOutdoor')}
        searchQuery={search}
      />
      <EquipmentTable
        title="Branch Selector Units"
        items={state.vrvBranchSelector}
        onChange={(items) => updateLineItems('vrvBranchSelector', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="VRV Indoor Fan Coil Units"
        items={state.vrvIndoor}
        onChange={(items) => updateLineItems('vrvIndoor', items)}
        showBulkEntry={!searching}
        onBulkEntry={(text) => bulkPopulate(text, 'vrvIndoor')}
        searchQuery={search}
      />
      <EquipmentTable
        title="REFNET Joints"
        items={state.vrvRefnet}
        onChange={(items) => updateLineItems('vrvRefnet', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="Refrigerant"
        items={state.vrvRefrigerant}
        onChange={(items) => updateLineItems('vrvRefrigerant', items)}
        searchQuery={search}
      />
      <EquipmentTable
        title="Controllers"
        items={state.vrvControllers}
        onChange={(items) => updateLineItems('vrvControllers', items)}
        searchQuery={search}
      />
    </div>
  )
}
