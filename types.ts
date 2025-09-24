export interface TabGroup {
  id: string
  name: string
  color: string
  urls: TabUrl[]
  createdAt: Date
  updatedAt: Date
}

export interface TabUrl {
  id: string
  url: string
  title?: string
  favicon?: string
  groupId: string
  order: number
}

export interface AppSettings {
  theme: 'light' | 'dark'
  autoOpenNewTabs: boolean
  defaultGroupColor: string
}

export interface StorageData {
  groups: TabGroup[]
  settings: AppSettings
}

export interface ProfileTab {
  id: string
  url: string
  title?: string
  favicon?: string
  pinned?: boolean
  order: number
}

export interface ProfileGroup {
  id: string
  windowId?: number
  title: string
  color?: chrome.tabGroups.ColorEnum
  collapsed?: boolean
  tabs: ProfileTab[]
}

export interface Profile {
  id: string
  name: string
  description?: string
  groups: ProfileGroup[]
  createdAt: string
  updatedAt: string
}

export interface ProfileSummary {
  id: string
  name: string
  description?: string
  groupCount: number
  tabCount: number
  createdAt: string
  updatedAt: string
}