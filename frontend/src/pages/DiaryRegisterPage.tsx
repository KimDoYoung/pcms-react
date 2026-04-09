import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import ResizableImage from 'tiptap-extension-resize-image'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { useState, useRef, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Paperclip, X, PanelRightOpen, PanelRightClose } from 'lucide-react'
import Toolbar from '@/components/Toolbar'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/components/ui/button'
import DiarySummaryList from '@/components/diary/DiarySummaryList'

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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ;(editor?.chain().focus() as any).setImage({ src }).run()
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

function DiaryRegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [searchParams] = useSearchParams()
  const today = new Date().toISOString().slice(0, 10)
  const [diaryDate, setDiaryDate] = useState(searchParams.get('date') ?? today)
  const [showList, setShowList] = useState(true)
  const [title, setTitle] = useState('')
  const [diaryId, setDiaryId] = useState<number | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([])

  const editorRef = useRef<ReturnType<typeof useEditor>>(null)

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({ placeholder: '오늘의 일지를 작성하세요...' }),
      //@ts-ignore
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

  useEffect(() => {
    async function fetchDiary() {
      try {
        const ymd = diaryDate.replace(/-/g, '')
        const res = await apiClient.get(`/diary/date/${ymd}`)
        
        if (res && typeof res === 'object' && 'id' in res) {
          setDiaryId((res as any).id)
          setTitle((res as any).summary || '')
          editor?.commands.setContent((res as any).content || '')
          setAttachments((res as any).attachments || [])
        } else {
          setDiaryId(null)
          setTitle('')
          editor?.commands.setContent('')
          setAttachments([])
        }
        setNewFiles([])
        setDeletedAttachmentIds([])
      } catch (e) {
        console.error('Failed to fetch diary', e)
        setDiaryId(null)
        setTitle('')
        editor?.commands.setContent('')
        setAttachments([])
        setNewFiles([])
        setDeletedAttachmentIds([])
      }
    }
    
    if (editor) {
      fetchDiary()
    }
  }, [diaryDate, editor])

  const changeDate = (days: number) => {
    const d = new Date(diaryDate)
    d.setDate(d.getDate() + days)
    setDiaryDate(d.toISOString().slice(0, 10))
  }

  const getDayOfWeek = (dateStr: string) => {
    try {
      const d = new Date(dateStr)
      return d.toLocaleDateString('ko-KR', { weekday: 'long' })
    } catch (e) {
      return ''
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          handleSubmit()
        } else if (e.key === 'ArrowLeft') {
          e.preventDefault()
          changeDate(-1)
        } else if (e.key === 'ArrowRight') {
          e.preventDefault()
          changeDate(1)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [diaryDate, title, diaryId, attachments, newFiles, deletedAttachmentIds, editor])

  async function handleSubmit() {
    const content = editor?.getHTML() ?? ''
  
    const diaryPayload = {
      id: diaryId,
      ymd: diaryDate.replace(/-/g, ''),
      summary: title,
      content,
      deletedAttachmentIds,
    }
  
    const formData = new FormData()
    formData.append(
      'diary',
      new Blob([JSON.stringify(diaryPayload)], { type: 'application/json' }),
    )
  
    newFiles.forEach((file) => formData.append('files', file))
  
    try {
      await apiClient.post<{ id: number }>('/diary', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      alert('저장되었습니다.')
      queryClient.invalidateQueries({ queryKey: ['diary-summary'] })

      // Refresh to get latest attachments
      const res = await apiClient.get(`/diary/date/${diaryPayload.ymd}`)
      if (res && typeof res === 'object' && 'id' in res) {
        setDiaryId((res as any).id)
        setAttachments((res as any).attachments || [])
        setNewFiles([])
        setDeletedAttachmentIds([])
      }
    } catch (e) {
      console.error(e)
      alert('저장 중 오류가 발생했습니다.')
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">✏️ 일지 등록/수정</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowList((v) => !v)}
            title={showList ? '목록 숨기기' : '목록 보기'}
            className="text-gray-500"
          >
            {showList ? <PanelRightClose className="w-5 h-5" /> : <PanelRightOpen className="w-5 h-5" />}
          </Button>
        </div>

        <div className="flex gap-4 items-start">
        <div className="flex-1 min-w-0 flex flex-col">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {/* 날짜 네비게이션 및 제목 */}
          <div className="flex flex-col sm:flex-row items-center gap-3 px-4 py-3 border-b border-gray-200">
            <div className="flex items-center gap-2 bg-gray-100 p-1 rounded-lg">
              <button 
                onClick={() => changeDate(-1)} 
                className="p-1 hover:bg-white rounded text-gray-600 shadow-sm transition-all"
                title="이전 날짜"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <input
                type="date"
                value={diaryDate}
                onChange={(e) => setDiaryDate(e.target.value)}
                className="text-sm font-medium text-gray-700 bg-transparent focus:outline-none cursor-pointer"
              />
              <span className="text-xs text-gray-400 font-medium px-1 select-none">
                {getDayOfWeek(diaryDate)}
              </span>
              <button 
                onClick={() => changeDate(1)} 
                className="p-1 hover:bg-white rounded text-gray-600 shadow-sm transition-all"
                title="다음 날짜"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            <div className="hidden sm:block w-px h-6 bg-gray-300 mx-2" />
            
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="제목을 입력하세요"
              className="flex-1 w-full text-lg font-semibold focus:outline-none placeholder:text-gray-300 bg-transparent"
            />
          </div>

          {/* 에디터 툴바 */}
          <MenuBar editor={editor} />

          {/* 에디터 본문 */}
          <EditorContent editor={editor} className="flex-1" />

          {/* 첨부파일 영역 */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> 첨부파일
              </h3>
              <button 
                onClick={() => document.getElementById('attachment-input')?.click()}
                className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors shadow-sm"
              >
                + 파일 추가
              </button>
              <input
                id="attachment-input"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const filesArray = Array.from(e.target.files);
                    console.log('Selected files:', filesArray);
                    setNewFiles(prev => [...prev, ...filesArray]);
                  }
                  e.target.value = '';
                }}
              />
            </div>

            {/* 첨부파일 목록 표시부 개선 */}
            <div className="flex flex-wrap gap-2 min-h-[40px] p-1">
              {attachments.length === 0 && newFiles.length === 0 && (
                <span className="text-xs text-gray-300 italic py-2">첨부된 파일이 없습니다.</span>
              )}
              
              {attachments.map(att => (
                <div key={att.fileId} className="flex items-center gap-2 text-sm text-gray-600 bg-white px-2.5 py-1.5 border border-gray-200 rounded-md shadow-sm">
                  <Paperclip className="w-3 h-3 text-gray-400" />
                  <span className="truncate max-w-[150px]" title={att.orgFileName}>{att.orgFileName}</span>
                  <button 
                    onClick={() => {
                      setDeletedAttachmentIds(prev => [...prev, att.fileId])
                      setAttachments(prev => prev.filter(a => a.fileId !== att.fileId))
                    }} 
                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {newFiles.map((file, idx) => (
                <div key={`new-${file.name}-${idx}`} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded-md shadow-sm animate-in fade-in slide-in-from-bottom-1">
                  <Paperclip className="w-3 h-3 text-blue-400" />
                  <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
                  <span className="text-[10px] text-blue-500 bg-blue-100 px-1 rounded font-bold">NEW</span>
                  <button 
                    onClick={() => setNewFiles(prev => prev.filter((_, i) => i !== idx))} 
                    className="text-blue-400 hover:text-red-500 hover:bg-red-50 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>{/* editor card end */}

        {/* 저장 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => navigate('/diary')}>
            취소
          </Button>
          <Button variant="default" onClick={handleSubmit} disabled={!title.trim()}>
            저장
          </Button>
          <Button variant="ghost" onClick={() => navigate('/diary')}>
            목록으로
          </Button>
        </div>

        </div>{/* left col end */}

        {/* 일지 목록 패널 */}
        {showList && (
          <div className="w-[432px] shrink-0 bg-white rounded-xl shadow-sm border border-gray-200 p-3 self-start sticky top-4">
            <DiarySummaryList
              onSelect={(ymd) => setDiaryDate(ymd)}
            />
          </div>
        )}

        </div>{/* flex row end */}
      </main>
    </div>
  )
}

export default DiaryRegisterPage
