import { useNavigate, useParams, useLocation } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, ArrowLeft, Paperclip, Download } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'

interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
}

interface PostDto {
  id: number
  boardId: number
  title: string
  author: string | null
  content: string | null
  viewCount: number
  baseYmd: string
  createdAt: string | null
  attachments: AttachmentDto[]
}

interface BoardDto {
  id: number
  boardNameKor: string
  contentType: string
}

function formatYmd(ymd: string) {
  if (!ymd || ymd.length !== 8) return ymd
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

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
      navigate(`/posts?boardId=${boardId}`)
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
              📌 {formatYmd(post.baseYmd)}
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
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{post.content ?? ''}</pre>
          )}
        </div>

        {/* 첨부파일 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <Paperclip className="w-4 h-4" /> 첨부파일
          </h2>
          {(!post.attachments || post.attachments.length === 0) ? (
            <p className="text-sm text-gray-400">첨부된 파일이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {post.attachments.map((att) => (
                <li key={att.fileId} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-2 min-w-0">
                    <Paperclip className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    <span className="text-sm text-gray-700 truncate">{att.orgFileName}</span>
                    <span className="text-xs text-gray-400 shrink-0">({formatFileSize(att.fileSize)})</span>
                  </div>
                  <a
                    href={`/pcms/file/download/${att.fileId}`}
                    className="flex items-center gap-1 text-xs text-blue-500 hover:text-blue-700 shrink-0 ml-2"
                  >
                    <Download className="w-3.5 h-3.5" /> 다운로드
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>

      </main>
    </div>
  )
}
