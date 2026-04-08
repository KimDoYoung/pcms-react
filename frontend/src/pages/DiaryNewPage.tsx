import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ResizableImage from 'tiptap-extension-resize-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Toolbar from '@/components/Toolbar'

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

function MenuBar({ editor }: { editor: ReturnType<typeof useEditor> }) {
  const [showColors, setShowColors] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  if (!editor) return null

  function insertImageFile(file: File) {
    const reader = new FileReader()
    reader.onload = (e) => {
      const src = e.target?.result as string
      editor?.chain().focus().setImage({ src }).run()
    }
    reader.readAsDataURL(file)
  }

  const btn = (label: string, action: () => boolean, active?: boolean) => (
    <button
      type="button"
      onClick={() => action()}
      className={`px-2 py-1 text-sm rounded transition-colors ${
        active
          ? 'bg-blue-100 text-blue-700 font-semibold'
          : 'text-gray-600 hover:bg-gray-100'
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
      {btn('H1', () => editor.chain().focus().toggleHeading({ level: 1 }).run(), editor.isActive('heading', { level: 1 }))}
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

    </div>
  )
}

function DiaryNewPage() {
  const navigate = useNavigate()
  const today = new Date().toISOString().slice(0, 10)
  const [title, setTitle] = useState('')
  const [diaryDate, setDiaryDate] = useState(today)
  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '오늘의 일지를 작성하세요...' }),
      ResizableImage.configure({ inline: false, allowBase64: true }),
      TextStyle,
      Color,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'min-h-[400px] px-4 py-3 focus:outline-none',
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
              editorRef.current?.chain().focus().setImage({ src }).run()
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

  async function handleSubmit() {
    const content = editor?.getHTML() ?? ''
    // TODO: POST /diary API 연동
    console.log({ title, diaryDate, content })
    navigate('/diary')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6 max-w-3xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-800">✏️ 일지 작성</h1>
          <button
            onClick={() => navigate('/diary')}
            className="text-sm text-gray-500 hover:text-gray-700"
          >
            ← 목록으로
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {/* 제목 / 날짜 */}
          <div className="flex gap-3 px-4 py-3 border-b border-gray-200">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="flex-1 text-lg font-semibold focus:outline-none placeholder:text-gray-300"
            />
            <input
              type="date"
              value={diaryDate}
              onChange={(e) => setDiaryDate(e.target.value)}
              className="text-sm text-gray-500 focus:outline-none cursor-pointer"
            />
          </div>

          {/* 에디터 툴바 */}
          <MenuBar editor={editor} />

          {/* 에디터 본문 */}
          <EditorContent editor={editor} />
        </div>

        {/* 저장 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <button
            onClick={() => navigate('/diary')}
            className="px-5 py-2 rounded-lg border border-gray-200 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleSubmit}
            disabled={!title.trim()}
            className="px-5 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            저장
          </button>
        </div>
      </main>
    </div>
  )
}

export default DiaryNewPage
