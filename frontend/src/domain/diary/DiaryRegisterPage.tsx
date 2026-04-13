import { useState, useEffect } from 'react'
import ContentEditor from '@/shared/components/editor/ContentEditor'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { getDayOfWeek, formatYmd, formatDate } from '@/lib/utils'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, Paperclip, X, PanelRightOpen, PanelRightClose } from 'lucide-react'
import Toolbar from '@/shared/components/Toolbar'
import { apiClient } from '@/lib/apiClient'
import { Button } from '@/shared/components/ui/button'
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

  useEffect(() => {
    async function fetchDiary() {
      try {
        const ymd = formatYmd(diaryDate)
        const res = await apiClient.get(`/diary/date/${ymd}`)
        
        if (res && typeof res === 'object' && 'id' in res) {
          setDiaryId((res as any).id)
          setTitle((res as any).summary || '')
          setContent((res as any).content || '')
          setAttachments((res as any).attachments || [])
        } else {
          setDiaryId(null)
          setTitle('')
          setContent('')
          setAttachments([])
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
      }
    }
    
    fetchDiary()
  }, [diaryDate])

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
  }, [diaryDate, title, diaryId, attachments, newFiles, deletedAttachmentIds])

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
          <ContentEditor
            key={diaryDate}
            value={content}
            onChange={setContent}
            placeholder="오늘의 일지를 작성하세요..."
            minHeight="400px"
          />

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
