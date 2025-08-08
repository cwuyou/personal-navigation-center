"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Settings,
  Palette,
  Download,
  ChevronRight,
  ChevronLeft,
  Monitor,
  Sun,
  Moon,
  Smartphone,
  Tablet,
  X,
  Eye,
  Grid3X3,
  LayoutGrid
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDisplaySettings, useResponsiveLayout, type CardLayout } from "@/hooks/use-display-settings"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface SettingsPanelProps {
  isOpen: boolean
  onToggle: () => void
}

// 预设主题
const predefinedThemes = [
  { name: '经典黑色', primary: '0 0% 9%', preview: 'bg-gray-900' },
  { name: '科技蓝色', primary: '221.2 83.2% 53.3%', preview: 'bg-blue-500' },
  { name: '优雅紫色', primary: '262.1 83.3% 57.8%', preview: 'bg-purple-500' },
  { name: '自然绿色', primary: '142.1 76.2% 36.3%', preview: 'bg-green-500' },
  { name: '温暖橙色', primary: '24.6 95% 53.1%', preview: 'bg-orange-500' },
  { name: '深邃靛蓝', primary: '239 84% 67%', preview: 'bg-indigo-500' },
  { name: '玫瑰粉色', primary: '330 81% 60%', preview: 'bg-pink-500' },
]

// 布局选项
const layoutOptions = [
  { id: 'grid', name: '网格', icon: Monitor },
  { id: 'list', name: '列表', icon: Smartphone },
  { id: 'masonry', name: '瀑布流', icon: Tablet },
]

export function SettingsPanel({ isOpen, onToggle }: SettingsPanelProps) {
  const { theme, setTheme } = useTheme()
  const { settings: displaySettings, updateSettings: updateDisplaySettings } = useDisplaySettings()
  const { breakpoint, isBreakpointActive } = useResponsiveLayout()
  const [config, setConfig] = useState({
    primaryColor: '142 76% 36%',
    borderRadius: 8,
    fontSize: 14,
    layout: 'grid',
    animations: true,
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 确保只在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 获取断点显示名称和当前生效状态
  const getBreakpointInfo = (breakpointKey: string) => {
    const breakpointNames = {
      mobile: '手机 (≤640px)',
      tablet: '平板 (640-1024px)',
      desktop: '桌面 (1024-1536px)',
      large: '大屏 (≥1536px)'
    }

    const isActive = isBreakpointActive(breakpointKey as any)
    const name = breakpointNames[breakpointKey as keyof typeof breakpointNames]

    return { name, isActive }
  }



  // 应用主题配置
  const applyTheme = useCallback((newConfig: typeof config, showNotification = false) => {
    if (typeof window === 'undefined') return
    
    try {
      const root = document.documentElement
      
      // 应用CSS变量
      root.style.setProperty('--primary', newConfig.primaryColor, 'important')
      root.style.setProperty('--radius', `${newConfig.borderRadius}px`, 'important')
      root.style.setProperty('--primary-foreground', '0 0% 98%', 'important')
      root.style.setProperty('--ring', newConfig.primaryColor, 'important')

      // 修复黑色主题在深色模式下的可见性问题
      const isDarkMode = root.classList.contains('dark')
      const isBlackTheme = newConfig.primaryColor === '0 0% 9%'

      if (isDarkMode && isBlackTheme) {
        // 在深色模式下使用黑色主题时，添加特殊类来修复可见性
        root.classList.add('dark-black-theme-fix')
      } else {
        root.classList.remove('dark-black-theme-fix')
      }
      
      // 应用字体大小
      if (newConfig.fontSize !== 14) {
        root.style.fontSize = `${newConfig.fontSize}px`
      }
      
      // 应用类名
      root.classList.toggle('no-animations', !newConfig.animations)
      
      // 移除旧的布局类
      layoutOptions.forEach(layout => {
        root.classList.remove(`layout-${layout.id}`)
      })
      root.classList.add(`layout-${newConfig.layout}`)
      
      if (showNotification) {
        toast.success('设置已更新', { duration: 1500 })
      }
      
    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }, [])



  // 加载保存的配置
  useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return

    const saved = localStorage.getItem('theme-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        setConfig(parsed)
        setTimeout(() => {
          applyTheme(parsed, false)
          setIsLoaded(true)
        }, 100)
      } catch (error) {
        console.error('Failed to load theme config:', error)
        setIsLoaded(true)
      }
    } else {
      // 没有保存的配置时，检测当前CSS中的实际主题色
      const root = document.documentElement
      const computedStyle = getComputedStyle(root)
      const currentPrimary = computedStyle.getPropertyValue('--primary').trim()

      // 检测当前主题色，默认使用自然绿色
      const isGreenTheme = currentPrimary === '142 76% 36%'

      const defaultConfig = {
        primaryColor: '142 76% 36%', // 默认使用自然绿色
        borderRadius: 8,
        fontSize: 14,
        layout: 'grid',
        animations: true,
      }

      setConfig(defaultConfig)
      setTimeout(() => {
        applyTheme(defaultConfig, false) // 应用检测到的默认配置
        setIsLoaded(true)
      }, 100)
    }
  }, [applyTheme, isLoaded])

  // 更新配置
  const updateConfig = (updates: any) => {
    const newConfig = { ...config, ...updates }
    setConfig(newConfig)
    applyTheme(newConfig, true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-config', JSON.stringify(newConfig))
    }
  }

  return (
    <>
      {/* 遮罩层 */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/20 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}
      
      {/* 设置面板 */}
      <div className={cn(
        "fixed top-0 right-0 h-full w-80 bg-background border-l border-border z-50 transform transition-transform duration-300 ease-in-out",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
        {/* 面板头部 */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <h2 className="font-semibold">设置</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={onToggle}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* 面板内容 */}
        <div className="h-[calc(100vh-73px)] overflow-y-auto p-4 space-y-6">
          {/* 外观模式 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Monitor className="w-4 h-4" />
                <span>外观模式</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('light')}
                  className="flex flex-col items-center space-y-1 h-auto py-2"
                >
                  <Sun className="w-4 h-4" />
                  <span className="text-xs">浅色</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('dark')}
                  className="flex flex-col items-center space-y-1 h-auto py-2"
                >
                  <Moon className="w-4 h-4" />
                  <span className="text-xs">深色</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTheme('system')}
                  className="flex flex-col items-center space-y-1 h-auto py-2"
                >
                  <Monitor className="w-4 h-4" />
                  <span className="text-xs">自动</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 主题颜色 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>主题颜色</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              {/* 当前颜色预览 */}
              <div className="flex items-center space-x-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <div 
                  className="w-6 h-6 rounded-full border-2 border-white shadow-sm"
                  style={{ backgroundColor: `hsl(${config.primaryColor})` }}
                />
                <div className="flex-1">
                  <div className="text-sm font-medium">当前主色调</div>
                  <div className="text-xs text-muted-foreground">HSL({config.primaryColor})</div>
                </div>
              </div>
              
              {/* 预设颜色 */}
              <div className="grid grid-cols-3 gap-2">
                {predefinedThemes.map((preset) => (
                  <button
                    key={preset.name}
                    className={cn(
                      "flex flex-col items-center space-y-2 p-3 rounded-lg border transition-all duration-200 hover:scale-105",
                      config.primaryColor === preset.primary 
                        ? "border-primary bg-primary/5" 
                        : "border-border hover:border-border/80"
                    )}
                    onClick={() => updateConfig({ primaryColor: preset.primary })}
                  >
                    <div className={`w-6 h-6 rounded-full ${preset.preview}`} />
                    <span className="text-xs font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 布局样式 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Tablet className="w-4 h-4" />
                <span>布局样式</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {layoutOptions.map((layout) => (
                  <button
                    key={layout.id}
                    className={cn(
                      "w-full flex items-center space-x-3 p-3 rounded-lg border text-left transition-all duration-200",
                      config.layout === layout.id
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-border/80 hover:bg-muted/50"
                    )}
                    onClick={() => updateConfig({ layout: layout.id })}
                  >
                    <layout.icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{layout.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 显示设置 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Eye className="w-4 h-4" />
                <span>显示设置</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-4">
                {/* 显示内容开关 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">显示内容</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <Label htmlFor="show-cover" className="text-xs font-normal cursor-pointer">
                        封面图片
                      </Label>
                      <Switch
                        id="show-cover"
                        checked={displaySettings.showCover}
                        onCheckedChange={(checked) => updateDisplaySettings({ showCover: checked })}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <Label htmlFor="show-favicon" className="text-xs font-normal cursor-pointer">
                        网站图标
                      </Label>
                      <Switch
                        id="show-favicon"
                        checked={displaySettings.showFavicon}
                        onCheckedChange={(checked) => updateDisplaySettings({ showFavicon: checked })}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <Label htmlFor="show-title" className="text-xs font-normal cursor-pointer">
                        标题
                      </Label>
                      <Switch
                        id="show-title"
                        checked={displaySettings.showTitle}
                        onCheckedChange={(checked) => updateDisplaySettings({ showTitle: checked })}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <Label htmlFor="show-description" className="text-xs font-normal cursor-pointer">
                        描述
                      </Label>
                      <Switch
                        id="show-description"
                        checked={displaySettings.showDescription}
                        onCheckedChange={(checked) => updateDisplaySettings({ showDescription: checked })}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <Label htmlFor="show-url" className="text-xs font-normal cursor-pointer">
                        网址
                      </Label>
                      <Switch
                        id="show-url"
                        checked={displaySettings.showUrl}
                        onCheckedChange={(checked) => updateDisplaySettings({ showUrl: checked })}
                        className="scale-75"
                      />
                    </div>
                    <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                      <Label htmlFor="show-tags" className="text-xs font-normal cursor-pointer">
                        标签
                      </Label>
                      <Switch
                        id="show-tags"
                        checked={displaySettings.showTags}
                        onCheckedChange={(checked) => updateDisplaySettings({ showTags: checked })}
                        className="scale-75"
                      />
                    </div>
                  </div>
                </div>



                {/* 圆角样式 */}
                <div className="space-y-3">
                  <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">圆角样式</h4>
                  <Select
                    value={displaySettings.cardRadius}
                    onValueChange={(value: typeof displaySettings.cardRadius) =>
                      updateDisplaySettings({ cardRadius: value })
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
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

                {/* 网格列数 - 仅在网格布局下显示 */}
                {config.layout === 'grid' && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">网格列数</h4>
                    <div className="grid grid-cols-2 gap-2">
                      {/* 手机 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-normal">
                            {getBreakpointInfo('mobile').name}
                          </Label>
                          {getBreakpointInfo('mobile').isActive && (
                            <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              当前生效
                            </span>
                          )}
                        </div>
                        <Select
                          value={displaySettings.gridColumns.mobile.toString()}
                          onValueChange={(value) => updateDisplaySettings({
                            gridColumns: {
                              ...displaySettings.gridColumns,
                              mobile: parseInt(value) as any
                            }
                          })}
                        >
                          <SelectTrigger className={cn(
                            "h-7 text-xs",
                            getBreakpointInfo('mobile').isActive && "ring-1 ring-primary/20 border-primary/30"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1列</SelectItem>
                            <SelectItem value="2">2列</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 平板 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-normal">
                            {getBreakpointInfo('tablet').name}
                          </Label>
                          {getBreakpointInfo('tablet').isActive && (
                            <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              当前生效
                            </span>
                          )}
                        </div>
                        <Select
                          value={displaySettings.gridColumns.tablet.toString()}
                          onValueChange={(value) => updateDisplaySettings({
                            gridColumns: {
                              ...displaySettings.gridColumns,
                              tablet: parseInt(value) as any
                            }
                          })}
                        >
                          <SelectTrigger className={cn(
                            "h-7 text-xs",
                            getBreakpointInfo('tablet').isActive && "ring-1 ring-primary/20 border-primary/30"
                          )}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="1">1列</SelectItem>
                            <SelectItem value="2">2列</SelectItem>
                            <SelectItem value="3">3列</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* 桌面 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-normal">
                            {getBreakpointInfo('desktop').name}
                          </Label>
                          {getBreakpointInfo('desktop').isActive && (
                            <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              当前生效
                            </span>
                          )}
                        </div>
                        <Select
                          value={displaySettings.gridColumns.desktop.toString()}
                          onValueChange={(value) => updateDisplaySettings({
                            gridColumns: {
                              ...displaySettings.gridColumns,
                              desktop: parseInt(value) as any
                            }
                          })}
                        >
                          <SelectTrigger className={cn(
                            "h-7 text-xs",
                            getBreakpointInfo('desktop').isActive && "ring-1 ring-primary/20 border-primary/30"
                          )}>
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

                      {/* 大屏 */}
                      <div className="space-y-1">
                        <div className="flex items-center justify-between">
                          <Label className="text-xs font-normal">
                            {getBreakpointInfo('large').name}
                          </Label>
                          {getBreakpointInfo('large').isActive && (
                            <span className="text-[10px] px-1 py-0.5 bg-primary/10 text-primary rounded font-medium">
                              当前生效
                            </span>
                          )}
                        </div>
                        <Select
                          value={displaySettings.gridColumns.large.toString()}
                          onValueChange={(value) => updateDisplaySettings({
                            gridColumns: {
                              ...displaySettings.gridColumns,
                              large: parseInt(value) as any
                            }
                          })}
                        >
                          <SelectTrigger className={cn(
                            "h-7 text-xs",
                            getBreakpointInfo('large').isActive && "ring-1 ring-primary/20 border-primary/30"
                          )}>
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
            </CardContent>
          </Card>

          {/* 界面调整 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">界面调整</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* 字体大小 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">字体大小</Label>
                  <span className="text-xs text-muted-foreground">{
                    config.fontSize === 12 ? '小' :
                    config.fontSize === 14 ? '标准' :
                    config.fontSize === 16 ? '大' :
                    config.fontSize === 18 ? '超大' : `${config.fontSize}px`
                  }</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  <Button
                    variant={config.fontSize === 12 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig({ fontSize: 12 })}
                    className="text-xs"
                  >
                    小
                  </Button>
                  <Button
                    variant={config.fontSize === 14 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig({ fontSize: 14 })}
                    className="text-xs"
                  >
                    标准
                  </Button>
                  <Button
                    variant={config.fontSize === 16 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig({ fontSize: 16 })}
                    className="text-xs"
                  >
                    大
                  </Button>
                  <Button
                    variant={config.fontSize === 18 ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateConfig({ fontSize: 18 })}
                    className="text-xs"
                  >
                    超大
                  </Button>
                </div>
              </div>

              {/* 开关选项 */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-sm">动画效果</Label>
                    <p className="text-xs text-muted-foreground">启用过渡动画和悬停效果</p>
                  </div>
                  <Switch
                    checked={config.animations}
                    onCheckedChange={(checked) => updateConfig({ animations: checked })}
                  />
                </div>


              </div>
            </CardContent>
          </Card>

          {/* 快捷操作 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">快捷操作</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-2">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  // 导出配置
                  const dataStr = JSON.stringify(config, null, 2)
                  const dataBlob = new Blob([dataStr], { type: 'application/json' })
                  const url = URL.createObjectURL(dataBlob)
                  const link = document.createElement('a')
                  link.href = url
                  link.download = 'theme-config.json'
                  link.click()
                  URL.revokeObjectURL(url)
                  toast.success('配置已导出')
                }}
              >
                <Download className="w-4 h-4 mr-2" />
                导出配置
              </Button>

              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  const defaultConfig = {
                    primaryColor: '142 76% 36%',
                    borderRadius: 8,
                    fontSize: 14,
                    layout: 'grid',
                    animations: true,
                    compactMode: false,
                  }
                  updateConfig(defaultConfig)
                  toast.success('已重置为默认设置')
                }}
              >
                重置设置
              </Button>

              <Button
                variant="destructive"
                size="sm"
                className="w-full justify-start"
                onClick={() => {
                  if (confirm('确定要清空所有数据吗？此操作将删除所有书签、分类、设置、搜索历史等数据，且不可撤销！')) {
                    if (confirm('最后确认：这将清空应用的所有数据，包括：\n• 所有书签和分类\n• 主题和显示设置\n• 搜索历史和用户活动\n• PWA安装状态\n\n确定要继续吗？')) {
                      // 清空所有localStorage数据
                      localStorage.clear()

                      // 清空sessionStorage（如果有的话）
                      sessionStorage.clear()

                      alert('所有数据已清空，页面将自动刷新')
                      window.location.reload()
                    }
                  }
                }}
              >
                清空所有数据
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>

      {/* 折叠按钮 */}
      <Button
        variant="outline"
        size="sm"
        className={cn(
          "fixed top-1/2 -translate-y-1/2 z-40 transition-all duration-300",
          isOpen ? "right-80" : "right-4"
        )}
        onClick={onToggle}
      >
        {isOpen ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </Button>
    </>
  )
}
