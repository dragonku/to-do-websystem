import { useMemo } from 'react'
import { useTodoStore } from '@/store/todoStore'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useState } from 'react'

export function Calendar() {
  const { todos } = useTodoStore()
  const [currentDate, setCurrentDate] = useState(new Date())

  const calendarTodos = useMemo(() => {
    return todos.filter(todo => todo.showInCalendar && todo.dueDate)
  }, [todos])

  const daysInMonth = useMemo(() => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysCount = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()

    const days = []

    // 이전 달의 빈 칸
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }

    // 현재 달의 날짜
    for (let i = 1; i <= daysCount; i++) {
      days.push(i)
    }

    return days
  }, [currentDate])

  const getTodosForDate = (day: number | null) => {
    if (!day) return []

    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    const dateStr = new Date(year, month, day).toISOString().split('T')[0]

    return calendarTodos.filter(todo => {
      if (!todo.dueDate) return false
      const todoDate = new Date(todo.dueDate).toISOString().split('T')[0]
      return todoDate === dateStr
    })
  }

  const goToPreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1))
  }

  const goToNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1))
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const isToday = (day: number | null) => {
    if (!day) return false
    const today = new Date()
    return (
      day === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    )
  }

  return (
    <div className="h-full flex flex-col bg-gray-50 p-4">
      <Card className="flex-1 flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">
              {currentDate.getFullYear()}년 {currentDate.getMonth() + 1}월
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" onClick={goToToday}>
                오늘
              </Button>
              <Button variant="outline" size="sm" onClick={goToPreviousMonth}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={goToNextMonth}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col">
          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 gap-2 mb-2">
            {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
              <div
                key={day}
                className={`text-center text-sm font-semibold py-2 ${
                  index === 0 ? 'text-red-600' : index === 6 ? 'text-blue-600' : 'text-gray-700'
                }`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-2 flex-1">
            {daysInMonth.map((day, index) => {
              const dayTodos = getTodosForDate(day)
              const today = isToday(day)

              return (
                <div
                  key={index}
                  className={`border rounded-lg p-2 min-h-[80px] ${
                    day ? 'bg-white hover:bg-gray-50' : 'bg-gray-50'
                  } ${today ? 'border-blue-500 border-2' : 'border-gray-200'}`}
                >
                  {day && (
                    <>
                      <div
                        className={`text-sm font-medium mb-1 ${
                          today ? 'text-blue-600' : 'text-gray-700'
                        }`}
                      >
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayTodos.slice(0, 3).map((todo) => (
                          <div
                            key={todo.id}
                            className="text-xs truncate"
                          >
                            <Badge
                              variant={todo.completed ? 'secondary' : 'default'}
                              className="w-full justify-start text-xs py-0 px-1"
                            >
                              {todo.text}
                            </Badge>
                          </div>
                        ))}
                        {dayTodos.length > 3 && (
                          <div className="text-xs text-gray-500 text-center">
                            +{dayTodos.length - 3} 더보기
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}