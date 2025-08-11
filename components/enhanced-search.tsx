"use client"

import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react"
import { Search, Clock, Filter, X, Bookmark, Folder, Tag } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Checkbox } from "@/components/ui/checkbox"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { cn } from "@/lib/utils"

interface EnhancedSearchProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  className?: string
}

interface SearchHistory {
  query: string
  timestamp: Date
  resultCount: number
}

interface SearchFilters {
  categories: string[]
  hasDescription: boolean
  dateRange: 'all' | 'week' | 'month' | 'year'
}

export function EnhancedSearch({ searchQuery, onSearchChange, className }: EnhancedSearchProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [searchHistory, setSearchHistory] = useState<SearchHistory[]>([])
  const [filters, setFilters] = useState<SearchFilters>({
    categories: [],
    hasDescription: false,
    dateRange: 'all'
  })
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery)
  const [localQuery, setLocalQuery] = useState(searchQuery)

  const inputRef = useRef<HTMLInputElement>(null)
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const lastUpdateRef = useRef<number>(0)
  const { categories, bookmarks } = useBookmarkStore()

  // 同步外部 searchQuery 变化
  useEffect(() => {
    setLocalQuery(searchQuery)
  }, [searchQuery])

  // 防抖处理本地查询并通知父组件
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedQuery(localQuery)
      onSearchChange(localQuery)
    }, 150) // 150ms 防抖延迟 - 更快响应

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
      }
    }
  }, [localQuery, onSearchChange])

  // 加载搜索历史
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem('search-history')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setSearchHistory(parsed.slice(0, 10)) // 只保留最近10条
      } catch (error) {
        console.error('Failed to load search history:', error)
      }
    }
  }, [])

  // 保存搜索历史
  const saveSearchHistory = (query: string, resultCount: number) => {
    if (!query.trim() || typeof window === 'undefined') return

    const newHistory = [
      { query, timestamp: new Date(), resultCount },
      ...searchHistory.filter(item => item.query !== query)
    ].slice(0, 10)

    setSearchHistory(newHistory)
    localStorage.setItem('search-history', JSON.stringify(newHistory))
  }

  // 使用 useMemo 缓存搜索建议 - 增加标签建议
  interface SuggestionItem { text: string; type: 'category' | 'subcategory' | 'title' | 'tag' }
  const suggestions = useMemo<SuggestionItem[]>(() => {
    if (!debouncedQuery.trim() || debouncedQuery.length < 2) return []

    const seen = new Set<string>()
    const list: SuggestionItem[] = []
    const lowerQuery = debouncedQuery.toLowerCase()
    const maxSuggestions = 5

    // 分类与子分类
    for (const category of categories) {
      if (list.length >= maxSuggestions) break
      if (category.name.toLowerCase().includes(lowerQuery) && !seen.has(category.name)) {
        list.push({ text: category.name, type: 'category' })
        seen.add(category.name)
      }
      for (const sub of category.subCategories) {
        if (list.length >= maxSuggestions) break
        if (sub.name.toLowerCase().includes(lowerQuery) && !seen.has(sub.name)) {
          list.push({ text: sub.name, type: 'subcategory' })
          seen.add(sub.name)
        }
      }
    }

    // 标签建议
    if (list.length < maxSuggestions) {
      for (const bookmark of bookmarks) {
        if (list.length >= maxSuggestions) break
        const tags: string[] = Array.isArray(bookmark.tags) ? bookmark.tags : []
        for (const tag of tags) {
          if (list.length >= maxSuggestions) break
          const tagStr = (tag || '').toLowerCase()
          if (tagStr.includes(lowerQuery) && !seen.has(tag)) {
            list.push({ text: tag, type: 'tag' })
            seen.add(tag)
          }
        }
      }
    }

    // 标题建议
    if (list.length < maxSuggestions) {
      for (const bookmark of bookmarks) {
        if (list.length >= maxSuggestions) break
        const title = (bookmark.title || '').toLowerCase()
        if (title.includes(lowerQuery) && !seen.has(bookmark.title)) {
          if (title !== lowerQuery && (bookmark.title || '').length <= 50) {
            list.push({ text: bookmark.title, type: 'title' })
            seen.add(bookmark.title)
          }
        }
      }
    }

    return list.slice(0, maxSuggestions)
  }, [debouncedQuery, bookmarks, categories])

  // 当防抖查询变化时，更新建议显示状态
  useEffect(() => {
    if (debouncedQuery.trim() && suggestions.length > 0) {
      setShowSuggestions(true)
    } else if (!debouncedQuery.trim()) {
      setShowSuggestions(false)
    }
  }, [debouncedQuery, suggestions])

  // 处理搜索输入 - 节流优化，避免过于频繁的状态更新
  const handleSearchChange = useCallback((value: string) => {
    const now = Date.now()
    const timeSinceLastUpdate = now - lastUpdateRef.current

    // 立即更新输入框显示
    setLocalQuery(value)

    // 节流处理建议显示状态更新
    if (timeSinceLastUpdate > 50) { // 50ms 节流
      setShowSuggestions(value.trim().length > 0)
      lastUpdateRef.current = now
    }
  }, [])

  // 清除搜索
  const handleClearSearch = useCallback(() => {
    setLocalQuery("")
    setShowSuggestions(false)
    onSearchChange("") // 立即清除父组件状态
  }, [onSearchChange])

  // 处理搜索提交 - 使用 useCallback 优化
  const handleSearchSubmit = useCallback(() => {
    const query = localQuery.trim()
    if (query) {
      // 简化结果计算，避免复杂的过滤操作
      const resultCount = bookmarks.length // 简化计算，或者可以异步计算
      saveSearchHistory(query, resultCount)
      setShowSuggestions(false)
    }
  }, [localQuery, bookmarks.length])

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([])
    if (typeof window !== 'undefined') {
      localStorage.removeItem('search-history')
    }
  }

  return (
    <div className={cn("relative flex-1 max-w-lg mx-4 sm:mx-8", className)}>
      <div className="relative">
        <Search className="absolute left-3 sm:left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          placeholder="搜索书签、分类..."
          value={localQuery}
          onChange={(e) => handleSearchChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSearchSubmit()
            } else if (e.key === 'Escape') {
              setShowSuggestions(false)
            }
          }}
          onFocus={() => {
            setIsExpanded(true)
            if (localQuery.trim()) {
              setShowSuggestions(suggestions.length > 0)
            }
          }}
          onBlur={() => {
            setTimeout(() => {
              setIsExpanded(false)
              setShowSuggestions(false)
            }, 200)
          }}
          className="pl-10 sm:pl-11 pr-20 sm:pr-24 h-9 sm:h-10 bg-muted/50 border-border/50 rounded-full focus:bg-background focus:border-primary/50 transition-all duration-200"
        />
        
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          {localQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={handleClearSearch}
            >
              <X className="h-3 w-3" />
            </Button>
          )}
          
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0 hover:bg-muted"
              >
                <Filter className="h-3 w-3" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-4" align="end">
              <div className="space-y-4">
                <h4 className="font-medium">搜索过滤器</h4>
                
                <div>
                  <label className="text-sm font-medium mb-2 block">分类</label>
                  <div className="flex flex-wrap gap-2">
                    {categories.map(category => (
                      <Badge
                        key={category.id}
                        variant={filters.categories.includes(category.id) ? "default" : "outline"}
                        className="cursor-pointer"
                        onClick={() => {
                          setFilters(prev => ({
                            ...prev,
                            categories: prev.categories.includes(category.id)
                              ? prev.categories.filter(id => id !== category.id)
                              : [...prev.categories, category.id]
                          }))
                        }}
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
                      setFilters(prev => ({ ...prev, hasDescription: !!checked }))
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

      {/* 搜索建议和历史 */}
      {(showSuggestions || (isExpanded && searchHistory.length > 0 && !searchQuery)) && (
        <div className="absolute z-50 w-full mt-2 bg-popover border border-border rounded-lg shadow-lg max-h-80 overflow-y-auto">
          {showSuggestions && suggestions.length > 0 && (
            <div className="p-2">
              <div className="text-xs font-medium text-muted-foreground mb-2 px-2">建议</div>
              {suggestions.map((s, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    const fill = s.type === 'tag' ? `#${s.text}` : s.text
                    setLocalQuery(fill)
                    onSearchChange(fill)
                    handleSearchSubmit()
                  }}
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
          
          {isExpanded && searchHistory.length > 0 && !localQuery && (
            <div className="p-2 border-t border-border">
              <div className="flex items-center justify-between mb-2 px-2">
                <div className="text-xs font-medium text-muted-foreground">搜索历史</div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-auto p-0 text-xs text-muted-foreground hover:text-foreground"
                  onClick={clearSearchHistory}
                >
                  清除
                </Button>
              </div>
              {searchHistory.map((item, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    onSearchChange(item.query)
                    handleSearchSubmit()
                  }}
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


