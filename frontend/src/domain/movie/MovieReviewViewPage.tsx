import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useTabParams } from '@/shared/layout/useTabParams'
import { useMessage } from '@/shared/hooks/useMessage'
import { apiClient } from '@/lib/apiClient'
import { formatDate } from '@/lib/utils'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import StarRating from '@/shared/components/StarRating'
import type { MovieReviewDto } from '@/domain/movie/types/movie'
import { Pencil, Trash2, List } from 'lucide-react'

export default function MovieReviewViewPage() {
  const navigate = useNavigate()
  const { id } = useTabParams<{ id: string }>()
  const { showMessage } = useMessage()
  const [data, setData] = useState<MovieReviewDto | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (id) {
      async function fetchReview() {
        try {
          const res = await apiClient.get<MovieReviewDto>(`/movie/review/${id}`)
          setData(res)
        } catch (e) {
          console.error('Failed to fetch review', e)
          showMessage('감상평을 불러오는데 실패했습니다.', 'error')
        } finally {
          setLoading(false)
        }
      }
      fetchReview()
    }
  }, [id, showMessage])

  const handleDelete = async () => {
    if (!window.confirm('정말 삭제하시겠습니까?')) return
    try {
      await apiClient.delete(`/movie/review/${id}`)
      showMessage('삭제되었습니다.', 'success')
      navigate('/movie/review')
    } catch (e) {
      console.error('Delete error', e)
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  if (loading) return <div className="p-10 text-center">불러오는 중...</div>
  if (!data) return <div className="p-10 text-center text-red-500">데이터를 찾을 수 없습니다.</div>

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">🎬 영화 감상평 상세보기</h1>
          <div className="flex gap-2">
            <Button variant="action" size="pill" onClick={() => navigate(`/movie/review/${id}/edit`)}>
              <Pencil className="w-4 h-4 mr-1" /> 수정
            </Button>
            <Button variant="delete" size="pill" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-1" /> 삭제
            </Button>
            <Button variant="init" size="pill" onClick={() => navigate('/movie/review')}>
              <List className="w-4 h-4 mr-1" /> 목록
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {/* 헤더 섹션 */}
          <div className="p-6 border-b border-gray-100 bg-gray-50/50">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">{data.title}</h2>
            <div className="flex flex-wrap gap-y-3 gap-x-8 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">평점</span>
                <StarRating value={data.lvl ?? 0} max={5} size="md" />
                {/* <span className="font-bold text-amber-500">{data.lvl} / 5</span> */}
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">관람일</span>
                <span className="text-gray-800">{data.ymd ? formatDate(data.ymd) : '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">제작국가</span>
                <span className="text-gray-800">{data.nara || '-'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-400">제작년도</span>
                <span className="text-gray-800">{data.year || '-'}</span>
              </div>
            </div>
          </div>

          {/* 본문 섹션 */}
          <div className="p-8">
            <div 
              className="prose prose-blue max-w-none min-h-[300px]"
              dangerouslySetInnerHTML={{ __html: data.content || '<p className="text-gray-400 italic">내용이 없습니다.</p>' }}
            />
          </div>
          
          {data.lastmodifyDt && (
            <div className="px-8 py-4 bg-gray-50 border-t border-gray-100 text-right text-xs text-gray-400">
              최종 수정: {new Date(data.lastmodifyDt).toLocaleString()}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
