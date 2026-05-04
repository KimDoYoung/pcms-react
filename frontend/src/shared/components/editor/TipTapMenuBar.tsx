import { useState, useRef, useEffect, useCallback } from 'react'
import { useEditor } from '@tiptap/react'
import HanjaSearchModal from '@/shared/components/editor/HanjaSearchModal'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'

const TEXT_COLORS = [
  { label: '기본', value: '' },
  { label: '빨강', value: '#ef4444' },
  { label: '주황', value: '#f97316' },
  { label: '노랑', value: '#eab308' },
  { label: '초록', value: '#22c55e' },
  { label: '파랑', value: '#3b82f6' },
  { label: '보라', value: '#8b5cf6' },
  { label: '회색', value: '#6b7280' },
]

interface TipTapMenuBarProps {
  editor: ReturnType<typeof useEditor>
  headingLevels?: (1 | 2 | 3)[]
}

export default function TipTapMenuBar({ editor, headingLevels = [1, 2, 3] }: TipTapMenuBarProps) {
  const [showColors, setShowColors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hanjaOpen, setHanjaOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState('')
  const selectionRef = useRef<{ from: number; to: number } | null>(null)

  const handleHanjaClick = useCallback(() => {
    if (!editor) return

    const { from, to } = editor.state.selection
    const text = editor.state.doc.textBetween(from, to, ' ')
    if (!text.trim()) return
    selectionRef.current = { from, to }
    setSelectedWord(text.trim())
    setHanjaOpen(true)
  }, [editor])

  useEffect(() => {
    if (!editor) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        handleHanjaClick()
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [editor, handleHanjaClick])

  if (!editor) return null

  function handleHanjaSelect(hanja: string) {
    if (!selectionRef.current) return
    const { from, to } = selectionRef.current
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, hanja).run()
    selectionRef.current = null
  }

  function insertImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(editor?.chain().focus() as any).setImage({ src }).run()
    }
    reader.readAsDataURL(file)
  }

  const btn = (label: string, action: () => boolean, active?: boolean, key?: string | number) => (
    <button
      key={key}
      type="button"
      onClick={() => action()}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        active ? 'bg-blue-100 text-blue-700 font-semibold' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )

  const currentColor = editor.getAttributes('textStyle').color || ''

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
      <span className="w-px bg-gray-200 mx-1" />
      {headingLevels.map((level) =>
        btn(
          `H${level}`,
          () => editor.chain().focus().toggleHeading({ level }).run(),
          editor.isActive('heading', { level }),
          `heading-${level}`
        ),
      )}
      <span className="w-px bg-gray-200 mx-1" />
      {btn('• 목록', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. 목록', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      <span className="w-px bg-gray-200 mx-1" />
      {btn('인용', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      <span className="w-px bg-gray-200 mx-1" />

      {/* 글씨 색상 */}
      <Popover open={showColors} onOpenChange={setShowColors}>
        <PopoverTrigger asChild>
          <button
            type="button"
            className="flex items-center gap-1 px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <span
              className="inline-block w-4 h-4 rounded-sm border border-gray-300"
              style={{ backgroundColor: currentColor || '#000000' }}
            />
            <span>색상</span>
            <span className="text-xs opacity-50">▾</span>
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          <div className="flex flex-wrap gap-1">
            {TEXT_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => {
                  if (c.value) {
                    editor.chain().focus().setColor(c.value).run()
                  } else {
                    editor.chain().focus().unsetColor().run()
                  }
                  setShowColors(false)
                }}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-50 text-left"
              >
                <span
                  className="inline-block w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: c.value || '#000000' }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-px bg-gray-200 mx-1" />

      {/* 이미지 파일 추가 */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors"
      >
        🖼 이미지
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) insertImageFile(file)
          e.target.value = ''
        }}
      />

      {/* onMouseDown + preventDefault: 에디터 포커스/selection 유지하면서 실행 */}
      <button
        type="button"
        onMouseDown={(e) => {
          e.preventDefault()
          const { state, dispatch } = editor.view
          const { from } = state.selection

          // 문서의 최상위 블록 목록과 현재 커서가 속한 블록 인덱스를 파악
          const blocks: Array<{ offset: number; nodeSize: number }> = []
          let foundIdx = -1
          state.doc.forEach((node, offset) => {
            if (from > offset && from <= offset + node.nodeSize) {
              foundIdx = blocks.length
            }
            blocks.push({ offset, nodeSize: node.nodeSize })
          })

          if (foundIdx <= 0) return

          const prev = blocks[foundIdx - 1]
          const curr = blocks[foundIdx]
          // prev 블록의 닫힘 토큰과 curr 블록의 열림 토큰을 삭제 → 두 블록 병합
          dispatch(state.tr.delete(prev.offset + prev.nodeSize - 1, curr.offset + 1))
        }}
        className="px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors"
      >
        ← 합치기
      </button>

      <span className="w-px bg-gray-200 mx-1" />

      {/* 한자 변환 */}
      {btn('漢', () => { handleHanjaClick(); return false })}
      <HanjaSearchModal
        open={hanjaOpen}
        selectedWord={selectedWord}
        onClose={() => setHanjaOpen(false)}
        onSelect={handleHanjaSelect}
      />
    </div>
  )
}
