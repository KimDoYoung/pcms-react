/**
 * 공통 TipTap 리치 텍스트 에디터 컴포넌트
 *
 * 사용법:
 *   <ContentEditor value={html} onChange={setHtml} />
 *   <ContentEditor value={html} onChange={setHtml} minHeight="400px" headingLevels={[1,2,3]} />
 *
 * - value : 외부에서 주입하는 HTML 문자열 (편집 모드에서 비동기 로드 지원)
 * - onChange : 내용이 바뀔 때 HTML 문자열로 콜백
 * - minHeight : 에디터 최소 높이 (기본 250px)
 * - headingLevels : 툴바에 노출할 헤딩 레벨 (기본 [1,2,3])
 * - placeholder : 빈 상태 안내 문구
 * - onSave : Ctrl+S(맥은 Cmd+S) 저장 콜백. 지정하면 브라우저 기본 "페이지 저장" 다이얼로그를 막고 대신 호출한다.
 *
 * 우클릭 시 서식 지정용 컨텍스트 메뉴(2열 그리드)가 뜬다: Bold/Italic/Strike/Link, Bullet List/Number List/Quote/Table,
 * 이모지/상용구/이미지삽입/미디어삽입/한자변환, 모든 서식 제거, 글자색·배경색 스와치.
 * 화면 경계에 가까우면 메뉴 위치가 자동 보정된다.
 *
 * 날짜/카테고리 전환처럼 외부에서 내용을 통째로 바꿔야 할 때는
 * key prop을 바꿔 컴포넌트를 재마운트하면 syncedRef가 초기화되어 새 값이 반영된다.
 *   <ContentEditor key={diaryDate} value={content} onChange={setContent} />
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ResizableInlineImage from '@/shared/components/editor/ResizableInlineImage'
import MediaEmbedExtension from '@/shared/components/editor/MediaEmbedExtension'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { Highlight } from '@tiptap/extension-highlight'
import { Link } from '@tiptap/extension-link'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableHeader } from '@tiptap/extension-table-header'
import { TableCell } from '@tiptap/extension-table-cell'
import { FontSize } from '@/shared/components/editor/FontSizeExtension'
import { useEffect, useImperativeHandle, useRef, useState, forwardRef } from 'react'
import TipTapMenuBar, { type TipTapMenuBarHandle } from '@/shared/components/editor/TipTapMenuBar'
import EditorContextMenu, { type EditorContextMenuEntry } from '@/shared/components/editor/EditorContextMenu'
import ColorSwatchRow from '@/shared/components/editor/ColorSwatchRow'
import { ROTATE_TEXT_COLORS, ROTATE_BG_COLORS } from '@/shared/components/editor/editorColors'
import { apiClient } from '@/lib/apiClient'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  headingLevels?: (1 | 2 | 3)[]
  onShiftTab?: () => void
  onSave?: () => void
}

export interface ContentEditorHandle {
  focus: () => void
}

const ContentEditor = forwardRef<ContentEditorHandle, Props>(function ContentEditor({
  value,
  onChange,
  placeholder = '내용을 입력하세요...',
  minHeight = '250px',
  headingLevels,
  onShiftTab,
  onSave,
}, ref) {
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const menuBarRef = useRef<TipTapMenuBarHandle>(null)
  const initialValueRef = useRef(value)
  const onSaveRef = useRef(onSave)
  const [menuPos, setMenuPos] = useState<{ x: number; y: number; visible: boolean }>({ x: 0, y: 0, visible: false })

  useEffect(() => {
    onSaveRef.current = onSave
  }, [onSave])

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: headingLevels || [1, 2, 3],
        },
        link: false,
      }),
      Placeholder.configure({ placeholder }),
      ResizableInlineImage.configure({ allowBase64: true }),
      MediaEmbedExtension,
      TextStyle,
      Color,
      FontSize,
      Highlight.configure({ multicolor: true }),
      Link.configure({ openOnClick: false, autolink: true }),
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
    ],
    content: initialValueRef.current,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: `markdown-body ProseMirror min-h-[${minHeight}] px-4 py-3 focus:outline-none` },
      handleKeyDown(_view, event) {
        if (event.key === 'Tab' && event.shiftKey) {
          onShiftTab?.()
          return true
        }
        // Ctrl+.(글자색 순환) 이 브라우저/OS 기본 이모지 패널과 충돌하므로
        // ProseMirror 단계에서 최대한 먼저 preventDefault 처리
        if (event.ctrlKey && !event.shiftKey && !event.altKey && event.key === '.') {
          event.preventDefault()
        }
        // Ctrl+S(맥 Cmd+S)는 브라우저 기본 "페이지 저장" 다이얼로그로 먼저 먹혀버리므로 여기서 가로챈다.
        if ((event.ctrlKey || event.metaKey) && !event.shiftKey && !event.altKey && event.key.toLowerCase() === 's') {
          event.preventDefault()
          onSaveRef.current?.()
          return true
        }
        return false
      },
      handlePaste(_view, event) {
        const items = event.clipboardData?.items
        if (!items) return false
        for (const item of Array.from(items)) {
          if (item.type.startsWith('image/')) {
            event.preventDefault()
            const file = item.getAsFile()
            if (!file) continue
            console.log('[ContentEditor] image paste detected:', file.name, file.type, file.size)
            const formData = new FormData()
            formData.append('file', file)
            apiClient
              .post<{ url: string }>('/files/editor-image', formData)
              .then(({ url }) => {
                editorRef.current?.chain().focus().setImage({ src: url }).run()
              })
              .catch((err) => {
                console.error('[ContentEditor] image upload failed:', err)
              })
            return true
          }
        }
        return false
      },
    },
  })

  useEffect(() => {
    editorRef.current = editor
  }, [editor])

  useImperativeHandle(ref, () => ({
    focus: () => editorRef.current?.commands.focus(),
  }))

  // 외부에서 value가 처음 들어올 때(편집 모드 비동기 로드) 한 번만 동기화.
  // key prop 변경으로 재마운트하면 syncedRef가 초기화되어 다음 value도 반영된다.
  const syncedRef = useRef(false)
  useEffect(() => {
    if (!editor || syncedRef.current) return
    editor.commands.setContent(value ?? '')
    syncedRef.current = true
  }, [editor, value])

  // 우클릭 컨텍스트 메뉴: 바깥 클릭 시 닫기
  useEffect(() => {
    const handleClick = () => setMenuPos((prev) => ({ ...prev, visible: false }))
    window.addEventListener('click', handleClick)
    return () => window.removeEventListener('click', handleClick)
  }, [])

  function handleContextMenu(e: React.MouseEvent) {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY, visible: true })
  }

  function runAndCloseMenu(action: () => void) {
    action()
    setMenuPos((prev) => ({ ...prev, visible: false }))
  }

  const contextMenuItems: EditorContextMenuEntry[] = editor
    ? [
        { label: 'Bold', shortcut: 'Ctrl+B', onClick: () => runAndCloseMenu(() => editor.chain().focus().toggleBold().run()) },
        { label: 'Italic', shortcut: 'Ctrl+I', onClick: () => runAndCloseMenu(() => editor.chain().focus().toggleItalic().run()) },
        { label: 'Strike', shortcut: 'Ctrl+Shift+S', onClick: () => runAndCloseMenu(() => editor.chain().focus().toggleStrike().run()) },
        {
          label: 'Link',
          shortcut: 'Ctrl+L',
          onClick: () =>
            runAndCloseMenu(() => {
              const url = prompt('URL을 입력하세요:')
              if (url) editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run()
            }),
        },
        { divider: true },
        { label: 'Bullet List', onClick: () => runAndCloseMenu(() => editor.chain().focus().toggleBulletList().run()) },
        { label: 'Number List', onClick: () => runAndCloseMenu(() => editor.chain().focus().toggleOrderedList().run()) },
        { label: 'Quote', onClick: () => runAndCloseMenu(() => editor.chain().focus().toggleBlockquote().run()) },
        {
          label: 'Table',
          onClick: () => runAndCloseMenu(() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()),
        },
        { divider: true },
        { label: '이모지', shortcut: 'Ctrl+1', onClick: () => runAndCloseMenu(() => menuBarRef.current?.openAssetPicker('EMOJI')) },
        { label: '상용구', onClick: () => runAndCloseMenu(() => menuBarRef.current?.openAssetPicker('PHRASE')) },
        { label: '이미지 삽입', shortcut: 'Ctrl+5', onClick: () => runAndCloseMenu(() => menuBarRef.current?.openImageFilePicker()) },
        { label: '미디어 삽입', shortcut: 'Ctrl+Shift+V', onClick: () => runAndCloseMenu(() => menuBarRef.current?.openMedia()) },
        { label: '한자 변환', shortcut: 'Ctrl+Shift+H', onClick: () => runAndCloseMenu(() => menuBarRef.current?.openHanja()) },
        {
          label: '모든 서식 제거',
          onClick: () =>
            runAndCloseMenu(() => editor.chain().focus().unsetAllMarks().clearNodes().run()),
        },
        { divider: true },
        {
          custom: true,
          content: (
            <ColorSwatchRow
              label="글자 색상 (Ctrl+.)"
              colors={ROTATE_TEXT_COLORS}
              mode="text"
              onPick={(hex) => runAndCloseMenu(() => editor.chain().focus().setColor(hex).run())}
              onClear={() => runAndCloseMenu(() => editor.chain().focus().unsetColor().run())}
            />
          ),
        },
        {
          custom: true,
          content: (
            <ColorSwatchRow
              label="배경 색상 (Ctrl+/)"
              colors={ROTATE_BG_COLORS}
              mode="bg"
              onPick={(hex) => runAndCloseMenu(() => editor.chain().focus().setHighlight({ color: hex }).run())}
              onClear={() => runAndCloseMenu(() => editor.chain().focus().unsetHighlight().run())}
            />
          ),
        },
      ]
    : []

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white" onContextMenu={handleContextMenu}>
      <TipTapMenuBar ref={menuBarRef} editor={editor} headingLevels={headingLevels} />
      <EditorContent editor={editor} />
      <EditorContextMenu x={menuPos.x} y={menuPos.y} visible={menuPos.visible} items={contextMenuItems} />
    </div>
  )
})

export default ContentEditor
