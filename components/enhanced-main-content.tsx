"use client"

import { useState, useCallback } from "react"
import { CheckSquare, X } from "lucide-react"
import { BookmarkCard } from "@/components/bookmark-card"
import { SelectableBookmarkCard } from "@/components/selectable-bookmark-card"
import { EnhancedBookmarkCard } from "@/components/enhanced-bookmark-card"
import { AddBookmarkCard } from "@/components/add-bookmark-card"
import { SearchResults } from "@/components/search-results"
import { BookmarkPreview } from "@/components/bookmark-preview"
import { BatchSelectionToolbar } from "@/components/batch-selection-toolbar"
import { DropdownDisplaySettings } from "@/components/dropdown-display-settings"
import { DynamicBookmarkGrid } from "@/components/dynamic-bookmark-grid"
import { Button } from "@/components/ui/button"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  coverImage?: string
  tags?: string[]
  subCategoryId: string
  createdAt: Date
}
import { cn } from "@/lib/utils"

interface EnhancedMainContentProps {
  searchQuery: string
  selectedCategory: string | null
  selectedSubCategory: string | null
  onSubCategorySelect: (subCategoryId: string) => void
  sidebarCollapsed: boolean
}

export function EnhancedMainContent({
  searchQuery,
  selectedCategory,
  selectedSubCategory,
  onSubCategorySelect,
  sidebarCollapsed,
}: EnhancedMainContentProps) {
  const [previewBookmark, setPreviewBookmark] = useState<Bookmark | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([])
  
  const { categories, bookmarks, deleteBookmark } = useBookmarkStore()

  // 处理预览
  const handlePreview = useCallback((bookmark: Bookmark) => {
    setPreviewBookmark(bookmark)
  }, [])

  // 处理选择模式切换
  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode)
    setSelectedBookmarkIds([])
  }

  // 处理书签选择
  const handleBookmarkSelection = (bookmarkId: string, selected: boolean) => {
    setSelectedBookmarkIds(prev => 
      selected 
        ? [...prev, bookmarkId]
        : prev.filter(id => id !== bookmarkId)
    )
  }

  // 全选/取消全选
  const handleSelectAll = () => {
    const allBookmarks = selectedSubCategory
      ? bookmarks.filter(b => b.subCategoryId === selectedSubCategory)
      : selectedCategory && currentCategory
      ? bookmarks.filter(b =>
          currentCategory.subCategories.some(sub => sub.id === b.subCategoryId)
        )
      : []

    if (selectedBookmarkIds.length === allBookmarks.length) {
      setSelectedBookmarkIds([])
    } else {
      setSelectedBookmarkIds(allBookmarks.map(b => b.id))
    }
  }

  // 清除选择
  const clearSelection = () => {
    setSelectedBookmarkIds([])
    setIsSelectionMode(false)
  }

  // 批量删除
  const handleBatchDelete = () => {
    selectedBookmarkIds.forEach(id => deleteBookmark(id))
    setSelectedBookmarkIds([])
    setIsSelectionMode(false)
  }

  // 移动完成后的处理
  const handleMoveComplete = () => {
    setSelectedBookmarkIds([])
    setIsSelectionMode(false)
  }

  // 获取当前分类
  const currentCategory = selectedCategory 
    ? categories.find(cat => cat.id === selectedCategory)
    : null

  // 获取当前书签
  const currentBookmarks = selectedSubCategory
    ? bookmarks.filter(bookmark => bookmark.subCategoryId === selectedSubCategory)
    : selectedCategory && currentCategory
    ? bookmarks.filter(bookmark =>
        currentCategory.subCategories.some(sub => sub.id === bookmark.subCategoryId)
      )
    : []

  // 如果有搜索查询，显示搜索结果
  if (searchQuery.trim()) {
    return (
      <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300 bg-gradient-to-br from-background to-muted/20", sidebarCollapsed ? "ml-0" : "ml-0")}>
        <div className="max-w-7xl mx-auto">
          <SearchResults searchQuery={searchQuery} onPreview={handlePreview} />
          {previewBookmark && (
            <BookmarkPreview
              bookmark={previewBookmark}
              isOpen={!!previewBookmark}
              onClose={() => setPreviewBookmark(null)}
            />
          )}
        </div>
      </main>
    )
  }

  // 如果选择了分类，显示单个分类的详细视图
  if (selectedCategory && currentCategory) {
    return (
      <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300 bg-gradient-to-br from-background to-muted/20", sidebarCollapsed ? "ml-0" : "ml-0")}>
        <div className="max-w-7xl mx-auto">
          {/* 分类标题区域 */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 sm:w-2 h-6 sm:h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{currentCategory.name}</h1>
              </div>
              
              {/* 批量操作按钮 */}
              {currentBookmarks.length > 0 && (
                <div className="flex items-center space-x-2">
                  {isSelectionMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8"
                    >
                      <CheckSquare className="w-4 h-4 mr-1" />
                      {selectedBookmarkIds.length === currentBookmarks.length ? '取消全选' : '全选'}
                    </Button>
                  )}
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className="h-8"
                  >
                    {isSelectionMode ? (
                      <>
                        <X className="w-4 h-4 mr-1" />
                        退出选择
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 mr-1" />
                        批量选择
                      </>
                    )}
                  </Button>
                  <DropdownDisplaySettings />
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-5">
              {currentCategory.subCategories.length} 个子分类 · {currentBookmarks.length} 个书签
            </p>
          </div>

          {/* 子分类导航 */}
          <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
            {currentCategory.subCategories.map((subCategory) => (
              <button
                key={subCategory.id}
                className={cn(
                  "px-3 py-1.5 text-sm rounded-full transition-all duration-200",
                  selectedSubCategory === subCategory.id
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground"
                )}
                onClick={() => onSubCategorySelect(subCategory.id)}
              >
                {subCategory.name}
                <span className="ml-1.5 text-xs opacity-70">
                  {bookmarks.filter(b => b.subCategoryId === subCategory.id).length}
                </span>
              </button>
            ))}
          </div>

          {/* Bookmarks grid */}
          <DynamicBookmarkGrid>
            {currentBookmarks.map((bookmark) => (
              isSelectionMode ? (
                <SelectableBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onPreview={handlePreview}
                  isSelectionMode={isSelectionMode}
                  isSelected={selectedBookmarkIds.includes(bookmark.id)}
                  onSelectionChange={handleBookmarkSelection}
                />
              ) : (
                <EnhancedBookmarkCard
                  key={bookmark.id}
                  bookmark={bookmark}
                  onPreview={handlePreview}
                />
              )
            ))}

            {selectedSubCategory && !isSelectionMode && currentBookmarks.length > 0 && <AddBookmarkCard subCategoryId={selectedSubCategory} />}
          </DynamicBookmarkGrid>

          {currentBookmarks.length === 0 && selectedSubCategory && (
            <div className="text-center mt-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">还没有书签</h3>
              <p className="text-muted-foreground mb-6">点击下方按钮添加第一个书签</p>
              <AddBookmarkCard subCategoryId={selectedSubCategory} />
            </div>
          )}
        </div>

        {/* 批量操作工具栏 */}
        <BatchSelectionToolbar
          selectedBookmarkIds={selectedBookmarkIds}
          onClearSelection={clearSelection}
          onDeleteSelected={handleBatchDelete}
          onMoveComplete={handleMoveComplete}
        />

        {previewBookmark && (
          <BookmarkPreview
            bookmark={previewBookmark}
            isOpen={!!previewBookmark}
            onClose={() => setPreviewBookmark(null)}
          />
        )}
      </main>
    )
  }

  // 首页：显示所有一级分类
  return (
    <main className={cn("flex-1 transition-all duration-300 bg-gradient-to-br from-background to-muted/20", sidebarCollapsed ? "ml-0" : "ml-0")}>
      {/* 页面头部 */}
      <div className="bg-gradient-to-r from-primary/5 to-primary/10 border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="text-center">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent mb-3 sm:mb-4">
              个人导航中心
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto px-4">
              发现和管理您的书签收藏，让每一个链接都触手可及
            </p>
            <p className="text-xs text-muted-foreground/80 mt-2">
              💡 点击分类标题进入分类页面，使用批量选择和移动功能
            </p>
            <div className="flex items-center justify-center gap-4 sm:gap-6 mt-4 sm:mt-6 text-xs sm:text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary"></div>
                <span>{categories.length} 个分类</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span>{bookmarks.length} 个书签</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 分类内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12 lg:space-y-16">
        {categories.map((category, index) => {
          const categoryBookmarks = bookmarks.filter(bookmark => 
            category.subCategories.some(sub => sub.id === bookmark.subCategoryId)
          )
          const firstSubCategory = category.subCategories[0]
          const firstSubCategoryBookmarks = firstSubCategory 
            ? bookmarks.filter(b => b.subCategoryId === firstSubCategory.id)
            : []

          return (
            <div key={category.id} className="space-y-4 sm:space-y-6">
              {/* 分类标题 */}
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-3 cursor-pointer group"
                  onClick={() => onSubCategorySelect(category.id)}
                >
                  <div className="w-1 sm:w-1.5 h-5 sm:h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <h2 className="text-lg sm:text-xl font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {categoryBookmarks.length} 个书签
                  </span>
                </div>
              </div>

              {/* 二级分类胶囊标签 */}
              {category.subCategories.length > 0 && (
                <div className="flex flex-wrap gap-2 sm:gap-3 mb-4 sm:mb-6">
                  {category.subCategories.map((subCategory) => (
                    <button
                      key={subCategory.id}
                      className={cn(
                        "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200",
                        "hover:scale-105 hover:shadow-md border touch-manipulation",
                        firstSubCategory?.id === subCategory.id
                          ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg border-primary/20"
                          : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground border-border/50"
                      )}
                      onClick={() => onSubCategorySelect(subCategory.id)}
                    >
                      {subCategory.name}
                    </button>
                  ))}
                </div>
              )}

              {/* 书签网格 */}
              <DynamicBookmarkGrid>
                {firstSubCategoryBookmarks.slice(0, 7).map((bookmark) => (
                  <EnhancedBookmarkCard key={bookmark.id} bookmark={bookmark} onPreview={handlePreview} />
                ))}


              </DynamicBookmarkGrid>
            </div>
          )
        })}
      </div>

      {previewBookmark && (
        <BookmarkPreview
          bookmark={previewBookmark}
          isOpen={!!previewBookmark}
          onClose={() => setPreviewBookmark(null)}
        />
      )}
    </main>
  )
}
