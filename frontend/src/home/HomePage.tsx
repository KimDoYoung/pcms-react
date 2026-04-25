import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import TodoAddModal from '@/domain/todo/TodoAddModal'
import type { Todo } from '@/domain/todo/types/todo'
import { TodoCard } from '@/domain/todo/TodoCard'

function HomePage() {
  const [isModalOpen, setIsModalOpen] = useState(false)
  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/todo/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['todos'] }),
  })

  const { data: todos, isLoading, isError } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: () => apiClient.get<Todo[]>('/todo'),
  })

  return (
    <div className="min-h-screen bg-gray-100">
      <Toolbar />

      <div className="p-6">
        {isLoading && <p className="text-gray-500">불러오는 중...</p>}
        {isError && <p className="text-red-500">Todo를 불러오지 못했습니다.</p>}
        {!isLoading && !isError && todos?.length === 0 && (
          <p className="text-gray-400 text-sm mb-4 text-center">Todo가 없습니다. 새로운 할일을 추가해보세요!</p>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {todos?.map((todo, index) => (
            <TodoCard key={todo.id} todo={todo} index={index} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}

          {/* 할일 추가 템플릿 카드 */}
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="group flex flex-col items-center justify-center w-64 h-64 bg-white/60 hover:bg-white rounded-2xl border-2 border-dashed border-gray-300 hover:border-blue-300 text-gray-400 hover:text-blue-500 transition-all duration-300 hover:-translate-y-1 shadow-sm hover:shadow-[0_8px_24px_-4px_rgba(0,0,0,0.1)] cursor-pointer"
            aria-label="Todo 추가"
          >
            <div className="bg-gray-100 group-hover:bg-blue-50/50 rounded-full p-4 mb-3 transition-colors">
              <Plus className="w-10 h-10" />
            </div>
            <span className="font-semibold text-sm tracking-wide">새로운 할일 추가</span>
          </button>
        </div>
      </div>

      {isModalOpen && <TodoAddModal onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}

export default HomePage
