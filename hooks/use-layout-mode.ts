import { useSyncExternalStore } from "react"

type LayoutMode = "grid" | "list" | "masonry"

let currentMode: LayoutMode = "grid"
const listeners = new Set<() => void>()

function readLayoutMode(): LayoutMode {
  if (typeof document === "undefined") return "grid"
  const cl = document.documentElement.classList
  if (cl.contains("layout-list")) return "list"
  if (cl.contains("layout-masonry")) return "masonry"
  return "grid"
}

function subscribe(cb: () => void) {
  if (listeners.size === 0 && typeof document !== "undefined") {
    currentMode = readLayoutMode()
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    })
  }
  listeners.add(cb)
  return () => {
    listeners.delete(cb)
    if (listeners.size === 0) observer.disconnect()
  }
}

const observer =
  typeof MutationObserver !== "undefined"
    ? new MutationObserver(() => {
        const next = readLayoutMode()
        if (next !== currentMode) {
          currentMode = next
          listeners.forEach((cb) => cb())
        }
      })
    : (undefined as unknown as MutationObserver)

function getSnapshot() {
  return currentMode
}

function getServerSnapshot(): LayoutMode {
  return "grid"
}

export function useLayoutMode(): LayoutMode {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
