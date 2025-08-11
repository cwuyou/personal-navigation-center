"use client"

import React, { useState } from "react"
import { X } from "lucide-react"
import { Input } from "@/components/ui/input"

export interface TagInputProps {
  value: string[]
  onChange: (next: string[]) => void
  placeholder?: string
  disabled?: boolean
  className?: string
  suggestions?: string[]
}

export function TagInput({ value, onChange, placeholder, disabled, className, suggestions = [] }: TagInputProps) {
  const [text, setText] = useState("")
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)

  // 兼容历史：如果 value 不是数组（例如是字符串），做一次安全转换
  const ensureArray = (v: any): string[] => {
    if (Array.isArray(v)) return v as string[]
    if (typeof v === 'string') return v.split(',').map(s => s.trim()).filter(Boolean)
    return []
  }
  const safe = ensureArray(value)

  const norm = (s: string) => s.trim()
  const has = (s: string) => safe.some(x => x.toLowerCase() === s.toLowerCase())

  const commit = (raw: string) => {
    const t = norm(raw)
    if (!t) return
    if (has(t)) return
    onChange([...safe, t])
    setText("")
    setActive(-1)
  }


  const filtered = (() => {
    const base = (suggestions || []).filter(Boolean)
    if (!text.trim()) return base.filter(s => !has(s)).slice(0, 8)
    const q = text.toLowerCase()
    return base.filter(s => !has(s) && s.toLowerCase().includes(q)).slice(0, 8)
  })()

  const removeAt = (idx: number) => {
    const next = safe.slice()
    next.splice(idx, 1)
    onChange(next)
  }

  const onKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setOpen(true)
      setActive(prev => (prev + 1) % Math.max(filtered.length, 1))
      return
    }
    if (e.key === "ArrowUp") {
      e.preventDefault()
      setOpen(true)
      setActive(prev => (prev <= 0 ? filtered.length - 1 : prev - 1))
      return
    }
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      if (open && active >= 0 && filtered[active]) {
        commit(filtered[active])
      } else {
        commit(text)
      }
      return
    }
    if (e.key === "Escape") {
      setOpen(false)
      setActive(-1)
      return
    }
    if (e.key === "Backspace" && text.length === 0 && safe.length > 0) {
      e.preventDefault()
      const next = safe.slice(0, -1)
      onChange(next)
      return
    }
  }

  const onPaste: React.ClipboardEventHandler<HTMLInputElement> = (e) => {
    if (disabled) return
    const data = e.clipboardData.getData("text")
    if (!data) return
    const parts = data.split(/[,\n]/).map(s => s.trim()).filter(Boolean)
    if (parts.length) {
      e.preventDefault()
      const set = new Set(safe)
      for (const p of parts) set.add(p)
      onChange(Array.from(set))
      setText("")
    }
  }

  return (
    <div className={"relative " + (className || "")}>
      <div className="flex flex-wrap items-center gap-2 rounded-md border px-2 py-2 focus-within:ring-2 focus-within:ring-ring">
        {safe.map((tag, idx) => (
          <span key={tag + idx} className="inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-xs">
            <span>{tag}</span>
            <button type="button" className="focus:outline-none" onClick={() => removeAt(idx)} disabled={disabled} aria-label={`移除标签 ${tag}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <Input
          value={text}
          onChange={(e) => { setText(e.target.value); setOpen(true); setActive(-1) }}
          onKeyDown={onKeyDown}
          onPaste={onPaste}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 100)}
          disabled={disabled}
          placeholder={safe.length === 0 ? (placeholder || "输入后回车添加标签") : "继续输入添加标签"}
          className="h-6 border-0 shadow-none focus-visible:ring-0 flex-1 min-w-[120px]"
        />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-md border bg-popover text-popover-foreground shadow-md">
          <ul className="max-h-52 overflow-auto py-1">
            {filtered.map((sug, i) => (
              <li
                key={sug + i}
                className={("px-2 py-1 text-sm cursor-pointer hover:bg-accent hover:text-accent-foreground ") + (i === active ? "bg-accent text-accent-foreground" : "")}
                onMouseDown={(e) => { e.preventDefault(); commit(sug) }}
                onMouseEnter={() => setActive(i)}
              >
                {sug}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

