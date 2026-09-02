/**
 * 1. 목적(용도):
 *    기존 격언(Wisdom) 데이터를 조회하여 내용을 수정하거나 삭제하는 페이지.
 *    useTabParams로 탭 라우팅 파라미터를 안전하게 읽고,
 *    키워드 콤마(,) 구분 입력 및 상황 트리거 체크박스 양방향 동기화를 지원함.
 *
 * 2. 사용법:
 *    React Router에 라우트로 연결하여 사용:
 *    <Route path="/wisdom/:id/edit" element={<WisdomEditPage />} />
 *
 * 3. props:
 *    없음 (페이지 컴포넌트)
 */
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useTabParams } from '@/shared/layout/useTabParams'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { Quote, Tag, Zap, Check, Clock } from 'lucide-react'
import { useMessage } from '@/shared/hooks/useMessage'
import ButtonsOfEdit from '@/shared/components/ButtonsOfEdit'
import { formatDate } from '@/lib/utils'
import {
  DEFAULT_DOMAINS,
  DEFAULT_CATEGORIES,
  CONTEXT_TRIGGER_PRESETS,
  type Wisdom,
} from '@/domain/wisdom/types/wisdom'

export default function WisdomEditPage() {
  const { id } = useTabParams<{ id: string }>()
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

  // 키워드 콤마 구분 문자열
  const [keywordText, setKeywordText] = useState('')

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
      setKeywordText(data.keywords && data.keywords.length > 0 ? data.keywords.join(', ') : '')
    }
  }, [data])

  // 키워드 문자열을 분해/trim하여 배열로 반환
  const parsedKeywords = keywordText
    .split(',')
    .map((k) => k.trim().replace(/^#/, ''))
    .filter(Boolean)

  // 현재 입력된 contextTrigger 문자열을 분해/trim하여 배열로 반환
  const currentTriggers = form.contextTrigger
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean)

  // 트리거 체크박스 토글 (체크 시 추가, 해제 시 제거 및 문자열 재조립)
  function handleTriggerToggle(triggerValue: string) {
    let nextTriggers: string[]
    if (currentTriggers.includes(triggerValue)) {
      nextTriggers = currentTriggers.filter((t) => t !== triggerValue)
    } else {
      nextTriggers = [...currentTriggers, triggerValue]
    }
    setForm((f) => ({
      ...f,
      contextTrigger: nextTriggers.join(', '),
    }))
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
        keywords: parsedKeywords.length > 0 ? parsedKeywords : null,
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
          격언 정보를 찾을 수 없습니다. (ID: {id ?? '없음'})
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
  const triggerPresets = CONTEXT_TRIGGER_PRESETS.filter(
    (t) => t.group === form.domain.toUpperCase()
  )

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

          {/* 5. 상황 / 감정 트리거 (Context Trigger) - 체크박스 + 타이핑 */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                상황 / 감정 트리거 (Context Trigger)
              </label>
              <span className="text-xs text-gray-400">
                체크박스 선택 또는 직접 입력
              </span>
            </div>

            {/* 도메인에 해당하는 추천 트리거 체크박스 목록 */}
            {triggerPresets.length > 0 && (
              <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 mb-2">
                <div className="text-xs font-semibold text-gray-500 mb-2 flex items-center gap-1">
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  {form.domain} 추천 트리거 태그 (클릭 시 토글):
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {triggerPresets.map((t) => {
                    const isChecked = currentTriggers.includes(t.value)
                    return (
                      <button
                        type="button"
                        key={t.value}
                        onClick={() => handleTriggerToggle(t.value)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
                          isChecked
                            ? 'bg-amber-600 text-white border-amber-600 shadow-2xs'
                            : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                        }`}
                      >
                        {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        <span>{t.label}</span>
                        <span
                          className={`text-[10px] font-mono ${
                            isChecked ? 'text-amber-100' : 'text-gray-400'
                          }`}
                        >
                          ({t.value})
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )}

            {/* 트리거 직접 입력창 */}
            <Input
              placeholder="예: burnout, lethargy, overtrading (콤마로 구분)"
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

          {/* 6. 키워드 태그 (Keywords) - 콤마(,) 구분 입력 */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1.5">
              키워드 태그 (Keywords)
            </label>
            <div className="relative mb-2">
              <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <Input
                placeholder="콤마(,)로 구분하여 입력 (예: 말조심, 근신, 구화지문, 침묵)"
                value={keywordText}
                onChange={(e) => setKeywordText(e.target.value)}
                className="pl-9 text-sm"
              />
            </div>

            {/* 분해된 태그 실시간 미리보기 */}
            {parsedKeywords.length > 0 && (
              <div className="flex flex-wrap gap-1.5 p-2.5 bg-gray-50 rounded-lg border border-gray-200">
                <span className="text-xs text-gray-400 mr-1 self-center">
                  등록될 태그:
                </span>
                {parsedKeywords.map((kw, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center bg-white px-2 py-0.5 rounded text-xs font-medium text-gray-700 border border-gray-300 shadow-2xs"
                  >
                    #{kw}
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
