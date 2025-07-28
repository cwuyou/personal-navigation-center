"use client"

import { useState, useEffect } from "react"
import { Header } from "@/components/header"
import { Sidebar } from "@/components/sidebar"
import { MainContent } from "@/components/main-content"
import { PWAInstall } from "@/components/pwa-install"
import { SettingsPanel } from "@/components/settings-panel"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useSmartRecommendations } from "@/hooks/use-smart-recommendations"

export default function HomePage() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)
  const [settingsPanelOpen, setSettingsPanelOpen] = useState(false)

  const { categories, bookmarks, initializeStore } = useBookmarkStore()
  const { trackActivity } = useSmartRecommendations()

  useEffect(() => {
    initializeStore()
  }, [initializeStore])

  // 处理书签点击，记录用户活动
  const handleBookmarkClick = (bookmarkId: string) => {
    trackActivity(bookmarkId, 'view')
  }

  // 当点击二级分类时，设置对应的一级分类
  const handleSubCategorySelect = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId)
    // 找到对应的一级分类
    const category = categories.find(cat =>
      cat.subCategories.some(sub => sub.id === subCategoryId)
    )
    if (category) {
      setSelectedCategory(category.id)
    }
  }

  // 返回首页（清除选择）
  const handleBackToHome = () => {
    setSelectedCategory(null)
    setSelectedSubCategory(null)
    setSearchQuery("")
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onLogoClick={handleBackToHome}
        onSettingsClick={() => setSettingsPanelOpen(true)}
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

        <MainContent
          searchQuery={searchQuery}
          selectedCategory={selectedCategory}
          selectedSubCategory={selectedSubCategory}
          onSubCategorySelect={handleSubCategorySelect}
          sidebarCollapsed={sidebarCollapsed}
        />
      </div>

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
