import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { BoardDetailDto } from '@/domain/board/types/board'

const CONTENT_TYPE_LABEL: Record<string, string> = {
  html: 'HTML',
  markdown: 'Markdown',
  text: 'Text',
  json: 'JSON',
}
const CONTENT_TYPE_COLOR: Record<string, string> = {
  html: 'bg-green-100 text-green-700',
  markdown: 'bg-purple-100 text-purple-700',
  text: 'bg-gray-100 text-gray-600',
  json: 'bg-orange-100 text-orange-700',
}

const emptyForm = { id: null as number | null, boardCode: '', boardNameKor: '', contentType: 'html', description: '' }

export default function BoardsPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const [showModal, setShowModal] = useState(false)
  const [isEdit, setIsEdit] = useState(false)
  const [form, setForm] = useState({ ...emptyForm })
  const [saving, setSaving] = useState(false)

  const { data, isLoading, isError, error } = useQuery<BoardDetailDto[]>({
    queryKey: ['boards'],
    queryFn: () => apiClient.get<BoardDetailDto[]>('/boards'),
  })
  const boards = Array.isArray(data) ? data : []

  function openCreate() {
    setIsEdit(false)
    setForm({ ...emptyForm })
    setShowModal(true)
  }

  function openEdit(board: BoardDetailDto) {
    setIsEdit(true)
    setForm({ id: board.id, boardCode: board.boardCode, boardNameKor: board.boardNameKor, contentType: board.contentType, description: board.description ?? '' })
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  async function handleSave() {
    if (!form.boardNameKor.trim()) { alert('게시판 이름을 입력하세요.'); return }
    if (!isEdit && !form.boardCode.trim()) { alert('게시판 코드를 입력하세요.'); return }

    setSaving(true)
    try {
      if (isEdit && form.id) {
        await apiClient.put('/boards', { id: form.id, boardCode: form.boardCode, boardNameKor: form.boardNameKor, contentType: form.contentType, description: form.description })
      } else {
        await apiClient.post('/boards', { boardCode: form.boardCode, boardNameKor: form.boardNameKor, contentType: form.contentType, description: form.description })
      }
      queryClient.invalidateQueries({ queryKey: ['boards'] })
      closeModal()
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(board: BoardDetailDto) {
    if (!confirm(`"${board.boardNameKor}" 게시판을 삭제하시겠습니까?\n관련된 모든 게시글도 함께 삭제됩니다.`)) return
    try {
      await apiClient.delete(`/boards/${board.id}`)
      queryClient.invalidateQueries({ queryKey: ['boards'] })
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-gray-800">📋 게시판 관리</h1>
          <Button size="sm" onClick={openCreate}>
            <Plus className="w-4 h-4 mr-1" /> 게시판 생성
          </Button>
        </div>

        {/* 에러 표시 */}
        {isError && (
          <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
            데이터를 불러오지 못했습니다: {(error as Error)?.message ?? '알 수 없는 오류'}
          </div>
        )}

        {/* 목록 */}
        {isLoading ? (
          <p className="text-center py-20 text-gray-400">불러오는 중...</p>
        ) : boards.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="mb-3">등록된 게시판이 없습니다.</p>
            <button onClick={openCreate} className="text-blue-500 hover:underline text-sm">첫 번째 게시판 생성하기</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {boards.map((board) => (
              <div
                key={board.id}
                onClick={() => navigate(`/posts?boardId=${board.id}`)}
                className="group relative bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden"
              >
                {/* 호버 시 상단 라인 */}
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />

                <div className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg group-hover:bg-blue-600 group-hover:text-white transition-colors duration-200">
                      <span className="text-xl">📋</span>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(board) }}
                        className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                        title="수정"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(board) }}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                        title="삭제"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-gray-800 mb-1.5 group-hover:text-blue-600 transition-colors">
                    {board.boardNameKor}
                  </h3>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="px-2 py-0.5 rounded bg-gray-100 text-xs font-mono text-gray-500">{board.boardCode}</span>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${CONTENT_TYPE_COLOR[board.contentType] ?? 'bg-gray-100 text-gray-500'}`}>
                      {CONTENT_TYPE_LABEL[board.contentType] ?? board.contentType}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 line-clamp-2 min-h-[2rem]">
                    {board.description || '설명이 없습니다.'}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* 생성/수정 모달 */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40" onClick={closeModal} />
          <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 z-10">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="text-base font-bold text-gray-800">{isEdit ? '게시판 수정' : '새 게시판 생성'}</h2>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 p-1 rounded transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* 게시판 코드 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  게시판 코드 {!isEdit && <span className="text-red-500">*</span>}
                </label>
                <Input
                  placeholder="예: notice (영문 소문자)"
                  value={form.boardCode}
                  disabled={isEdit}
                  onChange={(e) => setForm((f) => ({ ...f, boardCode: e.target.value }))}
                  className={isEdit ? 'bg-gray-50 text-gray-400' : ''}
                />
                {!isEdit && <p className="text-xs text-gray-400">한번 생성하면 변경할 수 없습니다.</p>}
              </div>

              {/* 게시판 이름 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">
                  게시판 이름 <span className="text-red-500">*</span>
                </label>
                <Input
                  placeholder="예: 공지사항"
                  value={form.boardNameKor}
                  onChange={(e) => setForm((f) => ({ ...f, boardNameKor: e.target.value }))}
                />
              </div>

              {/* 콘텐츠 타입 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">콘텐츠 타입</label>
                <select
                  value={form.contentType}
                  disabled={isEdit}
                  onChange={(e) => setForm((f) => ({ ...f, contentType: e.target.value }))}
                  className={`h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 ${isEdit ? 'bg-gray-50 text-gray-400' : ''}`}
                >
                  <option value="html">HTML (에디터)</option>
                  <option value="markdown">Markdown</option>
                  <option value="text">Plain Text</option>
                  <option value="json">JSON</option>
                </select>
              </div>

              {/* 설명 */}
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700">설명</label>
                <textarea
                  rows={3}
                  placeholder="게시판에 대한 설명"
                  value={form.description}
                  onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  className="border border-gray-200 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 px-6 py-4 border-t border-gray-100">
              <Button variant="outline" size="sm" onClick={closeModal}>취소</Button>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                {saving ? '저장 중...' : '저장'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
