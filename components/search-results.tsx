"use client"

import { useMemo } from "react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { BookmarkCard } from "@/components/bookmark-card"
import { Badge } from "@/components/ui/badge"

interface SearchResultsProps {
  searchQuery: string
  onPreview?: (bookmark: any) => void
}

export function SearchResults({ searchQuery, onPreview }: SearchResultsProps) {
  const { categories, bookmarks } = useBookmarkStore()

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return { categories: [], bookmarks: [] }

    const query = searchQuery.toLowerCase()

    const matchedCategories = categories.filter(
      (category) =>
        category.name.toLowerCase().includes(query) ||
        category.subCategories.some((sub: any) => sub.name.toLowerCase().includes(query)),
    )

    const matchedBookmarks = bookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(query) ||
        bookmark.description?.toLowerCase().includes(query) ||
        bookmark.url.toLowerCase().includes(query),
    )

    return { categories: matchedCategories, bookmarks: matchedBookmarks }
  }, [searchQuery, categories, bookmarks])

  const getCategoryPath = (subCategoryId: string) => {
    for (const category of categories) {
      const subCategory = category.subCategories.find((sub: any) => sub.id === subCategoryId)
      if (subCategory) {
        return `${category.name} > ${subCategory.name}`
      }
    }
    return ""
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">搜索结果</h1>
        <p className="text-muted-foreground">
          找到 {searchResults.categories.length} 个分类和 {searchResults.bookmarks.length} 个书签
        </p>
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
            {searchResults.bookmarks.map((bookmark) => (
              <div key={bookmark.id} className="space-y-2">
                <BookmarkCard bookmark={bookmark} onPreview={onPreview} />
                <div className="text-xs text-muted-foreground px-2">{getCategoryPath(bookmark.subCategoryId)}</div>
              </div>
            ))}
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
