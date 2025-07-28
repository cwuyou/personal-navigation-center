"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { BookmarkCard } from "@/components/bookmark-card"
import { AddBookmarkCard } from "@/components/add-bookmark-card"

interface VirtualBookmarkGridProps {
  bookmarks: any[]
  subCategoryId?: string
  className?: string
}

const ITEM_HEIGHT = 200 // 估算的书签卡片高度
const ITEMS_PER_ROW = 4 // 每行显示的书签数量
const BUFFER_SIZE = 2 // 缓冲区大小（额外渲染的行数）

export function VirtualBookmarkGrid({ bookmarks, subCategoryId, className }: VirtualBookmarkGridProps) {
  const [containerHeight, setContainerHeight] = useState(600)
  const [scrollTop, setScrollTop] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  // 计算网格布局
  const gridData = useMemo(() => {
    const items = [...bookmarks]
    if (subCategoryId) {
      items.push({ id: 'add-bookmark', isAddCard: true, subCategoryId })
    }
    
    // 将书签分组为行
    const rows = []
    for (let i = 0; i < items.length; i += ITEMS_PER_ROW) {
      rows.push(items.slice(i, i + ITEMS_PER_ROW))
    }
    
    return {
      rows,
      totalHeight: rows.length * ITEM_HEIGHT,
      totalItems: items.length
    }
  }, [bookmarks, subCategoryId])

  // 计算可见范围
  const visibleRange = useMemo(() => {
    const startRow = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - BUFFER_SIZE)
    const endRow = Math.min(
      gridData.rows.length - 1,
      Math.ceil((scrollTop + containerHeight) / ITEM_HEIGHT) + BUFFER_SIZE
    )
    
    return { startRow, endRow }
  }, [scrollTop, containerHeight, gridData.rows.length])

  // 监听容器大小变化
  useEffect(() => {
    const updateSize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight)
      }
    }

    updateSize()
    window.addEventListener('resize', updateSize)
    return () => window.removeEventListener('resize', updateSize)
  }, [])

  // 处理滚动事件
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop)
  }

  // 如果书签数量较少，直接渲染所有书签
  if (gridData.totalItems <= 20) {
    return (
      <div className={`bookmark-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 ${className}`}>
        {bookmarks.map((bookmark) => (
          <BookmarkCard key={bookmark.id} bookmark={bookmark} />
        ))}
        {subCategoryId && <AddBookmarkCard subCategoryId={subCategoryId} />}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: '600px' }}
      onScroll={handleScroll}
    >
      {/* 总高度占位符 */}
      <div style={{ height: gridData.totalHeight, position: 'relative' }}>
        {/* 渲染可见的行 */}
        {gridData.rows.slice(visibleRange.startRow, visibleRange.endRow + 1).map((row, index) => {
          const rowIndex = visibleRange.startRow + index
          const top = rowIndex * ITEM_HEIGHT
          
          return (
            <div
              key={rowIndex}
              className="absolute w-full bookmark-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6"
              style={{ top, height: ITEM_HEIGHT }}
            >
              {row.map((item) => (
                <div key={item.id}>
                  {item.isAddCard ? (
                    <AddBookmarkCard subCategoryId={item.subCategoryId} />
                  ) : (
                    <BookmarkCard bookmark={item} />
                  )}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
