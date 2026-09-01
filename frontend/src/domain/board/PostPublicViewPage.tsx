import { useState } from 'react'
import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import AttachmentsView from '@/shared/components/AttachmentsView'
import type { BoardDto, PostDto } from '@/domain/board/types/board'
import { formatDate } from '@/lib/utils'
import MarkdownViewer from '@/domain/board/components/MarkdownViewer'
import { Button } from '@/shared/components/ui/button'
import { FileDown, Loader2 } from 'lucide-react'
import { exportPostToPdf } from '@/lib/pdfExporter'
import { useMessage } from '@/shared/hooks/useMessage'

/**
 * post url 공유(카톡 등)로 접근하는 인증 없는 게시글 단독 뷰 페이지.
 * 경로: /posts/html/:id, /posts/markdown/:id, /posts/text/:id (예: /posts/html/171)
 * 경로의 contentType 부분은 표시용이며, 실제 렌더 방식은 서버에서 조회한 board.contentType을 따른다.
 */
export default function PostPublicViewPage() {
  const { id } = useParams<{ id: string }>()
  const { showMessage } = useMessage()
  const [isExportingPdf, setIsExportingPdf] = useState(false)

  const { data: post, isLoading, isError } = useQuery<PostDto>({
    queryKey: ['public-post', id],
    // boardId는 URL에 없으므로 더미(0)로 조회한다. 서버 조회는 postId 기준이라 boardId는 사용되지 않는다.
    queryFn: () => apiClient.get<PostDto>(`/boards/0/posts/${id}`),
    enabled: !!id,
  })

  const boardId = post?.boardId

  const { data: board } = useQuery<BoardDto>({
    queryKey: ['public-board', boardId],
    queryFn: () => apiClient.get<BoardDto>(`/boards/${boardId}`),
    enabled: !!boardId,
  })

  async function handleExportPdf() {
    if (!post) return
    setIsExportingPdf(true)
    try {
      await exportPostToPdf(post, board?.boardNameKor, board?.contentType)
      showMessage('PDF 저장이 완료되었습니다.', 'success')
    } catch (err) {
      console.error('PDF 저장 오류:', err)
      showMessage('PDF 저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsExportingPdf(false)
    }
  }

  if (isLoading) {
    return <p className="text-center py-20 text-gray-400">불러오는 중...</p>
  }
  if (isError || !post) {
    return <p className="text-center py-20 text-red-400">게시글을 불러올 수 없습니다.</p>
  }

  const contentType = board?.contentType ?? 'html'

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="mx-auto px-4 py-6 w-[80vw]">
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

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPdf}
              disabled={isExportingPdf}
            >
              {isExportingPdf ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <FileDown className="w-3.5 h-3.5 mr-1" />
              )}
              PDF 저장
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-4 min-h-[200px]">
          {contentType === 'html' ? (
            <div className="markdown-body max-w-none" dangerouslySetInnerHTML={{ __html: post.content ?? '' }} />
          ) : contentType === 'markdown' ? (
            <MarkdownViewer content={post.content ?? ''} />
          ) : (
            <pre className="whitespace-pre-wrap text-sm text-gray-700 font-mono">{post.content ?? ''}</pre>
          )}
        </div>

        <AttachmentsView attachments={post.attachments ?? []} className="mb-6" />
      </main>
    </div>
  )
}
