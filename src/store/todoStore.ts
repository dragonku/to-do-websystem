import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { Todo, TodoList, FilterType, SortType, Settings } from '@/types'

interface TodoStore {
  // State
  todos: Todo[]
  lists: TodoList[]
  currentFilter: FilterType
  currentList: TodoList | null
  searchQuery: string
  sortBy: SortType
  sortOrder: 'asc' | 'desc'
  settings: Settings
  
  // Actions
  addTodo: (todo: Omit<Todo, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateTodo: (id: string, updates: Partial<Todo>) => void
  deleteTodo: (id: string) => void
  toggleTodo: (id: string) => void
  toggleImportant: (id: string) => void
  
  addList: (list: Omit<TodoList, 'id' | 'createdAt' | 'updatedAt'>) => void
  updateList: (id: string, updates: Partial<TodoList>) => void
  deleteList: (id: string) => void
  
  setCurrentFilter: (filter: FilterType) => void
  setCurrentList: (listId: string) => void
  setSearchQuery: (query: string) => void
  setSorting: (sortBy: SortType, order?: 'asc' | 'desc') => void
  updateSettings: (settings: Partial<Settings>) => void
  
  fetchTodos: () => Promise<void>
  fetchLists: () => Promise<void>
  
  // Getters
  getFilteredTodos: (filter?: FilterType) => Todo[]
  getTodosByList: (listId: string) => Todo[]
  getCompletedTodos: () => Todo[]
}

const defaultSettings: Settings = {
  theme: 'dark',
  accentColor: '#0078d4',
  showCompletedCount: true,
  showDueDates: true,
  showPriority: true,
  enableNotifications: true,
  enableSounds: true,
}

const defaultLists: TodoList[] = [
  {
    id: '1',
    name: '기본 목록',
    icon: '📋',
    color: '#0078d4',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
]

export const useTodoStore = create<TodoStore>()(
  persist(
    (set, get) => ({
      // Initial state
      todos: [],
      lists: defaultLists,
      currentFilter: 'all',
      currentList: defaultLists[0],
      searchQuery: '',
      sortBy: 'newest',
      sortOrder: 'desc',
      settings: defaultSettings,
      
      // Actions
      addTodo: (todoData) => {
        const newTodo: Todo = {
          ...todoData,
          id: crypto.randomUUID(),
          showInCalendar: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ todos: [...state.todos, newTodo] }))
      },
      
      updateTodo: (id, updates) => {
        set((state) => ({
          todos: state.todos.map((todo) =>
            todo.id === id
              ? { ...todo, ...updates, updatedAt: new Date().toISOString() }
              : todo
          ),
        }))
      },
      
      deleteTodo: (id) => {
        set((state) => ({
          todos: state.todos.filter((todo) => todo.id !== id),
        }))
      },
      
      toggleTodo: (id) => {
        const todo = get().todos.find((t) => t.id === id)
        if (todo) {
          get().updateTodo(id, {
            completed: !todo.completed,
            completedAt: !todo.completed ? new Date().toISOString() : null,
          })
        }
      },
      
      toggleImportant: (id) => {
        const todo = get().todos.find((t) => t.id === id)
        if (todo) {
          get().updateTodo(id, { isImportant: !todo.isImportant })
        }
      },
      
      addList: (listData) => {
        const newList: TodoList = {
          ...listData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
        set((state) => ({ lists: [...state.lists, newList] }))
      },
      
      updateList: (id, updates) => {
        set((state) => ({
          lists: state.lists.map((list) =>
            list.id === id
              ? { ...list, ...updates, updatedAt: new Date().toISOString() }
              : list
          ),
        }))
      },
      
      deleteList: (id) => {
        if (id === '1') return // Cannot delete default list
        
        set((state) => ({
          lists: state.lists.filter((list) => list.id !== id),
          todos: state.todos.map((todo) =>
            todo.listId === id ? { ...todo, listId: '1' } : todo
          ),
          currentList: state.currentList === id ? null : state.currentList,
        }))
      },
      
      setCurrentFilter: (filter) => {
        set({ currentFilter: filter })
      },
      
      setCurrentList: (listId) => {
        const list = get().lists.find(l => l.id === listId)
        if (list) {
          set({ currentList: list })
        }
      },
      
      setSearchQuery: (query) => {
        set({ searchQuery: query })
      },
      
      setSorting: (sortBy, order) => {
        set({ 
          sortBy, 
          sortOrder: order || (get().sortBy === sortBy && get().sortOrder === 'desc' ? 'asc' : 'desc')
        })
      },
      
      updateSettings: (newSettings) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings }
        }))
      },
      
      fetchTodos: async () => {
        // TODO: Implement API call to fetch todos
        console.log('Fetching todos...')
      },
      
      fetchLists: async () => {
        // TODO: Implement API call to fetch lists
        console.log('Fetching lists...')
      },
      
      // Getters
      getFilteredTodos: (filter) => {
        const { todos, currentFilter, currentList, searchQuery } = get()
        const targetFilter = filter || currentFilter
        
        let filtered = todos
        
        // Apply list filter
        if (currentList) {
          filtered = filtered.filter((todo) => todo.listId === currentList.id)
        }
        
        // Apply main filter
        if (targetFilter !== 'all') {
          switch (targetFilter) {
            case 'active':
              filtered = filtered.filter((todo) => !todo.completed)
              break
            case 'completed':
              filtered = filtered.filter((todo) => todo.completed)
              break
          }
        }
        
        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          filtered = todos.filter((todo) =>
            todo.text.toLowerCase().includes(query) ||
            (todo.memo && todo.memo.toLowerCase().includes(query))
          )
        }
        
        return filtered
      },
      
      getTodosByList: (listId) => {
        return get().todos.filter((todo) => todo.listId === listId)
      },
      
      getCompletedTodos: () => {
        return get().todos.filter((todo) => todo.completed)
      },
    }),
    {
      name: 'todo-storage',
      partialize: (state) => ({
        todos: state.todos,
        lists: state.lists,
        settings: state.settings,
      }),
    }
  )
)