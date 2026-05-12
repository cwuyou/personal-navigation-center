export interface SearchFilters {
  categories: string[]
  hasDescription: boolean
}

export const DEFAULT_SEARCH_FILTERS: SearchFilters = {
  categories: [],
  hasDescription: false,
}

export function parseSearchQuery(raw: string): { query: string; tagOnly: boolean } {
  const trimmed = raw.trim()
  if (!trimmed) return { query: '', tagOnly: false }
  if (trimmed.toLowerCase().startsWith('tag:')) {
    return { query: trimmed.slice(4).toLowerCase(), tagOnly: true }
  }
  if (trimmed.startsWith('#')) {
    return { query: trimmed.slice(1).toLowerCase(), tagOnly: true }
  }
  return { query: trimmed.toLowerCase(), tagOnly: false }
}

export function filterBookmarks<
  B extends {
    title?: string
    description?: string
    url?: string
    tags?: string[]
    subCategoryId: string
  },
  C extends { id: string; subCategories: { id: string }[] }
>(
  bookmarks: B[],
  categories: C[],
  rawQuery: string,
  filters: SearchFilters = DEFAULT_SEARCH_FILTERS
): B[] {
  const { query, tagOnly } = parseSearchQuery(rawQuery)
  if (!query) return []

  const allowedSubIds = filters.categories.length > 0
    ? new Set(
        categories
          .filter(c => filters.categories.includes(c.id))
          .flatMap(c => c.subCategories.map(s => s.id))
      )
    : null

  return bookmarks.filter(b => {
    if (allowedSubIds && !allowedSubIds.has(b.subCategoryId)) return false
    if (filters.hasDescription && !(b.description && b.description.trim())) return false

    const tagsMatch = Array.isArray(b.tags)
      ? b.tags.some(t => (t || '').toLowerCase().includes(query))
      : false

    if (tagOnly) return tagsMatch

    return (
      (b.title || '').toLowerCase().includes(query) ||
      (b.description || '').toLowerCase().includes(query) ||
      (b.url || '').toLowerCase().includes(query) ||
      tagsMatch
    )
  })
}

export function filterCategories<
  C extends { name: string; subCategories: { name: string }[] }
>(categories: C[], rawQuery: string): C[] {
  const { query, tagOnly } = parseSearchQuery(rawQuery)
  if (!query || tagOnly) return []
  return categories.filter(c =>
    c.name.toLowerCase().includes(query) ||
    c.subCategories.some(s => s.name.toLowerCase().includes(query))
  )
}
