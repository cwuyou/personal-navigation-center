"use client"

import { AddCategoryDialog } from "@/components/add-category-dialog"
import { useState } from "react"

interface QuickCreateCategoryProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function QuickCreateCategory({ open, onOpenChange }: QuickCreateCategoryProps) {
  return (
    <AddCategoryDialog open={open} onOpenChange={onOpenChange} />
  )
}

