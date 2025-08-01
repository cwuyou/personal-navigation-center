// 主题加载器 - 在页面加载时立即应用保存的主题
export function loadSavedTheme() {
  if (typeof window === 'undefined') return

  try {
    const saved = localStorage.getItem('theme-config')
    if (saved) {
      const config = JSON.parse(saved)
      const root = document.documentElement
      
      console.log('Loading saved theme on page load:', config)
      
      // 立即应用CSS变量
      root.style.setProperty('--primary', config.primaryColor, 'important')
      root.style.setProperty('--radius', `${config.borderRadius}px`, 'important')
      root.style.setProperty('--primary-foreground', '0 0% 98%', 'important')
      root.style.setProperty('--ring', config.primaryColor, 'important')

      // 修复黑色主题在深色模式下的可见性问题
      const isDarkMode = root.classList.contains('dark')
      const isBlackTheme = config.primaryColor === '0 0% 9%'

      if (isDarkMode && isBlackTheme) {
        // 在深色模式下使用黑色主题时，添加特殊类来修复可见性
        root.classList.add('dark-black-theme-fix')
      } else {
        root.classList.remove('dark-black-theme-fix')
      }
      
      // 应用字体大小
      if (config.fontSize && config.fontSize !== 14) {
        root.style.fontSize = `${config.fontSize}px`
      }
      
      // 应用类名
      if (config.compactMode) {
        root.classList.add('compact-mode')
      }
      
      if (!config.animations) {
        root.classList.add('no-animations')
      }
      
      if (config.cardStyle && config.cardStyle !== 'default') {
        root.classList.add(`card-style-${config.cardStyle}`)
      }
      
      if (config.layout && config.layout !== 'grid') {
        root.classList.add(`layout-${config.layout}`)
      }
      
      console.log('Theme loaded successfully on page load')
    }
  } catch (error) {
    console.error('Failed to load saved theme:', error)
  }
}

// 在页面加载时自动执行
if (typeof window !== 'undefined') {
  // 立即执行
  loadSavedTheme()
  
  // 也在 DOMContentLoaded 时执行，确保万无一失
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSavedTheme)
  }
}
