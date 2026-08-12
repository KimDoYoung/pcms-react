/**
 * ContentEditor 전용 TipTap 툴바.
 *
 * 사용법:
 *   <TipTapMenuBar editor={editor} headingLevels={[1,2,3]} />
 *   ContentEditor.tsx 안에서만 사용된다 (독립 사용 비권장, editor 인스턴스에 강하게 결합).
 *
 * props:
 *   - editor : useEditor()로 생성된 TipTap 에디터 인스턴스
 *   - headingLevels : 노출할 헤딩 레벨 목록 (기본 [1,2,3])
 *
 * 단축키: Ctrl+1(이모지) / Ctrl+2(특수문자) / Ctrl+.(글자색 순환) / Ctrl+/(배경색 순환)
 *         Ctrl+L(링크) / Ctrl+=,Ctrl+-(글자크기) / Ctrl+0(글자크기·글자색·배경색 초기화) / Ctrl+Shift+H(한자 변환)
 *         Ctrl+Shift+V(비디오·오디오·유튜브 삽입)
 */
import { useState, useRef, useEffect, useCallback, type ReactNode } from 'react'
import { useEditor } from '@tiptap/react'
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  List, ListOrdered, Quote, Baseline, Highlighter, Link2,
  Image as ImageIcon, Video, Table2, Columns2, Columns, Rows2, Rows, Trash2, RotateCcw,
} from 'lucide-react'
import HanjaSearchModal from '@/shared/components/editor/HanjaSearchModal'
import AssetPickerPopup from '@/shared/components/editor/AssetPickerPopup'
import MediaSelectorModal, { type MediaSelectPayload } from '@/shared/components/editor/MediaSelectorModal'
import { ROTATE_TEXT_COLORS, ROTATE_BG_COLORS, getNextColor } from '@/shared/components/editor/editorColors'
import type { AssetType } from '@/domain/asset/types/asset'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import { Input } from '@/shared/components/ui/input'

const HEADING_ICONS = { 1: Heading1, 2: Heading2, 3: Heading3 } as const

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

const BG_COLORS = [
  { label: '기본', value: '' },
  { label: '빨강', value: '#fecaca' },
  { label: '주황', value: '#fed7aa' },
  { label: '노랑', value: '#fef08a' },
  { label: '초록', value: '#bbf7d0' },
  { label: '파랑', value: '#bfdbfe' },
  { label: '보라', value: '#e9d5ff' },
  { label: '회색', value: '#e5e7eb' },
]

const FONT_SIZE_MIN = 10
const FONT_SIZE_MAX = 40
const FONT_SIZE_DEFAULT = 16
const FONT_SIZE_STEP = 2

interface TipTapMenuBarProps {
  editor: ReturnType<typeof useEditor>
  headingLevels?: (1 | 2 | 3)[]
}

interface AssetPopupState {
  atype: AssetType
  position: { x: number; y: number }
}

export default function TipTapMenuBar({ editor, headingLevels = [1, 2, 3] }: TipTapMenuBarProps) {
  const [showColors, setShowColors] = useState(false)
  const [showBgColors, setShowBgColors] = useState(false)
  const [assetPopup, setAssetPopup] = useState<AssetPopupState | null>(null)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const [linkUrl, setLinkUrl] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [hanjaOpen, setHanjaOpen] = useState(false)
  const [selectedWord, setSelectedWord] = useState('')
  const [mediaOpen, setMediaOpen] = useState(false)
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

  const openAssetPickerAtCaret = useCallback((atype: AssetType) => {
    if (!editor) return
    const { from } = editor.state.selection
    const coords = editor.view.coordsAtPos(from)
    setAssetPopup({ atype, position: { x: coords.left, y: coords.bottom + 4 } })
  }, [editor])

  const cycleTextColor = useCallback(() => {
    if (!editor) return
    const current = editor.getAttributes('textStyle').color as string | undefined
    const next = getNextColor(current, ROTATE_TEXT_COLORS)
    if (next) editor.chain().focus().setColor(next).run()
    else editor.chain().focus().unsetColor().run()
  }, [editor])

  const cycleBgColor = useCallback(() => {
    if (!editor) return
    const current = editor.getAttributes('highlight').color as string | undefined
    const next = getNextColor(current, ROTATE_BG_COLORS)
    if (next) editor.chain().focus().setHighlight({ color: next }).run()
    else editor.chain().focus().unsetHighlight().run()
  }, [editor])

  const openLinkPopover = useCallback(() => {
    if (!editor) return
    setLinkUrl((editor.getAttributes('link').href as string) || '')
    setShowLinkPopover(true)
  }, [editor])

  const changeFontSize = useCallback((delta: number) => {
    if (!editor) return
    const current = parseInt(String(editor.getAttributes('textStyle').fontSize || FONT_SIZE_DEFAULT), 10)
    const next = Math.min(FONT_SIZE_MAX, Math.max(FONT_SIZE_MIN, current + delta))
    if (next === FONT_SIZE_DEFAULT) editor.chain().focus().unsetFontSize().run()
    else editor.chain().focus().setFontSize(`${next}px`).run()
  }, [editor])

  const resetFontSize = useCallback(() => {
    if (!editor) return
    editor.chain().focus().unsetFontSize().unsetColor().unsetHighlight().run()
  }, [editor])

  useEffect(() => {
    if (!editor) return

    function onKeyDown(e: KeyboardEvent) {
      if (e.ctrlKey && e.shiftKey && e.key === 'H') {
        e.preventDefault()
        handleHanjaClick()
        return
      }
      if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'v') {
        e.preventDefault()
        setMediaOpen(true)
        return
      }
      if (!e.ctrlKey || e.shiftKey) return
      if (e.key === '1') { e.preventDefault(); openAssetPickerAtCaret('EMOJI') }
      else if (e.key === '2') { e.preventDefault(); openAssetPickerAtCaret('SYMBOL') }
      else if (e.key === '.') { e.preventDefault(); e.stopPropagation(); cycleTextColor() }
      else if (e.key === '/') { e.preventDefault(); cycleBgColor() }
      else if (e.key.toLowerCase() === 'l') { e.preventDefault(); openLinkPopover() }
      else if (e.key === '=' || e.key === '+') { e.preventDefault(); changeFontSize(FONT_SIZE_STEP) }
      else if (e.key === '-') { e.preventDefault(); changeFontSize(-FONT_SIZE_STEP) }
      else if (e.key === '0') { e.preventDefault(); resetFontSize() }
    }
    document.addEventListener('keydown', onKeyDown, { capture: true })
    return () => document.removeEventListener('keydown', onKeyDown, { capture: true })
  }, [editor, handleHanjaClick, openAssetPickerAtCaret, cycleTextColor, cycleBgColor, openLinkPopover, changeFontSize, resetFontSize])

  if (!editor) return null

  function handleHanjaSelect(hanja: string) {
    if (!selectionRef.current) return
    const { from, to } = selectionRef.current
    editor.chain().focus().deleteRange({ from, to }).insertContentAt(from, hanja).run()
    selectionRef.current = null
  }

  function handleAssetSelect(value: string) {
    editor?.chain().focus().insertContent(value).run()
    setAssetPopup(null)
  }

  function openAssetPickerAt(atype: AssetType, e: React.MouseEvent<HTMLButtonElement>) {
    const rect = e.currentTarget.getBoundingClientRect()
    setAssetPopup({ atype, position: { x: rect.left, y: rect.bottom + 4 } })
  }

  function applyLink() {
    if (!editor) return
    const url = linkUrl.trim()
    if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
    else editor.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowLinkPopover(false)
  }

  function removeLink() {
    editor?.chain().focus().extendMarkRange('link').unsetLink().run()
    setShowLinkPopover(false)
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

  const btn = (content: ReactNode, action: () => boolean, active?: boolean, title?: string, key?: string | number) => (
    <button
      key={key}
      type="button"
      title={title}
      onClick={() => action()}
      className={`flex items-center justify-center p-1.5 rounded transition-colors ${
        active ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
      }`}
    >
      {content}
    </button>
  )

  const icon = (Icon: typeof Bold, className = 'w-4 h-4') => <Icon className={className} />

  const currentColor = editor.getAttributes('textStyle').color || ''
  const currentBgColor = editor.getAttributes('highlight').color || ''

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {btn(icon(Bold), () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'), '굵게')}
      {btn(icon(Italic), () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'), '기울임')}
      {btn(icon(Strikethrough), () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'), '취소선')}
      <span className="w-px bg-gray-200 mx-1" />
      {headingLevels.map((level) =>
        btn(
          icon(HEADING_ICONS[level]),
          () => editor.chain().focus().toggleHeading({ level }).run(),
          editor.isActive('heading', { level }),
          `제목 ${level}`,
          `heading-${level}`
        ),
      )}
      <span className="w-px bg-gray-200 mx-1" />
      {btn(icon(List), () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'), '글머리 목록')}
      {btn(icon(ListOrdered), () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'), '번호 목록')}
      <span className="w-px bg-gray-200 mx-1" />
      {btn(icon(Quote), () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'), '인용')}
      <span className="w-px bg-gray-200 mx-1" />

      {/* 글씨 색상 */}
      <Popover open={showColors} onOpenChange={setShowColors}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="글자 색상 (Ctrl+.)"
            className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Baseline className="w-4 h-4" style={currentColor ? { color: currentColor } : undefined} />
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

      {/* 배경 색상 */}
      <Popover open={showBgColors} onOpenChange={setShowBgColors}>
        <PopoverTrigger asChild>
          <button
            type="button"
            title="배경 색상 (Ctrl+/)"
            className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <Highlighter className="w-4 h-4" style={currentBgColor ? { color: currentBgColor } : undefined} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-44 p-2" align="start">
          <div className="flex flex-wrap gap-1">
            {BG_COLORS.map((c) => (
              <button
                key={c.value}
                type="button"
                title={c.label}
                onClick={() => {
                  if (c.value) {
                    editor.chain().focus().setHighlight({ color: c.value }).run()
                  } else {
                    editor.chain().focus().unsetHighlight().run()
                  }
                  setShowBgColors(false)
                }}
                className="flex items-center gap-1.5 w-full px-2 py-1 text-xs rounded hover:bg-gray-50 text-left"
              >
                <span
                  className="inline-block w-4 h-4 rounded-sm border border-gray-300 flex-shrink-0"
                  style={{ backgroundColor: c.value || '#ffffff' }}
                />
                {c.label}
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <span className="w-px bg-gray-200 mx-1" />

      {/* 이모지 / 특수문자 */}
      <button
        type="button"
        onClick={(e) => openAssetPickerAt('EMOJI', e)}
        className="flex items-center justify-center p-1.5 text-base rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="이모지 삽입 (Ctrl+1)"
      >
        😀
      </button>
      <button
        type="button"
        onClick={(e) => openAssetPickerAt('SYMBOL', e)}
        className="flex items-center justify-center p-1.5 text-base rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="특수문자 삽입 (Ctrl+2)"
      >
        ※
      </button>
      {assetPopup && (
        <AssetPickerPopup
          atype={assetPopup.atype}
          position={assetPopup.position}
          onSelect={handleAssetSelect}
          onClose={() => setAssetPopup(null)}
        />
      )}

      {/* 링크 */}
      <Popover open={showLinkPopover} onOpenChange={setShowLinkPopover}>
        <PopoverTrigger asChild>
          <button
            type="button"
            onClick={openLinkPopover}
            title="링크 삽입 (Ctrl+L)"
            className={`flex items-center justify-center p-1.5 rounded transition-colors ${
              editor.isActive('link') ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            <Link2 className="w-4 h-4" />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-64 p-2" align="start">
          <div className="flex flex-col gap-2">
            <Input
              placeholder="https://example.com"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && applyLink()}
              className="text-sm"
              autoFocus
            />
            <div className="flex justify-end gap-1">
              {editor.isActive('link') && (
                <button
                  type="button"
                  onClick={removeLink}
                  className="px-2 py-1 text-xs rounded text-red-500 hover:bg-red-50"
                >
                  링크 해제
                </button>
              )}
              <button
                type="button"
                onClick={applyLink}
                className="px-2 py-1 text-xs rounded bg-blue-600 text-white hover:bg-blue-700"
              >
                적용
              </button>
            </div>
          </div>
        </PopoverContent>
      </Popover>

      {/* 글자 크기 */}
      <button
        type="button"
        onClick={() => changeFontSize(-FONT_SIZE_STEP)}
        className="flex items-center justify-center p-1.5 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="글자 축소 (Ctrl+-)"
      >
        가-
      </button>
      <button
        type="button"
        onClick={() => changeFontSize(FONT_SIZE_STEP)}
        className="flex items-center justify-center p-1.5 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="글자 확대 (Ctrl+=)"
      >
        가+
      </button>
      <button
        type="button"
        onClick={resetFontSize}
        className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="글자크기·글자색·배경색 초기화 (Ctrl+0)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>

      <span className="w-px bg-gray-200 mx-1" />

      {/* 이미지 파일 추가 */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="이미지 삽입"
      >
        <ImageIcon className="w-4 h-4" />
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

      {/* 비디오/오디오/유튜브 삽입 */}
      <button
        type="button"
        onClick={() => setMediaOpen(true)}
        className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="비디오·오디오·유튜브 삽입 (Ctrl+Shift+V)"
      >
        <Video className="w-4 h-4" />
      </button>
      <MediaSelectorModal
        open={mediaOpen}
        onClose={() => setMediaOpen(false)}
        onSelect={(payload: MediaSelectPayload) => {
          editor.chain().focus().insertContent({
            type: 'mediaEmbed',
            attrs: { mediaType: payload.type, src: payload.url, ytId: payload.ytId, label: payload.label },
          }).run()
          setMediaOpen(false)
        }}
      />

      {/* 테이블 */}
      <button
        type="button"
        onClick={() =>
          editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()
        }
        className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
        title="표 삽입 (3×3)"
      >
        <Table2 className="w-4 h-4" />
      </button>
      {editor.isActive('table') && (
        <>
          <button
            type="button"
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            title="열 추가"
          >
            <Columns2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            title="열 삭제"
          >
            <Columns className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            title="행 추가"
          >
            <Rows2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="flex items-center justify-center p-1.5 rounded text-gray-600 hover:bg-gray-100 transition-colors"
            title="행 삭제"
          >
            <Rows className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="flex items-center justify-center p-1.5 rounded text-red-500 hover:bg-red-50 transition-colors"
            title="표 삭제"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </>
      )}

      <span className="w-px bg-gray-200 mx-1" />

      {/* 한자 변환 */}
      {btn('漢', () => { handleHanjaClick(); return false }, false, '한자 변환 (선택 후, Ctrl+Shift+H)')}
      <HanjaSearchModal
        open={hanjaOpen}
        selectedWord={selectedWord}
        onClose={() => setHanjaOpen(false)}
        onSelect={handleHanjaSelect}
      />
    </div>
  )
}
