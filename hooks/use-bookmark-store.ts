"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

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
  importBookmarks: (data: { categories: Category[]; bookmarks: Bookmark[] }) => Promise<{
    newCategories: number
    newSubCategories: number
    newBookmarks: number
    skippedBookmarks: number
  }>
  exportBookmarks: () => { categories: Category[]; bookmarks: Bookmark[] }

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

      importBookmarks: async (data) => {
        return new Promise((resolve) => {
          set((state) => {
            const existingCategories = [...state.categories]
            const existingBookmarks = [...state.bookmarks]

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

            // 处理书签：检查是否已存在相同URL的书签
            data.bookmarks.forEach((newBookmark: any) => {
              const targetSubCategoryId = subCategoryMapping.get(newBookmark.subCategoryId)

              if (targetSubCategoryId) {
                // 检查该子分类下是否已存在相同URL的书签
                const existingBookmark = existingBookmarks.find(
                  bookmark => bookmark.subCategoryId === targetSubCategoryId &&
                             bookmark.url.toLowerCase() === newBookmark.url.toLowerCase()
                )

                if (!existingBookmark) {
                  // 书签不存在，添加新书签
                  const newBookmarkId = `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                  existingBookmarks.push({
                    ...newBookmark,
                    id: newBookmarkId,
                    subCategoryId: targetSubCategoryId,
                    createdAt: new Date()
                  })
                  newBookmarks++
                } else {
                  // 书签已存在，跳过
                  skippedBookmarks++
                }
              }
            })

            // 返回统计信息
            resolve({
              newCategories,
              newSubCategories,
              newBookmarks,
              skippedBookmarks
            })

            return {
              categories: existingCategories,
              bookmarks: existingBookmarks
            }
          })
        })
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
    }),
    {
      name: "bookmark-store",
      version: 2, // 增加版本号以强制重置
    },
  ),
)
