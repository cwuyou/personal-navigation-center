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
  isEnhancing: boolean

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
  clearAllData: () => void
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
  // 开发工具 - 代码编辑器
  {
    id: "vscode",
    title: "Visual Studio Code",
    url: "https://code.visualstudio.com/",
    description: "微软开发的免费代码编辑器",
    subCategoryId: "code-editors",
    createdAt: new Date(),
  },
  {
    id: "webstorm",
    title: "WebStorm",
    url: "https://www.jetbrains.com/webstorm/",
    description: "JetBrains出品的专业Web开发IDE",
    subCategoryId: "code-editors",
    createdAt: new Date(),
  },

  // 开发工具 - 版本控制
  {
    id: "github",
    title: "GitHub",
    url: "https://github.com/",
    description: "全球最大的代码托管平台",
    subCategoryId: "version-control",
    createdAt: new Date(),
  },
  {
    id: "gitlab",
    title: "GitLab",
    url: "https://gitlab.com/",
    description: "完整的DevOps平台",
    subCategoryId: "version-control",
    createdAt: new Date(),
  },

  // 开发工具 - API工具
  {
    id: "postman",
    title: "Postman",
    url: "https://www.postman.com/",
    description: "API开发和测试工具",
    subCategoryId: "api-tools",
    createdAt: new Date(),
  },
  {
    id: "insomnia",
    title: "Insomnia",
    url: "https://insomnia.rest/",
    description: "简洁的API客户端工具",
    subCategoryId: "api-tools",
    createdAt: new Date(),
  },

  // 学习资源 - 技术文档
  {
    id: "mdn",
    title: "MDN Web Docs",
    url: "https://developer.mozilla.org/",
    description: "Web开发权威文档",
    subCategoryId: "documentation",
    createdAt: new Date(),
  },
  {
    id: "react-docs",
    title: "React 官方文档",
    url: "https://react.dev/",
    description: "React框架官方文档",
    subCategoryId: "documentation",
    createdAt: new Date(),
  },

  // 学习资源 - 教程网站
  {
    id: "freecodecamp",
    title: "freeCodeCamp",
    url: "https://www.freecodecamp.org/",
    description: "免费编程学习平台",
    subCategoryId: "tutorials",
    createdAt: new Date(),
  },
  {
    id: "codecademy",
    title: "Codecademy",
    url: "https://www.codecademy.com/",
    description: "交互式编程学习平台",
    subCategoryId: "tutorials",
    createdAt: new Date(),
  },

  // 学习资源 - 技术社区
  {
    id: "stackoverflow",
    title: "Stack Overflow",
    url: "https://stackoverflow.com/",
    description: "程序员问答社区",
    subCategoryId: "communities",
    createdAt: new Date(),
  },
  {
    id: "dev-to",
    title: "DEV Community",
    url: "https://dev.to/",
    description: "开发者技术分享社区",
    subCategoryId: "communities",
    createdAt: new Date(),
  },

  // 效率工具 - 设计工具
  {
    id: "figma",
    title: "Figma",
    url: "https://www.figma.com/",
    description: "在线协作设计工具",
    subCategoryId: "design",
    createdAt: new Date(),
  },
  {
    id: "canva",
    title: "Canva",
    url: "https://www.canva.com/",
    description: "简单易用的在线设计平台",
    subCategoryId: "design",
    createdAt: new Date(),
  },

  // 效率工具 - 项目管理
  {
    id: "notion",
    title: "Notion",
    url: "https://www.notion.so/",
    description: "全能的工作空间和笔记工具",
    subCategoryId: "project-management",
    createdAt: new Date(),
  },
  {
    id: "trello",
    title: "Trello",
    url: "https://trello.com/",
    description: "简单直观的项目管理工具",
    subCategoryId: "project-management",
    createdAt: new Date(),
  },

  // 效率工具 - 实用工具
  {
    id: "regex101",
    title: "Regex101",
    url: "https://regex101.com/",
    description: "在线正则表达式测试工具",
    subCategoryId: "utilities",
    createdAt: new Date(),
  },
  {
    id: "jsonformatter",
    title: "JSON Formatter",
    url: "https://jsonformatter.curiousconcept.com/",
    description: "JSON格式化和验证工具",
    subCategoryId: "utilities",
    createdAt: new Date(),
  },
]

export const useBookmarkStore = create<BookmarkStore>()(
  persist(
    (set, get) => ({
      categories: [],
      bookmarks: [],
      enhancementProgress: null,
      isEnhancing: false,

      addCategory: (name: string) => {
        const newCategory: Category = {
          id: `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          name,
          subCategories: [],
        }
        // 用户开始添加数据，清除清空标志
        if (typeof window !== 'undefined') {
          localStorage.removeItem('data-cleared')
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

      addBookmark: async (bookmark) => {
        const newBookmark: Bookmark = {
          ...bookmark,
          id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date(),
        }

        // 用户开始添加数据，清除清空标志
        if (typeof window !== 'undefined') {
          localStorage.removeItem('data-cleared')
        }
        // 先添加书签到状态
        set((state) => ({
          bookmarks: [...state.bookmarks, newBookmark],
        }))

        // 🔧 新增：单个书签添加时调用API增强
        try {
          console.log('🔄 单个书签添加，开始增强...')
          const { BackgroundMetadataEnhancer } = await import('../lib/background-metadata-enhancer')
          const backgroundEnhancer = new BackgroundMetadataEnhancer()
          const metadata = await backgroundEnhancer.enhanceSingleBookmark({
            id: newBookmark.id,
            url: newBookmark.url,
            title: newBookmark.title,
            description: newBookmark.description
          })

          if (metadata) {
            console.log('✅ 单个书签增强成功:', metadata.description?.substring(0, 50))
            // 更新书签的元数据
            set((state) => ({
              bookmarks: state.bookmarks.map(bm =>
                bm.id === newBookmark.id
                  ? {
                      ...bm,
                      description: metadata.description || bm.description,
                      favicon: metadata.favicon || bm.favicon,
                      coverImage: metadata.coverImage || bm.coverImage
                    }
                  : bm
              )
            }))
          }
        } catch (error) {
          console.warn('单个书签增强失败，使用基本信息:', error)
          // 增强失败不影响书签添加
        }
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

        // 检查用户是否主动清空了数据
        const isDataCleared = typeof window !== 'undefined' && localStorage.getItem('data-cleared') === 'true'
        if (isDataCleared) {
          return
        }

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
        // 清除清空标志，因为我们要重置为默认数据
        if (typeof window !== 'undefined') {
          localStorage.removeItem('data-cleared')
        }
        set({
          categories: defaultCategories,
          bookmarks: defaultBookmarks,
        })
      },

      clearAllData: () => {
        // 设置清空标志
        if (typeof window !== 'undefined') {
          localStorage.setItem('data-cleared', 'true')
        }
        set({
          categories: [],
          bookmarks: [],
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

        // 标记增强开始，防止触发同步
        if (isAutomatic) {
          console.log('🔄 标记自动增强开始，暂停同步检测')
          set({ isEnhancing: true })
        }

        try {
          let enhancedCount = 0
          await backgroundEnhancer.enhanceBookmarks(targetBookmarks, {
            onProgress: (progress) => {
              set({ enhancementProgress: progress })
            },
            onUpdate: (bookmarkId, metadata) => {
              // 实时更新书签信息，确保增强状态保持
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

                // 确保增强状态保持不变，防止触发同步
                return {
                  bookmarks: updatedBookmarks,
                  isEnhancing: state.isEnhancing  // 明确保持增强状态
                }
              })
              enhancedCount++
            }
            // 配置将自动根据书签数量优化
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
          // 清除进度状态和增强状态
          setTimeout(() => {
            set({ enhancementProgress: null, isEnhancing: false })
            console.log('🔄 增强完成')

            // 🔧 移除同步相关代码，改为纯本地存储
            if (isAutomatic) {
              console.log('🔄 自动增强完成，数据已保存到本地存储')
            }
          }, 2000)
        }
      },

      stopBackgroundEnhancement: () => {
        backgroundEnhancer.stop()
        set({ enhancementProgress: null, isEnhancing: false })
        console.log('🔄 增强停止')
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
