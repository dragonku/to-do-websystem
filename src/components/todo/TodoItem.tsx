import { useState } from 'react'
import { useTodoStore } from '@/store/todoStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Card, CardContent } from '@/components/ui/card'
import { Edit2, Trash2, MoreVertical, Calendar, Flag } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Badge } from '@/components/ui/badge'
import type { Todo } from '@/types'

interface TodoItemProps {
  todo: Todo
}

export function TodoItem({ todo }: TodoItemProps) {
  const { updateTodo, deleteTodo } = useTodoStore()
  const [isEditing, setIsEditing] = useState(false)
  const [editText, setEditText] = useState(todo.text)

  const handleToggleComplete = () => {
    updateTodo(todo.id, { completed: !todo.completed })
  }

  const handleToggleCalendar = () => {
    updateTodo(todo.id, { showInCalendar: !todo.showInCalendar })
  }

  const handleSaveEdit = () => {
    if (editText.trim()) {
      updateTodo(todo.id, { text: editText.trim() })
      setIsEditing(false)
    }
  }

  const handleCancelEdit = () => {
    setEditText(todo.text)
    setIsEditing(false)
  }

  const handleDelete = () => {
    deleteTodo(todo.id)
  }

  const handleSetPriority = (priority: Todo['priority']) => {
    updateTodo(todo.id, { priority })
  }

  const priorityColors = {
    low: 'bg-green-100 text-green-800',
    medium: 'bg-yellow-100 text-yellow-800',
    high: 'bg-red-100 text-red-800'
  }

  const priorityLabels = {
    low: '낮음',
    medium: '보통',
    high: '높음'
  }

  return (
    <Card className={`transition-all duration-200 ${
      todo.completed ? 'opacity-75 bg-gray-50' : 'hover:shadow-md'
    }`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          {/* Checkbox */}
          <div className="flex-shrink-0 mt-1">
            <Checkbox
              checked={todo.completed}
              onCheckedChange={handleToggleComplete}
              className="h-5 w-5"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 space-y-2">
            {isEditing ? (
              <div className="space-y-2">
                <Input
                  value={editText}
                  onChange={(e) => setEditText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSaveEdit()
                    } else if (e.key === 'Escape') {
                      handleCancelEdit()
                    }
                  }}
                  className="text-sm"
                  autoFocus
                />
                <div className="flex space-x-2">
                  <Button size="sm" onClick={handleSaveEdit}>
                    저장
                  </Button>
                  <Button size="sm" variant="outline" onClick={handleCancelEdit}>
                    취소
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <p className={`text-sm ${
                  todo.completed 
                    ? 'line-through text-gray-500' 
                    : 'text-gray-900'
                }`}>
                  {todo.text}
                </p>
                
                {/* Meta information */}
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  {/* Priority badge */}
                  <Badge variant="secondary" className={priorityColors[todo.priority]}>
                    <Flag className="h-3 w-3 mr-1" />
                    {priorityLabels[todo.priority]}
                  </Badge>
                  
                  {/* Due date */}
                  {todo.dueDate && (
                    <Badge variant="outline">
                      <Calendar className="h-3 w-3 mr-1" />
                      {new Date(todo.dueDate).toLocaleDateString('ko-KR')}
                    </Badge>
                  )}
                  
                  {/* Tags */}
                  {todo.tags.map((tag) => (
                    <Badge key={tag} variant="outline">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          {!isEditing && (
            <div className="flex-shrink-0">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={() => setIsEditing(true)}>
                    <Edit2 className="h-4 w-4 mr-2" />
                    수정
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleToggleCalendar}>
                    <Calendar className="h-4 w-4 mr-2" />
                    {todo.showInCalendar ? '캘린더에서 제거' : '캘린더에 추가'}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => handleSetPriority('high')}>
                    <Flag className="h-4 w-4 mr-2 text-red-500" />
                    높은 우선순위
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPriority('medium')}>
                    <Flag className="h-4 w-4 mr-2 text-yellow-500" />
                    보통 우선순위
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => handleSetPriority('low')}>
                    <Flag className="h-4 w-4 mr-2 text-green-500" />
                    낮은 우선순위
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    삭제
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}