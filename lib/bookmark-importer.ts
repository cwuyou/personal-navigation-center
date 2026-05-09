/**
 * 浏览器书签 HTML 解析器
 *
 * 将 Firefox / Chrome / Edge 导出的 bookmarks.html 解析为
 * { categories, bookmarks } 结构,供 useBookmarkStore.importBookmarks 使用。
 *
 * 规则
 * - 书签栏(toolbar)的子文件夹 → 一级分类
 * - 一级分类下的子文件夹      → 二级分类
 * - 更深层文件夹              → 扁平化到所属二级分类,标题前加 "[文件夹名] " 前缀
 * - 一级分类下的裸书签         → 归入"未分组"占位子分类(#2 统一命名)
 *   该子分类**延迟创建**:只有确实有书签要落入时才会出现(#3)
 * - 书签栏下的裸书签          → 归入"未分类书签 / 未分组"(#2)
 */

export interface ParsedSubCategory {
  id: string
  name: string
  parentId: string
}

export interface ParsedCategory {
  id: string
  name: string
  subCategories: ParsedSubCategory[]
}

export interface ParsedBookmark {
  id: string
  title: string
  url: string
  subCategoryId: string
  createdAt: Date
}

export interface ParsedBookmarkData {
  categories: ParsedCategory[]
  bookmarks: ParsedBookmark[]
}

/** 占位子分类名称(供一级分类下的裸书签使用) */
export const FALLBACK_SUBCATEGORY_NAME = "未分组"
/** 占位一级分类名称(供书签栏/根下裸书签使用) */
export const FALLBACK_CATEGORY_NAME = "未分类书签"

const newId = (prefix: "cat" | "sub" | "bm") =>
  `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

const BOOKMARK_BAR_NAMES = new Set([
  "书签栏",
  "书签工具栏",
  "Bookmarks bar",
  "Bookmarks Bar",
  "Bookmarks Toolbar",
])

function isBookmarkBarHeading(h3: Element): boolean {
  if (h3.hasAttribute("PERSONAL_TOOLBAR_FOLDER")) return true
  const name = h3.textContent?.trim() || ""
  return BOOKMARK_BAR_NAMES.has(name)
}

/**
 * 解析浏览器 bookmarks.html。
 * 传入已解析好的 Document(由调用方用 DOMParser 创建),方便测试与复用。
 */
export function parseBookmarkHTML(doc: Document): ParsedBookmarkData {
  const categories: ParsedCategory[] = []
  const bookmarks: ParsedBookmark[] = []

  /** 懒创建:首次需要落书签时才创建占位子分类,避免产生空壳 */
  const getOrCreateFallbackSub = (
    parent: ParsedCategory,
    name: string = FALLBACK_SUBCATEGORY_NAME
  ): string => {
    const existing = parent.subCategories.find((s) => s.name === name)
    if (existing) return existing.id
    const id = newId("sub")
    parent.subCategories.push({ id, name, parentId: parent.id })
    return id
  }

  /** 懒创建顶层"未分类书签"一级分类 */
  const getOrCreateUncategorizedCategory = (): ParsedCategory => {
    const existing = categories.find((c) => c.name === FALLBACK_CATEGORY_NAME)
    if (existing) return existing
    const cat: ParsedCategory = {
      id: newId("cat"),
      name: FALLBACK_CATEGORY_NAME,
      subCategories: [],
    }
    categories.push(cat)
    return cat
  }

  const pushBookmark = (a: Element, subCategoryId: string, titlePrefix = "") => {
    const title = a.textContent?.trim() || "Unnamed Bookmark"
    const url = a.getAttribute("href") || ""
    if (!url) return
    bookmarks.push({
      id: newId("bm"),
      title: titlePrefix + title,
      url,
      subCategoryId,
      createdAt: new Date(),
    })
  }

  /** 三级及以下文件夹:扁平化并加前缀,汇入所属二级分类 */
  const flattenDeepFolder = (
    element: Element,
    subCategoryId: string,
    prefix: string
  ): void => {
    const dl = element.querySelector(":scope > dl")
    if (!dl) return
    dl.querySelectorAll(":scope > dt").forEach((dt) => {
      const h3 = dt.querySelector(":scope > h3")
      const a = dt.querySelector(":scope > a")
      if (a) {
        pushBookmark(a, subCategoryId, prefix)
      } else if (h3) {
        const deepName = h3.textContent?.trim() || "Unnamed Folder"
        flattenDeepFolder(dt, subCategoryId, `${prefix}[${deepName}] `)
      }
    })
  }

  /** 二级分类内部:书签直接挂入,更深层文件夹扁平化 */
  const parseSubFolder = (element: Element, subCategoryId: string): void => {
    const dl = element.querySelector(":scope > dl")
    if (!dl) return
    dl.querySelectorAll(":scope > dt").forEach((dt) => {
      const a = dt.querySelector(":scope > a")
      const h3 = dt.querySelector(":scope > h3")
      if (a) {
        pushBookmark(a, subCategoryId)
      } else if (h3) {
        const deepName = h3.textContent?.trim() || "Unnamed Folder"
        flattenDeepFolder(dt, subCategoryId, `[${deepName}] `)
      }
    })
  }

  /** 一级分类的 DT:拆出子文件夹(→二级分类)与裸书签(→未分组) */
  const parseCategoryContent = (element: Element, category: ParsedCategory): void => {
    const dl = element.querySelector(":scope > dl")
    if (!dl) return
    dl.querySelectorAll(":scope > dt").forEach((dt) => {
      const h3 = dt.querySelector(":scope > h3")
      const a = dt.querySelector(":scope > a")
      if (h3) {
        const subId = newId("sub")
        category.subCategories.push({
          id: subId,
          name: h3.textContent?.trim() || "Unnamed Folder",
          parentId: category.id,
        })
        parseSubFolder(dt, subId)
      } else if (a) {
        // 延迟创建"未分组"子分类:只有实际遇到裸书签时才创建
        const fallbackId = getOrCreateFallbackSub(category)
        pushBookmark(a, fallbackId)
      }
    })
  }

  /** 书签栏:子文件夹升级为一级分类,裸书签落入"未分类书签/未分组" */
  const parseBookmarkBar = (element: Element): void => {
    const dl = element.querySelector(":scope > dl")
    if (!dl) return
    dl.querySelectorAll(":scope > dt").forEach((dt) => {
      const h3 = dt.querySelector(":scope > h3")
      const a = dt.querySelector(":scope > a")
      if (h3) {
        const cat: ParsedCategory = {
          id: newId("cat"),
          name: h3.textContent?.trim() || "Unnamed Category",
          subCategories: [],
        }
        categories.push(cat)
        parseCategoryContent(dt, cat)
      } else if (a) {
        const uncategorized = getOrCreateUncategorizedCategory()
        const fallbackId = getOrCreateFallbackSub(uncategorized)
        pushBookmark(a, fallbackId)
      }
    })
  }

  /** 顶层 DT:可能是书签栏、一级分类,或直接书签 */
  const parseTopLevel = (dt: Element): void => {
    const h3 = dt.querySelector(":scope > h3")
    const a = dt.querySelector(":scope > a")
    if (h3) {
      if (isBookmarkBarHeading(h3)) {
        parseBookmarkBar(dt)
      } else {
        const cat: ParsedCategory = {
          id: newId("cat"),
          name: h3.textContent?.trim() || "Unnamed Category",
          subCategories: [],
        }
        categories.push(cat)
        parseCategoryContent(dt, cat)
      }
    } else if (a) {
      // 非标准结构:根下直接挂书签
      const uncategorized = getOrCreateUncategorizedCategory()
      const fallbackId = getOrCreateFallbackSub(uncategorized)
      pushBookmark(a, fallbackId)
    }
  }

  // 定位根 DL:优先 <h1> 后的第一个 DL(标准格式),否则回退第一个 DL
  let rootDl: Element | null = null
  const h1 = doc.querySelector("h1")
  if (h1) {
    let sibling: Element | null = h1.nextElementSibling
    while (sibling && sibling.tagName !== "DL") {
      sibling = sibling.nextElementSibling
    }
    rootDl = sibling
  }
  if (!rootDl) {
    rootDl = doc.querySelector("dl")
  }

  if (rootDl) {
    rootDl
      .querySelectorAll(":scope > dt")
      .forEach((dt) => parseTopLevel(dt))
  }

  return { categories, bookmarks }
}
