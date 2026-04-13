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
 */
import { useEffect, useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/shared/components/ui/dialog'
import { searchHanja, type HanjaResult } from '@/shared/api/hanjaApi'

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

  useEffect(() => {
    if (!open || !selectedWord) return
    setResults([])
    setError(false)
    setLoading(true)
    searchHanja(selectedWord)
      .then(setResults)
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [open, selectedWord])

  function handleSelect(hanja: string) {
    onSelect(hanja)
    onClose()
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            <span className="text-gray-500 font-normal">한자 검색 — </span>
            <span className="font-bold">{selectedWord}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="mt-2 min-h-[120px]">
          {loading && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              검색 중…
            </div>
          )}

          {!loading && error && (
            <div className="flex items-center justify-center py-10 text-red-400 text-sm">
              검색 중 오류가 발생했습니다.
            </div>
          )}

          {!loading && !error && results.length === 0 && (
            <div className="flex items-center justify-center py-10 text-gray-400 text-sm">
              검색 결과가 없습니다.
            </div>
          )}

          {!loading && !error && results.length > 0 && (
            <ul className="divide-y divide-gray-100">
              {results.map((r, i) => (
                <li key={i}>
                  <button
                    type="button"
                    onClick={() => handleSelect(r.hanja)}
                    className="w-full flex items-center gap-4 px-3 py-3 text-left hover:bg-blue-50 transition-colors rounded"
                  >
                    <span className="text-2xl font-bold text-blue-700 w-14 shrink-0 text-center">
                      {r.hanja}
                    </span>
                    <span className="text-sm text-gray-600 leading-snug line-clamp-2">
                      {r.meaning || '(뜻풀이 없음)'}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
