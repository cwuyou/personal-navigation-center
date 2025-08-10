"use client"

import { Button } from '@/components/ui/button'
import { Download } from 'lucide-react'

type BtnSize = 'sm' | 'default' | 'lg'

type BtnVariant = 'default' | 'outline' | 'secondary' | 'destructive' | 'ghost'

export function DownloadSampleHTMLButton({ size = 'sm', variant = 'outline' }: { size?: BtnSize; variant?: BtnVariant }) {
  const handleClick = () => {
    const sampleHTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
    <DT><H3>开发工具</H3>
    <DL><p>
        <DT><A HREF="https://code.visualstudio.com/">Visual Studio Code</A>
        <DT><A HREF="https://github.com/">GitHub</A>
    </DL><p>
</DL><p>`

    const blob = new Blob([sampleHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-bookmarks.html'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className="transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <Download className="w-4 h-4 mr-2" /> 下载示例文件
    </Button>
  )
}

export function DownloadSampleJSONButton({ size = 'sm', variant = 'outline' }: { size?: BtnSize; variant?: BtnVariant }) {
  const handleClick = () => {
    const sampleData = {
      categories: [
        {
          id: 'dev-tools',
          name: '开发工具',
          subCategories: [
            {
              id: 'editors',
              name: '代码编辑器',
              parentId: 'dev-tools'
            }
          ]
        }
      ],
      bookmarks: [
        {
          id: 'vscode',
          title: 'Visual Studio Code',
          url: 'https://code.visualstudio.com/',
          description: '微软开发的免费代码编辑器',
          subCategoryId: 'editors',
          createdAt: '2024-01-01T00:00:00.000Z'
        }
      ]
    }

    const blob = new Blob([JSON.stringify(sampleData, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'sample-bookmarks.json'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className="transition-colors hover:bg-primary/10 hover:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
    >
      <Download className="w-4 h-4 mr-2" /> 下载示例文件
    </Button>
  )
}

