"use client"

import { useState, useEffect, useRef, useMemo, useCallback } from "react"
import { Search, Clock, Filter, X, Bookmark, Folder, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { cn } from "@/lib/utils"
import {
  filterBookmarks,
  parseSearchQuery,
  DEFAULT_SEARCH_FILTERS,
  type SearchFilters,
} from "@/lib/search-utils"

interface EnhancedSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  filters?: SearchFilters
  onFiltersChange?: (filters: SearchFilters) => void
  className?: string
}

interface SearchHistory {
  query: string
  timestamp: Date
  resultCount: number
}

interface SuggestionItem {
  text: string
  type: 'category' | 'subcategory' | 'title' | 'tag'
}

export function EnhancedSearch({
  searchQuery,
  onSearchChange,
  filters: controlledFilters,
  onFiltersChange,
  className,
}: EnhancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [internalFilters, setInternalFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS)
  const filters = controlledFilters ?? internalFilters
  const updateFilters = useCallback(
    (updater: (prev: SearchFilters) => SearchFilters) => {
      const next = updater(filters)
      if (onFiltersChange) onFiltersChange(next)
      else setInternalFilters(next)
    },
    [filters, onFiltersChange]
  )

  const [showSuggestions, setShowSuggestions] = useState(false)
  const [localQuery, setLocalQuery] = useState(searchQuery)
  const [activeIndex, setActiveIndex] = useState(-1)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const blurTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { categories, bookmarks } = useBookmarkStore()

  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  useEffect(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      onSearchChange(localQuery)
    }, 150)
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    }
  }, [localQuery, onSearchChange])

  useEffect(() => {
    if (typeof window === 'undefined') return
    const saved = localStorage.getItem('search-history')
    if (!saved) return
    try {
      const parsed = JSON.parse(saved).map((item: any) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }))
      setSearchHistory(parsed.slice(0, 10))
    } catch (error) {
      console.error('Failed to load search history:', error)
    }
  }, [])

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const isMod = e.ctrlKey || e.metaKey
      if (isMod && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault()
        inputRef.current?.focus()
        inputRef.current?.select()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  const saveSearchHistory = useCallback(
    (query: string, resultCount: number) => {
      const trimmed = query.trim()
      if (!trimmed || typeof window === 'undefined') return
      setSearchHistory(prev => {
        const next = [
          { query: trimmed, timestamp: new Date(), resultCount },
          ...prev.filter(item => item.query !== trimmed),
        ].slice(0, 10)
        localStorage.setItem('search-history', JSON.stringify(next))
        return next
      })
    },
    []
  )

  const suggestions = useMemo<SuggestionItem[]>(() => {
    const { query: stripped } = parseSearchQuery(localQuery)
    if (!stripped || stripped.length < 2) return []

    const seen = new Set<string>()
    const list: SuggestionItem[] = []
    const maxSuggestions = 5

    for (const category of categories) {
      if (list.length >= maxSuggestions) break
      if (category.name.toLowerCase().includes(stripped) && !seen.has(category.name)) {
        list.push({ text: category.name, type: 'category' })
        seen.add(category.name)
      }
      for (const sub of category.subCategories) {
        if (list.length >= maxSuggestions) break
        if (sub.name.toLowerCase().includes(stripped) && !seen.has(sub.name)) {
          list.push({ text: sub.name, type: 'subcategory' })
          seen.add(sub.name)
        }
      }
    }

    if (list.length < maxSuggestions) {
      for (const bookmark of bookmarks) {
        if (list.length >= maxSuggestions) break
        const tags: string[] = Array.isArray(bookmark.tags) ? bookmark.tags : []
        for (const tag of tags) {
          if (list.length >= maxSuggestions) break
          if ((tag || '').toLowerCase().includes(stripped) && !seen.has(tag)) {
            list.push({ text: tag, type: 'tag' })
            seen.add(tag)
          }
        }
      }
    }

    if (list.length < maxSuggestions) {
      for (const bookmark of bookmarks) {
        if (list.length >= maxSuggestions) break
        const title = (bookmark.title || '').toLowerCase()
        if (title.includes(stripped) && !seen.has(bookmark.title)) {
          if (title !== stripped && (bookmark.title || '').length <= 50) {
            list.push({ text: bookmark.title, type: 'title' })
            seen.add(bookmark.title)
          }
        }
      }
    }

    return list.slice(0, maxSuggestions)
  }, [localQuery, bookmarks, categories])

  const showHistoryList = isExpanded && searchHistory.length > 0 && !localQuery.trim()
  const activeList: Array<{ kind: 'suggestion'; item: SuggestionItem } | { kind: 'history'; item: SearchHistory }> = useMemo(() => {
    if (showSuggestions && suggestions.length > 0) {
      return suggestions.map(s => ({ kind: 'suggestion' as const, item: s }))
    }
    if (showHistoryList) {
      return searchHistory.map(h => ({ kind: 'history' as const, item: h }))
    }
    return []
  }, [showSuggestions, suggestions, showHistoryList, searchHistory])

  useEffect(() => {
    setActiveIndex(-1)
  }, [localQuery, showSuggestions, isExpanded])

  useEffect(() => {
    if (localQuery.trim() && suggestions.length > 0) setShowSuggestions(true)
    else if (!localQuery.trim()) setShowSuggestions(false)
  }, [localQuery, suggestions])

  const commitQuery = useCallback(
    (query: string) => {
      const trimmed = query.trim()
      setLocalQuery(query)
      onSearchChange(query)
      setShowSuggestions(false)
      if (trimmed) {
        const count = filterBookmarks(bookmarks, categories, query, filters).length
        saveSearchHistory(trimmed, count)
      }
    },
    [onSearchChange, bookmarks, categories, filters, saveSearchHistory]
  )

  const handleClearSearch = useCallback(() => {
    setLocalQuery("")
    setShowSuggestions(false)
    onSearchChange("")
  }, [onSearchChange])

  const handleSelectSuggestion = useCallback(
    (s: SuggestionItem) => {
      const fill = s.type === 'tag' ? `#${s.text}` : s.text
      commitQuery(fill)
    },
    [commitQuery]
  )

  const clearSearchHistory = () => {
    setSearchHistory([])
    if (typeof window !== 'undefined') localStorage.removeItem('search-history')
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (activeList.length > 0 && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
      e.preventDefault()
      setActiveIndex(prev => {
        const len = activeList.length
        if (e.key === 'ArrowDown') return prev + 1 >= len ? 0 : prev + 1
        return prev <= 0 ? len - 1 : prev - 1
      })
      return
    }
    if (e.key === 'Enter') {
      if (activeIndex >= 0 && activeIndex < activeList.length) {
        e.preventDefault()
        const picked = activeList[activeIndex]
        if (picked.kind === 'suggestion') handleSelectSuggestion(picked.item)
        else commitQuery(picked.item.query)
        return
      }
      commitQuery(localQuery)
      return
    }
    if (e.key === 'Escape') {
      setShowSuggestions(false)
      setActiveIndex(-1)
    }
  }

  const activeFilterCount = filters.categories.length + (filters.hasDescription ? 1 : 0)

  return (
    <div className={cn("relative flex-1 max-w-lg mx-4 sm:mx-8", className)}>
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          data-search-input
          placeholder="搜索书签、分类... (Ctrl+K)"
          value={localQuery}
          onChange={(e) => setLocalQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
            setIsExpanded(true)
            if (localQuery.trim()) setShowSuggestions(suggestions.length > 0)
          }}
          onBlur={() => {
            if (blurTimerRef.current) clearTimeout(blurTimerRef.current)
            blurTimerRef.current = setTimeout(() => {
              setIsExpanded(false)
              setShowSuggestions(false)
            }, 200)
          }}
          role="combobox"
          aria-expanded={activeList.length > 0}
          aria-controls="search-dropdown"
          aria-activedescendant={activeIndex >= 0 ? `search-option-${activeIndex}` : undefined}
          aria-autocomplete="list"
          className="pl-10 sm:pl-11 pr-20 sm:pr-24 h-9 sm:h-10 bg-muted/50 border-border/50 rounded-full focus:bg-background focus:border-primary/50 transition-all duration-200"
        />

        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {localQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleClearSearch}
              aria-label="清除搜索"
            >
              <X className="h-3 w-3" />
            </Button>
          )}

          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted relative"
                aria-label="搜索过滤器"
              >
                <Filter className="h-3 w-3" />
                {activeFilterCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-3.5 min-w-3.5 px-1 rounded-full bg-primary text-primary-foreground text-[9px] font-medium flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="font-medium">搜索过滤器</h4>
                  {activeFilterCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-auto p-0 text-xs text-muted-foreground"
                      onClick={() => updateFilters(() => DEFAULT_SEARCH_FILTERS)}
                    >
                      重置
                    </Button>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">分类</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Badge
                        key={category.id}
                        variant={filters.categories.includes(category.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() =>
                          updateFilters(prev => ({
                            ...prev,
                            categories: prev.categories.includes(category.id)
                              ? prev.categories.filter(id => id !== category.id)
                              : [...prev.categories, category.id],
                          }))
                        }
                      >
                        {category.name}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hasDescription"
                    checked={filters.hasDescription}
                    onCheckedChange={(checked) =>
                      updateFilters(prev => ({ ...prev, hasDescription: !!checked }))
                    }
                  />
                  <label htmlFor="hasDescription" className="text-sm">
                    仅显示有描述的书签
                  </label>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      {(showSuggestions || showHistoryList) && (
        <div
          id="search-dropdown"
          role="listbox"
          className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto"
        >
          {showSuggestions && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">建议</div>
              {suggestions.map((s, index) => (
                <button
                  key={index}
                  id={`search-option-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    activeIndex === index ? "bg-accent" : "hover:bg-accent"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => handleSelectSuggestion(s)}
                >
                  {s.type === 'tag' ? (
                    <Tag className="inline w-3 h-3 mr-2 text-purple-500" />
                  ) : s.type === 'title' ? (
                    <Bookmark className="inline w-3 h-3 mr-2 text-blue-500" />
                  ) : (
                    <Folder className="inline w-3 h-3 mr-2 text-muted-foreground" />
                  )}
                  {s.type === 'tag' ? `#${s.text}` : s.text}
                </button>
              ))}
            </div>
          )}

          {showHistoryList && (
            <div className="p-2 border-t border-border">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="text-xs font-medium text-muted-foreground">搜索历史</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={clearSearchHistory}
                >
                  清除
                </Button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  id={`search-option-${index}`}
                  role="option"
                  aria-selected={activeIndex === index}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm rounded-md transition-colors",
                    activeIndex === index ? "bg-accent" : "hover:bg-accent"
                  )}
                  onMouseEnter={() => setActiveIndex(index)}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => commitQuery(item.query)}
                >
                  <Clock className="inline w-3 h-3 mr-2 text-muted-foreground" />
                  <span>{item.query}</span>
                  <span className="text-xs text-muted-foreground ml-2">
                    ({item.resultCount} 个结果)
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
