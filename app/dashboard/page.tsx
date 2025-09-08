"use client"

import { useState, useEffect, useRef } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { EnhancedMainContent } from "@/components/enhanced-main-content"
import { PWAInstall } from "@/components/pwa-install"
import { SettingsPanel } from "@/components/settings-panel"
import { EnhancementProgress } from "@/components/enhancement-progress"
import { StructuredData, WebSiteStructuredData } from "@/components/seo-structured-data"
import { EmptyState } from "@/components/empty-state"
import { OnboardingModal } from "@/components/onboarding-modal"
import { AddCategoryDialog } from "@/components/add-category-dialog"
import { AddBookmarkWithCategoryDialog } from "@/components/add-bookmark-with-category-dialog"

import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useSmartRecommendations } from "@/hooks/use-smart-recommendations"
import { useResponsiveLayout, useDisplaySettings } from "@/hooks/use-display-settings"
import { logger } from "@/lib/logger"

export default function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)

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

  // 🔧 使用ref跟踪上一次的封面图开关状态
  const prevShowCover = useRef<boolean>(false)

  // 🔧 独立的useEffect监听封面图开关变化
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

      // 🔧 完全异步处理，不阻塞UI
      const processInBackground = async () => {
        try {
          const bookmarksNeedingCovers = bookmarks.filter(bookmark =>
            !bookmark.coverImage || bookmark.coverImage.includes('/api/screenshot')
          )

          if (bookmarksNeedingCovers.length > 0) {
            logger.debug(`🖼️ 找到 ${bookmarksNeedingCovers.length} 个需要刷新封面图的书签，开始后台处理...`)
            await refreshCoverImages(bookmarksNeedingCovers.map(b => b.id))
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
  }, [displaySettings.settings.showCover, hasHydrated, bookmarks, refreshCoverImages])

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

  // 控制新增分类/书签对话框
  const [addCategoryOpen, setAddCategoryOpen] = useState(false)
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false)


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
        onLogoClick={handleBackToHome}
        onSettingsClick={() => setSettingsPanelOpen(true)}
        selectedSubCategory={selectedSubCategory}
      />

      <div className="flex">
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
            selectedCategory={selectedCategory}
            selectedSubCategory={selectedSubCategory}
            onSubCategorySelect={handleSubCategorySelect}
            sidebarCollapsed={sidebarCollapsed}
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

      {/* 后台增强进度 */}
      <EnhancementProgress />
    </div>
  )
}
