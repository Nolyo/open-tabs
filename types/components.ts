export interface Tab {
  id: string
  title: string
  url: string
  favIconUrl?: string
  groupId?: string
  windowId?: number
  pinned?: boolean
  active?: boolean
  status?: 'loading' | 'complete' | 'unloaded'
}

export interface TabGroup {
  id: string
  title: string
  color: GroupColor
  tabs: Tab[]
  collapsed?: boolean
  windowId?: number
}

export type GroupColor =
  | 'grey'
  | 'blue'
  | 'red'
  | 'yellow'
  | 'green'
  | 'pink'
  | 'purple'
  | 'cyan'
  | 'orange'

export type NotificationType = 'success' | 'error' | 'info' | 'warning'

export interface NotificationOptions {
  title: string
  message: string
  type?: NotificationType
  duration?: number
}

export interface ComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ModalProps extends ComponentProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
}

export interface SearchBarProps extends ComponentProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  onClear?: () => void
}

export interface TabItemProps extends ComponentProps {
  tab: Tab
  isActive?: boolean
  onClick?: () => void
  onClose?: () => void
  onContextMenu?: (event: React.MouseEvent) => void
  showCloseButton?: boolean
}

export interface ContextMenuProps extends ComponentProps {
  isOpen: boolean
  position: { x: number; y: number }
  onClose: () => void
  items: ContextMenuItem[]
}

export interface ContextMenuItem {
  label: string
  onClick: () => void
  icon?: string
  disabled?: boolean
  separator?: boolean
}

export interface GroupItemProps extends ComponentProps {
  group: TabGroup
  isActive?: boolean
  onClick?: () => void
  onDelete?: () => void
  onEdit?: () => void
  onCollapse?: () => void
  showActions?: boolean
}

export interface TabListProps extends ComponentProps {
  tabs: Tab[]
  activeTabId?: string
  onTabClick?: (tab: Tab) => void
  onTabClose?: (tabId: string) => void
  onTabContextMenu?: (event: React.MouseEvent, tabId: string) => void
  showGroupHeaders?: boolean
  compact?: boolean
}