import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Paperclip, X, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import SpecEditor from '@/shared/components/editor/SpecEditor'
import MilkdownEditor from '@/board/components/MilkdownEditor'
import { useAuthStore } from '@/shared/store/authStore'

interface BoardDto {
  id: number
  boardNameKor: string
  contentType: string
}

export default function PostNewPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const boardId = searchParams.get('boardId') ? Number(searchParams.get('boardId')) : null
  const today = new Date().toISOString().slice(0, 10)
  const { userNm } = useAuthStore()

  const [form, setForm] = useState({ title: '', author: userNm ?? '', baseYmd: today, content: '' })
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const contentAreaRef = useRef<HTMLDivElement>(null)

  const { data: board } = useQuery<BoardDto>({
    queryKey: ['board', boardId],
    queryFn: () => apiClient.get<BoardDto>(`/boards/${boardId}`),
    enabled: !!boardId,
  })

  useEffect(() => {
    if (!boardId) navigate('/boards')
  }, [boardId])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const isHtml = board?.contentType === 'html'
  const isMarkdown = board?.contentType === 'markdown'

  async function handleSubmit() {
    if (!form.title.trim()) { alert('제목을 입력하세요.'); return }
    if (!form.baseYmd) { alert('기준일을 입력하세요.'); return }
    if (!boardId) return

    setSaving(true)
    try {
      const payload = {
        boardId,
        title: form.title,
        author: form.author || null,
        baseYmd: form.baseYmd.replace(/-/g, ''),
        content: form.content || null,
      }
      const formData = new FormData()
      formData.append('post', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      newFiles.forEach((f) => formData.append('files', f))

      const res = await apiClient.post<{ id: number }>(
        `/boards/${boardId}/posts`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      navigate(`/posts/${res.id}`, { state: { boardId } })
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/posts?boardId=${boardId}`)}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            ✏️ {board?.boardNameKor} - 새 글 쓰기
          </h1>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">

          {/* 기본 정보 */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-2 gap-5">

            {/* 제목 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">제목 <span className="text-red-500">*</span></label>
              <Input
                placeholder="게시글 제목"
                maxLength={500}
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Tab') {
                    e.preventDefault()
                    const el = contentAreaRef.current?.querySelector<HTMLElement>('[contenteditable], textarea')
                    el?.focus()
                  }
                }}
              />
            </div>

            {/* 작성자 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">작성자</label>
              <Input
                placeholder="작성자명"
                value={form.author}
                onChange={(e) => set('author', e.target.value)}
              />
            </div>

            {/* 기준일 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">기준일 <span className="text-red-500">*</span></label>
              <Input
                type="date"
                value={form.baseYmd}
                onChange={(e) => set('baseYmd', e.target.value)}
              />
            </div>
          </div>

          {/* 내용 */}
          <div ref={contentAreaRef} className="px-6 py-5 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              내용
              {board && <span className="ml-2 text-xs text-gray-400">({board.contentType})</span>}
            </label>
            {isHtml ? (
              <SpecEditor
                value={form.content}
                onChange={(html) => set('content', html)}
                placeholder="내용을 입력하세요..."
              />
            ) : isMarkdown ? (
              <MilkdownEditor
                defaultValue={form.content}
                onChange={(md) => set('content', md)}
                placeholder="마크다운으로 내용을 입력하세요..."
              />
            ) : (
              <textarea
                rows={16}
                placeholder="내용을 입력하세요..."
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
              />
            )}
          </div>

          {/* 첨부파일 */}
          <div className="px-6 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> 첨부파일
              </h3>
              <button
                onClick={() => document.getElementById('post-new-file')?.click()}
                className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors shadow-sm"
              >
                + 파일 추가
              </button>
              <input
                id="post-new-file"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setNewFiles((prev) => [...prev, ...Array.from(e.target.files!)])
                  }
                  e.target.value = ''
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {newFiles.length === 0 && (
                <span className="text-xs text-gray-300 italic py-2">첨부된 파일이 없습니다.</span>
              )}
              {newFiles.map((file, idx) => (
                <div key={`${file.name}-${idx}`} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded-md">
                  <Paperclip className="w-3 h-3 text-blue-400" />
                  <span className="truncate max-w-[160px]" title={file.name}>{file.name}</span>
                  <button type="button" onClick={() => setNewFiles((p) => p.filter((_, i) => i !== idx))} className="text-blue-400 hover:text-red-500 p-0.5 rounded transition-colors">
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(`/posts?boardId=${boardId}`)}>취소</Button>
          <Button onClick={handleSubmit} disabled={saving || !form.title.trim()}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </main>
    </div>
  )
}
