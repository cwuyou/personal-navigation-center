"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
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

export function DropdownDisplaySettings() {
  const { settings, updateSettings, resetSettings } = useDisplaySettings()
  const [screenInfo, setScreenInfo] = useState({ width: 0, breakpoint: '' })
  const [isClient, setIsClient] = useState(false)

  // 检查当前的布局模式
  const getCurrentLayoutMode = () => {
    if (typeof window === 'undefined') return 'grid'
    const root = document.documentElement
    if (root.classList.contains('layout-masonry')) return 'masonry'
    if (root.classList.contains('layout-list')) return 'list'
    return 'grid'
  }

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



  const handleToggle = (key: keyof typeof settings, value: boolean) => {
    updateSettings({ [key]: value })
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
    if (width < 640) return 'mobile'
    if (width < 1024) return 'tablet'
    if (width < 1536) return 'desktop'
    return 'large'
  }

  const isActiveBreakpoint = (breakpoint: string) => {
    const current = getCurrentBreakpoint()
    return current !== null && current === breakpoint
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Settings className="h-4 w-4" />
          显示设置
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 max-h-[70vh] overflow-y-auto shadow-xl border border-border/20 bg-background/95 backdrop-blur-sm rounded-lg animate-in slide-in-from-top-2 duration-200"
        align="end"
        sideOffset={12}
      >
        <div className="p-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-sm text-foreground">显示设置</h3>
              <p className="text-xs text-muted-foreground mt-1">
                自定义书签卡片的显示方式和布局
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetSettings}
              className="h-8 px-2 text-xs hover:bg-muted/50"
            >
              <RotateCcw className="h-3 w-3 mr-1" />
              重置
            </Button>
          </div>
        </div>

        <div className="p-4 space-y-5">
          {/* 显示内容开关 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">显示内容</h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="show-cover" className="text-xs font-normal">
                  显示封面图片
                </Label>
                <Switch
                  id="show-cover"
                  checked={settings.showCover}
                  onCheckedChange={(checked) => handleToggle('showCover', checked)}
                />
              </div>
              
              <div className="flex items-center justify-between">
                <Label htmlFor="show-favicon" className="text-xs font-normal">
                  显示网站图标
                </Label>
                <Switch
                  id="show-favicon"
                  checked={settings.showFavicon}
                  onCheckedChange={(checked) => handleToggle('showFavicon', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-description" className="text-xs font-normal">
                  显示描述
                </Label>
                <Switch
                  id="show-description"
                  checked={settings.showDescription}
                  onCheckedChange={(checked) => handleToggle('showDescription', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-tags" className="text-xs font-normal">
                  显示标签
                </Label>
                <Switch
                  id="show-tags"
                  checked={settings.showTags}
                  onCheckedChange={(checked) => handleToggle('showTags', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="show-url" className="text-xs font-normal">
                  显示网址
                </Label>
                <Switch
                  id="show-url"
                  checked={settings.showUrl}
                  onCheckedChange={(checked) => handleToggle('showUrl', checked)}
                />
              </div>
            </div>
          </div>

          <Separator className="bg-border/50" />

          {/* 卡片样式 */}
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-foreground">卡片样式</h4>
            <div className="space-y-2">
              <div className="space-y-1">
                <Label className="text-xs font-normal">圆角样式</Label>
                <Select value={settings.cardRadius} onValueChange={handleCardRadiusChange}>
                  <SelectTrigger className="h-8">
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

          <div className="p-3 bg-muted/30 rounded-lg">
            <p className="text-xs text-muted-foreground">
              💡 显示密度设置已移至页面顶部的设置面板中，可统一控制页面和卡片的紧凑程度。
            </p>
          </div>

          <Separator className="bg-border/50" />

          {/* 网格列数 - 仅在网格布局下显示 */}
          {getCurrentLayoutMode() === 'grid' && (
            <div className="space-y-3">
              <h4 className="text-sm font-medium text-foreground">网格列数</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <Label className={cn("text-xs font-normal", isActiveBreakpoint('mobile') && "text-primary font-medium")}>
                    手机 (≤640px) {isActiveBreakpoint('mobile') && '(当前)'}
                  </Label>
                  <Select
                    value={settings.gridColumns.mobile.toString()}
                    onValueChange={(value) => handleGridColumnsChange('mobile', parseInt(value) as GridColumns)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1列</SelectItem>
                      <SelectItem value="2">2列</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-xs font-normal", isActiveBreakpoint('tablet') && "text-primary font-medium")}>
                    平板 (640-1024px) {isActiveBreakpoint('tablet') && '(当前)'}
                  </Label>
                  <Select
                    value={settings.gridColumns.tablet.toString()}
                    onValueChange={(value) => handleGridColumnsChange('tablet', parseInt(value) as GridColumns)}
                  >
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">1列</SelectItem>
                      <SelectItem value="2">2列</SelectItem>
                      <SelectItem value="3">3列</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1">
                  <Label className={cn("text-xs font-normal", isActiveBreakpoint('desktop') && "text-primary font-medium")}>
                    桌面 (1024-1536px) {isActiveBreakpoint('desktop') && '(当前)'}
                  </Label>
                  <Select
                    value={settings.gridColumns.desktop.toString()}
                    onValueChange={(value) => handleGridColumnsChange('desktop', parseInt(value) as GridColumns)}
                  >
                    <SelectTrigger className="h-8">
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

                <div className="space-y-1">
                  <Label className={cn("text-xs font-normal", isActiveBreakpoint('large') && "text-primary font-medium")}>
                    大屏 (≥1536px) {isActiveBreakpoint('large') && '(当前)'}
                  </Label>
                  <Select
                    value={settings.gridColumns.large.toString()}
                    onValueChange={(value) => handleGridColumnsChange('large', parseInt(value) as GridColumns)}
                  >
                    <SelectTrigger className="h-8">
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


        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
