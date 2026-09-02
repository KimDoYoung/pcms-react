/**
 * 1. 목적(용도):
 *    새로운 격언(Wisdom) 데이터를 등록하는 페이지.
 *    ID 직접입력 및 자동채번, 도메인/카테고리 선택 및 직접입력,
 *    키워드 태그 관리 및 상황 트리거 설정을 지원함.
 *
 * 2. 사용법:
 *    React Router에 라우트로 연결하여 사용:
 *    <Route path="/wisdom/register" element={<WisdomRegisterPage />} />
 *
 * 3. props:
 *    없음 (페이지 컴포넌트)
 */
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/layout/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  Quote,
  Sparkles,
  CheckCircle2,
  XCircle,
  Tag,
  X,
  Plus,
} from 'lucide-react'
import { useMessage } from '@/shared/hooks/useMessage'
import ButtonsOfEdit from '@/shared/components/ButtonsOfEdit'
import {
  DEFAULT_DOMAINS,
  DEFAULT_CATEGORIES,
} from '@/domain/wisdom/types/wisdom'

export default function WisdomRegisterPage() {
  const navigate = useNavigate()
  const { showMessage } = useMessage()

  const [saving, setSaving] = useState(false)
  const [form, setForm] = useState({
    id: '',
    domain: 'LIFE',
    document: '',
    category: 'MOTIVATION',
    authorSource: '',
    contextTrigger: '',
  })

  const [keywords, setKeywords] = useState<string[]>([])
  const [keywordInput, setKeywordInput] = useState('')

  // ID 중복확인 상태
  const [idCheckStatus, setIdCheckStatus] = useState<
    'idle' | 'checking' | 'available' | 'duplicated'
  >('idle')

  // 도메인 변경 시 카테고리 기본값 세팅
  function handleDomainChange(newDomain: string) {
    const defaultCat = DEFAULT_CATEGORIES[newDomain]?.[0]?.value || ''
    setForm((f) => ({
      ...f,
      domain: newDomain,
      category: defaultCat,
    }))
  }

  // ID 자동생성
  function handleGenerateId() {
    let prefix = 'quote_'
    if (form.domain === 'STOCK') prefix = 'prv_'
    else if (form.domain && form.domain !== 'LIFE')
      prefix = form.domain.toLowerCase() + '_'

    const randomSuffix = Math.random().toString(36).substring(2, 7)
    const newId = `${prefix}${randomSuffix}`
    setForm((f) => ({ ...f, id: newId }))
    setIdCheckStatus('available')
  }

  // ID 중복확인
  async function handleCheckId() {
    if (!form.id.trim()) {
      showMessage('ID를 입력해주세요.', 'error')
      return
    }
    setIdCheckStatus('checking')
    try {
      const res = await apiClient.get<{ exists: boolean }>(
        `/wisdom/check-id/${encodeURIComponent(form.id.trim())}`
      )
      if (res.exists) {
        setIdCheckStatus('duplicated')
        showMessage('이미 사용 중인 ID입니다.', 'error')
      } else {
        setIdCheckStatus('available')
        showMessage('사용 가능한 ID입니다.', 'info')
      }
    } catch {
      setIdCheckStatus('idle')
      showMessage('ID 중복 확인 중 오류가 발생했습니다.', 'error')
    }
  }

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

  // 키워드 태그 제거
  function handleRemoveKeyword(index: number) {
    setKeywords(keywords.filter((_, i) => i !== index))
  }

  // 등록 저장
  async function handleSave() {
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
      await apiClient.post('/wisdom', {
        id: form.id.trim() || undefined,
        domain: form.domain.trim(),
        category: form.category.trim(),
        document: form.document.trim(),
        authorSource: form.authorSource.trim() || null,
        contextTrigger: form.contextTrigger.trim() || null,
        keywords: keywords.length > 0 ? keywords : null,
      })
      showMessage('격언이 성공적으로 등록되었습니다.', 'info')
      navigate('/wisdom')
    } catch {
      showMessage('격언 등록 중 오류가 발생했습니다.', 'error')
    } finally {
      setSaving(false)
    }
  }

  const categoryPresets = DEFAULT_CATEGORIES[form.domain] || []

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        {/* 헤더 */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-indigo-100 rounded-lg text-indigo-700">
            <Quote className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">새 격언 등록</h1>
            <p className="text-xs text-gray-500">
              KimsWeb 및 시스템에서 활용될 명언/격언 데이터를 등록합니다.
            </p>
          </div>
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
                  onClick={() => handleDomainChange(d.value)}
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

          {/* 3. 격언 ID */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-sm font-semibold text-gray-700">
                격언 고유 ID
                <span className="text-xs text-gray-400 font-normal ml-2">
                  (비워둘 경우 자동 생성)
                </span>
              </label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGenerateId}
                className="h-7 text-xs text-indigo-600 border-indigo-200"
              >
                <Sparkles className="w-3.5 h-3.5 mr-1" />
                자동 채번
              </Button>
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="예: quote_001, prv_001"
                value={form.id}
                onChange={(e) => {
                  setForm((f) => ({ ...f, id: e.target.value }))
                  setIdCheckStatus('idle')
                }}
                className="font-mono text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCheckId}
                disabled={!form.id.trim() || idCheckStatus === 'checking'}
                className="shrink-0"
              >
                중복확인
              </Button>
            </div>
            {idCheckStatus === 'available' && (
              <p className="text-xs text-emerald-600 flex items-center gap-1 mt-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> 사용 가능한 ID입니다.
              </p>
            )}
            {idCheckStatus === 'duplicated' && (
              <p className="text-xs text-red-500 flex items-center gap-1 mt-1">
                <XCircle className="w-3.5 h-3.5" /> 이미 사용 중인 ID입니다.
              </p>
            )}
          </div>

          {/* 4. 본문 (Document) */}
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

          {/* 5. 출처 / 작성자 (Author Source) */}
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

          {/* 6. 상황 / 감정 트리거 (Context Trigger) */}
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

          {/* 7. 키워드 태그 (Keywords) */}
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
            onCancel={() => navigate('/wisdom')}
            onSave={handleSave}
            saving={saving}
            saveDisabled={
              saving ||
              !form.domain.trim() ||
              !form.category.trim() ||
              !form.document.trim() ||
              idCheckStatus === 'duplicated'
            }
          />
        </div>
      </main>
    </div>
  )
}
