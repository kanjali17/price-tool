interface EquipmentSearchBarProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  matchCount?: number
  totalCount?: number
}

export function EquipmentSearchBar({
  value,
  onChange,
  placeholder = 'Search model or description…',
  matchCount,
  totalCount,
}: EquipmentSearchBarProps) {
  const hasQuery = value.trim().length > 0
  const showCount = hasQuery && matchCount !== undefined && totalCount !== undefined

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
      <label className="sr-only" htmlFor="equipment-model-search">
        Search equipment models
      </label>
      <span className="text-slate-400" aria-hidden>
        ⌕
      </span>
      <input
        id="equipment-model-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-[12rem] flex-1 rounded border-0 bg-transparent py-1.5 text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-0"
        autoComplete="off"
        spellCheck={false}
      />
      {showCount && (
        <span className="text-xs text-slate-500">
          {matchCount} of {totalCount} models
        </span>
      )}
      {hasQuery && (
        <button
          type="button"
          className="rounded px-2 py-1 text-xs text-slate-600 hover:bg-slate-100"
          onClick={() => onChange('')}
        >
          Clear
        </button>
      )}
    </div>
  )
}
