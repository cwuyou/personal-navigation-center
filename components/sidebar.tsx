"use client"

import { useState } from "react"
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, PanelLeftClose, PanelLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { AddCategoryDialog } from "@/components/add-category-dialog"
import { EditCategoryDialog } from "@/components/edit-category-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { cn } from "@/lib/utils"

interface SidebarProps {
  collapsed: boolean
  onToggleCollapse: () => void
  selectedCategory: string | null
  selectedSubCategory: string | null
  onCategorySelect: (categoryId: string, subCategoryId?: string) => void
}

export function Sidebar({
  collapsed,
  onToggleCollapse,
  selectedCategory,
  selectedSubCategory,
  onCategorySelect,
}: SidebarProps) {
  const { categories } = useBookmarkStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<any>(null)
  const [deletingCategory, setDeletingCategory] = useState<any>(null)

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategoryClick = (category: any) => {
    toggleCategory(category.id)
    const firstSubCategory = category.subCategories[0]
    onCategorySelect(category.id, firstSubCategory?.id)
  }

  const handleSubCategoryClick = (categoryId: string, subCategoryId: string) => {
    onCategorySelect(categoryId, subCategoryId)
  }

  if (collapsed) {
    return (
      <div className="w-12 border-r bg-muted/10">
        <div className="p-2">
          <Button variant="ghost" size="sm" onClick={onToggleCollapse} className="w-full">
            <PanelLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r bg-muted/10">
      <div className="p-4 border-b">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold">分类导航</h2>
          <div className="flex items-center space-x-1">
            <Button variant="ghost" size="sm" onClick={() => setAddDialogOpen(true)}>
              <Plus className="h-4 w-4" />
            </Button>
            <Button variant="ghost" size="sm" onClick={onToggleCollapse}>
              <PanelLeftClose className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
        <div className="p-2">
          {categories.map((category) => (
            <div key={category.id} className="mb-1">
              <div
                className={cn(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
                  selectedCategory === category.id && "bg-accent",
                )}
              >
                <div className="flex items-center flex-1" onClick={() => handleCategoryClick(category)}>
                  {expandedCategories.has(category.id) ? (
                    <ChevronDown className="h-4 w-4 mr-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 mr-2" />
                  )}
                  <span className="text-sm font-medium">{category.name}</span>
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setEditingCategory(category)
                      setEditDialogOpen(true)
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      setDeletingCategory(category)
                      setDeleteDialogOpen(true)
                    }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {expandedCategories.has(category.id) && (
                <div className="ml-6 mt-1">
                  {category.subCategories.map((subCategory: any) => (
                    <div
                      key={subCategory.id}
                      className={cn(
                        "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent text-sm",
                        selectedSubCategory === subCategory.id && "bg-accent",
                      )}
                      onClick={() => handleSubCategoryClick(category.id, subCategory.id)}
                    >
                      <span>{subCategory.name}</span>
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setEditingCategory(subCategory)
                            setEditDialogOpen(true)
                          }}
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingCategory(subCategory)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <AddCategoryDialog open={addDialogOpen} onOpenChange={setAddDialogOpen} />

      {editingCategory && (
        <EditCategoryDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          category={editingCategory}
          onClose={() => setEditingCategory(null)}
        />
      )}

      {deletingCategory && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="删除分类"
          description={`确定要删除分类"${deletingCategory.name}"吗？此操作将同时删除该分类下的所有子分类和书签。`}
          onConfirm={() => {
            // TODO: Implement delete category
            setDeletingCategory(null)
          }}
          onClose={() => setDeletingCategory(null)}
        />
      )}
    </div>
  )
}
