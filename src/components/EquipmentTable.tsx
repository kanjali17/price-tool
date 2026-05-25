import { useEffect, useMemo, useState } from 'react'
import type { FreeTextLine, LineItem } from '../types'
import { formatCurrency, formatNumber, parseQuantity } from '../utils/calculations'
import { matchesEquipmentSearch, sortBySearchRelevance } from '../utils/equipmentSearch'

interface EquipmentTableProps {
  title: string
  items: LineItem[]
  onChange: (items: LineItem[]) => void
  collapsible?: boolean
  showBulkEntry?: boolean
  onBulkEntry?: (text: string) => void
  /** When set, only matching models are shown (best matches first). */
  searchQuery?: string
}

function EditableCell({
  value,
  onChange,
  type = 'number',
  className = '',
  quantityOnly = false,
}: {
  value: number
  onChange: (v: number) => void
  type?: 'number' | 'text'
  className?: string
  /** When true, only zero or positive values are accepted. */
  quantityOnly?: boolean
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(String(value))

  const commit = () => {
    let n = type === 'number' ? (quantityOnly ? parseQuantity(draft) : parseFloat(draft) || 0) : 0
    if (quantityOnly && n < 0) n = 0
    onChange(n)
    setEditing(false)
  }

  const handleDraftChange = (raw: string) => {
    if (quantityOnly && raw !== '' && raw !== '-' && /^-/.test(raw)) {
      return
    }
    setDraft(raw)
  }

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        min={quantityOnly ? 0 : undefined}
        step={quantityOnly ? 'any' : undefined}
        className={`w-full min-w-[4rem] rounded border border-daikin-navy bg-white px-2 py-1 text-right ${className}`}
        value={draft}
        onChange={(e) => handleDraftChange(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (quantityOnly && (e.key === '-' || e.key === 'e' || e.key === 'E')) {
            e.preventDefault()
            return
          }
          if (e.key === 'Enter') commit()
        }}
      />
    )
  }

  return (
    <button
      type="button"
      className={`w-full rounded px-2 py-1 text-right hover:bg-blue-100 ${className} ${value === 0 ? 'text-slate-400 italic' : ''}`}
      onClick={() => {
        setDraft(String(value))
        setEditing(true)
      }}
      title="Click to edit"
    >
      {type === 'number'
        ? value === 0
          ? '—'
          : value >= 100
            ? formatCurrency(value)
            : formatNumber(value, value % 1 ? 2 : 0)
        : draft}
    </button>
  )
}

export function EquipmentTable({
  title,
  items,
  onChange,
  collapsible = true,
  showBulkEntry = false,
  onBulkEntry,
  searchQuery = '',
}: EquipmentTableProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [bulkText, setBulkText] = useState('')
  const [hideUnused, setHideUnused] = useState(false)
  const searching = searchQuery.trim().length > 0

  useEffect(() => {
    if (searching) setCollapsed(false)
  }, [searching])

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    onChange(items.map((i) => (i.id === id ? { ...i, ...patch } : i)))
  }

  const searchMatches = useMemo(
    () =>
      searching
        ? items.filter((i) => matchesEquipmentSearch(i.model, i.description, searchQuery))
        : items,
    [items, searchQuery, searching]
  )

  const visibleItems = useMemo(() => {
    let list = searching ? searchMatches : items
    if (!searching && hideUnused) list = list.filter((i) => i.quantity > 0)
    if (searching) list = sortBySearchRelevance(list, searchQuery)
    return list
  }, [items, searchMatches, searchQuery, searching, hideUnused])

  const activeCount = items.filter((i) => i.quantity > 0).length

  if (searching && searchMatches.length === 0) {
    return null
  }

  const sectionTotal = items.reduce((s, i) => {
    const q = i.quantity || 0
    return s + i.equipmentCost * q
  }, 0)

  return (
    <div className="mb-6 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
      <button
        type="button"
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-3 text-left font-semibold text-daikin-navy"
        onClick={() => collapsible && setCollapsed(!collapsed)}
      >
        <span>{title}</span>
        <span className="flex flex-wrap items-center gap-2 text-sm font-normal text-slate-600">
          <span>
            {activeCount} line{activeCount !== 1 ? 's' : ''} · {formatCurrency(sectionTotal)}
          </span>
          {collapsible && <span>{collapsed ? '▼' : '▲'}</span>}
        </span>
      </button>

      {!collapsed && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-1.5">
            {searching && (
              <span className="text-xs text-daikin-navy">
                {searchMatches.length} match{searchMatches.length !== 1 ? 'es' : ''} in this section
              </span>
            )}
            {!searching && <span />}
            <label className="flex cursor-pointer items-center gap-2 text-xs text-slate-600">
              <input
                type="checkbox"
                checked={hideUnused}
                onChange={(e) => setHideUnused(e.target.checked)}
                disabled={searching}
                className="rounded border-slate-300"
              />
              Only rows with qty
            </label>
          </div>
          {showBulkEntry && onBulkEntry && (
            <div className="border-b border-slate-100 bg-blue-50/50 px-4 py-3">
              <p className="mb-2 text-xs text-slate-600">Quick entry: one model per line (model qty)</p>
              <textarea
                className="w-full rounded border border-blue-200 bg-white p-2 text-sm"
                rows={3}
                placeholder="RELQ72-120 2&#10;FXAQ07-15 4"
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
              />
              <button
                type="button"
                className="mt-2 rounded bg-daikin-navy px-3 py-1 text-sm text-white hover:bg-daikin-slate"
                onClick={() => {
                  onBulkEntry(bulkText)
                  setBulkText('')
                }}
              >
                Apply Bulk Entry
              </button>
            </div>
          )}
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-sm">
              <thead>
                <tr className="border-b bg-slate-100 text-left text-xs uppercase text-slate-600">
                  <th className="px-3 py-2">Model #</th>
                  <th className="px-3 py-2">Description</th>
                  <th className="bg-daikin-input/30 px-3 py-2 text-right">Qty</th>
                  <th className="bg-daikin-input/30 px-3 py-2 text-right">Equipment $</th>
                  <th className="px-3 py-2 text-right">SM Hrs</th>
                  <th className="px-3 py-2 text-right">SM Matls</th>
                  <th className="px-3 py-2 text-right">Pipe Hrs</th>
                  <th className="px-3 py-2 text-right">Pipe Matls</th>
                </tr>
              </thead>
              <tbody>
                {visibleItems.length === 0 && (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-sm text-slate-500">
                      {searching
                        ? 'No models match this search in this table.'
                        : 'No rows with quantity yet. Uncheck the filter above or enter a qty on a model.'}
                    </td>
                  </tr>
                )}
                {visibleItems.map((item) => {
                  const inactive = !item.quantity
                  const highlight = searching
                  return (
                    <tr
                      key={item.id}
                      className={`border-b ${
                        highlight
                          ? 'bg-amber-50/80 hover:bg-amber-50'
                          : inactive
                            ? 'bg-slate-50 text-slate-400'
                            : 'hover:bg-slate-50'
                      }`}
                      title={item.tooltip}
                    >
                      <td className="px-3 py-2 font-mono text-xs font-medium text-daikin-navy">
                        {item.model}
                      </td>
                      <td className="max-w-[200px] px-3 py-2">{item.description}</td>
                      <td className="bg-daikin-input/40 px-1 py-1">
                        <EditableCell
                          value={item.quantity}
                          onChange={(v) => updateItem(item.id, { quantity: v })}
                          className="font-semibold text-daikin-navy"
                          quantityOnly
                        />
                      </td>
                      <td className="bg-daikin-input/40 px-1 py-1">
                        <EditableCell
                          value={item.equipmentCost}
                          onChange={(v) => updateItem(item.id, { equipmentCost: v })}
                        />
                      </td>
                      <td className="bg-slate-50 px-1 py-1 text-right text-slate-600">
                        {formatNumber(item.sheetMetalHours * (item.quantity || 0), 1)}
                      </td>
                      <td className="bg-slate-50 px-1 py-1 text-right text-slate-600">
                        {formatCurrency(item.sheetMetalMaterials * (item.quantity || 0))}
                      </td>
                      <td className="bg-slate-50 px-1 py-1 text-right text-slate-600">
                        {formatNumber(item.pipingHours * (item.quantity || 0), 1)}
                      </td>
                      <td className="bg-slate-50 px-1 py-1 text-right text-slate-600">
                        {formatCurrency(item.pipingMaterials * (item.quantity || 0))}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

interface FreeTextTableProps {
  title: string
  lines: FreeTextLine[]
  onChange: (lines: FreeTextLine[]) => void
  searchQuery?: string
}

export function FreeTextTable({ title, lines, onChange, searchQuery = '' }: FreeTextTableProps) {
  const [collapsed, setCollapsed] = useState(true)
  const searching = searchQuery.trim().length > 0

  const visibleLines = useMemo(() => {
    if (!searching) return lines
    return lines.filter((l) => matchesEquipmentSearch(l.label, l.label, searchQuery))
  }, [lines, searchQuery, searching])

  useEffect(() => {
    if (searching && visibleLines.length > 0) setCollapsed(false)
  }, [searching, visibleLines.length])

  const updateLine = (id: string, patch: Partial<FreeTextLine>) => {
    onChange(lines.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  if (searching && visibleLines.length === 0) {
    return null
  }

  return (
    <div className="mb-4 overflow-hidden rounded-lg border border-slate-200 bg-white">
      <button
        type="button"
        className="flex w-full items-center justify-between bg-slate-50 px-4 py-2 text-left text-sm font-semibold text-daikin-navy"
        onClick={() => setCollapsed(!collapsed)}
      >
        {title}
        <span>{collapsed ? '▼' : '▲'}</span>
      </button>
      {!collapsed && (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-slate-100 text-xs text-slate-600">
              <th className="px-3 py-2 text-left">Item</th>
              <th className="px-3 py-2 text-right">Qty/Ft</th>
              <th className="px-3 py-2 text-right">Equipment $</th>
              <th className="px-3 py-2 text-right">SM Hrs</th>
              <th className="px-3 py-2 text-right">SM Matls</th>
              <th className="px-3 py-2 text-right">Pipe Hrs</th>
              <th className="px-3 py-2 text-right">Pipe Matls</th>
            </tr>
          </thead>
          <tbody>
            {visibleLines.map((line) => (
              <tr key={line.id} className={`border-b ${!line.quantity ? 'text-slate-400' : ''}`}>
                <td className="px-3 py-2">{line.label}</td>
                <td className="bg-daikin-input/40 px-1">
                  <EditableCell
                    value={line.quantity}
                    onChange={(v) => updateLine(line.id, { quantity: v })}
                    quantityOnly
                  />
                </td>
                <td className="bg-daikin-input/40 px-1">
                  <EditableCell value={line.equipmentCost} onChange={(v) => updateLine(line.id, { equipmentCost: v })} />
                </td>
                <td className="bg-daikin-input/40 px-1">
                  <EditableCell value={line.sheetMetalHours} onChange={(v) => updateLine(line.id, { sheetMetalHours: v })} />
                </td>
                <td className="bg-daikin-input/40 px-1">
                  <EditableCell value={line.sheetMetalMaterials} onChange={(v) => updateLine(line.id, { sheetMetalMaterials: v })} />
                </td>
                <td className="bg-daikin-input/40 px-1">
                  <EditableCell value={line.pipingHours} onChange={(v) => updateLine(line.id, { pipingHours: v })} />
                </td>
                <td className="bg-daikin-input/40 px-1">
                  <EditableCell value={line.pipingMaterials} onChange={(v) => updateLine(line.id, { pipingMaterials: v })} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
