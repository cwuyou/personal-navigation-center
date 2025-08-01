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
  X
} from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"
import { cn } from "@/lib/utils"
import { useDisplaySettings, type CardLayout } from "@/hooks/use-display-settings"
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
  const [config, setConfig] = useState({
    primaryColor: '221.2 83.2% 53.3%',
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

      // 检测当前主题色，默认使用科技蓝色
      const isBlueTheme = currentPrimary === '221.2 83.2% 53.3%'

      const defaultConfig = {
        primaryColor: '221.2 83.2% 53.3%', // 默认使用科技蓝色
        borderRadius: 8,
        fontSize: 14,
        layout: 'grid',
        animations: true,
        compactMode: false,
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

  // 监听主题模式变化，重新应用修复逻辑
  useEffect(() => {
    if (!isClient || !isLoaded) return

    const handleThemeChange = () => {
      // 延迟一点时间确保DOM已更新
      setTimeout(() => {
        applyTheme(config, false)
      }, 100)
    }

    // 监听class变化（深色/浅色模式切换）
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          handleThemeChange()
        }
      })
    })

    const root = document.documentElement
    observer.observe(root, {
      attributes: true,
      attributeFilter: ['class']
    })

    return () => observer.disconnect()
  }, [isClient, isLoaded, config, applyTheme])

  // 处理显示密度变化
  const handleDisplayDensityChange = (layout: CardLayout) => {
    updateDisplaySettings({ cardLayout: layout })

    // 同时控制全局紧凑模式
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('compact-mode', layout === 'compact')
    }
  }

  // 初始化时应用显示密度设置
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('compact-mode', displaySettings.cardLayout === 'compact')
    }
  }, [displaySettings.cardLayout])

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
                    <span className="font-medium">{layout.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 界面调整 */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm">界面调整</CardTitle>
            </CardHeader>
            <CardContent className="pt-0 space-y-4">
              {/* 圆角大小 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">圆角大小</Label>
                  <span className="text-xs text-muted-foreground">{config.borderRadius}px</span>
                </div>
                <Slider
                  value={[config.borderRadius]}
                  onValueChange={([value]) => updateConfig({ borderRadius: value })}
                  min={0}
                  max={20}
                  step={2}
                  className="w-full"
                />
              </div>

              {/* 字体大小 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Label className="text-sm">字体大小</Label>
                  <span className="text-xs text-muted-foreground">{config.fontSize}px</span>
                </div>
                <Slider
                  value={[config.fontSize]}
                  onValueChange={([value]) => updateConfig({ fontSize: value })}
                  min={12}
                  max={18}
                  step={1}
                  className="w-full"
                />
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

                <div className="space-y-2">
                  <Label className="text-sm">显示密度</Label>
                  <Select value={displaySettings.cardLayout} onValueChange={handleDisplayDensityChange}>
                    <SelectTrigger className="h-8">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">紧凑 - 显示更多内容</SelectItem>
                      <SelectItem value="comfortable">舒适 - 平衡的间距</SelectItem>
                      <SelectItem value="spacious">宽松 - 更大的间距</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    同时影响页面整体间距和卡片布局
                  </p>
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
                    primaryColor: '221.2 83.2% 53.3%',
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
