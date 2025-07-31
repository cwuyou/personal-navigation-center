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
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>开发工具</H3>
    <DL><p>
        <DT><A HREF="https://code.visualstudio.com/">Visual Studio Code</A>
        <DT><A HREF="https://github.com/">GitHub</A>
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
      <DialogContent className="max-w-5xl w-[90vw] h-[90vh] flex flex-col p-0">
        <DialogHeader className="flex-shrink-0 px-6 py-4 border-b">
          <DialogTitle>导入书签格式说明</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="overview" className="w-full flex flex-col flex-1 min-h-0">
          <div className="px-6 mt-4 flex-shrink-0">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">概述</TabsTrigger>
              <TabsTrigger value="html">HTML 格式</TabsTrigger>
              <TabsTrigger value="json">JSON 格式</TabsTrigger>
              <TabsTrigger value="browser">浏览器导出</TabsTrigger>
            </TabsList>
          </div>

          <div className="flex-1 min-h-0 mt-4 px-6">
            <TabsContent value="overview" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
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
                        <Button size="sm" variant="outline" disabled>
                          <Download className="w-4 h-4 mr-2" />
                          下载示例文件
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold mb-2">导入逻辑说明</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-blue-900 mb-2">🔍 浏览器书签文件层级处理规则</h4>
                      <div className="space-y-3 text-sm text-blue-800">
                        <div>
                          <strong>书签栏特殊处理：</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>• 自动识别"书签栏"文件夹（支持中英文）</li>
                            <li>• 书签栏本身不会成为分类，其内容按以下规则处理</li>
                          </ul>
                        </div>
                        
                        <div>
                          <strong>层级映射规则：</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>• <span className="bg-blue-100 px-1 rounded">书签栏下的文件夹</span> → <span className="text-green-700 font-medium">一级分类</span></li>
                            <li>• <span className="bg-blue-100 px-1 rounded">一级分类下的文件夹</span> → <span className="text-green-700 font-medium">二级分类</span></li>
                            <li>• <span className="bg-blue-100 px-1 rounded">更深层的文件夹</span> → <span className="text-orange-700 font-medium">扁平化到二级分类，用前缀标识</span></li>
                          </ul>
                        </div>

                        <div>
                          <strong>书签归类规则：</strong>
                          <ul className="ml-4 mt-1 space-y-1">
                            <li>• <span className="bg-yellow-100 px-1 rounded">书签栏下的直接书签</span> → 放入"未分类书签"分类</li>
                            <li>• <span className="bg-yellow-100 px-1 rounded">一级分类下的直接书签</span> → 放入该分类的"默认"子分类</li>
                            <li>• <span className="bg-yellow-100 px-1 rounded">深层文件夹中的书签</span> → 添加前缀标识来源文件夹</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-green-900 mb-2">📁 实际示例</h4>
                      <div className="text-sm text-green-800">
                        <div className="mb-2"><strong>原始结构：</strong></div>
                        <pre className="bg-white p-2 rounded text-xs overflow-x-auto border">
{`书签栏/
├── Google (直接书签)
├── 开发工具/
│   ├── VSCode (直接书签)
│   ├── 前端工具/
│   │   └── React文档
│   └── 后端工具/
│       └── API工具/
│           └── Postman`}
                        </pre>
                        
                        <div className="mt-3 mb-2"><strong>导入后结构：</strong></div>
                        <pre className="bg-white p-2 rounded text-xs overflow-x-auto border">
{`📂 未分类书签
  └── 📁 默认
      └── 🔗 Google

📂 开发工具
  ├── 📁 默认
  │   └── 🔗 VSCode
  ├── 📁 前端工具
  │   └── 🔗 React文档
  └── 📁 后端工具
      └── 🔗 [API工具] Postman`}
                        </pre>
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">基本导入说明</h4>
                      <ul className="space-y-2 text-sm text-muted-foreground">
                        <li>• 导入的书签会添加到现有书签中，不会覆盖原有数据</li>
                        <li>• 支持任意层级的书签文件夹结构，所有书签都会被正确导入</li>
                        <li>• JSON 格式支持完整的二级分类结构和详细的书签信息</li>
                        <li>• 支持拖拽文件到导入区域，或点击选择文件</li>
                        <li>• 文件大小建议不超过 10MB</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="html" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">HTML 书签格式</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      这是浏览器标准的书签导出格式，所有主流浏览器都支持导出为此格式。系统会智能识别书签栏结构并合理组织分类。
                    </p>

                    <div className="bg-muted p-4 rounded-lg mb-4">
                      <h4 className="font-medium mb-2">Chrome/Edge 导出的典型结构：</h4>
                      <pre className="text-xs overflow-x-auto">
{`<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>
    <DL><p>
        <!-- 直接书签 → 未分类书签/默认 -->
        <DT><A HREF="https://www.google.com/">Google</A>

        <!-- 一级文件夹 → 一级分类 -->
        <DT><H3>开发工具</H3>
        <DL><p>
            <!-- 直接书签 → 开发工具/默认 -->
            <DT><A HREF="https://code.visualstudio.com/">VSCode</A>

            <!-- 二级文件夹 → 二级分类 -->
            <DT><H3>前端工具</H3>
            <DL><p>
                <DT><A HREF="https://reactjs.org/">React</A>

                <!-- 三级文件夹 → 扁平化到前端工具，添加前缀 -->
                <DT><H3>框架文档</H3>
                <DL><p>
                    <DT><A HREF="https://vuejs.org/">Vue.js</A>
                </DL><p>
            </DL><p>
        </DL><p>
    </DL><p>
</DL><p>`}
                      </pre>
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-amber-900 mb-2">⚡ 智能处理特性</h4>
                      <ul className="space-y-2 text-sm text-amber-800">
                        <li>• <strong>自动识别书签栏：</strong>支持中文"书签栏"、英文"Bookmarks bar"或带有 PERSONAL_TOOLBAR_FOLDER 属性的文件夹</li>
                        <li>• <strong>层级适配：</strong>将浏览器的多层文件夹结构适配到网站的二级分类系统</li>
                        <li>• <strong>前缀标识：</strong>深层文件夹的书签会添加 [文件夹名] 前缀，保留原始组织信息</li>
                        <li>• <strong>无书签丢失：</strong>无论多少层级，所有书签都会被正确导入</li>
                      </ul>
                    </div>

                    <div className="mt-4">
                      <h4 className="font-medium mb-2">格式说明：</h4>
                      <ul className="space-y-1 text-sm text-muted-foreground">
                        <li>• <code>&lt;H3&gt;</code> 标签表示文件夹（分类）</li>
                        <li>• <code>&lt;A&gt;</code> 标签表示书签链接</li>
                        <li>• <code>&lt;DL&gt;</code> 和 <code>&lt;DT&gt;</code> 用于组织层级结构</li>
                        <li>• 支持无限层级的嵌套文件夹结构</li>
                        <li>• ADD_DATE、LAST_MODIFIED 等属性会被自动忽略</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="json" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
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
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="browser" className="h-full">
              <ScrollArea className="h-full pr-4">
                <div className="space-y-6 pb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-2">从浏览器导出书签</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      以下是各主流浏览器导出书签的步骤。导出后的文件可以直接导入到本系统中，系统会智能处理书签栏结构。
                    </p>

                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                      <h4 className="font-medium text-green-900 mb-2">💡 导入建议</h4>
                      <ul className="space-y-1 text-sm text-green-800">
                        <li>• <strong>推荐导出整个书签栏：</strong>这样可以保持完整的文件夹结构</li>
                        <li>• <strong>整理后再导出：</strong>建议先在浏览器中整理好文件夹结构，删除不需要的书签</li>
                        <li>• <strong>注意文件夹层级：</strong>超过2层的文件夹会被扁平化处理，但所有书签都会保留</li>
                        <li>• <strong>检查导入结果：</strong>导入后可以在各分类中查找您的书签，深层文件夹的书签会有前缀标识</li>
                      </ul>
                    </div>

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
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t flex-shrink-0 px-6 pb-4">
          <Button onClick={() => onOpenChange(false)}>
            关闭
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
