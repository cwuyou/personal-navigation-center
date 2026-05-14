"use client"

import { createRoot } from "react-dom/client"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface ConfirmOptions {
  title: string
  description: string
  confirmText?: string
  cancelText?: string
  variant?: "default" | "destructive"
}

export function confirmAction(options: ConfirmOptions): Promise<boolean> {
  const {
    title,
    description,
    confirmText = "确认",
    cancelText = "取消",
    variant = "destructive",
  } = options

  return new Promise((resolve) => {
    const container = document.createElement("div")
    document.body.appendChild(container)
    const root = createRoot(container)

    const cleanup = () => {
      root.unmount()
      container.remove()
    }

    function Dialog() {
      return (
        <AlertDialog defaultOpen onOpenChange={(open) => { if (!open) { resolve(false); cleanup() } }}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{title}</AlertDialogTitle>
              <AlertDialogDescription className="whitespace-pre-line">
                {description}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{cancelText}</AlertDialogCancel>
              <AlertDialogAction
                className={variant === "destructive" ? "bg-destructive text-destructive-foreground hover:bg-destructive/90" : ""}
                onClick={() => { resolve(true); cleanup() }}
              >
                {confirmText}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )
    }

    root.render(<Dialog />)
  })
}
