import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ResizableImage from 'tiptap-extension-resize-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useEffect, useRef, useState } from 'react'

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

function Toolbar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [showColors, setShowColors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  const btn = (label: string, action: () => boolean, active?: boolean) => (
    <button
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

  function insertImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(editor?.chain().focus() as any).setImage({ src }).run()
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="flex flex-wrap gap-1 px-3 py-2 border-b border-gray-200 bg-gray-50 rounded-t-lg">
      {btn('B', () => editor.chain().focus().toggleBold().run(), editor.isActive('bold'))}
      {btn('I', () => editor.chain().focus().toggleItalic().run(), editor.isActive('italic'))}
      {btn('S', () => editor.chain().focus().toggleStrike().run(), editor.isActive('strike'))}
      <span className="w-px bg-gray-200 mx-1" />
      {btn('H2', () => editor.chain().focus().toggleHeading({ level: 2 }).run(), editor.isActive('heading', { level: 2 }))}
      {btn('H3', () => editor.chain().focus().toggleHeading({ level: 3 }).run(), editor.isActive('heading', { level: 3 }))}
      <span className="w-px bg-gray-200 mx-1" />
      {btn('• 목록', () => editor.chain().focus().toggleBulletList().run(), editor.isActive('bulletList'))}
      {btn('1. 목록', () => editor.chain().focus().toggleOrderedList().run(), editor.isActive('orderedList'))}
      <span className="w-px bg-gray-200 mx-1" />
      {btn('인용', () => editor.chain().focus().toggleBlockquote().run(), editor.isActive('blockquote'))}
      <span className="w-px bg-gray-200 mx-1" />

      {/* 글씨 색상 */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setShowColors((v) => !v)}
          className="flex items-center gap-1 px-2 py-1 text-sm rounded text-gray-600 hover:bg-gray-100 transition-colors"
        >
          <span
            className="inline-block w-4 h-4 rounded-sm border border-gray-300"
            style={{ backgroundColor: currentColor || '#000000' }}
          />
          <span>색상</span>
          <span className="text-xs opacity-50">▾</span>
        </button>
        {showColors && (
          <div className="absolute top-full left-0 mt-1 z-30 bg-white border border-gray-200 rounded-lg shadow-lg p-2 flex flex-wrap gap-1 w-44">
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
        )}
      </div>

      <span className="w-px bg-gray-200 mx-1" />

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
    </div>
  )
}

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
      <Toolbar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  )
}
