"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { Globe, Sparkles, Info } from "lucide-react"

export function EnhanceBookmarksButton() {
  const [open, setOpen] = useState(false)
  const { bookmarks, startBackgroundEnhancement, enhancementProgress, getEnhancementStats } = useBookmarkStore()

  // 统计需要增强的书签 - 实时计算，确保数据准确
  const bookmarksNeedingEnhancement = bookmarks.filter(
    bookmark => !bookmark.description || bookmark.description.length < 20
  )

  const stats = getEnhancementStats()
  const isRunning = enhancementProgress?.status === 'running'

  const handleEnhance = async () => {
    if (bookmarksNeedingEnhancement.length === 0) {
      return
    }

    setOpen(false)
    await startBackgroundEnhancement()
  }

  // 如果没有需要增强的书签，不显示按钮
  if (bookmarksNeedingEnhancement.length === 0) {
    return null
  }

  // 如果正在运行中，显示禁用状态但保持可见
  // 这样用户可以看到按钮状态的变化

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={isRunning}
          className="text-blue-600 border-blue-200 hover:bg-blue-50 dark:text-blue-400 dark:border-blue-800 dark:hover:bg-blue-950/20"
        >
          <Sparkles className="w-4 h-4 mr-2" />
          手动增强 ({bookmarksNeedingEnhancement.length})
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Globe className="w-5 h-5 text-blue-600" />
            <span>手动增强书签</span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="space-y-2">
                <h3 className="font-medium text-sm">将要增强的内容</h3>
                <ul className="text-xs text-muted-foreground space-y-1">
                  <li>• 为 {bookmarksNeedingEnhancement.length} 个书签获取详细描述</li>
                  <li>• 自动识别网站类型和功能</li>
                  <li>• 添加高质量的网站图标</li>
                  <li>• 优化书签标题（如需要）</li>
                </ul>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4">
            <div className="space-y-2">
              <h3 className="font-medium text-sm text-green-800 dark:text-green-200">
                📚 预置数据库优势
              </h3>
              <div className="text-xs text-green-700 dark:text-green-300 space-y-1">
                <p>• 已覆盖 {stats.totalSites} 个知名网站</p>
                <p>• 涵盖 {stats.categories.length} 个主要分类</p>
                <p>• 大部分网站可秒速处理</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 dark:bg-yellow-950/20 rounded-lg p-3">
            <p className="text-xs text-yellow-800 dark:text-yellow-200">
              💡 <strong>提示：</strong>通常导入书签后会自动增强，此功能用于手动补充增强遗漏的书签。
              增强过程在后台进行，您可以在右下角查看进度。
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setOpen(false)}
            >
              取消
            </Button>
            <Button
              onClick={handleEnhance}
              disabled={isRunning}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              开始增强
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
