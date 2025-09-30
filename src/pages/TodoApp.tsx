import { useState, useEffect } from 'react'
import { Sidebar } from '@/components/todo/Sidebar'
import { TodoList } from '@/components/todo/TodoList'
import { TodoInput } from '@/components/todo/TodoInput'
import { FilterButtons } from '@/components/todo/FilterButtons'
import { Calendar } from '@/components/todo/Calendar'
import { useTodoStore } from '@/store/todoStore'
import { useAuth } from '@/hooks/useAuth'
import { Button } from '@/components/ui/button'
import { Menu, X } from 'lucide-react'

export function TodoApp() {
  const { user, logout } = useAuth()
  const { currentList, fetchTodos, fetchLists } = useTodoStore()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showCalendar, setShowCalendar] = useState(false)

  useEffect(() => {
    if (user) {
      fetchLists()
      fetchTodos()
    }
  }, [user, fetchLists, fetchTodos])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <div className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <Sidebar
          onCalendarClick={() => setShowCalendar(!showCalendar)}
          showCalendar={showCalendar}
        />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b px-4 py-3 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setSidebarOpen(!sidebarOpen)}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
            <h1 className="text-xl font-semibold text-gray-900">
              {currentList?.name || '할 일 목록'}
            </h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-600 hidden sm:block">
              {user?.displayName || user?.email}
            </span>
            <Button variant="outline" size="sm" onClick={logout}>
              로그아웃
            </Button>
          </div>
        </header>

        {/* Todo content */}
        <main className="flex-1 overflow-auto">
          {showCalendar ? (
            <Calendar />
          ) : (
            <div className="p-4">
              <div className="max-w-2xl mx-auto space-y-6">
                <TodoInput />
                <FilterButtons />
                <TodoList />
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}