"use client"

import { useEffect, useState } from "react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Globe, X, CheckCircle, Loader2 } from "lucide-react"

export function EnhancementProgress() {
  const { enhancementProgress, stopBackgroundEnhancement } = useBookmarkStore()
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    // 完全隐藏增强进度显示，让增强过程静默进行
    setIsVisible(false)
  }, [enhancementProgress])

  // 始终返回null，不显示任何增强进度UI
  return null

  const { total, completed, current, status } = enhancementProgress
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

  const handleStop = () => {
    stopBackgroundEnhancement()
    setIsVisible(false)
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm">
      <Card className="shadow-lg border-blue-200 dark:border-blue-800">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center space-x-2">
              {status === 'running' && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
              {status === 'completed' && <CheckCircle className="w-4 h-4 text-green-500" />}
              {status === 'error' && <X className="w-4 h-4 text-red-500" />}
              
              <div>
                <h4 className="text-sm font-medium">
                  {status === 'running' && '正在增强书签'}
                  {status === 'completed' && '增强完成'}
                  {status === 'error' && '增强失败'}
                </h4>
                <p className="text-xs text-muted-foreground">
                  {status === 'running' && '正在为书签添加描述信息...'}
                  {status === 'completed' && '所有书签已成功增强'}
                  {status === 'error' && '增强过程中出现错误'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1">
              {status === 'running' && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleStop}
                  className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3 h-3" />
                </Button>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{completed} / {total}</span>
              <span>{percentage}%</span>
            </div>

            <Progress value={percentage} className="h-2" />

            {current && status === 'running' && (
              <p className="text-xs text-muted-foreground truncate">
                正在处理: {current}
              </p>
            )}

            {status === 'completed' && (
              <p className="text-xs text-green-600">
                ✅ 已为 {completed} 个书签增强描述信息
              </p>
            )}

            {status === 'error' && (
              <p className="text-xs text-red-600">
                ❌ 增强过程中出现错误
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
