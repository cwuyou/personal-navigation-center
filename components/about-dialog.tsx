"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Github, Heart } from "lucide-react"

interface AboutDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AboutDialog({ open, onOpenChange }: AboutDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>关于个人导航中心</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <h3 className="font-semibold mb-2">产品介绍</h3>
            <p className="text-sm text-muted-foreground">
              个人导航中心是一款专为独立开发者和程序员设计的书签管理工具。
              通过系统性的分类管理和快速搜索功能，帮助您高效地组织和访问常用的网站和工具。
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">主要特性</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 两级分类系统，支持灵活的书签组织</li>
              <li>• 全局模糊搜索，快速定位目标内容</li>
              <li>• 支持浏览器书签导入</li>
              <li>• 本地存储，保护隐私安全</li>
              <li>• 响应式设计，适配各种屏幕尺寸</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">数据存储</h3>
            <p className="text-sm text-muted-foreground">
              所有数据均存储在您的浏览器本地，无需注册账号，确保数据隐私和安全。
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              Made with love for developers
            </div>
            <Button variant="outline" size="sm">
              <Github className="w-4 h-4 mr-2" />
              GitHub
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
