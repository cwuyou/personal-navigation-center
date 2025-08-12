"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Download, Upload, Database } from "lucide-react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface DataManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function DataManagementDialog({ open, onOpenChange }: DataManagementDialogProps) {
  const { exportBookmarks, categories, bookmarks } = useBookmarkStore()
  const [format, setFormat] = useState<'json' | 'html'>('json')

  const doDownload = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const exportJSON = (data: any) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    doDownload(blob, `bookmarks-export-${new Date().toISOString().slice(0,10)}.json`)
  }

  const exportHTML = (data: any) => {
    const { categories, bookmarks } = data
    const lines: string[] = []
    lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
    lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">')
    lines.push('<TITLE>Bookmarks</TITLE>')
    lines.push('<H1>Bookmarks</H1>')
    lines.push('<DL><p>')
    for (const cat of categories) {
      lines.push(`    <DT><H3>${cat.name}</H3>`)
      lines.push('    <DL><p>')
      for (const sub of cat.subCategories || []) {
        lines.push(`        <DT><H3>${sub.name}</H3>`)
        lines.push('        <DL><p>')
        for (const bm of bookmarks.filter((b: any) => b.subCategoryId === sub.id)) {
          const title = (bm.title || bm.url).replace(/\n/g, ' ')
          lines.push(`            <DT><A HREF="${bm.url}">${title}</A>`)
        }
        lines.push('        </DL><p>')
      }
      lines.push('    </DL><p>')
    }
    lines.push('</DL><p>')
    const blob = new Blob([lines.join('\n')], { type: 'text/html' })
    doDownload(blob, `bookmarks-export-${new Date().toISOString().slice(0,10)}.html`)
  }

  const handleExportAll = () => {
    const data = exportBookmarks()
    if (format === 'json') exportJSON(data)
    else exportHTML(data)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>数据管理</DialogTitle>
          <DialogDescription>导入、导出与备份您的书签数据</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">导出格式：</span>
            <div className="flex gap-2">
              <Button variant={format==='json'?'default':'outline'} size="sm" onClick={() => setFormat('json')}>JSON</Button>
              <Button variant={format==='html'?'default':'outline'} size="sm" onClick={() => setFormat('html')}>HTML</Button>
            </div>
          </div>

          <Separator />

          <div className="grid grid-cols-1 gap-2">
            <Button variant="outline" onClick={handleExportAll}>
              <Download className="w-4 h-4 mr-2" /> 全量导出
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

