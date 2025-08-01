"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"
import { getFaviconUrl } from "@/lib/metadata-fetcher"
import { backgroundEnhancer, type EnhancementProgress } from "@/lib/background-metadata-enhancer"

interface Category {
  id: string
  name: string
  subCategories: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  parentId: string
}

interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  coverImage?: string  // 封面图片URL
  tags?: string[]      // 标签
  subCategoryId: string
  createdAt: Date
}

interface BookmarkStore {
  categories: Category[]
  bookmarks: Bookmark[]
  enhancementProgress: EnhancementProgress | null

  // Category actions
  addCategory: (name: string) => void
  updateCategory: (id: string, name: string) => void
  deleteCategory: (id: string) => void

  // SubCategory actions
  addSubCategory: (parentId: string, name: string) => void
  updateSubCategory: (id: string, name: string) => void
  deleteSubCategory: (id: string) => void

  // Bookmark actions
  addBookmark: (bookmark: Omit<Bookmark, "id" | "createdAt">) => void
  updateBookmark: (id: string, updates: Partial<Bookmark>) => void
  deleteBookmark: (id: string) => void
  moveBookmark: (bookmarkId: string, targetSubCategoryId: string) => void
  moveBookmarks: (bookmarkIds: string[], targetSubCategoryId: string) => void

  // Import/Export
  importBookmarks: (data: { categories: Category[]; bookmarks: Bookmark[] }, options?: { enableBackgroundEnhancement?: boolean }) => Promise<{
    newCategories: number
    newSubCategories: number
    newBookmarks: number
    skippedBookmarks: number
  }>
  exportBookmarks: () => { categories: Category[]; bookmarks: Bookmark[] }

  // Automatic enhancement (triggered after import)
  startBackgroundEnhancement: (bookmarkIds?: string[]) => Promise<void>
  stopBackgroundEnhancement: () => void
  getEnhancementStats: () => { totalSites: number, categories: string[] }

  // Initialize with default data
  initializeStore: () => void
  resetStore: () => void
}

const defaultCategories: Category[] = [
  {
    id: "dev-tools",
    name: "开发工具",
    subCategories: [
      { id: "code-editors", name: "代码编辑器", parentId: "dev-tools" },
      { id: "version-control", name: "版本控制", parentId: "dev-tools" },
      { id: "api-tools", name: "API工具", parentId: "dev-tools" },
    ],
  },
  {
    id: "learning",
    name: "学习资源",
    subCategories: [
      { id: "documentation", name: "技术文档", parentId: "learning" },
      { id: "tutorials", name: "教程网站", parentId: "learning" },
      { id: "communities", name: "技术社区", parentId: "learning" },
    ],
  },
  {
    id: "productivity",
    name: "效率工具",
    subCategories: [
      { id: "design", name: "设计工具", parentId: "productivity" },
      { id: "project-management", name: "项目管理", parentId: "productivity" },
      { id: "utilities", name: "实用工具", parentId: "productivity" },
    ],
  },
]

const defaultBookmarks: Bookmark[] = [
  {
    id: "vscode",
    title: "Visual Studio Code",
    url: "https://code.visualstudio.com/",
    description: "微软开发的免费代码编辑器",
    subCategoryId: "code-editors",
    createdAt: new Date(),
  },
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/",
    description: "全球最大的代码托管平台",
    subCategoryId: "version-control",
    createdAt: new Date(),
  },
  {
    id: "postman",
    title: "Postman",
    url: "https://www.postman.com/",
    description: "API开发和测试工具",
    subCategoryId: "api-tools",
    createdAt: new Date(),
  },
  {
    id: "mdn",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    description: "Web开发权威文档",
    subCategoryId: "documentation",
    createdAt: new Date(),
  },
  {
    id: "stackoverflow",
    title: "Stack Overflow",
    url: "https://stackoverflow.com/",
    description: "程序员问答社区",
    subCategoryId: "communities",
    createdAt: new Date(),
  },
  {
    id: "figma",
    title: "Figma",
    url: "https://www.figma.com/",
    description: "在线协作设计工具",
    subCategoryId: "design",
    createdAt: new Date(),
  },
]

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      categories: [],
      bookmarks: [],
      enhancementProgress: null,

      addCategory: (name: string) => {
        const newCategory: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          subCategories: [],
        }
        set((state) => ({
          categories: [...state.categories, newCategory],
        }))
      },

      updateCategory: (id: string, name: string) => {
        set((state) => ({
          categories: state.categories.map((cat) => (cat.id === id ? { ...cat, name } : cat)),
        }))
      },

      deleteCategory: (id: string) => {
        set((state) => {
          const category = state.categories.find((cat) => cat.id === id)
          if (!category) return state

          const subCategoryIds = category.subCategories.map((sub) => sub.id)

          return {
            categories: state.categories.filter((cat) => cat.id !== id),
            bookmarks: state.bookmarks.filter((bookmark) => !subCategoryIds.includes(bookmark.subCategoryId)),
          }
        })
      },

      addSubCategory: (parentId: string, name: string) => {
        const newSubCategory: SubCategory = {
          id: `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          parentId,
        }

        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === parentId ? { ...cat, subCategories: [...cat.subCategories, newSubCategory] } : cat,
          ),
        }))
      },

      updateSubCategory: (id: string, name: string) => {
        set((state) => ({
          categories: state.categories.map((cat) => ({
            ...cat,
            subCategories: cat.subCategories.map((sub) => (sub.id === id ? { ...sub, name } : sub)),
          })),
        }))
      },

      deleteSubCategory: (id: string) => {
        set((state) => ({
          categories: state.categories.map((cat) => ({
            ...cat,
            subCategories: cat.subCategories.filter((sub) => sub.id !== id),
          })),
          bookmarks: state.bookmarks.filter((bookmark) => bookmark.subCategoryId !== id),
        }))
      },

      addBookmark: (bookmark) => {
        const newBookmark: Bookmark = {
          ...bookmark,
          id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        }

        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
        }))
      },

      updateBookmark: (id: string, updates) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) => (bookmark.id === id ? { ...bookmark, ...updates } : bookmark)),
        }))
      },

      deleteBookmark: (id: string) => {
        set((state) => ({
          bookmarks: state.bookmarks.filter((bookmark) => bookmark.id !== id),
        }))
      },

      moveBookmark: (bookmarkId: string, targetSubCategoryId: string) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmark.id === bookmarkId
              ? { ...bookmark, subCategoryId: targetSubCategoryId }
              : bookmark
          ),
        }))
      },

      moveBookmarks: (bookmarkIds: string[], targetSubCategoryId: string) => {
        set((state) => ({
          bookmarks: state.bookmarks.map((bookmark) =>
            bookmarkIds.includes(bookmark.id)
              ? { ...bookmark, subCategoryId: targetSubCategoryId }
              : bookmark
          ),
        }))
      },

      importBookmarks: async (data, options: { enableBackgroundEnhancement?: boolean } = {}) => {
        const { enableBackgroundEnhancement = true } = options
        const { categories: existingCategories, bookmarks: existingBookmarks } = get()

        console.log(`🚀 开始快速导入 ${data.bookmarks.length} 个书签...`)
        const startTime = Date.now()

        // 统计信息
        let newCategories = 0
        let newSubCategories = 0
        let newBookmarks = 0
        let skippedBookmarks = 0

        // 用于存储新创建的分类和子分类的映射
        const categoryMapping = new Map<string, string>() // 旧ID -> 新ID
        const subCategoryMapping = new Map<string, string>() // 旧ID -> 新ID

        // 处理分类：检查是否已存在同名分类
        data.categories.forEach((newCategory: any) => {
          const existingCategory = existingCategories.find(
            cat => cat.name.toLowerCase() === newCategory.name.toLowerCase()
          )

          if (existingCategory) {
            // 分类已存在，使用现有分类ID
            categoryMapping.set(newCategory.id, existingCategory.id)

            // 处理子分类
            newCategory.subCategories.forEach((newSubCategory: any) => {
              const existingSubCategory = existingCategory.subCategories.find(
                sub => sub.name.toLowerCase() === newSubCategory.name.toLowerCase()
              )

              if (existingSubCategory) {
                // 子分类已存在，使用现有子分类ID
                subCategoryMapping.set(newSubCategory.id, existingSubCategory.id)
              } else {
                // 子分类不存在，创建新的子分类
                const newSubCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                subCategoryMapping.set(newSubCategory.id, newSubCategoryId)

                existingCategory.subCategories.push({
                  id: newSubCategoryId,
                  name: newSubCategory.name,
                  parentId: existingCategory.id
                })
                newSubCategories++
              }
            })
          } else {
            // 分类不存在，创建新分类
            const newCategoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
            categoryMapping.set(newCategory.id, newCategoryId)

            const newCategoryData = {
              id: newCategoryId,
              name: newCategory.name,
              subCategories: [] as any[]
            }

            // 处理新分类的子分类
            newCategory.subCategories.forEach((newSubCategory: any) => {
              const newSubCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              subCategoryMapping.set(newSubCategory.id, newSubCategoryId)

              newCategoryData.subCategories.push({
                id: newSubCategoryId,
                name: newSubCategory.name,
                parentId: newCategoryId
              })
              newSubCategories++
            })

            existingCategories.push(newCategoryData)
            newCategories++
          }
        })

        // 快速导入书签（只做基本处理）
        const importedBookmarkIds: string[] = []
        data.bookmarks.forEach((newBookmark: any) => {
          const targetSubCategoryId = subCategoryMapping.get(newBookmark.subCategoryId)

          if (targetSubCategoryId) {
            // 检查该子分类下是否已存在相同URL的书签
            const existingBookmark = existingBookmarks.find(
              bookmark => bookmark.subCategoryId === targetSubCategoryId &&
                         bookmark.url.toLowerCase() === newBookmark.url.toLowerCase()
            )

            if (!existingBookmark) {
              // 书签不存在，快速导入
              const newBookmarkId = `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

              existingBookmarks.push({
                ...newBookmark,
                id: newBookmarkId,
                subCategoryId: targetSubCategoryId,
                favicon: newBookmark.favicon || getFaviconUrl(newBookmark.url), // 添加基本favicon
                createdAt: new Date()
              })

              importedBookmarkIds.push(newBookmarkId)
              newBookmarks++
            } else {
              // 书签已存在，跳过
              skippedBookmarks++
            }
          }
        })

        // 更新状态
        set({
          categories: existingCategories,
          bookmarks: existingBookmarks
        })

        const endTime = Date.now()
        const duration = ((endTime - startTime) / 1000).toFixed(1)
        console.log(`✅ 快速导入完成！耗时 ${duration}s，导入了 ${newBookmarks} 个书签`)

        // 如果启用后台增强，异步开始增强过程
        if (enableBackgroundEnhancement && importedBookmarkIds.length > 0) {
          console.log(`🔄 自动启动后台增强服务，将为 ${importedBookmarkIds.length} 个书签获取详细信息...`)

          // 异步启动后台增强（不阻塞返回）
          setTimeout(() => {
            get().startBackgroundEnhancement(importedBookmarkIds)
          }, 500) // 稍微延长一点时间，让用户看到导入完成的反馈
        }

        return {
          newCategories,
          newSubCategories,
          newBookmarks,
          skippedBookmarks
        }
      },

      exportBookmarks: () => {
        const { categories, bookmarks } = get()
        return { categories, bookmarks }
      },

      initializeStore: () => {
        const { categories, bookmarks } = get()

        // 验证数据格式
        const isValidData = categories.every(cat =>
          typeof cat.id === 'string' &&
          typeof cat.name === 'string' &&
          Array.isArray(cat.subCategories) &&
          cat.subCategories.every(sub =>
            typeof sub.id === 'string' &&
            typeof sub.name === 'string' &&
            typeof sub.parentId === 'string'
          )
        )

        if (categories.length === 0 || !isValidData) {
          // 如果数据无效，重置为默认数据
          set({
            categories: defaultCategories,
            bookmarks: defaultBookmarks,
          })
        }
      },

      resetStore: () => {
        set({
          categories: defaultCategories,
          bookmarks: defaultBookmarks,
        })
      },

      // 自动增强相关方法（导入书签后自动触发）
      startBackgroundEnhancement: async (bookmarkIds?: string[]) => {
        const { bookmarks } = get()

        // 确定要增强的书签
        let targetBookmarks = bookmarkIds
          ? bookmarks.filter(bookmark => bookmarkIds.includes(bookmark.id))
          : bookmarks.filter(bookmark => !bookmark.description || bookmark.description.length < 20)

        // 进一步过滤，确保只包含真正需要增强的书签
        // 这样可以确保进度显示的总数与实际处理的数量一致
        targetBookmarks = targetBookmarks.filter(bookmark =>
          !bookmark.description || bookmark.description.length < 20
        )

        if (targetBookmarks.length === 0) {
          console.log('📝 没有需要增强的书签')
          return
        }

        const isAutomatic = !!bookmarkIds
        const actionType = isAutomatic ? '自动' : '批量'
        console.log(`🚀 开始${actionType}增强 ${targetBookmarks.length} 个书签...`)

        try {
          let enhancedCount = 0
          await backgroundEnhancer.enhanceBookmarks(targetBookmarks, {
            onProgress: (progress) => {
              set({ enhancementProgress: progress })
            },
            onUpdate: (bookmarkId, metadata) => {
              // 实时更新书签信息
              set((state) => {
                const updatedBookmarks = state.bookmarks.map(bookmark =>
                  bookmark.id === bookmarkId
                    ? {
                        ...bookmark,
                        title: metadata.title || bookmark.title,
                        description: metadata.description || bookmark.description,
                        favicon: metadata.favicon || bookmark.favicon,
                        coverImage: metadata.coverImage || bookmark.coverImage,  // 更新封面图片
                      }
                    : bookmark
                )

                // 调试日志：检查更新后的书签
                const updatedBookmark = updatedBookmarks.find(b => b.id === bookmarkId)
                if (updatedBookmark) {
                  console.log(`📝 更新书签: ${updatedBookmark.title}`)
                  console.log(`   描述长度: ${updatedBookmark.description?.length || 0}`)
                  console.log(`   封面图片: ${updatedBookmark.coverImage ? '有' : '无'}`)
                  console.log(`   新描述: ${updatedBookmark.description?.substring(0, 50)}...`)
                }

                return { bookmarks: updatedBookmarks }
              })
              enhancedCount++
            },
            batchSize: 8,
            delay: 150
          })

          console.log(`✅ ${actionType}增强完成！成功增强了 ${enhancedCount} 个书签`)

          // 增强完成后，重新检查需要增强的书签数量
          const { bookmarks: updatedBookmarks } = get()
          const remainingBookmarks = updatedBookmarks.filter(
            bookmark => !bookmark.description || bookmark.description.length < 20
          )
          console.log(`📊 增强后统计：还有 ${remainingBookmarks.length} 个书签需要增强`)

          // 如果是自动增强，显示友好的完成提示
          if (isAutomatic && enhancedCount > 0) {
            console.log(`🎉 您的 ${enhancedCount} 个书签现在拥有了详细的描述信息！`)
          }
        } catch (error) {
          console.error(`❌ ${actionType}增强失败:`, error)
        } finally {
          // 清除进度状态
          setTimeout(() => {
            set({ enhancementProgress: null })
          }, 2000)
        }
      },

      stopBackgroundEnhancement: () => {
        backgroundEnhancer.stop()
        set({ enhancementProgress: null })
      },

      getEnhancementStats: () => {
        return backgroundEnhancer.getPresetStats()
      },
    }),
    {
      name: "bookmark-store",
      version: 2, // 增加版本号以强制重置
    },
  ),
)
