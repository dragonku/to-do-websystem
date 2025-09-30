import { useTodoStore } from '@/store/todoStore'
import { TodoItem } from './TodoItem'
import { Card, CardContent } from '@/components/ui/card'

export function TodoList() {
  const { getFilteredTodos, currentFilter } = useTodoStore()
  const todos = getFilteredTodos(currentFilter)

  if (todos.length === 0) {
    const emptyMessage: Record<string, string> = {
      all: '할 일이 없습니다.',
      active: '진행중인 할 일이 없습니다.',
      completed: '완료된 할 일이 없습니다.',
      today: '오늘 할 일이 없습니다.',
      important: '중요한 할 일이 없습니다.',
      scheduled: '예정된 할 일이 없습니다.'
    }

    return (
      <Card>
        <CardContent className="p-8 text-center">
          <div className="text-gray-400 text-lg mb-2">📝</div>
          <p className="text-gray-500">{emptyMessage[currentFilter] || '할 일이 없습니다.'}</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-2">
      {todos.map((todo) => (
        <TodoItem key={todo.id} todo={todo} />
      ))}
    </div>
  )
}