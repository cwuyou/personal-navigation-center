"use client"

import { useState } from "react"
import { Plus } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog"

interface AddBookmarkCardProps {
  subCategoryId: string
}

export function AddBookmarkCard({ subCategoryId }: AddBookmarkCardProps) {
  const [dialogOpen, setDialogOpen] = useState(false)

  return (
    <>
      <Card
        className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-dashed border-2 border-primary/30 hover:border-primary/50 bg-primary/5 hover:bg-primary/10"
        onClick={() => setDialogOpen(true)}
      >
        <CardContent className="p-5 flex flex-col items-center justify-center h-full min-h-[140px]">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-3 group-hover:bg-primary/20 transition-colors">
            <Plus className="w-6 h-6 text-primary" />
          </div>
          <span className="text-sm font-medium text-primary">添加书签</span>
          <span className="text-xs text-muted-foreground mt-1">点击添加新书签</span>
        </CardContent>
      </Card>

      <AddBookmarkDialog open={dialogOpen} onOpenChange={setDialogOpen} subCategoryId={subCategoryId} />
    </>
  )
}
