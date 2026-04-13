import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, ArrowLeft } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import AttachmentList from '@/shared/components/AttachmentList'
import type { BoardDto, PostDto } from '@/domain/board/types/board'
import { formatDate } from '@/lib/utils'
import MarkdownViewer from '@/domain/board/components/MarkdownViewer'

export default function PostViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const queryClient = useQueryClient()

  // boardId는 list → view 내비게이션 state 또는 query param에서 읽음
  const stateboardId = (location.state as { boardId?: number } | null)?.boardId
  const paramBoardId = new URLSearchParams(location.search).get('boardId')
  const boardIdHint = stateboardId ?? (paramBoardId ? Number(paramBoardId) : null)

  const { data: post, isLoading, isError } = useQuery<PostDto>({
    queryKey: ['post', id],
    queryFn: async () => {
      // boardId가 없으면 boards 목록에서 모든 boardId를 시도할 수 없으므로
      // post.boardId를 먼저 알아야 한다. boardIdHint 사용.
      const bId = boardIdHint ?? 0
      return apiClient.get<PostDto>(`/boards/${bId}/posts/${id}`)
    },
    enabled: !!id,
  })

  // 실제 boardId는 포스트 로드 후 post.boardId 사용
  const boardId = post?.boardId ?? boardIdHint

  const { data: board } = useQuery<BoardDto>({
    queryKey: ['board', boardId],
    queryFn: () => apiClient.get<BoardDto>(`/boards/${boardId}`),
    enabled: !!boardId,
  })

  async function handleDelete() {
    if (!post || !boardId) return
    if (!confirm(`"${post.title}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/boards/${boardId}/posts/${post.id}`)
      queryClient.invalidateQueries({ queryKey: ['posts'] })
      navigate(-1)
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return <div className="min-h-screen bg-gray-50"><Toolbar /><p className="text-center py-20 text-gray-400">불러오는 중...</p></div>
  }
  if (isError || !post) {
    return <div className="min-h-screen bg-gray-50"><Toolbar /><p className="text-center py-20 text-red-400">게시글을 불러올 수 없습니다.</p></div>
  }

  const contentType = board?.contentType ?? 'html'

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="border-b border-gray-200 pb-4 mb-4">
          <h1 className="text-2xl font-extrabold text-gray-900 mb-3 leading-tight">{post.title}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              👤 <span className="font-medium text-gray-700">{post.author || '관리자'}</span>
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              📌 {formatDate(post.baseYmd, false)}
            </span>
            <span className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 rounded-full">
              👁️ {post.viewCount}
            </span>

            <div className="flex-1" />

            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigate(`/posts/${post.id}/edit`, { state: { boardId } })}>
                <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
              </Button>
              <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
              </Button>
              <Button variant="outline" size="sm" onClick={() => navigate(`/posts?boardId=${boardId}`)}>
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 목록으로
              </Button>
            </div>
          </div>
        </div>

        {/* 내용 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-4 min-h-[200px]">
          {contentType === 'html' ? (
            <div className="prose prose-sm max-w-none text-gray-800" dangerouslySetInnerHTML={{ __html: post.content ?? '' }} />
          ) : contentType === 'markdown' ? (
            <MarkdownViewer content={post.content ?? ''} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{post.content ?? ''}</pre>
          )}
        </div>

        {/* 첨부파일 */}
        <AttachmentList attachments={post.attachments ?? []} className="mb-6" />

      </main>
    </div>
  )
}
