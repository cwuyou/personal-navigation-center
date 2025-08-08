import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { useEffect, useState } from 'react'

export type CardLayout = 'compact' | 'comfortable' | 'spacious'
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6

// 断点定义
export const breakpoints = {
  mobile: 640,
  tablet: 1024,
  desktop: 1536,
} as const

export type Breakpoint = 'mobile' | 'tablet' | 'desktop' | 'large'

export interface DisplaySettings {
  // 显示开关
  showCover: boolean      // 显示封面
  showTitle: boolean      // 显示标题
  showDescription: boolean // 显示描述
  showUrl: boolean        // 显示网址
  showTags: boolean       // 显示标签
  showFavicon: boolean    // 显示网站图标
  
  // 布局设置
  cardLayout: CardLayout  // 显示密度模式
  gridColumns: {          // 不同屏幕尺寸的列数
    mobile: GridColumns   // 手机
    tablet: GridColumns   // 平板
    desktop: GridColumns  // 桌面
    large: GridColumns    // 大屏
  }

  // 样式设置
  cardRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' // 圆角样式
}

interface DisplaySettingsStore {
  settings: DisplaySettings
  updateSettings: (settings: Partial<DisplaySettings>) => void
  resetSettings: () => void
}

const defaultSettings: DisplaySettings = {
  // 显示开关 - 优化默认显示内容
  showCover: false,  // 默认关闭封面图片（避免显示空白或错误图片）
  showTitle: true,
  showDescription: true,
  showUrl: false,  // 默认隐藏网址
  showTags: true,
  showFavicon: true,
  
  // 布局设置
  cardLayout: 'comfortable',
  gridColumns: {
    mobile: 1,
    tablet: 2,
    desktop: 3,
    large: 4,
  },
  
  // 卡片样式
  cardRadius: 'lg',
}

export const useDisplaySettings = create<DisplaySettingsStore>()(
  persist(
    (set) => ({
      settings: defaultSettings,

      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),

      resetSettings: () =>
        set({ settings: defaultSettings }),
    }),
    {
      name: 'display-settings-storage',
      // 添加 SSR 支持
      skipHydration: true,
    }
  )
)

// 获取当前断点
export function getCurrentBreakpoint(): Breakpoint {
  if (typeof window === 'undefined') return 'desktop'

  const width = window.innerWidth
  if (width < breakpoints.mobile) return 'mobile'
  if (width < breakpoints.tablet) return 'tablet'
  if (width < breakpoints.desktop) return 'desktop'
  return 'large'
}

// 检查是否为指定断点
export function isActiveBreakpoint(breakpoint: Breakpoint): boolean {
  return getCurrentBreakpoint() === breakpoint
}

// 获取当前布局模式（基于断点和设置）
export function getCurrentLayoutMode(): string {
  const breakpoint = getCurrentBreakpoint()
  const settings = useDisplaySettings.getState().settings
  const columns = settings.gridColumns[breakpoint]
  return `${breakpoint}-${columns}col`
}

// 响应式布局 Hook
export function useResponsiveLayout() {
  const [breakpoint, setBreakpoint] = useState<Breakpoint>('desktop')
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const updateLayout = () => {
      const width = window.innerWidth
      const height = window.innerHeight
      const newBreakpoint = getCurrentBreakpoint()

      setWindowSize({ width, height })
      setBreakpoint(newBreakpoint)

      // 布局调试信息已移除，避免控制台噪音
    }

    // 初始化
    updateLayout()

    // 监听窗口大小变化
    window.addEventListener('resize', updateLayout)

    // 调试函数已移除，避免控制台噪音

    return () => {
      window.removeEventListener('resize', updateLayout)
    }
  }, [])

  return {
    breakpoint,
    windowSize,
    isBreakpointActive: (bp: Breakpoint) => breakpoint === bp,
    getCurrentLayoutMode,
  }
}
