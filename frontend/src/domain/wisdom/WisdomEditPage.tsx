/**
 * 1. 목적(용도):
 *    기존 격언(Wisdom) 데이터를 조회하여 내용을 수정하거나 삭제하는 페이지.
 *
 * 2. 사용법:
 *    React Router에 라우트로 연결하여 사용:
 *    <Route path="/wisdom/:id/edit" element={<WisdomEditPage />} />
 *
 * 3. props:
 *    없음 (페이지 컴포넌트)
 */
import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Quote, Tag, X, Plus, Clock } from 'lucide-react'
import { useMessage } from '@/shared/hooks/useMessage'
import ButtonsOfEdit from '@/shared/components/ButtonsOfEdit'
import { formatDate } from '@/lib/utils'
import {
  DEFAULT_DOMAINS,
  DEFAULT_CATEGORIES,
  type Wisdom,
} from '@/domain/wisdom/types/wisdom'

export default function WisdomEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    domain: '',
    document: '',
    category: '',
    authorSource: '',
    contextTrigger: '',
  })

  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  // 데이터 조회
  const { data, isLoading, isError } = useQuery<Wisdom>({
    queryKey: ['wisdom-detail', id],
    queryFn: () => apiClient.get<Wisdom>(`/wisdom/${encodeURIComponent(id!)}`),
    enabled: !!id,
  })

  // 폼 초기화
  useEffect(() => {
    if (data) {
      setForm({
        domain: data.domain || 'LIFE',
        document: data.document || '',
        category: data.category || '',
        authorSource: data.authorSource || '',
        contextTrigger: data.contextTrigger || '',
      })
      setKeywords(data.keywords || [])
    }
  }, [data])

  // 키워드 태그 추가
  function handleAddKeyword() {
    const trimmed = keywordInput.trim().replace(/^#/, '')
    if (!trimmed) return
    if (keywords.includes(trimmed)) {
      showMessage('이미 추가된 키워드입니다.', 'warning')
      setKeywordInput('')
      return
    }
    setKeywords([...keywords, trimmed])
    setKeywordInput('')
  }

  // 키워드 태그 삭제
  function handleRemoveKeyword(index: number) {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  // 수정 저장
  async function handleSave() {
    if (!id) return
    if (!form.domain.trim()) {
      showMessage('도메인을 선택하거나 입력해주세요.', 'error')
      return
    }
    if (!form.category.trim()) {
      showMessage('카테고리를 선택하거나 입력해주세요.', 'error')
      return
    }
    if (!form.document.trim()) {
      showMessage('격언 본문을 입력해주세요.', 'error')
      return
    }

    setSaving(true)
    try {
      await apiClient.put(`/wisdom/${encodeURIComponent(id)}`, {
        id,
        domain: form.domain.trim(),
        category: form.category.trim(),
        document: form.document.trim(),
        authorSource: form.authorSource.trim() || null,
        contextTrigger: form.contextTrigger.trim() || null,
        keywords: keywords.length > 0 ? keywords : null,
      })
      showMessage('격언이 성공적으로 수정되었습니다.', 'info')
      queryClient.invalidateQueries({ queryKey: ['wisdom-list'] })
      queryClient.invalidateQueries({ queryKey: ['wisdom-detail', id] })
      navigate('/wisdom')
    } catch {
      showMessage('격언 수정 중 오류가 발생했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  // 삭제 처리
  async function handleDelete() {
    if (!id) return
    if (!confirm(`격언 [${id}]을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/wisdom/${encodeURIComponent(id)}`)
      showMessage('격언이 삭제되었습니다.', 'info')
      queryClient.invalidateQueries({ queryKey: ['wisdom-list'] })
      navigate('/wisdom')
    } catch {
      showMessage('삭제 중 오류가 발생했습니다.', 'error')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <main className="container mx-auto px-4 py-6 text-center text-gray-400">
          데이터를 불러오는 중입니다...
        </main>
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <main className="container mx-auto px-4 py-6 text-center text-red-500">
          격언 정보를 찾을 수 없습니다.
          <div className="mt-4">
            <Button variant="outline" onClick={() => navigate('/wisdom')}>
              목록으로 돌아가기
            </Button>
          </div>
        </main>
      </div>
    )
  }

  const categoryPresets = DEFAULT_CATEGORIES[form.domain] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* 헤더 */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
              <Quote className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">격언 수정</h1>
              <p className="text-xs text-gray-500">
                격언 ID: <span className="font-mono font-semibold text-gray-700">{id}</span>
              </p>
            </div>
          </div>
          {data.lastModifiedAt && (
            <div className="text-xs text-gray-400 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              최종 수정: {formatDate(data.lastModifiedAt, true, true, false, true)}
            </div>
          )}
        </div>

        {/* 폼 카드 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 space-y-6">
          {/* 1. 도메인 (Domain) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              도메인 (Domain) <span className="text-red-500">*</span>
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {DEFAULT_DOMAINS.map((d) => (
                <button
                  type="button"
                  key={d.value}
                  onClick={() =>
                    setForm((f) => ({
                      ...f,
                      domain: d.value,
                      category: DEFAULT_CATEGORIES[d.value]?.[0]?.value || f.category,
                    }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                    form.domain === d.value
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm'
                      : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <Input
              placeholder="직접 입력할 경우 도메인명 입력 (예: TECH, PHILOSOPHY)"
              value={form.domain}
              onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
              className="text-sm"
            />
          </div>

          {/* 2. 카테고리 (Category) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              카테고리 (Category) <span className="text-red-500">*</span>
            </label>
            {categoryPresets.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-2">
                {categoryPresets.map((c) => (
                  <button
                    type="button"
                    key={c.value}
                    onClick={() => setForm((f) => ({ ...f, category: c.value }))}
                    className={`px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                      form.category === c.value
                        ? 'bg-emerald-600 text-white border-emerald-600'
                        : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            )}
            <Input
              placeholder="카테고리 코드 또는 이름 (예: MINDSET, COMMUNICATION)"
              value={form.category}
              onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
              className="text-sm"
            />
          </div>

          {/* 3. 본문 (Document) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              격언 / 명언 본문 <span className="text-red-500">*</span>
            </label>
            <Textarea
              placeholder="격언 또는 명언 본문을 입력하세요."
              rows={4}
              value={form.document}
              onChange={(e) => setForm((f) => ({ ...f, document: e.target.value }))}
              className="text-base font-serif"
            />
          </div>

          {/* 4. 출처 / 작성자 (Author Source) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              출처 / 작성자 / 인물
            </label>
            <Input
              placeholder="예: 앙드레 코스톨라니, 채근담, 헬렌 켈러, 한국 증시 격언"
              value={form.authorSource}
              onChange={(e) =>
                setForm((f) => ({ ...f, authorSource: e.target.value }))
              }
              className="text-sm"
            />
          </div>

          {/* 5. 상황 / 감정 트리거 (Context Trigger) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              상황 / 감정 트리거 (Context Trigger)
            </label>
            <Input
              placeholder="예: burnout, lethargy, overtrading, bear_market (쉼표로 구분)"
              value={form.contextTrigger}
              onChange={(e) =>
                setForm((f) => ({ ...f, contextTrigger: e.target.value }))
              }
              className="text-sm font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">
              KimsWeb의 LLM 대화 상태 및 감정 분석 조건과 매칭되는 태그 문자열입니다.
            </p>
          </div>

          {/* 6. 키워드 태그 (Keywords) */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              키워드 태그 (Keywords)
            </label>
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
                <Input
                  placeholder="키워드 입력 후 Enter 또는 추가 버튼 클릭"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault()
                      handleAddKeyword()
                    }
                  }}
                  className="pl-9 text-sm"
                />
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddKeyword}
                className="shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                추가
              </Button>
            </div>

            {keywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2 bg-gray-50 rounded-lg border border-gray-200">
                {keywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 bg-white px-2.5 py-1 rounded-md text-xs font-medium text-gray-700 border border-gray-300 shadow-2xs"
                  >
                    #{kw}
                    <button
                      type="button"
                      onClick={() => handleRemoveKeyword(idx)}
                      className="text-gray-400 hover:text-red-500"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* 하단 액션 버튼 */}
          <ButtonsOfEdit
            onDelete={handleDelete}
            onCancel={() => navigate('/wisdom')}
            onSave={handleSave}
            saving={saving}
            saveDisabled={
              saving ||
              !form.domain.trim() ||
              !form.category.trim() ||
              !form.document.trim()
            }
          />
        </div>
      </main>
    </div>
  )
}
