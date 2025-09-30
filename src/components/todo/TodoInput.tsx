import { useState } from 'react'
import { useTodoStore } from '@/store/todoStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus } from 'lucide-react'

export function TodoInput() {
  const { addTodo, currentList } = useTodoStore()
  const [newTodo, setNewTodo] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (newTodo.trim() && currentList) {
      addTodo({
        text: newTodo.trim(),
        listId: currentList.id,
        completed: false,
        priority: 'medium',
        tags: [],
        dueDate: null,
        isImportant: false,
        isMyDay: false,
        repeat: 'none',
        memo: null,
        files: [],
        showInCalendar: false,
        completedAt: null,
        nextRecurrenceDate: null
      })
      setNewTodo('')
    }
  }

  if (!currentList) {
    return null
  }

  return (
    <Card>
      <CardContent className="p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <Input
            placeholder="새로운 할 일을 입력하세요..."
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            className="flex-1"
          />
          <Button type="submit" disabled={!newTodo.trim()}>
            <Plus className="h-4 w-4 mr-2" />
            추가
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}