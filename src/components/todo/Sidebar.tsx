import { useState } from 'react'
import { useTodoStore } from '@/store/todoStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Plus, Edit2, Trash2, MoreVertical, Calendar as CalendarIcon } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface SidebarProps {
  onCalendarClick?: () => void
  showCalendar?: boolean
}

export function Sidebar({ onCalendarClick, showCalendar = false }: SidebarProps) {
  const { 
    lists, 
    currentList, 
    setCurrentList, 
    addList, 
    updateList, 
    deleteList 
  } = useTodoStore()
  
  const [showAddForm, setShowAddForm] = useState(false)
  const [editingList, setEditingList] = useState<string | null>(null)
  const [newListName, setNewListName] = useState('')
  const [editListName, setEditListName] = useState('')

  const handleAddList = () => {
    if (newListName.trim()) {
      addList({
        name: newListName.trim(),
        icon: '📋',
        color: '#0078d4'
      })
      setNewListName('')
      setShowAddForm(false)
    }
  }

  const handleEditList = (listId: string) => {
    const list = lists.find(l => l.id === listId)
    if (list) {
      setEditListName(list.name)
      setEditingList(listId)
    }
  }

  const handleUpdateList = (listId: string) => {
    if (editListName.trim()) {
      updateList(listId, { name: editListName.trim() })
      setEditingList(null)
      setEditListName('')
    }
  }

  const handleDeleteList = (listId: string) => {
    if (lists.length > 1) {
      deleteList(listId)
      if (currentList?.id === listId) {
        const remainingList = lists.find(l => l.id !== listId)
        if (remainingList) {
          setCurrentList(remainingList.id)
        }
      }
    }
  }

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold text-gray-900">목록</h2>
      </div>

      {/* Calendar Button */}
      <div className="p-4 border-b">
        <Button
          variant={showCalendar ? 'default' : 'ghost'}
          className="w-full justify-start"
          onClick={onCalendarClick}
        >
          <CalendarIcon className="h-4 w-4 mr-2" />
          캘린더
        </Button>
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-auto p-4 space-y-2">
        {lists.map((list) => (
          <Card 
            key={list.id}
            className={`cursor-pointer transition-colors ${
              currentList?.id === list.id 
                ? 'bg-blue-50 border-blue-200' 
                : 'hover:bg-gray-50'
            }`}
          >
            <CardContent className="p-3">
              {editingList === list.id ? (
                <div className="flex items-center space-x-2">
                  <Input
                    value={editListName}
                    onChange={(e) => setEditListName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        handleUpdateList(list.id)
                      } else if (e.key === 'Escape') {
                        setEditingList(null)
                        setEditListName('')
                      }
                    }}
                    className="flex-1 h-8"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => handleUpdateList(list.id)}
                    className="h-8 px-2"
                  >
                    저장
                  </Button>
                </div>
              ) : (
                <div 
                  className="flex items-center justify-between"
                  onClick={() => setCurrentList(list.id)}
                >
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">{list.icon}</span>
                    <span className="font-medium text-gray-900">{list.name}</span>
                  </div>
                  
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditList(list.id)}>
                        <Edit2 className="h-4 w-4 mr-2" />
                        수정
                      </DropdownMenuItem>
                      {lists.length > 1 && (
                        <DropdownMenuItem 
                          onClick={() => handleDeleteList(list.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          삭제
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add list form */}
      <div className="p-4 border-t">
        {showAddForm ? (
          <div className="space-y-2">
            <Input
              placeholder="목록 이름"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddList()
                } else if (e.key === 'Escape') {
                  setShowAddForm(false)
                  setNewListName('')
                }
              }}
              autoFocus
            />
            <div className="flex space-x-2">
              <Button size="sm" onClick={handleAddList} className="flex-1">
                추가
              </Button>
              <Button 
                size="sm" 
                variant="outline" 
                onClick={() => {
                  setShowAddForm(false)
                  setNewListName('')
                }}
                className="flex-1"
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <Button 
            onClick={() => setShowAddForm(true)}
            className="w-full"
            variant="outline"
          >
            <Plus className="h-4 w-4 mr-2" />
            목록 추가
          </Button>
        )}
      </div>
    </div>
  )
}