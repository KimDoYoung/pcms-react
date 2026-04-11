import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/components/Toolbar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search, ChevronDown, ChevronUp, Pencil, Eye } from 'lucide-react'
import { formatDate } from '@/lib/utils'

interface DiaryDto {
  id: number
  ymd: string
  summary: string | null
  content: string | null
  attachmentCount: number
}

interface PageResponse {
  dtoList: DiaryDto[]
  total: number
  page: number
  size: number
}

interface SearchParams {
  startYmd: string
  endYmd: string
  keyword: string
  page: number
}

const PAGE_SIZE = 14

function DiaryItem({ item }: { item: DiaryDto }) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const ymd = item.ymd  // yyyymmdd
  const displayDate = `${ymd.slice(0,4)}-${ymd.slice(4,6)}-${ymd.slice(6,8)}`

  return (
    <li className="border border-gray-200 rounded-lg bg-white shadow-sm overflow-hidden">
      <div
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-gray-50 transition-colors"
        onClick={() => setExpanded((v) => !v)}
      >
        <span className="shrink-0 text-xs font-mono text-gray-400 w-36">
          {formatDate(displayDate)}
        </span>
        <span className="flex-1 text-sm text-gray-800 truncate">
          {item.summary ?? <span className="text-gray-300 italic">제목 없음</span>}
        </span>
        <div className="flex items-center gap-2 shrink-0">
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
          className="px-4 py-4 border-t border-gray-100 prose prose-sm max-w-none text-gray-700"
          dangerouslySetInnerHTML={{ __html: item.content ?? '' }}
        />
      )}
    </li>
  )
}

function DiaryPage() {
  const [form, setForm] = useState({ startYmd: '', endYmd: '', keyword: '' })
  const [search, setSearch] = useState<SearchParams>({ startYmd: '', endYmd: '', keyword: '', page: 1 })

  const { data, isLoading } = useQuery<PageResponse>({
    queryKey: ['diary-list', search],
    queryFn: () => {
      const params: Record<string, string | number> = { size: PAGE_SIZE, page: search.page }
      if (search.startYmd) params.startYmd = search.startYmd.replace(/-/g, '')
      if (search.endYmd)   params.endYmd   = search.endYmd.replace(/-/g, '')
      if (search.keyword)  params.keyword  = search.keyword
      return apiClient.get<PageResponse>('/diary', { params })
    },
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleSearch() {
    setSearch({ ...form, page: 1 })
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
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 mb-4 flex flex-wrap gap-3 items-end">
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">시작일</label>
            <Input
              type="date"
              value={form.startYmd}
              onChange={(e) => setForm((f) => ({ ...f, startYmd: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-38 text-sm"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-gray-500 shrink-0">종료일</label>
            <Input
              type="date"
              value={form.endYmd}
              onChange={(e) => setForm((f) => ({ ...f, endYmd: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="w-38 text-sm"
            />
          </div>
          <div className="flex items-center gap-2 flex-1 min-w-40">
            <label className="text-xs text-gray-500 shrink-0">검색어</label>
            <Input
              type="text"
              placeholder="내용 또는 제목"
              value={form.keyword}
              onChange={(e) => setForm((f) => ({ ...f, keyword: e.target.value }))}
              onKeyDown={handleKeyDown}
              className="text-sm"
            />
          </div>
          <Button onClick={handleSearch} className="shrink-0">
            <Search className="w-4 h-4 mr-1" /> 검색
          </Button>
        </div>

        {/* 결과 */}
        {isLoading ? (
          <p className="text-sm text-gray-400 text-center py-10">불러오는 중...</p>
        ) : (
          <>
            <div className="text-xs text-gray-400 mb-2 px-1">
              총 {data?.total ?? 0}건
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
                  disabled={search.page <= 1}
                  onClick={() => setSearch((s) => ({ ...s, page: s.page - 1 }))}
                >
                  이전
                </Button>
                <span className="px-3 py-1 text-sm text-gray-600 flex items-center">
                  {search.page} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={search.page >= totalPages}
                  onClick={() => setSearch((s) => ({ ...s, page: s.page + 1 }))}
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

export default DiaryPage
