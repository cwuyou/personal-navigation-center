"use client"

import { ReactNode, useEffect, useState } from "react"
import { cn } from "@/lib/utils"
import { useDisplaySettings } from "@/hooks/use-display-settings"

interface DynamicBookmarkGridProps {
  children: ReactNode
  className?: string
}

export function DynamicBookmarkGrid({ children, className }: DynamicBookmarkGridProps) {
  const { settings } = useDisplaySettings()
  const [isClient, setIsClient] = useState(false)

  // 确保只在客户端渲染动态类名
  useEffect(() => {
    setIsClient(true)
  }, [])

  const getGridClasses = () => {
    // 如果还没有客户端渲染，使用默认的静态类名
    if (!isClient) {
      return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6'
    }

    const { mobile, tablet, desktop, large } = settings.gridColumns

    // 静态类名映射，确保 Tailwind CSS 能正确编译
    const getGridColsClass = (cols: number, prefix = '') => {
      const baseClass = prefix ? `${prefix}:grid-cols-` : 'grid-cols-'
      switch (cols) {
        case 1: return `${baseClass}1`
        case 2: return `${baseClass}2`
        case 3: return `${baseClass}3`
        case 4: return `${baseClass}4`
        case 5: return `${baseClass}5`
        case 6: return `${baseClass}6`
        default: return `${baseClass}1`
      }
    }

    // 构建响应式网格类名
    const gridClasses = [
      'grid',
      getGridColsClass(mobile),                    // 手机
      getGridColsClass(tablet, 'sm'),              // 平板 (640px+)
      getGridColsClass(desktop, 'lg'),             // 桌面 (1024px+)
      getGridColsClass(large, '2xl'),              // 大屏 (1536px+)
    ]

    // 根据布局模式设置间距
    switch (settings.cardLayout) {
      case 'compact':
        gridClasses.push('gap-3')
        break
      case 'comfortable':
        gridClasses.push('gap-4 sm:gap-6')
        break
      case 'spacious':
        gridClasses.push('gap-6 sm:gap-8')
        break
      default:
        gridClasses.push('gap-4 sm:gap-6')
    }

    return gridClasses.join(' ')
  }

  const finalClasses = cn("bookmark-grid", getGridClasses(), className)

  // 调试信息已移除，避免控制台噪音

  return (
    <div className={finalClasses}>
      {children}
    </div>
  )
}
