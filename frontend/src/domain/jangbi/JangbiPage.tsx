import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search, Plus, Pencil, Trash2, CalendarRange } from 'lucide-react'
import StarRating from '@/shared/components/StarRating'
import { formatCost, formatDate } from '@/lib/utils'
import type { JangbiPageResponse } from '@/domain/jangbi/types/jangbi'
import { DateRangeSetter } from '@/shared/components/DateRangeSetter'
import { format } from 'date-fns'

const PAGE_SIZE = 10

export default function JangbiPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showPicker, setShowPicker] = useState(false)

  const page = Number(searchParams.get('page') ?? 1)
  const keyword = searchParams.get('keyword') ?? ''
  const lvl = searchParams.get('lvl') ?? ''
  const startYmd = searchParams.get('startYmd') ?? ''
  const endYmd = searchParams.get('endYmd') ?? ''

  const [form, setForm] = useState({ keyword, lvl, startYmd, endYmd })

  const { data, isLoading } = useQuery<JangbiPageResponse>({
    queryKey: ['jangbi-list', { keyword, lvl, startYmd, endYmd, page }],
    queryFn: () => {
      const params: Record<string, string | number> = { size: PAGE_SIZE, page }
      if (keyword) params.keyword = keyword
      if (lvl) params.lvl = lvl
      if (startYmd) params.startYmd = startYmd
      if (endYmd) params.endYmd = endYmd
      return apiClient.get<JangbiPageResponse>('/jangbi', { params })
    },
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleSearch() {
    setSearchParams((p) => {
      p.set('page', '1')
      if (form.keyword) p.set('keyword', form.keyword)
      else p.delete('keyword')
      
      if (form.lvl) p.set('lvl', form.lvl)
      else p.delete('lvl')
      
      if (form.startYmd) p.set('startYmd', form.startYmd)
      else p.delete('startYmd')
      
      if (form.endYmd) p.set('endYmd', form.endYmd)
      else p.delete('endYmd')
      
      return p
    })
  }

  function handleReset() {
    setForm({ keyword: '', lvl: '', startYmd: '', endYmd: '' })
    setSearchParams({})
  }

  async function handleDelete(id: number, item: string) {
    if (!confirm(`"${item}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/jangbi/${id}`)
      queryClient.invalidateQueries({ queryKey: ['jangbi-list'] })
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
          <h1 className="text-xl font-bold text-gray-800">🖥️ 장비</h1>
          <Button size="sm" onClick={() => navigate('/jangbi/new')}>
            <Plus className="w-4 h-4 mr-1" /> 새 장비 추가
          </Button>
        </div>

        {/* 검색 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2 flex-1 min-w-40">
            <label className="text-xs text-gray-500 shrink-0">검색어</label>
            <Input
              placeholder="품목명 또는 위치"
              value={form.keyword}
              onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">구입일</label>
            <Input
              type="date"
              value={form.startYmd}
              onChange={(e) => setForm((f) => ({ ...f, startYmd: e.target.value }))}
              className="text-sm w-36"
            />
            <span className="text-xs text-gray-400">~</span>
            <Input
              type="date"
              value={form.endYmd}
              onChange={(e) => setForm((f) => ({ ...f, endYmd: e.target.value }))}
              className="text-sm w-36"
            />
          </div>
          <div className="relative">
            <Button variant="outline" size="sm"
              onClick={() => setShowPicker((v) => !v)}
              title="기간 빠른 선택">
              <CalendarRange className="w-4 h-4" />
            </Button>
            {showPicker && (
              <DateRangeSetter
                onRangeChange={(start, end) => {
                  setForm((f) => ({
                    ...f,
                    startYmd: format(start, 'yyyy-MM-dd'),
                    endYmd: format(end, 'yyyy-MM-dd'),
                  }))
                }}
                onClose={() => setShowPicker(false)}
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">만족도</label>
            <select
              value={form.lvl}
              onChange={(e) => setForm((f) => ({ ...f, lvl: e.target.value }))}
              className="text-sm border border-gray-200 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 h-9"
            >
              <option value="">전체</option>
              <option value="3">만족</option>
              <option value="2">보통</option>
              <option value="1">실망</option>
            </select>
          </div>
          <Button onClick={handleSearch} className="shrink-0">
            <Search className="w-4 h-4 mr-1" /> 찾기
          </Button>
          <Button variant="outline" onClick={handleReset} className="shrink-0">
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
                    <th className="px-4 py-3 text-left font-medium">구입일</th>
                    <th className="px-4 py-3 text-left font-medium">품목</th>
                    <th className="px-4 py-3 text-left font-medium">위치</th>
                    <th className="px-4 py-3 text-right font-medium">가격(원)</th>
                    <th className="px-4 py-3 text-center font-medium">만족도</th>
                    <th className="px-4 py-3 text-center font-medium">첨부</th>
                    <th className="px-4 py-3 text-center font-medium">액션</th>
                  </tr>
                </thead>
                <tbody>
                  {(!data?.dtoList || data.dtoList.length === 0) && (
                    <tr>
                      <td colSpan={7} className="text-center py-14 text-gray-400">
                        등록된 장비가 없습니다.
                      </td>
                    </tr>
                  )}
                  {data?.dtoList?.map((j) => (
                    <tr key={j.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{formatDate(j.ymd)}</td>
                      <td className="px-4 py-3 font-medium">
                        <button
                          onClick={() => navigate(`/jangbi/${j.id}`)}
                          className="text-blue-600 hover:underline text-left"
                        >
                          {j.item}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-gray-500">{j.location || '-'}</td>
                      <td className="px-4 py-3 text-right text-gray-700">{formatCost(j.cost)}</td>
                      <td className="px-4 py-3 text-center">
                        <StarRating value={parseInt(j.lvl, 10)} max={3} size="sm" filled={true} />
                      </td>
                      <td className="px-4 py-3 text-center text-xs text-gray-400">
                        {j.attachmentCount > 0 ? `📎 ${j.attachmentCount}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => navigate(`/jangbi/${j.id}/edit`)}
                            className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded transition-colors"
                            title="수정"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(j.id, j.item)}
                            className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
                            title="삭제"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
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
