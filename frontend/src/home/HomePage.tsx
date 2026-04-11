import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { formatDate } from '@/lib/utils'

interface Todo {
  id: number
  content: string
  createdAt: string
}

function TodoAddModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient()
  const [inputs, setInputs] = useState(['', '', '', '', ''])

  const mutation = useMutation({
    mutationFn: (contents: string[]) => apiClient.post('/todo', { contents }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
      onClose()
    },
  })

  function handleSubmit() {
    const contents = inputs.filter((v) => v.trim() !== '')
    if (contents.length === 0) return
    mutation.mutate(contents)
  }

  function handleChange(index: number, value: string) {
    setInputs((prev) => prev.map((v, i) => (i === index ? value : v)))
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-md">
        <h2 className="text-base font-semibold text-gray-700 mb-4">Todo 추가</h2>
        <div className="flex flex-col gap-2">
          {inputs.map((value, i) => (
            <input
              key={i}
              type="text"
              value={value}
              onChange={(e) => handleChange(i, e.target.value)}
              placeholder={`${i + 1}번째 항목`}
              className="border rounded px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-300"
            />
          ))}
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? '저장 중...' : '전송'}
          </button>
          <button
            onClick={onClose}
            className="px-4 bg-gray-200 text-gray-600 text-sm py-2 rounded hover:bg-gray-300"
          >
            취소
          </button>
        </div>
      </div>
    </div>
  )
}

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

        <div className="flex flex-wrap justify-center gap-4" >
          {todos?.map((todo) => (
            <div key={todo.id} className="bg-yellow-100 rounded-lg shadow p-3 w-64 h-64 flex flex-col overflow-hidden relative">
              <button
                onClick={() => deleteMutation.mutate(todo.id)}
                className="absolute top-2 right-2 text-gray-400 hover:text-red-500"
              >
                <X size={14} />
              </button>
              <p className="text-lg text-gray-800 break-words line-clamp-3 mt-3">{todo.content}</p>
              <p className="text-xs text-gray-500 mt-auto">{formatDate(todo.createdAt)}</p>
            </div>
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
