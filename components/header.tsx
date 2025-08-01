"use client"

import { useState, useRef } from "react"
import { Upload, Info, Menu, Settings, FileText, HelpCircle, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ImportDialog } from "@/components/import-dialog"
import { AboutDialog } from "@/components/about-dialog"

import { ImportHelpDialog } from "@/components/import-help-dialog"
import { EnhancedSearch } from "@/components/enhanced-search"
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useToast } from "@/hooks/use-toast"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onLogoClick?: () => void
  onSettingsClick?: () => void
  selectedSubCategory?: string | null
}

export function Header({ searchQuery, onSearchChange, onLogoClick, onSettingsClick, selectedSubCategory }: HeaderProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importBookmarks, categories } = useBookmarkStore()
  const { toast } = useToast()

  // 获取默认的子分类ID（用于全局添加书签）
  const getDefaultSubCategoryId = () => {
    if (selectedSubCategory) return selectedSubCategory

    // 如果没有选中的子分类，使用第一个可用的子分类
    for (const category of categories) {
      if (category.subCategories.length > 0) {
        return category.subCategories[0].id
      }
    }
    return null
  }

  const processFile = async (file: File) => {
    console.log("开始导入文件:", file.name, file.type)
    setLoading(true)

    try {
      const text = await file.text()
      console.log("文件内容长度:", text.length)

      if (file.name.endsWith(".html")) {
        console.log("导入HTML格式")
        await importFromHTML(text)
      } else if (file.name.endsWith(".json")) {
        console.log("导入JSON格式")
        await importFromJSON(text)
      } else {
        throw new Error("不支持的文件格式")
      }

      console.log("导入成功")
      toast({
        title: "导入成功",
        description: "书签已成功导入到您的导航中心",
      })
    } catch (error) {
      console.error("导入失败:", error)
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "导入过程中发生错误",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (!file) return

    // 检查文件类型
    if (!file.name.endsWith('.html') && !file.name.endsWith('.json')) {
      toast({
        title: "文件格式不支持",
        description: "请选择 HTML 或 JSON 格式的文件",
        variant: "destructive",
      })
      return
    }

    await processFile(file)
  }

  const importFromHTML = async (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const bookmarkData = parseBookmarkHTML(doc)
    console.log("解析HTML得到的数据:", bookmarkData)
    await importBookmarks(bookmarkData, { enableBackgroundEnhancement: true })
  }

  const importFromJSON = async (json: string) => {
    const data = JSON.parse(json)
    console.log("解析JSON得到的数据:", data)
    await importBookmarks(data, { enableBackgroundEnhancement: true })
  }

  const parseBookmarkHTML = (doc: Document) => {
    const categories: any[] = []
    const bookmarks: any[] = []

    // 递归解析书签文件夹结构
    const parseFolder = (element: Element, parentCategoryId?: string, level: number = 0, isBookmarkBar: boolean = false): void => {
      const h3 = element.querySelector(":scope > h3")
      const dl = element.querySelector(":scope > dl")

      if (h3) {
        const folderName = h3.textContent?.trim() || "Unnamed Folder"

        if (isBookmarkBar) {
          // 处理书签栏：其子文件夹成为一级分类，直接书签放入"未分类书签"
          if (dl) {
            const childDts = dl.querySelectorAll(":scope > dt")
            let hasDirectBookmarks = false

            childDts.forEach((childDt) => {
              const childH3 = childDt.querySelector(":scope > h3")
              const childA = childDt.querySelector(":scope > a")

              if (childH3) {
                // 子文件夹，创建为一级分类
                const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
                const category = {
                  id: categoryId,
                  name: childH3.textContent?.trim() || "Unnamed Category",
                  subCategories: [],
                }
                categories.push(category)

                // 递归处理这个文件夹
                parseFolder(childDt, categoryId, 1)
              } else if (childA) {
                // 直接书签，需要放入"未分类书签"分类
                hasDirectBookmarks = true
              }
            })

            // 如果有直接书签，创建"未分类书签"分类
            if (hasDirectBookmarks) {
              const uncategorizedId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              const uncategorizedSubId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

              categories.push({
                id: uncategorizedId,
                name: "未分类书签",
                subCategories: [{
                  id: uncategorizedSubId,
                  name: "默认",
                  parentId: uncategorizedId,
                }],
              })

              // 处理直接书签
              childDts.forEach((childDt) => {
                const childA = childDt.querySelector(":scope > a")
                if (childA) {
                  parseBookmark(childDt, uncategorizedSubId)
                }
              })
            }
          }
        } else if (level === 1 && parentCategoryId) {
          // 一级分类下的处理
          const parentCategory = categories.find(cat => cat.id === parentCategoryId)
          if (!parentCategory) return

          if (dl) {
            const childDts = dl.querySelectorAll(":scope > dt")
            let hasDirectBookmarks = false

            // 先检查是否有直接书签
            childDts.forEach((childDt) => {
              const childA = childDt.querySelector(":scope > a")
              if (childA) {
                hasDirectBookmarks = true
              }
            })

            // 如果有直接书签，创建默认子分类
            if (hasDirectBookmarks) {
              const defaultSubId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
              parentCategory.subCategories.push({
                id: defaultSubId,
                name: "默认",
                parentId: parentCategoryId,
              })

              // 处理直接书签
              childDts.forEach((childDt) => {
                const childA = childDt.querySelector(":scope > a")
                if (childA) {
                  parseBookmark(childDt, defaultSubId)
                }
              })
            }

            // 处理子文件夹
            childDts.forEach((childDt) => {
              const childH3 = childDt.querySelector(":scope > h3")
              if (childH3) {
                const subFolderName = childH3.textContent?.trim() || "Unnamed Folder"
                const subCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

                parentCategory.subCategories.push({
                  id: subCategoryId,
                  name: subFolderName,
                  parentId: parentCategoryId,
                })

                // 递归处理子文件夹内容，包括更深层的文件夹
                parseSubFolder(childDt, subCategoryId, subFolderName)
              }
            })
          }
        }
      } else {
        // 不是文件夹，可能是书签
        const currentSubCategoryId = getCurrentSubCategoryId(parentCategoryId)
        if (currentSubCategoryId) {
          parseBookmark(element, currentSubCategoryId)
        }
      }
    }

    // 处理子文件夹及其更深层内容
    const parseSubFolder = (element: Element, subCategoryId: string, parentFolderName: string): void => {
      const dl = element.querySelector(":scope > dl")
      if (!dl) return

      const childDts = dl.querySelectorAll(":scope > dt")
      childDts.forEach((childDt) => {
        const childH3 = childDt.querySelector(":scope > h3")
        const childA = childDt.querySelector(":scope > a")

        if (childA) {
          // 直接书签
          parseBookmark(childDt, subCategoryId)
        } else if (childH3) {
          // 更深层的文件夹，将其书签扁平化到当前子分类，并添加前缀
          const deepFolderName = childH3.textContent?.trim() || "Unnamed Folder"
          const prefix = `[${deepFolderName}] `
          parseDeepFolder(childDt, subCategoryId, prefix)
        }
      })
    }

    // 处理更深层文件夹，将书签扁平化并添加前缀
    const parseDeepFolder = (element: Element, subCategoryId: string, prefix: string): void => {
      const dl = element.querySelector(":scope > dl")
      if (!dl) return

      const childDts = dl.querySelectorAll(":scope > dt")
      childDts.forEach((childDt) => {
        const childH3 = childDt.querySelector(":scope > h3")
        const childA = childDt.querySelector(":scope > a")

        if (childA) {
          // 书签，添加前缀
          const originalTitle = childA.textContent?.trim() || "Unnamed Bookmark"
          bookmarks.push({
            id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: prefix + originalTitle,
            url: childA.getAttribute("href") || "",
            subCategoryId: subCategoryId,
          })
        } else if (childH3) {
          // 更深层文件夹，继续递归
          const deepFolderName = childH3.textContent?.trim() || "Unnamed Folder"
          const newPrefix = prefix + `[${deepFolderName}] `
          parseDeepFolder(childDt, subCategoryId, newPrefix)
        }
      })
    }

    // 解析书签
    const parseBookmark = (element: Element, subCategoryId: string): void => {
      const a = element.querySelector(":scope > a")
      if (a) {
        bookmarks.push({
          id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          title: a.textContent?.trim() || "Unnamed Bookmark",
          url: a.getAttribute("href") || "",
          subCategoryId: subCategoryId,
        })
      }
    }

    // 获取当前可用的子分类ID
    const getCurrentSubCategoryId = (parentCategoryId?: string): string | null => {
      if (parentCategoryId) {
        const parentCategory = categories.find(cat => cat.id === parentCategoryId)
        if (parentCategory && parentCategory.subCategories.length > 0) {
          return parentCategory.subCategories[0].id
        }
      }

      // 如果没有合适的子分类，创建一个默认分类
      if (categories.length === 0) {
        const defaultCategoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        const defaultSubCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        categories.push({
          id: defaultCategoryId,
          name: "导入的书签",
          subCategories: [{
            id: defaultSubCategoryId,
            name: "默认",
            parentId: defaultCategoryId,
          }],
        })

        return defaultSubCategoryId
      }

      return null
    }

    // 查找书签栏根目录
    const bookmarkBar = doc.querySelector('h1')
    let rootDl = null

    if (bookmarkBar) {
      rootDl = bookmarkBar.nextElementSibling
      while (rootDl && rootDl.tagName !== 'DL') {
        rootDl = rootDl.nextElementSibling
      }
    }

    if (!rootDl) {
      // 如果找不到标准结构，回退到查找所有顶级DT元素
      rootDl = doc.querySelector('dl')
    }

    if (rootDl) {
      const topLevelDts = rootDl.querySelectorAll(":scope > dt")

      // 检查第一个DT是否是书签栏
      if (topLevelDts.length > 0) {
        const firstDt = topLevelDts[0]
        const firstH3 = firstDt.querySelector(":scope > h3")

        if (firstH3 && (firstH3.textContent?.trim() === "书签栏" ||
                       firstH3.textContent?.trim() === "Bookmarks bar" ||
                       firstH3.textContent?.trim() === "Bookmarks Bar" ||
                       firstH3.hasAttribute("PERSONAL_TOOLBAR_FOLDER"))) {
          // 这是书签栏，特殊处理
          parseFolder(firstDt, undefined, 0, true)

          // 处理其他顶级文件夹（如果有的话）
          for (let i = 1; i < topLevelDts.length; i++) {
            parseFolder(topLevelDts[i], undefined, 0, false)
          }
        } else {
          // 不是标准的书签栏结构，按普通方式处理
          topLevelDts.forEach((dt) => {
            parseFolder(dt, undefined, 0, false)
          })
        }
      }
    }

    return { categories, bookmarks }
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
          >
            <Menu className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">个人导航中心</h1>
          </div>
        </div>

        <EnhancedSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <div className="flex items-center space-x-2">
          {/* 添加书签按钮 */}
          <Button
            variant="default"
            size="sm"
            onClick={() => setAddBookmarkOpen(true)}
            disabled={!getDefaultSubCategoryId()}
            className="bg-primary hover:bg-primary/90"
          >
            <Plus className="h-4 w-4 mr-2" />
            添加书签
          </Button>

          {/* 导入按钮 - 卡片式 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <Upload className="h-4 w-4 mr-2" />
                导入
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-96 p-0 shadow-xl border border-border/20 bg-background/95 backdrop-blur-sm rounded-lg animate-in slide-in-from-top-2 duration-200"
              align="end"
              sideOffset={8}
            >
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">导入书签</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHelpOpen(true)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <HelpCircle className="w-3 h-3 mr-1" />
                        格式说明
                      </Button>
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3">
                      <h4 className="text-xs font-medium mb-2">支持的文件格式</h4>
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-3 h-3 text-blue-500" />
                          <span>HTML 文件（浏览器书签导出）</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <FileText className="w-3 h-3 text-green-500" />
                          <span>JSON 文件（自定义格式）</span>
                        </div>
                      </div>
                    </div>

                    {/* 隐藏的文件输入框 */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".html,.json"
                      onChange={handleFileSelect}
                      disabled={loading}
                      className="hidden"
                    />

                    {/* 文件选择区域 */}
                    <div
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      } ${loading ? "pointer-events-none opacity-50" : ""}`}
                      onClick={() => !loading && fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        dragOver ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium">
                          {loading
                            ? "导入中..."
                            : dragOver
                              ? "释放文件开始导入"
                              : "点击选择文件或拖拽文件到此处"
                          }
                        </p>
                        <p className="text-xs text-muted-foreground">
                          支持 HTML 和 JSON 格式
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={onSettingsClick}>
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAboutDialogOpen(true)}>
            <Info className="h-4 w-4 mr-2" />
            关于
          </Button>
        </div>
      </div>

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />
      <ImportHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />

      {/* 全局添加书签对话框 */}
      {getDefaultSubCategoryId() && (
        <AddBookmarkDialog
          open={addBookmarkOpen}
          onOpenChange={setAddBookmarkOpen}
          subCategoryId={getDefaultSubCategoryId()!}
        />
      )}
    </header>
  )
}
