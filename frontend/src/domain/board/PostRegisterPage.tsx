import { useEffect, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import ContentEditor from '@/shared/components/editor/ContentEditor'
import MdTextarea from '@/shared/components/editor/MdTextarea'
import AttachmentUploader from '@/shared/components/AttachmentUploader'
import { useAuthStore } from '@/shared/store/authStore'
import { formatDate, formatYmd } from '@/lib/utils'
import type { BoardDto } from '@/domain/board/types/board'
import { tr } from 'date-fns/locale'

export default function PostRegisterPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const boardId = searchParams.get('boardId') ? Number(searchParams.get('boardId')) : null
  const today = formatDate(new Date(), false)
  const { userNm } = useAuthStore()

  const [form, setForm] = useState({ title: '', author: userNm ?? '', baseYmd: today, content: '' })
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const contentAreaRef = useRef<HTMLDivElement>(null)
  const [postId, setPostId] = useState<number | null>(null)

  const { data: board } = useQuery<BoardDto>({
    queryKey: ['board', boardId],
    queryFn: () => apiClient.get<BoardDto>(`/boards/${boardId}`),
    enabled: !!boardId,
  })

  useEffect(() => {
    if (!boardId) navigate('/boards')
  }, [boardId, navigate])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  const isHtml = board?.contentType === 'html'
  const isMarkdown = board?.contentType === 'markdown'

  async function handleSubmit(stay = false) {
    if (!form.title.trim()) { alert('제목을 입력하세요.'); return }
    if (!form.baseYmd) { alert('기준일을 입력하세요.'); return }
    if (!boardId) return

    setSaving(true)
    try {
      const payload = {
        boardId,
        title: form.title,
        author: form.author || null,
        baseYmd: formatYmd(form.baseYmd),
        content: form.content || null,
      }
      const formData = new FormData()
      formData.append('post', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      newFiles.forEach((f) => formData.append('files', f))

    const res = postId
      ? await apiClient.put<{ id: number }>(`/boards/${boardId}/posts/${postId}`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })
      : await apiClient.post<{ id: number }>(`/boards/${boardId}/posts`, formData, { headers: { 'Content-Type': 'multipart/form-data' } })

    setPostId(res.id)
    if (!stay) navigate(`/posts/${res.id}`, { state: { boardId } })
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
          <div className="px-6 py-5 flex flex-col md:flex-row gap-4">

            {/* 제목 */}
            <div className="flex flex-col gap-1.5 flex-1">
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
            <div className="flex flex-col gap-1.5 w-full md:w-36">
              <label className="text-sm font-medium text-gray-700">작성자</label>
              <Input
                placeholder="작성자명"
                value={form.author}
                onChange={(e) => set('author', e.target.value)}
              />
            </div>

            {/* 기준일 */}
            <div className="flex flex-col gap-1.5 w-full md:w-40">
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
              <ContentEditor
                value={form.content}
                onChange={(html) => set('content', html)}
                placeholder="내용을 입력하세요..."
              />
            ) : isMarkdown ? (
              <MdTextarea
                value={form.content}
                onChange={(v) => set('content', v)}
                onSave={() => handleSubmit(true)}
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
          <div className="px-6 py-5">
            <AttachmentUploader
              attachments={[]}
              newFiles={newFiles}
              onRemoveAttachment={() => { }}
              onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
              onRemoveNewFile={(idx) => setNewFiles((p) => p.filter((_, i) => i !== idx))}
              inputId="post-new-file"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate(`/posts?boardId=${boardId}`)}>취소</Button>
          <Button onClick={() => handleSubmit(false)} disabled={saving || !form.title.trim()}>
            {saving ? '저장 중...' : '저장'}
          </Button>
        </div>
      </main>
    </div>
  )
}
