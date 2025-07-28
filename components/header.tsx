"use client"

import { useState } from "react"
import { Upload, Info, Menu, Settings } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ImportDialog } from "@/components/import-dialog"
import { AboutDialog } from "@/components/about-dialog"
import { EnhancedSearch } from "@/components/enhanced-search"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  onLogoClick?: () => void
  onSettingsClick?: () => void
}

export function Header({ searchQuery, onSearchChange, onLogoClick, onSettingsClick }: HeaderProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
          >
            <Menu className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold">个人导航中心</h1>
          </div>
        </div>

        <EnhancedSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
        />

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" onClick={() => setImportDialogOpen(true)}>
            <Upload className="h-4 w-4 mr-2" />
            导入
          </Button>
          <Button variant="ghost" size="sm" onClick={onSettingsClick}>
            <Settings className="h-4 w-4 mr-2" />
            设置
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setAboutDialogOpen(true)}>
            <Info className="h-4 w-4 mr-2" />
            关于
          </Button>
        </div>
      </div>

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />
    </header>
  )
}
