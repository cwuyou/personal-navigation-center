"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { EnhancedMainContent } from "@/components/enhanced-main-content"
import { PWAInstall } from "@/components/pwa-install"
import { SettingsPanel } from "@/components/settings-panel"
import { StructuredData, WebSiteStructuredData } from "@/components/seo-structured-data"
import { EmptyState } from "@/components/empty-state"
import { OnboardingModal } from "@/components/onboarding-modal"
import { AddCategoryDialog } from "@/components/add-category-dialog"
import { AddBookmarkWithCategoryDialog } from "@/components/add-bookmark-with-category-dialog"
import { Sheet, SheetContent } from "@/components/ui/sheet"

import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useSmartRecommendations } from "@/hooks/use-smart-recommendations"
import { useResponsiveLayout, useDisplaySettings } from "@/hooks/use-display-settings"
import { logger } from "@/lib/logger"
import { DEFAULT_SEARCH_FILTERS, type SearchFilters } from "@/lib/search-utils"

function readInitialNavParams() {
  if (typeof window === 'undefined') return { category: null, sub: null, q: "" }
  const params = new URLSearchParams(window.location.search)
  return {
    category: params.get('category'),
    sub: params.get('sub'),
    q: params.get('q') ?? "",
  }
}

export default function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [searchFilters, setSearchFilters] = useState<SearchFilters>(DEFAULT_SEARCH_FILTERS)
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false)

  const { categories, bookmarks, initializeStore, hasHydrated, setHasHydrated, refreshCoverImages } = useBookmarkStore()
  const { trackActivity } = useSmartRecommendations()
  const displaySettings = useDisplaySettings()

  // 使用响应式布局 Hook
  const { breakpoint, windowSize } = useResponsiveLayout()

  useEffect(() => {
    initializeStore()
    // 标记用户已访问过dashboard
    localStorage.setItem('hasVisitedDashboard', 'true')
  }, [initializeStore])

  // 首次水合后从 URL 读初始导航状态（在挂载后做一次，避免 SSR/水合分歧）
  const urlBootstrapped = useRef(false)
  useEffect(() => {
    if (!hasHydrated || urlBootstrapped.current) return
    urlBootstrapped.current = true
    const init = readInitialNavParams()
    if (init.category) setSelectedCategory(init.category)
    if (init.sub) setSelectedSubCategory(init.sub)
    if (init.q) setSearchQuery(init.q)
  }, [hasHydrated])

  // state → URL：用 history.replaceState 同步，避免堆历史栈、避免触发 Next 路由刷新
  useEffect(() => {
    if (!hasHydrated || !urlBootstrapped.current) return
    const params = new URLSearchParams()
    if (selectedCategory) params.set('category', selectedCategory)
    if (selectedSubCategory) params.set('sub', selectedSubCategory)
    if (searchQuery) params.set('q', searchQuery)
    const next = params.toString()
    const current = window.location.search.replace(/^\?/, '')
    if (next === current) return
    const url = next ? `${window.location.pathname}?${next}` : window.location.pathname
    window.history.replaceState(window.history.state, '', url)
  }, [selectedCategory, selectedSubCategory, searchQuery, hasHydrated])

  // 浏览器前进/后退（popstate）→ state
  useEffect(() => {
    const handler = () => {
      const next = readInitialNavParams()
      setSelectedCategory(next.category)
      setSelectedSubCategory(next.sub)
      setSearchQuery(next.q)
    }
    window.addEventListener('popstate', handler)
    return () => window.removeEventListener('popstate', handler)
  }, [])

  // 全局快捷键：/ 聚焦搜索，N 新建书签
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null
      const tag = target?.tagName
      const isTyping =
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT' ||
        target?.isContentEditable === true
      if (isTyping) return
      if (e.ctrlKey || e.metaKey || e.altKey) return

      if (e.key === '/') {
        const input = document.querySelector<HTMLInputElement>('input[data-search-input]')
        if (input) {
          e.preventDefault()
          input.focus()
          input.select()
        }
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault()
        setAddBookmarkOpen(true)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  // 🔧 使用ref跟踪上一次的封面图开关状态
  const prevShowCover = useRef<boolean>(false)

  // 🔧 独立的useEffect监听封面图开关变化 - 移除循环依赖
  useEffect(() => {
    // 避免初始化时触发
    if (!hasHydrated) return

    const currentShowCover = displaySettings.settings.showCover
    const wasOff = !prevShowCover.current
    const nowOn = currentShowCover

    // 更新ref
    prevShowCover.current = currentShowCover

    // 只在从关闭变为打开时触发
    if (wasOff && nowOn) {
      logger.debug('🖼️ 检测到封面图开关从关闭变为打开，将在后台刷新缺失的封面图...')

      // 🔧 完全异步处理，不阻塞UI - 使用当前状态快照避免循环
      const processInBackground = async () => {
        try {
          // 获取当前状态快照，避免依赖bookmarks
          const currentBookmarks = useBookmarkStore.getState().bookmarks
          const bookmarksNeedingCovers = currentBookmarks.filter(bookmark =>
            !bookmark.coverImage || bookmark.coverImage.includes('/api/screenshot')
          )

          if (bookmarksNeedingCovers.length > 0) {
            logger.debug(`🖼️ 找到 ${bookmarksNeedingCovers.length} 个需要刷新封面图的书签，开始后台处理...`)
            await useBookmarkStore.getState().refreshCoverImages(bookmarksNeedingCovers.map(b => b.id))
          } else {
            logger.debug('✅ 所有书签都已有封面图，无需刷新')
          }
        } catch (error) {
          logger.warn('后台刷新封面图时出错:', error)
        }
      }

      // 延迟执行，确保UI完全更新
      setTimeout(processInBackground, 300)
    }
  }, [displaySettings.settings.showCover, hasHydrated]) // 移除bookmarks和refreshCoverImages依赖

  // 在客户端挂载后标记水合完成（避免在hook中再嵌套hook导致错误）
  useEffect(() => {
    const t = setTimeout(() => setHasHydrated(true), 0)
    return () => clearTimeout(t)
  }, [setHasHydrated])

  // 处理书签点击，记录用户活动
  const handleBookmarkClick = (bookmarkId: string) => {
    trackActivity(bookmarkId, 'view')
  }

  // 当点击分类时，设置对应的分类和子分类
  const handleSubCategorySelect = (categoryOrSubCategoryId: string) => {
    // 首先检查是否是一级分类ID
    const category = categories.find(cat => cat.id === categoryOrSubCategoryId)

    if (category) {
      // 如果是一级分类，设置为选中该分类，不选择具体子分类
      setSelectedCategory(category.id)
      setSelectedSubCategory(null)
    } else {
      // 如果是子分类ID，按原逻辑处理
      setSelectedSubCategory(categoryOrSubCategoryId)
      // 找到对应的一级分类
      const parentCategory = categories.find(cat =>
        cat.subCategories.some(sub => sub.id === categoryOrSubCategoryId)
      )
      if (parentCategory) {
        setSelectedCategory(parentCategory.id)
      }
    }
  }

  // 返回首页（清除选择）
  const handleBackToHome = () => {
    setSelectedCategory(null)
    setSelectedSubCategory(null)
    setSearchQuery("")
  }

  const isEmpty = categories.length === 0 || categories.every(cat => cat.subCategories.length === 0)
  const [showOnboarding, setShowOnboarding] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if (localStorage.getItem('showOnboarding') === 'true') {
        setShowOnboarding(true)
        localStorage.removeItem('showOnboarding')
      }
    }
  }, [])

	  // 如果还未完成水合，则先不渲染主体，避免看到空态闪烁
	  if (!hasHydrated) {
	    return <div className="min-h-screen bg-background" />
	  }
  return (
    <div className="min-h-screen bg-background">
      {/* SEO 结构化数据 */}
      <WebSiteStructuredData />
      <StructuredData type="homepage" />

      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        searchFilters={searchFilters}
        onSearchFiltersChange={setSearchFilters}
        onLogoClick={handleBackToHome}
        onSettingsClick={() => setSettingsPanelOpen(true)}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        onMobileMenuClick={breakpoint === 'mobile' ? () => setMobileSidebarOpen(true) : undefined}
      />

      <div className="flex">
        {breakpoint === 'mobile' ? (
          <Sheet open={mobileSidebarOpen} onOpenChange={setMobileSidebarOpen}>
            <SheetContent side="left" className="p-0 w-64 max-w-[85vw]">
              <Sidebar
                collapsed={false}
                onToggleCollapse={() => setMobileSidebarOpen(false)}
                selectedCategory={selectedCategory}
                selectedSubCategory={selectedSubCategory}
                onCategorySelect={(categoryId, subCategoryId) => {
                  setSelectedCategory(categoryId)
                  setSelectedSubCategory(subCategoryId || null)
                  setSearchQuery("")
                  setMobileSidebarOpen(false)
                }}
              />
            </SheetContent>
          </Sheet>
        ) : (
          <Sidebar
            collapsed={sidebarCollapsed}
            onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onCategorySelect={(categoryId, subCategoryId) => {
              setSelectedCategory(categoryId)
              setSelectedSubCategory(subCategoryId || null)
              setSearchQuery("") // Clear search when navigating
            }}
          />
        )}

        {isEmpty ? (() => {
          // 细分空态：无一级分类 / 有一级无二级 / 有分类但无书签
          const noPrimary = categories.length === 0
          const totalSub = categories.reduce((sum, c) => sum + c.subCategories.length, 0)
          const variant = noPrimary ? 'noCategories' : (totalSub === 0 ? 'noSubcategories' : 'noBookmarks')
          return (
            <EmptyState
              variant={variant as any}
              onCreateCategory={() => setAddCategoryOpen(true)}
              onCreateSubCategory={() => {
                // 打开创建分类对话框并默认切换到二级（用户会选择父分类）
                setAddCategoryOpen(true)
              }}
              onAddBookmark={() => setAddBookmarkOpen(true)}
              onImport={() => {
                if (typeof window !== 'undefined') {
                  window.dispatchEvent(new CustomEvent('open-import-dialog'))
                }
              }}
            />
          )
        })() : (
          <EnhancedMainContent
            searchQuery={searchQuery}
            searchFilters={searchFilters}
            onCategorySelectFromSearch={(categoryId) => {
              setSelectedCategory(categoryId)
              setSelectedSubCategory(null)
              setSearchQuery("")
            }}
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onSubCategorySelect={handleSubCategorySelect}
            onCategorySelect={(categoryId, subCategoryId) => {
              setSelectedCategory(categoryId)
              setSelectedSubCategory(subCategoryId ?? null)
            }}
          />
        )}
      </div>

      {/* Onboarding 弹窗 */}
      <OnboardingModal
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        onCreateCategory={() => setAddCategoryOpen(true)}
        onAddBookmark={() => setAddBookmarkOpen(true)}
        onImport={() => {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('open-import-dialog'))
          }
        }}
      />

      {/* 对话框：添加分类、添加书签 */}
      <AddCategoryDialog open={addCategoryOpen} onOpenChange={setAddCategoryOpen} />
      <AddBookmarkWithCategoryDialog open={addBookmarkOpen} onOpenChange={setAddBookmarkOpen} defaultSubCategoryId={(() => {
        // 如果系统没有任何子分类，默认选择“未分类”占位
        const hasSub = categories.some(c => c.subCategories.length > 0)
        return hasSub ? undefined : 'uncategorized'
      })()} />

      {/* PWA 安装组件 */}
      <PWAInstall />

      {/* 设置面板 */}
      <SettingsPanel
        isOpen={settingsPanelOpen}
        onToggle={() => setSettingsPanelOpen(!settingsPanelOpen)}
      />

    </div>
  )
}
