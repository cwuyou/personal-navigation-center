"use client"

import { useState } from "react"
import { BookmarkCard } from "@/components/bookmark-card"
import { AddBookmarkCard } from "@/components/add-bookmark-card"
import { SearchResults } from "@/components/search-results"
import { BookmarkPreview } from "@/components/bookmark-preview"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { cn } from "@/lib/utils"

interface MainContentProps {
  searchQuery: string
  selectedCategory: string | null
  selectedSubCategory: string | null
  onSubCategorySelect: (subCategoryId: string) => void
  sidebarCollapsed: boolean
}

export function MainContent({
  searchQuery,
  selectedCategory,
  selectedSubCategory,
  onSubCategorySelect,
  sidebarCollapsed,
}: MainContentProps) {
  const { categories, bookmarks } = useBookmarkStore()

  // 预览状态
  const [previewBookmark, setPreviewBookmark] = useState<{
    id: string
    title: string
    url: string
    description?: string
    favicon?: string
  } | null>(null)
  const [isPreviewOpen, setIsPreviewOpen] = useState(false)

  // 处理预览
  const handlePreview = (bookmark: any) => {
    setPreviewBookmark(bookmark)
    setIsPreviewOpen(true)
  }

  const handleClosePreview = () => {
    setIsPreviewOpen(false)
    setPreviewBookmark(null)
  }

  // 获取当前选中的分类
  const currentCategory = selectedCategory ? categories.find((cat) => cat.id === selectedCategory) : null

  // 获取当前选中二级分类的书签
  const currentBookmarks = selectedSubCategory
    ? bookmarks.filter((bookmark) => bookmark.subCategoryId === selectedSubCategory)
    : []

  // 获取每个分类下第一个二级分类的书签（用于首页展示）
  const getCategoryBookmarks = (categoryId: string) => {
    const category = categories.find((cat) => cat.id === categoryId)
    if (!category || category.subCategories.length === 0) return []
    const firstSubCategory = category.subCategories[0]
    return bookmarks.filter((bookmark) => bookmark.subCategoryId === firstSubCategory.id)
  }

  if (searchQuery.trim()) {
    return (
      <main className={cn("flex-1 p-6 transition-all duration-300", sidebarCollapsed ? "ml-0" : "ml-0")}>
        <SearchResults searchQuery={searchQuery} onPreview={handlePreview} />

        {/* 书签预览面板 */}
        <BookmarkPreview
          bookmark={previewBookmark}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
        />
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
            <div className="flex items-center space-x-3 mb-2">
              <div className="w-1.5 sm:w-2 h-6 sm:h-8 bg-gradient-to-b from-primary to-primary/60 rounded-full"></div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">{currentCategory.name}</h1>
            </div>
            <p className="text-xs sm:text-sm text-muted-foreground ml-4 sm:ml-5">
              {currentCategory.subCategories.length} 个子分类 · {currentBookmarks.length} 个书签
            </p>
          </div>

          {/* Sub-category tabs */}
          {currentCategory.subCategories.length > 0 && (
            <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
              {currentCategory.subCategories.map((subCategory: any) => (
                <button
                  key={subCategory.id}
                  className={cn(
                    "px-3 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200",
                    "hover:scale-105 hover:shadow-md touch-manipulation",
                    selectedSubCategory === subCategory.id
                      ? "bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  onClick={() => onSubCategorySelect(subCategory.id)}
                >
                  {subCategory.name}
                </button>
              ))}
            </div>
          )}

          {/* Bookmarks grid */}
          <div className="bookmark-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
            {currentBookmarks.map((bookmark) => (
              <BookmarkCard key={bookmark.id} bookmark={bookmark} onPreview={handlePreview} />
            ))}

            {selectedSubCategory && <AddBookmarkCard subCategoryId={selectedSubCategory} />}
          </div>

          {currentBookmarks.length === 0 && selectedSubCategory && (
            <div className="text-center mt-16">
              <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">还没有书签</h3>
              <p className="text-sm text-muted-foreground">点击下方的"添加书签"卡片来添加第一个书签</p>
            </div>
          )}
        </div>

        {/* 书签预览面板 */}
        <BookmarkPreview
          bookmark={previewBookmark}
          isOpen={isPreviewOpen}
          onClose={handleClosePreview}
        />
      </main>
    )
  }

  // 首页：显示所有一级分类，每个分类都展示其二级分类和默认书签
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
          const categoryBookmarks = getCategoryBookmarks(category.id)
          const firstSubCategory = category.subCategories[0]

          return (
            <div key={category.id} className="group">
              {/* 分类卡片容器 */}
              <div className="bg-card/60 backdrop-blur-sm border border-border/50 rounded-xl sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm hover:shadow-lg transition-all duration-300 hover:border-border">
                {/* 分类标题区域 */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6 sm:mb-8">
                  <div className="flex items-center space-x-3 sm:space-x-4">
                    <div className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-lg sm:rounded-xl flex items-center justify-center shadow-lg",
                      "bg-gradient-to-br transition-transform group-hover:scale-105",
                      index % 4 === 0 && "from-blue-500 to-blue-600",
                      index % 4 === 1 && "from-green-500 to-green-600",
                      index % 4 === 2 && "from-purple-500 to-purple-600",
                      index % 4 === 3 && "from-orange-500 to-orange-600"
                    )}>
                      <svg className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                      </svg>
                    </div>
                    <div>
                      <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-foreground mb-1">{category.name}</h2>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {category.subCategories.length} 个子分类 · {categoryBookmarks.length} 个书签
                      </p>
                    </div>
                  </div>
                </div>

                {/* 二级分类标签 */}
                {category.subCategories.length > 0 && (
                  <div className="flex flex-wrap gap-2 sm:gap-3 mb-6 sm:mb-8">
                    {category.subCategories.map((subCategory: any) => (
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
                <div className="bookmark-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
                  {categoryBookmarks.map((bookmark) => (
                    <BookmarkCard key={bookmark.id} bookmark={bookmark} onPreview={handlePreview} />
                  ))}

                  {firstSubCategory && <AddBookmarkCard subCategoryId={firstSubCategory.id} />}
                </div>

                {/* 空状态提示 */}
                {categoryBookmarks.length === 0 && firstSubCategory && (
                  <div className="text-center py-16">
                    <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                      <svg className="w-10 h-10 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">还没有书签</h3>
                    <p className="text-muted-foreground mb-4">这个分类还没有添加任何书签</p>
                    <p className="text-sm text-muted-foreground">点击下方的"添加书签"卡片来添加第一个书签</p>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* 书签预览面板 */}
      <BookmarkPreview
        bookmark={previewBookmark}
        isOpen={isPreviewOpen}
        onClose={handleClosePreview}
      />
    </main>
  )
}
