export const APP_CONFIG = {
  name: 'Open Tabs',
  version: '1.0.0',
  description: 'Gestionnaire d&apos;onglets et groupes pour Chrome',
  author: 'Open Tabs Team',
} as const

export const UI_CONSTANTS = {
  animations: {
    duration: {
      fast: 150,
      normal: 300,
      slow: 500,
    },
    easing: {
      easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
      easeOut: 'cubic-bezier(0, 0, 0.2, 1)',
      easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    },
  },
  spacing: {
    xs: '0.25rem',
    sm: '0.5rem',
    md: '1rem',
    lg: '1.5rem',
    xl: '2rem',
    '2xl': '3rem',
  },
  breakpoints: {
    sm: 640,
    md: 768,
    lg: 1024,
    xl: 1280,
  },
} as const

export const GROUP_COLORS = {
  grey: '#8B8B8B',
  blue: '#4A90E2',
  red: '#D0021B',
  yellow: '#F5A623',
  green: '#7ED321',
  pink: '#BD10E0',
  purple: '#9013FE',
  cyan: '#50E3C2',
  orange: '#F8961E',
} as const

export const STORAGE_KEYS = {
  settings: 'open-tabs-settings',
  groups: 'open-tabs-groups',
  tabs: 'open-tabs-tabs',
  theme: 'open-tabs-theme',
} as const

export const MESSAGE_TYPES = {
  GET_TABS: 'GET_TABS',
  GET_GROUPS: 'GET_GROUPS',
  ADD_TAB_TO_GROUP: 'ADD_TAB_TO_GROUP',
  REMOVE_TAB_FROM_GROUP: 'REMOVE_TAB_FROM_GROUP',
  CLOSE_TAB: 'CLOSE_TAB',
  CREATE_GROUP: 'CREATE_GROUP',
  DELETE_GROUP: 'DELETE_GROUP',
  UPDATE_GROUP: 'UPDATE_GROUP',
  EXPORT_DATA: 'EXPORT_DATA',
  IMPORT_DATA: 'IMPORT_DATA',
  SEARCH_TABS: 'SEARCH_TABS',
  REFRESH_DATA: 'REFRESH_DATA',
} as const

export const NOTIFICATION_TIMEOUTS = {
  success: 3000,
  error: 5000,
  warning: 4000,
  info: 3000,
} as const

export const DEFAULT_SETTINGS = {
  theme: 'light',
  notifications: true,
  autoSave: true,
  compactMode: false,
  showTabCount: true,
  showGroupColors: true,
  confirmOnClose: true,
} as const

export const MODAL_SIZES = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
  xl: 'max-w-xl',
} as const