"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Palette, Monitor, Sun, Moon, Smartphone, Tablet, Laptop } from "lucide-react"
import { useTheme } from "next-themes"
import { toast } from "sonner"

interface ThemeConfig {
  primaryColor: string
  borderRadius: number
  fontSize: number
  spacing: number
  cardStyle: 'default' | 'minimal' | 'glass' | 'shadow'
  layout: 'grid' | 'list' | 'masonry'
  animations: boolean
}

const predefinedThemes = [
  { name: '经典黑色', primary: '0 0% 9%', preview: 'bg-gray-900' },
  { name: '科技蓝色', primary: '221.2 83.2% 53.3%', preview: 'bg-blue-500' },
  { name: '优雅紫色', primary: '262.1 83.3% 57.8%', preview: 'bg-purple-500' },
  { name: '自然绿色', primary: '142.1 76.2% 36.3%', preview: 'bg-green-500' },
  { name: '温暖橙色', primary: '24.6 95% 53.1%', preview: 'bg-orange-500' },
  { name: '深邃靛蓝', primary: '239 84% 67%', preview: 'bg-indigo-500' },
  { name: '玫瑰粉色', primary: '330 81% 60%', preview: 'bg-pink-500' },
]

const cardStyles = [
  { id: 'default', name: '默认', description: '标准卡片样式' },
  { id: 'minimal', name: '简约', description: '最小化边框和阴影' },
  { id: 'glass', name: '玻璃', description: '毛玻璃效果' },
  { id: 'shadow', name: '阴影', description: '增强阴影效果' },
]

const layoutOptions = [
  { id: 'grid', name: '网格', icon: Monitor, description: '标准网格布局' },
  { id: 'list', name: '列表', icon: Smartphone, description: '垂直列表布局' },
  { id: 'masonry', name: '瀑布流', icon: Tablet, description: '不规则瀑布流布局' },
]

export function ThemeCustomizer() {
  const { theme, setTheme } = useTheme()
  const [config, setConfig] = useState<ThemeConfig>({
    primaryColor: '142 76% 36%',
    borderRadius: 8,
    fontSize: 14,
    spacing: 16,
    cardStyle: 'default',
    layout: 'grid',
    animations: true,
  })
  const [isLoaded, setIsLoaded] = useState(false)
  const [isClient, setIsClient] = useState(false)

  // 确保只在客户端渲染
  // 应用主题配置
  const applyTheme = useCallback((newConfig: ThemeConfig, showNotification = false) => {
    if (typeof window === 'undefined') return

    try {
      const root = document.documentElement

      console.log('Applying theme config:', newConfig, 'Show notification:', showNotification)

      // 应用CSS变量 - 使用 !important 确保覆盖
      root.style.setProperty('--primary', newConfig.primaryColor, 'important')
      root.style.setProperty('--radius', `${newConfig.borderRadius}px`, 'important')

      // 同时更新相关的主色调变量
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

      // 移除旧的卡片样式类
      cardStyles.forEach(style => {
        root.classList.remove(`card-style-${style.id}`)
      })
      root.classList.add(`card-style-${newConfig.cardStyle}`)

      // 移除旧的布局类
      layoutOptions.forEach(layout => {
        root.classList.remove(`layout-${layout.id}`)
      })
      root.classList.add(`layout-${newConfig.layout}`)

      console.log('Theme applied successfully')

      // 只在明确要求显示通知时才显示
      if (showNotification) {
        toast.success('主题已更新', {
          duration: 2000,
          style: {
            background: `hsl(${newConfig.primaryColor})`,
            color: 'white',
            border: 'none'
          }
        })
      }

    } catch (error) {
      console.error('Failed to apply theme:', error)
    }
  }, [])

  useEffect(() => {
    setIsClient(true)
  }, [])

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

  // 加载保存的配置
  useEffect(() => {
    if (typeof window === 'undefined' || isLoaded) return

    const saved = localStorage.getItem('theme-config')
    if (saved) {
      try {
        const parsed = JSON.parse(saved)
        console.log('Loading saved theme config (no notification):', parsed)
        setConfig(parsed)
        // 延迟应用主题，确保 DOM 已准备好，但不显示通知
        setTimeout(() => {
          applyTheme(parsed, false) // 明确不显示通知
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
      const isBluTheme = currentPrimary === '221.2 83.2% 53.3%'

      const defaultConfig = {
        primaryColor: '142 76% 36%', // 默认使用自然绿色
        borderRadius: 8,
        fontSize: 14,
        spacing: 16,
        cardStyle: 'default' as const,
        layout: 'grid' as const,
        animations: true,
      }
      setConfig(defaultConfig)
      setTimeout(() => {
        applyTheme(defaultConfig, false) // 明确不显示通知
        setIsLoaded(true)
      }, 100)
    }
  }, [applyTheme, isLoaded])

  // 更新配置
  const updateConfig = (updates: Partial<ThemeConfig>) => {
    const newConfig = { ...config, ...updates }
    console.log('Updating config:', updates, 'New config:', newConfig)
    setConfig(newConfig)
    // 用户主动更改时显示通知
    applyTheme(newConfig, true)
    if (typeof window !== 'undefined') {
      localStorage.setItem('theme-config', JSON.stringify(newConfig))
      console.log('Theme config saved to localStorage')
    }
  }

  // 重置为默认主题
  const resetTheme = () => {
    const defaultConfig: ThemeConfig = {
      primaryColor: '142 76% 36%',
      borderRadius: 8,
      fontSize: 14,
      spacing: 16,
      cardStyle: 'default',
      layout: 'grid',
      animations: true,
    }
    updateConfig(defaultConfig)
  }

  // 导出主题配置
  const exportTheme = () => {
    const dataStr = JSON.stringify(config, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = 'theme-config.json'
    link.click()
    URL.revokeObjectURL(url)
  }

  // 导入主题配置
  const importTheme = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const imported = JSON.parse(e.target?.result as string)
        updateConfig(imported)
      } catch (error) {
        console.error('Failed to import theme:', error)
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">主题定制</h2>
          <p className="text-muted-foreground">个性化您的导航中心外观</p>
        </div>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            onClick={() => {
              // 测试主题切换
              const testColor = config.primaryColor === '221.2 83.2% 53.3%' ? '262.1 83.3% 57.8%' : '221.2 83.2% 53.3%'
              console.log('Testing theme switch from', config.primaryColor, 'to', testColor)
              updateConfig({ primaryColor: testColor })
            }}
          >
            测试切换
          </Button>
          <Button variant="outline" onClick={exportTheme}>
            导出主题
          </Button>
          <Button variant="outline" onClick={() => document.getElementById('import-theme')?.click()}>
            导入主题
          </Button>
          <input
            id="import-theme"
            type="file"
            accept=".json"
            className="hidden"
            onChange={importTheme}
          />
          <Button variant="outline" onClick={resetTheme}>
            重置
          </Button>
        </div>
      </div>

      <Tabs defaultValue="colors" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="colors">颜色</TabsTrigger>
          <TabsTrigger value="layout">布局</TabsTrigger>
          <TabsTrigger value="typography">字体</TabsTrigger>
          <TabsTrigger value="effects">效果</TabsTrigger>
        </TabsList>

        <TabsContent value="colors" className="space-y-6">
          {/* 深色/浅色模式 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Monitor className="w-5 h-5" />
                <span>外观模式</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex space-x-4">
                <Button
                  variant={theme === 'light' ? 'default' : 'outline'}
                  onClick={() => setTheme('light')}
                  className="flex items-center space-x-2"
                >
                  <Sun className="w-4 h-4" />
                  <span>浅色</span>
                </Button>
                <Button
                  variant={theme === 'dark' ? 'default' : 'outline'}
                  onClick={() => setTheme('dark')}
                  className="flex items-center space-x-2"
                >
                  <Moon className="w-4 h-4" />
                  <span>深色</span>
                </Button>
                <Button
                  variant={theme === 'system' ? 'default' : 'outline'}
                  onClick={() => setTheme('system')}
                  className="flex items-center space-x-2"
                >
                  <Monitor className="w-4 h-4" />
                  <span>跟随系统</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 预设主题 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Palette className="w-5 h-5" />
                <span>预设主题</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* 实时预览区域 */}
              <div className="mb-6 p-4 border rounded-lg bg-card">
                <h4 className="text-sm font-medium mb-3">实时预览</h4>
                <div className="flex items-center space-x-3">
                  <div
                    className="w-8 h-8 rounded-full transition-colors duration-300"
                    style={{ backgroundColor: `hsl(${config.primaryColor})` }}
                  />
                  <div className="flex-1">
                    <div className="text-sm font-medium">当前主色调</div>
                    <div className="text-xs text-muted-foreground">HSL({config.primaryColor})</div>
                  </div>
                  <button
                    className="px-3 py-1 rounded text-sm font-medium text-white transition-colors duration-300"
                    style={{ backgroundColor: `hsl(${config.primaryColor})` }}
                  >
                    示例按钮
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {predefinedThemes.map((preset) => (
                  <button
                    key={preset.name}
                    className={`flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent transition-colors ${
                      config.primaryColor === preset.primary ? 'border-primary bg-primary/5' : ''
                    }`}
                    onClick={() => {
                      console.log('Applying theme:', preset.name, preset.primary)
                      updateConfig({ primaryColor: preset.primary })

                      // 立即视觉反馈
                      const button = document.activeElement as HTMLElement
                      if (button) {
                        button.style.transform = 'scale(0.95)'
                        setTimeout(() => {
                          button.style.transform = ''
                        }, 150)
                      }
                    }}
                  >
                    <div className={`w-6 h-6 rounded-full ${preset.preview}`} />
                    <span className="text-sm font-medium">{preset.name}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="layout" className="space-y-6">
          {/* 布局选项 */}
          <Card>
            <CardHeader>
              <CardTitle>布局样式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {layoutOptions.map((layout) => (
                  <button
                    key={layout.id}
                    className={`p-4 border rounded-lg transition-colors ${
                      config.layout === layout.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => updateConfig({ layout: layout.id as any })}
                  >
                    <layout.icon className="w-8 h-8 mx-auto mb-2" />
                    <h3 className="font-medium">{layout.name}</h3>
                    <p className="text-sm text-muted-foreground">{layout.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 卡片样式 */}
          <Card>
            <CardHeader>
              <CardTitle>卡片样式</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cardStyles.map((style) => (
                  <button
                    key={style.id}
                    className={`p-4 border rounded-lg text-left transition-colors ${
                      config.cardStyle === style.id ? 'border-primary bg-primary/5' : 'hover:bg-accent'
                    }`}
                    onClick={() => updateConfig({ cardStyle: style.id as any })}
                  >
                    <h3 className="font-medium">{style.name}</h3>
                    <p className="text-sm text-muted-foreground">{style.description}</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 显示选项说明 */}
          <Card>
            <CardHeader>
              <CardTitle>显示选项</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 显示密度设置已移至分类旁的"显示设置"按钮中，可统一控制页面和卡片的紧凑程度。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="typography" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>字体设置</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg">
                <p className="text-sm text-muted-foreground">
                  💡 字体大小设置已移至右上角"设置面板"中，可统一控制全局字体大小。
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="effects" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>视觉效果</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 bg-muted/30 rounded-lg mb-4">
                <p className="text-sm text-muted-foreground">
                  💡 圆角设置已移至"显示设置"中，可统一控制圆角样式。
                </p>
              </div>

              <div>
                <Label>间距大小: {config.spacing}px</Label>
                <Slider
                  value={[config.spacing]}
                  onValueChange={([value]) => updateConfig({ spacing: value })}
                  min={8}
                  max={32}
                  step={4}
                  className="mt-2"
                />
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <Label>动画效果</Label>
                  <p className="text-sm text-muted-foreground">启用过渡动画和悬停效果</p>
                </div>
                <Switch
                  checked={config.animations}
                  onCheckedChange={(checked) => updateConfig({ animations: checked })}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
