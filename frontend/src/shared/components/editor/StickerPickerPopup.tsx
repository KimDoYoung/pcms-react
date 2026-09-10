/**
 * 목적: 에디터에서 작은 이미지(PNG, SVG, 주식 짤, 스티커 등)를 원클릭으로 본문에 삽입하기 위한 선택 팝업.
 *       태그별 필터와 검색을 지원하며, 썸네일을 클릭하면 마크다운 이미지 문법(`![이름](url)`)으로 삽입한다.
 *
 * 사용법:
 *   <StickerPickerPopup
 *     position={{ x: 100, y: 200 }}
 *     onSelect={(tag) => editorRef.current?.insertText(tag)}
 *     onClose={() => setOpen(false)}
 *   />
 *
 * props:
 *   - position: { x: number; y: number } - 팝업이 뜰 viewport 좌표
 *   - onSelect: (markdownSnippet: string) => void - 항목 선택 시 에디터 삽입 콜백
 *   - onClose: () => void - 팝업 닫기 요청 (Escape, 바깥 클릭)
 */
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import { type StickerFile, mediaDownloadUrl, mediaLabel } from '@/lib/mediaFile'
import { Search, Sparkles, X } from 'lucide-react'
import { Input } from '@/shared/components/ui/input'

interface Props {
  position: { x: number; y: number }
  onSelect: (markdownSnippet: string) => void
  onClose: () => void
}

export default function StickerPickerPopup({ position, onSelect, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [adjusted, setAdjusted] = useState(position)
  const [search, setSearch] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)

  const { data: items = [] } = useQuery<StickerFile[]>({
    queryKey: ['stickers', search],
    queryFn: () =>
      apiClient.get<StickerFile[]>('/files/stickers', {
        params: search ? { keyword: search } : {},
      }),
  })

  const { data: allTags = [] } = useQuery<string[]>({
    queryKey: ['sticker-tags'],
    queryFn: () => apiClient.get<string[]>('/files/sticker-tags'),
  })

  // 클라이언트 태그 필터
  const filtered = selectedTag
    ? items.filter((item) => item.tag && item.tag.toLowerCase().includes(selectedTag.toLowerCase()))
    : items

  // 팝업이 화면 밖으로 벗어나지 않도록 좌표 보정
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    let x = position.x
    let y = position.y
    if (x + rect.width > window.innerWidth) x = Math.max(8, window.innerWidth - rect.width - 8)
    if (y + rect.height > window.innerHeight) y = Math.max(8, window.innerHeight - rect.height - 8)
    setAdjusted({ x, y })
  }, [position])

  // 바깥 클릭 시 닫기
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [onClose])

  // Escape 키로 닫기
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [onClose])

  function handleChoose(item: StickerFile) {
    const label = mediaLabel(item)
    const url = mediaDownloadUrl(item)
    const snippet = `![${label}](${url})`
    onSelect(snippet)
    onClose()
  }

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-label="스티커 선택"
      style={{ left: adjusted.x, top: adjusted.y }}
      className="fixed z-50 w-80 bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden flex flex-col max-h-[380px] animate-in fade-in zoom-in-95 duration-100"
    >
      {/* 팝업 헤더 */}
      <div className="flex items-center justify-between px-3 py-2 border-b bg-amber-50/50">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-900">
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          스티커·짤 삽입
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 p-0.5 rounded transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 검색창 */}
      <div className="p-2 border-b bg-gray-50/30">
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2 text-gray-400" />
          <Input
            placeholder="스티커/태그 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-7 text-xs bg-white"
            autoFocus
          />
        </div>

        {/* 태그 칩 */}
        {allTags.length > 0 && (
          <div className="flex items-center gap-1 mt-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-1.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                selectedTag === null
                  ? 'bg-amber-600 text-white font-medium'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              전체
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                onClick={() => setSelectedTag(selectedTag === t ? null : t)}
                className={`px-1.5 py-0.5 rounded-full whitespace-nowrap transition-colors ${
                  selectedTag === t
                    ? 'bg-amber-600 text-white font-medium'
                    : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 스티커 그리드 */}
      <div className="p-2 flex-1 overflow-y-auto min-h-[160px]">
        {filtered.length === 0 ? (
          <div className="h-32 flex flex-col items-center justify-center text-xs text-gray-400">
            <p>스티커가 없습니다.</p>
            <p className="text-[10px] mt-0.5 text-gray-400">자산 &gt; 스티커관리에서 등록해 보세요.</p>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-2">
            {filtered.map((item) => (
              <button
                key={item.fileId}
                type="button"
                onClick={() => handleChoose(item)}
                className="group relative aspect-square p-1.5 rounded-md border border-gray-100 hover:border-amber-400 hover:bg-amber-50/50 flex flex-col items-center justify-center transition-all bg-white"
                title={`${mediaLabel(item)}${item.tag ? ` (#${item.tag})` : ''}`}
              >
                <img
                  src={mediaDownloadUrl(item)}
                  alt={item.orgFileName}
                  className="max-w-full max-h-full object-contain transition-transform group-hover:scale-110"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
