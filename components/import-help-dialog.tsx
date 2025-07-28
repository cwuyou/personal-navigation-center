"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { FileText, Download, Code } from "lucide-react"

interface ImportHelpDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportHelpDialog({ open, onOpenChange }: ImportHelpDialogProps) {
  const downloadSampleJSON = () => {
    const sampleData = {
      categories: [
        {
          id: "dev-tools",
          name: "开发工具",
          subCategories: [
            {
              id: "editors",
              name: "代码编辑器",
              parentId: "dev-tools"
            },
            {
              id: "browsers",
              name: "浏览器工具",
              parentId: "dev-tools"
            }
          ]
        },
        {
          id: "learning",
          name: "学习资源",
          subCategories: [
            {
              id: "docs",
              name: "文档",
              parentId: "learning"
            }
          ]
        }
      ],
      bookmarks: [
        {
          id: "vscode",
          title: "Visual Studio Code",
          url: "https://code.visualstudio.com/",
          description: "微软开发的免费代码编辑器",
          subCategoryId: "editors",
          createdAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "chrome-devtools",
          title: "Chrome DevTools",
          url: "https://developer.chrome.com/docs/devtools/",
          description: "Chrome 开发者工具文档",
          subCategoryId: "browsers",
          createdAt: "2024-01-01T00:00:00.000Z"
        },
        {
          id: "mdn",
          title: "MDN Web Docs",
          url: "https://developer.mozilla.org/",
          description: "Web开发权威文档",
          subCategoryId: "docs",
          createdAt: "2024-01-01T00:00:00.000Z"
        }
      ]
    }

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-bookmarks.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const downloadSampleHTML = () => {
    const sampleHTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 ADD_DATE="1640995200" LAST_MODIFIED="1640995200">开发工具</H3>
    <DL><p>
        <DT><A HREF="https://code.visualstudio.com/" ADD_DATE="1640995200">Visual Studio Code</A>
        <DT><A HREF="https://github.com/" ADD_DATE="1640995200">GitHub</A>
        <DT><A HREF="https://stackoverflow.com/" ADD_DATE="1640995200">Stack Overflow</A>
    </DL><p>
    <DT><H3 ADD_DATE="1640995200" LAST_MODIFIED="1640995200">学习资源</H3>
    <DL><p>
        <DT><A HREF="https://developer.mozilla.org/" ADD_DATE="1640995200">MDN Web Docs</A>
        <DT><A HREF="https://www.w3schools.com/" ADD_DATE="1640995200">W3Schools</A>
    </DL><p>
</DL><p>`

    const blob = new Blob([sampleHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-bookmarks.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>导入书签格式说明</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">概述</TabsTrigger>
            <TabsTrigger value="html">HTML 格式</TabsTrigger>
            <TabsTrigger value="json">JSON 格式</TabsTrigger>
            <TabsTrigger value="browser">浏览器导出</TabsTrigger>
          </TabsList>

          <ScrollArea className="h-[60vh] mt-4">
            <TabsContent value="overview" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">支持的文件格式</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-blue-500" />
                      <h4 className="font-medium">HTML 格式</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      标准的浏览器书签导出格式，支持从 Chrome、Firefox、Safari、Edge 等浏览器导出的书签文件。
                    </p>
                    <Button size="sm" variant="outline" onClick={downloadSampleHTML}>
                      <Download className="w-4 h-4 mr-2" />
                      下载示例文件
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Code className="w-5 h-5 text-green-500" />
                      <h4 className="font-medium">JSON 格式</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      自定义的 JSON 数据格式，支持完整的分类结构和书签信息，包括描述、创建时间等详细信息。
                    </p>
                    <Button size="sm" variant="outline" onClick={downloadSampleJSON}>
                      <Download className="w-4 h-4 mr-2" />
                      下载示例文件
                    </Button>
                  </div>

                  <div className="border rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <FileText className="w-5 h-5 text-purple-500" />
                      <h4 className="font-medium">CSV 格式</h4>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      简单的表格格式，包含标题、URL、描述和分类信息，便于在 Excel 中编辑。
                    </p>
                    <Button size="sm" variant="outline" onClick={() => {}}>
                      <Download className="w-4 h-4 mr-2" />
                      下载示例文件
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">导入说明</h3>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li>• 导入的书签会添加到现有书签中，不会覆盖原有数据</li>
                  <li>• HTML 格式会自动创建分类结构，每个文件夹对应一个一级分类</li>
                  <li>• JSON 格式支持完整的二级分类结构和详细的书签信息</li>
                  <li>• 支持拖拽文件到导入区域，或点击选择文件</li>
                  <li>• 文件大小建议不超过 10MB</li>
                </ul>
              </div>
            </TabsContent>

            <TabsContent value="html" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">HTML 书签格式</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  这是浏览器标准的书签导出格式，所有主流浏览器都支持导出为此格式。
                </p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">示例结构：</h4>
                  <pre className="text-xs overflow-x-auto">
{`<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>开发工具</H3>
    <DL><p>
        <DT><A HREF="https://code.visualstudio.com/">Visual Studio Code</A>
        <DT><A HREF="https://github.com/">GitHub</A>
    </DL><p>
    <DT><H3>学习资源</H3>
    <DL><p>
        <DT><A HREF="https://developer.mozilla.org/">MDN Web Docs</A>
    </DL><p>
</DL><p>`}
                  </pre>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">格式说明：</h4>
                  <ul className="space-y-1 text-sm text-muted-foreground">
                    <li>• <code>&lt;H3&gt;</code> 标签表示文件夹（分类）</li>
                    <li>• <code>&lt;A&gt;</code> 标签表示书签链接</li>
                    <li>• <code>&lt;DL&gt;</code> 和 <code>&lt;DT&gt;</code> 用于组织层级结构</li>
                    <li>• 支持嵌套的文件夹结构</li>
                  </ul>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="json" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">JSON 数据格式</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  自定义的 JSON 格式，支持完整的分类层级和详细的书签信息。
                </p>
                
                <div className="bg-muted p-4 rounded-lg">
                  <h4 className="font-medium mb-2">数据结构：</h4>
                  <pre className="text-xs overflow-x-auto">
{`{
  "categories": [
    {
      "id": "dev-tools",           // 分类ID（必需）
      "name": "开发工具",           // 分类名称（必需）
      "subCategories": [           // 二级分类数组
        {
          "id": "editors",         // 二级分类ID（必需）
          "name": "代码编辑器",     // 二级分类名称（必需）
          "parentId": "dev-tools"  // 父分类ID（必需）
        }
      ]
    }
  ],
  "bookmarks": [
    {
      "id": "vscode",                    // 书签ID（必需）
      "title": "Visual Studio Code",    // 书签标题（必需）
      "url": "https://code.visualstudio.com/", // 书签URL（必需）
      "description": "代码编辑器",       // 书签描述（可选）
      "subCategoryId": "editors",       // 所属二级分类ID（必需）
      "createdAt": "2024-01-01T00:00:00.000Z" // 创建时间（可选）
    }
  ]
}`}
                  </pre>
                </div>

                <div className="mt-4">
                  <h4 className="font-medium mb-2">字段说明：</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <strong>categories</strong> - 分类数组
                      <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                        <li>• id: 唯一标识符</li>
                        <li>• name: 分类显示名称</li>
                        <li>• subCategories: 二级分类数组</li>
                      </ul>
                    </div>
                    <div>
                      <strong>bookmarks</strong> - 书签数组
                      <ul className="ml-4 mt-1 space-y-1 text-muted-foreground">
                        <li>• id: 唯一标识符</li>
                        <li>• title: 书签标题</li>
                        <li>• url: 书签链接</li>
                        <li>• description: 书签描述（可选）</li>
                        <li>• subCategoryId: 所属二级分类ID</li>
                        <li>• createdAt: 创建时间（可选）</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="browser" className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">从浏览器导出书签</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  以下是各主流浏览器导出书签的步骤：
                </p>

                <div className="space-y-6">
                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Chrome / Edge</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>点击浏览器右上角的三点菜单</li>
                      <li>选择"书签" → "书签管理器"</li>
                      <li>点击右上角的三点菜单</li>
                      <li>选择"导出书签"</li>
                      <li>保存为 HTML 文件</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Firefox</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>按 Ctrl+Shift+O 打开书签管理器</li>
                      <li>点击"导入和备份"</li>
                      <li>选择"导出书签到HTML"</li>
                      <li>选择保存位置并保存</li>
                    </ol>
                  </div>

                  <div className="border rounded-lg p-4">
                    <h4 className="font-medium mb-2">Safari</h4>
                    <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                      <li>打开 Safari</li>
                      <li>点击菜单栏的"文件"</li>
                      <li>选择"导出书签"</li>
                      <li>保存为 HTML 文件</li>
                    </ol>
                  </div>
                </div>
              </div>
            </TabsContent>
          </ScrollArea>
        </Tabs>

        <div className="flex justify-end">
          <Button onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
