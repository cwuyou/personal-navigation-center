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

  // Import/Export
  importBookmarks: (data: { categories: Category[]; bookmarks: Bookmark[] }) => void
  exportBookmarks: () => { categories: Category[]; bookmarks: Bookmark[] }

  // Initialize with default data
  initializeStore: () => void
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

      importBookmarks: async (data) => {
        set((state) => ({
          categories: [...state.categories, ...data.categories],
          bookmarks: [...state.bookmarks, ...data.bookmarks],
        }))
      },

      exportBookmarks: () => {
        const { categories, bookmarks } = get()
        return { categories, bookmarks }
      },

      initializeStore: () => {
        const { categories, bookmarks } = get()
        if (categories.length === 0) {
          set({
            categories: defaultCategories,
            bookmarks: defaultBookmarks,
          })
        }
      },
    }),
    {
      name: "bookmark-store",
      version: 1,
    },
  ),
)
