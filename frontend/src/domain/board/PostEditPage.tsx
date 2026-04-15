import { useEffect, useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useTabParams } from '@/shared/hooks/useTabParams'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import ContentEditor from '@/shared/components/editor/ContentEditor'
import AttachmentUploader from '@/shared/components/AttachmentUploader'
import { formatYmd } from '@/lib/utils'
import type { AttachmentDto, BoardDto, PostDto } from '@/domain/board/types/board'

export default function PostEditPage() {
  const { id } = useTabParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  const stateboardId = (location.state as { boardId?: number } | null)?.boardId
  const paramBoardId = new URLSearchParams(location.search).get('boardId')
  const boardIdHint = stateboardId ?? (paramBoardId ? Number(paramBoardId) : null)

  const [form, setForm] = useState({ title: '', author: '', baseYmd: '', content: '' })
  const [attachments, setAttachments] = useState<AttachmentDto[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)
  const [formReady, setFormReady] = useState(false)

  const { data: post, isLoading } = useQuery<PostDto>({
    queryKey: ['post', id],
    queryFn: () => apiClient.get<PostDto>(`/boards/${boardIdHint ?? 0}/posts/${id}`),
    enabled: !!id,
  })

  const boardId = post?.boardId ?? boardIdHint

  const { data: board } = useQuery<BoardDto>({
    queryKey: ['board', boardId],
    queryFn: () => apiClient.get<BoardDto>(`/boards/${boardId}`),
    enabled: !!boardId,
  })

  useEffect(() => {
    if (!post) return
    const ymd = post.baseYmd
    setForm({
      title: post.title,
      author: post.author ?? '',
      baseYmd: ymd.length === 8 ? `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}` : ymd,
      content: post.content ?? '',
    })
    setAttachments(post.attachments ?? [])
    setFormReady(true)
  }, [post])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function removeAttachment(fileId: number) {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId))
    setDeletedIds((prev) => [...prev, fileId])
  }

  const isHtml = board?.contentType === 'html'
  const isMarkdown = board?.contentType === 'markdown'

  async function handleSubmit() {
    if (!form.title.trim()) { alert('제목을 입력하세요.'); return }
    if (!post || !boardId) return

    setSaving(true)
    try {
      const payload = {
        id: post.id,
        boardId,
        title: form.title,
        author: form.author || null,
        baseYmd: formatYmd(form.baseYmd),
        content: form.content || null,
        deletedAttachmentIds: deletedIds,
      }
      const formData = new FormData()
      formData.append('post', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      newFiles.forEach((f) => formData.append('files', f))

      await apiClient.put(
        `/boards/${boardId}/posts/${post.id}`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      )
      queryClient.invalidateQueries({ queryKey: ['post', id] })
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate(`/posts/${post.id}`, { state: { boardId } })
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!post || !boardId) return
    if (!confirm(`"${post.title}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/boards/${boardId}/posts/${post.id}`)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate(`/posts?boardId=${boardId}`)
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><Toolbar /><p className="text-center py-20 text-gray-400">불러오는 중...</p></div>
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <button
            onClick={() => navigate(`/posts/${id}`, { state: { boardId } })}
            className="p-1.5 rounded-full hover:bg-gray-200 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold text-gray-800">
            ✏️ {board?.boardNameKor} - 글 수정
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
              />
            </div>

            {/* 작성자 */}
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">작성자</label>
              <Input
                placeholder="미입력 시 관리자"
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
          <div className="px-6 py-5 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">
              내용
              {board && <span className="ml-2 text-xs text-gray-400">({board.contentType})</span>}
            </label>
            {isHtml ? (
              formReady && (
                <ContentEditor
                  value={form.content}
                  onChange={(html) => set('content', html)}
                  placeholder="내용을 입력하세요..."
                />
              )
            ) : isMarkdown ? (
              <textarea
                rows={20}
                placeholder="마크다운으로 내용을 입력하세요..."
                value={form.content}
                onChange={(e) => set('content', e.target.value)}
                className="border border-gray-200 rounded-lg px-4 py-3 text-sm resize-y focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono w-full"
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
              attachments={attachments}
              newFiles={newFiles}
              onRemoveAttachment={removeAttachment}
              onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
              onRemoveNewFile={(idx) => setNewFiles((p) => p.filter((_, i) => i !== idx))}
              inputId="post-edit-file"
            />
          </div>
        </div>

        {/* 버튼 */}
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
            삭제
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/posts/${id}`, { state: { boardId } })}>취소</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.title.trim()}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
