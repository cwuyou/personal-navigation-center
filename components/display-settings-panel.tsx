"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Settings, RotateCcw, Monitor } from "lucide-react"
import { useDisplaySettings, type CardLayout, type GridColumns } from "@/hooks/use-display-settings"
import { useState, useEffect } from "react"
import { cn } from "@/lib/utils"

export function DisplaySettingsPanel() {
  const { settings, updateSettings, resetSettings } = useDisplaySettings()
  const [screenInfo, setScreenInfo] = useState({ width: 0, breakpoint: '' })
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return

    const updateScreenInfo = () => {
      const width = window.innerWidth
      let breakpoint = ''

      if (width < 640) {
        breakpoint = '手机 (<640px)'
      } else if (width < 1024) {
        breakpoint = '平板 (640-1024px)'
      } else if (width < 1536) {
        breakpoint = '桌面 (1024-1536px)'
      } else {
        breakpoint = '大屏 (>1536px)'
      }

      setScreenInfo({ width, breakpoint })
    }

    updateScreenInfo()
    window.addEventListener('resize', updateScreenInfo)
    return () => window.removeEventListener('resize', updateScreenInfo)
  }, [isClient])

  // 检查当前的布局模式
  const getCurrentLayoutMode = () => {
    if (typeof window === 'undefined') return 'grid'
    const root = document.documentElement

    if (root.classList.contains('layout-masonry')) return 'masonry'
    if (root.classList.contains('layout-list')) return 'list'
    const mode = 'grid'
    return mode
  }

  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value })
  }

  const handleLayoutChange = (layout: CardLayout) => {
    updateSettings({ cardLayout: layout })
  }

  const handleGridColumnsChange = (screen: keyof typeof settings.gridColumns, columns: GridColumns) => {
    updateSettings({
      gridColumns: {
        ...settings.gridColumns,
        [screen]: columns,
      },
    })
  }

  const handleCardRadiusChange = (radius: typeof settings.cardRadius) => {
    updateSettings({ cardRadius: radius })
  }

  const getCurrentBreakpoint = () => {
    if (!isClient || screenInfo.width === 0) return null
    const width = screenInfo.width
    console.log('Debug: getCurrentBreakpoint - isClient:', isClient, 'width:', width)
    if (width < 640) return 'mobile'
    if (width < 1024) return 'tablet'
    if (width < 1536) return 'desktop'
    return 'large'
  }

  const isActiveBreakpoint = (breakpoint: string) => {
    const current = getCurrentBreakpoint()
    console.log('Debug: isActiveBreakpoint - breakpoint:', breakpoint, 'current:', current)
    return current !== null && current === breakpoint
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          显示设置
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px]">
        <SheetHeader>
          <SheetTitle>显示设置</SheetTitle>
          <SheetDescription>
            自定义书签卡片的显示方式和布局
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {/* 显示内容开关 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">显示内容</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-cover" className="text-sm font-normal">
                  显示封面图片
                </Label>
                <Switch
                  id="show-cover"
                  checked={settings.showCover}
                  onCheckedChange={(checked) => handleToggle('showCover', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-favicon" className="text-sm font-normal">
                  显示网站图标
                </Label>
                <Switch
                  id="show-favicon"
                  checked={settings.showFavicon}
                  onCheckedChange={(checked) => handleToggle('showFavicon', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-title" className="text-sm font-normal">
                  显示标题
                </Label>
                <Switch
                  id="show-title"
                  checked={settings.showTitle}
                  onCheckedChange={(checked) => handleToggle('showTitle', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-description" className="text-sm font-normal">
                  显示描述
                </Label>
                <Switch
                  id="show-description"
                  checked={settings.showDescription}
                  onCheckedChange={(checked) => handleToggle('showDescription', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-url" className="text-sm font-normal">
                  显示网址
                </Label>
                <Switch
                  id="show-url"
                  checked={settings.showUrl}
                  onCheckedChange={(checked) => handleToggle('showUrl', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-tags" className="text-sm font-normal">
                  显示标签
                </Label>
                <Switch
                  id="show-tags"
                  checked={settings.showTags}
                  onCheckedChange={(checked) => handleToggle('showTags', checked)}
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* 布局设置 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">布局设置</h3>
            
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-normal">显示密度</Label>
                <Select value={settings.cardLayout} onValueChange={handleLayoutChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="compact">紧凑</SelectItem>
                    <SelectItem value="comfortable">舒适</SelectItem>
                    <SelectItem value="spacious">宽松</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-sm font-normal">圆角样式</Label>
                <Select value={settings.cardRadius} onValueChange={handleCardRadiusChange}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">无圆角</SelectItem>
                    <SelectItem value="sm">小圆角</SelectItem>
                    <SelectItem value="md">中圆角</SelectItem>
                    <SelectItem value="lg">大圆角</SelectItem>
                    <SelectItem value="xl">超大圆角</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* 网格列数设置 - 仅在网格布局下显示 */}
          {getCurrentLayoutMode() === 'grid' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium">网格列数</h3>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Monitor className="w-3 h-3" />
                  <span>{screenInfo.width}px</span>
                  <span className="px-2 py-1 bg-primary/10 text-primary rounded">
                    {screenInfo.breakpoint}
                  </span>
                </div>
              </div>

              {/* 当前生效状态 */}
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-start space-x-2">
                  <div className="w-4 h-4 rounded-full bg-green-400 flex-shrink-0 mt-0.5"></div>
                  <div className="text-sm">
                    <p className="font-medium text-green-800 dark:text-green-200">
                      当前生效
                    </p>
                    <p className="text-green-700 dark:text-green-300 mt-1">
                      网格布局模式已启用，列数设置正在生效。
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className={cn("text-sm font-normal", isActiveBreakpoint('mobile') && "text-primary font-medium")}>
                  手机 (≤640px) {isActiveBreakpoint('mobile') && '(当前生效)'}
                </Label>
                <Select
                  value={settings.gridColumns.mobile.toString()}
                  onValueChange={(value) => handleGridColumnsChange('mobile', parseInt(value) as GridColumns)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1列</SelectItem>
                    <SelectItem value="2">2列</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn("text-sm font-normal", isActiveBreakpoint('tablet') && "text-primary font-medium")}>
                  平板 (640-1024px) {isActiveBreakpoint('tablet') && '(当前生效)'}
                </Label>
                <Select
                  value={settings.gridColumns.tablet.toString()}
                  onValueChange={(value) => handleGridColumnsChange('tablet', parseInt(value) as GridColumns)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1列</SelectItem>
                    <SelectItem value="2">2列</SelectItem>
                    <SelectItem value="3">3列</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn("text-sm font-normal", isActiveBreakpoint('desktop') && "text-primary font-medium")}>
                  桌面 (1024-1536px) {isActiveBreakpoint('desktop') && '(当前生效)'}
                </Label>
                <Select
                  value={settings.gridColumns.desktop.toString()}
                  onValueChange={(value) => handleGridColumnsChange('desktop', parseInt(value) as GridColumns)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1列</SelectItem>
                    <SelectItem value="2">2列</SelectItem>
                    <SelectItem value="3">3列</SelectItem>
                    <SelectItem value="4">4列</SelectItem>
                    <SelectItem value="5">5列</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className={cn("text-sm font-normal", isActiveBreakpoint('large') && "text-primary font-medium")}>
                  大屏 (≥1536px) {isActiveBreakpoint('large') && '(当前生效)'}
                </Label>
                <Select
                  value={settings.gridColumns.large.toString()}
                  onValueChange={(value) => handleGridColumnsChange('large', parseInt(value) as GridColumns)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1列</SelectItem>
                    <SelectItem value="2">2列</SelectItem>
                    <SelectItem value="3">3列</SelectItem>
                    <SelectItem value="4">4列</SelectItem>
                    <SelectItem value="5">5列</SelectItem>
                    <SelectItem value="6">6列</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          )}

          {/* 布局模式警告 */}
          {getCurrentLayoutMode() !== 'grid' && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="w-4 h-4 rounded-full bg-yellow-400 flex-shrink-0 mt-0.5"></div>
                <div className="text-sm">
                  <p className="font-medium text-yellow-800 dark:text-yellow-200">
                    当前布局模式：{getCurrentLayoutMode() === 'masonry' ? '瀑布流' : '列表'}
                  </p>
                  <p className="text-yellow-700 dark:text-yellow-300 mt-1">
                    网格列数设置仅在"网格"布局模式下生效。请在主题设置中切换到网格布局。
                  </p>
                </div>
              </div>
            </div>
          )}

          <Separator />

          {/* 重置按钮 */}
          <div className="flex justify-center">
            <Button variant="outline" onClick={resetSettings} className="gap-2">
              <RotateCcw className="h-4 w-4" />
              重置为默认设置
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
