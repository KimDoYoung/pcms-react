/**
 * 목적: emojiall 및 Unicode 사전을 기반으로 한글 키워드로 이모지를 검색하고,
 *       에디터 본문에 삽입하거나 자산(assets) 테이블에 추가할 수 있는 검색 모달.
 *
 * 사용법:
 *   <EmojiSearchModal
 *     open={isEmojiModalOpen}
 *     onClose={() => setIsEmojiModalOpen(false)}
 *     onInsert={(emoji) => editor.insert(emoji)}
 *   />
 *
 * props:
 *   - open: boolean - 모달 오픈 여부
 *   - onClose: () => void - 모달 닫기 콜백
 *   - onInsert: (emoji: string) => void - 이모지 선택 및 삽입 콜백
 */
import { useState, useRef, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { useMessage } from '@/shared/hooks/useMessage'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import type { EmojiSearchResult } from '@/domain/utility/types/emoji'
import {
  Search,
  RotateCcw,
  Loader2,
  Copy,
  PlusCircle,
  CornerDownLeft,
  X,
  Smile,
} from 'lucide-react'

interface Props {
  open: boolean
  onClose: () => void
  onInsert: (emoji: string) => void
}

export default function EmojiSearchModal({ open, onClose, onInsert }: Props) {
  const [keyword, setKeyword] = useState('')
  const [results, setResults] = useState<EmojiSearchResult[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)
  const [addingEmoji, setAddingEmoji] = useState<string | null>(null)

  const inputRef = useRef<HTMLInputElement>(null)
  const { showMessage } = useMessage()
  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        inputRef.current?.focus()
      }, 50)
    } else {
      setKeyword('')
      setResults([])
      setHasSearched(false)
    }
  }, [open])

  const handleSearch = useCallback(async () => {
    const trimmed = keyword.trim()
    if (!trimmed) {
      showMessage('검색어를 입력해 주세요.', 'info')
      inputRef.current?.focus()
      return
    }

    setIsLoading(true)
    setHasSearched(true)

    try {
      const data = await apiClient.get<EmojiSearchResult[]>('/utility/emoji/search', {
        params: { keyword: trimmed },
      })
      setResults(data || [])
    } catch (err) {
      const msg = err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.'
      showMessage(msg, 'error')
      setResults([])
    } finally {
      setIsLoading(false)
    }
  }, [keyword, showMessage])

  function handleReset() {
    setKeyword('')
    setResults([])
    setHasSearched(false)
    inputRef.current?.focus()
  }

  function handleInsert(emoji: string) {
    onInsert(emoji)
    showMessage(`이모지 '${emoji}' 가 삽입되었습니다.`, 'success')
    onClose()
  }

  async function handleAddToAssets(item: EmojiSearchResult) {
    setAddingEmoji(item.emoji)
    try {
      await apiClient.post('/assets', {
        atype: 'EMOJI',
        name: item.name || keyword || '사용자 이모지',
        value: item.emoji,
      })

      await queryClient.invalidateQueries({ queryKey: ['assets', 'EMOJI'] })
      showMessage(`'${item.emoji}' (${item.name}) 이모지가 자산에 추가되었습니다.`, 'success')
    } catch (err) {
      const msg = err instanceof Error ? err.message : '자산 추가에 실패했습니다.'
      showMessage(msg, 'error')
    } finally {
      setAddingEmoji(null)
    }
  }

  async function handleCopy(emoji: string) {
    try {
      await navigator.clipboard.writeText(emoji)
      showMessage(`이모지 '${emoji}' 가 클립보드에 복사되었습니다.`, 'success')
    } catch {
      showMessage('클립보드 복사에 실패했습니다.', 'error')
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-150">
      <div
        className="bg-white rounded-xl shadow-2xl border border-gray-200 w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* 모달 헤더 */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between bg-gray-50/80">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
              <Smile className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-gray-900">이모지 찾기</h2>
              <p className="text-xs text-gray-500">한글 또는 영문 키워드로 이모지를 검색하여 에디터에 삽입하거나 자산에 등록합니다.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
            title="닫기"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 검색 툴바 */}
        <div className="p-4 border-b border-gray-100 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleSearch()
            }}
            className="flex items-center gap-2"
          >
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                ref={inputRef}
                type="text"
                value={keyword}
                onChange={(e) => setKeyword(e.target.value)}
                placeholder="검색할 이모지 키워드 입력 (예: 산, 스프, 불, 사과, 웃음, 축하)"
                className="pl-9 pr-3 h-10 text-sm"
              />
            </div>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 text-white h-10 px-4 shrink-0"
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Search className="w-4 h-4 mr-1.5" />
              )}
              찾기
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleReset}
              disabled={isLoading}
              className="h-10 px-3 shrink-0"
              title="초기화"
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              초기화
            </Button>
          </form>
        </div>

        {/* 결과 영역 */}
        <div className="flex-1 overflow-y-auto p-4 bg-gray-50/50 min-h-[300px]">
          {isLoading ? (
            <div className="h-64 flex flex-col items-center justify-center gap-2 text-gray-400">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-sm">이모지를 검색하고 있습니다...</p>
            </div>
          ) : results.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {results.map((item, idx) => (
                <div
                  key={`${item.emoji}-${idx}`}
                  className="bg-white p-3 rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-xs transition-all flex items-center justify-between gap-3 group"
                >
                  {/* 왼쪽: 이모지 아이콘 & 정보 */}
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <button
                      type="button"
                      onClick={() => handleInsert(item.emoji)}
                      className="shrink-0 w-12 h-12 flex items-center justify-center text-3xl bg-gray-50 rounded-lg hover:bg-blue-50 transition-colors cursor-pointer select-none"
                      title="클릭하여 바로 삽입"
                    >
                      {item.emoji}
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-800 truncate" title={item.name}>
                        {item.name}
                      </p>
                      {item.keywords && (
                        <p className="text-[11px] text-gray-400 truncate mt-0.5" title={item.keywords}>
                          {item.keywords}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* 오른쪽: 액션 버튼들 */}
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      type="button"
                      variant="default"
                      size="sm"
                      onClick={() => handleInsert(item.emoji)}
                      className="h-8 px-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs"
                      title="에디터에 삽입"
                    >
                      <CornerDownLeft className="w-3.5 h-3.5 mr-1" />
                      삽입
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleAddToAssets(item)}
                      disabled={addingEmoji === item.emoji}
                      className="h-8 px-2 text-xs text-gray-600 hover:text-indigo-600"
                      title="자산(Assets)에 추가하여 기본 팝업에서 사용"
                    >
                      {addingEmoji === item.emoji ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <PlusCircle className="w-3.5 h-3.5" />
                      )}
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(item.emoji)}
                      className="h-8 px-2 text-xs text-gray-400 hover:text-gray-700"
                      title="클립보드에 복사"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : hasSearched ? (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-1.5">
              <p className="text-sm font-medium text-gray-600">관련 검색결과가 없습니다.</p>
              <p className="text-xs">다른 검색어로 다시 시도해 보세요.</p>
            </div>
          ) : (
            <div className="h-64 flex flex-col items-center justify-center text-gray-400 gap-2">
              <Smile className="w-10 h-10 stroke-1 text-gray-300" />
              <p className="text-sm">검색어를 입력하고 '찾기'를 눌러주세요.</p>
              <div className="flex flex-wrap justify-center gap-1.5 max-w-sm mt-1">
                {['산', '스프', '불', '사과', '웃음', '하트', '축하', '눈물', '자동차', '컴퓨터'].map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => {
                      setKeyword(tag)
                      setTimeout(() => {
                        apiClient.get<EmojiSearchResult[]>('/utility/emoji/search', { params: { keyword: tag } })
                          .then((data) => {
                            setResults(data || [])
                            setHasSearched(true)
                          })
                      }, 0)
                    }}
                    className="text-xs px-2.5 py-1 rounded-full bg-white border border-gray-200 hover:border-blue-400 hover:text-blue-600 transition-colors"
                  >
                    #{tag}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 모달 푸터 */}
        <div className="px-5 py-3 border-t border-gray-100 bg-gray-50 flex items-center justify-between text-xs text-gray-400">
          <span>총 {results.length}개의 이모지 검색됨</span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onClose}
          >
            닫기
          </Button>
        </div>
      </div>
    </div>
  )
}
