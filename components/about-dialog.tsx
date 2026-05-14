"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ExternalLink } from "lucide-react"
import Link from "next/link"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>关于个人导航中心</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <div>
            <p className="text-muted-foreground leading-relaxed">
              一款以本地为中心、隐私优先的个人书签管理与导航起始页。
              零账号、零后端，所有数据保存在你的浏览器中。
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-foreground">主要特性</h3>
            <ul className="text-muted-foreground space-y-1.5">
              <li>• <span className="text-foreground">两级分类</span>结构，支持双击重命名与拖拽组织</li>
              <li>• <span className="text-foreground">智能搜索</span>：标题/URL/描述/标签/分类，支持 <code className="px-1 bg-muted rounded text-xs">tag:</code> 前缀</li>
              <li>• <span className="text-foreground">后台元数据增强</span>：自动抓取标题、描述、图标、封面</li>
              <li>• <span className="text-foreground">批量管理</span>：移动 / 导出 / 删除多个书签或分类</li>
              <li>• <span className="text-foreground">删除可撤销</span>：5 秒内可恢复任意删除操作</li>
              <li>• <span className="text-foreground">键盘快捷键</span>：<kbd className="px-1 bg-muted rounded text-xs">/</kbd> 搜索、<kbd className="px-1 bg-muted rounded text-xs">N</kbd> 新建</li>
              <li>• <span className="text-foreground">移动端友好</span>：抽屉式侧边栏，PWA 离线可用</li>
              <li>• <span className="text-foreground">导入导出</span>：HTML / JSON / CSV / TXT 四种格式</li>
            </ul>
            <div className="mt-2 text-xs">
              <Link href="/help" className="text-primary hover:underline inline-flex items-center gap-1">
                查看完整功能说明与快捷键 <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2 text-foreground">数据与隐私</h3>
            <p className="text-muted-foreground leading-relaxed">
              数据存储在浏览器 localStorage 中，不上传服务器，不需要注册登录。
              清除浏览器数据会导致丢失，请定期使用「⋯ 更多 → 导出」备份。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
