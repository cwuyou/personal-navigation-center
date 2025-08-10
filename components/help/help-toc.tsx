"use client"

import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { List, BookOpen, FileText, Code, MonitorCog, Link as LinkIcon } from 'lucide-react'

export function HelpTOC() {
  const switchTab = (tab: 'overview' | 'html' | 'json' | 'browser') => {
    const ev = new CustomEvent('help:setTab', { detail: tab })
    window.dispatchEvent(ev)
    const top = document.getElementById('import-help-top')
    top?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const scrollTo = (id: string) => {
    const el = document.getElementById(id)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const itemCls = "justify-start transition-colors hover:!bg-primary/10 hover:!text-primary focus-visible:ring-2 focus-visible:ring-primary/50 active:bg-primary/15"

  return (
    <div className="hidden xl:block fixed right-6 top-28 w-64 z-20">
      <Card className="p-3 space-y-2 text-sm">
        <div className="flex items-center gap-2 text-foreground/80">
          <List className="h-4 w-4" />
          <span className="font-medium">目录</span>
        </div>
        <div className="mt-1 space-y-1">
          <div className="text-xs text-muted-foreground px-1">导入说明</div>
          <div className="grid grid-cols-2 gap-1">
            <Button size="sm" variant="ghost" className={itemCls} onClick={() => switchTab('overview')}>
              <BookOpen className="h-4 w-4 mr-2" /> 概述
            </Button>
            <Button size="sm" variant="ghost" className={itemCls} onClick={() => switchTab('html')}>
              <FileText className="h-4 w-4 mr-2" /> HTML
            </Button>
            <Button size="sm" variant="ghost" className={itemCls} onClick={() => switchTab('json')}>
              <Code className="h-4 w-4 mr-2" /> JSON
            </Button>
            <Button size="sm" variant="ghost" className={itemCls} onClick={() => switchTab('browser')}>
              <MonitorCog className="h-4 w-4 mr-2" /> 浏览器
            </Button>
          </div>
        </div>
        <div className="mt-2 space-y-1">
          <div className="text-xs text-muted-foreground px-1">更多</div>
          <div className="grid grid-cols-1 gap-1">
            <Button size="sm" variant="ghost" className={itemCls} onClick={() => scrollTo('troubleshooting')}>
              <LinkIcon className="h-4 w-4 mr-2" /> 导入排查
            </Button>
            <Button size="sm" variant="ghost" className={itemCls} onClick={() => scrollTo('dedupe')}>
              <LinkIcon className="h-4 w-4 mr-2" /> 去重策略
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}

