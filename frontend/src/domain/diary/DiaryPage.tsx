import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search, ChevronDown, ChevronUp, Pencil, Eye, CalendarRange, ArrowDownUp } from 'lucide-react'
import { formatCount, formatDate, formatYmd } from '@/lib/utils'
import { format } from 'date-fns'
import type { DiaryListDto, DiaryPageResponse } from '@/domain/diary/types/diary'
import {  DateRangeSetter } from '@/shared/components/DateRangeSetter'

const PAGE_SIZE = 10

function DiaryItem({ item }: { item: DiaryListDto }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const ymd = item.ymd  // yyyymmdd
  const displayDate = `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`

  return (
    <li className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="shrink-0 text-xs font-mono text-gray-400 sm:w-36">
            {formatDate(displayDate)}
          </span>
          <div className="flex items-center gap-1 sm:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/diary/${item.id}`) }}
              className="p-2 text-gray-400 hover:text-green-500 rounded transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/diary/register?date=${displayDate}`) }}
              className="p-2 text-gray-400 hover:text-blue-500 rounded transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
          </div>
        </div>
        <span
          className="flex-1 text-sm font-medium sm:font-normal text-gray-800 truncate hover:text-blue-600 hover:underline cursor-pointer"
          onClick={(e) => { e.stopPropagation(); navigate(`/diary/${item.id}`) }}
        >
          {item.summary ?? <span className="text-gray-300 italic">제목 없음</span>}
        </span>
        <div className="hidden sm:flex items-center gap-2 shrink-0">
          {item.attachmentCount > 0 && (
            <span className="text-xs text-gray-400">📎 {item.attachmentCount}</span>
          )}
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/diary/${item.id}`)
            }}
            className="p-1 text-gray-400 hover:text-green-500 rounded transition-colors"
            title="보기"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              navigate(`/diary/register?date=${displayDate}`)
            }}
            className="p-1 text-gray-400 hover:text-blue-500 rounded transition-colors"
            title="수정"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {expanded
            ? <ChevronUp className="w-4 h-4 text-gray-400" />
            : <ChevronDown className="w-4 h-4 text-gray-400" />}
        </div>
      </div>

      {expanded && (
        <div
          className="px-4 py-4 border-t border-gray-100 markdown-body max-w-none overflow-x-auto"
          dangerouslySetInnerHTML={{ __html: item.content ?? '' }}
        />
      )}
    </li>
  )
}

export default function DiaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? 1)
  const keyword = searchParams.get('keyword') ?? ''
  const startYmd = searchParams.get('startYmd') ?? ''
  const endYmd = searchParams.get('endYmd') ?? ''
  const sort = (searchParams.get('sort') ?? 'desc') as 'asc' | 'desc'

  const [form, setForm] = useState({ startYmd, endYmd, keyword, sort })
  const [showPicker, setShowPicker] = useState(false)

  const { data, isLoading } = useQuery<DiaryPageResponse>({
    queryKey: ['diary-list', { keyword, startYmd, endYmd, sort, page }],
    queryFn: () => {
      const params: Record<string, string | number> = { size: PAGE_SIZE, page, sort }
      if (startYmd) params.startYmd = formatYmd(startYmd)
      if (endYmd)   params.endYmd   = formatYmd(endYmd)
      if (keyword)  params.keyword  = keyword
      return apiClient.get<DiaryPageResponse>('/diary', { params })
    },
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleSearch() {
    setSearchParams((p) => {
      p.set('page', '1')
      p.set('sort', form.sort)
      
      if (form.startYmd) p.set('startYmd', form.startYmd)
      else p.delete('startYmd')
      
      if (form.endYmd) p.set('endYmd', form.endYmd)
      else p.delete('endYmd')
      
      if (form.keyword) p.set('keyword', form.keyword)
      else p.delete('keyword')
      
      return p
    })
  }

  function handleReset() {
    setForm({ startYmd: '', endYmd: '', keyword: '', sort: 'desc' })
    setSearchParams({})
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleSearch()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-4">🔍 일지 찾기</h1>

        {/* 검색 폼 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-4 mb-4 flex flex-col sm:flex-row sm:flex-wrap gap-3 items-stretch sm:items-end">
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-3">
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">시작일</label>
              <Input
                type="date"
                value={form.startYmd}
                onChange={(e) => setForm((f) => ({ ...f, startYmd: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="text-sm"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">종료일</label>
              <Input
                type="date"
                value={form.endYmd}
                onChange={(e) => setForm((f) => ({ ...f, endYmd: e.target.value }))}
                onKeyDown={handleKeyDown}
                className="text-sm"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="relative flex-1 sm:flex-none">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPicker((v) => !v)}
                className="w-full sm:w-auto shrink-0"
                title="기간 빠른 선택"
              >
                <CalendarRange className="w-4 h-4 mr-2 sm:mr-0" />
                <span className="sm:hidden text-xs">기간 빠른 선택</span>
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
            <Button
              variant="outline"
              size="sm"
              onClick={() => setForm((f) => ({ ...f, sort: f.sort === 'desc' ? 'asc' : 'desc' }))}
              className="flex-1 sm:w-auto shrink-0 gap-1.5"
              title={form.sort === 'desc' ? '최신순' : '오래된순'}
            >
              <ArrowDownUp className="w-3.5 h-3.5" />
              <span className="text-xs">{form.sort === 'desc' ? '최신순' : '오래된순'}</span>
            </Button>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 flex-1 min-w-0">
            <label className="text-xs text-gray-500 shrink-0 sm:hidden">검색어</label>
            <Input
              type="text"
              placeholder="내용 또는 제목 검색"
              value={form.keyword}
              onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="text-sm w-full"
            />
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSearch} className="flex-1 sm:flex-none shrink-0">
              <Search className="w-4 h-4 mr-1" /> 찾기
            </Button>
            <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none shrink-0">
              초기화
            </Button>
          </div>
        </div>

        {/* 결과 */}
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>
        ) : (
          <>
            <div className="text-xs text-gray-400 mb-2 px-1">
              총 {formatCount(data?.total) ?? 0}건
            </div>
            <ul className="flex flex-col gap-2">
              {data?.dtoList?.length === 0 && (
                <li className="text-sm text-gray-400 text-center py-10">검색 결과가 없습니다.</li>
              )}
              {data?.dtoList?.map((item) => (
                <DiaryItem key={item.id} item={item} />
              ))}
            </ul>

            {/* 페이징 */}
            {totalPages > 1 && (
              <div className="flex justify-center gap-1 mt-6">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setSearchParams((p) => { p.set('page', String(page - 1)); return p })}
                >
                  이전
                </Button>
                <span className="px-3 py-1 text-sm text-gray-600 flex items-center">
                  {page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= totalPages}
                  onClick={() => setSearchParams((p) => { p.set('page', String(page + 1)); return p })}
                >
                  다음
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
