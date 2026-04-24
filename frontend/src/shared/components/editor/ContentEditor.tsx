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
 *
 * 날짜/카테고리 전환처럼 외부에서 내용을 통째로 바꿔야 할 때는
 * key prop을 바꿔 컴포넌트를 재마운트하면 syncedRef가 초기화되어 새 값이 반영된다.
 *   <ContentEditor key={diaryDate} value={content} onChange={setContent} />
 */
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ResizableImage from 'tiptap-extension-resize-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useImperativeHandle, useRef, forwardRef } from 'react'
import TipTapMenuBar from '@/shared/components/editor/TipTapMenuBar'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
  minHeight?: string
  headingLevels?: (1 | 2 | 3)[]
  onShiftTab?: () => void
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
}, ref) {
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const initialValueRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      // @ts-expect-error ResizableImage has no type declarations
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TextStyle,
      Color,
    ],
    content: initialValueRef.current,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: `min-h-[${minHeight}] px-4 py-3 focus:outline-none` },
      handleKeyDown(_view, event) {
        if (event.key === 'Tab' && event.shiftKey) {
          onShiftTab?.()
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
            const reader = new FileReader()
            reader.onload = (e) => {
              const src = e.target?.result as string
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              ;(editorRef.current?.chain().focus() as any)?.setImage({ src }).run()
            }
            reader.readAsDataURL(file)
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <TipTapMenuBar editor={editor} headingLevels={headingLevels} />
      <EditorContent editor={editor} />
    </div>
  )
})

export default ContentEditor
