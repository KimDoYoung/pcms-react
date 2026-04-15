import { useState, useEffect } from 'react'
import ContentEditor from '@/shared/components/editor/ContentEditor'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDayOfWeek, formatYmd, formatDate } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose } from 'lucide-react'
import Toolbar from '@/shared/layout/Toolbar'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import AttachmentUploader from '@/shared/components/AttachmentUploader'
import DiarySummaryList from '@/domain/diary/components/DiarySummaryList'
import { useMessage } from '@/shared/hooks/useMessage'

function DiaryRegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()
  const [searchParams] = useSearchParams()
  const today = formatDate(new Date(), false)
  const [diaryDate, setDiaryDate] = useState(searchParams.get('date') ?? today)
  const [showList, setShowList] = useState(true)
  const [title, setTitle] = useState('')
  const [diaryId, setDiaryId] = useState<number | null>(null)
  const [content, setContent] = useState('')
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [attachments, setAttachments] = useState<any[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [deletedAttachmentIds, setDeletedAttachmentIds] = useState<number[]>([])
  const [contentReady, setContentReady] = useState(false)
  // 저장된 시점의 스냅샷 — 현재 값과 비교해 변경 여부 판단
  const [savedSnapshot, setSavedSnapshot] = useState('')

  useEffect(() => {
    setContentReady(false)
    async function fetchDiary() {
      try {
        const ymd = formatYmd(diaryDate)
        const res = await apiClient.get(`/diary/date/${ymd}`)

        if (res && typeof res === 'object' && 'id' in res) {
          const loadedTitle = (res as any).summary || ''
          const loadedContent = (res as any).content || ''
          setDiaryId((res as any).id)
          setTitle(loadedTitle)
          setContent(loadedContent)
          setAttachments((res as any).attachments || [])
          setSavedSnapshot(JSON.stringify({ title: loadedTitle, content: loadedContent }))
        } else {
          setDiaryId(null)
          setTitle('')
          setContent('')
          setAttachments([])
          setSavedSnapshot(JSON.stringify({ title: '', content: '' }))
        }
        setNewFiles([])
        setDeletedAttachmentIds([])
      } catch (e) {
        console.error('Failed to fetch diary', e)
        setDiaryId(null)
        setTitle('')
        setContent('')
        setAttachments([])
        setNewFiles([])
        setDeletedAttachmentIds([])
        setSavedSnapshot(JSON.stringify({ title: '', content: '' }))
      } finally {
        setContentReady(true)
      }
    }

    fetchDiary()
  }, [diaryDate])

  const isDirty =
    JSON.stringify({ title, content }) !== savedSnapshot ||
    newFiles.length > 0 ||
    deletedAttachmentIds.length > 0

  const changeDate = (days: number) => {
    const d = new Date(diaryDate)
    d.setDate(d.getDate() + days)
    setDiaryDate(d.toISOString().slice(0, 10))
  }

  async function handleSubmit() {
    const diaryPayload = {
      id: diaryId,
      ymd: formatYmd(diaryDate),
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
      showMessage('저장되었습니다.', 'success')
      
      // 관련 쿼리 무효화 및 갱신 대기
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['diary-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['diary-list'] })
      ])

      // Refresh to get latest attachments
      const res = await apiClient.get(`/diary/date/${diaryPayload.ymd}`)
      if (res && typeof res === 'object' && 'id' in res) {
        setDiaryId((res as any).id)
        setAttachments((res as any).attachments || [])
        setNewFiles([])
        setDeletedAttachmentIds([])
        setSavedSnapshot(JSON.stringify({ title, content }))
      }
    } catch (e) {
      console.error(e)
      showMessage('저장 중 오류가 발생했습니다.', 'error')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          const dirty =
            JSON.stringify({ title, content }) !== savedSnapshot ||
            newFiles.length > 0 ||
            deletedAttachmentIds.length > 0
          if (dirty && title.trim()) handleSubmit()
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
  }, [diaryDate, title, content, savedSnapshot, diaryId, attachments, newFiles, deletedAttachmentIds])

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center gap-2">
          <h1 className="text-xl font-bold text-gray-800">✏️ 일지 등록/수정</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowList((v) => !v)}
            title={showList ? '목록 숨기기' : '목록 보기'}
            className="text-gray-500"
          >
            {showList ? <PanelRightOpen className="w-5 h-5" /> : <PanelRightClose className="w-5 h-5" />}
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

          {/* 에디터 본문 */}
          {contentReady && (
            <ContentEditor
              key={diaryDate}
              value={content}
              onChange={setContent}
              placeholder="오늘의 일지를 작성하세요..."
              minHeight="400px"
            />
          )}

          {/* 첨부파일 영역 */}
          <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-xl">
            <AttachmentUploader
              attachments={attachments}
              newFiles={newFiles}
              onRemoveAttachment={(fileId) => {
                setDeletedAttachmentIds((prev) => [...prev, fileId])
                setAttachments((prev) => prev.filter((a) => a.fileId !== fileId))
              }}
              onAddFiles={(files) => setNewFiles((prev) => [...prev, ...files])}
              onRemoveNewFile={(idx) => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
              inputId="diary-attachment-input"
            />
          </div>
        </div>{/* editor card end */}

        {/* 저장 버튼 */}
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="cancel" size="pill" onClick={() => navigate('/diary')}>
            취소
          </Button>
          <Button variant="action" size="pill" onClick={handleSubmit} disabled={!title.trim() || !isDirty}>
            저장
          </Button>
          <Button variant="init"  size="pill" onClick={() => navigate('/diary')}>
            일지찾기
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
