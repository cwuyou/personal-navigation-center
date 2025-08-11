"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FolderPlus, BookmarkPlus, HelpCircle } from "lucide-react"

type EmptyVariant = 'noCategories' | 'noSubcategories' | 'noBookmarks'

interface EmptyStateProps {
  variant: EmptyVariant
  onCreateCategory: () => void
  onCreateSubCategory?: () => void
  onAddBookmark: () => void
  onImport: () => void
}

export function EmptyState({ variant, onCreateCategory, onCreateSubCategory, onAddBookmark, onImport }: EmptyStateProps) {
  const content = (() => {
    switch (variant) {
      case 'noSubcategories':
        return {
          title: '开始创建你的个人首页',
          desc: '你已创建了分类，下一步创建一个子分类或直接添加书签。',
          primaryText: '创建第一个子分类',
          secondaryText: '添加第一个书签',
        }
      case 'noBookmarks':
        return {
          title: '添加你的第一个书签',
          desc: '分类与子分类已就绪，现在可以开始添加或导入书签。',
          primaryText: '添加第一个书签',
          secondaryText: '导入书签',
        }
      default:
        return {
          title: '开始创建你的个人首页',
          desc: '当前没有任何分类和书签。你可以：',
          primaryText: '创建第一个分类',
          secondaryText: '添加第一个书签',
        }
    }
  })()

  return (
    <div className="flex-1 p-6">
      <div className="max-w-3xl mx-auto">
        <Card className="border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <h2 className="text-xl font-semibold">{content.title}</h2>
            <p className="text-sm text-muted-foreground">{content.desc}</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mt-4">
              <Button onClick={onImport} variant="default" className="gap-2">
                <Upload className="h-4 w-4" /> 导入书签
              </Button>
              {variant === 'noSubcategories' ? (
                <Button onClick={onCreateSubCategory} variant="outline" className="gap-2">
                  <FolderPlus className="h-4 w-4" /> {content.primaryText}
                </Button>
              ) : (
                <Button onClick={onCreateCategory} variant="outline" className="gap-2">
                  <FolderPlus className="h-4 w-4" /> {content.primaryText}
                </Button>
              )}
              <Button onClick={variant === 'noBookmarks' ? onAddBookmark : onAddBookmark} variant="outline" className="gap-2">
                <BookmarkPlus className="h-4 w-4" /> {content.secondaryText}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              小提示：你可以先创建分类/子分类，再添加书签；或直接导入浏览器书签文件。
            </p>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-4">
          <HelpCircle className="h-3.5 w-3.5" />
          <span>需要帮助？查看帮助中心或导入说明。</span>
        </div>
      </div>
    </div>
  )
}

