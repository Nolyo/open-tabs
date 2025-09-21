import { useState } from 'react'

export interface ContextMenuPosition {
  x: number
  y: number
}

export interface UseContextMenuReturn {
  isContextMenuOpen: boolean
  contextMenuPosition: ContextMenuPosition
  selectedTabId: string | null
  openContextMenu: (event: React.MouseEvent, tabId: string) => void
  closeContextMenu: () => void
}

export function useContextMenu(): UseContextMenuReturn {
  const [isContextMenuOpen, setIsContextMenuOpen] = useState(false)
  const [contextMenuPosition, setContextMenuPosition] = useState<ContextMenuPosition>({ x: 0, y: 0 })
  const [selectedTabId, setSelectedTabId] = useState<string | null>(null)

  const openContextMenu = (event: React.MouseEvent, tabId: string) => {
    event.preventDefault()
    setContextMenuPosition({ x: event.clientX, y: event.clientY })
    setSelectedTabId(tabId)
    setIsContextMenuOpen(true)
  }

  const closeContextMenu = () => {
    setIsContextMenuOpen(false)
    setSelectedTabId(null)
  }

  return {
    isContextMenuOpen,
    contextMenuPosition,
    selectedTabId,
    openContextMenu,
    closeContextMenu,
  }
}