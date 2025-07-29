"use client"

import { useState } from "react"
import { EnhancedMainContent } from "@/components/enhanced-main-content"

export default function DemoPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null)

  const handleSubCategorySelect = (subCategoryId: string) => {
    setSelectedSubCategory(subCategoryId)
    // 如果选择的是一级分类ID，则设置为分类选择
    const isMainCategory = subCategoryId.includes('dev-tools') || subCategoryId.includes('learning') || subCategoryId.includes('productivity')
    if (isMainCategory) {
      setSelectedCategory(subCategoryId)
      setSelectedSubCategory(null)
    }
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold">书签移动功能演示</h1>
            <div className="flex items-center space-x-4">
              <input
                type="text"
                placeholder="搜索书签..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="px-3 py-2 border border-border rounded-md bg-background text-sm w-64"
              />
              <button
                onClick={() => {
                  setSelectedCategory(null)
                  setSelectedSubCategory(null)
                  setSearchQuery("")
                }}
                className="px-3 py-2 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
              >
                返回首页
              </button>
            </div>
          </div>
        </div>
      </div>

      <EnhancedMainContent
        searchQuery={searchQuery}
        selectedCategory={selectedCategory}
        selectedSubCategory={selectedSubCategory}
        onSubCategorySelect={handleSubCategorySelect}
        sidebarCollapsed={false}
      />
    </div>
  )
}
