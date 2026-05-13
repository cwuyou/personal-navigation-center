"use client"

import { useState, useCallback, useMemo, useEffect } from "react"
import { CheckSquare, X, ChevronRight, Info } from "lucide-react"
import { BookmarkCard } from "@/components/bookmark-card"
import { SelectableBookmarkCard } from "@/components/selectable-bookmark-card"
import { EnhancedBookmarkCard } from "@/components/enhanced-bookmark-card"
import { AddBookmarkCard } from "@/components/add-bookmark-card"
import { SearchResults } from "@/components/search-results"
import { BookmarkPreview } from "@/components/bookmark-preview"
import { BatchSelectionToolbar } from "@/components/batch-selection-toolbar"
import { DynamicBookmarkGrid } from "@/components/dynamic-bookmark-grid"

import { Button } from "@/components/ui/button"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useBookmarkImagePreloader } from "@/hooks/use-image-preloader"
import { useResponsiveLayout, useDisplaySettings } from "@/hooks/use-display-settings"
import { FALLBACK_SUBCATEGORY_NAME } from "@/lib/bookmark-importer"
import type { SearchFilters } from "@/lib/search-utils"

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
  searchFilters?: SearchFilters
  onCategorySelectFromSearch?: (categoryId: string) => void
  selectedCategory: string | null
  selectedSubCategory: string | null
  onSubCategorySelect: (subCategoryId: string) => void
  sidebarCollapsed: boolean
}

export function EnhancedMainContent({
  searchQuery,
  searchFilters,
  onCategorySelectFromSearch,
  selectedCategory,
  selectedSubCategory,
  onSubCategorySelect,
  sidebarCollapsed,
}: EnhancedMainContentProps) {
  const [previewBookmark, setPreviewBookmark] = useState<Bookmark | null>(null)
  const [isSelectionMode, setIsSelectionMode] = useState(false)
  const [selectedBookmarkIds, setSelectedBookmarkIds] = useState<string[]>([])
  const [demoNoticeDismissed, setDemoNoticeDismissed] = useState(false)

  const { categories, bookmarks, deleteBookmark, clearAllData, exportBookmarks } = useBookmarkStore()
  const { preloadBookmarkImages } = useBookmarkImagePreloader()
  const { breakpoint } = useResponsiveLayout()
  const { settings: displaySettings } = useDisplaySettings()

  // 添加/导入书签时 store 会写入 hasUserData/hideDemoNotice，
  // 依赖 bookmarks 让我们在变化后重新读 flag，避免横幅"幽灵显示"
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (
      localStorage.getItem('hideDemoNotice') === 'true' ||
      localStorage.getItem('hasUserData') === 'true'
    ) {
      setDemoNoticeDismissed(true)
    }
  }, [bookmarks])

  // 首页每个子分类一行展示几个书签：与当前网格列数一致（最少 4，最多 6）
  const homeRowCount = useMemo(() => {
    const cols = displaySettings.gridColumns[breakpoint]
    return Math.max(4, Math.min(6, cols))
  }, [breakpoint, displaySettings.gridColumns])



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

  // 批量导出选中（仅导出关联分类/子分类）
  const handleExportSelected = (ids: string[]) => {
    const idSet = new Set(ids)
    const subset = bookmarks.filter(b => idSet.has(b.id))
    const subIdSet = new Set(subset.map(b => b.subCategoryId))
    const trimmedCategories = categories
      .map(cat => {
        const subs = (cat.subCategories || []).filter(s => subIdSet.has(s.id))
        return subs.length > 0 ? { ...cat, subCategories: subs } : null
      })
      .filter(Boolean) as typeof categories
    const data = { categories: trimmedCategories, bookmarks: subset }

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `bookmarks-selected-${new Date().toISOString().slice(0,10)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  // 获取当前分类
  const currentCategory = selectedCategory
    ? categories.find(cat => cat.id === selectedCategory)
    : null

  // 当一级分类只有一个"未分组"占位子分类时,折叠中间层:
  // 直接把该子分类当作已选中,不显示 chip 导航
  const isCollapsedFallback = !!currentCategory &&
    currentCategory.subCategories.length === 1 &&
    currentCategory.subCategories[0].name === FALLBACK_SUBCATEGORY_NAME
  const effectiveSubCategory = isCollapsedFallback
    ? currentCategory!.subCategories[0].id
    : selectedSubCategory

  // 🔧 使用useMemo缓存当前书签，避免不必要的重新计算
  const currentBookmarks = useMemo(() => {
    if (selectedSubCategory) {
      return bookmarks.filter(bookmark => bookmark.subCategoryId === selectedSubCategory)
    }
    if (selectedCategory && currentCategory) {
      return bookmarks.filter(bookmark =>
        currentCategory.subCategories.some(sub => sub.id === bookmark.subCategoryId)
      )
    }
    return []
  }, [selectedSubCategory, selectedCategory, currentCategory, bookmarks])

  // 🚀 预加载功能已禁用，避免循环问题
  // useEffect(() => {
  //   if (currentBookmarks.length > 0) {
  //     const timer = setTimeout(() => {
  //       preloadBookmarkImages(currentBookmarks)
  //     }, 500)
  //     return () => clearTimeout(timer)
  //   }
  // }, [currentBookmarks.length])

  if (searchQuery.trim()) {
    return (
      <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300 bg-background", sidebarCollapsed ? "ml-0" : "ml-0")}>
        <div className="max-w-7xl mx-auto">
          <SearchResults
            searchQuery={searchQuery}
            filters={searchFilters}
            onPreview={handlePreview}
            onCategorySelect={onCategorySelectFromSearch}
          />
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
      <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300 bg-background", sidebarCollapsed ? "ml-0" : "ml-0")}>
        <div className="max-w-7xl mx-auto">
          {/* 分类标题区域 */}
          <div className="mb-6 sm:mb-8">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 sm:w-2 h-5 sm:h-6 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                <h1 className="text-lg sm:text-xl font-semibold text-foreground">{currentCategory.name}</h1>
              </div>

              {/* 批量操作按钮 */}
              {currentBookmarks.length > 0 && (
                <div className="flex items-center space-x-2">
                  {isSelectionMode && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleSelectAll}
                      className="h-8 border-primary/30 hover:border-primary/50"
                      title={selectedBookmarkIds.length === currentBookmarks.length ? '取消全选' : '全选'}
                    >
                      <CheckSquare className="w-4 h-4 sm:mr-1" />
                      <span className="hidden sm:inline">
                        {selectedBookmarkIds.length === currentBookmarks.length ? '取消全选' : '全选'}
                      </span>
                    </Button>
                  )}
                  <Button
                    variant={isSelectionMode ? "default" : "outline"}
                    size="sm"
                    onClick={toggleSelectionMode}
                    className={`h-8 ${!isSelectionMode ? 'border-transparent hover:border-primary/40 hover:bg-primary/10 hover:text-primary' : ''}`}
                    title={isSelectionMode ? "退出选择模式" : "进入选择模式"}
                  >
                    {isSelectionMode ? (
                      <>
                        <X className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">退出</span>
                      </>
                    ) : (
                      <>
                        <CheckSquare className="w-4 h-4 sm:mr-1" />
                        <span className="hidden sm:inline">选择</span>
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-5">
              {isCollapsedFallback
                ? `${currentBookmarks.length} 个书签`
                : `${currentCategory.subCategories.length} 个子分类 · ${currentBookmarks.length} 个书签`}
            </p>
          </div>

          {/* 子分类导航 */}
          {!isCollapsedFallback && (
            <div className="flex flex-wrap gap-2 mb-6 sm:mb-8">
              {currentCategory.subCategories.map((subCategory) => (
                <button
                  key={subCategory.id}
                  className={cn(
                    "px-3 py-1.5 text-xs sm:text-sm rounded-full transition-all duration-200 touch-manipulation active:scale-95",
                    selectedSubCategory === subCategory.id
                      ? "bg-primary text-primary-foreground shadow-md hover:shadow-lg"
                      : "bg-muted hover:bg-primary/10 text-muted-foreground hover:text-primary border border-transparent hover:border-primary/30"
                  )}
                  onClick={() => onSubCategorySelect(subCategory.id)}
                >
                  {subCategory.name}
                  <span className="ml-1.5 text-xs opacity-60">
                    {bookmarks.filter(b => b.subCategoryId === subCategory.id).length}
                  </span>
                </button>
              ))}
            </div>
          )}

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

            {effectiveSubCategory && !isSelectionMode && currentBookmarks.length > 0 && <AddBookmarkCard subCategoryId={effectiveSubCategory} />}
          </DynamicBookmarkGrid>

          {currentBookmarks.length === 0 && effectiveSubCategory && (
            <div className="text-center mt-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">还没有书签</h3>
              <p className="text-muted-foreground mb-6">点击下方按钮添加第一个书签</p>
              <AddBookmarkCard subCategoryId={effectiveSubCategory} />
            </div>
          )}
        </div>

        {/* 批量操作工具栏 */}
        <BatchSelectionToolbar
          selectedBookmarkIds={selectedBookmarkIds}
          onClearSelection={clearSelection}
          onDeleteSelected={handleBatchDelete}
          onMoveComplete={handleMoveComplete}
          onExportSelected={handleExportSelected}
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
  // 检查是否是演示数据且未隐藏提示
  const isDemoData = bookmarks.some(bookmark =>
    bookmark.id === "vscode" || bookmark.id === "github" || bookmark.id === "postman"
  )
  const showDemoNotice = isDemoData && !demoNoticeDismissed

  return (
    <main className={cn("flex-1 transition-all duration-300 bg-background", sidebarCollapsed ? "ml-0" : "ml-0")}>
      {/* 演示数据提示横幅（轻量） */}
      {showDemoNotice && (
        <div className="border-b border-border/40">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground min-w-0">
              <Info className="w-4 h-4 text-primary flex-shrink-0" />
              <span className="truncate">
                当前为演示数据，添加自己的书签后将自动隐藏
              </span>
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => {
                  if (confirm('确定要清除所有演示数据吗？此操作不可撤销。')) {
                    localStorage.removeItem('bookmark-store')
                    clearAllData()
                    window.location.reload()
                  }
                }}
                className="text-xs px-2 py-1 rounded-md text-primary hover:bg-primary/10 transition-colors"
              >
                清除演示
              </button>
              <button
                onClick={() => {
                  localStorage.setItem('hideDemoNotice', 'true')
                  setDemoNoticeDismissed(true)
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted/60"
                title="关闭"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 分类内容区域 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8 sm:space-y-12 lg:space-y-16">
        {categories.map((category) => {
          const categoryBookmarks = bookmarks.filter(bookmark =>
            category.subCategories.some(sub => sub.id === bookmark.subCategoryId)
          )
          const isFallbackOnly =
            category.subCategories.length === 1 &&
            category.subCategories[0].name === FALLBACK_SUBCATEGORY_NAME

          return (
            <div key={category.id} className="space-y-4 sm:space-y-6">
              {/* 分类标题 */}
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  className="flex items-center space-x-3 cursor-pointer group"
                  onClick={() => onSubCategorySelect(category.id)}
                >
                  <div className="w-1 sm:w-1.5 h-4 sm:h-5 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
                  <h2 className="text-base sm:text-lg font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h2>
                  <span className="text-xs sm:text-sm text-muted-foreground">
                    {categoryBookmarks.length} 个书签
                  </span>
                </button>
              </div>

              {/* 每个子分类一行书签 */}
              <div className="space-y-6 sm:space-y-8">
                {category.subCategories.map((subCategory) => {
                  const subBookmarks = bookmarks.filter(b => b.subCategoryId === subCategory.id)
                  if (subBookmarks.length === 0) return null
                  const visible = subBookmarks.slice(0, homeRowCount)
                  const remaining = subBookmarks.length - visible.length

                  return (
                    <div key={subCategory.id} className="space-y-3">
                      {/* 子分类小标题（折叠态分类不显示） */}
                      {!isFallbackOnly && (
                        <div className="flex items-center justify-between gap-2">
                          <button
                            type="button"
                            className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary transition-colors group"
                            onClick={() => onSubCategorySelect(subCategory.id)}
                          >
                            <span>{subCategory.name}</span>
                            <span className="text-xs opacity-60">{subBookmarks.length}</span>
                          </button>
                          {remaining > 0 && (
                            <button
                              type="button"
                              className="text-xs text-muted-foreground hover:text-primary flex items-center gap-0.5"
                              onClick={() => onSubCategorySelect(subCategory.id)}
                            >
                              查看全部 {subBookmarks.length}
                              <ChevronRight className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      )}

                      <DynamicBookmarkGrid>
                        {visible.map((bookmark) => (
                          <EnhancedBookmarkCard key={bookmark.id} bookmark={bookmark} onPreview={handlePreview} />
                        ))}
                      </DynamicBookmarkGrid>
                    </div>
                  )
                })}
              </div>
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
