"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Keyboard,
  Search,
  CheckSquare,
  Undo2,
  Sparkles,
  FolderTree,
  Smartphone,
  Eye,
  Download,
  Trash2,
} from "lucide-react"

interface Shortcut {
  keys: string[]
  desc: string
  scope?: string
}

const shortcuts: Shortcut[] = [
  { keys: ["/"], desc: "聚焦搜索框", scope: "全局（输入框中无效）" },
  { keys: ["Ctrl", "K"], desc: "聚焦搜索框", scope: "全局，Mac 为 ⌘+K" },
  { keys: ["N"], desc: "打开「添加书签」对话框", scope: "全局（输入框中无效）" },
  { keys: ["↑", "↓"], desc: "在搜索建议中切换高亮项", scope: "搜索下拉打开时" },
  { keys: ["Enter"], desc: "选中当前建议或提交搜索", scope: "搜索下拉打开时" },
  { keys: ["Esc"], desc: "关闭搜索建议 / 退出批量选择模式" },
  { keys: ["Ctrl", "A"], desc: "全选当前视图书签", scope: "批量选择模式下，Mac 为 ⌘+A" },
  { keys: ["双击分类名"], desc: "重命名分类 / 子分类", scope: "侧边栏" },
  { keys: ["Shift+滚轮"], desc: "横向滚动子分类胶囊", scope: "详情视图（部分浏览器）" },
]

function KeyBadge({ k }: { k: string }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[1.75rem] h-6 px-1.5 text-xs font-mono font-medium bg-muted border border-border rounded shadow-sm text-foreground">
      {k}
    </kbd>
  )
}

export function FeatureGuide() {
  return (
    <div className="space-y-8">
      {/* 快捷键 */}
      <section id="shortcuts" className="space-y-4 scroll-mt-24">
        <div className="flex items-center gap-2">
          <Keyboard className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">键盘快捷键</h2>
        </div>
        <Card>
          <CardContent className="pt-6">
            <div className="divide-y divide-border">
              {shortcuts.map((s, i) => (
                <div key={i} className="flex items-start justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-center gap-1 flex-shrink-0">
                    {s.keys.map((k, j) => (
                      <span key={j} className="inline-flex items-center gap-1">
                        {j > 0 && <span className="text-xs text-muted-foreground">+</span>}
                        <KeyBadge k={k} />
                      </span>
                    ))}
                  </div>
                  <div className="text-right text-sm flex-1 min-w-0">
                    <div className="text-foreground">{s.desc}</div>
                    {s.scope && <div className="text-xs text-muted-foreground mt-0.5">{s.scope}</div>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 核心功能 */}
      <section id="features" className="space-y-4 scroll-mt-24">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">核心功能</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Search className="h-4 w-4 text-primary" />
                智能搜索
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>支持搜索书签标题、URL、描述、标签和分类名。</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>输入 <code className="px-1 bg-muted rounded">tag:react</code> 或 <code className="px-1 bg-muted rounded">#react</code> 只搜标签</li>
                <li>顶部 Filter 按钮可按分类/有描述筛选</li>
                <li>历史记录与建议联动，方向键导航</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <CheckSquare className="h-4 w-4 text-primary" />
                批量管理
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>在分类详情页右上角点击「选择」进入批量模式。</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>多选后底部工具栏可移动 / 导出 / 删除</li>
                <li><KeyBadge k="Ctrl" /> + <KeyBadge k="A" /> 全选当前视图</li>
                <li><KeyBadge k="Esc" /> 退出选择模式</li>
                <li>侧边栏也有"批量管理分类"入口</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Undo2 className="h-4 w-4 text-primary" />
                删除撤销
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>所有删除操作（书签、子分类、分类、批量删除）都会弹出一条带「撤销」按钮的提示，<strong className="text-foreground">5 秒内</strong>可恢复。</p>
              <p className="text-xs">注意：仅保留最近一次快照，刷新页面后撤销窗口失效。</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" />
                后台元数据增强
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>添加 / 导入书签后，系统会在后台自动抓取网站标题、描述、图标、封面图。</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>预置 1000+ 常用站点离线数据库，零延迟</li>
                <li>顶部进度指示器显示完成度，可点击停止</li>
                <li>导入的书签会保留你原始的标题/描述，只补全缺失字段</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <FolderTree className="h-4 w-4 text-primary" />
                分类与导航
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-4 space-y-1">
                <li>双击分类名即可重命名</li>
                <li>详情视图顶部面包屑可快速回溯</li>
                <li>侧边栏折叠后保留分类首字母快捷导航</li>
                <li>URL 与分类/搜索状态双向绑定，可分享或刷新保留</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Eye className="h-4 w-4 text-primary" />
                显示设置
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>「⋯ 更多 → 显示」或「设置」面板可调整：</p>
              <ul className="list-disc ml-4 space-y-1">
                <li>封面 / 图标 / 标题 / 描述 / 网址 / 标签 显隐</li>
                <li>卡片密度：紧凑 / 舒适 / 宽松</li>
                <li>圆角样式与网格列数</li>
                <li>主题色与深浅色（设置面板内）</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-primary" />
                移动端与 PWA
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-4 space-y-1">
                <li>窄屏自动切换为抽屉式侧边栏，左上角汉堡按钮唤出</li>
                <li>支持安装到桌面 / 主屏（PWA），离线可用</li>
                <li>触控目标已优化，所有可点击区域 ≥ 40px</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="h-4 w-4 text-primary" />
                数据导入导出
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <ul className="list-disc ml-4 space-y-1">
                <li>支持 HTML（浏览器书签）/ JSON 导入</li>
                <li>导出格式：HTML / JSON / CSV / TXT</li>
                <li>可按分类或子分类单独导出（侧边栏菜单）</li>
                <li>所有数据本地存储，不上传服务器</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 隐私与数据 */}
      <section id="privacy" className="space-y-4 scroll-mt-24">
        <div className="flex items-center gap-2">
          <Trash2 className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">数据与隐私</h2>
        </div>
        <Card>
          <CardContent className="pt-6 text-sm text-muted-foreground space-y-2">
            <p>所有书签、分类、设置都存储在<strong className="text-foreground">浏览器 localStorage</strong> 中，不会上传到任何服务器。</p>
            <ul className="list-disc ml-4 space-y-1">
              <li>清除浏览器数据 / 切换浏览器 = 数据丢失，建议定期导出备份</li>
              <li>「设置 → 清空所有数据」提供两步确认的硬重置</li>
              <li>仅在你主动添加书签时，后台才会通过应用自身的代理接口抓取该 URL 的元数据；不会上报浏览行为</li>
            </ul>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
