/**
 * SimpleTabBar
 *
 * 목적: 열린 탭 목록을 탭 헤더 형태로 표시하는 컴포넌트.
 *       탭 클릭으로 활성화, X 버튼으로 닫기,
 *       우클릭 context menu로 좌/우/전체 닫기를 지원한다.
 *
 * 사용법:
 *   <SimpleTabBar />
 *   (SimpleTabLayout 내부에서 Toolbar 아래에 배치)
 */
import { X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useTabStore, type TabItem } from '@/shared/store/tabStore'
import { cn } from '@/lib/utils'
import { useNavigate } from 'react-router-dom'

interface ContextMenuState {
  tabId: string
  x: number
  y: number
}

/**
 * 탭 라벨을 "아이콘 + 최대 5글자 + …" 형태로 자른다.
 * 라벨 형식: "🏠 홈", "✏️ 일지기록" 처럼 첫 토큰이 이모지(아이콘)
 */
function truncateTabLabel(label: string, maxChars = 5): string {
  const spaceIdx = label.indexOf(' ')
  if (spaceIdx === -1) {
    return label.length > maxChars ? label.slice(0, maxChars) + '…' : label
  }
  const icon = label.slice(0, spaceIdx)
  const text = label.slice(spaceIdx + 1)
  const trimmed = text.length > maxChars ? text.slice(0, maxChars) + '…' : text
  return `${icon} ${trimmed}`
}

function TabContextMenu({
  menu,
  onClose,
}: {
  menu: ContextMenuState
  onClose: () => void
}) {
  const ref = useRef<HTMLDivElement>(null)
  const { tabs, closeTabsToRight, closeTabsToLeft, closeAllTabs } = useTabStore()

  const idx = tabs.findIndex((t) => t.id === menu.tabId)
  const hasRight = tabs.slice(idx + 1).some((t) => t.closable)
  const hasLeft = tabs.slice(0, idx).some((t) => t.closable)
  const hasAny = tabs.some((t) => t.closable)

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    document.addEventListener('mousedown', handleDown)
    return () => document.removeEventListener('mousedown', handleDown)
  }, [onClose])

  const menuItems = [
    {
      label: '오른쪽 탭 모두 닫기',
      disabled: !hasRight,
      onClick: () => { closeTabsToRight(menu.tabId); onClose() },
    },
    {
      label: '왼쪽 탭 모두 닫기',
      disabled: !hasLeft,
      onClick: () => { closeTabsToLeft(menu.tabId); onClose() },
    },
    { separator: true },
    {
      label: '모두 닫기',
      disabled: !hasAny,
      onClick: () => { closeAllTabs(); onClose() },
    },
  ]

  return (
    <div
      ref={ref}
      style={{ top: menu.y, left: menu.x }}
      className="fixed z-50 w-44 bg-white border border-gray-200 rounded-lg shadow-lg py-1 text-sm"
    >
      {menuItems.map((item, i) =>
        'separator' in item ? (
          <div key={i} className="my-1 border-t border-gray-100" />
        ) : (
          <button
            key={i}
            disabled={item.disabled}
            onClick={item.onClick}
            className={cn(
              'w-full text-left px-4 py-2 transition-colors',
              item.disabled
                ? 'text-gray-300 cursor-default'
                : 'text-gray-700 hover:bg-blue-50 hover:text-blue-600'
            )}
          >
            {item.label}
          </button>
        )
      )}
    </div>
  )
}

export function SimpleTabBar() {
  const { tabs, activeTabId, activateTab, closeTab, reorderTabs } = useTabStore()
  const navigate = useNavigate()
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [draggedId, setDraggedId] = useState<string | null>(null)
  const [dragOverId, setDragOverId] = useState<string | null>(null)

  function handleTabClick(tab: TabItem) {
    activateTab(tab.id)
    navigate(tab.path + (tab.search || ''))
  }

  function handleContextMenu(e: React.MouseEvent, tabId: string) {
    e.preventDefault()
    setContextMenu({ tabId, x: e.clientX, y: e.clientY })
  }

  function handleDragStart(e: React.DragEvent, tabId: string) {
    setDraggedId(tabId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function handleDragOver(e: React.DragEvent, tabId: string) {
    e.preventDefault()
    if (tabId === draggedId) return
    e.dataTransfer.dropEffect = 'move'
    setDragOverId(tabId)
  }

  function handleDrop(e: React.DragEvent, tabId: string) {
    e.preventDefault()
    if (draggedId && draggedId !== tabId) {
      reorderTabs(draggedId, tabId)
    }
    setDraggedId(null)
    setDragOverId(null)
  }

  function handleDragEnd() {
    setDraggedId(null)
    setDragOverId(null)
  }

  return (
    <>
      <div className="flex items-end bg-gray-100 border-b border-gray-200 px-4 pt-1.5 gap-0.5 overflow-x-auto shrink-0">
        {tabs.map((tab) => {
          const isActive = activeTabId === tab.id
          const isDragging = draggedId === tab.id
          const isDragOver = dragOverId === tab.id && draggedId !== tab.id
          const isDraggable = tab.id !== '/'

          return (
            <div
              key={tab.id}
              draggable={isDraggable}
              onClick={() => handleTabClick(tab)}
              onContextMenu={(e) => handleContextMenu(e, tab.id)}
              onDragStart={(e) => handleDragStart(e, tab.id)}
              onDragOver={(e) => handleDragOver(e, tab.id)}
              onDrop={(e) => handleDrop(e, tab.id)}
              onDragEnd={handleDragEnd}
              onDragLeave={() => setDragOverId(null)}
              title={tab.label}
              className={cn(
                'flex items-center w-36 pl-3 py-2 rounded-t-lg text-sm cursor-pointer select-none',
                'border border-b-0 transition-colors',
                isActive
                  ? 'bg-white border-gray-200 text-blue-600 font-medium shadow-sm'
                  : 'bg-gray-50 border-transparent text-gray-500 hover:bg-gray-200 hover:text-gray-700',
                isDragging && 'opacity-40',
                isDragOver && 'border-l-2 border-l-blue-400 bg-blue-50 text-blue-600',
              )}
            >
              <span className="flex-1 truncate">{truncateTabLabel(tab.label)}</span>
              {tab.closable && (
                <button
                  onClick={(e) => { e.stopPropagation(); closeTab(tab.id) }}
                  style={{ marginRight: '2px' }}
                  className="shrink-0 rounded-full p-0.5 text-gray-400 hover:bg-red-100 hover:text-red-500 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          )
        })}
      </div>

      {contextMenu && (
        <TabContextMenu
          menu={contextMenu}
          onClose={() => setContextMenu(null)}
        />
      )}
    </>
  )
}
