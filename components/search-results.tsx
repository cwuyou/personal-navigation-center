"use client"

import { useMemo, useCallback } from "react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { EnhancedBookmarkCard } from "@/components/enhanced-bookmark-card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

interface SearchResultsProps {
  searchQuery: string
  onPreview?: (bookmark: any) => void
}

export function SearchResults({ searchQuery, onPreview }: SearchResultsProps) {
  const { categories, bookmarks } = useBookmarkStore()

  const searchResults = useMemo(() => {
    const raw = searchQuery.trim()
    if (!raw) return { categories: [], bookmarks: [], effectiveQuery: '' as string, tagOnly: false as boolean } as any

    let tagOnly = false
    let normalized = raw
    if (raw.toLowerCase().startsWith('tag:')) {
      tagOnly = true
      normalized = raw.slice(4)
    } else if (raw.startsWith('#')) {
      tagOnly = true
      normalized = raw.slice(1)
    }

    const query = normalized.toLowerCase()

    // 分类搜索（标签模式下不返回分类）
    const matchedCategories = tagOnly ? [] : categories.filter((category) => {
      if (category.name.toLowerCase().includes(query)) return true
      return category.subCategories.some((sub: any) =>
        sub.name.toLowerCase().includes(query)
      )
    })

    // 书签搜索
    const matchedBookmarks = bookmarks.filter((bookmark) => {
      const titleLower = (bookmark.title || '').toLowerCase()
      const descLower = (bookmark.description || '').toLowerCase()
      const urlLower = (bookmark.url || '').toLowerCase()
      const tagsMatch = Array.isArray(bookmark.tags)
        ? bookmark.tags.some(tag => (tag || '').toLowerCase().includes(query))
        : false

      if (tagOnly) return tagsMatch

      return titleLower.includes(query) ||
             descLower.includes(query) ||
             urlLower.includes(query) ||
             tagsMatch
    })

    return { categories: matchedCategories, bookmarks: matchedBookmarks, effectiveQuery: normalized, tagOnly }
  }, [searchQuery, categories, bookmarks])

  // 使用 useMemo 缓存分类路径映射
  const categoryPathMap = useMemo(() => {
    const pathMap = new Map<string, string>()
    categories.forEach(category => {
      category.subCategories.forEach((sub: any) => {
        pathMap.set(sub.id, `${category.name} > ${sub.name}`)
      })
    })
    return pathMap
  }, [categories])

  const getCategoryPath = useCallback((subCategoryId: string) => {
    return categoryPathMap.get(subCategoryId) || ""
  }, [categoryPathMap])

  // 更稳健的高亮：基于匹配位置切分，支持多关键词
  const buildHighlightRegex = (tokens: string[]) => {
    const escaped = tokens
      .filter(Boolean)
      .map(t => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
    if (escaped.length === 0) return null
    return new RegExp(escaped.join('|'), 'ig')
  }
  const renderWithHighlight = (text: string, tokens: string[]) => {
    if (!text) return null
    const re = buildHighlightRegex(tokens)
    if (!re) return <>{text}</>
    const nodes: any[] = []
    let last = 0
    for (let m = re.exec(text); m; m = re.exec(text)) {
      const start = m.index
      const end = start + m[0].length
      if (start > last) nodes.push(<span key={nodes.length}>{text.slice(last, start)}</span>)
      nodes.push(
        <mark key={nodes.length} className="bg-yellow-200/60 text-foreground px-0.5 rounded">
          {text.slice(start, end)}
        </mark>
      )
      last = end
      if (re.lastIndex === m.index) re.lastIndex++ // 防止零长度匹配死循环
    }
    if (last < text.length) nodes.push(<span key={nodes.length}>{text.slice(last)}</span>)
    return <>{nodes}</>
  }

  const handleExportSearch = () => {
    const q = (searchResults as any).effectiveQuery || searchQuery
    const subIdSet = new Set(searchResults.bookmarks.map((b: any) => b.subCategoryId))
    const trimmedCategories = categories
      .map(cat => {
        const subs = (cat.subCategories || []).filter((s: any) => subIdSet.has(s.id))
        return subs.length > 0 ? { ...cat, subCategories: subs } : null
      })
      .filter(Boolean) as any
    const data = { categories: trimmedCategories, bookmarks: searchResults.bookmarks }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-search-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-1">搜索结果</h1>
            <p className="text-muted-foreground">
              找到 {searchResults.categories.length} 个分类和 {searchResults.bookmarks.length} 个书签
            </p>
          </div>
          {searchResults.bookmarks.length > 0 && (
            <Button variant="outline" onClick={handleExportSearch} title="导出搜索结果">
              <Download className="w-4 h-4 mr-2" /> 导出搜索结果
            </Button>
          )}
        </div>
      </div>

      {/* Category Results */}
      {searchResults.categories.length > 0 && (
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-4">匹配的分类</h2>
          <div className="flex flex-wrap gap-2">
            {searchResults.categories.map((category) => (
              <Badge key={category.id} variant="outline" className="px-3 py-1">
                {category.name}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Bookmark Results */}
      {searchResults.bookmarks.length > 0 && (
        <div>
          <h2 className="text-xl font-semibold mb-4">匹配的书签</h2>
          <div className="bookmark-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {searchResults.bookmarks.map((bookmark) => {
              const q = (searchResults as any).effectiveQuery?.toLowerCase?.() || searchQuery.toLowerCase()
              const titleLower = (bookmark.title || '').toLowerCase()
              const descLower = (bookmark.description || '').toLowerCase()
              const urlLower = (bookmark.url || '').toLowerCase()
              const tagMatch = Array.isArray(bookmark.tags) ? bookmark.tags.some(t => (t || '').toLowerCase().includes(q)) : false
              const sources: Array<'标题' | '描述' | 'URL' | '标签'> = []
              if (titleLower.includes(q)) sources.push('标题')
              if (descLower.includes(q)) sources.push('描述')
              if (urlLower.includes(q)) sources.push('URL')
              if (tagMatch) sources.push('标签')
              return (
                <div key={bookmark.id} className="space-y-2">
                  {/* 高亮显示标题/描述/URL 的匹配片段 */}
                  <div className="px-2">
                    <div className="text-sm font-medium truncate">
                      {renderWithHighlight(bookmark.title || '', q.split(/\s+/).filter(Boolean))}
                    </div>
                    {bookmark.description && (
                      <div className="text-xs text-muted-foreground line-clamp-2">
                        {renderWithHighlight(bookmark.description || '', q.split(/\s+/).filter(Boolean))}
                      </div>
                    )}
                    <div className="text-[11px] text-muted-foreground/70">
                      {renderWithHighlight(bookmark.url || '', q.split(/\s+/).filter(Boolean))}
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground px-2">{getCategoryPath(bookmark.subCategoryId)}</div>
                  {sources.length > 0 && (
                    <div className="flex flex-wrap gap-1 px-2">
                      {sources.includes('标题') && <Badge className="bg-blue-500 text-white">标题</Badge>}
                      {sources.includes('描述') && <Badge className="bg-green-500 text-white">描述</Badge>}
                      {sources.includes('URL') && <Badge className="bg-amber-500 text-white">URL</Badge>}
                      {sources.includes('标签') && <Badge className="bg-purple-500 text-white">标签</Badge>}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}

      {searchResults.categories.length === 0 && searchResults.bookmarks.length === 0 && (
        <div className="text-center text-muted-foreground mt-12">
          <p>没有找到匹配的结果</p>
          <p className="text-sm mt-2">尝试使用不同的关键词搜索</p>
        </div>
      )}
    </div>
  )
}
