/** Normalize for fuzzy model lookup (ignores spaces, dashes, case). */
export function normalizeSearchText(text: string): string {
  return text.toLowerCase().replace(/[\s\-_/]+/g, '')
}

export function matchesEquipmentSearch(
  model: string,
  description: string,
  query: string
): boolean {
  const q = normalizeSearchText(query.trim())
  if (!q) return true
  const m = normalizeSearchText(model)
  const d = normalizeSearchText(description)
  return m.includes(q) || d.includes(q) || q.includes(m)
}

/** Best matches first when filtering a catalog list. */
export function searchRank(model: string, description: string, query: string): number {
  const q = normalizeSearchText(query.trim())
  if (!q) return 0
  const m = normalizeSearchText(model)
  const d = normalizeSearchText(description)
  if (m === q) return 0
  if (m.startsWith(q)) return 1
  if (m.includes(q)) return 2
  if (d.includes(q)) return 3
  if (q.includes(m)) return 4
  return 99
}

export function sortBySearchRelevance<T extends { model: string; description: string }>(
  items: T[],
  query: string
): T[] {
  const q = query.trim()
  if (!q) return items
  return [...items].sort(
    (a, b) =>
      searchRank(a.model, a.description, q) - searchRank(b.model, b.description, q) ||
      a.model.localeCompare(b.model)
  )
}
