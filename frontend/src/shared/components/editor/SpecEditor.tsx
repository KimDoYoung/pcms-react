import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ResizableImage from 'tiptap-extension-resize-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useRef } from 'react'
import TipTapMenuBar from '@/shared/components/editor/TipTapMenuBar'

interface Props {
  value: string
  onChange: (html: string) => void
  placeholder?: string
}

export default function SpecEditor({ value, onChange, placeholder = '스펙/특징을 입력하세요...' }: Props) {
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)
  const initialValueRef = useRef(value)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder }),
      // @ts-ignore
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TextStyle,
      Color,
    ],
    content: initialValueRef.current,
    onUpdate({ editor }) {
      onChange(editor.getHTML())
    },
    editorProps: {
      attributes: { class: 'min-h-[250px] px-4 py-3 focus:outline-none' },
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

  // 외부에서 value가 처음 들어올 때(edit 모드에서 데이터 로드 후) 한 번만 세팅
  const syncedRef = useRef(false)
  useEffect(() => {
    if (!editor || syncedRef.current) return
    if (value) {
      editor.commands.setContent(value)
      syncedRef.current = true
    }
  }, [editor, value])

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden bg-white">
      <TipTapMenuBar editor={editor} headingLevels={[2, 3]} />
      <EditorContent editor={editor} />
    </div>
  )
}
