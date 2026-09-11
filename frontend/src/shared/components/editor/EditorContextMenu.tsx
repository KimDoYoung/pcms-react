/**
 * 목적: HTML(TipTap)/Markdown 에디터 공용 우클릭 컨텍스트 메뉴.
 *       공간 활용을 위해 항목을 1행 2열 그리드로 배치하고, 화면 경계에 가까우면
 *       메뉴가 잘리지 않도록 위/왼쪽으로 자동 보정한다.
 *
 * 사용법:
 *   <EditorContextMenu
 *     x={menuPos.x} y={menuPos.y} visible={menuPos.visible}
 *     items={[
 *       { label: 'Bold', shortcut: 'Ctrl+B', onClick: () => handleAction('bold') },
 *       { divider: true },
 *       { custom: true, content: <ColorSwatchRow ... /> },
 *       { label: 'Table', shortcut: 'Ctrl+,', onClick: () => handleAction('table') },
 *     ]}
 *   />
 *
 * props:
 *   - x, y: number - 메뉴가 뜰 좌표 (viewport 기준, MouseEvent의 clientX/clientY 사용)
 *   - visible: boolean - 표시 여부
 *   - items: (EditorContextMenuAction | EditorContextMenuDivider | EditorContextMenuCustom)[] - 메뉴 항목 목록.
 *       label 항목은 "Label (단축키)" 한 줄로 표시된다. custom 항목은 2열 전체 폭을 차지하며
 *       임의의 JSX(색상 스와치 등)를 넣을 수 있다.
 */
import { useLayoutEffect, useRef, useState } from 'react'

export interface EditorContextMenuAction {
    label: string
    shortcut?: string
    onClick: () => void
}

export interface EditorContextMenuDivider {
    divider: true
}

export interface EditorContextMenuCustom {
    custom: true
    content: React.ReactNode
}

export type EditorContextMenuEntry = EditorContextMenuAction | EditorContextMenuDivider | EditorContextMenuCustom

interface Props {
    x: number
    y: number
    visible: boolean
    items: EditorContextMenuEntry[]
}

export default function EditorContextMenu({ x, y, visible, items }: Props) {
    const menuRef = useRef<HTMLUListElement>(null)
    const [pos, setPos] = useState({ x, y })

    // 화면 경계 감지: 메뉴가 뷰포트를 벗어나면 위/왼쪽으로 뒤집는다.
    useLayoutEffect(() => {
        if (!visible) return
        const el = menuRef.current
        if (!el) {
            setPos({ x, y })
            return
        }
        const rect = el.getBoundingClientRect()
        let nextX = x
        let nextY = y
        if (x + rect.width > window.innerWidth) nextX = Math.max(8, window.innerWidth - rect.width - 8)
        if (y + rect.height > window.innerHeight) nextY = Math.max(8, y - rect.height)
        setPos({ x: nextX, y: nextY })
    }, [visible, x, y])

    if (!visible) return null

    return (
        <ul
            ref={menuRef}
            className="fixed z-50 bg-white border border-gray-200 shadow-xl rounded-md p-0.5 text-[11px] font-medium w-56 grid grid-cols-2 gap-px"
            style={{ top: pos.y, left: pos.x }}
        >
            {items.map((item, idx) => {
                if ('divider' in item) {
                    return <li key={`divider-${idx}`} className="col-span-2 my-0.5 border-t border-gray-100" />
                }
                if ('custom' in item) {
                    return (
                        <li key={`custom-${idx}`} className="col-span-2 px-2 py-0.5" onMouseDown={(e) => e.preventDefault()}>
                            {item.content}
                        </li>
                    )
                }
                return (
                    <li
                        key={item.label}
                        onMouseDown={(e) => e.preventDefault()}
                        className="px-2 py-1 rounded hover:bg-indigo-50 hover:text-indigo-700 cursor-pointer whitespace-nowrap truncate text-gray-700 transition-colors"
                        onClick={(e) => {
                            e.stopPropagation()
                            item.onClick()
                        }}
                    >
                        {item.label}
                        {item.shortcut && <span className="text-gray-400 font-normal"> ({item.shortcut})</span>}
                    </li>
                )
            })}
        </ul>
    )
}
