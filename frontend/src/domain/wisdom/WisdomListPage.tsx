/**
 * 1. 목적(용도):
 *    격언(Wisdom) 목록을 조회하고 도메인/카테고리/키워드별로 검색하며,
 *    등록, 수정, 삭제 및 랜덤 추천(KimsWeb 연계 테스트) 기능을 제공하는 관리 페이지.
 *
 * 2. 사용법:
 *    React Router에 라우트로 연결하여 사용:
 *    <Route path="/wisdom" element={<WisdomListPage />} />
 *
 * 3. props:
 *    없음 (페이지 컴포넌트)
 */
import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/shared/components/ui/dialog'
import {
  Search,
  Plus,
  Pencil,
  Trash2,
  Quote,
  Sparkles,
  Copy,
  Check,
  Tag,
  Zap,
  BookOpen,
} from 'lucide-react'
import { formatDate, copyTextToClipboard } from '@/lib/utils'
import { useMessage } from '@/shared/hooks/useMessage'
import type {
  Wisdom,
  WisdomPageResponse,
} from '@/domain/wisdom/types/wisdom'

const PAGE_SIZE = 12

export default function WisdomListPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()
  const [searchParams, setSearchParams] = useSearchParams()

  const page = Number(searchParams.get('page') ?? 1)
  const domain = searchParams.get('domain') ?? ''
  const category = searchParams.get('category') ?? ''
  const keyword = searchParams.get('keyword') ?? ''

  // 로컬 검색 입력 상태
  const [searchForm, setSearchForm] = useState({ domain, category, keyword })
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 랜덤 격언 모달 상태
  const [randomModalOpen, setRandomModalOpen] = useState(false)
  const [randomWisdom, setRandomWisdom] = useState<Wisdom | null>(null)
  const [randomLoading, setRandomLoading] = useState(false)

  // 도메인 목록 조회
  const { data: domains = [] } = useQuery<string[]>({
    queryKey: ['wisdom-domains'],
    queryFn: () => apiClient.get<string[]>('/wisdom/domains'),
  })

  // 카테고리 목록 조회
  const { data: categories = [] } = useQuery<string[]>({
    queryKey: ['wisdom-categories', searchForm.domain],
    queryFn: () =>
      apiClient.get<string[]>('/wisdom/categories', {
        params: searchForm.domain ? { domain: searchForm.domain } : undefined,
      }),
  })

  // 격언 목록 조회
  const { data, isLoading } = useQuery<WisdomPageResponse>({
    queryKey: ['wisdom-list', { domain, category, keyword, page }],
    queryFn: () => {
      const params: Record<string, string | number> = { size: PAGE_SIZE, page }
      if (domain) params.domain = domain
      if (category) params.category = category
      if (keyword) params.keyword = keyword
      return apiClient.get<WisdomPageResponse>('/wisdom', { params })
    },
  })

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 0

  function handleSearch() {
    setSearchParams((p) => {
      p.set('page', '1')
      if (searchForm.domain) p.set('domain', searchForm.domain)
      else p.delete('domain')

      if (searchForm.category) p.set('category', searchForm.category)
      else p.delete('category')

      if (searchForm.keyword) p.set('keyword', searchForm.keyword)
      else p.delete('keyword')

      return p
    })
  }

  function handleReset() {
    setSearchForm({ domain: '', category: '', keyword: '' })
    setSearchParams({})
  }

  async function handleDelete(id: string) {
    if (!confirm(`격언 [${id}]을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/wisdom/${encodeURIComponent(id)}`)
      showMessage('격언이 삭제되었습니다.', 'info')
      queryClient.invalidateQueries({ queryKey: ['wisdom-list'] })
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  async function handleCopy(item: Wisdom) {
    const text = `"${item.document}" - ${item.authorSource || '출처미상'}`
    try {
      await copyTextToClipboard(text)
      setCopiedId(item.id)
      showMessage('클립보드에 복사되었습니다.', 'info')
      setTimeout(() => setCopiedId(null), 2000)
    } catch {
      showMessage('클립보드 복사에 실패했습니다.', 'error')
    }
  }

  async function handleFetchRandom() {
    setRandomLoading(true)
    setRandomModalOpen(true)
    try {
      const params: Record<string, string> = {}
      if (searchForm.domain) params.domain = searchForm.domain
      if (searchForm.category) params.category = searchForm.category
      const res = await apiClient.get<Wisdom>('/wisdom/random', { params })
      setRandomWisdom(res || null)
    } catch {
      showMessage('랜덤 격언을 불러오는 중 오류가 발생했습니다.', 'error')
    } finally {
      setRandomLoading(false)
    }
  }

  function getDomainBadgeColor(dom: string) {
    switch (dom?.toUpperCase()) {
      case 'STOCK':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'LIFE':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200'
      default:
        return 'bg-purple-100 text-purple-800 border-purple-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        {/* 헤더 */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Quote className="w-7 h-7 text-indigo-600" />
            <div>
              <h1 className="text-2xl font-bold text-gray-900">격언 관리</h1>
              <p className="text-xs text-gray-500">
                KimsWeb LLM 프롬프트 및 시스템용 격언/명언 데이터베이스
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchRandom}
              className="text-indigo-600 border-indigo-200 hover:bg-indigo-50"
            >
              <Sparkles className="w-4 h-4 mr-1.5" />
              랜덤 격언
            </Button>
            <Button
              variant="action"
              size="sm"
              onClick={() => navigate('/wisdom/register')}
            >
              <Plus className="w-4 h-4 mr-1.5" />
              격언 등록
            </Button>
          </div>
        </div>

        {/* 검색 필터 바 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
            {/* 도메인 선택 */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                도메인 (Domain)
              </label>
              <select
                aria-label="도메인 선택"
                value={searchForm.domain}
                onChange={(e) =>
                  setSearchForm((f) => ({
                    ...f,
                    domain: e.target.value,
                    category: '',
                  }))
                }
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">전체 도메인</option>
                {domains.map((dom) => (
                  <option key={dom} value={dom}>
                    {dom}
                  </option>
                ))}
              </select>
            </div>

            {/* 카테고리 선택 */}
            <div className="md:col-span-3">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                카테고리 (Category)
              </label>
              <select
                aria-label="카테고리 선택"
                value={searchForm.category}
                onChange={(e) =>
                  setSearchForm((f) => ({ ...f, category: e.target.value }))
                }
                className="w-full h-9 px-3 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">전체 카테고리</option>
                {categories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* 통합 검색어 */}
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-gray-600 mb-1">
                검색어 (본문, 출처, 키워드, ID, 트리거)
              </label>
              <Input
                placeholder="검색어를 입력하세요"
                value={searchForm.keyword}
                onChange={(e) =>
                  setSearchForm((f) => ({ ...f, keyword: e.target.value }))
                }
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="text-sm h-9"
              />
            </div>

            {/* 버튼들 */}
            <div className="md:col-span-2 flex gap-2">
              <Button
                variant="action"
                size="sm"
                onClick={handleSearch}
                className="flex-1 h-9"
              >
                <Search className="w-4 h-4 mr-1" />
                찾기
              </Button>
              <Button
                variant="init"
                size="sm"
                onClick={handleReset}
                className="h-9"
              >
                초기화
              </Button>
            </div>
          </div>
        </div>

        {/* 결과 요약 */}
        <div className="flex items-center justify-between text-xs text-gray-500 mb-4 px-1">
          <span>
            총 <strong className="text-gray-900">{data?.total ?? 0}</strong>건의
            격언
          </span>
          {domain && (
            <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
              필터: {domain} {category ? `> ${category}` : ''}
            </span>
          )}
        </div>

        {/* 목록 카드 그리드 */}
        {isLoading ? (
          <div className="text-center py-20 text-gray-400">
            데이터를 불러오는 중입니다...
          </div>
        ) : !data || data.dtoList.length === 0 ? (
          <div className="bg-white rounded-xl border border-dashed border-gray-300 text-center py-16 px-4">
            <BookOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">등록된 격언이 없습니다.</p>
            <p className="text-xs text-gray-400 mt-1">
              새로운 격언을 등록하거나 검색 조건을 변경해보세요.
            </p>
            <Button
              variant="action"
              size="sm"
              onClick={() => navigate('/wisdom/register')}
              className="mt-4"
            >
              <Plus className="w-4 h-4 mr-1" /> 첫 격언 등록하기
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.dtoList.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow p-5 flex flex-col justify-between"
              >
                {/* 상단 뱃지 & ID & 액션 */}
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getDomainBadgeColor(
                          item.domain
                        )}`}
                      >
                        {item.domain}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                        {item.category}
                      </span>
                      <span className="text-xs font-mono text-gray-400">
                        #{item.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        title="복사"
                        onClick={() => handleCopy(item)}
                        className="p-1 text-gray-400 hover:text-indigo-600 rounded transition-colors"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        title="수정"
                        onClick={() =>
                          navigate(`/wisdom/${encodeURIComponent(item.id)}/edit`)
                        }
                        className="p-1 text-gray-400 hover:text-blue-600 rounded transition-colors"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        title="삭제"
                        onClick={() => handleDelete(item.id)}
                        className="p-1 text-gray-400 hover:text-red-600 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* 본문 */}
                  <div className="my-3">
                    <p className="text-gray-800 text-base leading-relaxed font-serif whitespace-pre-wrap">
                      "{item.document}"
                    </p>
                  </div>

                  {/* 출처 / 작성자 */}
                  {item.authorSource && (
                    <p className="text-xs text-gray-500 font-medium text-right mb-3">
                      — {item.authorSource}
                    </p>
                  )}
                </div>

                {/* 하단 메타정보: 트리거, 키워드, 수정일 */}
                <div className="pt-3 border-t border-gray-100 space-y-2 text-xs">
                  {/* 트리거 */}
                  {item.contextTrigger && (
                    <div className="flex items-center gap-1 text-amber-700 bg-amber-50 px-2 py-1 rounded">
                      <Zap className="w-3.5 h-3.5 shrink-0" />
                      <span className="truncate font-mono">
                        {item.contextTrigger}
                      </span>
                    </div>
                  )}

                  {/* 키워드 태그들 */}
                  {item.keywords && item.keywords.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <Tag className="w-3 h-3 text-gray-400 mr-0.5" />
                      {item.keywords.map((kw, idx) => (
                        <span
                          key={idx}
                          className="bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded text-[11px]"
                        >
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* 수정 시각 */}
                  <div className="text-[11px] text-gray-400 text-right">
                    {formatDate(item.lastModifiedAt ?? undefined, true, true, false, true)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 페이지네이션 */}
        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() =>
                setSearchParams((p) => {
                  p.set('page', String(page - 1))
                  return p
                })
              }
            >
              이전
            </Button>
            <div className="flex items-center gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(
                  (p) =>
                    p === 1 ||
                    p === totalPages ||
                    Math.abs(p - page) <= 2
                )
                .map((p, idx, arr) => {
                  const showEllipsis = idx > 0 && p - arr[idx - 1] > 1
                  return (
                    <span key={p} className="flex items-center">
                      {showEllipsis && (
                        <span className="px-1 text-gray-400 text-xs">...</span>
                      )}
                      <Button
                        variant={page === p ? 'action' : 'outline'}
                        size="sm"
                        className="w-8 h-8 p-0 text-xs"
                        onClick={() =>
                          setSearchParams((prev) => {
                            prev.set('page', String(p))
                            return prev
                          })
                        }
                      >
                        {p}
                      </Button>
                    </span>
                  )
                })}
            </div>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() =>
                setSearchParams((p) => {
                  p.set('page', String(page + 1))
                  return p
                })
              }
            >
              다음
            </Button>
          </div>
        )}
      </main>

      {/* 🎲 랜덤 격언 모달 (KimsWeb 연계 확인용) */}
      <Dialog open={randomModalOpen} onOpenChange={setRandomModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-indigo-700">
              <Sparkles className="w-5 h-5 text-indigo-600" />
              오늘의 랜덤 격언 (KimsWeb 연계)
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              현재 필터 조건에 맞춰 무작위로 선택된 격언입니다.
            </DialogDescription>
          </DialogHeader>

          {randomLoading ? (
            <div className="py-10 text-center text-sm text-gray-400">
              랜덤 격언을 불러오는 중...
            </div>
          ) : randomWisdom ? (
            <div className="space-y-4 py-2">
              <div className="flex items-center gap-2">
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-semibold border ${getDomainBadgeColor(
                    randomWisdom.domain
                  )}`}
                >
                  {randomWisdom.domain}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-700 font-medium">
                  {randomWisdom.category}
                </span>
                <span className="text-xs font-mono text-gray-400">
                  #{randomWisdom.id}
                </span>
              </div>

              <div className="p-4 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <p className="text-gray-900 text-lg font-serif leading-relaxed mb-3">
                  "{randomWisdom.document}"
                </p>
                {randomWisdom.authorSource && (
                  <p className="text-sm font-semibold text-indigo-800 text-right">
                    — {randomWisdom.authorSource}
                  </p>
                )}
              </div>

              {randomWisdom.contextTrigger && (
                <div className="text-xs text-gray-600 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-amber-600" />
                  <span>트리거: </span>
                  <span className="font-mono bg-amber-50 text-amber-800 px-2 py-0.5 rounded">
                    {randomWisdom.contextTrigger}
                  </span>
                </div>
              )}

              {randomWisdom.keywords && randomWisdom.keywords.length > 0 && (
                <div className="flex flex-wrap gap-1 text-xs">
                  {randomWisdom.keywords.map((kw, idx) => (
                    <span
                      key={idx}
                      className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded"
                    >
                      #{kw}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="py-8 text-center text-sm text-gray-400">
              조건에 맞는 격언이 없습니다.
            </div>
          )}

          <div className="flex justify-between items-center mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={handleFetchRandom}
              disabled={randomLoading}
            >
              <Sparkles className="w-3.5 h-3.5 mr-1" />
              다시 뽑기
            </Button>
            <div className="flex gap-2">
              {randomWisdom && (
                <Button
                  variant="action"
                  size="sm"
                  onClick={() => handleCopy(randomWisdom)}
                >
                  <Copy className="w-3.5 h-3.5 mr-1" /> 복사
                </Button>
              )}
              <Button
                variant="cancel"
                size="sm"
                onClick={() => setRandomModalOpen(false)}
              >
                닫기
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
