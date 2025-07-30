import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export type CardLayout = 'compact' | 'comfortable' | 'spacious'
export type GridColumns = 1 | 2 | 3 | 4 | 5 | 6

export interface DisplaySettings {
  // 显示开关
  showCover: boolean      // 显示封面
  showTitle: boolean      // 显示标题
  showDescription: boolean // 显示描述
  showUrl: boolean        // 显示网址
  showTags: boolean       // 显示标签
  showFavicon: boolean    // 显示网站图标
  
  // 布局设置
  cardLayout: CardLayout  // 卡片布局模式
  gridColumns: {          // 不同屏幕尺寸的列数
    mobile: GridColumns   // 手机
    tablet: GridColumns   // 平板
    desktop: GridColumns  // 桌面
    large: GridColumns    // 大屏
  }
  
  // 卡片样式
  showCardBorder: boolean // 显示卡片边框
  showCardShadow: boolean // 显示卡片阴影
  cardRadius: 'none' | 'sm' | 'md' | 'lg' | 'xl' // 卡片圆角
}

interface DisplaySettingsStore {
  settings: DisplaySettings
  updateSettings: (settings: Partial<DisplaySettings>) => void
  resetSettings: () => void
}

const defaultSettings: DisplaySettings = {
  // 显示开关 - 默认显示所有内容
  showCover: true,
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
  showCardBorder: true,
  showCardShadow: true,
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
