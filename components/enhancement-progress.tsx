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
    if (enhancementProgress?.status === 'running') {
      setIsVisible(true)
    } else if (enhancementProgress?.status === 'completed') {
      // 完成后显示2秒再隐藏
      setTimeout(() => {
        setIsVisible(false)
      }, 2000)
    } else if (enhancementProgress?.status === 'idle' || enhancementProgress?.status === 'error') {
      setIsVisible(false)
    }
  }, [enhancementProgress])

  if (!isVisible || !enhancementProgress) {
    return null
  }

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
              {status === 'running' ? (
                <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
              ) : status === 'completed' ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <Globe className="w-4 h-4 text-blue-600" />
              )}
              <h3 className="text-sm font-medium">
                {status === 'running' && '自动增强书签中'}
                {status === 'completed' && '自动增强完成'}
                {status === 'error' && '增强失败'}
              </h3>
            </div>
            
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
