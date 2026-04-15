import { useNavigate } from 'react-router-dom'
import { useTabParams } from '@/shared/hooks/useTabParams'
import { useTabReturnPath } from '@/shared/hooks/useTabReturnPath'
import { useQuery } from '@tanstack/react-query'
import { ArrowLeft, Pencil, ChevronLeft, ChevronRight } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { formatDate, addYmd } from '@/lib/utils'
import AttachmentList from '@/shared/components/AttachmentList'
import type { DiaryDto } from '@/domain/diary/types/diary'

export default function DiaryViewPage() {
  const { id } = useTabParams<{ id: string }>()
  const navigate = useNavigate()
  const returnPath = useTabReturnPath()

  const { data: diary, isLoading, isError } = useQuery<DiaryDto>({
    queryKey: ['diary', id],
    queryFn: () => apiClient.get<DiaryDto>(`/diary/${id}`),
    enabled: !!id,
  })

  type AdjacentItem = { id: number; ymd: string; summary: string | null }
  type DiaryPage = { dtoList: AdjacentItem[] }

  const prevYmd = diary ? addYmd(diary.ymd, -1) : ''
  const nextYmd = diary ? addYmd(diary.ymd, 1) : ''

  const { data: prevData } = useQuery<DiaryPage>({
    queryKey: ['diary-adj', prevYmd],
    queryFn: () => apiClient.get('/diary', { params: { startYmd: prevYmd, endYmd: prevYmd, size: 1, page: 1 } }),
    enabled: !!diary,
  })

  const { data: nextData } = useQuery<DiaryPage>({
    queryKey: ['diary-adj', nextYmd],
    queryFn: () => apiClient.get('/diary', { params: { startYmd: nextYmd, endYmd: nextYmd, size: 1, page: 1 } }),
    enabled: !!diary,
  })

  const prevEntry = prevData?.dtoList?.[0] ?? null
  const nextEntry = nextData?.dtoList?.[0] ?? null

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

  const displayDate =  formatDate(diary.ymd)

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <p className="text-xl text-blue-500 mb-1 font-mono">{displayDate}</p>
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
            <Button variant="outline" size="sm" onClick={() => navigate(returnPath)}>
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
        <AttachmentList attachments={diary.attachments ?? []} hideIfEmpty />

        {/* 이전 / 이후 네비게이션 */}
        <div className="flex justify-between mt-4">
          <Button
            variant="outline"
            size="sm"
            disabled={!prevEntry}
            onClick={() => prevEntry && navigate(`/diary/${prevEntry.id}`)}
          >
            <ChevronLeft className="w-4 h-4" /> 이전 일
          </Button>

          <Button
            variant="outline"
            size="sm"
            disabled={!nextEntry}
            onClick={() => nextEntry && navigate(`/diary/${nextEntry.id}`)}
          >
            다음 일 <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

      </main>
    </div>
  )
}
