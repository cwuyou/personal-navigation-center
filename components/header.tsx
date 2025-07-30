"use client"

import { useState, useRef } from "react"
import { Upload, Info, Menu, Settings, FileText, HelpCircle } from "lucide-react"
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
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useToast } from "@/hooks/use-toast"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onLogoClick?: () => void
  onSettingsClick?: () => void
}

export function Header({ searchQuery, onSearchChange, onLogoClick, onSettingsClick }: HeaderProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importBookmarks } = useBookmarkStore()
  const { toast } = useToast()

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
    await importBookmarks(bookmarkData)
  }

  const importFromJSON = async (json: string) => {
    const data = JSON.parse(json)
    console.log("解析JSON得到的数据:", data)
    await importBookmarks(data)
  }

  const parseBookmarkHTML = (doc: Document) => {
    const categories: any[] = []
    const bookmarks: any[] = []

    // Find all DT elements which typically contain folders or bookmarks
    const dtElements = doc.querySelectorAll("dt")

    dtElements.forEach((dt) => {
      const h3 = dt.querySelector("h3")
      const a = dt.querySelector("a")

      if (h3) {
        // This is a folder/category
        const categoryName = h3.textContent?.trim() || "Unnamed Category"
        const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const category = {
          id: categoryId,
          name: categoryName,
          subCategories: [],
        }

        // Look for nested folders and bookmarks
        const nextDl = dt.querySelector("dl")
        if (nextDl) {
          const subDts = nextDl.querySelectorAll("dt")
          const subCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          category.subCategories.push({
            id: subCategoryId,
            name: "Default",
            parentId: categoryId,
          })

          subDts.forEach((subDt) => {
            const subA = subDt.querySelector("a")
            if (subA) {
              bookmarks.push({
                id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: subA.textContent?.trim() || "Unnamed Bookmark",
                url: subA.getAttribute("href") || "",
                subCategoryId: subCategoryId,
              })
            }
          })
        }

        categories.push(category)
      } else if (a) {
        // This is a direct bookmark (not in a folder)
        if (categories.length === 0) {
          // Create a default category
          const defaultCategoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const defaultSubCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          categories.push({
            id: defaultCategoryId,
            name: "Imported Bookmarks",
            subCategories: [
              {
                id: defaultSubCategoryId,
                name: "Default",
                parentId: defaultCategoryId,
              },
            ],
          })
        }

        const lastCategory = categories[categories.length - 1]
        const subCategoryId = lastCategory.subCategories[0]?.id

        if (subCategoryId) {
          bookmarks.push({
            id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: a.textContent?.trim() || "Unnamed Bookmark",
            url: a.getAttribute("href") || "",
            subCategoryId: subCategoryId,
          })
        }
      }
    })

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
          {/* 导入按钮 - 卡片式 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
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
    </header>
  )
}
