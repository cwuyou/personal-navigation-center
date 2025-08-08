"use client"

import { Eye } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDisplaySettings, type CardLayout } from "@/hooks/use-display-settings"

export function QuickDisplaySettings() {
  const { settings, updateSettings } = useDisplaySettings()

  // 处理显示密度变化
  const handleDisplayDensityChange = (layout: CardLayout) => {
    updateSettings({ cardLayout: layout })

    // 同时控制全局紧凑模式
    if (typeof window !== 'undefined') {
      const root = document.documentElement
      root.classList.toggle('compact-mode', layout === 'compact')
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="hover:bg-primary/10">
          <Eye className="h-4 w-4 mr-2" />
          显示
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        className="w-80 p-0 shadow-xl border border-border/20 bg-background/95 backdrop-blur-sm rounded-lg animate-in slide-in-from-top-2 duration-200"
        align="end"
        sideOffset={8}
      >
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center space-x-2">
              <Eye className="w-4 h-4" />
              <span>显示设置</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-4">
            {/* 显示内容开关 */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">显示内容</h4>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <Label htmlFor="quick-show-cover" className="text-xs font-normal cursor-pointer">
                    封面图片
                  </Label>
                  <Switch
                    id="quick-show-cover"
                    checked={settings.showCover}
                    onCheckedChange={(checked) => updateSettings({ showCover: checked })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <Label htmlFor="quick-show-favicon" className="text-xs font-normal cursor-pointer">
                    网站图标
                  </Label>
                  <Switch
                    id="quick-show-favicon"
                    checked={settings.showFavicon}
                    onCheckedChange={(checked) => updateSettings({ showFavicon: checked })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <Label htmlFor="quick-show-title" className="text-xs font-normal cursor-pointer">
                    标题
                  </Label>
                  <Switch
                    id="quick-show-title"
                    checked={settings.showTitle}
                    onCheckedChange={(checked) => updateSettings({ showTitle: checked })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <Label htmlFor="quick-show-description" className="text-xs font-normal cursor-pointer">
                    描述
                  </Label>
                  <Switch
                    id="quick-show-description"
                    checked={settings.showDescription}
                    onCheckedChange={(checked) => updateSettings({ showDescription: checked })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <Label htmlFor="quick-show-url" className="text-xs font-normal cursor-pointer">
                    网址
                  </Label>
                  <Switch
                    id="quick-show-url"
                    checked={settings.showUrl}
                    onCheckedChange={(checked) => updateSettings({ showUrl: checked })}
                    className="scale-75"
                  />
                </div>
                <div className="flex items-center justify-between p-2 rounded-lg border border-border/50">
                  <Label htmlFor="quick-show-tags" className="text-xs font-normal cursor-pointer">
                    标签
                  </Label>
                  <Switch
                    id="quick-show-tags"
                    checked={settings.showTags}
                    onCheckedChange={(checked) => updateSettings({ showTags: checked })}
                    className="scale-75"
                  />
                </div>
              </div>
            </div>

            {/* 显示密度 */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">显示密度</h4>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  variant={settings.cardLayout === 'compact' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDisplayDensityChange('compact')}
                  className="text-xs h-7"
                >
                  紧凑
                </Button>
                <Button
                  variant={settings.cardLayout === 'comfortable' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDisplayDensityChange('comfortable')}
                  className="text-xs h-7"
                >
                  舒适
                </Button>
                <Button
                  variant={settings.cardLayout === 'spacious' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleDisplayDensityChange('spacious')}
                  className="text-xs h-7"
                >
                  宽松
                </Button>
              </div>
            </div>

            {/* 圆角样式 */}
            <div className="space-y-3">
              <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide">圆角样式</h4>
              <Select
                value={settings.cardRadius}
                onValueChange={(value: typeof settings.cardRadius) => 
                  updateSettings({ cardRadius: value })
                }
              >
                <SelectTrigger className="h-7 text-xs">
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
          </CardContent>
        </Card>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
