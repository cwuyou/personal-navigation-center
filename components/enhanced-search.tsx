"use client"

import { useState, useEffect, useRef } from "react"
import { Search, Clock, Filter, X, Bookmark, Folder } from "lucide-react"
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
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const { categories, bookmarks } = useBookmarkStore()

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

  // 生成搜索建议
  const generateSuggestions = (query: string) => {
    if (!query.trim()) return []
    
    const suggestions = new Set<string>()
    const lowerQuery = query.toLowerCase()
    
    // 从书签标题中提取建议
    bookmarks.forEach(bookmark => {
      const words = bookmark.title.toLowerCase().split(/\s+/)
      words.forEach(word => {
        if (word.includes(lowerQuery) && word !== lowerQuery) {
          suggestions.add(word)
        }
      })
    })
    
    // 从分类名称中提取建议
    categories.forEach(category => {
      if (category.name.toLowerCase().includes(lowerQuery)) {
        suggestions.add(category.name)
      }
      category.subCategories.forEach(sub => {
        if (sub.name.toLowerCase().includes(lowerQuery)) {
          suggestions.add(sub.name)
        }
      })
    })
    
    return Array.from(suggestions).slice(0, 5)
  }

  // 处理搜索输入
  const handleSearchChange = (value: string) => {
    onSearchChange(value)
    
    if (value.trim()) {
      const newSuggestions = generateSuggestions(value)
      setSuggestions(newSuggestions)
      setShowSuggestions(newSuggestions.length > 0)
    } else {
      setShowSuggestions(false)
    }
  }

  // 处理搜索提交
  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      const resultCount = bookmarks.filter(bookmark => 
        bookmark.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        bookmark.url.toLowerCase().includes(searchQuery.toLowerCase())
      ).length
      
      saveSearchHistory(searchQuery, resultCount)
      setShowSuggestions(false)
    }
  }

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
          value={searchQuery}
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
            if (searchQuery.trim()) {
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
          {searchQuery && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0 hover:bg-muted"
              onClick={() => {
                onSearchChange("")
                setShowSuggestions(false)
              }}
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
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  className="w-full text-left px-3 py-2 text-sm hover:bg-accent rounded-md transition-colors"
                  onClick={() => {
                    onSearchChange(suggestion)
                    handleSearchSubmit()
                  }}
                >
                  <Search className="inline w-3 h-3 mr-2 text-muted-foreground" />
                  {suggestion}
                </button>
              ))}
            </div>
          )}
          
          {isExpanded && searchHistory.length > 0 && !searchQuery && (
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
