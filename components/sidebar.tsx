"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, PanelLeftClose, PanelLeft, Check, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface Category {
  id: string
  name: string
  subCategories: SubCategory[]
}

interface SubCategory {
  id: string
  name: string
  parentId: string
}
import { AddCategoryDialog } from "@/components/add-category-dialog"
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
  const { categories, updateCategory, updateSubCategory } = useBookmarkStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | SubCategory | null>(null)

  // 内联编辑状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [editingType, setEditingType] = useState<'category' | 'subcategory'>('category')
  const inputRef = useRef<HTMLInputElement>(null)

  const toggleCategory = (categoryId: string) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(categoryId)) {
      newExpanded.delete(categoryId)
    } else {
      newExpanded.add(categoryId)
    }
    setExpandedCategories(newExpanded)
  }

  const handleCategoryClick = (category: Category) => {
    toggleCategory(category.id)
    // 点击分类时，显示整个分类的概览，不自动选择子分类
    onCategorySelect(category.id, null)
  }

  // 开始内联编辑
  const startEditing = (id: string, currentName: string, type: 'category' | 'subcategory') => {
    setEditingId(id)
    setEditingValue(currentName)
    setEditingType(type)
  }

  // 取消编辑
  const cancelEditing = () => {
    setEditingId(null)
    setEditingValue("")
  }

  // 保存编辑
  const saveEditing = () => {
    if (!editingId || !editingValue.trim()) return

    const trimmedValue = editingValue.trim()

    if (editingType === 'category') {
      // 更新分类名称
      updateCategory(editingId, trimmedValue)
    } else {
      // 更新子分类名称
      updateSubCategory(editingId, trimmedValue)
    }

    cancelEditing()
  }

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      saveEditing()
    } else if (e.key === 'Escape') {
      cancelEditing()
    }
  }

  // 自动聚焦输入框
  useEffect(() => {
    if (editingId && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [editingId])

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
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex items-center">
                    {expandedCategories.has(category.id) ? (
                      <ChevronDown className="h-4 w-4 mr-2" />
                    ) : (
                      <ChevronRight className="h-4 w-4 mr-2" />
                    )}
                  </div>
                  {editingId === category.id ? (
                    <div className="flex items-center flex-1 gap-1">
                      <Input
                        ref={inputRef}
                        value={editingValue}
                        onChange={(e) => setEditingValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onBlur={saveEditing}
                        className="h-6 text-sm font-medium px-2 py-0 border-primary/50 focus:border-primary inline-edit-input"
                        autoFocus
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={saveEditing}
                      >
                        <Check className="h-3 w-3 text-green-600" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-5 w-5 p-0"
                        onClick={cancelEditing}
                      >
                        <X className="h-3 w-3 text-red-600" />
                      </Button>
                    </div>
                  ) : (
                    <span
                      className="text-sm font-medium cursor-pointer hover:text-primary transition-colors flex-1 editable-text"
                      onDoubleClick={(e) => {
                        e.stopPropagation()
                        startEditing(category.id, category.name, 'category')
                      }}
                      title="双击编辑分类名称"
                    >
                      {category.name}
                    </span>
                  )}
                </div>
                <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation()
                      startEditing(category.id, category.name, 'category')
                    }}
                    title="编辑分类名称"
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
                  {category.subCategories.map((subCategory: SubCategory) => (
                    <div
                      key={subCategory.id}
                      className={cn(
                        "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent text-sm",
                        selectedSubCategory === subCategory.id && "bg-accent",
                      )}
                      onClick={() => editingId !== subCategory.id && handleSubCategoryClick(category.id, subCategory.id)}
                    >
                      {editingId === subCategory.id ? (
                        <div className="flex items-center flex-1 gap-1">
                          <Input
                            ref={inputRef}
                            value={editingValue}
                            onChange={(e) => setEditingValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            onBlur={saveEditing}
                            className="h-6 text-sm px-2 py-0 border-primary/50 focus:border-primary inline-edit-input"
                            autoFocus
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={saveEditing}
                          >
                            <Check className="h-3 w-3 text-green-600" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-5 w-5 p-0"
                            onClick={cancelEditing}
                          >
                            <X className="h-3 w-3 text-red-600" />
                          </Button>
                        </div>
                      ) : (
                        <span
                          className="cursor-pointer hover:text-primary transition-colors flex-1 editable-text"
                          onDoubleClick={(e) => {
                            e.stopPropagation()
                            startEditing(subCategory.id, subCategory.name, 'subcategory')
                          }}
                          title="双击编辑子分类名称"
                        >
                          {subCategory.name}
                        </span>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(subCategory.id, subCategory.name, 'subcategory')
                          }}
                          title="编辑子分类名称"
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

      {deletingCategory && (
        <DeleteConfirmDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          title="删除分类"
          description={`确定要删除分类"${String(deletingCategory?.name || '')}"吗？此操作将同时删除该分类下的所有子分类和书签。`}
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
