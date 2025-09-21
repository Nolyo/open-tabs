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