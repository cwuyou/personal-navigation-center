"use client"

import { useState, useRef, useEffect } from "react"
import { ChevronDown, ChevronRight, Plus, Edit2, Trash2, PanelLeftClose, PanelLeft, Check, X, MoreHorizontal, CheckSquare, Trash, FolderPlus, Bookmark, Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { saveAs } from "file-saver"
import { AddSubCategoryDialog } from "@/components/add-subcategory-dialog"
import { AddBookmarkDialog } from "@/components/add-bookmark-dialog"

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
  const { categories, updateCategory, updateSubCategory, deleteCategory, deleteSubCategory, exportBookmarks } = useBookmarkStore()
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set())
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [deletingCategory, setDeletingCategory] = useState<Category | SubCategory | null>(null)
  const [addBookmarkDialogOpen, setAddBookmarkDialogOpen] = useState(false)
  const [selectedSubCategoryForBookmark, setSelectedSubCategoryForBookmark] = useState<string>("")

  // 批量选择状态
  const [isBatchMode, setIsBatchMode] = useState(false)
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<Set<string>>(new Set())
  const [batchDeleteDialogOpen, setBatchDeleteDialogOpen] = useState(false)

  // 内联编辑状态
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingValue, setEditingValue] = useState("")
  const [editingType, setEditingType] = useState<'category' | 'subcategory'>('category')



  // 添加子分类状态
  const [addSubCategoryDialogOpen, setAddSubCategoryDialogOpen] = useState(false)
  const [selectedCategoryForSubCategory, setSelectedCategoryForSubCategory] = useState<string | null>(null)


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
    if (isBatchMode) {
      // 批量模式下，点击切换选择状态
      toggleCategorySelection(category.id)
    } else {
      toggleCategory(category.id)
      // 点击分类时，显示整个分类的概览，不自动选择子分类
      onCategorySelect(category.id, undefined)
    }
  }

  // 批量选择相关函数
  const toggleBatchMode = () => {
    setIsBatchMode(!isBatchMode)
    setSelectedCategoryIds(new Set())
  }

  const toggleCategorySelection = (categoryId: string) => {
    const newSelected = new Set(selectedCategoryIds)
    if (newSelected.has(categoryId)) {
      newSelected.delete(categoryId)
    } else {
      newSelected.add(categoryId)
    }
    setSelectedCategoryIds(newSelected)
  }

  const selectAllCategories = () => {
    const allCategoryIds = new Set(categories.map(cat => cat.id))
    setSelectedCategoryIds(allCategoryIds)
  }

  const clearSelection = () => {
    setSelectedCategoryIds(new Set())
  }

  const handleBatchDelete = () => {
    setBatchDeleteDialogOpen(true)
  }

  const confirmBatchDelete = () => {
    selectedCategoryIds.forEach(categoryId => {
      deleteCategory(categoryId)
    })
    setSelectedCategoryIds(new Set())
    setIsBatchMode(false)
    setBatchDeleteDialogOpen(false)
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

  // 显示添加子分类对话框
  const showAddSubCategoryDialog = (categoryId: string) => {
    setSelectedCategoryForSubCategory(categoryId)
    setAddSubCategoryDialogOpen(true)
  }

  const showAddBookmarkDialog = (subCategoryId: string) => {
    setSelectedSubCategoryForBookmark(subCategoryId)
    setAddBookmarkDialogOpen(true)
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
          <h2 className="font-semibold text-base">分类导航</h2>
          <div className="flex items-center space-x-1">
            {!isBatchMode ? (
              <>
                <Button variant="ghost" size="icon-sm" onClick={() => setAddDialogOpen(true)} title="添加分类" className="hover:bg-primary/10 hover:text-primary">
                  <Plus className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={toggleBatchMode} title="批量管理" className="hover:bg-primary/10 hover:text-primary">
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon-sm" onClick={onToggleCollapse} title="收起侧边栏" className="hover:bg-primary/10 hover:text-primary">
                  <PanelLeftClose className="h-4 w-4" />
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon-sm" onClick={selectAllCategories} title="全选" className="hover:bg-primary/10 hover:text-primary">
                  <CheckSquare className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  onClick={handleBatchDelete}
                  disabled={selectedCategoryIds.size === 0}
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  title="删除选中"
                >
                  <Trash className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={toggleBatchMode} title="退出批量模式">
                  <X className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 批量模式提示 */}
        {isBatchMode && (
          <div className="mt-2 text-xs text-muted-foreground">
            {selectedCategoryIds.size > 0
              ? `已选择 ${selectedCategoryIds.size} 个分类`
              : "点击分类进行选择"}
          </div>
        )}
      </div>

      <ScrollArea className="flex-1 h-[calc(100vh-8rem)]">
        <div className="p-2">
          {categories.map((category) => (
            <div key={category.id} className="mb-1">
              <div
                className={cn(
                  "group flex items-center justify-between p-2 rounded-md cursor-pointer hover:bg-accent",
                  selectedCategory === category.id && !isBatchMode && "bg-accent",
                  isBatchMode && selectedCategoryIds.has(category.id) && "bg-blue-50 border border-blue-200",
                )}
              >
                <div
                  className="flex items-center flex-1 cursor-pointer"
                  onClick={() => handleCategoryClick(category)}
                >
                  <div className="flex items-center">
                    {isBatchMode ? (
                      <div className="w-4 h-4 mr-2 flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={selectedCategoryIds.has(category.id)}
                          onChange={() => toggleCategorySelection(category.id)}
                          className="w-3 h-3"
                          onClick={(e) => e.stopPropagation()}
                        />
                      </div>
                    ) : (
                      <>
                        {expandedCategories.has(category.id) ? (
                          <ChevronDown className="h-4 w-4 mr-2" />
                        ) : (
                          <ChevronRight className="h-4 w-4 mr-2" />
                        )}
                      </>
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
                        className="h-6 text-sm font-semibold px-2 py-0 border-primary/50 focus:border-primary inline-edit-input"
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
                      className="text-sm font-semibold cursor-pointer hover:text-primary transition-colors flex-1 editable-text"
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
                {!isBatchMode && (
                  <div className="opacity-0 group-hover:opacity-100 flex items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-40">
                        {/* 管理操作组 */}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            startEditing(category.id, category.name, 'category')
                          }}
                          className="text-xs"
                        >
                          <Edit2 className="h-3 w-3 mr-2" />
                          重命名
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            showAddSubCategoryDialog(category.id)
                          }}
                          className="text-xs"
                        >
                          <FolderPlus className="h-3 w-3 mr-2" />
                          添加
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            // 导出该分类下所有书签（裁剪到相关子分类）
                            const cat = categories.find(c => c.id === category.id)
                            const subIds = new Set((cat?.subCategories || []).map(s => s.id))
                            const data = exportBookmarks()
                            const trimmedCategories = data.categories.map(c => ({
                              ...c,
                              subCategories: (c.subCategories || []).filter(s => subIds.has(s.id))
                            })).filter(c => c.subCategories.length > 0)
                            const scoped = { categories: trimmedCategories, bookmarks: data.bookmarks.filter(b => subIds.has(b.subCategoryId)) }
                            const blob = new Blob([JSON.stringify(scoped, null, 2)], { type: 'application/json' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `bookmarks-${category.name}-${new Date().toISOString().slice(0,10)}.json`
                            document.body.appendChild(a)
                            a.click()
                            document.body.removeChild(a)
                            URL.revokeObjectURL(url)
                          }}
                          className="text-xs"
                        >
                          <Download className="h-3 w-3 mr-2" />
                          导出此分类
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 危险操作组 */}
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            setDeletingCategory(category)
                            setDeleteDialogOpen(true)
                          }}
                          className="text-xs text-destructive focus:text-destructive"
                        >
                          <Trash2 className="h-3 w-3 mr-2" />
                          删除
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                )}
              </div>

              {!isBatchMode && expandedCategories.has(category.id) && (
                <div className="ml-6 mt-1">
                  {category.subCategories.map((subCategory: SubCategory) => (
                    <div
                      key={subCategory.id}
                      className={cn(
                        "group flex items-center justify-between p-2 cursor-pointer text-sm transition-colors border border-transparent",
                        "hover:bg-primary/10 hover:text-primary hover:border-primary/30",
                        selectedSubCategory === subCategory.id && "bg-primary text-primary-foreground shadow-sm",
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
                            startEditing(subCategory.id, subCategory.name, 'subcategory')
                          }}
                          title="双击编辑子分类名称"
                        >
                          {subCategory.name}
                        </span>
                      )}
                      <div className="opacity-0 group-hover:opacity-100 flex items-center">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <MoreHorizontal className="h-3 w-3" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-44">
                            {/* 添加操作组 */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                showAddBookmarkDialog(subCategory.id)
                              }}
                              className="text-xs"
                            >
                              <Bookmark className="h-3 w-3 mr-2" />
                              添加书签
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* 管理操作组 */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                startEditing(subCategory.id, subCategory.name, 'subcategory')
                              }}
                              className="text-xs"
                            >
                              <Edit2 className="h-3 w-3 mr-2" />
                              重命名
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                // 导出该子分类下所有书签（裁剪到当前子分类）
                                const data = exportBookmarks()
                                const trimmedCategories = data.categories.map(c => ({
                                  ...c,
                                  subCategories: (c.subCategories || []).filter(s => s.id === subCategory.id)
                                })).filter(c => c.subCategories.length > 0)
                                const scoped = { categories: trimmedCategories, bookmarks: data.bookmarks.filter(b => b.subCategoryId === subCategory.id) }
                                const blob = new Blob([JSON.stringify(scoped, null, 2)], { type: 'application/json' })
                                const url = URL.createObjectURL(blob)
                                const a = document.createElement('a')
                                a.href = url
                                a.download = `bookmarks-${subCategory.name}-${new Date().toISOString().slice(0,10)}.json`
                                document.body.appendChild(a)
                                a.click()
                                document.body.removeChild(a)
                                URL.revokeObjectURL(url)
                              }}
                              className="text-xs"
                            >
                              <Download className="h-3 w-3 mr-2" />
                              导出此子分类
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {/* 危险操作组 */}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeletingCategory(subCategory)
                                setDeleteDialogOpen(true)
                              }}
                              className="text-xs text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3 w-3 mr-2" />
                              删除
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
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
            if (deletingCategory) {
              // 检查是否是主分类还是子分类
              if ('parentId' in deletingCategory) {
                // 是子分类
                deleteSubCategory(deletingCategory.id)
              } else {
                // 是主分类
                deleteCategory(deletingCategory.id)
              }
            }
            setDeletingCategory(null)
          }}
          onClose={() => setDeletingCategory(null)}
        />
      )}

      {/* 批量删除确认对话框 */}
      <DeleteConfirmDialog
        open={batchDeleteDialogOpen}
        onOpenChange={setBatchDeleteDialogOpen}
        title="批量删除分类"
        description={`确定要删除选中的 ${selectedCategoryIds.size} 个分类吗？此操作将同时删除这些分类下的所有子分类和书签，且无法撤销。`}
        onConfirm={confirmBatchDelete}
        onClose={() => setBatchDeleteDialogOpen(false)}
      />

      {/* 添加子分类对话框 */}
      {selectedCategoryForSubCategory && (
        <AddSubCategoryDialog
          open={addSubCategoryDialogOpen}
          onOpenChange={setAddSubCategoryDialogOpen}
          categoryId={selectedCategoryForSubCategory}
        />
      )}

      {/* 添加书签对话框 */}
      {selectedSubCategoryForBookmark && (
        <AddBookmarkDialog
          open={addBookmarkDialogOpen}
          onOpenChange={setAddBookmarkDialogOpen}
          subCategoryId={selectedSubCategoryForBookmark}
        />
      )}
    </div>
  )
}
