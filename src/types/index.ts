export interface Todo {
  id: string
  text: string
  completed: boolean
  priority: 'low' | 'medium' | 'high'
  dueDate: string | null
  isImportant: boolean
  isMyDay: boolean
  repeat: 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly'
  memo: string | null
  listId: string
  files: AttachedFile[]
  tags: string[]
  showInCalendar: boolean
  createdAt: string
  updatedAt: string
  completedAt: string | null
  nextRecurrenceDate: string | null
}

export interface TodoList {
  id: string
  name: string
  icon: string
  color: string
  createdAt: string
  updatedAt: string
}

export interface AttachedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
}

export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
}

export interface Settings {
  theme: 'light' | 'dark'
  accentColor: string
  showCompletedCount: boolean
  showDueDates: boolean
  showPriority: boolean
  enableNotifications: boolean
  enableSounds: boolean
}

export type FilterType = 'all' | 'active' | 'completed' | 'today' | 'important' | 'scheduled'
export type SortType = 'newest' | 'oldest' | 'priority' | 'dueDate' | 'alphabetical' | 'completed'