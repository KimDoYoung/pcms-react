/**
 * 목적: 에디터에 이모지/특수문자를 삽입하기 위한 선택 팝업.
 *       cms.assets 테이블(atype=EMOJI|SYMBOL)에서 목록을 조회해 보여준다.
 *       한 자산(row)의 value에 콤마로 여러 개를 등록할 수 있다 (예: "😂,😁,😮") - 각각 별개 항목으로 분리해 노출.
 *       표시할 항목은 설정(SettingsPage) > 자산 관리에서 등록해야 한다.
 *
 * 사용법:
 *   <AssetPickerPopup atype="EMOJI" position={{ x: 100, y: 200 }} onSelect={(v) => insert(v)} onClose={() => setOpen(false)} />
 *   position은 viewport 기준 고정 좌표(px). 툴바 버튼 아래든, 에디터 캐럿 위치든 호출부에서 계산해 전달한다.
 *
 * props:
 *   - atype: 'EMOJI' | 'SYMBOL' - 조회할 자산 타입
 *   - position: { x: number; y: number } - 팝업이 뜰 viewport 좌표 (좌상단 기준, 화면 밖으로 나가지 않도록 자동 보정됨)
 *   - onSelect: (value: string) => void - 항목 선택 시 콜백 (마우스 클릭 또는 Enter)
 *   - onClose: () => void - 팝업 닫기 요청 (Escape, 바깥 클릭)
 */
import { useEffect, useRef, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { apiClient } from '@/lib/apiClient'
import type { AssetDto, AssetType } from '@/domain/asset/types/asset'

interface Props {
  atype: AssetType
  position: { x: number; y: number }
  onSelect: (value: string) => void
  onClose: () => void
}

export default function AssetPickerPopup({ atype, position, onSelect, onClose }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [adjusted, setAdjusted] = useState(position)
  const COLS = 10

  const { data = [] } = useQuery<AssetDto[]>({
    queryKey: ['assets', atype],
    queryFn: () => apiClient.get<AssetDto[]>('/assets', { params: { atype } }),
  })

  // value는 콤마로 여러 이모지/기호를 한 행에 등록할 수 있다 (예: "😂,😁,😮"). 개별 항목으로 분리해 노출.
  const items = data.flatMap((a) =>
    a.value.split(',').map((v) => v.trim()).filter(Boolean).map((v) => ({ label: a.name, value: v })),
  )

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
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex((i) => Math.min(i + 1, items.length - 1))
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex((i) => Math.max(i - 1, 0))
      } else if (e.key === 'ArrowDown') {
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex((i) => Math.min(i + COLS, items.length - 1))
      } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        e.stopPropagation()
        setActiveIndex((i) => Math.max(i - COLS, 0))
      }
    }
    document.addEventListener('mousedown', onMouseDown)
    // capture 단계에서 선점: ProseMirror(에디터)가 Enter/화살표를 먼저 처리해
    // 줄바꿈 등이 삽입되는 것을 막기 위함
    document.addEventListener('keydown', onKeyDown, true)
    return () => {
      document.removeEventListener('mousedown', onMouseDown)
      document.removeEventListener('keydown', onKeyDown, true)
    }
  }, [items, activeIndex, onSelect, onClose])

  return (
    <div
      ref={containerRef}
      style={{ position: 'fixed', left: adjusted.x, top: adjusted.y, zIndex: 50 }}
      className="w-96 max-h-64 overflow-y-auto bg-white rounded-lg shadow-xl border border-gray-200 p-2"
    >
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
            등록된 항목이 없습니다.
            <br />
            설정 &gt; 자산 관리에서 추가해 주세요.
          </p>
        )}
      </div>
    </div>
  )
}
