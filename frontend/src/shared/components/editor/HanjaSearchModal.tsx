/**
 * 한자 검색 모달
 *
 * 사용법:
 *   <HanjaSearchModal
 *     open={hanjaOpen}
 *     selectedWord="운명"
 *     onClose={() => setHanjaOpen(false)}
 *     onSelect={(hanja) => replaceEditorSelection(hanja)}
 *   />
 *
 * - selectedWord : 에디터에서 선택한 한글 단어
 * - onSelect     : 한자를 선택했을 때 호출되는 콜백 (모달은 자동으로 닫힘)
 * - ↑↓ 로 항목 이동, Enter 로 선택, Esc 로 닫기 (선택 없음)
 */
import { useEffect, useRef, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { searchHanja, addHanja, type HanjaResult } from '@/shared/api/hanjaApi'

interface Props {
  open: boolean
  selectedWord: string
  onClose: () => void
  onSelect: (hanja: string) => void
}

export default function HanjaSearchModal({ open, selectedWord, onClose, onSelect }: Props) {
  const [results, setResults] = useState<HanjaResult[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [focusedIndex, setFocusedIndex] = useState(0)

  const [inputKorean, setInputKorean] = useState('')
  const [inputHanja, setInputHanja] = useState('')
  const [saving, setSaving] = useState(false)

  const listRef = useRef<HTMLUListElement>(null)
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => {
    if (!open || !selectedWord) return
    setResults([])
    setError(false)
    setFocusedIndex(0)
    setLoading(true)
    setInputKorean(selectedWord)
    setInputHanja('')
    searchHanja(selectedWord)
      .then((data) => { setResults(data); setFocusedIndex(0) })
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [open, selectedWord])

  // 포커스된 항목을 스크롤 뷰에 유지
  useEffect(() => {
    itemRefs.current[focusedIndex]?.scrollIntoView({ block: 'nearest' })
  }, [focusedIndex])

  // ↑↓ Enter 키보드 네비게이션
  useEffect(() => {
    if (!open || results.length === 0) return
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setFocusedIndex((i) => Math.min(i + 1, results.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        setFocusedIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'Enter') {
        e.preventDefault()
        if (results[focusedIndex]) handleSelect(results[focusedIndex].hanja)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open, results, focusedIndex])

  function handleSelect(hanja: string) {
    onSelect(hanja)
    onClose()
  }

  async function handleAdd() {
    if (!inputKorean.trim() || !inputHanja.trim()) return
    setSaving(true)
    try {
      await addHanja(inputKorean.trim(), inputHanja.trim())
      const updated = await searchHanja(inputKorean.trim())
      setResults(updated)
      setFocusedIndex(0)
      setInputHanja('')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="flex flex-col max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>
            <span className="text-gray-500 font-normal">한자 검색 — </span>
            <span className="font-bold">{selectedWord}</span>
          </DialogTitle>
        </DialogHeader>

        {/* 검색 결과 — 높이 고정 + 스크롤 */}
        <div className="min-h-[80px] flex-1 overflow-y-auto overflow-x-hidden rounded border border-gray-100 [scrollbar-gutter:stable]">
          {loading && (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
              검색 중…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center py-8 text-red-400 text-sm">
              검색 중 오류가 발생했습니다.
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="flex items-center justify-center py-8 text-gray-400 text-sm">
              검색 결과가 없습니다.
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <ul ref={listRef} className="w-full divide-y divide-gray-100">
              {results.map((r, i) => (
                <li key={i} className="w-full min-w-0">
                  <button
                    ref={(el) => { itemRefs.current[i] = el }}
                    type="button"
                    onClick={() => handleSelect(r.hanja)}
                    onMouseEnter={() => setFocusedIndex(i)}
                    className={`w-full min-w-0 overflow-hidden flex items-center gap-3 px-3 py-2.5 text-left transition-colors ${
                      focusedIndex === i ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <span className={`text-lg font-bold shrink-0 w-24 text-center ${
                      focusedIndex === i ? 'text-blue-700' : 'text-gray-700'
                    }`}>
                      {r.hanja}
                    </span>
                    <span className="min-w-0 flex-1 text-xs text-gray-500 leading-snug line-clamp-2 break-words">
                      {r.meaning || '(뜻풀이 없음)'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* 수동 추가 폼 */}
        <div className="border-t border-gray-100 pt-3">
          <p className="text-xs text-gray-400 mb-2">직접 추가</p>
          <div className="flex gap-2">
            <input
              type="text"
              value={inputKorean}
              onChange={(e) => setInputKorean(e.target.value)}
              placeholder="한글"
              className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
            />
            <input
              type="text"
              value={inputHanja}
              onChange={(e) => setInputHanja(e.target.value)}
              placeholder="漢字"
              className="flex-1 min-w-0 border border-gray-200 rounded px-2 py-1.5 text-sm focus:outline-none focus:border-blue-400"
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            />
            <button
              type="button"
              onClick={handleAdd}
              disabled={saving || !inputKorean.trim() || !inputHanja.trim()}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-40 transition-colors shrink-0"
            >
              {saving ? '…' : '추가'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
