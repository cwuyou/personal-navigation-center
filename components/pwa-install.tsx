"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Download, Smartphone, Monitor, X, Wifi, WifiOff } from "lucide-react"
import { toast } from "sonner"

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [showInstallBanner, setShowInstallBanner] = useState(false)

  useEffect(() => {
    // 检查是否已安装
    const checkIfInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    // 监听安装提示事件
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
      setIsInstallable(true)
      
      // 检查是否应该显示安装横幅
      const installDismissed = localStorage.getItem('pwa-install-dismissed')
      const installCount = parseInt(localStorage.getItem('pwa-install-count') || '0')
      
      if (!installDismissed && installCount < 3) {
        setTimeout(() => setShowInstallBanner(true), 3000) // 3秒后显示
      }
    }

    // 监听应用安装事件
    const handleAppInstalled = () => {
      setIsInstalled(true)
      setIsInstallable(false)
      setShowInstallBanner(false)
      toast.success('应用安装成功！')
      localStorage.removeItem('pwa-install-dismissed')
      localStorage.removeItem('pwa-install-count')
    }

    // 监听网络状态
    const handleOnline = () => {
      setIsOnline(true)
      toast.success('网络连接已恢复')
    }

    const handleOffline = () => {
      setIsOnline(false)
      toast.info('当前处于离线模式')
    }

    checkIfInstalled()
    
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // 注册 Service Worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('SW registered: ', registration)
          
          // 检查更新
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  toast.info('应用有新版本可用', {
                    action: {
                      label: '更新',
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' })
                        window.location.reload()
                      }
                    }
                  })
                }
              })
            }
          })
        })
        .catch((registrationError) => {
          console.log('SW registration failed: ', registrationError)
        })
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  // 安装应用
  const handleInstall = async () => {
    if (!deferredPrompt) return

    try {
      await deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt')
      } else {
        console.log('User dismissed the install prompt')
        const count = parseInt(localStorage.getItem('pwa-install-count') || '0')
        localStorage.setItem('pwa-install-count', (count + 1).toString())
      }
      
      setDeferredPrompt(null)
      setIsInstallable(false)
      setShowInstallBanner(false)
    } catch (error) {
      console.error('Install failed:', error)
      toast.error('安装失败，请稍后重试')
    }
  }

  // 关闭安装横幅
  const dismissInstallBanner = () => {
    setShowInstallBanner(false)
    localStorage.setItem('pwa-install-dismissed', 'true')
  }

  // 获取设备类型
  const getDeviceType = () => {
    const userAgent = navigator.userAgent.toLowerCase()
    if (/mobile|android|iphone|ipad|phone/i.test(userAgent)) {
      return 'mobile'
    }
    return 'desktop'
  }

  // 安装横幅
  if (showInstallBanner && isInstallable && !isInstalled) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:w-96">
        <Card className="border-primary/20 bg-card/95 backdrop-blur-sm shadow-lg">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg flex items-center space-x-2">
                <Download className="w-5 h-5 text-primary" />
                <span>安装应用</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                className="h-6 w-6 p-0"
                onClick={dismissInstallBanner}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-0">
            <p className="text-sm text-muted-foreground mb-4">
              安装到{getDeviceType() === 'mobile' ? '手机' : '桌面'}，享受更好的体验
            </p>
            <div className="flex space-x-2">
              <Button onClick={handleInstall} className="flex-1">
                <Download className="w-4 h-4 mr-2" />
                立即安装
              </Button>
              <Button variant="outline" onClick={dismissInstallBanner}>
                稍后
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  // 网络状态指示器
  return (
    <div className="fixed bottom-4 right-4 z-40">
      {!isOnline && (
        <Badge variant="secondary" className="flex items-center space-x-1 bg-orange-100 text-orange-800 border-orange-200">
          <WifiOff className="w-3 h-3" />
          <span>离线模式</span>
        </Badge>
      )}
      
      {isInstallable && !showInstallBanner && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleInstall}
          className="ml-2 bg-background/80 backdrop-blur-sm"
        >
          <Download className="w-4 h-4 mr-2" />
          安装应用
        </Button>
      )}
    </div>
  )
}

// PWA 功能检测 Hook
export function usePWAFeatures() {
  const [isInstalled, setIsInstalled] = useState(false)
  const [isOnline, setIsOnline] = useState(true)
  const [canInstall, setCanInstall] = useState(false)

  useEffect(() => {
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      const isInWebAppiOS = (window.navigator as any).standalone === true
      setIsInstalled(isStandalone || isInWebAppiOS)
    }

    const handleOnlineStatus = () => setIsOnline(navigator.onLine)
    
    const handleBeforeInstallPrompt = () => setCanInstall(true)

    checkInstalled()
    handleOnlineStatus()

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('online', handleOnlineStatus)
    window.addEventListener('offline', handleOnlineStatus)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('online', handleOnlineStatus)
      window.removeEventListener('offline', handleOnlineStatus)
    }
  }, [])

  // 缓存重要数据
  const cacheData = async (data: any) => {
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'CACHE_DATA',
        payload: data
      })
    }
  }

  // 请求通知权限
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission()
      return permission === 'granted'
    }
    return false
  }

  return {
    isInstalled,
    isOnline,
    canInstall,
    cacheData,
    requestNotificationPermission
  }
}
