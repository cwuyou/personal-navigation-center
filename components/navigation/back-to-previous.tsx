"use client"

import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'

type BtnSize = 'sm' | 'default' | 'lg'

type BtnVariant = 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'

export function BackToPreviousButton({
  label = '返回上一页',
  fallbackHref = '/',
  size = 'sm',
  variant = 'ghost',
  title,
}: {
  label?: string
  fallbackHref?: string
  size?: BtnSize
  variant?: BtnVariant
  title?: string
}) {
  const router = useRouter()

  const handleClick = () => {
    try {
      const hasHistory = typeof window !== 'undefined' && window.history.length > 1
      const sameOriginReferrer =
        typeof document !== 'undefined' && document.referrer
          ? new URL(document.referrer).origin === window.location.origin
          : false

      if (hasHistory && sameOriginReferrer) {
        router.back()
      } else {
        router.push(fallbackHref)
      }
    } catch {
      router.push(fallbackHref)
    }
  }

  return (
    <Button variant={variant} size={size} onClick={handleClick} title={title ?? label} className="hover:bg-primary/10">
      <ArrowLeft className="h-4 w-4 sm:mr-2" />
      <span className="hidden sm:inline">{label}</span>
    </Button>
  )
}

