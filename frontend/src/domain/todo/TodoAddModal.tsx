/**
 * 목적: Todo 항목을 최대 5개까지 한 번에 추가하는 모달
 * 사용법:
 *   <TodoAddModal onClose={() => setOpen(false)} />
 */
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'

interface Props {
  onClose: () => void
}

export default function TodoAddModal({ onClose }: Props) {

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
            type="button"
            onClick={handleSubmit}
            disabled={mutation.isPending}
            className="flex-1 bg-blue-600 text-white text-sm py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? '저장 중...' : '전송'}
          </button>
          <button
            type="button"
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
