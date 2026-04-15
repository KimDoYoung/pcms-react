import { useState } from 'react'
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
          <p className="text-gray-400 text-sm mb-4">Todo가 없습니다.</p>
        )}

        <div className="flex flex-wrap justify-center gap-4">
          {todos?.map((todo) => (
            <TodoCard key={todo.id} todo={todo} onDelete={(id) => deleteMutation.mutate(id)} />
          ))}
        </div>
      </div>

      {/* 하단 고정 버튼 */}
      <button
        type="button"
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-4 left-4 right-4 bg-blue-400 text-white text-center py-3 cursor-pointer hover:bg-blue-700 text-sm font-semibold rounded-lg shadow-md"
      >
        + Todo 추가
      </button>
      {isModalOpen && <TodoAddModal onClose={() => setIsModalOpen(false)} />}
    </div>
  )
}

export default HomePage
