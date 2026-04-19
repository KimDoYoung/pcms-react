/**
 * S-Note 목록 페이지
 * - 암호화 메모 목록을 제목/등록일과 함께 표시
 * - 제목 키워드 검색, 페이지네이션 지원
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search, Plus, Pencil, Trash2 } from 'lucide-react'
import { formatRelativeDateTime } from '@/lib/utils'
import type { SnotePageResponse } from '@/domain/snote/types/snote'

const PAGE_SIZE = 10

export default function SNoteListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? 1)
  const keyword = searchParams.get('keyword') ?? ''
  const [localKeyword, setLocalKeyword] = useState(keyword)

  const { data, isLoading } = useQuery<SnotePageResponse>({
    queryKey: ['snote-list', { keyword, page }],
    queryFn: () => {
      const params: Record<string, string | number> = { size: PAGE_SIZE, page }
      if (keyword) params.keyword = keyword
      return apiClient.get<SnotePageResponse>('/snote', { params })
    },
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleSearch() {
    setSearchParams((p) => {
      p.set('page', '1')
      if (localKeyword) p.set('keyword', localKeyword)
      else p.delete('keyword')
      return p
    })
  }

  function handleReset() {
    setLocalKeyword('')
    setSearchParams({})
  }

  async function handleDelete(id: number, title: string | null) {
    if (!confirm(`"${title ?? '(제목없음)'}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/snote/${id}`)
      queryClient.invalidateQueries({ queryKey: ['snote-list'] })
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">

        {/* 헤더 */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-xl font-bold text-gray-800">🔐 S-Note</h1>
          <Button variant="action" size="sm" onClick={() => navigate('/snote/register')}>
            <Plus className="w-4 h-4 mr-1" /> 추가
          </Button>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-center">
          <div className="flex items-center gap-2 flex-1 min-w-40">
            <label className="text-xs text-gray-500 shrink-0">검색어</label>
            <Input
              placeholder="제목 검색"
              value={localKeyword}
              onChange={(e) => setLocalKeyword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="text-sm"
            />
          </div>
          <Button variant="action" size="pill" onClick={handleSearch} className="shrink-0">
            <Search className="w-4 h-4 mr-1" /> 찾기
          </Button>
          <Button variant="init" size="pill" onClick={handleReset} className="shrink-0">
            초기화
          </Button>
        </div>

        {/* 목록 */}
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>
        ) : (
          <>
            <p className="text-xs text-gray-400 mb-2 px-1">총 {data?.total ?? 0}건</p>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200 text-xs text-gray-500">
                    <th className="px-4 py-3 text-center font-medium w-14">No.</th>
                    <th className="px-4 py-3 text-left font-medium">제목</th>
                    <th className="px-4 py-3 text-center font-medium w-28">등록일</th>
                    <th className="px-4 py-3 text-center font-medium w-20">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data?.dtoList || data.dtoList.length === 0) && (
                    <tr>
                      <td colSpan={4} className="text-center py-14 text-gray-400">
                        등록된 S-Note가 없습니다.
                      </td>
                    </tr>
                  )}
                  {data?.dtoList?.map((item, idx) => {
                    const no = (data.total) - ((page - 1) * PAGE_SIZE) - idx
                    return (
                      <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3 text-center text-xs text-gray-400">{no}</td>
                        <td className="px-4 py-3">
                          <button
                            onClick={() => navigate(`/snote/${item.id}/edit`)}
                            className="text-left hover:underline"
                          >
                            {item.title
                              ? <span className="font-medium text-gray-800">{item.title}</span>
                              : <span className="italic text-gray-400">(제목없음)</span>
                            }
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center text-xs text-gray-400">
                          {item.createDt ? formatRelativeDateTime(item.createDt) : '-'}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => navigate(`/snote/${item.id}/edit`)}
                              className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                              title="수정"
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(item.id, item.title)}
                              className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                              title="삭제"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* 페이징 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-6">
                <Button
                  variant="outline" size="sm"
                  disabled={page <= 1}
                  onClick={() => setSearchParams((p) => { p.set('page', String(page - 1)); return p })}
                >이전</Button>
                <span className="px-3 py-1 text-sm text-gray-600 flex items-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline" size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setSearchParams((p) => { p.set('page', String(page + 1)); return p })}
                >다음</Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
