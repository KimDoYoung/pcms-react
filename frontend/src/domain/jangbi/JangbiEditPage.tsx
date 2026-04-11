import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Paperclip, X } from 'lucide-react'
import { apiClient } from '@/lib/apiClient'
import Toolbar from '@/shared/components/Toolbar'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import SpecEditor from '@/shared/components/editor/SpecEditor'
import { formatFileSize } from '@/lib/utils'

interface AttachmentDto {
  fileId: number
  orgFileName: string
  fileSize: number
}

interface JangbiDto {
  id: number
  ymd: string
  item: string
  location: string | null
  cost: number | null
  spec: string | null
  lvl: string
  attachments: AttachmentDto[]
}

export default function JangbiEditPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const queryClient = useQueryClient()

  const { data: jangbi, isLoading } = useQuery<JangbiDto>({
    queryKey: ['jangbi', id],
    queryFn: () => apiClient.get<JangbiDto>(`/jangbi/${id}`),
    enabled: !!id,
  })

  const [form, setForm] = useState({
    item: '',
    location: '',
    cost: '',
    lvl: '2',
    spec: '',
  })
  const [attachments, setAttachments] = useState<AttachmentDto[]>([])
  const [deletedIds, setDeletedIds] = useState<number[]>([])
  const [newFiles, setNewFiles] = useState<File[]>([])
  const [saving, setSaving] = useState(false)

  // 데이터 로드 후 폼 세팅
  useEffect(() => {
    if (!jangbi) return
    setForm({
      item: jangbi.item,
      location: jangbi.location ?? '',
      cost: jangbi.cost != null ? String(jangbi.cost) : '',
      lvl: jangbi.lvl,
      spec: jangbi.spec ?? '',
    })
    setAttachments(jangbi.attachments ?? [])
  }, [jangbi])

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  function removeAttachment(fileId: number) {
    setAttachments((prev) => prev.filter((a) => a.fileId !== fileId))
    setDeletedIds((prev) => [...prev, fileId])
  }

  async function handleSubmit() {
    if (!form.item.trim()) { alert('품목을 입력하세요.'); return }
    if (!jangbi) return

    setSaving(true)
    try {
      const payload = {
        id: jangbi.id,
        ymd: jangbi.ymd,
        item: form.item,
        location: form.location || null,
        cost: form.cost ? Number(form.cost) : null,
        spec: form.spec || null,
        lvl: form.lvl,
        deletedAttachmentIds: deletedIds,
      }
      const formData = new FormData()
      formData.append('jangbi', new Blob([JSON.stringify(payload)], { type: 'application/json' }))
      newFiles.forEach((f) => formData.append('files', f))

      await apiClient.put('/jangbi', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      queryClient.invalidateQueries({ queryKey: ['jangbi', id] })
      queryClient.invalidateQueries({ queryKey: ['jangbi-list'] })
      navigate(`/jangbi/${id}`)
    } catch {
      alert('저장 중 오류가 발생했습니다.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete() {
    if (!jangbi) return
    if (!confirm(`"${jangbi.item}"을(를) 삭제하시겠습니까?`)) return
    try {
      await apiClient.delete(`/jangbi/${id}`)
      queryClient.invalidateQueries({ queryKey: ['jangbi-list'] })
      navigate('/jangbi')
    } catch {
      alert('삭제 중 오류가 발생했습니다.')
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Toolbar />
        <p className="text-center py-20 text-gray-400">불러오는 중...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Toolbar />
      <main className="container mx-auto px-6 py-6">
        <h1 className="text-xl font-bold text-gray-800 mb-6">✏️ 장비 수정</h1>

        <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100">

          {/* 기본 정보 */}
          <div className="px-6 py-5 grid grid-cols-1 sm:grid-cols-6 gap-5">

            {/* 구입일 (변경 불가) */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">구입일</label>
              <Input
                type="date"
                value={jangbi ? `${jangbi.ymd.slice(0,4)}-${jangbi.ymd.slice(4,6)}-${jangbi.ymd.slice(6,8)}` : ''}
                disabled
                className="bg-gray-50 text-gray-500 cursor-not-allowed"
              />
            </div>

            {/* 만족도 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">
                만족도 <span className="text-red-500">*</span>
              </label>
              <select
                value={form.lvl}
                onChange={(e) => set('lvl', e.target.value)}
                className="h-9 border border-gray-200 rounded-md px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="3">만족</option>
                <option value="2">보통</option>
                <option value="1">실망</option>
              </select>
            </div>

            {/* 가격 */}
            <div className="flex flex-col gap-1.5 sm:col-span-2">
              <label className="text-sm font-medium text-gray-700">가격 (원)</label>
              <Input
                type="number"
                placeholder="숫자만 입력"
                min={0}
                value={form.cost}
                onChange={(e) => set('cost', e.target.value)}
              />
            </div>

            {/* 품목 */}
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <label className="text-sm font-medium text-gray-700">
                품목 <span className="text-red-500">*</span>
              </label>
              <Input
                placeholder="장비명이나 품목명"
                maxLength={100}
                value={form.item}
                onChange={(e) => set('item', e.target.value)}
              />
            </div>

            {/* 위치 */}
            <div className="flex flex-col gap-1.5 sm:col-span-3">
              <label className="text-sm font-medium text-gray-700">위치</label>
              <Input
                placeholder="예: 거실, 2층 창고"
                maxLength={200}
                value={form.location}
                onChange={(e) => set('location', e.target.value)}
              />
            </div>
          </div>

          {/* 스펙/특징 */}
          <div className="px-6 py-5 flex flex-col gap-2">
            <label className="text-sm font-medium text-gray-700">스펙 / 특징</label>
            <SpecEditor
              value={form.spec}
              onChange={(html) => set('spec', html)}
              placeholder="장비 스펙이나 특징을 입력하세요..."
            />
          </div>

          {/* 첨부파일 */}
          <div className="px-6 py-5 flex flex-col gap-3">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-medium text-gray-700 flex items-center gap-1">
                <Paperclip className="w-4 h-4" /> 첨부파일
              </h3>
              <button
                onClick={() => document.getElementById('jangbi-edit-file')?.click()}
                className="px-3 py-1 text-xs font-medium bg-white border border-gray-300 rounded-md hover:bg-gray-100 text-gray-600 transition-colors shadow-sm"
              >
                + 파일 추가
              </button>
              <input
                id="jangbi-edit-file"
                type="file"
                multiple
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    const filesArray = Array.from(e.target.files)
                    setNewFiles((prev) => [...prev, ...filesArray])
                  }
                  e.target.value = ''
                }}
              />
            </div>

            <div className="flex flex-wrap gap-2 min-h-[40px]">
              {attachments.length === 0 && newFiles.length === 0 && (
                <span className="text-xs text-gray-300 italic py-2">첨부된 파일이 없습니다.</span>
              )}

              {/* 기존 첨부파일 */}
              {attachments.map((att) => (
                <div key={att.fileId} className="flex items-center gap-2 text-sm text-gray-600 bg-white px-2.5 py-1.5 border border-gray-200 rounded-md shadow-sm">
                  <Paperclip className="w-3 h-3 text-gray-400" />
                  <span className="truncate max-w-[160px]" title={att.orgFileName}>{att.orgFileName}</span>
                  <span className="text-xs text-gray-400">({formatFileSize(att.fileSize)})</span>
                  <button
                    type="button"
                    onClick={() => removeAttachment(att.fileId)}
                    className="text-gray-400 hover:text-red-500 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {/* 새 파일 */}
              {newFiles.map((file, idx) => (
                <div key={`new-${file.name}-${idx}`} className="flex items-center gap-2 text-sm text-blue-700 bg-blue-50 px-2.5 py-1.5 border border-blue-200 rounded-md">
                  <Paperclip className="w-3 h-3 text-blue-400" />
                  <span className="truncate max-w-[160px]" title={file.name}>{file.name}</span>
                  <span className="text-[10px] text-blue-500 bg-blue-100 px-1 rounded font-bold">NEW</span>
                  <button
                    type="button"
                    onClick={() => setNewFiles((prev) => prev.filter((_, i) => i !== idx))}
                    className="text-blue-400 hover:text-red-500 p-0.5 rounded transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

        </div>

        {/* 버튼 */}
        <div className="mt-4 flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={handleDelete} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
            삭제
          </Button>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate(`/jangbi/${id}`)}>취소</Button>
            <Button onClick={handleSubmit} disabled={saving || !form.item.trim()}>
              {saving ? '저장 중...' : '저장'}
            </Button>
          </div>
        </div>
      </main>
    </div>
  )
}
