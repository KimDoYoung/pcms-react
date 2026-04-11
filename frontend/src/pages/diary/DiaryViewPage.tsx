import { useNavigate, useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Paperclip, Download, Pencil } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType: string
}

interface DiaryDto {
  id: number
  ymd: string
  summary: string | null
  content: string | null
  attachments: AttachmentDto[]
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export default function DiaryViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  const { data: diary, isLoading, isError } = useQuery<DiaryDto>({
    queryKey: ['diary', id],
    queryFn: () => apiClient.get<DiaryDto>(`/diary/${id}`),
    enabled: !!id,
  })

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <p className="text-center py-20 text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (isError || !diary) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <p className="text-center py-20 text-red-400">일지를 불러올 수 없습니다.</p>
      </div>
    )
  }

  const displayDate = `${diary.ymd.slice(0, 4)}-${diary.ymd.slice(4, 6)}-${diary.ymd.slice(6, 8)}`

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xs text-gray-400 mb-1 font-mono">{formatDate(displayDate, false, true, true)}</p>
            <h1 className="text-xl font-bold text-gray-800">
              {diary.summary ?? <span className="text-gray-300 italic">제목 없음</span>}
            </h1>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/diary/register?date=${displayDate}`)}
            >
              <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/diary')}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 목록
            </Button>
          </div>
        </div>

        {/* 본문 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-6 mb-4">
          {diary.content ? (
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: diary.content }}
            />
          ) : (
            <p className="text-sm text-gray-300 italic">내용 없음</p>
          )}
        </div>

        {/* 첨부파일 */}
        {diary.attachments && diary.attachments.length > 0 && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5">
            <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
              <Paperclip className="w-4 h-4" /> 첨부파일
            </h2>
            <ul className="flex flex-col gap-2">
              {diary.attachments.map((att) => (
                <li
                  key={att.fileId}
                  className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg border border-gray-200"
                >
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
          </div>
        )}

      </main>
    </div>
  )
}
