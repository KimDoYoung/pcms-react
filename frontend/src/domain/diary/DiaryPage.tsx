import { useState, useEffect, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Search, ChevronDown, ChevronUp, Pencil, Eye, CalendarRange, ArrowDownUp, CircleArrowRight, CircleArrowLeft, RefreshCw, FileCode, FileDown, Loader2 } from 'lucide-react'
import { formatCount, formatDate, formatYmd } from '@/lib/utils'
import { format, subDays } from 'date-fns'
import type { DiaryListDto, DiaryPageResponse } from '@/domain/diary/types/diary'
import {  DateRangeSetter } from '@/shared/components/DateRangeSetter'
import { MyDatePicker } from '@/shared/components/MyDatePicker'
import { useMessage } from '@/shared/hooks/useMessage'
import { exportDiaryToHtml, exportDiaryToPdf } from '@/lib/diaryExporter'

const PAGE_SIZE = 10

interface DiaryItemProps {
  item: DiaryListDto
  expanded: boolean
  isHovered: boolean
  onToggle: () => void
  onMouseEnter: () => void
  onMouseLeave: () => void
}

function DiaryItem({ item, expanded, isHovered, onToggle, onMouseEnter, onMouseLeave }: DiaryItemProps) {
  const navigate = useNavigate()
  const ymd = item.ymd
  const displayDate = `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`

  return (
    <li
      className={`border rounded-lg bg-white shadow-sm overflow-hidden transition-colors ${isHovered ? 'border-blue-200' : 'border-gray-200'}`}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={onToggle}
      >
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="shrink-0 text-sm font-semibold text-blue-400 sm:w-36">
            {formatDate(displayDate)}
          </span>
          <div className="flex items-center gap-0.5 sm:hidden">
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/diary/${item.id}`) }}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Eye className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); navigate(`/diary/register?date=${displayDate}`) }}
              className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onToggle() }}
              className={`p-1.5 rounded-full transition-colors ${expanded ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            >
              {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
        <span
          className="flex-1 text-sm font-medium sm:font-normal text-gray-800 truncate hover:text-blue-600 hover:underline cursor-pointer"
          onClick={(e) => { e.stopPropagation(); navigate(`/diary/${item.id}`) }}
        >
          {item.summary ?? <span className="text-gray-300 italic">제목 없음</span>}
        </span>
        <div className="hidden sm:flex items-center gap-1 shrink-0">
          {item.attachmentCount > 0 && (
            <span className="text-xs text-gray-400 mr-1">📎 {item.attachmentCount}</span>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/diary/${item.id}`) }}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="보기"
          >
            <Eye className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); navigate(`/diary/register?date=${displayDate}`) }}
            className="p-1.5 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            title="수정"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onToggle() }}
            className={`p-1.5 rounded-full transition-colors ${expanded ? 'bg-red-50 text-red-400 hover:bg-red-100' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'}`}
            title="펼치기"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
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

const today = format(new Date(), 'yyyyMMdd')
const defaultStartYmd = format(subDays(new Date(), 30), 'yyyyMMdd')

export default function DiaryPage() {
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? 1)
  const keyword = searchParams.get('keyword') ?? ''
  const startYmd = searchParams.get('startYmd') ?? defaultStartYmd
  const endYmd = searchParams.get('endYmd') ?? today
  const sort = (searchParams.get('sort') ?? 'asc') as 'asc' | 'desc'

  const [form, setForm] = useState({ startYmd, endYmd, keyword, sort })
  const [showPicker, setShowPicker] = useState(false)
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set())
  const [hoveredId, setHoveredId] = useState<number | null>(null)
  const [isExportingHtml, setIsExportingHtml] = useState(false)
  const [isExportingPdf, setIsExportingPdf]   = useState(false)
  const { showMessage } = useMessage()
  const hoveredIdRef = useRef<number | null>(null)
  hoveredIdRef.current = hoveredId

  function toggleExpanded(id: number) {
    setExpandedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.code !== 'Space' || hoveredIdRef.current === null) return
      const tag = (e.target as HTMLElement).tagName
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return
      e.preventDefault()
      setExpandedIds(prev => {
        const next = new Set(prev)
        const id = hoveredIdRef.current!
        if (next.has(id)) next.delete(id)
        else next.add(id)
        return next
      })
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

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
    setForm({ startYmd: defaultStartYmd, endYmd: today, keyword: '', sort: 'asc' })
    setSearchParams({})
  }

  async function handleExportHtml() {
    setIsExportingHtml(true)
    try {
      const params: Record<string, string | number> = { size: 100, page: 1, sort }
      if (startYmd) params.startYmd = formatYmd(startYmd)
      if (endYmd)   params.endYmd   = formatYmd(endYmd)
      if (keyword)  params.keyword  = keyword
      const res = await apiClient.get<DiaryPageResponse>('/diary', { params })
      await exportDiaryToHtml(res.dtoList, { startYmd, endYmd, keyword, total: res.total })
      showMessage('HTML 저장이 완료되었습니다.', 'success')
    } catch {
      showMessage('HTML 저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsExportingHtml(false)
    }
  }

  async function handleExportPdf() {
    setIsExportingPdf(true)
    try {
      const params: Record<string, string | number> = { size: 100, page: 1, sort }
      if (startYmd) params.startYmd = formatYmd(startYmd)
      if (endYmd)   params.endYmd   = formatYmd(endYmd)
      if (keyword)  params.keyword  = keyword
      const res = await apiClient.get<DiaryPageResponse>('/diary', { params })
      await exportDiaryToPdf(res.dtoList, { startYmd, endYmd, keyword, total: res.total })
      showMessage('PDF 저장이 완료되었습니다.', 'success')
    } catch {
      showMessage('PDF 저장 중 오류가 발생했습니다.', 'error')
    } finally {
      setIsExportingPdf(false)
    }
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
              <MyDatePicker
                value={form.startYmd}
                onChange={(val) => setForm((f) => ({ ...f, startYmd: val }))}
                onKeyDown={handleKeyDown}
                className="text-sm w-full sm:w-36"
                placeholder="시작일"
              />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
              <label className="text-xs text-gray-500 shrink-0">종료일</label>
              <MyDatePicker
                value={form.endYmd}
                onChange={(val) => setForm((f) => ({ ...f, endYmd: val }))}
                onKeyDown={handleKeyDown}
                className="text-sm w-full sm:w-36"
                placeholder="종료일"
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
            <Button onClick={handleSearch} variant="action" size="pill">
              <Search className="w-4 h-4 mr-1" /> 찾기
            </Button>
            <Button variant="cancel" size="pill" onClick={handleReset} className="flex-1 sm:flex-none shrink-0">
              <RefreshCw />
              초기화
            </Button>
            {data?.total != null && data.total > 0 && data.total <= 100 && (
              <>
                <Button variant="outline" size="pill" onClick={handleExportHtml} disabled={isExportingHtml} title="전체 결과를 HTML 파일로 저장">
                  {isExportingHtml ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileCode className="w-3.5 h-3.5" />}
                  HTML저장
                </Button>
                <Button variant="outline" size="pill" onClick={handleExportPdf} disabled={isExportingPdf} title="전체 결과를 PDF 파일로 저장">
                  {isExportingPdf ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}
                  PDF저장
                </Button>
              </>
            )}
          </div>
        </div>

        {/* 결과 */}
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>
        ) : (
          <>
            <div className="text-xs text-gray-500 mb-2 px-1">
              총 {formatCount(data?.total) ?? 0}건
            </div>
            <ul className="flex flex-col gap-2">
              {data?.dtoList?.length === 0 && (
                <li className="text-sm text-gray-400 text-center py-10">검색 결과가 없습니다.</li>
              )}
              {data?.dtoList?.map((item) => (
                <DiaryItem
                  key={item.id}
                  item={item}
                  expanded={expandedIds.has(item.id)}
                  isHovered={hoveredId === item.id}
                  onToggle={() => toggleExpanded(item.id)}
                  onMouseEnter={() => setHoveredId(item.id)}
                  onMouseLeave={() => setHoveredId(null)}
                />
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
                <CircleArrowLeft/>
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
                  <CircleArrowRight/>
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  )
}
