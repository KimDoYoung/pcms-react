import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Trash2, ArrowLeft, Paperclip, Download } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import StarRating from '@/components/StarRating'

interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
  mimeType: string
}

interface JangbiDto {
  id: number
  ymd: string
  item: string
  location: string | null
  cost: number | null
  spec: string | null
  lvl: string
  modifyDt: string | null
  attachments: AttachmentDto[]
}

function formatYmd(ymd: string) {
  if (!ymd || ymd.length !== 8) return ymd
  return `${ymd.slice(0, 4)}-${ymd.slice(4, 6)}-${ymd.slice(6, 8)}`
}

function formatCost(cost: number | null) {
  if (cost == null) return '-'
  return cost.toLocaleString('ko-KR') + '원'
}

function formatFileSize(bytes: number) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

function formatDateTime(dt: string | null) {
  if (!dt) return '-'
  return new Date(dt).toLocaleString('ko-KR')
}

export default function JangbiViewPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: jangbi, isLoading, isError } = useQuery<JangbiDto>({
    queryKey: ['jangbi', id],
    queryFn: () => apiClient.get<JangbiDto>(`/jangbi/${id}`),
    enabled: !!id,
  })

  async function handleDelete() {
    if (!jangbi) return
    if (!confirm(`"${jangbi.item}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/jangbi/${id}`)
      queryClient.invalidateQueries({ queryKey: ['jangbi-list'] })
      navigate('/jangbi')
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <p className="text-center py-20 text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  if (isError || !jangbi) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <p className="text-center py-20 text-red-400">장비 정보를 불러올 수 없습니다.</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{jangbi.item}</h1>
            <p className="text-sm text-gray-400 mt-1">구입일: {formatYmd(jangbi.ymd)}</p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" onClick={() => navigate(`/jangbi/${id}/edit`)}>
              <Pencil className="w-3.5 h-3.5 mr-1" /> 수정
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
              <Trash2 className="w-3.5 h-3.5 mr-1" /> 삭제
            </Button>
            <Button variant="outline" size="sm" onClick={() => navigate('/jangbi')}>
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> 목록으로
            </Button>
          </div>
        </div>

        {/* 기본 정보 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-4">
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-5 text-sm">
            <div>
              <dt className="text-xs text-gray-400 mb-1">위치</dt>
              <dd className="text-gray-800">{jangbi.location || '-'}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 mb-1">가격</dt>
              <dd className="text-gray-800">{formatCost(jangbi.cost)}</dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 mb-1">만족도</dt>
              <dd>
                <StarRating value={parseInt(jangbi.lvl, 10)} max={3} size="sm" filled={true} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-gray-400 mb-1">수정일</dt>
              <dd className="text-gray-500 text-xs">{formatDateTime(jangbi.modifyDt)}</dd>
            </div>
          </dl>
        </div>

        {/* 스펙/특징 */}
        {jangbi.spec && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-3">📋 스펙 / 특징</h2>
            <div
              className="prose prose-sm max-w-none text-gray-700"
              dangerouslySetInnerHTML={{ __html: jangbi.spec }}
            />
          </div>
        )}

        {/* 첨부파일 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-6 py-5 mb-6">
          <h2 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-1">
            <Paperclip className="w-4 h-4" /> 첨부파일
          </h2>
          {(!jangbi.attachments || jangbi.attachments.length === 0) ? (
            <p className="text-sm text-gray-400">첨부된 파일이 없습니다.</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {jangbi.attachments.map((att) => (
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

        {/* 하단 버튼 */}
        {/* <div className="flex justify-start">
          <Button variant="outline" size="sm" onClick={() => navigate('/jangbi')}>
            <ArrowLeft className="w-4 h-4 mr-1" /> 목록으로
          </Button>
        </div> */}

      </main>
    </div>
  )
}
