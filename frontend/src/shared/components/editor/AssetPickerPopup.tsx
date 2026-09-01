/**
 * 목적: 에디터에 이모지/특수문자/상용구/템플릿을 삽입하기 위한 선택 팝업.
 *       cms.assets 테이블(atype=EMOJI|SYMBOL|PHRASE|TEMPLATE)에서 목록을 조회해 보여준다.
 *       EMOJI/SYMBOL: 콤마 구분 그리드 표시 (각 값 개별 삽입).
 *       PHRASE/TEMPLATE: 이름 태그 목록 표시 (클릭 시 value 전체 삽입).
 *       EMOJI: 하단에 '이모지 검색' 버튼을 제공하여 외부/내부 이모지 검색 모달과 연동.
 *
 * 사용법:
 *   <AssetPickerPopup
 *     atype="EMOJI"
 *     position={{ x: 100, y: 200 }}
 *     onSelect={(v) => insert(v)}
 *     onClose={() => setOpen(false)}
 *     onOpenSearchModal={() => setEmojiModalOpen(true)}
 *   />
 *
 * props:
 *   - atype: 'EMOJI' | 'SYMBOL' | 'PHRASE' | 'TEMPLATE' - 조회할 자산 타입
 *   - position: { x: number; y: number } - 팝업이 뜰 viewport 좌표
 *   - onSelect: (value: string) => void - 항목 선택 시 콜백
 *   - onClose: () => void - 팝업 닫기 요청 (Escape, 바깥 클릭)
 *   - onOpenSearchModal?: () => void - 이모지 찾기 모달 오픈 콜백
 */
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { AssetDto, AssetType } from '@/domain/asset/types/asset'
import { Search } from 'lucide-react'

interface Props {
  atype: AssetType
  position: { x: number; y: number }
  onSelect: (value: string) => void
  onClose: () => void
  onOpenSearchModal?: () => void
}

export default function AssetPickerPopup({ atype, position, onSelect, onClose, onOpenSearchModal }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [adjusted, setAdjusted] = useState(position)
  const COLS = 10

  const isListMode = atype === 'PHRASE' || atype === 'TEMPLATE'

  const { data = [] } = useQuery<AssetDto[]>({
    queryKey: ['assets', atype],
    queryFn: () => apiClient.get<AssetDto[]>('/assets', { params: { atype } }),
  })

  // EMOJI/SYMBOL: 콤마 분할 그리드 아이템
  const gridItems = isListMode
    ? []
    : data.flatMap((a) =>
        a.value.split(',').map((v) => v.trim()).filter(Boolean).map((v) => ({ label: a.name, value: v })),
      )

  // PHRASE/TEMPLATE: 각 자산이 하나의 목록 아이템 (value 전체 삽입)
  const listItems = isListMode ? data.map((a) => ({ label: a.name, value: a.value })) : []

  const items = isListMode ? listItems : gridItems

  // 화면 밖으로 나가지 않도록 좌표 보정
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

  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault()
        e.stopPropagation()
        onClose()
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        e.stopPropagation()
        if (items[activeIndex]) onSelect(items[activeIndex].value)
        return
      }
      if (!isListMode) {
        if (e.key === 'ArrowRight') {
          e.preventDefault(); e.stopPropagation()
          setActiveIndex((i) => Math.min(i + 1, items.length - 1))
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault(); e.stopPropagation()
          setActiveIndex((i) => Math.max(i - 1, 0))
        } else if (e.key === 'ArrowDown') {
          e.preventDefault(); e.stopPropagation()
          setActiveIndex((i) => Math.min(i + COLS, items.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault(); e.stopPropagation()
          setActiveIndex((i) => Math.max(i - COLS, 0))
        }
      } else {
        if (e.key === 'ArrowDown') {
          e.preventDefault(); e.stopPropagation()
          setActiveIndex((i) => Math.min(i + 1, items.length - 1))
        } else if (e.key === 'ArrowUp') {
          e.preventDefault(); e.stopPropagation()
          setActiveIndex((i) => Math.max(i - 1, 0))
        }
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [items, activeIndex, onSelect, onClose, isListMode])

  const tagStyle = atype === 'PHRASE'
    ? 'bg-purple-50 hover:bg-purple-100 border-purple-100 text-purple-700'
    : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100 text-indigo-700'

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', left: adjusted.x, top: adjusted.y, zIndex: 50 }}
      className={`bg-white rounded-lg shadow-xl border border-gray-200 p-2 ${isListMode ? 'w-80 max-h-64' : 'w-96 max-h-72'} overflow-y-auto flex flex-col`}
    >
      <div className="flex-1">
        {isListMode ? (
          // PHRASE / TEMPLATE: 이름 태그 목록
          <div className="flex flex-wrap gap-1.5 p-0.5">
            {items.map((item, idx) => (
              <button
                key={`${item.label}-${idx}`}
                type="button"
                title={item.value}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelect(item.value)}
                className={`px-2 py-0.5 border rounded text-xs font-semibold cursor-pointer transition-colors max-w-[130px] truncate ${tagStyle} ${idx === activeIndex ? 'ring-2 ring-offset-1 ring-purple-300' : ''}`}
              >
                {item.label}
              </button>
            ))}
            {items.length === 0 && (
              <p className="w-full text-center text-xs text-gray-400 py-4">
                등록된 항목이 없습니다.<br />
                자산 관리에서 추가해 주세요.
              </p>
            )}
          </div>
        ) : (
          // EMOJI / SYMBOL: 그리드
          <div className="grid grid-cols-10 gap-1">
            {items.map((item, idx) => (
              <button
                key={`${item.value}-${idx}`}
                type="button"
                title={item.label}
                onMouseEnter={() => setActiveIndex(idx)}
                onClick={() => onSelect(item.value)}
                className={`flex items-center justify-center h-8 w-8 text-lg rounded transition-colors ${
                  idx === activeIndex ? 'bg-blue-100' : 'hover:bg-gray-100'
                }`}
              >
                {item.value}
              </button>
            ))}
            {items.length === 0 && (
              <p className="col-span-10 text-center text-xs text-gray-400 py-4">
                등록된 항목이 없습니다.<br />
                자산 관리에서 추가해 주세요.
              </p>
            )}
          </div>
        )}
      </div>

      {/* 이모지 팝업일 때 하단 검색 모달 오픈 버튼 제공 */}
      {atype === 'EMOJI' && onOpenSearchModal && (
        <div className="mt-2 pt-2 border-t border-gray-100 flex items-center justify-between">
          <span className="text-[11px] text-gray-400 pl-1">자산 이모지</span>
          <button
            type="button"
            onClick={() => {
              onClose()
              onOpenSearchModal()
            }}
            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium px-2 py-1 rounded-md hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <Search className="w-3.5 h-3.5" />
            <span>이모지 찾기</span>
          </button>
        </div>
      )}
    </div>
  )
}
