import { useState, useEffect, useCallback, useRef } from 'react'
import ContentEditor from '@/shared/components/editor/ContentEditor'
import type { ContentEditorHandle } from '@/shared/components/editor/ContentEditor'
import { useNavigate, useSearchParams, useBlocker } from 'react-router-dom'
import { getDayOfWeek, formatYmd, formatDate } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, PanelRightOpen, PanelRightClose, RotateCcw, AlertCircle } from 'lucide-react'
import Toolbar from '@/shared/layout/Toolbar'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
import AttachmentUploader from '@/shared/components/AttachmentUploader'
import DiarySummaryList from '@/domain/diary/components/DiarySummaryList'
import { useMessage } from '@/shared/hooks/useMessage'

interface DiaryApiResponse {
  id: number
  summary?: string
  content?: string
  attachments?: { fileId: number; [key: string]: unknown }[]
}

function DiaryRegisterPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const { showMessage } = useMessage()
  const [searchParams, setSearchParams] = useSearchParams()
  const today = formatDate(new Date(), false)
  const diaryDate = searchParams.get('date') ?? today
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
  const [hasDraft, setHasDraft] = useState(false)
  const isSubmitting = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const contentEditorRef = useRef<ContentEditorHandle>(null)

  const getAutoSaveKey = useCallback((date: string) => `diary-autosave-${formatYmd(date)}`, [])

  useEffect(() => {
    setContentReady(false)
    async function fetchDiary() {
      try {
        const ymd = formatYmd(diaryDate)
        const res = await apiClient.get<DiaryApiResponse | null>(`/diary/date/${ymd}`)

        let loadedTitle = ''
        let loadedContent = ''

        if (res && typeof res === 'object' && 'id' in res) {
          loadedTitle = res.summary || ''
          loadedContent = res.content || ''
          setDiaryId(res.id)
          setTitle(loadedTitle)
          setContent(loadedContent)
          setAttachments(res.attachments || [])
        } else {
          setDiaryId(null)
          setTitle('')
          setContent('')
          setAttachments([])
        }
        
        const snapshot = JSON.stringify({ title: loadedTitle, content: loadedContent })
        setSavedSnapshot(snapshot)
        setNewFiles([])
        setDeletedAttachmentIds([])

        // Check for localStorage draft
        const draft = localStorage.getItem(getAutoSaveKey(diaryDate))
        if (draft) {
          const parsedDraft = JSON.parse(draft)
          if (parsedDraft.title !== loadedTitle || parsedDraft.content !== loadedContent) {
            setHasDraft(true)
          } else {
            setHasDraft(false)
            localStorage.removeItem(getAutoSaveKey(diaryDate))
          }
        } else {
          setHasDraft(false)
        }

      } catch (e) {
        console.error('Failed to fetch diary', e)
        setDiaryId(null)
        setTitle('')
        setContent('')
        setAttachments([])
        setNewFiles([])
        setDeletedAttachmentIds([])
        setSavedSnapshot(JSON.stringify({ title: '', content: '' }))
        setHasDraft(false)
      } finally {
        setContentReady(true)
      }
    }

    fetchDiary()
  }, [diaryDate, getAutoSaveKey])

  const isDirty =
    JSON.stringify({ title, content }) !== savedSnapshot ||
    newFiles.length > 0 ||
    deletedAttachmentIds.length > 0

  // 1. LocalStorage Auto-save (Debounced)
  useEffect(() => {
    if (!contentReady || !isDirty) return

    const timer = setTimeout(() => {
      localStorage.setItem(
        getAutoSaveKey(diaryDate),
        JSON.stringify({ title, content, updatedAt: new Date().toISOString() })
      )
    }, 2000)

    return () => clearTimeout(timer)
  }, [title, content, diaryDate, getAutoSaveKey, contentReady, isDirty])

  // 2. Browser Unload Protection
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty && !isSubmitting.current) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [isDirty])

  const changeDate = useCallback((days: number) => {
    const d = new Date(diaryDate)
    d.setDate(d.getDate() + days)
    const newDate = d.toISOString().slice(0, 10)
    setSearchParams({ date: newDate })
  }, [diaryDate, setSearchParams])

  const handleSubmit = useCallback(async (silent = false) => {
    if (!title.trim() || isSubmitting.current) return
    isSubmitting.current = true

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
      
      if (!silent) {
        showMessage('저장되었습니다.', 'success')
      }
      
      // Clear auto-save draft
      localStorage.removeItem(getAutoSaveKey(diaryDate))
      setHasDraft(false)

      // 관련 쿼리 무효화 및 갱신 대기
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['diary-summary'] }),
        queryClient.invalidateQueries({ queryKey: ['diary-list'] })
      ])

      // silent인 경우(이동 중)에는 상태 업데이트 스킵 (어차피 언마운트되거나 새 날짜가 로드됨)
      if (silent) return true

      // Refresh to get latest attachments
      const res = await apiClient.get<DiaryApiResponse | null>(`/diary/date/${diaryPayload.ymd}`)
      if (res && typeof res === 'object' && 'id' in res) {
        setDiaryId(res.id)
        setAttachments(res.attachments || [])
        setNewFiles([])
        setDeletedAttachmentIds([])
        setSavedSnapshot(JSON.stringify({ title, content }))
      }
      return true
    } catch (e) {
      console.error(e)
      if (!silent) {
        showMessage('저장 중 오류가 발생했습니다.', 'error')
      }
      return false
    } finally {
      isSubmitting.current = false
    }
  }, [diaryId, diaryDate, title, content, deletedAttachmentIds, newFiles, queryClient, showMessage, getAutoSaveKey])

  // 3. Navigation Blocking & Auto Save
  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && (currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search)
  )

  useEffect(() => {
    if (blocker.state === 'blocked') {
      const handleAutoSaveAndProceed = async () => {
        if (title.trim()) {
          const success = await handleSubmit(true)
          if (success) {
            blocker.proceed()
          } else {
            if (window.confirm('저장에 실패했습니다. 무시하고 이동하시겠습니까?')) {
              blocker.proceed()
            } else {
              blocker.reset()
            }
          }
        } else {
          if (window.confirm('제목이 없어 자동 저장할 수 없습니다. 변경사항을 무시하고 이동하시겠습니까?')) {
            blocker.proceed()
          } else {
            blocker.reset()
          }
        }
      }
      handleAutoSaveAndProceed()
    }
  }, [blocker, handleSubmit, title])

  const handleRestore = () => {
    const draft = localStorage.getItem(getAutoSaveKey(diaryDate))
    if (draft) {
      const { title: dTitle, content: dContent } = JSON.parse(draft)
      setTitle(dTitle)
      setContent(dContent)
      setHasDraft(false)
      showMessage('임시 저장된 데이터를 불러왔습니다.', 'info')
    }
  }

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey) {
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault()
          if (isDirty && title.trim()) handleSubmit()
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
  }, [diaryDate, title, content, savedSnapshot, diaryId, attachments, newFiles, deletedAttachmentIds, handleSubmit, changeDate, isDirty])

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-4 py-6">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
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
          
          {hasDraft && (
            <div className="flex items-center gap-2 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-lg shadow-sm animate-in fade-in slide-in-from-top-2">
              <AlertCircle className="w-4 h-4 text-amber-500" />
              <span className="text-sm font-medium text-amber-800">작성 중이던 임시 저장 데이터가 있습니다.</span>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleRestore}
                className="h-7 px-2 text-xs border-amber-300 hover:bg-amber-100 text-amber-900 gap-1"
              >
                <RotateCcw className="w-3 h-3" />
                복구하기
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setHasDraft(false)}
                className="h-7 px-2 text-xs text-amber-600 hover:text-amber-800"
              >
                무시
              </Button>
            </div>
          )}
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
                onChange={(e) => setSearchParams({ date: e.target.value })}
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
              ref={titleRef}
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Tab' && !e.shiftKey) {
                  e.preventDefault()
                  contentEditorRef.current?.focus()
                }
              }}
              placeholder="제목을 입력하세요"
              className="flex-1 w-full text-lg font-semibold focus:outline-none placeholder:text-gray-300 bg-transparent"
            />
          </div>

          {/* 에디터 본문 */}
          {contentReady && (
            <ContentEditor
              ref={contentEditorRef}
              key={diaryDate}
              value={content}
              onChange={setContent}
              placeholder="오늘의 일지를 작성하세요..."
              minHeight="400px"
              onShiftTab={() => titleRef.current?.focus()}
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
          <Button 
            variant="action" 
            size="pill" 
            onClick={() => handleSubmit()} 
            disabled={!title.trim() || !isDirty || isSubmitting.current}
          >
            {isSubmitting.current ? '저장 중...' : '저장'}
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
              onSelect={(ymd) => setSearchParams({ date: ymd })}
            />
          </div>
        )}

        </div>{/* flex row end */}
      </main>
      {blocker.state === 'blocked' && (
        <div className="fixed inset-0 bg-black/20 backdrop-blur-[1px] z-[9999] flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center gap-4">
            <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="font-medium text-gray-700">변경사항을 저장하고 이동 중입니다...</p>
          </div>
        </div>
      )}
    </div>
  )
}

export default DiaryRegisterPage
