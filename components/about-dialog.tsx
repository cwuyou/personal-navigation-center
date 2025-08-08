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
              个人导航中心是一款简洁高效的书签管理工具，帮助您轻松整理和管理常用网站。
              无论您是学生、职场人士、还是网络爱好者，都能通过智能分类和快速搜索功能，
              让您的网络生活更加井然有序。
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-2">主要特性</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• 智能分类管理，让书签井然有序</li>
              <li>• 快速搜索功能，秒速找到目标网站</li>
              <li>• 一键导入浏览器书签，轻松迁移</li>
              <li>• 本地存储数据，隐私安全有保障</li>
              <li>• 多设备适配，手机电脑都能用</li>
              <li>• 简洁美观界面，使用体验更舒适</li>
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-2">数据安全</h3>
            <p className="text-sm text-muted-foreground">
              您的所有书签数据都安全存储在本地浏览器中，无需注册登录，
              不会上传到任何服务器，完全保护您的隐私安全。
            </p>
          </div>

          <div className="flex items-center justify-between pt-4 border-t">
            <div className="flex items-center text-sm text-muted-foreground">
              <Heart className="w-4 h-4 mr-1 text-red-500" />
              用心打造，为您的网络生活添彩
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
