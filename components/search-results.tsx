"use client"

import { useMemo, useCallback } from "react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { EnhancedBookmarkCard } from "@/components/enhanced-bookmark-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"
import {
  filterBookmarks,
  filterCategories,
  parseSearchQuery,
  DEFAULT_SEARCH_FILTERS,
  type SearchFilters,
} from "@/lib/search-utils"

interface SearchResultsProps {
  searchQuery: string
  filters?: SearchFilters
  onPreview?: (bookmark: any) => void
  onCategorySelect?: (categoryId: string) => void
}

export function SearchResults({
  searchQuery,
  filters = DEFAULT_SEARCH_FILTERS,
  onPreview,
  onCategorySelect,
}: SearchResultsProps) {
  const { categories, bookmarks } = useBookmarkStore()

  const matchedCategories = useMemo(
    () => filterCategories(categories, searchQuery),
    [categories, searchQuery]
  )

  const matchedBookmarks = useMemo(
    () => filterBookmarks(bookmarks, categories, searchQuery, filters),
    [bookmarks, categories, searchQuery, filters]
  )

  const categoryPathMap = useMemo(() => {
    const pathMap = new Map<string, string>()
    categories.forEach(category => {
      category.subCategories.forEach((sub: any) => {
        pathMap.set(sub.id, `${category.name} > ${sub.name}`)
      })
    })
    return pathMap
  }, [categories])

  const getCategoryPath = useCallback(
    (subCategoryId: string) => categoryPathMap.get(subCategoryId) || "",
    [categoryPathMap]
  )

  const { query: normalizedQuery, tagOnly } = parseSearchQuery(searchQuery)

  const getHitSources = useCallback(
    (b: any): string[] => {
      const q = normalizedQuery
      if (!q) return []
      if (tagOnly) return ['标签']
      const sources: string[] = []
      if ((b.title || '').toLowerCase().includes(q)) sources.push('标题')
      if ((b.description || '').toLowerCase().includes(q)) sources.push('描述')
      if ((b.url || '').toLowerCase().includes(q)) sources.push('URL')
      if (Array.isArray(b.tags) && b.tags.some((t: string) => (t || '').toLowerCase().includes(q))) {
        sources.push('标签')
      }
      return sources
    },
    [normalizedQuery, tagOnly]
  )

  const handleExportSearch = () => {
    const subIdSet = new Set(matchedBookmarks.map(b => b.subCategoryId))
    const trimmedCategories = categories
      .map(cat => {
        const subs = (cat.subCategories || []).filter((s: any) => subIdSet.has(s.id))
        return subs.length > 0 ? { ...cat, subCategories: subs } : null
      })
      .filter(Boolean) as any
    const data = { categories: trimmedCategories, bookmarks: matchedBookmarks }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-search-${new Date().toISOString().slice(0, 10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const sourceBadgeClass: Record<string, string> = {
    '标题': 'bg-blue-500 text-white',
    '描述': 'bg-green-500 text-white',
    'URL': 'bg-amber-500 text-white',
    '标签': 'bg-purple-500 text-white',
  }

  const hasActiveFilters = filters.categories.length > 0 || filters.hasDescription

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">搜索结果</h1>
            <p className="text-muted-foreground">
              找到 {matchedCategories.length} 个分类和 {matchedBookmarks.length} 个书签
              {hasActiveFilters && (
                <span className="ml-2 text-xs">（已应用过滤器）</span>
              )}
            </p>
          </div>
          {matchedBookmarks.length > 0 && (
            <Button variant="outline" onClick={handleExportSearch} title="导出搜索结果">
              <Download className="w-4 h-4 mr-2" /> 导出搜索结果
            </Button>
          )}
        </div>
      </div>

      {matchedCategories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">匹配的分类</h2>
          <div className="flex flex-wrap gap-2">
            {matchedCategories.map(category => (
              <Badge
                key={category.id}
                variant="outline"
                className="px-3 py-1 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => onCategorySelect?.(category.id)}
                role={onCategorySelect ? 'button' : undefined}
                tabIndex={onCategorySelect ? 0 : undefined}
                onKeyDown={(e) => {
                  if (onCategorySelect && (e.key === 'Enter' || e.key === ' ')) {
                    e.preventDefault()
                    onCategorySelect(category.id)
                  }
                }}
              >
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {matchedBookmarks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">匹配的书签</h2>
          <div className="bookmark-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {matchedBookmarks.map(bookmark => {
              const sources = getHitSources(bookmark)
              return (
                <div key={bookmark.id} className="space-y-1.5">
                  <EnhancedBookmarkCard bookmark={bookmark} onPreview={onPreview} />
                  <div className="flex items-center gap-2 px-1 flex-wrap">
                    <span className="text-[11px] text-muted-foreground truncate">
                      {getCategoryPath(bookmark.subCategoryId)}
                    </span>
                    {sources.map(s => (
                      <Badge
                        key={s}
                        className={`${sourceBadgeClass[s]} text-[10px] px-1.5 py-0 h-4`}
                      >
                        {s}
                      </Badge>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {matchedCategories.length === 0 && matchedBookmarks.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">
          <p>没有找到匹配的结果</p>
          <p className="text-sm mt-2">
            {hasActiveFilters
              ? '尝试清除过滤器或使用不同的关键词'
              : '尝试使用不同的关键词搜索'}
          </p>
        </div>
      )}
    </div>
  )
}
