export interface OpenItem {
  id: string
  url: string
}

export interface OpenBatchResult {
  openedIds: string[]
  blockedIds: string[]
}

/**
 * 批量在新标签页打开链接,返回成功与被拦截的 id 列表。
 *
 * 关键点:
 * - `window.open(url, "_blank")` 不传 noopener,这样成功时能拿到 window 引用用于判断
 * - 成功后立即设置 `w.opener = null` 切断与原页面的引用,效果等同 noopener
 * - 失败时返回 null(被弹窗拦截器拦下),收集到 blockedIds
 */
export function openBookmarksBatch(items: OpenItem[]): OpenBatchResult {
  const openedIds: string[] = []
  const blockedIds: string[] = []
  for (const item of items) {
    let w: Window | null = null
    try {
      w = window.open(item.url, "_blank")
    } catch {
      w = null
    }
    if (w) {
      try {
        // 切断 opener,避免被打开的新标签页操作原页面
        w.opener = null
      } catch {
        // 跨域时可能抛错,忽略即可
      }
      openedIds.push(item.id)
    } else {
      blockedIds.push(item.id)
    }
  }
  return { openedIds, blockedIds }
}
